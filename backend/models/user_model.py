from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import bcrypt

class UserModel:
    """User model for MongoDB operations"""
    
    def __init__(self, db):
        self.collection = db.users
    
    def create_user(self, name, email, password):
        """Create a new user with hashed password"""
        # Check if user already exists - use case-insensitive email check
        existing_user = self.collection.find_one({"email": email.lower()})
        if existing_user:
            return None, "User with this email already exists"
        
        # Double-check with case-insensitive regex (extra safety)
        existing_user_case = self.collection.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        if existing_user_case:
            return None, "User with this email already exists"
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user document
        user_doc = {
            "name": name,
            "email": email.lower().strip(),  # Ensure lowercase and trimmed
            "password_hash": password_hash,
            "created_at": datetime.now().isoformat()
        }
        
        try:
            # Use insert_one with check - MongoDB unique index would prevent duplicates
            result = self.collection.insert_one(user_doc)
            user_doc['_id'] = str(result.inserted_id)
            user_doc.pop('password_hash', None)  # Don't return password hash
            return user_doc, None
        except Exception as e:
            # If duplicate key error (email already exists)
            if 'duplicate key' in str(e).lower() or 'E11000' in str(e):
                return None, "User with this email already exists"
            # Re-raise other errors
            raise
    
    def find_by_email(self, email):
        """Find user by email"""
        user = self.collection.find_one({"email": email})
        if user:
            user['_id'] = str(user['_id'])
        return user
    
    def verify_password(self, email, password):
        """Verify user password"""
        try:
            user = self.collection.find_one({"email": email})
            if not user:
                return False, None
            
            # Ensure password_hash is bytes for bcrypt
            password_hash = user.get('password_hash')
            if not password_hash:
                return False, None
            
            # If it's a string, encode it to bytes
            if isinstance(password_hash, str):
                password_hash = password_hash.encode('utf-8')
            
            # Verify password
            if bcrypt.checkpw(password.encode('utf-8'), password_hash):
                user['_id'] = str(user['_id'])
                user.pop('password_hash', None)
                return True, user
            return False, None
        except Exception as e:
            print(f"Error verifying password: {e}")
            import traceback
            traceback.print_exc()
            return False, None
    
    def find_by_id(self, user_id):
        """Find user by ID"""
        try:
            user = self.collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
                user.pop('password_hash', None)
            return user
        except Exception:
            return None

