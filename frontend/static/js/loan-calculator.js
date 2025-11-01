// Loan Calculator JavaScript functionality

let loanCalculatorData = null;

// Initialize loan calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadLoanPresets();
    setupLoanCalculatorHandlers();
});

// Load loan calculator presets from backend
async function loadLoanPresets() {
    try {
        const result = await apiRequest('/finance/get_loan_presets');
        loanCalculatorData = result.data || [];
        
        // Populate preset selector if it exists
        const presetSelect = document.getElementById('loanPresetSelect');
        if (presetSelect && loanCalculatorData.length > 0) {
            presetSelect.innerHTML = '<option value="">Select Loan Type</option>';
            loanCalculatorData.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                presetSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading loan presets:', error);
    }
}

// Setup loan calculator form handlers
function setupLoanCalculatorHandlers() {
    const form = document.getElementById('loanCalculatorForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateEMI();
        });
    }
    
    // Preset selector change handler
    const presetSelect = document.getElementById('loanPresetSelect');
    if (presetSelect) {
        presetSelect.addEventListener('change', function() {
            const presetName = this.value;
            if (presetName && loanCalculatorData) {
                const preset = loanCalculatorData.find(p => p.name === presetName);
                if (preset) {
                    document.getElementById('loanPrincipal').value = preset.min_amount;
                    document.getElementById('loanRate').value = preset.default_rate;
                    document.getElementById('loanTenure').value = preset.min_tenure * 12;
                    updateTenureSlider();
                }
            }
        });
    }
    
    // Real-time calculation on input change
    const inputs = ['loanPrincipal', 'loanRate', 'loanTenure'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (this.value && !isNaN(this.value)) {
                    calculateEMI();
                }
            });
        }
    });
    
    // Tenure slider handler
    const tenureSlider = document.getElementById('loanTenureSlider');
    if (tenureSlider) {
        tenureSlider.addEventListener('input', function() {
            const months = parseInt(this.value);
            document.getElementById('loanTenure').value = months;
            updateTenureDisplay(months);
            calculateEMI();
        });
    }
}

// Calculate EMI
async function calculateEMI() {
    const principal = parseFloat(document.getElementById('loanPrincipal')?.value || 0);
    const annualRate = parseFloat(document.getElementById('loanRate')?.value || 0);
    const tenureMonths = parseInt(document.getElementById('loanTenure')?.value || 0);
    
    if (!principal || !annualRate || !tenureMonths) {
        return;
    }
    
    try {
        const result = await apiRequest('/finance/calculate_emi', 'POST', {
            principal: principal,
            annual_rate: annualRate,
            tenure_months: tenureMonths
        });
        
        if (result.data) {
            displayEMIResult(result.data);
        }
    } catch (error) {
        console.error('Error calculating EMI:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to calculate EMI', 'error');
        }
    }
}

