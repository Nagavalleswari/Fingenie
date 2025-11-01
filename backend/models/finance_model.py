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
        
        # IMPORTANT: Only prevent saving if it's a partial set (< 5 goals)
        # Allow saving if user has 5+ goals (user is managing their own goals)
        goals_to_save = None
        if goals is not None:
            goals_list = goals if isinstance(goals, list) else []
            goals_count = len(goals_list)
            
            # Allow saving if user has 5 or more goals (complete set or user-added goals)
            if goals_count >= 5:
                goals_to_save = goals
                update_doc["goals"] = goals
                print(f"✅ Saving {goals_count} goals to database")
            elif goals_count > 0 and goals_count < 5:
                # Partial goals - NEVER save, always remove if exists
                print(f"⚠️ BLOCKING save of partial goals ({goals_count} goals). User needs at least 5 goals to override mock_data.")
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
        
        # Remove goals field and ensure it's completely deleted
        result = self.collection.update_one(
            {"user_id": user_obj_id},
            {"$unset": {"goals": ""}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Successfully removed goals from MongoDB for user {user_id}")
        else:
            # Check if goals field existed
            existing = self.collection.find_one({"user_id": user_obj_id}, {"goals": 1})
            if existing and "goals" in existing:
                print(f"⚠️ Goals field still exists for user {user_id} - retrying removal...")
                # Force removal again
                self.collection.update_one(
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
    
    def update_budget(self, user_id, budget):
        """Update budget data for a user"""
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return None, "Invalid user ID"
        
        result = self.collection.update_one(
            {"user_id": user_obj_id},
            {
                "$set": {
                    "budget": budget,
                    "last_updated": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        
        return {"success": True, "updated": result.modified_count > 0, "inserted": result.upserted_id is not None}, None
    
    def save_custom_graph(self, user_id, graph_data):
        """Save a custom graph configuration for a user"""
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return None, "Invalid user ID"
        
        # Initialize custom_graphs array if it doesn't exist
        result = self.collection.update_one(
            {"user_id": user_obj_id},
            {
                "$set": {"last_updated": datetime.now().isoformat()},
                "$push": {"custom_graphs": graph_data}
            },
            upsert=True
        )
        
        return {"success": True, "updated": result.modified_count > 0, "inserted": result.upserted_id is not None}, None
    
    def get_custom_graphs(self, user_id):
        """Get all custom graphs for a user"""
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return [], "Invalid user ID"
        
        data = self.collection.find_one({"user_id": user_obj_id}, {"custom_graphs": 1})
        if data and "custom_graphs" in data:
            return data["custom_graphs"], None
        return [], None
    
    def delete_custom_graph(self, user_id, graph_id):
        """Delete a custom graph by ID"""
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return None, "Invalid user ID"
        
        result = self.collection.update_one(
            {"user_id": user_obj_id},
            {"$pull": {"custom_graphs": {"id": graph_id}}}
        )
        
        return {"success": True, "updated": result.modified_count > 0}, None

