from flask import Blueprint, request, jsonify
import sys
import os
import json
import re

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
    
    @chat_bp.route('/enhance_prompt', methods=['POST'])
    @require_auth
    def enhance_prompt():
        """Enhance graph description prompt"""
        try:
            data = request.get_json()
            
            if not data or not data.get('prompt'):
                return jsonify({'error': 'Prompt is required'}), 400
            
            user_prompt = data['prompt']
            
            # Create a specific prompt for enhancement that asks for ONLY the enhanced text
            enhancement_prompt = f"""You are helping to enhance a graph description for a financial visualization tool.

Original description: "{user_prompt}"

Task: Improve and enhance this description to be more specific and detailed for creating a financial chart/graph. 

CRITICAL INSTRUCTIONS:
- Return ONLY the enhanced description text itself
- Do NOT include any greetings, explanations, or additional commentary
- Do NOT include phrases like "Enhanced Graph Description:" or "Here's the enhanced version:"
- Do NOT include bullet points or structured lists - just return a clear, concise description
- Start directly with the enhanced description
- Keep it concise but specific - focus on chart type, what data to show, and key requirements
- The output should be ready to use directly as a graph description

Enhanced description:"""
            
            # Generate response - we don't need financial data context for this
            ai_response = gemini_client.generate_response(enhancement_prompt, user_financial_data=None)
            
            # Clean up the response to extract just the description
            enhanced_text = ai_response.strip()
            
            # Remove common prefixes
            prefixes_to_remove = [
                "Enhanced description:",
                "Here's the enhanced description:",
                "Enhanced Graph Description:",
                "Improved description:",
            ]
            
            for prefix in prefixes_to_remove:
                if enhanced_text.lower().startswith(prefix.lower()):
                    enhanced_text = enhanced_text[len(prefix):].strip()
            
            # Remove quotes if the entire response is wrapped
            if (enhanced_text.startswith('"') and enhanced_text.endswith('"')) or \
               (enhanced_text.startswith("'") and enhanced_text.endswith("'")):
                enhanced_text = enhanced_text[1:-1].strip()
            
            # Remove markdown formatting
            enhanced_text = enhanced_text.replace('**', '').replace('*', '')
            
            # Take only the first meaningful paragraph (before explanatory text)
            lines = enhanced_text.split('\n')
            cleaned_lines = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                # Stop if we hit explanatory text
                if any(phrase in line.lower() for phrase in [
                    'this detailed description',
                    'this enhanced',
                    'this provides',
                    'this specifies',
                    'the chart should',
                    'each slice',
                    'categories and their'
                ]) and len(cleaned_lines) > 0:
                    break
                # Skip bullet points and structured lists
                if line.startswith('-') or line.startswith('*') or line.startswith('•'):
                    # Extract the actual content after the bullet
                    content = line.lstrip('-*• ').strip()
                    if content and len(content) > 20:
                        cleaned_lines.append(content)
                elif line and not line.lower().startswith('categories') and not line.lower().startswith('the categories'):
                    cleaned_lines.append(line)
            
            if cleaned_lines:
                enhanced_text = ' '.join(cleaned_lines).strip()
            
            # Final cleanup - remove quotes
            enhanced_text = re.sub(r'^["\']|["\']$', '', enhanced_text).strip()
            
            return jsonify({
                'message': enhanced_text,
                'original': user_prompt
            }), 200
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    return chat_bp

