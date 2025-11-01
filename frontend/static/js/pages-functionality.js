// Complete functionality for all dashboard pages

// Initialize page when it loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for page to be loaded dynamically
    setTimeout(initializePages, 500);
});

// Track which pages have been initialized to prevent duplicate initialization
const initializedPages = new Set();

// Initialize page-specific functionality
function initializePages() {
    // Check which page section is currently active
    const activePageSection = document.querySelector('.page-section.active');
    if (!activePageSection) {
        return; // No active page section, don't initialize
    }
    
    // Analytics page
    if (document.getElementById('monthlyTrendChart') && !initializedPages.has('analytics')) {
        loadAnalyticsData();
        initializedPages.add('analytics');
    }
    
    // Budget page
    if (document.getElementById('totalBudget') && !initializedPages.has('budget')) {
        loadBudgetData();
        setupBudgetHandlers();
        initializedPages.add('budget');
    }
    
    // Investments page
    if (document.getElementById('totalInvestments') && !initializedPages.has('investments')) {
        loadInvestmentsData();
        setupInvestmentHandlers();
        initializedPages.add('investments');
    }
    
    // Transactions page
    if (document.getElementById('totalTransactions') && !initializedPages.has('transactions')) {
        loadTransactionsData();
        setupTransactionHandlers();
        initializedPages.add('transactions');
    }
    
    // Goals page
    if (document.getElementById('totalGoals') && !initializedPages.has('goals')) {
        loadGoalsPageData();
        initializedPages.add('goals');
    }
    
    // Reports page
    if (document.getElementById('reportForm') && !initializedPages.has('reports')) {
        setupReportHandlers();
        initializedPages.add('reports');
    }
    
    // Insights page
    if (document.getElementById('detailedInsights') && !initializedPages.has('insights')) {
        loadInsightsPageData();
        initializedPages.add('insights');
    }
    
    // Profile page
    if (document.getElementById('profileForm') && !initializedPages.has('profile')) {
        loadProfileData();
        setupProfileHandlers();
        initializedPages.add('profile');
    }
    
    // Settings page
    if (document.getElementById('settingsForm') && !initializedPages.has('settings')) {
        loadSettingsData();
        setupSettingsHandlers();
        initializedPages.add('settings');
    }
    
    // Loan Calculator page
    if (document.getElementById('loanCalculatorForm') && !initializedPages.has('loan-calculator')) {
        if (typeof loadLoanPresets === 'function') {
            loadLoanPresets();
        }
        if (typeof setupLoanCalculatorHandlers === 'function') {
            setupLoanCalculatorHandlers();
        }
        initializedPages.add('loan-calculator');
    }
}

// Function to clear page initialization tracking (called when switching pages)
window.clearPageInitialization = function() {
    initializedPages.clear();
};

// Global cache for financial data to prevent duplicate API calls
let financialDataCache = null;
let financialDataCacheTime = null;
const FINANCIAL_DATA_CACHE_DURATION = 30000; // 30 seconds cache

// Function to get financial data with caching
async function getFinancialData(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached data if it exists and is fresh, unless force refresh
    if (!forceRefresh && financialDataCache && financialDataCacheTime && 
        (now - financialDataCacheTime) < FINANCIAL_DATA_CACHE_DURATION) {
        return financialDataCache;
    }
    
    try {
        const result = await apiRequest('/finance/get_data');
        financialDataCache = result.data || {};
        financialDataCacheTime = now;
        return financialDataCache;
    } catch (error) {
        console.error('Error fetching financial data:', error);
        // Return cached data if available, even if stale
        if (financialDataCache) {
            return financialDataCache;
        }
        throw error;
    }
}

