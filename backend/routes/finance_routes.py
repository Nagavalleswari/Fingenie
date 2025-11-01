from flask import Blueprint, request, jsonify
import sys
import os
import json

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

# Load mock data
def load_mock_data():
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
            
            # If no data exists, return mock data for demo purposes
            if not data:
                mock_data_file = load_mock_data()
                if mock_data_file and 'financial_data' in mock_data_file:
                    mock_data = mock_data_file['financial_data']
                    mock_data['is_mock'] = True  # Flag to indicate this is mock data
                    return jsonify({
                        'message': 'No financial data found. Showing mock data for demo.',
                        'data': mock_data
                    }), 200
                else:
                    # Fallback to inline mock data
                    mock_data = {
                        'assets': {
                            'savings': 45000,
                            'mutual_funds': 120000,
                            'stocks': 50000
                        },
                        'liabilities': {
                            'loan': 30000,
                            'credit_card_due': 5000
                        },
                        'goals': [
                            {
                                'name': 'Buy Car',
                                'target': 500000,
                                'year': 2027
                            },
                            {
                                'name': 'Emergency Fund',
                                'target': 100000,
                                'year': 2026
                            }
                        ],
                        'last_updated': None,
                        'is_mock': True
                    }
                    return jsonify({
                        'message': 'No financial data found. Showing mock data for demo.',
                        'data': mock_data
                    }), 200
            
            return jsonify({
                'message': 'Financial data retrieved successfully',
                'data': data
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @finance_bp.route('/load_mock_data', methods=['POST'])
    @require_auth
    def load_mock_data():
        """Load mock financial data (for demo/testing purposes)"""
        try:
            user_id = request.user_id
            
            # Mock financial data
            mock_assets = {
                'savings': 45000,
                'mutual_funds': 120000,
                'stocks': 50000
            }
            
            mock_liabilities = {
                'loan': 30000,
                'credit_card_due': 5000
            }
            
            mock_goals = [
                {
                    'name': 'Buy Car',
                    'target': 500000,
                    'year': 2027
                },
                {
                    'name': 'Emergency Fund',
                    'target': 100000,
                    'year': 2026
                },
                {
                    'name': 'Vacation',
                    'target': 50000,
                    'year': 2025
                }
            ]
            
            # Add or update data with mock values
            result, error = finance_model.add_or_update_data(
                user_id,
                assets=mock_assets,
                liabilities=mock_liabilities,
                goals=mock_goals
            )
            
            if error:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'message': 'Mock financial data loaded successfully',
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
            mock_data_file = load_mock_data()
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
            mock_data_file = load_mock_data()
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

