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
    
    def update_profile(self, user_id, name=None, email=None, phone=None, date_of_birth=None):
        """Update user profile information"""
        try:
            user_obj_id = ObjectId(user_id)
            update_doc = {}
            
            if name is not None:
                update_doc['name'] = name.strip()
            if email is not None:
                # Check if email already exists for another user
                existing_user = self.collection.find_one({"email": email.lower().strip(), "_id": {"$ne": user_obj_id}})
                if existing_user:
                    return None, "Email already in use by another account"
                update_doc['email'] = email.lower().strip()
            if phone is not None:
                update_doc['phone'] = phone.strip()
            if date_of_birth is not None:
                update_doc['date_of_birth'] = date_of_birth
            
            if not update_doc:
                return None, "No fields to update"
            
            update_doc['updated_at'] = datetime.now().isoformat()
            
            result = self.collection.update_one(
                {"_id": user_obj_id},
                {"$set": update_doc}
            )
            
            if result.matched_count == 0:
                return None, "User not found"
            
            # Return updated user
            user = self.find_by_id(user_id)
            return user, None
            
        except Exception as e:
            return None, f"Error updating profile: {str(e)}"
    
    def change_password(self, user_id, current_password, new_password):
        """Change user password"""
        try:
            if len(new_password) < 6:
                return False, "Password must be at least 6 characters"
            
            user = self.collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return False, "User not found"
            
            # Verify current password
            password_hash = user.get('password_hash')
            if not password_hash:
                return False, "Password verification failed"
            
            if isinstance(password_hash, str):
                password_hash = password_hash.encode('utf-8')
            
            if not bcrypt.checkpw(current_password.encode('utf-8'), password_hash):
                return False, "Current password is incorrect"
            
            # Hash new password
            new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update password
            result = self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "password_hash": new_password_hash,
                    "updated_at": datetime.now().isoformat()
                }}
            )
            
            if result.matched_count == 0:
                return False, "User not found"
            
            return True, None
            
        except Exception as e:
            return False, f"Error changing password: {str(e)}"
    
    def update_2fa(self, user_id, enabled, totp_secret=None):
        """Update two-factor authentication setting"""
        try:
            user_obj_id = ObjectId(user_id)
            
            update_doc = {
                "two_factor_enabled": enabled,
                "updated_at": datetime.now().isoformat()
            }
            
            if totp_secret:
                update_doc["totp_secret"] = totp_secret
            
            if not enabled:
                # Clear TOTP secret if disabling 2FA
                update_doc["totp_secret"] = None
            
            result = self.collection.update_one(
                {"_id": user_obj_id},
                {"$set": update_doc}
            )
            
            if result.matched_count == 0:
                return False, "User not found"
            
            return True, None
            
        except Exception as e:
            return False, f"Error updating 2FA: {str(e)}"
    
    def get_totp_secret(self, user_id):
        """Get TOTP secret for a user"""
        try:
            user = self.find_by_id(user_id)
            if user:
                return user.get('totp_secret')
            return None
        except Exception:
            return None
    
    def verify_totp(self, user_id, totp_code):
        """Verify TOTP code for a user"""
        try:
            import pyotp
            totp_secret = self.get_totp_secret(user_id)
            if not totp_secret:
                return False
            
            totp = pyotp.TOTP(totp_secret)
            return totp.verify(totp_code, valid_window=1)  # Allow 1 time step tolerance
            
        except Exception as e:
            print(f"Error verifying TOTP: {e}")
            return False
    
    def get_user_stats(self, user_id):
        """Get user account statistics"""
        try:
            user = self.find_by_id(user_id)
            if not user:
                return None
            
            # Calculate days active
            created_at = user.get('created_at')
            days_active = 0
            if created_at:
                try:
                    from datetime import datetime
                    created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    now = datetime.now(created.tzinfo if created.tzinfo else None)
                    days_active = (now - created).days
                except:
                    days_active = 0
            
            # Get financial data updates (from finance collection)
            # This will be calculated in the route handler
            
            return {
                'days_active': max(1, days_active),
                'created_at': created_at,
                'last_updated': user.get('updated_at', created_at)
            }
        except Exception as e:
            print(f"Error getting user stats: {e}")
            return None
    
    def save_settings(self, user_id, settings):
        """Save user settings"""
        try:
            user_obj_id = ObjectId(user_id)
            
            result = self.collection.update_one(
                {"_id": user_obj_id},
                {
                    "$set": {
                        "settings": settings,
                        "settings_updated_at": datetime.now().isoformat()
                    }
                }
            )
            
            if result.matched_count == 0:
                return False, "User not found"
            
            return True, None
            
        except Exception as e:
            return False, f"Error saving settings: {str(e)}"
    
    def get_settings(self, user_id):
        """Get user settings"""
        try:
            user = self.find_by_id(user_id)
            if user:
                return user.get('settings', {})
            return {}
        except Exception:
            return {}
    
    def delete_account(self, user_id):
        """Delete user account and all associated data"""
        try:
            user_obj_id = ObjectId(user_id)
            
            # Delete user from users collection
            result = self.collection.delete_one({"_id": user_obj_id})
            
            if result.deleted_count == 0:
                return False, "User not found"
            
            return True, None
            
        except Exception as e:
            return False, f"Error deleting account: {str(e)}"