// ========== ANALYTICS PAGE ==========
async function loadAnalyticsData() {
    try {
        const data = await getFinancialData();
        const assets = data.assets || {};
        const liabilities = data.liabilities || {};
        const goals = data.goals || [];
        
        const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0);
        const totalLiabilities = (liabilities.loan || 0) + (liabilities.credit_card_due || 0);
        const netWorth = totalAssets - totalLiabilities;
        
        // Calculate metrics
        const growthRate = totalAssets > 0 ? Math.round((netWorth / totalAssets) * 100) : 0;
        const savingsRate = totalAssets > 0 ? Math.round(((assets.savings || 0) / totalAssets) * 100) : 0;
        const debtRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0;
        const roiEstimate = (assets.mutual_funds || 0) + (assets.stocks || 0) > 0 ? 8 : 0; // Estimated ROI
        
        // Update stat cards
        updateElement('analyticsGrowth', growthRate + '%');
        updateElement('analyticsSavingsRate', savingsRate + '%');
        updateElement('analyticsDebtRatio', debtRatio + '%');
        updateElement('analyticsROI', roiEstimate + '%');
        
        // Update performance metrics
        updateElement('assetGrowthVal', '+₹' + totalAssets.toLocaleString());
        updateElement('investmentPerfVal', '+₹' + ((assets.mutual_funds || 0) + (assets.stocks || 0)).toLocaleString());
        const avgGoalProgress = goals.length > 0 
            ? Math.round(goals.reduce((sum, g) => {
                const progress = totalAssets > 0 && g.target > 0 ? Math.min(100, (totalAssets / g.target) * 100) : 0;
                return sum + progress;
            }, 0) / goals.length)
            : 0;
        updateElement('goalProgressVal', avgGoalProgress + '%');
        
        // Create charts
        createMonthlyTrendChart(totalAssets, totalLiabilities, netWorth);
        createCategoryBreakdownChart(assets);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function createMonthlyTrendChart(assets, liabilities, netWorth) {
    const ctx = document.getElementById('monthlyTrendChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    // Mock monthly data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const assetData = months.map(() => assets + Math.random() * assets * 0.1);
    const liabilityData = months.map(() => liabilities + Math.random() * liabilities * 0.1);
    const netWorthData = assetData.map((a, i) => a - liabilityData[i]);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Assets',
                data: assetData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }, {
                label: 'Net Worth',
                data: netWorthData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function createCategoryBreakdownChart(assets) {
    const ctx = document.getElementById('categoryBreakdownChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Savings', 'Mutual Funds', 'Stocks'],
            datasets: [{
                data: [
                    assets.savings || 0,
                    assets.mutual_funds || 0,
                    assets.stocks || 0
                ],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function loadAnalyticsPeriod(period) {
    const periods = {
        week: 'This Week',
        month: 'This Month',
        year: 'This Year'
    };
    document.getElementById('periodAnalysis').innerHTML = `
        <div style="padding: 1rem;">
            <h4>${periods[period]} Analysis</h4>
            <p style="color: var(--text-tertiary); margin-top: 1rem;">
                Analysis for ${periods[period]} will be displayed here. This feature analyzes your financial trends over the selected period.
            </p>
        </div>
    `;
}

// ========== BUDGET PAGE ==========
async function loadBudgetData() {
    // Mock budget data
    const totalBudget = 50000;
    const budgetSpent = 32000;
    const budgetRemaining = ((totalBudget - budgetSpent) / totalBudget * 100).toFixed(0);
    
    updateElement('totalBudget', '₹' + totalBudget.toLocaleString());
    updateElement('budgetSpent', '₹' + budgetSpent.toLocaleString());
    updateElement('budgetRemaining', budgetRemaining + '%');
    
    // Create budget chart
    const ctx = document.getElementById('budgetChart');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'],
                datasets: [{
                    label: 'Budget',
                    data: [10000, 8000, 12000, 15000, 5000],
                    backgroundColor: '#10b981'
                }, {
                    label: 'Spent',
                    data: [6500, 7200, 9000, 15000, 3300],
                    backgroundColor: '#f59e0b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

function setupBudgetHandlers() {
    const addBtn = document.getElementById('addBudgetCategoryBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            showBudgetCategoryModal();
        });
    }
}

function showBudgetCategoryModal() {
    document.getElementById('addBudgetCategoryModal').style.display = 'flex';
    
    // Setup form handler
    const form = document.getElementById('addBudgetCategoryFormModal');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('budgetCategoryNameModal').value;
            const amount = parseFloat(document.getElementById('budgetCategoryAmountModal').value);
            
            // Add to budget categories list
            const container = document.getElementById('budgetCategoriesList');
            if (container && container.querySelector('p')) {
                container.innerHTML = '';
            }
            
            const categoryItem = document.createElement('div');
            categoryItem.style.cssText = 'padding: 1rem; border-bottom: 1px solid var(--border-primary);';
            categoryItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${name}</strong>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                            Budget: ₹${amount.toLocaleString()}
                        </div>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="this.closest('div').remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            if (container) {
                container.appendChild(categoryItem);
            }
            
            toast.success('Budget category added!', 'success');
            closeModal('addBudgetCategoryModal');
            form.reset();
        });
    }
}

// ========== INVESTMENTS PAGE ==========
async function loadInvestmentsData() {
    try {
        const data = await getFinancialData();
        const assets = data.assets || {};
        
        const mutualFunds = assets.mutual_funds || 0;
        const stocks = assets.stocks || 0;
        const savings = assets.savings || 0;
        const totalInvestments = mutualFunds + stocks;
        const estimatedReturns = Math.round(totalInvestments * 0.08); // 8% estimated return
        const roi = totalInvestments > 0 ? 8 : 0;
        const investmentCount = (mutualFunds > 0 ? 1 : 0) + (stocks > 0 ? 1 : 0) + (savings > 0 ? 1 : 0);
        
        updateElement('totalInvestments', '₹' + totalInvestments.toLocaleString());
        updateElement('investmentReturns', '₹' + estimatedReturns.toLocaleString());
        updateElement('investmentROI', roi + '%');
        updateElement('investmentCount', investmentCount);
        
        updateElement('mutualFundsInvestment', '₹' + mutualFunds.toLocaleString());
        updateElement('mutualFundsReturn', '+' + roi + '%');
        updateElement('stocksInvestment', '₹' + stocks.toLocaleString());
        updateElement('stocksReturn', '+' + roi + '%');
        updateElement('savingsInvestment', '₹' + savings.toLocaleString());
        updateElement('savingsReturn', '+4%');
        
        // Create investment distribution chart
        const ctx = document.getElementById('investmentDistributionChart');
        if (ctx && typeof Chart !== 'undefined') {
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Mutual Funds', 'Stocks', 'Savings'],
                    datasets: [{
                        data: [mutualFunds, stocks, savings],
                        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
        
        // Create performance chart
        const perfCtx = document.getElementById('investmentPerformanceChart');
        if (perfCtx && typeof Chart !== 'undefined') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            new Chart(perfCtx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Portfolio Value',
                        data: months.map(() => totalInvestments + Math.random() * totalInvestments * 0.15),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading investments:', error);
    }
}

function setupInvestmentHandlers() {
    const addBtn = document.getElementById('addInvestmentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            toast.info('Investment tracking feature coming soon!', 'info');
        });
    }
}

// ========== TRANSACTIONS PAGE ==========
async function loadTransactionsData() {
    // Load transactions from localStorage or use mock data
    let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    // If no transactions, use mock data for demo
    if (transactions.length === 0) {
        transactions = [
            { type: 'income', category: 'salary', amount: 50000, date: '2024-01-15', description: 'Monthly Salary', id: 1 },
            { type: 'expense', category: 'food', amount: 2500, date: '2024-01-16', description: 'Grocery Shopping', id: 2 },
            { type: 'expense', category: 'transport', amount: 1500, date: '2024-01-17', description: 'Fuel & Transport', id: 3 },
            { type: 'expense', category: 'bills', amount: 5000, date: '2024-01-18', description: 'Electricity Bill', id: 4 },
            { type: 'income', category: 'investment', amount: 3200, date: '2024-01-19', description: 'Investment Returns', id: 5 }
        ];
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    // Apply filters
    const typeFilter = document.getElementById('transactionTypeFilter')?.value || 'all';
    const categoryFilter = document.getElementById('transactionCategoryFilter')?.value || 'all';
    const dateFilter = document.getElementById('transactionDateFilter')?.value || 'all';
    
    let filteredTransactions = transactions;
    
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    if (dateFilter !== 'all') {
        const now = new Date();
        filteredTransactions = filteredTransactions.filter(t => {
            const tDate = new Date(t.date);
            switch(dateFilter) {
                case 'today':
                    return tDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return tDate >= weekAgo;
                case 'month':
                    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                case 'year':
                    return tDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }
    
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpenses;
    
    updateElement('totalIncome', '₹' + totalIncome.toLocaleString());
    updateElement('totalExpenses', '₹' + totalExpenses.toLocaleString());
    updateElement('totalTransactions', filteredTransactions.length);
    updateElement('netTransaction', '₹' + netAmount.toLocaleString());
    
    displayTransactions(filteredTransactions);
    
    // Setup filter handlers
    setupTransactionFilters();
}

function displayTransactions(transactions) {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">No transactions found.</p>';
        return;
    }
    
    let html = '';
    transactions.forEach(t => {
        const isIncome = t.type === 'income';
        const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
        const color = isIncome ? 'var(--accent-success)' : 'var(--accent-danger)';
        const sign = isIncome ? '+' : '-';
        
        html += `
            <div style="padding: 1rem; border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 1rem; align-items: center; flex: 1;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}20; display: flex; align-items: center; justify-content: center;">
                        <i class="fas ${icon}" style="color: ${color};"></i>
                    </div>
                    <div style="flex: 1;">
                        <strong>${t.description}</strong>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                            <span style="text-transform: capitalize;">${t.category}</span> • ${new Date(t.date).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: ${color};">
                    ${sign}₹${t.amount.toLocaleString()}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function setupTransactionHandlers() {
    const addBtn = document.getElementById('addTransactionBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            showAddTransactionModal();
        });
    }
}

function showAddTransactionModal() {
    document.getElementById('addTransactionModal').style.display = 'flex';
    
    // Set default date to today
    document.getElementById('transactionDateModal').value = new Date().toISOString().split('T')[0];
    
    // Setup form handler
    const form = document.getElementById('addTransactionFormModal');
    if (form) {
        // Remove old listener if exists
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const transaction = {
                type: document.getElementById('transactionTypeModal').value,
                category: document.getElementById('transactionCategoryModal').value,
                amount: parseFloat(document.getElementById('transactionAmountModal').value),
                description: document.getElementById('transactionDescriptionModal').value,
                date: document.getElementById('transactionDateModal').value
            };
            
            // Store in localStorage (mock)
            let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            transactions.push({...transaction, id: Date.now()});
            localStorage.setItem('transactions', JSON.stringify(transactions));
            
            toast.success('Transaction added successfully!', 'success');
            closeModal('addTransactionModal');
            loadTransactionsData();
        });
    }
}

function setupTransactionFilters() {
    const typeFilter = document.getElementById('transactionTypeFilter');
    const categoryFilter = document.getElementById('transactionCategoryFilter');
    const dateFilter = document.getElementById('transactionDateFilter');
    
    [typeFilter, categoryFilter, dateFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', function() {
                loadTransactionsData(); // Reload with filters
            });
        }
    });
}

// ========== GOALS PAGE ==========
async function loadGoalsPageData() {
    try {
        const data = await getFinancialData();
        const goals = data.goals || [];
        const assets = data.assets || {};
        const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0);
        
        updateElement('totalGoals', goals.length);
        const completedGoals = goals.filter(g => totalAssets >= g.target).length;
        updateElement('completedGoals', completedGoals);
        updateElement('activeGoals', goals.length - completedGoals);
        
        const avgProgress = goals.length > 0
            ? Math.round(goals.reduce((sum, g) => {
                const progress = totalAssets > 0 && g.target > 0 ? Math.min(100, (totalAssets / g.target) * 100) : 0;
                return sum + progress;
            }, 0) / goals.length)
            : 0;
        updateElement('goalsProgressAvg', avgProgress + '%');
        
        // Display goals
        const container = document.getElementById('goalsPageList');
        if (container) {
            if (goals.length === 0) {
                container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">No goals set yet.</p>';
            } else {
                let html = '';
                goals.forEach((goal, index) => {
                    const progress = totalAssets > 0 && goal.target > 0 ? Math.min(100, (totalAssets / goal.target) * 100) : 0;
                    const yearsRemaining = Math.max(0, goal.year - new Date().getFullYear());
                    
                    html += `
                        <div style="padding: 1.5rem; border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-tertiary); margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 0.5rem 0;"><i class="fas fa-bullseye" style="color: var(--accent-cyan); margin-right: 0.5rem;"></i>${goal.name}</h4>
                                    <div style="font-size: 0.875rem; color: var(--text-tertiary);">
                                        Target: ₹${goal.target.toLocaleString()} by ${goal.year} • ${yearsRemaining} years remaining
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-cyan);">${progress}%</div>
                                </div>
                            </div>
                            <div style="background: var(--bg-elevated); border-radius: var(--radius-md); height: 10px; overflow: hidden; margin-bottom: 0.75rem;">
                                <div style="background: var(--gradient-primary); height: 100%; width: ${progress}%; transition: width 0.5s ease;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--text-tertiary);">
                                <span>Progress: ₹${Math.min(totalAssets, goal.target).toLocaleString()} / ₹${goal.target.toLocaleString()}</span>
                                <span>Remaining: ₹${Math.max(0, goal.target - totalAssets).toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            }
        }
        
        // Create goals progress chart
        const ctx = document.getElementById('goalsProgressChart');
        if (ctx && typeof Chart !== 'undefined' && goals.length > 0) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: goals.map(g => g.name),
                    datasets: [{
                        label: 'Progress %',
                        data: goals.map(g => {
                            return totalAssets > 0 && g.target > 0 ? Math.min(100, (totalAssets / g.target) * 100) : 0;
                        }),
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading goals page:', error);
    }
}

// ========== REPORTS PAGE ==========
function setupReportHandlers() {
    const form = document.getElementById('reportForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const reportType = document.getElementById('reportType').value;
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            const format = document.getElementById('reportFormat').value;
            
            try {
                const data = await getFinancialData();
                
                // Generate report based on type
                let reportData = {};
                switch(reportType) {
                    case 'summary':
                        reportData = {
                            type: 'Financial Summary',
                            period: `${startDate} to ${endDate}`,
                            assets: data.assets || {},
                            liabilities: data.liabilities || {},
                            netWorth: ((data.assets?.savings || 0) + (data.assets?.mutual_funds || 0) + (data.assets?.stocks || 0)) - 
                                     ((data.liabilities?.loan || 0) + (data.liabilities?.credit_card_due || 0))
                        };
                        break;
                    case 'goals':
                        reportData = {
                            type: 'Goals Progress Report',
                            period: `${startDate} to ${endDate}`,
                            goals: data.goals || []
                        };
                        break;
                    case 'investments':
                        reportData = {
                            type: 'Investment Report',
                            period: `${startDate} to ${endDate}`,
                            investments: data.assets || {}
                        };
                        break;
                    default:
                        reportData = data;
                }
                
                // Download report
                if (format === 'json') {
                    downloadJSON(reportData, `report-${reportType}-${new Date().toISOString().split('T')[0]}.json`);
                } else if (format === 'csv') {
                    downloadCSV(reportData, `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
                }
                
                toast.success('Report generated and downloaded!', 'success');
                
                // Add to recent reports
                addToRecentReports(reportType, startDate, endDate);
            } catch (error) {
                toast.error('Failed to generate report', 'error');
            }
        });
    }
    
    // Set default dates
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
}

function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadCSV(data, filename) {
    let csv = 'Type,Value\n';
    if (data.assets) {
        Object.entries(data.assets).forEach(([key, value]) => {
            csv += `Asset: ${key},${value}\n`;
        });
    }
    if (data.liabilities) {
        Object.entries(data.liabilities).forEach(([key, value]) => {
            csv += `Liability: ${key},${value}\n`;
        });
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function addToRecentReports(type, startDate, endDate) {
    const container = document.getElementById('recentReportsList');
    if (container && container.querySelector('p')) {
        container.innerHTML = '';
    }
    
    const reportItem = document.createElement('div');
    reportItem.style.cssText = 'padding: 1rem; border-bottom: 1px solid var(--border-primary);';
    reportItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong><i class="fas fa-file-alt"></i> ${type.charAt(0).toUpperCase() + type.slice(1)} Report</strong>
                <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                    ${startDate} to ${endDate}
                </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="downloadReport('${type}', '${startDate}', '${endDate}')">
                <i class="fas fa-download"></i>
            </button>
        </div>
    `;
    if (container) {
        container.insertBefore(reportItem, container.firstChild);
    }
}

function exportMonthlyReport() {
    toast.info('Generating monthly report...', 'info');
    setTimeout(() => {
        const data = { type: 'Monthly Report', date: new Date().toISOString().split('T')[0] };
        downloadJSON(data, `monthly-report-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Monthly report downloaded!', 'success');
    }, 1000);
}

function exportGoalsReport() {
    toast.info('Generating goals report...', 'info');
    setTimeout(() => {
        const data = { type: 'Goals Report', date: new Date().toISOString().split('T')[0] };
        downloadJSON(data, `goals-report-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Goals report downloaded!', 'success');
    }, 1000);
}

function exportInvestmentsReport() {
    toast.info('Generating investments report...', 'info');
    setTimeout(() => {
        const data = { type: 'Investments Report', date: new Date().toISOString().split('T')[0] };
        downloadJSON(data, `investments-report-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Investments report downloaded!', 'success');
    }, 1000);
}

// ========== INSIGHTS PAGE ==========
async function loadInsightsPageData() {
    try {
        const data = await getFinancialData();
        const assets = data.assets || {};
        const liabilities = data.liabilities || {};
        const goals = data.goals || [];
        
        const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0);
        const totalLiabilities = (liabilities.loan || 0) + (liabilities.credit_card_due || 0);
        
        // Generate insights
        const insights = [];
        let warningCount = 0;
        let positiveCount = 0;
        
        // Asset allocation insights
        if (totalAssets > 0) {
            const savingsRatio = ((assets.savings || 0) / totalAssets * 100).toFixed(1);
            if (savingsRatio > 50) {
                insights.push({ type: 'warning', text: `High savings ratio (${savingsRatio}%). Consider investing more.` });
                warningCount++;
            } else {
                insights.push({ type: 'success', text: `Well-balanced asset allocation. Savings: ${savingsRatio}%` });
                positiveCount++;
            }
        }
        
        // Debt insights
        if (totalAssets > 0) {
            const debtRatio = (totalLiabilities / totalAssets * 100).toFixed(1);
            if (debtRatio > 40) {
                insights.push({ type: 'error', text: `High debt ratio (${debtRatio}%). Focus on debt reduction.` });
                warningCount++;
            } else if (debtRatio < 20) {
                insights.push({ type: 'success', text: `Excellent debt management. Debt ratio: ${debtRatio}%` });
                positiveCount++;
            }
        }
        
        // Goals insights
        if (goals.length > 0) {
            insights.push({ type: 'info', text: `You have ${goals.length} active financial goals. Keep up the good work!` });
            positiveCount++;
        }
        
        updateElement('totalInsights', insights.length);
        updateElement('warningInsights', warningCount);
        updateElement('positiveInsights', positiveCount);
        
        // Display insights
        const container = document.getElementById('detailedInsights');
        if (container) {
            if (insights.length === 0) {
                container.innerHTML = '<p style="color: var(--text-tertiary);">No insights available. Add financial data to get insights.</p>';
            } else {
                let html = '<div class="analysis-insights">';
                insights.forEach(insight => {
                    const iconMap = {
                        success: 'fa-check-circle',
                        warning: 'fa-exclamation-triangle',
                        error: 'fa-times-circle',
                        info: 'fa-info-circle'
                    };
                    html += `
                        <div class="insight-item insight-${insight.type}">
                            <i class="fas ${iconMap[insight.type]}"></i>
                            <span>${insight.text}</span>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error loading insights:', error);
    }
}

function refreshInsights() {
    toast.info('Refreshing insights...', 'info');
    setTimeout(() => {
        loadInsightsPageData();
        toast.success('Insights refreshed!', 'success');
    }, 1000);
}

// ========== PROFILE PAGE ==========
async function loadProfileData() {
    try {
        // Try to get user data from token
        const token = localStorage.getItem('token');
        if (token) {
            // Decode JWT to get user info (client-side, basic)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                updateElement('profileDisplayName', payload.name || 'User');
                updateElement('profileDisplayEmail', payload.email || 'user@example.com');
                document.getElementById('profileName').value = payload.name || '';
                document.getElementById('profileEmail').value = payload.email || '';
            } catch (e) {
                console.warn('Could not decode token');
            }
        }
        
        // Mock account stats
        updateElement('accountDaysActive', '30');
        updateElement('accountDataUpdates', '5');
        const goalsData = await getFinancialData().catch(() => ({ goals: [] }));
        updateElement('accountGoalsSet', (goalsData.goals || []).length);
        updateElement('accountReportsGen', '3');
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function setupProfileHandlers() {
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('profileName').value;
            const email = document.getElementById('profileEmail').value;
            
            // Update display
            updateElement('profileDisplayName', name);
            updateElement('profileDisplayEmail', email);
            
            toast.success('Profile updated successfully!', 'success');
        });
    }
}

function showChangePasswordModal() {
    showInfoModal(
        'Change Password',
        `
        <form id="changePasswordForm">
            <div class="form-group">
                <label class="form-label">Current Password</label>
                <input type="password" class="form-control" id="currentPassword" required>
            </div>
            <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" class="form-control" id="newPassword" required>
            </div>
            <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-control" id="confirmPassword" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Change Password</button>
        </form>
        `
    );
    
    document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        
        if (newPass !== confirmPass) {
            toast.error('Passwords do not match', 'error');
            return;
        }
        
        toast.success('Password changed successfully!', 'success');
        closeModal('infoModal');
    });
}

// ========== SETTINGS PAGE ==========
function loadSettingsData() {
    // Load saved settings from localStorage
    const currency = localStorage.getItem('currency') || 'INR';
    const language = localStorage.getItem('language') || 'en';
    const dateFormat = localStorage.getItem('dateFormat') || 'DD/MM/YYYY';
    const emailNotifications = localStorage.getItem('emailNotifications') === 'true';
    const financialAlerts = localStorage.getItem('financialAlerts') !== 'false';
    const goalReminders = localStorage.getItem('goalReminders') !== 'false';
    const insightUpdates = localStorage.getItem('insightUpdates') !== 'false';
    
    if (document.getElementById('currencySetting')) document.getElementById('currencySetting').value = currency;
    if (document.getElementById('languageSetting')) document.getElementById('languageSetting').value = language;
    if (document.getElementById('dateFormatSetting')) document.getElementById('dateFormatSetting').value = dateFormat;
    if (document.getElementById('emailNotifications')) document.getElementById('emailNotifications').checked = emailNotifications;
    if (document.getElementById('financialAlerts')) document.getElementById('financialAlerts').checked = financialAlerts;
    if (document.getElementById('goalReminders')) document.getElementById('goalReminders').checked = goalReminders;
    if (document.getElementById('insightUpdates')) document.getElementById('insightUpdates').checked = insightUpdates;
}

function setupSettingsHandlers() {
    const form = document.getElementById('settingsForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const currency = document.getElementById('currencySetting').value;
            const language = document.getElementById('languageSetting').value;
            const dateFormat = document.getElementById('dateFormatSetting').value;
            
            localStorage.setItem('currency', currency);
            localStorage.setItem('language', language);
            localStorage.setItem('dateFormat', dateFormat);
            
            toast.success('General settings saved!', 'success');
        });
    }
    
    // Notification toggles
    ['emailNotifications', 'financialAlerts', 'goalReminders', 'insightUpdates'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                localStorage.setItem(id, this.checked);
                toast.success('Notification settings updated!', 'success');
            });
        }
    });
}

function showDeleteAccountModal() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        toast.error('Account deletion feature coming soon. Please contact support.', 'error');
    }
}

// ========== UTILITY FUNCTIONS ==========
function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

// Re-initialize pages when navigating - with debouncing to prevent excessive calls
let pageObserver = null;
let initializePagesTimeout = null;
if (typeof MutationObserver !== 'undefined') {
    pageObserver = new MutationObserver(function(mutations) {
        // Only trigger if actual page sections are added (not just any DOM change)
        let shouldInitialize = false;
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.classList && node.classList.contains('page-section')) {
                    shouldInitialize = true;
                }
            });
        });
        
        if (shouldInitialize) {
            // Debounce: clear previous timeout and set new one
            if (initializePagesTimeout) {
                clearTimeout(initializePagesTimeout);
            }
            initializePagesTimeout = setTimeout(function() {
                initializePages();
                initializePagesTimeout = null;
            }, 200); // Wait 200ms after DOM changes
        }
    });
    
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
        pageObserver.observe(pageContent, { childList: true, subtree: false }); // Only watch direct children, not subtree
    }
}

// Expose functions globally
window.loadAnalyticsPeriod = loadAnalyticsPeriod;
window.loadAnalyticsData = loadAnalyticsData;
window.refreshInsights = refreshInsights;
window.exportMonthlyReport = exportMonthlyReport;
window.exportGoalsReport = exportGoalsReport;
window.exportInvestmentsReport = exportInvestmentsReport;
window.showChangePasswordModal = showChangePasswordModal;
window.showDeleteAccountModal = showDeleteAccountModal;
window.saveSettings = function() {
    if (document.getElementById('settingsForm')) {
        document.getElementById('settingsForm').dispatchEvent(new Event('submit'));
    }
};

