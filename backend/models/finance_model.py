from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

class FinanceModel:
    """Financial data model for MongoDB operations"""
    
    def __init__(self, db):
        self.collection = db.financial_data
    
    def add_or_update_data(self, user_id, assets=None, liabilities=None, goals=None):
        """Add or update user financial data"""
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return None, "Invalid user ID"
        
        # Prepare update document
        update_doc = {
            "last_updated": datetime.now().isoformat()
        }
        
        if assets:
            update_doc["assets"] = assets
        if liabilities:
            update_doc["liabilities"] = liabilities
        
        # IMPORTANT: Only save goals if it's a complete set (5 goals) or explicitly None
        # Never save partial goal sets (< 5 goals) - this is enforced at the database model level
        goals_to_save = None
        if goals is not None:
            goals_list = goals if isinstance(goals, list) else []
            goals_count = len(goals_list)
            
            # Only save if we have exactly 5 goals (complete set from mock_data)
            if goals_count == 5:
                goals_to_save = goals
                update_doc["goals"] = goals
            elif goals_count > 0 and goals_count < 5:
                # Partial goals - NEVER save, always remove if exists
                print(f"⚠️ BLOCKING save of partial goals ({goals_count} goals). Only complete sets of 5 goals are allowed.")
                goals_to_save = None  # Explicitly set to None to trigger removal
                # Don't include goals in update_doc - will be removed via $unset
            # If goals is empty list [], treat as None (remove)
        
        # Prepare MongoDB update operation
        update_operation = {"$set": update_doc}
        
        # If goals should be removed (None, empty list, or partial set), use $unset
        if goals_to_save is None or (isinstance(goals, list) and len(goals) == 0):
            if "$unset" not in update_operation:
                update_operation["$unset"] = {}
            update_operation["$unset"]["goals"] = ""
            print(f"🧹 Removing goals field from MongoDB for user {user_id}")
        
        # Use upsert to insert or update
        result = self.collection.update_one(
            {"user_id": user_obj_id},
            update_operation,
            upsert=True
        )
        
        return {"success": True, "updated": result.modified_count > 0, "inserted": result.upserted_id is not None}, None
    
    def get_data(self, user_id):
        """Get financial data for a user"""
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return None, "Invalid user ID"
        
        data = self.collection.find_one({"user_id": user_obj_id})
        if data:
            data['_id'] = str(data['_id'])
            data['user_id'] = str(data['user_id'])
        return data, None
    
    def remove_goals(self, user_id):
        """Remove goals field from user financial data"""
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return None, "Invalid user ID"
        
        result = self.collection.update_one(
            {"user_id": user_obj_id},
            {"$unset": {"goals": ""}}
        )
        return {"success": True, "updated": result.modified_count > 0}, None
    
    def set_assets(self, user_id, assets):
        """Set assets for a user"""
        return self.add_or_update_data(user_id, assets=assets)
    
    def set_liabilities(self, user_id, liabilities):
        """Set liabilities for a user"""
        return self.add_or_update_data(user_id, liabilities=liabilities)
    
    def set_goals(self, user_id, goals):
        """Set goals for a user"""
        return self.add_or_update_data(user_id, goals=goals)

