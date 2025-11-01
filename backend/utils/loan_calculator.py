"""
Loan Calculator Utilities
Provides functions for calculating EMI, interest, and loan-related metrics
"""

import math
from typing import Dict, List, Optional


def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> Dict:
    """
    Calculate EMI (Equated Monthly Installment) using the formula:
    EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
    
    Where:
    P = Principal loan amount
    R = Monthly interest rate (annual rate / 12 / 100)
    N = Loan tenure in months
    
    Args:
        principal: Loan principal amount
        annual_rate: Annual interest rate in percentage
        tenure_months: Loan tenure in months
    
    Returns:
        Dictionary with EMI, total amount, total interest, and breakdown
    """
    if principal <= 0 or annual_rate < 0 or tenure_months <= 0:
        return {
            "error": "Invalid input: principal, rate, and tenure must be positive"
        }
    
    # Convert annual rate to monthly rate (as decimal)
    monthly_rate = annual_rate / 12 / 100
    
    # Calculate EMI
    if monthly_rate == 0:
        emi = principal / tenure_months
    else:
        emi = (principal * monthly_rate * (1 + monthly_rate) ** tenure_months) / \
              ((1 + monthly_rate) ** tenure_months - 1)
    
    total_amount = emi * tenure_months
    total_interest = total_amount - principal
    
    # Generate amortization schedule
    schedule = generate_amortization_schedule(principal, annual_rate, tenure_months, emi)
    
    return {
        "emi": round(emi, 2),
        "principal": round(principal, 2),
        "annual_rate": annual_rate,
        "monthly_rate": round(monthly_rate * 100, 4),
        "tenure_months": tenure_months,
        "tenure_years": round(tenure_months / 12, 2),
        "total_amount": round(total_amount, 2),
        "total_interest": round(total_interest, 2),
        "interest_percentage": round((total_interest / principal) * 100, 2),
        "schedule": schedule
    }


def generate_amortization_schedule(principal: float, annual_rate: float, 
                                   tenure_months: int, emi: float) -> List[Dict]:
    """
    Generate amortization schedule showing principal and interest breakdown
    
    Args:
        principal: Loan principal amount
        annual_rate: Annual interest rate in percentage
        tenure_months: Loan tenure in months
        emi: Monthly EMI amount
    
    Returns:
        List of dictionaries with monthly breakdown
    """
    schedule = []
    remaining_principal = principal
    monthly_rate = annual_rate / 12 / 100
    
    for month in range(1, tenure_months + 1):
        interest_payment = remaining_principal * monthly_rate
        principal_payment = emi - interest_payment
        
        # Adjust last payment to handle rounding
        if month == tenure_months:
            principal_payment = remaining_principal
            emi = principal_payment + interest_payment
        
        remaining_principal -= principal_payment
        
        schedule.append({
            "month": month,
            "emi": round(emi, 2),
            "principal_payment": round(principal_payment, 2),
            "interest_payment": round(interest_payment, 2),
            "remaining_principal": round(max(0, remaining_principal), 2),
            "total_paid": round((emi * month), 2),
            "total_interest_paid": round((emi * month) - (principal - max(0, remaining_principal)), 2)
        })
    
    return schedule


def calculate_interest_only(principal: float, annual_rate: float, 
                           tenure_months: int) -> Dict:
    """
    Calculate interest-only loan payments
    
    Args:
        principal: Loan principal amount
        annual_rate: Annual interest rate in percentage
        tenure_months: Loan tenure in months
    
    Returns:
        Dictionary with monthly interest payment and total interest
    """
    if principal <= 0 or annual_rate < 0 or tenure_months <= 0:
        return {"error": "Invalid input"}
    
    monthly_rate = annual_rate / 12 / 100
    monthly_interest = principal * monthly_rate
    total_interest = monthly_interest * tenure_months
    
    return {
        "monthly_payment": round(monthly_interest, 2),
        "principal": round(principal, 2),
        "annual_rate": annual_rate,
        "tenure_months": tenure_months,
        "total_interest": round(total_interest, 2)
    }


