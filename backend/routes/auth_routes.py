from flask import Blueprint, request, jsonify, make_response
import sys
import os

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from models.user_model import UserModel
from models.finance_model import FinanceModel
from utils.jwt_handler import encode_token
from bson import ObjectId
import json

auth_bp = Blueprint('auth', __name__)

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

def init_auth_routes(db):
    """Initialize auth routes with database connection"""
    user_model = UserModel(db)
    finance_model = FinanceModel(db)
    
    @auth_bp.route('/signup', methods=['POST'])
    def signup():
        """User registration endpoint"""
        try:
            data = request.get_json()
            
            # Validate input
            if not data or not data.get('email') or not data.get('password') or not data.get('name'):
                return jsonify({'error': 'Name, email, and password are required'}), 400
            
            name = data['name'].strip()
            email = data['email'].strip().lower()
            password = data['password']
            
            # Basic validation
            if len(password) < 6:
                return jsonify({'error': 'Password must be at least 6 characters'}), 400
            
            # Create user (with duplicate check in create_user method)
            user, error = user_model.create_user(name, email, password)
            
            if error:
                # Check if it's a duplicate error
                if 'already exists' in error.lower():
                    return jsonify({'success': False, 'error': error, 'message': error}), 409  # 409 Conflict
                return jsonify({'success': False, 'error': error, 'message': error}), 400
            
            # Save mock financial data for new user
            try:
                mock_data_file = load_mock_data_from_file()
                if mock_data_file and 'financial_data' in mock_data_file:
                    mock_data = mock_data_file['financial_data']
                    # Convert user_id string to ObjectId
                    user_obj_id = ObjectId(user['_id'])
                    
                    # Build the update document with ALL keys from mock_data
                    # This ensures we save everything: loans, analytics, insights, etc.
                    update_doc = {
                        "user_id": user_obj_id
                    }
                    
                    # Save all keys from financial_data - don't miss any!
                    for key, value in mock_data.items():
                        if value is not None:  # Only save non-None values
                            update_doc[key] = value
                    
                    # Map analytics to financial_health_metrics if analytics exists but financial_health_metrics doesn't
                    # (some code expects financial_health_metrics, but mock_data has analytics)
                    if 'analytics' in mock_data and 'financial_health_metrics' not in mock_data:
                        # Convert analytics structure to financial_health_metrics format
                        analytics = mock_data.get('analytics', {})
                        update_doc['financial_health_metrics'] = {
                            'monthly_trends': analytics.get('monthly_trends', []),
                            'expense_categories': analytics.get('expense_categories', [])
                        }
                    
                    # Also include last_updated from the root level if it exists
                    if 'last_updated' in mock_data_file:
                        update_doc['last_updated'] = mock_data_file.get('last_updated')
                    
                    # Save all mock data
                    finance_model.collection.update_one(
                        {"user_id": user_obj_id},
                        {"$set": update_doc},
                        upsert=True
                    )
                    saved_keys = list(mock_data.keys())
                    print(f"✅ Saved mock financial data for new user: {user['email']}")
                    print(f"   Saved keys: {', '.join(saved_keys)}")
            except Exception as e:
                print(f"⚠️ Warning: Could not save mock data for new user: {e}")
                import traceback
                traceback.print_exc()
                # Don't fail signup if mock data saving fails
            
            # Generate token
            token = encode_token(user['_id'], user['email'])
            
            # Create response
            response = make_response(jsonify({
                'success': True,
                'message': 'User created successfully',
                'user': user,
                'token': token
            }))
            
            # Set token in cookie for web frontend
            response.set_cookie('token', token, httponly=True, samesite='Lax', max_age=86400)
            
            return response, 201
            
        except Exception as e:
            # Handle duplicate key error from MongoDB
            if 'duplicate key' in str(e).lower() or 'E11000' in str(e):
                return jsonify({'success': False, 'error': 'User with this email already exists', 'message': 'User with this email already exists'}), 409
            return jsonify({'success': False, 'error': f'Server error: {str(e)}', 'message': f'Server error: {str(e)}'}), 500
    
    @auth_bp.route('/login', methods=['POST'])
    def login():
        """User login endpoint"""
        try:
            data = request.get_json()
            
            # Validate input
            if not data:
                return jsonify({'success': False, 'error': 'No data provided', 'message': 'No data provided'}), 400
            
            if not data.get('email') or not data.get('password'):
                return jsonify({'success': False, 'error': 'Email and password are required', 'message': 'Email and password are required'}), 400
            
            email = data['email'].strip().lower()
            password = data['password']
            
            # Verify credentials
            is_valid, user = user_model.verify_password(email, password)
            
            if not is_valid:
                return jsonify({'success': False, 'error': 'Invalid email or password', 'message': 'Invalid email or password'}), 401
            
            # Generate token
            token = encode_token(user['_id'], user['email'])
            
            # Create response
            response = make_response(jsonify({
                'success': True,
                'message': 'Login successful',
                'user': user,
                'token': token
            }))
            
            # Set token in cookie for web frontend
            response.set_cookie('token', token, httponly=True, samesite='Lax', max_age=86400)
            
            return response, 200
            
        except Exception as e:
            import traceback
            print(f"Login error: {str(e)}")
            print(traceback.format_exc())
            return jsonify({'success': False, 'error': f'Server error: {str(e)}', 'message': f'Server error: {str(e)}'}), 500
    
    @auth_bp.route('/logout', methods=['POST'])
    def logout():
        """User logout endpoint"""
        response = make_response(jsonify({'message': 'Logged out successfully'}))
        response.set_cookie('token', '', expires=0)
        return response, 200
    
    return auth_bp

