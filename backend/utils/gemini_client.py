import os
import warnings
from config import Config

# Suppress warnings from google-cloud-aiplatform
warnings.filterwarnings('ignore', category=UserWarning, module='google.cloud.aiplatform')
warnings.filterwarnings('ignore', category=FutureWarning, module='google.api_core')

class GeminiClient:
    """Client for interacting with Gemini API (supports both Direct API and Vertex AI)"""
    
    def __init__(self):
        self.api_key = Config.GEMINI_API_KEY
        self.project_id = Config.GEMINI_PROJECT_ID
        self.location = Config.GEMINI_LOCATION
        
        # Determine which method to use
        # Priority: Direct API (if API key exists) > Vertex AI (if project_id exists) > Mock
        if self.api_key:
            self.use_method = 'direct_api'
            self.use_mock = False
        elif self.project_id:
            self.use_method = 'vertex_ai'
            self.use_mock = False
        else:
            self.use_method = 'mock'
            self.use_mock = True
    
    def generate_response(self, user_message, user_financial_data=None):
        """
        Generate AI response using Gemini API
        
        Args:
            user_message: User's chat message
            user_financial_data: User's financial data dictionary
        
        Returns:
            str: AI response
        """
        if self.use_mock:
            return self._mock_response(user_message, user_financial_data)
        
        try:
            if self.use_method == 'direct_api':
                return self._call_gemini_direct_api(user_message, user_financial_data)
            elif self.use_method == 'vertex_ai':
                return self._call_gemini_vertex_ai(user_message, user_financial_data)
            else:
                return self._mock_response(user_message, user_financial_data)
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            import traceback
            traceback.print_exc()
            return self._mock_response(user_message, user_financial_data)
    
    def _call_gemini_direct_api(self, user_message, user_financial_data=None):
        """Call Gemini API directly using API key (google-generativeai package)"""
        try:
            import google.generativeai as genai
            
            # Configure the API key
            genai.configure(api_key=self.api_key)
            
            # Prepare context from financial data (all amounts are in Indian Rupees)
            context = ""
            if user_financial_data:
                assets = user_financial_data.get('assets', {})
                liabilities = user_financial_data.get('liabilities', {})
                goals = user_financial_data.get('goals', [])
                
                context = f"""
                User's Financial Context (All amounts in Indian Rupees ₹):
                Assets:
                  - Savings: ₹{assets.get('savings', 0):,.0f}
                  - Mutual Funds: ₹{assets.get('mutual_funds', 0):,.0f}
                  - Stocks: ₹{assets.get('stocks', 0):,.0f}
                Liabilities:
                  - Loan: ₹{liabilities.get('loan', 0):,.0f}
                  - Credit Card Due: ₹{liabilities.get('credit_card_due', 0):,.0f}
                Goals: {goals}
                
                Note: All monetary values are in Indian Rupees (₹/INR), not USD.
                
                """
            
            # Create prompt
            prompt = f"""{context}
            You are FinGenie, a helpful AI personal finance assistant for users in India. 
            Provide helpful, accurate, and friendly financial advice based on the user's question.
            
            IMPORTANT: Always use Indian Rupees (₹ or INR) as the currency. Never use dollar signs ($) or USD.
            Format monetary amounts as ₹X,XXX (e.g., ₹50,000 or ₹1,00,000).
            
            User Question: {user_message}
            
            Please provide a helpful response using Indian Rupees (₹/INR) as the currency:"""
            
            # Try different model names (newer API versions use different names)
            # Try models in order of preference (newer models first)
            model_names = [
                'gemini-2.5-flash',           # Fast and efficient (recommended)
                'gemini-2.5-pro',             # More capable
                'gemini-pro-latest',           # Latest gemini-pro version
                'gemini-flash-latest',         # Latest flash version
                'gemini-1.5-pro',              # Fallback
                'gemini-1.5-flash',            # Fallback
                'models/gemini-2.5-flash',     # With models/ prefix
                'models/gemini-2.5-pro',       # With models/ prefix
            ]
            model = None
            last_error = None
            
            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    # Test with a simple call to see if model works
                    response = model.generate_content(prompt)
                    print(f"✓ Successfully using model: {model_name}")
                    return response.text
                except Exception as e:
                    last_error = e
                    # Only print if it's not a 404 (model not found) to avoid spam
                    if '404' not in str(e) and 'not found' not in str(e).lower():
                        print(f"Model {model_name} failed: {e}")
                    continue
            
            # If all models failed, raise the last error
            if last_error:
                raise last_error
            
            return "Error: No available Gemini model found."
            
        except ImportError:
            print("google-generativeai package not installed. Install it with: pip install google-generativeai")
            print("Falling back to mock response.")
            return self._mock_response(user_message, user_financial_data)
        except Exception as e:
            print(f"Error calling Gemini Direct API: {e}")
            # Try to list available models for debugging
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                models = genai.list_models()
                print("Available models:")
                for m in models:
                    if 'generateContent' in m.supported_generation_methods:
                        print(f"  - {m.name}")
            except:
                pass
            return self._mock_response(user_message, user_financial_data)
    
    def _call_gemini_vertex_ai(self, user_message, user_financial_data=None):
        """Call Gemini API via Vertex AI (requires GCP project)"""
        try:
            # Suppress warnings during import
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                import vertexai
                from vertexai.generative_models import GenerativeModel
            
            # Initialize Vertex AI
            vertexai.init(project=self.project_id, location=self.location)
            
            # Prepare context from financial data (all amounts are in Indian Rupees)
            context = ""
            if user_financial_data:
                assets = user_financial_data.get('assets', {})
                liabilities = user_financial_data.get('liabilities', {})
                goals = user_financial_data.get('goals', [])
                
                context = f"""
                User's Financial Context (All amounts in Indian Rupees ₹):
                Assets:
                  - Savings: ₹{assets.get('savings', 0):,.0f}
                  - Mutual Funds: ₹{assets.get('mutual_funds', 0):,.0f}
                  - Stocks: ₹{assets.get('stocks', 0):,.0f}
                Liabilities:
                  - Loan: ₹{liabilities.get('loan', 0):,.0f}
                  - Credit Card Due: ₹{liabilities.get('credit_card_due', 0):,.0f}
                Goals: {goals}
                
                Note: All monetary values are in Indian Rupees (₹/INR), not USD.
                
                """
            
            # Create enhanced prompt for better financial advice
            prompt = f"""{context}
            You are FinGenie, a professional and trusted AI personal finance assistant for users in India with expertise in:
            - Personal budgeting and expense management
            - Investment planning (stocks, mutual funds, bonds)
            - Debt management and credit optimization
            - Retirement planning
            - Tax optimization strategies
            - Financial goal achievement
            - Risk assessment and portfolio diversification
            
            Instructions:
            1. Provide detailed, actionable, and professional financial advice
            2. Use specific numbers and calculations when relevant from the user's financial context
            3. Format your response with clear sections, bullet points, and structured information
            4. Include relevant financial principles and best practices
            5. Be specific about recommendations (e.g., "allocate 20-30% to equities" not just "invest more")
            6. Consider the user's current financial situation from the context provided
            7. Use professional but friendly language that builds trust
            8. When discussing investments, mention risk management
            9. If the user asks about budgeting, provide actionable steps
            10. Always prioritize financial security and long-term wealth building
            11. **CRITICAL: Always use Indian Rupees (₹ or INR) as the currency. Never use dollar signs ($) or USD. Format all monetary amounts as ₹X,XXX (e.g., ₹50,000 or ₹1,00,000). If you see amounts in the financial context, they are already in Indian Rupees.**
            
            User's Financial Context:
            {context if context else "No financial data available yet."}
            
            User Question: {user_message}
            
            Provide a comprehensive, well-structured response with actionable insights. Remember to use ₹ (Indian Rupees) for all currency references:"""
            
            # Try newer model names first (Vertex AI also uses newer model names)
            model_names = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-pro"]
            
            for model_name in model_names:
                try:
                    # Initialize model
                    model = GenerativeModel(model_name)
                    # Generate response
                    response = model.generate_content(prompt)
                    print(f"✓ Successfully using Vertex AI model: {model_name}")
                    return response.text
                except Exception as e:
                    if model_name == model_names[-1]:  # Last model, raise the error
                        raise e
                    continue
            
        except ImportError:
            print("google-cloud-aiplatform not installed. Using mock response.")
            return self._mock_response(user_message, user_financial_data)
        except Exception as e:
            print(f"Error in Gemini Vertex AI call: {e}")
            return self._mock_response(user_message, user_financial_data)
    
    def _mock_response(self, user_message, user_financial_data=None):
        """Generate mock response for demo purposes"""
        # Extract financial data if available
        assets = user_financial_data.get('assets', {}) if user_financial_data else {}
        liabilities = user_financial_data.get('liabilities', {}) if user_financial_data else {}
        goals = user_financial_data.get('goals', []) if user_financial_data else []
        
        total_assets = (assets.get('savings', 0) or 0) + (assets.get('mutual_funds', 0) or 0) + (assets.get('stocks', 0) or 0)
        total_liabilities = (liabilities.get('loan', 0) or 0) + (liabilities.get('credit_card_due', 0) or 0)
        net_worth = total_assets - total_liabilities
        
        # Simple mock response - using Indian Rupees
        if "budget" in user_message.lower():
            return f"Based on your financial data, I recommend creating a monthly budget. Your current net worth is ₹{net_worth:,.0f}. Track your income and expenses to better manage your finances. Aim to save at least 20% of your monthly income."
        elif "goal" in user_message.lower() or "save" in user_message.lower():
            if goals:
                goal_info = "\n".join([f"- {g.get('name', 'Goal')}: ₹{g.get('target', 0):,.0f} by {g.get('year', 'N/A')}" for g in goals[:3]])
                return f"Great! Setting financial goals is important. You have {len(goals)} goal(s):\n{goal_info}\n\nBased on your current assets (₹{total_assets:,.0f}), I suggest prioritizing high-interest debt repayment before focusing on savings goals. Your net worth is ₹{net_worth:,.0f}."
            else:
                return f"Great! Setting financial goals is important. Based on your current assets (₹{total_assets:,.0f}) and liabilities (₹{total_liabilities:,.0f}), I suggest prioritizing high-interest debt repayment before focusing on savings goals. Your net worth is ₹{net_worth:,.0f}."
        elif "debt" in user_message.lower() or "loan" in user_message.lower():
            return f"Managing debt effectively is crucial. Your current liabilities total ₹{total_liabilities:,.0f}. Consider paying off high-interest debts first, and always make at least the minimum payments to avoid penalties. Focus on reducing debt while maintaining a safety net."
        elif "investment" in user_message.lower() or "invest" in user_message.lower():
            investments = (assets.get('mutual_funds', 0) or 0) + (assets.get('stocks', 0) or 0)
            return f"Your current investments total ₹{investments:,.0f}. Consider diversifying across different asset classes - mutual funds for stability and stocks for growth potential. Remember to review your portfolio periodically."
        else:
            return "This is a mock AI reply for demo. To enable full AI functionality, please configure your GEMINI_API_KEY in the .env file. I'm here to help with your personal finance questions! All amounts shown are in Indian Rupees (₹)."


