from flask import Blueprint, request, jsonify
import sys
import os
import json
import flask_cors

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
            
            # Add or update data
            result, error = finance_model.add_or_update_data(
                user_id, 
                assets=assets, 
                liabilities=liabilities, 
                goals=goals
            )
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Financial data updated successfully',
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
            if not data:
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
            
            # Merge goals - always prefer mock_data goals unless user has explicitly saved ALL goals
            # If user has fewer goals than mock_data, assume they want to use mock_data as base
            mock_goals_count = len(mock_data.get('goals', []))
            user_goals = data.get('goals', [])
            user_goals_count = len(user_goals) if isinstance(user_goals, list) else 0
            
            if user_goals_count >= mock_goals_count and user_goals_count > 0:
                # User has explicitly saved goals (same or more than mock) - use those
                merged_data['goals'] = user_goals
            else:
                # Use mock goals (either no user goals, or fewer than mock_data)
                merged_data['goals'] = mock_data.get('goals', [])
                merged_data['is_mock'] = True  # Flag that goals are from mock
            
            # Merge other fields (budget, transactions, investments, etc.)
            merged_data['budget'] = data.get('budget') or mock_data.get('budget', {})
            merged_data['transactions'] = data.get('transactions') or mock_data.get('transactions', [])
            merged_data['investments'] = data.get('investments') or mock_data.get('investments', {})
            merged_data['financial_health_metrics'] = data.get('financial_health_metrics') or mock_data.get('financial_health_metrics', {})
            
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
            result, error = finance_model.add_or_update_data(
                user_id,
                assets=mock_data.get('assets', {}),
                liabilities=mock_data.get('liabilities', {}),
                goals=mock_data.get('goals', [])
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
    
    return finance_bp

