import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from config import Config

def encode_token(user_id, email):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM)
    return token

def decode_token(token):
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=[Config.JWT_ALGORITHM])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token has expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"

def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Token missing'}), 401
        
        # Also check for token in cookies (for web frontend)
        if not token:
            token = request.cookies.get('token')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        payload, error = decode_token(token)
        if error:
            return jsonify({'error': error}), 401
        
        # Add user info to request context
        request.user_id = payload['user_id']
        request.user_email = payload['email']
        
        return f(*args, **kwargs)
    
    return decorated