// Display EMI calculation results
function displayEMIResult(data) {
    // Update summary cards
    updateElement('emiAmount', '₹' + data.emi.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    updateElement('totalAmount', '₹' + data.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    updateElement('totalInterest', '₹' + data.total_interest.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    updateElement('interestPercentage', data.interest_percentage + '%');
    
    // Update progress indicators
    const principalPercent = (data.principal / data.total_amount * 100).toFixed(1);
    const interestPercent = (data.total_interest / data.total_amount * 100).toFixed(1);
    
    // Display amortization schedule
    if (data.schedule && data.schedule.length > 0) {
        displayAmortizationSchedule(data.schedule.slice(0, 12)); // Show first 12 months
    }
    
    // Show results section
    const resultsSection = document.getElementById('emiResultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
}

// Display amortization schedule table
function displayAmortizationSchedule(schedule) {
    const container = document.getElementById('amortizationSchedule');
    if (!container) return;
    
    if (schedule.length === 0) {
        container.innerHTML = '<p>No schedule data available</p>';
        return;
    }
    
    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                <thead>
                    <tr style="background: var(--bg-tertiary); border-bottom: 2px solid var(--border-primary);">
                        <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Month</th>
                        <th style="padding: 0.75rem; text-align: right; font-weight: 600;">EMI</th>
                        <th style="padding: 0.75rem; text-align: right; font-weight: 600;">Principal</th>
                        <th style="padding: 0.75rem; text-align: right; font-weight: 600;">Interest</th>
                        <th style="padding: 0.75rem; text-align: right; font-weight: 600;">Balance</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    schedule.forEach(month => {
        html += `
            <tr style="border-bottom: 1px solid var(--border-primary);">
                <td style="padding: 0.75rem;">${month.month}</td>
                <td style="padding: 0.75rem; text-align: right;">₹${month.emi.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td style="padding: 0.75rem; text-align: right; color: var(--accent-success);">₹${month.principal_payment.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td style="padding: 0.75rem; text-align: right; color: var(--accent-danger);">₹${month.interest_payment.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td style="padding: 0.75rem; text-align: right;">₹${month.remaining_principal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Calculate prepayment savings
async function calculatePrepaymentSavings() {
    const principal = parseFloat(document.getElementById('prepayPrincipal')?.value || 0);
    const annualRate = parseFloat(document.getElementById('prepayRate')?.value || 0);
    const tenureMonths = parseInt(document.getElementById('prepayTenure')?.value || 0);
    const prepaymentAmount = parseFloat(document.getElementById('prepaymentAmount')?.value || 0);
    const prepaymentMonth = parseInt(document.getElementById('prepaymentMonth')?.value || 0);
    
    if (!principal || !annualRate || !tenureMonths || !prepaymentAmount || !prepaymentMonth) {
        if (typeof toast !== 'undefined') {
            toast.error('Please fill all fields', 'error');
        }
        return;
    }
    
    try {
        const result = await apiRequest('/finance/calculate_prepayment', 'POST', {
            principal: principal,
            annual_rate: annualRate,
            tenure_months: tenureMonths,
            prepayment_amount: prepaymentAmount,
            prepayment_month: prepaymentMonth
        });
        
        if (result.data) {
            displayPrepaymentResult(result.data);
        }
    } catch (error) {
        console.error('Error calculating prepayment:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to calculate prepayment savings', 'error');
        }
    }
}

// Display prepayment savings results
function displayPrepaymentResult(data) {
    updateElement('prepayInterestSaved', '₹' + data.interest_saved.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    updateElement('prepaySavingsPercentage', data.savings_percentage + '%');
    updateElement('prepayMonthsReduced', data.months_reduced);
    
    const prepayResultsSection = document.getElementById('prepaymentResultsSection');
    if (prepayResultsSection) {
        prepayResultsSection.style.display = 'block';
    }
}

// Calculate affordability
async function calculateAffordability() {
    const monthlyIncome = parseFloat(document.getElementById('affordabilityIncome')?.value || 0);
    const monthlyExpenses = parseFloat(document.getElementById('affordabilityExpenses')?.value || 0);
    const emiRatio = parseFloat(document.getElementById('affordabilityRatio')?.value || 0.4);
    
    if (!monthlyIncome || monthlyExpenses < 0) {
        if (typeof toast !== 'undefined') {
            toast.error('Please enter valid income and expenses', 'error');
        }
        return;
    }
    
    try {
        const result = await apiRequest('/finance/calculate_affordability', 'POST', {
            monthly_income: monthlyIncome,
            monthly_expenses: monthlyExpenses,
            emi_to_income_ratio: emiRatio
        });
        
        if (result.data) {
            displayAffordabilityResult(result.data);
        }
    } catch (error) {
        console.error('Error calculating affordability:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Failed to calculate affordability', 'error');
        }
    }
}

// Display affordability results
function displayAffordabilityResult(data) {
    updateElement('affordabilityEMI', '₹' + data.max_affordable_emi.toLocaleString('en-IN', {minimumFractionDigits: 2}));
    updateElement('affordabilityRecommendation', data.recommendation);
    
    const affordabilityResultsSection = document.getElementById('affordabilityResultsSection');
    if (affordabilityResultsSection) {
        affordabilityResultsSection.style.display = 'block';
    }
}

// Update tenure display (years/months)
function updateTenureDisplay(months) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const display = document.getElementById('tenureDisplay');
    if (display) {
        let text = '';
        if (years > 0) {
            text += years + ' year' + (years > 1 ? 's' : '');
        }
        if (remainingMonths > 0) {
            if (years > 0) text += ' ';
            text += remainingMonths + ' month' + (remainingMonths > 1 ? 's' : '');
        }
        display.textContent = text || '0 months';
    }
}

// Update tenure slider when input changes
function updateTenureSlider() {
    const tenureInput = document.getElementById('loanTenure');
    const tenureSlider = document.getElementById('loanTenureSlider');
    if (tenureInput && tenureSlider) {
        const months = parseInt(tenureInput.value) || 0;
        tenureSlider.value = months;
        updateTenureDisplay(months);
    }
}

// Format currency input
function formatCurrencyInput(input) {
    input.addEventListener('input', function() {
        let value = this.value.replace(/[^\d.]/g, '');
        if (value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                this.value = numValue.toLocaleString('en-IN');
            }
        }
    });
}

// Setup currency formatters
document.addEventListener('DOMContentLoaded', function() {
    const currencyInputs = document.querySelectorAll('.currency-input');
    currencyInputs.forEach(input => {
        formatCurrencyInput(input);
    });
});

// Export functions globally
window.calculateEMI = calculateEMI;
window.calculatePrepaymentSavings = calculatePrepaymentSavings;
window.calculateAffordability = calculateAffordability;
window.loadLoanPresets = loadLoanPresets;

