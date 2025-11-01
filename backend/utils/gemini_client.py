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
    
    def _build_financial_context(self, user_financial_data):
        """Build comprehensive financial context string from user data"""
        if not user_financial_data:
            return ""
        
        assets = user_financial_data.get('assets', {})
        liabilities = user_financial_data.get('liabilities', {})
        goals = user_financial_data.get('goals', [])
        budget = user_financial_data.get('budget', {})
        transactions = user_financial_data.get('transactions', [])
        investments = user_financial_data.get('investments', {})
        financial_health = user_financial_data.get('financial_health_metrics', {})
        
        # Build comprehensive context
        context_parts = [
            "User's Financial Context (All amounts in Indian Rupees ₹):",
            "",
            "ASSETS:"
        ]
        
        # Assets
        if assets:
            if assets.get('savings'):
                context_parts.append(f"  - Savings: ₹{assets.get('savings', 0):,.0f}")
            if assets.get('mutual_funds'):
                context_parts.append(f"  - Mutual Funds: ₹{assets.get('mutual_funds', 0):,.0f}")
            if assets.get('stocks'):
                context_parts.append(f"  - Stocks: ₹{assets.get('stocks', 0):,.0f}")
            if assets.get('real_estate'):
                context_parts.append(f"  - Real Estate: ₹{assets.get('real_estate', 0):,.0f}")
            if assets.get('fixed_deposits'):
                context_parts.append(f"  - Fixed Deposits: ₹{assets.get('fixed_deposits', 0):,.0f}")
            if assets.get('gold'):
                context_parts.append(f"  - Gold: ₹{assets.get('gold', 0):,.0f}")
        
        context_parts.append("")
        context_parts.append("INCOME/SALARY:")
        # Extract income information from multiple sources
        monthly_income_from_budget = budget.get('monthly_income') or budget.get('monthly_budget', 0) if budget else 0
        salary_transactions = []
        other_income_transactions = []
        
        if transactions:
            # Find salary transactions (most recent first)
            for txn in reversed(transactions):  # Reverse to get most recent first
                if txn.get('type') == 'income':
                    if txn.get('category') == 'salary' or 'salary' in str(txn.get('description', '')).lower():
                        if not salary_transactions:  # Only get the most recent salary
                            salary_transactions.append(txn)
                    else:
                        if len(other_income_transactions) < 3:  # Get up to 3 other income transactions
                            other_income_transactions.append(txn)
        
        # Add salary information
        if salary_transactions:
            latest_salary = salary_transactions[0]
            salary_amount = latest_salary.get('amount', 0)
            salary_date = latest_salary.get('date', 'Unknown')
            context_parts.append(f"  - Last Salary Credited: ₹{salary_amount:,.0f} on {salary_date}")
            context_parts.append(f"    (Description: {latest_salary.get('description', 'Monthly Salary')})")
        elif monthly_income_from_budget:
            context_parts.append(f"  - Monthly Income: ₹{monthly_income_from_budget:,.0f}")
            context_parts.append(f"    (Note: This is the budgeted monthly income)")
        
        # Add other income sources
        if other_income_transactions:
            context_parts.append(f"  - Other Income Sources (Last {len(other_income_transactions)}):")
            for txn in other_income_transactions[:3]:
                context_parts.append(f"    * ₹{txn.get('amount', 0):,.0f} - {txn.get('description', 'Income')} ({txn.get('date', 'Unknown')})")
        
        # If we have monthly trends, use that too
        financial_health = user_financial_data.get('financial_health_metrics', {})
        if financial_health:
            monthly_trends = financial_health.get('monthly_trends', [])
            if monthly_trends:
                latest = monthly_trends[-1]
                monthly_income_health = latest.get('income', 0)
                if monthly_income_health and monthly_income_health != monthly_income_from_budget:
                    context_parts.append(f"  - Average Monthly Income (from trends): ₹{monthly_income_health:,.0f}")
        
        context_parts.append("")
        context_parts.append("LIABILITIES:")
        # Liabilities
        if liabilities:
            if liabilities.get('loan') or liabilities.get('home_loan'):
                total_loans = (liabilities.get('loan', 0) or 0) + (liabilities.get('home_loan', 0) or 0) + (liabilities.get('car_loan', 0) or 0) + (liabilities.get('personal_loan', 0) or 0)
                if total_loans > 0:
                    context_parts.append(f"  - Total Loans: ₹{total_loans:,.0f}")
                    if liabilities.get('home_loan'):
                        context_parts.append(f"    * Home Loan: ₹{liabilities.get('home_loan', 0):,.0f}")
                    if liabilities.get('car_loan'):
                        context_parts.append(f"    * Car Loan: ₹{liabilities.get('car_loan', 0):,.0f}")
                    if liabilities.get('personal_loan'):
                        context_parts.append(f"    * Personal Loan: ₹{liabilities.get('personal_loan', 0):,.0f}")
                    if liabilities.get('loan'):
                        context_parts.append(f"    * Other Loans: ₹{liabilities.get('loan', 0):,.0f}")
            if liabilities.get('credit_card_due'):
                context_parts.append(f"  - Credit Card Due: ₹{liabilities.get('credit_card_due', 0):,.0f}")
        
        context_parts.append("")
        context_parts.append("FINANCIAL GOALS:")
        if goals:
            for goal in goals[:5]:  # Limit to top 5 goals
                goal_name = goal.get('name', 'Unknown')
                goal_target = goal.get('target', goal.get('current_amount', 0))
                goal_current = goal.get('current', goal.get('current_amount', 0))
                goal_year = goal.get('year', 'N/A')
                goal_priority = goal.get('priority', 'medium')
                progress = (goal_current / goal_target * 100) if goal_target > 0 else 0
                context_parts.append(f"  - {goal_name}: ₹{goal_current:,.0f} / ₹{goal_target:,.0f} ({progress:.1f}%) - Target: {goal_year}, Priority: {goal_priority}")
        
        # Budget
        if budget:
            context_parts.append("")
            context_parts.append("BUDGET:")
            monthly_income = budget.get('monthly_income') or budget.get('monthly_budget', 0)
            if monthly_income:
                context_parts.append(f"  - Monthly Income/Budget: ₹{monthly_income:,.0f}")
            budget_categories = budget.get('categories', [])
            if budget_categories:
                total_budget = sum(cat.get('budget', 0) for cat in budget_categories)
                total_spent = sum(cat.get('spent', 0) for cat in budget_categories)
                context_parts.append(f"  - Total Budget: ₹{total_budget:,.0f}")
                context_parts.append(f"  - Total Spent: ₹{total_spent:,.0f}")
                context_parts.append(f"  - Remaining: ₹{max(0, total_budget - total_spent):,.0f}")
                context_parts.append("  - Budget Categories:")
                for cat in budget_categories[:7]:  # Top 7 categories
                    cat_name = cat.get('name', 'Unknown')
                    cat_budget = cat.get('budget', 0)
                    cat_spent = cat.get('spent', 0)
                    cat_percent = (cat_spent / cat_budget * 100) if cat_budget > 0 else 0
                    status = "⚠️ Over" if cat_spent > cat_budget else "✅ Within"
                    context_parts.append(f"    * {cat_name}: ₹{cat_spent:,.0f} / ₹{cat_budget:,.0f} ({cat_percent:.1f}%) {status}")
        
        # Recent Transactions
        if transactions:
            context_parts.append("")
            context_parts.append("RECENT TRANSACTIONS (Last 5):")
            for txn in transactions[-5:]:
                txn_type = txn.get('type', 'unknown')
                txn_amount = txn.get('amount', 0)
                txn_desc = txn.get('description', 'No description')
                txn_date = txn.get('date', 'Unknown')
                txn_category = txn.get('category', '')
                sign = "+" if txn_type == "income" else "-"
                context_parts.append(f"  {sign} ₹{txn_amount:,.0f} - {txn_desc} ({txn_category}) - {txn_date}")
        
        # Investments
        if investments:
            context_parts.append("")
            context_parts.append("INVESTMENTS:")
            if isinstance(investments, dict):
                portfolio_value = investments.get('portfolio_value', 0)
                if portfolio_value:
                    context_parts.append(f"  - Portfolio Value: ₹{portfolio_value:,.0f}")
                holdings = investments.get('holdings', [])
                if holdings:
                    for holding in holdings[:5]:  # Top 5 holdings
                        name = holding.get('name', 'Unknown')
                        value = holding.get('value', 0)
                        gain_loss = holding.get('gain_loss', 0)
                        gain_pct = (gain_loss / (value - gain_loss) * 100) if (value - gain_loss) > 0 else 0
                        sign = "+" if gain_loss >= 0 else ""
                        context_parts.append(f"  - {name}: ₹{value:,.0f} ({sign}₹{gain_loss:,.0f}, {sign}{gain_pct:.1f}%)")
            elif isinstance(investments, list):
                for inv in investments[:5]:
                    name = inv.get('name', 'Unknown')
                    value = inv.get('current_value', inv.get('amount', 0))
                    returns = inv.get('returns', 0)
                    context_parts.append(f"  - {name}: ₹{value:,.0f} (Returns: {returns:.2f}%)")
        
        # Financial Health Metrics
        if financial_health:
            context_parts.append("")
            context_parts.append("FINANCIAL HEALTH:")
            monthly_trends = financial_health.get('monthly_trends', [])
            if monthly_trends:
                latest = monthly_trends[-1] if monthly_trends else {}
                net_worth = latest.get('net_worth', 0)
                monthly_income_health = latest.get('income', 0)
                monthly_expenses_health = latest.get('expenses', 0)
                monthly_savings = latest.get('savings', 0)
                if net_worth:
                    context_parts.append(f"  - Net Worth: ₹{net_worth:,.0f}")
                if monthly_income_health and monthly_expenses_health:
                    savings_rate = (monthly_savings / monthly_income_health * 100) if monthly_income_health > 0 else 0
                    context_parts.append(f"  - Monthly Savings Rate: {savings_rate:.1f}% (₹{monthly_savings:,.0f} / ₹{monthly_income_health:,.0f})")
            
            expense_categories = financial_health.get('expense_categories', [])
            if expense_categories:
                context_parts.append("  - Expense Distribution:")
                for cat in expense_categories[:5]:
                    cat_name = cat.get('category', 'Unknown')
                    cat_amount = cat.get('amount', 0)
                    cat_pct = cat.get('percentage', 0)
                    context_parts.append(f"    * {cat_name}: ₹{cat_amount:,.0f} ({cat_pct:.1f}%)")
            
            notifications = financial_health.get('notifications', [])
            if notifications:
                high_priority = [n for n in notifications if n.get('priority') == 'high']
                if high_priority:
                    context_parts.append("  - Important Alerts:")
                    for notif in high_priority[:3]:
                        context_parts.append(f"    ⚠️ {notif.get('title', 'Alert')}: {notif.get('message', '')}")
        
        context_parts.append("")
        context_parts.append("Note: All monetary values are in Indian Rupees (₹/INR), not USD.")
        
        return "\n".join(context_parts)
    
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
            
            # Prepare comprehensive context from financial data (all amounts are in Indian Rupees)
            context = self._build_financial_context(user_financial_data)
            
            # Create prompt
            prompt = f"""{context}
            You are FinGenie, a helpful AI personal finance assistant for users in India. 
            Provide helpful, accurate, and friendly financial advice based on the user's question.
            
            IMPORTANT: 
            - Always use Indian Rupees (₹ or INR) as the currency. Never use dollar signs ($) or USD.
            - Format monetary amounts as ₹X,XXX (e.g., ₹50,000 or ₹1,00,000).
            - The financial context above includes ALL available financial data including salary/income information from transactions, budget data, and financial health metrics.
            - When asked about salary or income, refer to the "INCOME/SALARY" section in the context which shows the last salary credited date and amount, monthly income from budget, and other income sources.
            - Use the most recent salary transaction when answering questions about "last month's salary" or similar queries.
            
            User Question: {user_message}
            
            Please provide a helpful response using Indian Rupees (₹/INR) as the currency. Reference the financial context provided above to answer questions accurately:"""
            
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
            
            # Prepare comprehensive context from financial data (all amounts are in Indian Rupees)
            context = self._build_financial_context(user_financial_data)
            
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
            12. **IMPORTANT: The financial context includes an "INCOME/SALARY" section that shows the last salary credited (date and amount), monthly income from budget, and other income sources. When asked about salary, income, or "how much was credited last month", refer to this section directly. Use the "Last Salary Credited" information to answer questions about recent salary payments.**
            
            User's Financial Context:
            {context if context else "No financial data available yet."}
            
            User Question: {user_message}
            
            Provide a comprehensive, well-structured response with actionable insights. Remember to use ₹ (Indian Rupees) for all currency references and reference the INCOME/SALARY section when answering income-related questions:"""
            
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
        budget = user_financial_data.get('budget', {}) if user_financial_data else {}
        investments = user_financial_data.get('investments', {}) if user_financial_data else {}
        
        # Calculate totals
        total_assets = (assets.get('savings', 0) or 0) + (assets.get('mutual_funds', 0) or 0) + (assets.get('stocks', 0) or 0) + (assets.get('real_estate', 0) or 0)
        total_liabilities = (liabilities.get('loan', 0) or 0) + (liabilities.get('home_loan', 0) or 0) + (liabilities.get('car_loan', 0) or 0) + (liabilities.get('personal_loan', 0) or 0) + (liabilities.get('credit_card_due', 0) or 0)
        net_worth = total_assets - total_liabilities
        
        # Simple mock response - using Indian Rupees
        if "budget" in user_message.lower():
            monthly_budget = budget.get('monthly_income') or budget.get('monthly_budget', 0)
            budget_categories = budget.get('categories', [])
            if budget_categories:
                total_spent = sum(cat.get('spent', 0) for cat in budget_categories)
                total_budget = sum(cat.get('budget', 0) for cat in budget_categories)
                return f"Based on your financial data, I can see your monthly budget is ₹{monthly_budget:,.0f}. You've spent ₹{total_spent:,.0f} out of ₹{total_budget:,.0f}. Your current net worth is ₹{net_worth:,.0f}. Track your income and expenses to better manage your finances. Aim to save at least 20% of your monthly income."
            else:
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
            if isinstance(investments, dict):
                portfolio_value = investments.get('portfolio_value', 0)
                if portfolio_value:
                    return f"Your current investment portfolio value is ₹{portfolio_value:,.0f}. Consider diversifying across different asset classes - mutual funds for stability and stocks for growth potential. Remember to review your portfolio periodically."
            elif isinstance(investments, list):
                total_inv = sum(inv.get('current_value', inv.get('amount', 0)) for inv in investments)
                return f"Your current investments total ₹{total_inv:,.0f}. Consider diversifying across different asset classes - mutual funds for stability and stocks for growth potential. Remember to review your portfolio periodically."
            else:
                investments_amt = (assets.get('mutual_funds', 0) or 0) + (assets.get('stocks', 0) or 0)
                return f"Your current investments total ₹{investments_amt:,.0f}. Consider diversifying across different asset classes - mutual funds for stability and stocks for growth potential. Remember to review your portfolio periodically."
        elif "salary" in user_message.lower() or ("how much" in user_message.lower() and ("credited" in user_message.lower() or "last month" in user_message.lower())):
            # Find salary transactions
            transactions = user_financial_data.get('transactions', []) if user_financial_data else []
            salary_transactions = [txn for txn in transactions if txn.get('type') == 'income' and (txn.get('category') == 'salary' or 'salary' in str(txn.get('description', '')).lower())]
            
            if salary_transactions:
                # Get most recent salary (transactions are typically in chronological order, so last one is most recent)
                latest_salary = salary_transactions[-1]
                salary_amount = latest_salary.get('amount', 0)
                salary_date = latest_salary.get('date', 'Unknown')
                salary_desc = latest_salary.get('description', 'Monthly Salary')
                
                # Also check budget for monthly income
                budget = user_financial_data.get('budget', {}) if user_financial_data else {}
                monthly_income = budget.get('monthly_income') or budget.get('monthly_budget', 0)
                
                response = f"Based on your transaction history, your last salary was credited on {salary_date} for ₹{salary_amount:,.0f} ({salary_desc})."
                if monthly_income and monthly_income == salary_amount:
                    response += f" This matches your monthly income of ₹{monthly_income:,.0f}."
                elif monthly_income:
                    response += f" Your monthly income is set at ₹{monthly_income:,.0f} in your budget."
                return response
            else:
                # Fall back to budget data
                budget = user_financial_data.get('budget', {}) if user_financial_data else {}
                monthly_income = budget.get('monthly_income') or budget.get('monthly_budget', 0)
                if monthly_income:
                    return f"Based on your budget data, your monthly income is ₹{monthly_income:,.0f}. However, I don't see a specific salary transaction in your recent records. You might want to add your salary transactions to track them better."
                else:
                    return "I don't have specific salary information in your transaction history or budget. You might want to add your salary transactions to track your income better."
        elif "transaction" in user_message.lower():
            transactions = user_financial_data.get('transactions', []) if user_financial_data else []
            if transactions:
                recent = transactions[-3:]
                return f"Based on your recent transactions, I can help you analyze your spending patterns. You have {len(transactions)} transactions recorded. Focus on tracking all expenses to better understand where your money goes."
            else:
                return "I notice you don't have many transactions recorded yet. Start tracking your income and expenses to get better insights into your financial habits."
        else:
            context_summary = self._build_financial_context(user_financial_data)
            if context_summary:
                return f"This is a mock AI reply for demo. To enable full AI functionality, please configure your GEMINI_API_KEY in the .env file.\n\nI have access to your financial data including assets, liabilities, goals, budget, transactions, and investments. All amounts shown are in Indian Rupees (₹).\n\nHow can I help you with your finances today?"
            else:
                return "This is a mock AI reply for demo. To enable full AI functionality, please configure your GEMINI_API_KEY in the .env file. I'm here to help with your personal finance questions! All amounts shown are in Indian Rupees (₹)."


