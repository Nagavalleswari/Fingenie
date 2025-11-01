# FinGenie – AI-Powered Personal Finance Assistant

A secure, cloud-ready Flask web application that helps users manage their finances with AI-powered insights.

## 🎯 Features

- **User Authentication**: Secure signup/login with JWT tokens and bcrypt password hashing
- **Financial Data Management**: Add and track assets, liabilities, and financial goals
- **AI Chat Assistant**: Chat with Gemini AI for personalized financial advice
- **Dashboard**: View financial overview with summary cards and insights
- **Cloud-Ready**: Designed for deployment on Render with MongoDB Atlas

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **Database**: MongoDB Atlas
- **Authentication**: bcrypt + JWT
- **AI Integration**: Gemini API (Vertex AI) - with mock fallback
- **Frontend**: HTML, CSS, Bootstrap 5, JavaScript
- **Deployment**: Render (backend) + MongoDB Atlas (DB)

## 📁 Project Structure

```
FinGenie/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── config.py             # Configuration management
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variables template
│   ├── routes/
│   │   ├── auth_routes.py    # Authentication endpoints
│   │   ├── finance_routes.py # Financial data endpoints
│   │   └── chat_routes.py    # AI chat endpoints
│   ├── models/
│   │   ├── user_model.py     # User data model
│   │   └── finance_model.py  # Financial data model
│   └── utils/
│       ├── jwt_handler.py    # JWT token management
│       └── gemini_client.py  # Gemini API client
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css     # Custom styles
│   │   └── js/
│   │       └── main.js       # Frontend JavaScript
│   └── templates/
│       ├── index.html        # Landing page
│       ├── login.html        # Login page
│       ├── signup.html       # Signup page
│       ├── dashboard.html    # Dashboard page
│       └── chat.html         # Chat page
└── README.md                 # This file
```

## 🚀 Setup Instructions

### Prerequisites

- Python 3.8 or higher
- MongoDB Atlas account (or local MongoDB)
- Google Cloud account (optional, for Gemini API)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FinGenie
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **Mac/Linux**: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

6. Edit `.env` with your configuration:
```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fingenie?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# Flask Configuration
SECRET_KEY=your-flask-secret-key-change-this-in-production
DEBUG=False

# CORS Configuration (comma-separated)
CORS_ORIGINS=http://localhost:5000,http://127.0.0.1:5000

# Gemini API Configuration (Optional - for AI features)
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_PROJECT_ID=your-gcp-project-id
GEMINI_LOCATION=us-central1
```

### 3. Run the Application

From the `backend` directory:

```bash
python app.py
```

The application will start on `http://localhost:5000`

### 4. Access the Application

Open your browser and navigate to:
- **Home**: http://localhost:5000
- **Login**: http://localhost:5000/login
- **Signup**: http://localhost:5000/signup
- **Dashboard**: http://localhost:5000/dashboard (requires login)
- **Chat**: http://localhost:5000/chat (requires login)

## 📡 API Endpoints

### Authentication

- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (clears token)

### Financial Data

- `POST /api/finance/add_data` - Add or update financial data (requires auth)
- `GET /api/finance/get_data` - Get user's financial data (requires auth)

### AI Chat

- `POST /api/chat/chat` - Send message to AI assistant (requires auth)

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Tokens are stored in HTTP-only cookies and also sent in the Authorization header.

**Protected Routes**: All finance and chat endpoints require authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## 🤖 Gemini AI Integration

The application supports Google's Gemini API via Vertex AI. If no API key is configured, the app will use mock responses for demo purposes.

### Setting up Gemini API:

1. Create a Google Cloud Project
2. Enable Vertex AI API
3. Create credentials and get your API key
4. Add credentials to `.env` file

**Note**: Without Gemini API credentials, the chat feature will work with mock responses.

## 🚢 Deployment to Render

### Backend Deployment:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`
5. Add environment variables from your `.env` file
6. Deploy!

### Environment Variables for Render:

- `MONGO_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET_KEY`: A secure random string
- `SECRET_KEY`: A secure random string for Flask
- `DEBUG`: Set to `False` for production
- `CORS_ORIGINS`: Your frontend URL(s)
- `GEMINI_API_KEY`: (Optional) Your Gemini API key
- `GEMINI_PROJECT_ID`: (Optional) Your GCP project ID
- `GEMINI_LOCATION`: (Optional) Your GCP location (default: us-central1)

## 📊 MongoDB Collections

### users
```json
{
  "_id": "ObjectId",
  "name": "Mithilesh",
  "email": "mithilesh@example.com",
  "password_hash": "xxxx",
  "created_at": "2025-10-31"
}
```

### financial_data
```json
{
  "user_id": "ObjectId",
  "assets": {
    "savings": 45000,
    "mutual_funds": 120000,
    "stocks": 50000
  },
  "liabilities": {
    "loan": 30000,
    "credit_card_due": 5000
  },
  "goals": [
    {
      "name": "Buy Car",
      "target": 500000,
      "year": 2027
    }
  ],
  "last_updated": "2025-10-31"
}
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- HTTP-only cookies for token storage
- CORS protection
- Input validation

## 📝 License

This project is open source and available for use.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Flask, MongoDB, and Gemini AI**

