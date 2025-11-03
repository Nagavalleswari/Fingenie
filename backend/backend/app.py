from flask import Flask, render_template, send_from_directory, jsonify, make_response
from flask_cors import CORS
from pymongo import MongoClient
from config import Config
from routes.auth_routes import init_auth_routes
from routes.finance_routes import init_finance_routes
from routes.chat_routes import init_chat_routes
import numpy as np
def create_app():
    """Flask application factory"""
    app = Flask(__name__, 
                template_folder='../frontend/templates',
                static_folder='../frontend/static')
    
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['DEBUG'] = Config.DEBUG
    
    # Enable CORS
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    
    # Connect to MongoDB
    try:
        # Configure MongoDB connection with SSL/TLS options
        import ssl
        import certifi
        
        # Parse connection string and add SSL options
        client = MongoClient(
            Config.MONGO_URI,
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=False,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            retryWrites=True
        )
        db = client.fingenie
        # Test connection
        client.admin.command('ping')
        print("✓ Connected to MongoDB successfully")
    except Exception as e:
        print(f"✗ MongoDB connection error: {e}")
        print("\nTrying alternative connection method...")
        try:
            # Fallback: try without explicit SSL options
            client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
            db = client.fingenie
            client.admin.command('ping')
            print("✓ Connected to MongoDB successfully (fallback method)")
        except Exception as e2:
            print(f"✗ MongoDB connection failed: {e2}")
            print("\nTroubleshooting tips:")
            print("1. Check your MONGO_URI in .env file")
            print("2. Ensure your IP is whitelisted in MongoDB Atlas")
            print("3. Verify your MongoDB credentials are correct")
            print("4. Try updating certifi: pip install --upgrade certifi")
            print("5. Check your internet connection")
            raise
    
    # Register blueprints
    auth_bp = init_auth_routes(db)
    finance_bp = init_finance_routes(db)
    chat_bp = init_chat_routes(db)
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    
    # Frontend routes
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/health')
    def health_check():
        """Health check endpoint"""
        try:
            # Test MongoDB connection
            client.admin.command('ping')
            mongo_status = 'connected'
        except Exception as e:
            mongo_status = f'error: {str(e)}'
        
        return jsonify({
            'status': 'ok',
            'mongodb': mongo_status,
            'version': '1.0.0'
        })
    
    @app.route('/login', methods=['GET'])
    def login_page():
        return render_template('login.html')
    
    @app.route('/login', methods=['POST'])
    def login_post():
        """Proxy login request to auth API"""
        from flask import request as req, jsonify, make_response
        from routes.auth_routes import init_auth_routes
        
        # Get auth blueprint
        auth_bp_temp = init_auth_routes(db)
        
        # Manually call the login handler
        try:
            data = req.get_json()
            from models.user_model import UserModel
            from utils.jwt_handler import encode_token
            
            user_model = UserModel(db)
            
            if not data or not data.get('email') or not data.get('password'):
                return jsonify({'success': False, 'message': 'Email and password are required'}), 400
            
            email = data['email'].strip().lower()
            password = data['password']
            
            is_valid, user = user_model.verify_password(email, password)
            
            if not is_valid:
                return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
            
            token = encode_token(user['_id'], user['email'])
            response = make_response(jsonify({
                'success': True,
                'message': 'Login successful',
                'user': user,
                'token': token
            }))
            response.set_cookie('token', token, httponly=True, samesite='Lax', max_age=86400)
            return response, 200
        except Exception as e:
            return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500
    
    @app.route('/signup', methods=['GET'])
    def signup_page():
        return render_template('signup.html')
    
    # REMOVED: Duplicate signup route - using /api/auth/signup from blueprint instead
    # This was causing duplicate account creation
    
    @app.route('/dashboard')
    def dashboard_page():
        return render_template('dashboard.html')
    
    @app.route('/chat')
    def chat_page():
        return render_template('chat.html')

    @app.route('/about')
    def about_page():
        return render_template('about.html')

    @app.route('/logout', methods=['POST'])
    def logout():
        """Logout endpoint"""
        response = make_response(jsonify({'success': True, 'message': 'Logged out successfully'}))
        response.set_cookie('token', '', expires=0)
        return response, 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)

