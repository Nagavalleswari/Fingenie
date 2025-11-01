from flask import Blueprint, request, jsonify
import sys
import os

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from models.finance_model import FinanceModel
from utils.jwt_handler import require_auth

finance_bp = Blueprint('finance', __name__)

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
                    'is_mock': True  # Flag to indicate this is mock data
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
    
    return finance_bp

