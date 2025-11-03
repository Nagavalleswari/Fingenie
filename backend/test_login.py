# Test script to check login functionality
# Run this from the backend directory: python test_login.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from pymongo import MongoClient
from models.user_model import UserModel

def test_login():
    """Test login functionality"""
    print("Testing login functionality...")
    print(f"MongoDB URI: {Config.MONGO_URI[:50]}...")
    
    try:
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.fingenie
        client.admin.command('ping')
        print("✓ Connected to MongoDB successfully")
        
        # Test user model
        user_model = UserModel(db)
        
        # Check if any users exist
        users_count = db.users.count_documents({})
        print(f"Total users in database: {users_count}")
        
        if users_count > 0:
            # Get first user
            first_user = db.users.find_one()
            print(f"Sample user email: {first_user.get('email')}")
            print(f"Has password_hash: {'password_hash' in first_user}")
        
        print("\nTo test login:")
        print("1. Make sure you have created a user account (signup)")
        print("2. Check the browser console for error messages")
        print("3. Check the server logs for any errors")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_login()

