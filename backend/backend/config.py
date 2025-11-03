import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration class for FinGenie application"""
    
    # MongoDB Configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/fingenie')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_HOURS = 24
    
    # Gemini API Configuration
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    GEMINI_PROJECT_ID = os.getenv('GEMINI_PROJECT_ID', '')
    GEMINI_LOCATION = os.getenv('GEMINI_LOCATION', 'us-central1')
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-flask-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

