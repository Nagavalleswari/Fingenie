from flask import Blueprint, request, jsonify
import sys
import os
import json

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from utils.jwt_handler import require_auth
from utils.gemini_client import GeminiClient
from models.finance_model import FinanceModel

chat_bp = Blueprint('chat', __name__)

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

def init_chat_routes(db):
    """Initialize chat routes with database connection"""
    gemini_client = GeminiClient()
    finance_model = FinanceModel(db)
    
    @chat_bp.route('/chat', methods=['POST'])
    @require_auth
    def chat():
        """Chat endpoint with AI assistant"""
        try:
            user_id = request.user_id
            data = request.get_json()
            
            if not data or not data.get('message'):
                return jsonify({'error': 'Message is required'}), 400
            
            user_message = data['message']
            
            # Get user's financial data for context
            financial_data, _ = finance_model.get_data(user_id)
            
            # If no data exists, use mock data for demo purposes (same as finance routes)
            if not financial_data:
                mock_data_file = load_mock_data_from_file()
                if mock_data_file and 'financial_data' in mock_data_file:
                    financial_data = mock_data_file['financial_data']
                    financial_data['is_mock'] = True  # Flag to indicate this is mock data
                else:
                    # Fallback to empty data
                    financial_data = {}
            
            # Generate AI response with complete financial data
            ai_response = gemini_client.generate_response(
                user_message, 
                user_financial_data=financial_data
            )
            
            return jsonify({
                'message': ai_response,
                'user_message': user_message
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    return chat_bp

