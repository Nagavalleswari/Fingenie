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
    
    @auth_bp.route('/profile', methods=['GET'])
    def get_profile():
        """Get user profile"""
        try:
            from utils.jwt_handler import decode_token
            
            # Get token from cookie or Authorization header
            token = request.cookies.get('token') or (request.headers.get('Authorization') and request.headers.get('Authorization').replace('Bearer ', ''))
            
            if not token:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Decode token
            payload, error = decode_token(token)
            if error or not payload:
                return jsonify({'error': error or 'Invalid token'}), 401
            
            user_id = payload.get('user_id')
            if not user_id:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Get user
            user = user_model.find_by_id(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({
                'success': True,
                'user': user
            }), 200
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @auth_bp.route('/update_profile', methods=['POST'])
    def update_profile():
        """Update user profile"""
        try:
            from utils.jwt_handler import decode_token
            
            # Get token from cookie or Authorization header
            token = request.cookies.get('token') or (request.headers.get('Authorization') and request.headers.get('Authorization').replace('Bearer ', ''))
            
            if not token:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Decode token
            payload, token_error = decode_token(token)
            if token_error or not payload:
                return jsonify({'error': token_error or 'Invalid token'}), 401
            
            user_id = payload.get('user_id')
            if not user_id:
                return jsonify({'error': 'Invalid token'}), 401
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Update profile
            updated_user, error = user_model.update_profile(
                user_id,
                name=data.get('name'),
                email=data.get('email'),
                phone=data.get('phone'),
                date_of_birth=data.get('date_of_birth')
            )
            
            if error:
                return jsonify({'error': error}), 400
            
            # Generate new token with updated email if email changed
            new_token = None
            if data.get('email') and updated_user and updated_user.get('email') != payload.get('email'):
                new_token = encode_token(updated_user['_id'], updated_user['email'])
            
            response_data = {
                'success': True,
                'message': 'Profile updated successfully',
                'user': updated_user
            }
            
            if new_token:
                response_data['token'] = new_token
                response = make_response(jsonify(response_data))
                response.set_cookie('token', new_token, httponly=True, samesite='Lax', max_age=86400)
                return response, 200
            
            return jsonify(response_data), 200
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @auth_bp.route('/change_password', methods=['POST'])
    def change_password():
        """Change user password"""
        try:
            from utils.jwt_handler import decode_token
            
            # Get token from cookie or Authorization header
            token = request.cookies.get('token') or (request.headers.get('Authorization') and request.headers.get('Authorization').replace('Bearer ', ''))
            
            if not token:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Decode token
            payload, error = decode_token(token)
            if error or not payload:
                return jsonify({'error': error or 'Invalid token'}), 401
            
            user_id = payload.get('user_id')
            if not user_id:
                return jsonify({'error': 'Invalid token'}), 401
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')
            
            if not current_password or not new_password or not confirm_password:
                return jsonify({'error': 'All password fields are required'}), 400
            
            if new_password != confirm_password:
                return jsonify({'error': 'New passwords do not match'}), 400
            
            if len(new_password) < 6:
                return jsonify({'error': 'Password must be at least 6 characters'}), 400
            
            # Change password
            success, error = user_model.change_password(user_id, current_password, new_password)
            
            if not success:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'success': True,
                'message': 'Password changed successfully'
            }), 200
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @auth_bp.route('/update_2fa', methods=['POST'])
    def update_2fa():
        """Update two-factor authentication setting"""
        try:
            from utils.jwt_handler import decode_token
            
            # Get token from cookie or Authorization header
            token = request.cookies.get('token') or (request.headers.get('Authorization') and request.headers.get('Authorization').replace('Bearer ', ''))
            
            if not token:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Decode token
            payload, error = decode_token(token)
            if error or not payload:
                return jsonify({'error': error or 'Invalid token'}), 401
            
            user_id = payload.get('user_id')
            if not user_id:
                return jsonify({'error': 'Invalid token'}), 401
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            enabled = data.get('enabled', False)
            
            # Update 2FA setting
            success, error = user_model.update_2fa(user_id, enabled)
            
            if not success:
                return jsonify({'error': error}), 400
            
            return jsonify({
                'success': True,
                'message': 'Two-factor authentication updated successfully',
                'two_factor_enabled': enabled
            }), 200
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @auth_bp.route('/profile/stats', methods=['GET'])
    def get_profile_stats():
        """Get user profile statistics"""
        try:
            from utils.jwt_handler import decode_token
            
            # Get token from cookie or Authorization header
            token = request.cookies.get('token') or (request.headers.get('Authorization') and request.headers.get('Authorization').replace('Bearer ', ''))
            
            if not token:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Decode token
            payload, error = decode_token(token)
            if error or not payload:
                return jsonify({'error': error or 'Invalid token'}), 401
            
            user_id = payload.get('user_id')
            if not user_id:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Get user stats
            user_stats = user_model.get_user_stats(user_id)
            if not user_stats:
                return jsonify({'error': 'Could not retrieve user stats'}), 400
            
            # Get financial data stats
            user_obj_id = ObjectId(user_id)
            financial_data = finance_model.collection.find_one({"user_id": user_obj_id})
            
            # Count data updates (times financial data was updated)
            data_updates = 0
            if financial_data and financial_data.get('last_updated'):
                # This is a simple count - could be enhanced
                data_updates = 1  # Placeholder - could track update history
            
            # Get goals count
            goals_count = 0
            if financial_data and financial_data.get('goals'):
                goals_count = len(financial_data.get('goals', []))
            
            # Get reports count from financial_data collection
            reports_count = 0
            if financial_data:
                reports = financial_data.get('reports', [])
                if isinstance(reports, list):
                    reports_count = len(reports)
                elif reports:
                    # Handle case where reports might be stored differently
                    reports_count = 1
            
            return jsonify({
                'success': True,
                'stats': {
                    'days_active': user_stats['days_active'],
                    'data_updates': data_updates,
                    'goals_set': goals_count,
                    'reports_generated': reports_count
                }
            }), 200
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    return auth_bp

