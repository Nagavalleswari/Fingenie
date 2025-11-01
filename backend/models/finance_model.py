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
        if goals:
            update_doc["goals"] = goals
        
        # Use upsert to insert or update
        result = self.collection.update_one(
            {"user_id": user_obj_id},
            {"$set": update_doc},
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
    
    def set_assets(self, user_id, assets):
        """Set assets for a user"""
        return self.add_or_update_data(user_id, assets=assets)
    
    def set_liabilities(self, user_id, liabilities):
        """Set liabilities for a user"""
        return self.add_or_update_data(user_id, liabilities=liabilities)
    
    def set_goals(self, user_id, goals):
        """Set goals for a user"""
        return self.add_or_update_data(user_id, goals=goals)

