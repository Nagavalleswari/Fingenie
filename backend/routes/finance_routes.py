from flask import Blueprint, request, jsonify
import sys
import os
import json
import flask_cors
from datetime import datetime

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from models.finance_model import FinanceModel
from utils.jwt_handler import require_auth
from utils.loan_calculator import (
    calculate_emi, 
    calculate_prepayment_savings, 
    compare_loans,
    calculate_affordability
)
from utils.gemini_client import GeminiClient
import uuid

finance_bp = Blueprint('finance', __name__)

# Load mock data from JSON file
def load_mock_data_from_file():
    """Load mock data from JSON file"""
    try:
        mock_data_path = os.path.join(parent_dir, 'mock_data.json')
        with open(mock_data_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading mock data: {e}")
        return None

def init_finance_routes(db):
    """Initialize finance routes with database connection"""
    finance_model = FinanceModel(db)
    
    @finance_bp.route('/add_data', methods=['POST'])
    @require_auth
    def add_data():
        """Add or update user financial data"""
        try:
            user_id = request.user_id
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            assets = data.get('assets')
            liabilities = data.get('liabilities')
            goals = data.get('goals')
            
            # Validate at least one field is provided
            if not any([assets, liabilities, goals]):
                return jsonify({'error': 'At least one field (assets, liabilities, or goals) must be provided'}), 400
            
            # IMPORTANT: Only prevent saving if goals are provided but fewer than 5
            # If user has 5+ goals, allow saving (user is adding their own goals)
            if goals is not None:
                goals_list = goals if isinstance(goals, list) else []
                mock_data_file = load_mock_data_from_file()
                mock_goals_count = len(mock_data_file.get('financial_data', {}).get('goals', [])) if mock_data_file else 5
                
                # Only prevent saving if user has fewer than 5 goals (partial set)
                # If user has 5 or more goals, allow saving (they're managing their own goals)
                if len(goals_list) > 0 and len(goals_list) < mock_goals_count:
                    print(f"⚠️ Not saving partial goals ({len(goals_list)} goals). User needs at least {mock_goals_count} goals to override mock_data, or can add more.")
                    goals = None  # Don't save partial goals - this will trigger removal in finance_model
                elif len(goals_list) >= mock_goals_count:
                    print(f"✅ Saving {len(goals_list)} goals (user has {mock_goals_count}+ goals)")
            
            # Add or update data (finance_model will also validate and prevent partial goals)
            result, error = finance_model.add_or_update_data(
                user_id, 
                assets=assets, 
                liabilities=liabilities, 
                goals=goals  # Will be None if partial set, which triggers removal
            )
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Financial data updated successfully',
                'data': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/update_budget', methods=['POST'])
    @require_auth
    def update_budget():
        """Update user budget data"""
        try:
            user_id = request.user_id
            data = request.get_json()
            
            if not data or 'budget' not in data:
                return jsonify({'error': 'Budget data is required'}), 400
            
            budget = data.get('budget')
            
            # Validate budget structure
            if not isinstance(budget, dict):
                return jsonify({'error': 'Budget must be an object'}), 400
            
            # Update budget
            result, error = finance_model.update_budget(user_id, budget)
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Budget updated successfully',
                'data': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/update_investments', methods=['POST'])
    @require_auth
    def update_investments():
        """Update user investments data"""
        try:
            user_id = request.user_id
            data = request.get_json()
            
            if not data or 'investments' not in data:
                return jsonify({'error': 'Investments data is required'}), 400
            
            investments = data.get('investments')
            
            # Validate investments structure - can be array or object
            if not isinstance(investments, (list, dict)):
                return jsonify({'error': 'Investments must be an array or object'}), 400
            
            # Update investments
            result, error = finance_model.update_investments(user_id, investments)
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Investments updated successfully',
                'data': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/get_data', methods=['GET'])
    @require_auth
    def get_data():
        """Get user financial data"""
        try:
            user_id = request.user_id
            
            data, error = finance_model.get_data(user_id)
            
            if error:
                return jsonify({'error': error}), 400
            
            # Always load mock data first
            mock_data_file = load_mock_data_from_file()
            mock_data = mock_data_file.get('financial_data', {}) if mock_data_file else {}
            
            # If user has NO data in database, return mock data only
            # Also check if data exists but only has empty/invalid goals - treat as no data
            has_valid_data = data and (
                data.get('assets') or 
                data.get('liabilities') or 
                (data.get('goals') and isinstance(data.get('goals'), list) and len(data.get('goals', [])) == 5)
            )
            
            if not has_valid_data:
                # Clean up any partial goals if they exist
                if data and data.get('goals'):
                    goals_count = len(data.get('goals', [])) if isinstance(data.get('goals'), list) else 0
                    if goals_count > 0 and goals_count < 5:
                        print(f"🧹 Cleaning up partial goals ({goals_count} goals) found in new account data for user {user_id}")
                        finance_model.remove_goals(user_id)
                
                if mock_data:
                    mock_data['is_mock'] = True
                    return jsonify({
                        'message': 'No financial data found. Showing mock data for demo.',
                        'data': mock_data
                    }), 200
                else:
                    return jsonify({
                        'message': 'No financial data found. Please add your financial information.',
                        'data': {}
                    }), 200
            
            # STEP 1: Clean up partial goals FIRST, before any processing
            # This ensures ALL accounts get cleaned up regardless of other data
            if data and data.get('goals'):
                user_goals_list = data.get('goals', [])
                user_goals_count_before = len(user_goals_list) if isinstance(user_goals_list, list) else 0
                
                # If partial goals exist (< 5), remove them immediately
                if user_goals_count_before > 0 and user_goals_count_before < 5:
                    print(f"🧹 STEP 1: Removing partial goals ({user_goals_count_before} goals) from MongoDB for user {user_id}")
                    finance_model.remove_goals(user_id)
                    # Remove goals from data object so they're not used below
                    data.pop('goals', None)
                    print(f"✅ Partial goals removed from database for user {user_id}")
            
            # If user has data, merge with mock data (user data takes precedence, but fill missing from mock)
            merged_data = {}
            
            # Merge assets (user data overrides mock)
            if data.get('assets'):
                merged_data['assets'] = {**mock_data.get('assets', {}), **data.get('assets', {})}
            else:
                merged_data['assets'] = mock_data.get('assets', {})
            
            # Merge liabilities (user data overrides mock)
            if data.get('liabilities'):
                merged_data['liabilities'] = {**mock_data.get('liabilities', {}), **data.get('liabilities', {})}
            else:
                merged_data['liabilities'] = mock_data.get('liabilities', {})
            
            # STEP 2: Handle goals - ALWAYS use mock_data goals unless user has ALL 5 goals
            # This ensures users always see the complete 5 goals from mock_data.json
            mock_goals_count = len(mock_data.get('goals', []))
            user_goals = data.get('goals', [])  # This should be None or empty after cleanup
            user_goals_count = len(user_goals) if isinstance(user_goals, list) else 0
            
            # Only use user goals if they have ALL 5 goals (complete set)
            # Otherwise, always use mock_data goals to ensure consistency
            if user_goals_count == mock_goals_count and user_goals_count == 5:
                # User has explicitly saved all 5 goals - use those
                merged_data['goals'] = user_goals
                print(f"✅ Using user's complete goal set (5 goals) for user {user_id}")
            else:
                # Always use mock goals (either no user goals, or incomplete set)
                # This ensures users always see all 5 goals from mock_data.json
                merged_data['goals'] = mock_data.get('goals', [])
                merged_data['is_mock'] = True  # Flag that goals are from mock
                print(f"📊 Using mock_data goals ({len(mock_data.get('goals', []))} goals) for user {user_id} (user had {user_goals_count} goals after cleanup)")
            
            # Merge other fields (budget, transactions, investments, loans, analytics, insights, etc.)
            # Save ALL fields from mock_data that aren't already handled above
            fields_to_merge = ['budget', 'transactions', 'investments', 'loans', 'analytics', 'insights']
            for field in fields_to_merge:
                merged_data[field] = data.get(field) or mock_data.get(field, [] if field in ['transactions', 'loans', 'insights'] else {})
            
            # Handle financial_health_metrics - check if it exists directly, or derive from analytics
            if data.get('financial_health_metrics'):
                merged_data['financial_health_metrics'] = data.get('financial_health_metrics')
            elif mock_data.get('financial_health_metrics'):
                merged_data['financial_health_metrics'] = mock_data.get('financial_health_metrics')
            elif merged_data.get('analytics'):
                # Map analytics to financial_health_metrics format for compatibility
                analytics = merged_data.get('analytics', {})
                merged_data['financial_health_metrics'] = {
                    'monthly_trends': analytics.get('monthly_trends', []),
                    'expense_categories': analytics.get('expense_categories', [])
                }
            
            # Preserve user_id and _id from database
            if data.get('_id'):
                merged_data['_id'] = data.get('_id')
            if data.get('user_id'):
                merged_data['user_id'] = data.get('user_id')
            
            print(f"📊 User {user_id} - Merged data (User goals: {len(data.get('goals', []))}, Mock goals: {len(mock_data.get('goals', []))}, Final: {len(merged_data.get('goals', []))})")
            
            return jsonify({
                'message': 'Financial data retrieved successfully',
                'data': merged_data
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/load_mock_data', methods=['POST'])
    @require_auth
    def load_mock_data():
        """Load mock financial data from mock_data.json (for demo/testing purposes)"""
        try:
            user_id = request.user_id
            
            # Load mock data from JSON file - NO HARDCODED DATA
            mock_data_file = load_mock_data_from_file()
            if not mock_data_file or 'financial_data' not in mock_data_file:
                return jsonify({'error': 'Mock data file not found or invalid'}), 400
            
            mock_data = mock_data_file['financial_data']
            
            # Add or update data with mock values from JSON file
            # IMPORTANT: Only save all 5 goals from mock_data, never partial sets
            mock_goals = mock_data.get('goals', [])
            mock_goals_count = len(mock_goals)
            
            # Only save goals if we have the complete set (all 5 goals)
            goals_to_save = mock_goals if mock_goals_count == 5 else None
            
            result, error = finance_model.add_or_update_data(
                user_id,
                assets=mock_data.get('assets', {}),
                liabilities=mock_data.get('liabilities', {}),
                goals=goals_to_save  # Only save if we have all 5 goals
            )
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Mock financial data loaded successfully from mock_data.json',
                'data': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/calculate_emi', methods=['POST'])
    @require_auth
    def calculate_emi_endpoint():
        """Calculate EMI for a loan"""
        try:
            data = request.get_json()
            principal = float(data.get('principal', 0))
            annual_rate = float(data.get('annual_rate', 0))
            tenure_months = int(data.get('tenure_months', 0))
            
            result = calculate_emi(principal, annual_rate, tenure_months)
            
            if 'error' in result:
                return jsonify({'error': result['error']}), 400
            
            return jsonify({
                'message': 'EMI calculated successfully',
                'data': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/calculate_prepayment', methods=['POST'])
    @require_auth
    def calculate_prepayment_endpoint():
        """Calculate prepayment savings"""
        try:
            data = request.get_json()
            principal = float(data.get('principal', 0))
            annual_rate = float(data.get('annual_rate', 0))
            tenure_months = int(data.get('tenure_months', 0))
            prepayment_amount = float(data.get('prepayment_amount', 0))
            prepayment_month = int(data.get('prepayment_month', 0))
            
            result = calculate_prepayment_savings(
                principal, annual_rate, tenure_months, 
                prepayment_amount, prepayment_month
            )
            
            if 'error' in result:
                return jsonify({'error': result['error']}), 400
            
            return jsonify({
                'message': 'Prepayment savings calculated successfully',
                'data': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/compare_loans', methods=['POST'])
    @require_auth
    def compare_loans_endpoint():
        """Compare multiple loan options"""
        try:
            data = request.get_json()
            loans = data.get('loans', [])
            
            if not loans:
                return jsonify({'error': 'No loans provided for comparison'}), 400
            
            result = compare_loans(loans)
            
            return jsonify({
                'message': 'Loans compared successfully',
                'data': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/calculate_affordability', methods=['POST'])
    @require_auth
    def calculate_affordability_endpoint():
        """Calculate loan affordability"""
        try:
            data = request.get_json()
            monthly_income = float(data.get('monthly_income', 0))
            monthly_expenses = float(data.get('monthly_expenses', 0))
            emi_ratio = float(data.get('emi_to_income_ratio', 0.4))
            
            result = calculate_affordability(monthly_income, monthly_expenses, emi_ratio)
            
            if 'error' in result:
                return jsonify({'error': result['error']}), 400
            
            return jsonify({
                'message': 'Affordability calculated successfully',
                'data': result
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/get_loan_presets', methods=['GET'])
    @require_auth
    def get_loan_presets():
        """Get loan calculator presets"""
        try:
            mock_data_file = load_mock_data_from_file()
            if mock_data_file and 'loan_calculators' in mock_data_file:
                presets = mock_data_file['loan_calculators'].get('presets', [])
            else:
                presets = []
            
            return jsonify({
                'message': 'Loan presets retrieved successfully',
                'data': presets
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/get_all_mock_data', methods=['GET'])
    @require_auth
    def get_all_mock_data():
        """Get all mock data for testing/demo"""
        try:
            mock_data_file = load_mock_data_from_file()
            if mock_data_file:
                return jsonify({
                    'message': 'Mock data retrieved successfully',
                    'data': mock_data_file
                }), 200
            else:
                return jsonify({'error': 'Mock data not available'}), 404
                
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/generate_graph', methods=['POST'])
    @require_auth
    def generate_graph():
        """Generate a graph configuration using Gemini AI"""
        try:
            user_id = request.user_id
            data = request.get_json()
            
            if not data or not data.get('description'):
                return jsonify({'error': 'Graph description is required'}), 400
            
            graph_description = data['description']
            
            # Get user's financial data for context - MUST have saved data
            financial_data, _ = finance_model.get_data(user_id)
            
            # Check if user has actual financial data (not empty)
            has_actual_data = False
            if financial_data:
                # Check if there's meaningful data (not just empty objects)
                has_assets = financial_data.get('assets') and any(v for v in financial_data.get('assets', {}).values() if isinstance(v, (int, float)) and v > 0)
                has_liabilities = financial_data.get('liabilities') and any(v for v in financial_data.get('liabilities', {}).values() if isinstance(v, (int, float)) and v > 0)
                has_goals = financial_data.get('goals') and len(financial_data.get('goals', [])) > 0
                budget = financial_data.get('budget', {}) or {}
                has_budget = isinstance(budget, dict) and (budget.get('monthly_income') or budget.get('categories'))
                has_transactions = financial_data.get('transactions') and len(financial_data.get('transactions', [])) > 0
                has_investments = financial_data.get('investments')
                
                has_actual_data = has_assets or has_liabilities or has_goals or has_budget or has_transactions or has_investments
            
            if not has_actual_data:
                return jsonify({
                    'error': 'No financial data found. Please add your financial information before creating graphs. The data will be used to generate meaningful visualizations.'
                }), 400
            
            # Use Gemini to generate chart configuration
            gemini_client = GeminiClient()
            
            # Build prompt for Gemini to generate Chart.js configuration
            financial_context = gemini_client._build_financial_context(financial_data) if financial_data else ""
            
            prompt = f"""{financial_context}

You are a chart generation assistant. The user wants to create a chart based on this description: "{graph_description}"

Based on the financial data provided above, generate a Chart.js configuration JSON object. The JSON should follow this exact structure:

{{
    "type": "line|bar|pie|doughnut|radar|polarArea",
    "title": "Chart Title",
    "labels": ["Label1", "Label2", ...],
    "datasets": [
        {{
            "label": "Dataset Label",
            "data": [value1, value2, ...],
            "backgroundColor": ["#color1", "#color2", ...],
            "borderColor": "#color",
            "borderWidth": 2
        }}
    ],
    "options": {{
        "responsive": true,
        "plugins": {{
            "legend": {{ "position": "bottom" }},
            "title": {{ "display": true, "text": "Chart Title" }}
        }},
        "scales": {{
            "y": {{
                "beginAtZero": true,
                "ticks": {{
                    "callback": "function(value) {{ return '₹' + value.toLocaleString(); }}"
                }}
            }}
        }}
    }}
}}

IMPORTANT:
- Use ONLY the financial data provided above. DO NOT create fake or sample data. Only use the actual data provided.
- All monetary values should be in Indian Rupees (₹).
- If specific data is not available in the context, indicate that in the chart title or use available related data.
- For pie and doughnut charts: Ensure each category has a UNIQUE color. Use a distinct color palette with no duplicate colors.
- Double-check all values match the financial data exactly. Calculate percentages correctly for pie charts.
- Verify that labels correspond to actual data values from the financial context.
- Return ONLY valid JSON, no explanation text before or after.
- Use appropriate chart type based on the description (line for trends, bar for comparisons, pie/doughnut for distributions, etc.).
- Generate realistic data based on the user's financial context.
- Use attractive color schemes with unique colors for each category in pie/doughnut charts.

Return ONLY the JSON configuration. Do not include any explanation, markdown code blocks, or additional text. Just return the raw JSON object starting with {{ and ending with }}:"""
            
            # Generate response from Gemini
            response_text = gemini_client.generate_response(prompt, user_financial_data=financial_data)
            
            # Try to extract JSON from response (Gemini might add explanation text)
            try:
                # Try to find JSON in the response - look for JSON that might be wrapped in code blocks
                import re
                # First try to extract from markdown code blocks
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
                if not json_match:
                    # If no code block, try to find JSON object directly
                    json_match = re.search(r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', response_text, re.DOTALL)
                
                if json_match:
                    json_str = json_match.group(1) if json_match.lastindex else json_match.group(0)
                    chart_config = json.loads(json_str)
                else:
                    # If no JSON found, create a default chart
                    chart_config = {
                        "type": "bar",
                        "title": graph_description,
                        "labels": ["Sample"],
                        "datasets": [{
                            "label": "Data",
                            "data": [0],
                            "backgroundColor": ["#3b82f6"],
                            "borderColor": "#3b82f6",
                            "borderWidth": 2
                        }],
                        "options": {
                            "responsive": True,
                            "plugins": {
                                "legend": {"position": "bottom"},
                                "title": {"display": True, "text": graph_description}
                            }
                        }
                    }
            except json.JSONDecodeError:
                # Fallback: create a simple chart configuration
                chart_config = {
                    "type": "bar",
                    "title": graph_description,
                    "labels": ["Sample"],
                    "datasets": [{
                        "label": "Data",
                        "data": [0],
                        "backgroundColor": ["#3b82f6"],
                        "borderColor": "#3b82f6",
                        "borderWidth": 2
                    }],
                    "options": {
                        "responsive": True,
                        "plugins": {
                            "legend": {"position": "bottom"},
                            "title": {"display": True, "text": graph_description}
                        }
                    }
                }
            
            return jsonify({
                'message': 'Graph configuration generated successfully',
                'data': chart_config
            }), 200
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/save_custom_graph', methods=['POST'])
    @require_auth
    def save_custom_graph():
        """Save a custom graph configuration"""
        try:
            user_id = request.user_id
            data = request.get_json()
            
            if not data or not data.get('graph_config'):
                return jsonify({'error': 'Graph configuration is required'}), 400
            
            graph_config = data['graph_config']
            graph_id = data.get('id', str(uuid.uuid4()))
            graph_title = data.get('title', graph_config.get('title', 'Custom Graph'))
            
            graph_data = {
                'id': graph_id,
                'title': graph_title,
                'description': data.get('description', ''),
                'config': graph_config,
                'created_at': datetime.now().isoformat()
            }
            
            result, error = finance_model.save_custom_graph(user_id, graph_data)
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Custom graph saved successfully',
                'data': {'id': graph_id}
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/get_custom_graphs', methods=['GET'])
    @require_auth
    def get_custom_graphs():
        """Get all custom graphs for the user"""
        try:
            user_id = request.user_id
            
            graphs, error = finance_model.get_custom_graphs(user_id)
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Custom graphs retrieved successfully',
                'data': graphs
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/delete_custom_graph', methods=['POST'])
    @require_auth
    def delete_custom_graph():
        """Delete a custom graph"""
        try:
            user_id = request.user_id
            data = request.get_json()
            
            if not data or not data.get('graph_id'):
                return jsonify({'error': 'Graph ID is required'}), 400
            
            graph_id = data['graph_id']
            
            result, error = finance_model.delete_custom_graph(user_id, graph_id)
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Custom graph deleted successfully'
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    return finance_bp

