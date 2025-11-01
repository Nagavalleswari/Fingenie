from flask import Blueprint, request, jsonify
import sys
import os

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from utils.jwt_handler import require_auth
from utils.gemini_client import GeminiClient
from models.finance_model import FinanceModel

chat_bp = Blueprint('chat', __name__)

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
            
            # Generate AI response
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