def calculate_prepayment_savings(principal: float, annual_rate: float,
                                 tenure_months: int, prepayment_amount: float,
                                 prepayment_month: int) -> Dict:
    """
    Calculate savings from loan prepayment
    
    Args:
        principal: Original loan principal
        annual_rate: Annual interest rate in percentage
        tenure_months: Original loan tenure in months
        prepayment_amount: Amount to prepay
        prepayment_month: Month in which prepayment is made
    
    Returns:
        Dictionary with savings information
    """
    # Calculate original loan details
    original = calculate_emi(principal, annual_rate, tenure_months)
    original_total_interest = original["total_interest"]
    
    # Calculate new loan details after prepayment
    remaining_principal = principal
    monthly_rate = annual_rate / 12 / 100
    original_emi = original["emi"]
    
    # Simulate payments up to prepayment month
    for month in range(1, prepayment_month + 1):
        if month <= tenure_months:
            interest_payment = remaining_principal * monthly_rate
            principal_payment = original_emi - interest_payment
            remaining_principal -= principal_payment
    
    # Apply prepayment
    remaining_principal -= prepayment_amount
    remaining_months = tenure_months - prepayment_month
    
    if remaining_principal <= 0:
        # Loan fully paid off
        new_total_interest = original_total_interest
        for month in range(1, prepayment_month + 1):
            if month <= tenure_months:
                interest = (principal - (month - 1) * (original_emi - principal * monthly_rate)) * monthly_rate
                new_total_interest -= interest
    else:
        # Calculate new EMI for remaining amount
        new_loan = calculate_emi(remaining_principal, annual_rate, remaining_months)
        new_total_interest = sum([
            schedule["interest_payment"] 
            for schedule in generate_amortization_schedule(
                principal, annual_rate, prepayment_month, original_emi
            )
        ]) + new_loan["total_interest"]
    
    interest_saved = original_total_interest - new_total_interest
    new_tenure_months = prepayment_month + (remaining_months if remaining_principal > 0 else 0)
    
    return {
        "prepayment_amount": round(prepayment_amount, 2),
        "prepayment_month": prepayment_month,
        "original_total_interest": round(original_total_interest, 2),
        "new_total_interest": round(new_total_interest, 2),
        "interest_saved": round(interest_saved, 2),
        "savings_percentage": round((interest_saved / original_total_interest) * 100, 2),
        "original_tenure_months": tenure_months,
        "new_tenure_months": new_tenure_months,
        "months_reduced": tenure_months - new_tenure_months
    }


def compare_loans(loans: List[Dict]) -> Dict:
    """
    Compare multiple loan options
    
    Args:
        loans: List of loan dictionaries with principal, rate, tenure
    
    Returns:
        Comparison results
    """
    results = []
    
    for loan in loans:
        principal = loan.get("principal", 0)
        rate = loan.get("annual_rate", 0)
        tenure_months = loan.get("tenure_months", 0)
        
        calculation = calculate_emi(principal, rate, tenure_months)
        if "error" not in calculation:
            results.append({
                "loan_name": loan.get("name", f"Loan {len(results) + 1}"),
                "principal": principal,
                "annual_rate": rate,
                "tenure_months": tenure_months,
                "emi": calculation["emi"],
                "total_amount": calculation["total_amount"],
                "total_interest": calculation["total_interest"],
                "interest_percentage": calculation["interest_percentage"]
            })
    
    # Sort by EMI
    results.sort(key=lambda x: x["emi"])
    
    return {
        "comparison": results,
        "best_emi": results[0] if results else None,
        "best_total_interest": min(results, key=lambda x: x["total_interest"]) if results else None
    }


def calculate_affordability(monthly_income: float, monthly_expenses: float,
                           emi_to_income_ratio: float = 0.4) -> Dict:
    """
    Calculate maximum affordable loan amount based on income
    
    Args:
        monthly_income: Monthly income
        monthly_expenses: Monthly expenses (excluding potential EMI)
        emi_to_income_ratio: Maximum EMI as percentage of income (default 40%)
    
    Returns:
        Dictionary with affordability calculations
    """
    if monthly_income <= 0:
        return {"error": "Invalid income"}
    
    available_for_emi = monthly_income - monthly_expenses
    max_emi_by_ratio = monthly_income * emi_to_income_ratio
    max_affordable_emi = min(available_for_emi, max_emi_by_ratio)
    
    return {
        "monthly_income": round(monthly_income, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "available_for_emi": round(available_for_emi, 2),
        "max_emi_ratio": emi_to_income_ratio,
        "max_affordable_emi": round(max_affordable_emi, 2),
        "recommendation": f"Your EMI should not exceed ₹{max_affordable_emi:,.2f}"
    }

