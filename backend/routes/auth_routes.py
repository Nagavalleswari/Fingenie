from flask import Blueprint, request, jsonify, make_response
import sys
import os

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from models.user_model import UserModel
from utils.jwt_handler import encode_token

auth_bp = Blueprint('auth', __name__)

def init_auth_routes(db):
    """Initialize auth routes with database connection"""
    user_model = UserModel(db)
    
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
            
            # Create user
            user, error = user_model.create_user(name, email, password)
            
            if error:
                return jsonify({'success': False, 'error': error, 'message': error}), 400
            
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

