# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

Backend (Flask + MongoDB):

- Setup
  - cd backend
  - python -m venv venv
  - Activate venv
    - Windows (PowerShell): .\venv\Scripts\Activate.ps1
    - macOS/Linux: source venv/bin/activate
  - pip install -r requirements.txt
- Run the app (http://localhost:5000)
  - python app.py
- Environment
  - Create backend/.env with: MONGO_URI, JWT_SECRET_KEY, SECRET_KEY, DEBUG, CORS_ORIGINS, GEMINI_API_KEY (optional), GEMINI_PROJECT_ID (optional), GEMINI_LOCATION (default us-central1)
- Health check
  - curl http://localhost:5000/health
- Manual test script (no test framework configured)
  - cd backend && python test_login.py
- API smoke examples
  - Login: curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"pass"}'
  - Use auth: include header Authorization: Bearer <token> or cookie token set by backend

Notes
- No linter/formatter or automated tests are configured in this repo.
- Frontend assets are static (no package.json). Root package-lock.json is unused.

## High-level architecture

- Application entrypoint: backend/app.py uses a Flask application factory, serves templates from frontend/templates and static assets from frontend/static, enables CORS, and registers blueprints at:
  - /api/auth → routes/auth_routes.py (signup, login, logout)
  - /api/finance → routes/finance_routes.py (CRUD for financial data + loan calculators)
  - /api/chat → routes/chat_routes.py (AI assistant)
- Configuration: backend/config.py loads environment via python-dotenv into Config (Mongo URI, JWT, Flask SECRET_KEY/DEBUG, CORS origins, Gemini settings).
- Persistence: MongoDB (database fingenie). Models wrap collections:
  - models/user_model.py → users (bcrypt password hashing, duplicate checks, basic lookups)
  - models/finance_model.py → financial_data (upsert, merges, and field maintenance)
- AuthN/Z: utils/jwt_handler.py provides encode/decode and a require_auth decorator. Decorator accepts token via Authorization: Bearer or cookie token and attaches request.user_id and request.user_email to downstream handlers.
- Finance domain & mock data:
  - routes/finance_routes.py loads backend/mock_data.json and merges with user data. Assets/liabilities merge (user overrides, mock fills gaps). Goals have special rules: incomplete user goal sets (< 5) are removed and mock goals are served; only full sets (≥ 5) persist. Endpoints also expose loan utilities.
  - utils/loan_calculator.py implements EMI, prepayment savings, loan comparison, and affordability calculations exposed via finance routes.
- AI integration:
  - utils/gemini_client.py selects mode at runtime: Direct API (google-generativeai) if GEMINI_API_KEY is set; Vertex AI (google-cloud-aiplatform) if project is set; otherwise a robust mock mode.
  - It constructs a detailed financial context (assets, liabilities, goals, budget, transactions, investments, analytics) and emphasizes Indian Rupees (₹/INR) in responses. chat_routes.py passes user financial context to the client.
- Frontend: HTML templates in frontend/templates (index, login, signup, dashboard, chat) with CSS/JS in frontend/static; served via Flask routes (/ for index, /login, /signup, /dashboard, /chat).
- Deployment: As per README, Render Web Service can use build: pip install -r requirements.txt and start: python app.py with environment variables from .env.

Important behaviors/gotchas
- If no user data exists, or if goals are incomplete, finance endpoints serve/merge mock_data.json and aggressively clean partial goals from MongoDB.
- Tokens are set as HTTP-only cookies and also returned in JSON; API accepts either cookie or Authorization header.
- Health endpoint (/health) pings MongoDB and returns basic status/version.
