// Complete functionality for all dashboard pages
console.log('✅ pages-functionality.js loaded successfully');

// Track which pages have been initialized to prevent duplicate initialization
const initializedPages = new Set();

// Initialize page-specific functionality - MAKE IT GLOBALLY AVAILABLE
window.initializePages = function() {
    console.log('initializePages called');
    
    // Check which page section is currently active
    const activePageSection = document.querySelector('.page-section.active');
    if (!activePageSection) {
        console.log('No active page section found');
        return; // No active page section, don't initialize
    }
    
    console.log('Active page section found, checking for page elements...');
    
    // Analytics page - check for analytics-specific elements
    const analyticsChart = document.getElementById('monthlyTrendChart');
    const analyticsGrowth = document.getElementById('analyticsGrowth');
    if ((analyticsChart || analyticsGrowth) && !initializedPages.has('analytics')) {
        console.log('Initializing Analytics page...');
        loadAnalyticsData();
        initializedPages.add('analytics');
    }
    
    // Budget page - check for budget-specific elements
    const totalBudget = document.getElementById('totalBudget');
    const budgetChart = document.getElementById('budgetChart');
    if ((totalBudget || budgetChart) && !initializedPages.has('budget')) {
        console.log('Initializing Budget page...');
        loadBudgetData();
        setupBudgetHandlers();
        initializedPages.add('budget');
    }
    
    // Investments page - check for investments-specific elements
    const totalInvestments = document.getElementById('totalInvestments');
    const investmentChart = document.getElementById('investmentDistributionChart');
    if ((totalInvestments || investmentChart) && !initializedPages.has('investments')) {
        console.log('Initializing Investments page...');
        loadInvestmentsData();
        setupInvestmentHandlers();
        initializedPages.add('investments');
    }
    
    // Transactions page - check for transactions-specific elements
    const totalTransactions = document.getElementById('totalTransactions');
    const transactionsList = document.getElementById('transactionsList');
    if ((totalTransactions || transactionsList) && !initializedPages.has('transactions')) {
        console.log('Initializing Transactions page...');
        loadTransactionsData();
        setupTransactionHandlers();
        initializedPages.add('transactions');
    }
    
    // Goals page - check for goals-specific elements
    const totalGoals = document.getElementById('totalGoals');
    const goalsPageList = document.getElementById('goalsPageList');
    const completedGoals = document.getElementById('completedGoals');
    const activeGoals = document.getElementById('activeGoals');
    
    console.log('Goals page element check:', {
        totalGoals: totalGoals !== null,
        goalsPageList: goalsPageList !== null,
        completedGoals: completedGoals !== null,
        activeGoals: activeGoals !== null,
        alreadyInitialized: initializedPages.has('goals')
    });
    
    if ((totalGoals || goalsPageList || completedGoals || activeGoals) && !initializedPages.has('goals')) {
        console.log('✅ Initializing Goals page...');
        loadGoalsPageData();
        initializedPages.add('goals');
    } else if (!initializedPages.has('goals')) {
        console.log('⚠️ Goals page elements not found yet, will retry...');
    }
    
    // Reports page - check for reports-specific elements
    const reportForm = document.getElementById('reportForm');
    if (reportForm && !initializedPages.has('reports')) {
        console.log('Initializing Reports page...');
        setupReportHandlers();
        loadReportsData();
        initializedPages.add('reports');
    }
    
    // Insights page - check for insights-specific elements
    const detailedInsights = document.getElementById('detailedInsights');
    const totalInsights = document.getElementById('totalInsights');
    if ((detailedInsights || totalInsights) && !initializedPages.has('insights')) {
        console.log('Initializing Insights page...');
        loadInsightsPageData();
        initializedPages.add('insights');
    }
    
    // Profile page - check for profile-specific elements
    const profileForm = document.getElementById('profileForm');
    if (profileForm && !initializedPages.has('profile')) {
        console.log('Initializing Profile page...');
        loadProfileData();
        setupProfileHandlers();
        initializedPages.add('profile');
    }
    
    // Settings page - check for settings-specific elements
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm && !initializedPages.has('settings')) {
        console.log('Initializing Settings page...');
        loadSettingsData();
        setupSettingsHandlers();
        initializedPages.add('settings');
    }
    
    // Loans page - check for loans-specific elements
    const loansList = document.getElementById('loansList');
    const totalLoans = document.getElementById('totalLoans');
    if ((loansList || totalLoans) && !initializedPages.has('loans')) {
        console.log('✅ Initializing Loans page...');
        loadLoansPageData();
        initializedPages.add('loans');
    }
    
    // Loan Calculator is now a modal, initialized when modal opens
    
    console.log('Page initialization complete. Initialized pages:', Array.from(initializedPages));
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

// Function to clear financial data cache
window.clearFinancialDataCache = function() {
    financialDataCache = null;
    financialDataCacheTime = null;
    console.log('✅ Financial data cache cleared');
};

// ========== ANALYTICS PAGE ==========
async function loadAnalyticsData() {
    try {
        console.log('🔄 Loading Analytics data from mock_data.json...');
        const data = await getFinancialData();
        console.log('✅ Analytics data loaded:', data);
        
        const assets = data.assets || {};
        const liabilities = data.liabilities || {};
        const goals = data.goals || [];
        const financialHealth = data.financial_health_metrics || {};
        
        // Calculate total assets including all asset types
        const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0) + 
                          (assets.real_estate || 0) + (assets.fixed_deposits || 0) + (assets.gold || 0);
        
        // Calculate total liabilities including all loan types
        const totalLiabilities = (liabilities.loan || 0) + (liabilities.home_loan || 0) + 
                                (liabilities.car_loan || 0) + (liabilities.personal_loan || 0) + 
                                (liabilities.credit_card_due || 0);
        const netWorth = totalAssets - totalLiabilities;
        
        // Use monthly trends from financial health if available
        const monthlyTrends = financialHealth.monthly_trends || [];
        const latestTrend = monthlyTrends.length > 0 ? monthlyTrends[monthlyTrends.length - 1] : null;
        
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
        updateElement('assetGrowthVal', formatCurrencyWithSign(totalAssets, true));
        updateElement('investmentPerfVal', formatCurrencyWithSign(((assets.mutual_funds || 0) + (assets.stocks || 0)), true));
        
        // Calculate goal progress properly
        const avgGoalProgress = goals.length > 0 
            ? Math.round(goals.reduce((sum, g) => {
                const current = g.current || g.current_amount || 0;
                const target = g.target || 0;
                const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                return sum + progress;
            }, 0) / goals.length)
            : 0;
        updateElement('goalProgressVal', avgGoalProgress + '%');
        
        // Create charts - use monthly trends if available
        if (monthlyTrends.length > 0) {
            createMonthlyTrendChartFromData(monthlyTrends);
        } else {
            createMonthlyTrendChart(totalAssets, totalLiabilities, netWorth);
        }
        createCategoryBreakdownChart(assets);
        
        // Load custom graphs
        await loadCustomGraphs();
        
        console.log('✅ Analytics page data rendered successfully');
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
    }
}

function createMonthlyTrendChart(assets, liabilities, netWorth) {
    const ctx = document.getElementById('monthlyTrendChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    // Don't generate fake data - show message that monthly trends data is needed
    // This function should only be called as fallback if monthly_trends data is not available
    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Show empty state message instead of random data
    ctx.parentElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-tertiary);">
            <div style="text-align: center;">
                <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>Monthly trend data not available. This chart requires monthly_trends data from mock_data.json.</p>
            </div>
        </div>
    `;
}

function createMonthlyTrendChartFromData(monthlyTrends) {
    const ctx = document.getElementById('monthlyTrendChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const months = monthlyTrends.map(t => t.month || 'Month');
    const assetData = monthlyTrends.map(t => t.assets || 0);
    const liabilityData = monthlyTrends.map(t => t.liabilities || 0);
    const netWorthData = monthlyTrends.map(t => t.net_worth || 0);
    
    ctx.chart = new Chart(ctx, {
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
                label: 'Liabilities',
                data: liabilityData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
                            return formatCurrency(value);
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
    
    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Include all asset types
    const labels = [];
    const data = [];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6'];
    
    if (assets.savings > 0) {
        labels.push('Savings');
        data.push(assets.savings);
    }
    if (assets.mutual_funds > 0) {
        labels.push('Mutual Funds');
        data.push(assets.mutual_funds);
    }
    if (assets.stocks > 0) {
        labels.push('Stocks');
        data.push(assets.stocks);
    }
    if (assets.real_estate > 0) {
        labels.push('Real Estate');
        data.push(assets.real_estate);
    }
    if (assets.fixed_deposits > 0) {
        labels.push('Fixed Deposits');
        data.push(assets.fixed_deposits);
    }
    if (assets.gold > 0) {
        labels.push('Gold');
        data.push(assets.gold);
    }
    
    ctx.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length)
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
    try {
        console.log('🔄 Loading Budget data...');
        const data = await getFinancialData();
        console.log('✅ Budget data loaded:', data);
        const budget = data.budget || {};
        
        // Get monthly income/budget
        const monthlyIncome = budget.monthly_income || budget.monthly_budget || 0;
        const budgetCategories = budget.categories || [];
        
        // Calculate totals from categories
        const totalBudget = budgetCategories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
        const budgetSpent = budgetCategories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
        const budgetRemaining = totalBudget > 0 ? ((totalBudget - budgetSpent) / totalBudget * 100).toFixed(0) : 0;
        const remainingAmount = totalBudget - budgetSpent;
        
        updateElement('totalBudget', formatCurrency(totalBudget));
        updateElement('budgetSpent', formatCurrency(budgetSpent));
        updateElement('budgetRemaining', budgetRemaining + '%');
        
        // Update monthly income if element exists
        const monthlyIncomeEl = document.getElementById('monthlyIncome');
        if (monthlyIncomeEl) {
            monthlyIncomeEl.textContent = formatCurrency(monthlyIncome);
        }
        
        // Update monthly income input if exists
        const monthlyIncomeInput = document.getElementById('monthlyIncomeInput');
        if (monthlyIncomeInput) {
            monthlyIncomeInput.value = monthlyIncome;
        }
        
        // Create budget chart with actual data
        createBudgetChart(budgetCategories);
        
        // Update budget categories list
        renderBudgetCategories(budgetCategories);
        
        console.log('✅ Budget page data rendered successfully');
    } catch (error) {
        console.error('❌ Error loading budget data:', error);
    }
}

function createBudgetChart(budgetCategories) {
    const ctx = document.getElementById('budgetChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const labels = budgetCategories.map(cat => cat.name || 'Category');
    const budgetData = budgetCategories.map(cat => cat.budget || 0);
    const spentData = budgetCategories.map(cat => cat.spent || 0);
    const colors = budgetCategories.map(cat => cat.color || '#10b981');
    
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Budget',
                data: budgetData,
                backgroundColor: colors.map(c => c + '80'), // Add transparency
                borderColor: colors,
                borderWidth: 2
            }, {
                label: 'Spent',
                data: spentData,
                backgroundColor: '#f59e0b',
                borderColor: '#f59e0b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            const budgetVal = context.datasetIndex === 0 ? value : budgetData[context.dataIndex];
                            const spentVal = context.datasetIndex === 1 ? value : spentData[context.dataIndex];
                            
                            if (context.datasetIndex === 0) {
                                return `${label}: ${formatCurrency(value)}`;
                            } else {
                                const remaining = budgetVal - spentVal;
                                const percent = budgetVal > 0 ? ((spentVal / budgetVal) * 100).toFixed(1) : 0;
                                return [
                                    `${label}: ${formatCurrency(value)}`,
                                    `Budget: ${formatCurrency(budgetVal)}`,
                                    `Remaining: ${formatCurrency(remaining)} (${100 - percent}%)`
                                ];
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderBudgetCategories(budgetCategories) {
    const categoriesList = document.getElementById('budgetCategoriesList');
    if (!categoriesList) return;
    
    // Ensure grid layout for 2 cards per row
    categoriesList.style.display = 'grid';
    categoriesList.style.gridTemplateColumns = 'repeat(2, 1fr)';
    categoriesList.style.gap = '1rem';
    
    if (budgetCategories.length === 0) {
        categoriesList.innerHTML = `
            <p style="color: var(--text-tertiary); text-align: center; padding: 2rem; grid-column: 1 / -1;">
                <i class="fas fa-wallet" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                No budget categories set. Create your monthly budget to start tracking!
            </p>
        `;
        return;
    }
    
    let html = '';
    budgetCategories.forEach(cat => {
        const spent = cat.spent || 0;
        const budgetAmt = cat.budget || 0;
        const percent = budgetAmt > 0 ? ((spent / budgetAmt) * 100).toFixed(1) : 0;
        const isOver = spent > budgetAmt;
        const statusColor = isOver ? '#ef4444' : (percent > 80 ? '#f59e0b' : '#10b981');
        const icon = cat.icon || 'fa-circle';
        const color = cat.color || statusColor;
        const remaining = Math.max(0, budgetAmt - spent);
        const categoryId = cat.id || Date.now();
        const escapedName = (cat.name || 'Category').replace(/'/g, "\\'").replace(/\"/g, '&quot;');
        
        html += `
            <div style="padding: 1.25rem; background: var(--bg-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-primary); height: 100%; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}20; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${icon}" style="color: ${color}; font-size: 1.1rem;"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h4 style="margin: 0 0 0.25rem 0; color: var(--text-primary); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cat.name || 'Category'}</h4>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary);">
                                Budget: ${formatCurrency(budgetAmt)}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${statusColor}; margin-bottom: 0.125rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                            <i class="fas fa-circle" style="color: ${statusColor}; font-size: 0.65rem;"></i>${percent}%
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${formatCurrency(remaining)} left</div>
                    </div>
                </div>
                
                <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; margin-bottom: 1rem; overflow: hidden;">
                    <div style="width: ${Math.min(100, parseFloat(percent))}%; height: 100%; background: ${statusColor}; transition: width 0.3s; border-radius: 4px;"></div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm);">
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Spent</div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(spent)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Budget</div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(budgetAmt)}</div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content:end; gap: 0.5rem; margin-top: auto;">
                    <button onclick="editBudgetCategory(${categoryId})" class="btn btn-secondary" style="font-size: 0.8rem; width: 60px; height: 45px; display: flex; justify-content:center; padding: 0.4rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="updateBudgetSpent(${categoryId}, '${escapedName}')" class="btn btn-primary" style="font-size: 0.8rem;width: 60px;display: flex; justify-content:center; padding: 0.4rem;">
                        <i class="fa-solid fa-indian-rupee-sign"></i>
                    </button>
                    <button onclick="deleteBudgetCategory(${categoryId})" class="btn btn-danger " style="font-size: 0.8rem; padding: 0.4rem 0.6rem;width: 55px;display: flex; justify-content:center;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    categoriesList.innerHTML = html;
}

function setupBudgetHandlers() {
    const addBtn = document.getElementById('addBudgetCategoryBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            showBudgetCategoryModal();
        });
    }
    
    // Monthly income update handler
    const monthlyIncomeInput = document.getElementById('monthlyIncomeInput');
    if (monthlyIncomeInput) {
        monthlyIncomeInput.addEventListener('change', async function() {
            await updateMonthlyIncome(parseFloat(this.value) || 0);
        });
    }
}

async function saveBudgetToBackend(budget) {
    try {
        await apiRequest('/finance/update_budget', 'POST', { budget });
        return true;
    } catch (error) {
        console.error('Error saving budget:', error);
        toast.error(error.message || 'Failed to save budget', 'error');
        return false;
    }
}

async function updateMonthlyIncome(income) {
    try {
        const data = await getFinancialData();
        const budget = data.budget || {};
        budget.monthly_budget = income;
        budget.monthly_income = income;
        
        const success = await saveBudgetToBackend(budget);
        if (success) {
            toast.success('Monthly income updated!', 'success');
            await loadBudgetData();
        }
    } catch (error) {
        console.error('Error updating monthly income:', error);
    }
}

async function showBudgetCategoryModal(categoryId = null) {
    const modal = document.getElementById('addBudgetCategoryModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    const form = document.getElementById('addBudgetCategoryFormModal');
    const title = modal.querySelector('h3');
    if (title) {
        title.textContent = categoryId ? 'Edit Budget Category' : 'Add Budget Category';
    }
    
    // Load category data if editing
    if (categoryId) {
        try {
            const data = await getFinancialData();
            const categories = data.budget?.categories || [];
            const category = categories.find(c => c.id === categoryId);
            
            if (category) {
                document.getElementById('budgetCategoryNameModal').value = category.name || '';
                document.getElementById('budgetCategoryAmountModal').value = category.budget || 0;
                if (document.getElementById('budgetCategoryIconModal')) {
                    document.getElementById('budgetCategoryIconModal').value = category.icon || 'fa-circle';
                }
                if (document.getElementById('budgetCategoryColorModal')) {
                    document.getElementById('budgetCategoryColorModal').value = category.color || '#10b981';
                }
            }
        } catch (error) {
            console.error('Error loading category:', error);
        }
    } else {
        form.reset();
    }
    
    // Setup form handler
    if (form) {
        // Remove old listener
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('budgetCategoryNameModal').value.trim();
            const amount = parseFloat(document.getElementById('budgetCategoryAmountModal').value) || 0;
            const icon = document.getElementById('budgetCategoryIconModal')?.value || 'fa-circle';
            const color = document.getElementById('budgetCategoryColorModal')?.value || '#10b981';
            
            if (!name || amount <= 0) {
                toast.error('Please enter a valid name and amount', 'error');
                return;
            }
            
            try {
                const data = await getFinancialData();
                let budget = data.budget || {};
                let categories = budget.categories || [];
                
                if (categoryId) {
                    // Update existing category
                    const index = categories.findIndex(c => c.id === categoryId);
                    if (index !== -1) {
                        categories[index] = {
                            ...categories[index],
                            name: name,
                            budget: amount,
                            icon: icon,
                            color: color
                        };
                    }
                } else {
                    // Add new category
                    const maxId = categories.length > 0 ? Math.max(...categories.map(c => c.id || 0)) : 0;
                    categories.push({
                        id: maxId + 1,
                        name: name,
                        budget: amount,
                        spent: 0,
                        icon: icon,
                        color: color
                    });
                }
                
                budget.categories = categories;
                
                const success = await saveBudgetToBackend(budget);
                if (success) {
                    toast.success(categoryId ? 'Category updated!' : 'Category added!', 'success');
                    closeModal('addBudgetCategoryModal');
                    await loadBudgetData();
                }
            } catch (error) {
                console.error('Error saving category:', error);
            }
        });
    }
}

async function editBudgetCategory(categoryId) {
    await showBudgetCategoryModal(categoryId);
}

async function deleteBudgetCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this budget category?')) {
        return;
    }
    
    try {
        const data = await getFinancialData();
        const budget = data.budget || {};
        let categories = budget.categories || [];
        
        categories = categories.filter(c => c.id !== categoryId);
        budget.categories = categories;
        
        const success = await saveBudgetToBackend(budget);
        if (success) {
            toast.success('Category deleted!', 'success');
            await loadBudgetData();
        }
    } catch (error) {
        console.error('Error deleting category:', error);
    }
}

async function updateBudgetSpent(categoryId, categoryName) {
    const currentData = await getFinancialData();
    const categories = currentData.budget?.categories || [];
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) return;
    
    const currentSpent = category.spent || 0;
    const newSpent = prompt(`Update spent amount for "${categoryName}":`, currentSpent);
    
    if (newSpent === null) return; // User cancelled
    
    const spentAmount = parseFloat(newSpent);
    if (isNaN(spentAmount) || spentAmount < 0) {
        toast.error('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        const data = await getFinancialData();
        const budget = data.budget || {};
        let categories = budget.categories || [];
        
        const index = categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            categories[index].spent = spentAmount;
        }
        
        budget.categories = categories;
        
        const success = await saveBudgetToBackend(budget);
        if (success) {
            toast.success('Spent amount updated!', 'success');
            await loadBudgetData();
        }
    } catch (error) {
        console.error('Error updating spent amount:', error);
    }
}

// Expose functions globally
window.editBudgetCategory = editBudgetCategory;
window.deleteBudgetCategory = deleteBudgetCategory;
window.updateBudgetSpent = updateBudgetSpent;

// ========== INVESTMENTS PAGE ==========
async function loadInvestmentsData() {
    try {
        console.log('🔄 Loading Investments data...');
        const data = await getFinancialData();
        console.log('✅ Investments data loaded:', data);
        
        // Handle investments - should be an array from mock_data
        let investments = [];
        if (Array.isArray(data.investments)) {
            investments = data.investments;
        } else if (data.investments && Array.isArray(data.investments.holdings)) {
            investments = data.investments.holdings;
        }
        
        // Calculate totals
        const portfolioValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount || 0), 0);
        const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const totalGains = investments.reduce((sum, inv) => {
            const invested = inv.amount || 0;
            const current = inv.current_value || invested;
            return sum + (current - invested);
        }, 0);
        const roi = totalInvested > 0 ? ((totalGains / totalInvested) * 100).toFixed(2) : 0;
        
        // Update stat cards
        updateElement('totalInvestments', formatCurrency(portfolioValue));
        updateElement('investmentReturns', formatCurrencyWithSign(totalGains, true));
        updateElement('investmentROI', roi + '%');
        updateElement('investmentCount', investments.length);
        
        // Render investments list
        renderInvestmentsList(investments);
        
        // Create charts
        createInvestmentDistributionChart(investments);
        createInvestmentPerformanceChart(investments);
        
        console.log('✅ Investments page data rendered successfully');
    } catch (error) {
        console.error('❌ Error loading investments:', error);
    }
}

function renderInvestmentsList(investments) {
    const container = document.getElementById('investmentsList');
    if (!container) return;
    
    // Ensure grid layout
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    container.style.gap = '1rem';
    
    if (investments.length === 0) {
        container.innerHTML = `
            <p style="color: var(--text-tertiary); text-align: center; padding: 2rem; grid-column: 1 / -1;">
                <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                No investments added yet. Click the "+" button to add your first investment!
            </p>
        `;
        return;
    }
    
    // Limit initial display to 4 investments (2 rows of 2 cards)
    const INITIAL_DISPLAY_COUNT = 4;
    const showAll = container.dataset.showAll === 'true';
    const displayCount = showAll ? investments.length : Math.min(INITIAL_DISPLAY_COUNT, investments.length);
    const hasMore = investments.length > INITIAL_DISPLAY_COUNT;
    const investmentsToShow = investments.slice(0, displayCount);
    
    let html = '';
    investmentsToShow.forEach(inv => {
        const invested = inv.amount || 0;
        const current = inv.current_value || invested;
        const gainLoss = current - invested;
        const returns = inv.returns || (invested > 0 ? ((gainLoss / invested) * 100).toFixed(2) : 0);
        const sign = gainLoss >= 0 ? '+' : '';
        const color = gainLoss >= 0 ? '#10b981' : '#ef4444';
        const typeIcon = getInvestmentTypeIcon(inv.type);
        const riskColor = getRiskLevelColor(inv.risk_level);
        const investmentId = inv.id || Date.now();
        const escapedName = (inv.name || 'Investment').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        html += `
            <div style="padding: 1.25rem; background: var(--bg-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-primary); height: 100%; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${riskColor}20; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${typeIcon}" style="color: ${riskColor}; font-size: 1.1rem;"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h4 style="margin: 0 0 0.25rem 0; color: var(--text-primary); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${inv.name || 'Investment'}</h4>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary);">
                                ${formatInvestmentType(inv.type)}
                                ${inv.symbol ? ' • ' + inv.symbol : ''}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${color}; margin-bottom: 0.125rem;">
                            ${sign}${formatCurrency(Math.abs(gainLoss))}
                        </div>
                        <div style="font-size: 0.75rem; color: ${color};">
                            ${sign}${returns}%
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm); flex: 1;">
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Invested</div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(invested)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Current</div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(current)}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <span style="background: ${riskColor}20; color: ${riskColor}; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.7rem; display: inline-block;">
                        ${(inv.risk_level || 'medium').toUpperCase()} Risk
                    </span>
                    ${inv.purchase_date ? `
                        <span style="font-size: 0.7rem; color: var(--text-tertiary); margin-left: 0.5rem;">
                            ${new Date(inv.purchase_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </span>
                    ` : ''}
                </div>
                
                <div style="display: flex; justify-content: end; gap: 0.5rem; margin-top: auto;">
                    <button onclick="editInvestment(${investmentId})" class="btn btn-secondary btn-sm"; font-size: 0.8rem;text-align:center; width: 60px; padding: 0.4rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="updateInvestmentValue(${investmentId}, '${escapedName}')" class="btn btn-primary btn-sm"; text-align:center; width: 60px; font-size: 0.8rem; padding: 0.4rem;">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="deleteInvestment(${investmentId})" class="btn btn-danger btn-sm" style="font-size: 0.8rem; display:flex; justify-content: center; width: 60px; padding: 0.4rem 0.6rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.dataset.showAll = showAll.toString();
    
    // Add "Show More" / "Show Less" button if there are more investments - separate row
    if (hasMore) {
        const buttonDiv = document.createElement('div');
        buttonDiv.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 1rem;';
        buttonDiv.innerHTML = `
            <button onclick="toggleInvestmentsDisplay()" class="btn btn-secondary btn-sm" style="min-width: 200px;">
                <i class="fas fa-${showAll ? 'chevron-up' : 'chevron-down'}"></i>
                ${showAll ? 'Show Less' : `Show More (${investments.length - INITIAL_DISPLAY_COUNT} more)`}
            </button>
        `;
        container.appendChild(buttonDiv);
    }
}

function toggleInvestmentsDisplay() {
    const container = document.getElementById('investmentsList');
    if (!container) return;
    
    const currentShowAll = container.dataset.showAll === 'true';
    container.dataset.showAll = (!currentShowAll).toString();
    
    // Reload investments list with new display state
    loadInvestmentsData();
}

function getInvestmentTypeIcon(type) {
    const icons = {
        'mutual_fund': 'fa-chart-pie',
        'stock': 'fa-chart-line',
        'fixed_deposit': 'fa-piggy-bank',
        'gold': 'fa-coins',
        'savings': 'fa-wallet',
        'bond': 'fa-file-invoice',
        'etf': 'fa-box'
    };
    return icons[type] || 'fa-circle';
}

function formatInvestmentType(type) {
    return (type || 'investment').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getRiskLevelColor(risk) {
    const colors = {
        'low': '#10b981',
        'medium': '#f59e0b',
        'high': '#ef4444'
    };
    return colors[risk?.toLowerCase()] || '#6b7280';
}

function createInvestmentDistributionChart(investments) {
    const ctx = document.getElementById('investmentDistributionChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    // Destroy existing chart
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Group by type
    const typeGroups = {};
    investments.forEach(inv => {
        const type = inv.type || 'other';
        if (!typeGroups[type]) {
            typeGroups[type] = 0;
        }
        typeGroups[type] += (inv.current_value || inv.amount || 0);
    });
    
    const labels = Object.keys(typeGroups).map(formatInvestmentType);
    const data = Object.values(typeGroups);
    const colors = generateUniqueColors(data.length);
    
    ctx.chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(c => adjustColorBrightness(c, -20)),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createInvestmentPerformanceChart(investments) {
    const perfCtx = document.getElementById('investmentPerformanceChart');
    if (!perfCtx || typeof Chart === 'undefined') return;
    
    // Destroy existing chart
    if (perfCtx.chart) {
        perfCtx.chart.destroy();
    }
    
    if (investments.length === 0) {
        perfCtx.parentElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-tertiary);">
                <div style="text-align: center;">
                    <i class="fas fa-chart-area" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No investment data available for performance chart.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Calculate performance metrics for each investment
    const performanceData = investments.map(inv => {
        const invested = inv.amount || 0;
        const current = inv.current_value || invested;
        const gainLoss = current - invested;
        const returns = invested > 0 ? ((gainLoss / invested) * 100) : 0;
        return {
            name: inv.name || 'Investment',
            invested: invested,
            current: current,
            returns: returns,
            gainLoss: gainLoss
        };
    });
    
    // Sort by returns (best performers first)
    performanceData.sort((a, b) => b.returns - a.returns);
    
    const labels = performanceData.map(d => {
        // Truncate long names
        const name = d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name;
        return name;
    });
    const returnsData = performanceData.map(d => d.returns);
    const colors = returnsData.map(ret => ret >= 0 ? '#10b981' : '#ef4444');
    
    perfCtx.chart = new Chart(perfCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Returns %',
                data: returnsData,
                backgroundColor: colors.map(c => c + '80'),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const data = performanceData[index];
                            return [
                                `Investment: ${data.name}`,
                                `Returns: ${data.returns >= 0 ? '+' : ''}${data.returns.toFixed(2)}%`,
                                `Invested: ${formatCurrency(data.invested)}`,
                                `Current: ${formatCurrency(data.current)}`,
                                `Gain/Loss: ${formatCurrencyWithSign(data.gainLoss, true)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function setupInvestmentHandlers() {
    const addBtn = document.getElementById('addInvestmentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            showInvestmentModal();
        });
    }
}

async function saveInvestmentsToBackend(investments) {
    try {
        await apiRequest('/finance/update_investments', 'POST', { investments });
        return true;
    } catch (error) {
        console.error('Error saving investments:', error);
        toast.error(error.message || 'Failed to save investments', 'error');
        return false;
    }
}

async function showInvestmentModal(investmentId = null) {
    const modal = document.getElementById('addInvestmentModal');
    if (!modal) {
        toast.error('Investment modal not found', 'error');
        return;
    }
    
    modal.style.display = 'flex';
    
    const form = document.getElementById('addInvestmentFormModal');
    const title = modal.querySelector('h3');
    if (title) {
        title.textContent = investmentId ? 'Edit Investment' : 'Add Investment';
    }
    
    // Load investment data if editing
    if (investmentId) {
        try {
            const data = await getFinancialData();
            const investments = Array.isArray(data.investments) ? data.investments : [];
            const investment = investments.find(inv => inv.id === investmentId);
            
            if (investment) {
                document.getElementById('investmentNameModal').value = investment.name || '';
                document.getElementById('investmentTypeModal').value = investment.type || 'mutual_fund';
                document.getElementById('investmentAmountModal').value = investment.amount || 0;
                document.getElementById('investmentCurrentValueModal').value = investment.current_value || investment.amount || 0;
                document.getElementById('investmentSymbolModal').value = investment.symbol || '';
                document.getElementById('investmentQuantityModal').value = investment.quantity || '';
                document.getElementById('investmentRiskLevelModal').value = investment.risk_level || 'medium';
                document.getElementById('investmentCategoryModal').value = investment.category || 'equity';
                document.getElementById('investmentPurchaseDateModal').value = investment.purchase_date || '';
                document.getElementById('investmentMaturityDateModal').value = investment.maturity_date || '';
            }
        } catch (error) {
            console.error('Error loading investment:', error);
        }
    } else {
        form.reset();
        // Set default purchase date to today
        document.getElementById('investmentPurchaseDateModal').value = new Date().toISOString().split('T')[0];
    }
    
    // Setup form handler
    if (form) {
        // Remove old listener
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('investmentNameModal').value.trim();
            const type = document.getElementById('investmentTypeModal').value;
            const amount = parseFloat(document.getElementById('investmentAmountModal').value) || 0;
            const currentValue = parseFloat(document.getElementById('investmentCurrentValueModal').value) || amount;
            const symbol = document.getElementById('investmentSymbolModal').value.trim();
            const quantity = document.getElementById('investmentQuantityModal').value.trim();
            const riskLevel = document.getElementById('investmentRiskLevelModal').value;
            const category = document.getElementById('investmentCategoryModal').value;
            const purchaseDate = document.getElementById('investmentPurchaseDateModal').value;
            const maturityDate = document.getElementById('investmentMaturityDateModal').value;
            
            if (!name || amount <= 0) {
                toast.error('Please enter a valid name and amount', 'error');
                return;
            }
            
            try {
                const data = await getFinancialData();
                let investments = Array.isArray(data.investments) ? data.investments : [];
                
                const gainLoss = currentValue - amount;
                const returns = amount > 0 ? ((gainLoss / amount) * 100).toFixed(2) : 0;
                
                if (investmentId) {
                    // Update existing investment
                    const index = investments.findIndex(inv => inv.id === investmentId);
                    if (index !== -1) {
                        investments[index] = {
                            ...investments[index],
                            name: name,
                            type: type,
                            amount: amount,
                            current_value: currentValue,
                            returns: parseFloat(returns),
                            symbol: symbol || undefined,
                            quantity: quantity ? parseInt(quantity) : undefined,
                            risk_level: riskLevel,
                            category: category,
                            purchase_date: purchaseDate || undefined,
                            maturity_date: maturityDate || undefined
                        };
                    }
                } else {
                    // Add new investment
                    const maxId = investments.length > 0 ? Math.max(...investments.map(inv => inv.id || 0)) : 0;
                    investments.push({
                        id: maxId + 1,
                        name: name,
                        type: type,
                        amount: amount,
                        current_value: currentValue,
                        returns: parseFloat(returns),
                        symbol: symbol || undefined,
                        quantity: quantity ? parseInt(quantity) : undefined,
                        risk_level: riskLevel,
                        category: category,
                        purchase_date: purchaseDate || undefined,
                        maturity_date: maturityDate || undefined
                    });
                }
                
                const success = await saveInvestmentsToBackend(investments);
                if (success) {
                    toast.success(investmentId ? 'Investment updated!' : 'Investment added!', 'success');
                    closeModal('addInvestmentModal');
                    await loadInvestmentsData();
                }
            } catch (error) {
                console.error('Error saving investment:', error);
            }
        });
    }
}

async function editInvestment(investmentId) {
    await showInvestmentModal(investmentId);
}

async function deleteInvestment(investmentId) {
    if (!confirm('Are you sure you want to delete this investment?')) {
        return;
    }
    
    try {
        const data = await getFinancialData();
        let investments = Array.isArray(data.investments) ? data.investments : [];
        
        investments = investments.filter(inv => inv.id !== investmentId);
        
        const success = await saveInvestmentsToBackend(investments);
        if (success) {
            toast.success('Investment deleted!', 'success');
            await loadInvestmentsData();
        }
    } catch (error) {
        console.error('Error deleting investment:', error);
    }
}

async function updateInvestmentValue(investmentId, investmentName) {
    const currentData = await getFinancialData();
    const investments = Array.isArray(currentData.investments) ? currentData.investments : [];
    const investment = investments.find(inv => inv.id === investmentId);
    
    if (!investment) return;
    
    const currentValue = investment.current_value || investment.amount || 0;
    const newValue = prompt(`Update current value for "${investmentName}":`, currentValue);
    
    if (newValue === null) return; // User cancelled
    
    const valueAmount = parseFloat(newValue);
    if (isNaN(valueAmount) || valueAmount < 0) {
        toast.error('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        const data = await getFinancialData();
        let investments = Array.isArray(data.investments) ? data.investments : [];
        
        const index = investments.findIndex(inv => inv.id === investmentId);
        if (index !== -1) {
            investments[index].current_value = valueAmount;
            const invested = investments[index].amount || 0;
            const gainLoss = valueAmount - invested;
            investments[index].returns = invested > 0 ? parseFloat(((gainLoss / invested) * 100).toFixed(2)) : 0;
        }
        
        const success = await saveInvestmentsToBackend(investments);
        if (success) {
            toast.success('Investment value updated!', 'success');
            await loadInvestmentsData();
        }
    } catch (error) {
        console.error('Error updating investment value:', error);
    }
}

// Expose functions globally
window.editInvestment = editInvestment;
window.deleteInvestment = deleteInvestment;
window.updateInvestmentValue = updateInvestmentValue;
window.toggleInvestmentsDisplay = toggleInvestmentsDisplay;

// ========== TRANSACTIONS PAGE ==========
async function loadTransactionsData() {
    try {
        console.log('🔄 Loading Transactions data from mock_data.json...');
        // Try to load from backend first (includes mock data)
        const data = await getFinancialData();
        console.log('✅ Transactions data loaded:', data);
        let transactions = data.transactions || [];
        
        // If no transactions from backend, check localStorage
        if (transactions.length === 0) {
            transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        } else {
            // Sync backend transactions to localStorage for compatibility
            localStorage.setItem('transactions', JSON.stringify(transactions));
        }
        
        // If still no transactions from backend or localStorage, show empty state
        // Don't use hardcoded fallback - all data should come from mock_data.json via backend
        if (transactions.length === 0) {
            // Show empty state message instead of hardcoded data
            const container = document.getElementById('transactionsList');
            if (container) {
                container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">No transactions found. Add transactions or wait for data to load.</p>';
            }
            updateElement('totalIncome', '₹0');
            updateElement('totalExpenses', '₹0');
            updateElement('totalTransactions', 0);
            updateElement('netTransaction', '₹0');
            return; // Exit early if no data
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
    
    updateElement('totalIncome', formatCurrency(totalIncome));
    updateElement('totalExpenses', formatCurrency(totalExpenses));
    updateElement('totalTransactions', filteredTransactions.length);
    updateElement('netTransaction', formatCurrency(netAmount));
    
    displayTransactions(filteredTransactions);
    
    // Setup filter handlers
    setupTransactionFilters();
    
    } catch (error) {
        console.error('❌ Error loading transactions:', error);
    }
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
                    ${sign}${formatCurrency(Math.abs(t.amount))}
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

// ========== LOANS PAGE ==========
window.loadLoansPageData = async function() {
    try {
        console.log('🔄 Loading Loans data from mock_data.json...');
        const data = await getFinancialData();
        console.log('✅ Loans data loaded:', data);
        
        const liabilities = data.liabilities || {};
        const assets = data.assets || {};
        const loans = data.loans || [];
        
        // Calculate total assets for debt ratio
        const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0) +
                           (assets.real_estate || 0) + (assets.fixed_deposits || 0) + (assets.gold || 0);
        
        // Calculate individual loan amounts
        const homeLoan = liabilities.home_loan || 0;
        const carLoan = liabilities.car_loan || 0;
        const personalLoan = liabilities.personal_loan || 0;
        const creditCardDue = liabilities.credit_card_due || 0;
        const otherLoans = liabilities.loan || 0;
        
        // Calculate total loans
        const totalLoans = homeLoan + carLoan + personalLoan + creditCardDue + otherLoans;
        
        // Calculate debt ratio
        const debtRatio = totalAssets > 0 ? Math.round((totalLoans / totalAssets) * 100) : 0;
        
        // Update summary cards
        updateElement('totalLoans', formatCurrency(totalLoans));
        updateElement('homeLoanAmount', formatCurrency(homeLoan));
        updateElement('carLoanAmount', formatCurrency(carLoan));
        updateElement('personalLoanAmount', formatCurrency(personalLoan));
        updateElement('creditCardDue', formatCurrency(creditCardDue));
        updateElement('otherLoans', formatCurrency(otherLoans));
        updateElement('debtRatioDisplay', debtRatio + '%');
        
        // Display loans list
        const loansListContainer = document.getElementById('loansList');
        if (loansListContainer) {
            // Ensure grid layout for 2 cards per row
            loansListContainer.style.display = 'grid';
            loansListContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
            loansListContainer.style.gap = '1rem';
            
            if (loans.length > 0) {
                let html = '';
                loans.forEach(loan => {
                    // Handle both 'outstanding' and 'remaining_principal' field names
                    const outstanding = loan.outstanding || loan.remaining_principal || 0;
                    const principal = loan.principal || 0;
                    const progress = principal > 0 ? Math.round(((principal - outstanding) / principal) * 100) : 0;
                    const monthlyEMI = loan.emi || 0;
                    
                    // Calculate remaining months from tenure and dates if not provided
                    let remainingMonths = loan.remaining_months || 0;
                    if (!remainingMonths && loan.start_date && loan.end_date) {
                        const start = new Date(loan.start_date);
                        const end = new Date(loan.end_date);
                        const now = new Date();
                        const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                        const elapsedMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
                        remainingMonths = Math.max(0, totalMonths - elapsedMonths);
                    }
                    
                    // Determine icon based on loan type
                    const loanType = loan.type || '';
                    let icon = 'file-invoice-dollar';
                    if (loanType.includes('home')) icon = 'home';
                    else if (loanType.includes('car')) icon = 'car';
                    else if (loanType.includes('personal')) icon = 'wallet';
                    
                    html += `
                        <div style="padding: 1.25rem; border: 1px solid var(--border-primary); background: var(--bg-elevated); border-radius: var(--radius-md); height: 100%; display: flex; flex-direction: column;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1; min-width: 0;">
                                    <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        <i class="fas fa-${icon}" style="color: var(--accent-danger); margin-right: 0.5rem;"></i>
                                        ${loan.name || (loan.type ? loan.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Loan')}
                                    </h4>
                                    <div style="color: var(--text-tertiary); font-size: 0.75rem;">
                                        ${loan.bank || 'Financial Institution'} • ${loan.interest_rate || 0}%
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-danger); margin-bottom: 0.125rem;">${formatCurrency(outstanding)}</div>
                                    <div style="font-size: 0.7rem; color: var(--text-tertiary);">Outstanding</div>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm);">
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Principal</div>
                                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(principal)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">EMI</div>
                                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(monthlyEMI)}</div>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.5rem;">
                                    <span>Progress</span>
                                    <span style="font-weight: 600; color: var(--text-primary);">${progress}%</span>
                                </div>
                                <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, var(--accent-success), var(--accent-primary)); transition: width 0.3s; border-radius: 4px;"></div>
                                </div>
                            </div>
                            
                            ${loan.next_payment_date ? `
                                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 0.5rem; margin-top: auto; font-size: 0.8rem;">
                                    <i class="fas fa-calendar-alt" style="color: var(--accent-warning); font-size: 0.85rem;"></i>
                                    <span style="color: var(--text-secondary);"><strong>${loan.next_payment_date}</strong></span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
                loansListContainer.innerHTML = html;
            } else {
                // Show loans from liabilities if no detailed loan data
                let html = '';
                const loanTypes = [
                    { name: 'Home Loan', amount: homeLoan, icon: 'home', type: 'home' },
                    { name: 'Car Loan', amount: carLoan, icon: 'car', type: 'car' },
                    { name: 'Personal Loan', amount: personalLoan, icon: 'wallet', type: 'personal' },
                    { name: 'Credit Card', amount: creditCardDue, icon: 'credit-card', type: 'credit' },
                    { name: 'Other Loans', amount: otherLoans, icon: 'file-invoice-dollar', type: 'other' }
                ];
                
                loanTypes.forEach(loan => {
                    if (loan.amount > 0) {
                        html += `
                            <div style="padding: 1.25rem; border: 1px solid var(--border-primary); background: var(--bg-elevated); border-radius: var(--radius-md); height: 100%; display: flex; flex-direction: column;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                    <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--gradient-danger); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-${loan.icon}" style="color: white; font-size: 1.1rem;"></i>
                                        </div>
                                        <div style="flex: 1; min-width: 0;">
                                            <h4 style="margin: 0; color: var(--text-primary); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${loan.name}</h4>
                                            <div style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 0.25rem;">Outstanding</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-danger); margin-bottom: 0.125rem;">${formatCurrency(loan.amount)}</div>
                                    </div>
                                </div>
                                <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm); margin-top: auto;">
                                    <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Balance</div>
                                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(loan.amount)}</div>
                                </div>
                            </div>
                        `;
                    }
                });
                
                if (html) {
                    loansListContainer.innerHTML = html;
                } else {
                    loansListContainer.innerHTML = `
                        <p style="color: var(--text-tertiary); text-align: center; padding: 2rem; grid-column: 1 / -1;">
                            <i class="fas fa-check-circle" style="color: var(--accent-success); font-size: 2rem; margin-bottom: 0.5rem;"></i><br>
                            No loans or debts found. Great job managing your finances!
                        </p>
                    `;
                }
            }
        }
        
        console.log('✅ Loans page data rendered successfully');
    } catch (error) {
        console.error('❌ Error loading loans:', error);
    }
};

// ========== GOALS PAGE ==========
window.loadGoalsPageData = async function() {
    try {
        console.log('🔄 Loading Goals data from mock_data.json...');
        
        // Verify elements exist
        const totalGoalsEl = document.getElementById('totalGoals');
        const goalsPageListEl = document.getElementById('goalsPageList');
        const completedGoalsEl = document.getElementById('completedGoals');
        const activeGoalsEl = document.getElementById('activeGoals');
        const goalsProgressAvgEl = document.getElementById('goalsProgressAvg');
        
        console.log('Goals page elements found:', {
            totalGoals: totalGoalsEl !== null,
            goalsPageList: goalsPageListEl !== null,
            completedGoals: completedGoalsEl !== null,
            activeGoals: activeGoalsEl !== null,
            goalsProgressAvg: goalsProgressAvgEl !== null
        });
        
        if (!totalGoalsEl && !goalsPageListEl) {
            console.warn('⚠️ Goals page elements not found, waiting for DOM...');
            // Retry after a short delay
            setTimeout(() => loadGoalsPageData(), 200);
            return;
        }
        
        const data = await getFinancialData();
        console.log('✅ Goals data loaded:', data);
        let goals = data.goals || [];
        const assets = data.assets || {};
        
        // Fallback to demo goals if API returns none
        if (!Array.isArray(goals) || goals.length === 0) {
            console.warn('No goals from API. Using demo goals for display.');
            const y = new Date().getFullYear();
            goals = [
                { id: 1, name: 'Emergency Fund', target: 100000, current: 30000, current_amount: 30000, year: y + 1 },
                { id: 2, name: 'Buy a Car', target: 600000, current: 150000, current_amount: 150000, year: y + 2 },
                { id: 3, name: 'Vacation', target: 150000, current: 40000, current_amount: 40000, year: y + 1 },
                { id: 4, name: 'Home Down Payment', target: 1200000, current: 350000, current_amount: 350000, year: y + 3 },
                { id: 5, name: 'Retirement Fund', target: 2000000, current: 500000, current_amount: 500000, year: y + 10 }
            ];
        }
        
        console.log('Goals found:', goals.length);
        console.log('Goals data:', goals);
        
        // Update stat cards
        if (totalGoalsEl) {
            totalGoalsEl.textContent = goals.length;
            console.log('✅ Updated totalGoals:', goals.length);
        }
        
        // Use goal.current or goal.current_amount instead of totalAssets
        const completedGoalsCount = goals.filter(g => {
            const current = g.current || g.current_amount || 0;
            const target = g.target || 0;
            return current >= target && target > 0;
        }).length;
        
        if (completedGoalsEl) {
            completedGoalsEl.textContent = completedGoalsCount;
            console.log('✅ Updated completedGoals:', completedGoalsCount);
        }
        
        if (activeGoalsEl) {
            activeGoalsEl.textContent = goals.length - completedGoalsCount;
            console.log('✅ Updated activeGoals:', goals.length - completedGoalsCount);
        }
        
        const avgProgress = goals.length > 0
            ? Math.round(goals.reduce((sum, g) => {
                const current = g.current || g.current_amount || 0;
                const target = g.target || 0;
                const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                return sum + progress;
            }, 0) / goals.length)
            : 0;
        
        if (goalsProgressAvgEl) {
            goalsProgressAvgEl.textContent = avgProgress + '%';
            console.log('✅ Updated goalsProgressAvg:', avgProgress + '%');
        }
        
        // Display goals
        const container = document.getElementById('goalsPageList');
        if (container) {
            // Ensure grid layout for 2 cards per row
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(2, 1fr)';
            container.style.gap = '1rem';
            
            if (goals.length === 0) {
                container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem; grid-column: 1 / -1;">No goals set yet.</p>';
                console.log('✅ Updated goalsPageList with empty message');
            } else {
                let html = '';
                goals.forEach((goal, index) => {
                    // Use current_amount or current field from goal
                    const current = goal.current || goal.current_amount || 0;
                    const target = goal.target || 0;
                    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                    const yearsRemaining = Math.max(0, goal.year - new Date().getFullYear());
                    const remaining = Math.max(0, target - current);
                    
                    // Escape goal name for use in HTML attribute
                    const escapedGoalName = (goal.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    
                    html += `
                        <div style="padding: 1.25rem; border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-elevated); height: 100%; display: flex; flex-direction: column;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1; min-width: 0;">
                                    <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        <i class="fas fa-bullseye" style="color: var(--accent-cyan); margin-right: 0.5rem; font-size: 0.9rem;"></i>${goal.name}
                                    </h4>
                                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">
                                        Target: ${formatCurrency(goal.target)} by ${goal.year}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 0.125rem;">${progress}%</div>
                                    <div style="font-size: 0.7rem; color: var(--text-tertiary);">${yearsRemaining} yrs left</div>
                                </div>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; margin-bottom: 1rem; overflow: hidden;">
                                <div style="background: var(--gradient-primary); height: 100%; width: ${progress}%; transition: width 0.5s ease; border-radius: 4px;"></div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm);">
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Progress</div>
                                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(current)}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Remaining</div>
                                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatCurrency(remaining)}</div>
                                </div>
                            </div>
                            <!-- Action Buttons -->
                            <div style="display: flex; justify-content: end; gap: 0.5rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-primary);">
                                <button onclick="editGoal(${goal.id})" class="btn btn-secondary btn-sm"; font-size: 0.8rem; padding: 0.4rem;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="openDeleteGoalModal(${goal.id}, '${escapedGoalName}')" class="btn btn-danger btn-sm"; font-size: 0.8rem; padding: 0.4rem;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
                console.log('✅ Updated goalsPageList with', goals.length, 'goals');
            }
        } else {
            console.warn('⚠️ goalsPageList container not found');
        }
        
        // Create goals progress chart
        const ctx = document.getElementById('goalsProgressChart');
        if (ctx && typeof Chart !== 'undefined' && goals.length > 0) {
            // Destroy existing chart if it exists
            if (ctx.chart) {
                ctx.chart.destroy();
            }
            
            ctx.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: goals.map(g => g.name),
                    datasets: [{
                        label: 'Progress %',
                        data: goals.map(g => {
                            const current = g.current || g.current_amount || 0;
                            const target = g.target || 0;
                            return target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
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
            console.log('✅ Goals progress chart created');
        } else if (!ctx) {
            console.warn('⚠️ goalsProgressChart canvas not found');
        } else if (goals.length === 0) {
            console.log('ℹ️ No goals to display in chart');
        }
        
        console.log('✅ Goals page data rendered successfully');
    } catch (error) {
        console.error('❌ Error loading goals page:', error);
        console.error('Error stack:', error.stack);
    }
}

// ========== REPORTS PAGE ==========
window.loadReportsData = async function() {
    try {
        console.log('🔄 Loading saved reports...');
        const result = await apiRequest('/finance/get_reports');
        const reports = result.data || [];
        
        renderReportsList(reports);
        console.log('✅ Reports loaded:', reports.length);
    } catch (error) {
        console.error('❌ Error loading reports:', error);
        // Still show empty state
        renderReportsList([]);
    }
};

function renderReportsList(reports) {
    const container = document.getElementById('recentReportsList');
    if (!container) return;
    
    // Ensure grid layout for 2 cards per row with scrollable container
    // Height is controlled by parent card to match the form card
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    container.style.gap = '1rem';
    container.style.padding = '1.5rem';
    container.style.flex = '1';
    container.style.overflowY = 'auto';
    container.style.overflowX = 'hidden';
    container.style.minHeight = '0';
    
    // Custom scrollbar styling
    container.style.scrollbarWidth = 'thin';
    container.style.scrollbarColor = 'var(--border-primary) var(--bg-tertiary)';
    
    // Match height with left card (form card)
    const reportForm = document.getElementById('reportForm');
    const rightCard = container.closest('.card');
    if (reportForm && rightCard) {
        const leftCard = reportForm.closest('.card');
        if (leftCard && rightCard) {
            // Wait for layout to calculate heights
            setTimeout(() => {
                const leftCardHeight = leftCard.offsetHeight;
                const rightCardHeader = rightCard.querySelector('.card-header');
                const rightCardHeaderHeight = rightCardHeader ? rightCardHeader.offsetHeight : 0;
                
                // Set the right card height to match left card
                rightCard.style.height = `${leftCardHeight}px`;
                
                // The scrollable area will automatically adjust with flexbox
            }, 100);
        }
    }
    
    if (reports.length === 0) {
        container.innerHTML = `
            <p style="color: var(--text-tertiary); text-align: center; padding: 2rem; grid-column: 1 / -1;">
                <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                No reports generated yet. Create your first report above!
            </p>
        `;
        return;
    }
    
    let html = '';
    reports.forEach(report => {
        const reportType = report.type || 'Report';
        const period = report.period || 'N/A';
        const createdAt = report.created_at ? new Date(report.created_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'Unknown';
        const reportId = report.id || '';
        
        // Get icon based on report type
        let icon = 'fa-file-alt';
        let color = 'var(--accent-primary)';
        if (reportType.includes('Summary')) icon = 'fa-chart-pie';
        else if (reportType.includes('Monthly')) icon = 'fa-calendar-alt';
        else if (reportType.includes('Annual')) icon = 'fa-calendar';
        else if (reportType.includes('Goals')) icon = 'fa-bullseye';
        else if (reportType.includes('Investment')) icon = 'fa-chart-line';
        else if (reportType.includes('Complete')) icon = 'fa-file-alt';
        
        html += `
            <div style="padding: 1.25rem; border: 1px solid var(--border-primary); background: var(--bg-elevated); border-radius: var(--radius-md); height: 100%; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}20; display: flex; align-items: center; justify-content: center;">
                                <i class="fas ${icon}" style="color: ${color}; font-size: 1.1rem;"></i>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h4 style="margin: 0; color: var(--text-primary); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${reportType}</h4>
                            </div>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.5rem;">
                            <i class="fas fa-calendar" style="margin-right: 0.25rem;"></i>${createdAt}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">
                            <i class="fas fa-clock" style="margin-right: 0.25rem;"></i>${period}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-primary);">
                    <button onclick="downloadSavedReport('${reportId}')" class="btn btn-primary btn-sm" style="flex: 1; font-size: 0.8rem; padding: 0.4rem;">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="deleteReport('${reportId}')" class="btn btn-danger btn-sm" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.deleteReport = async function(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
        await apiRequest('/finance/delete_report', 'POST', { report_id: reportId });
        toast.success('Report deleted successfully');
        loadReportsData();
    } catch (error) {
        console.error('Error deleting report:', error);
        toast.error('Failed to delete report');
    }
};

window.downloadSavedReport = async function(reportId) {
    try {
        const result = await apiRequest('/finance/get_reports');
        const reports = result.data || [];
        const report = reports.find(r => r.id === reportId);
        
        if (!report) {
            toast.error('Report not found');
            return;
        }
        
        // Download as JSON
        downloadJSON(report, `report-${report.type.toLowerCase().replace(/\s+/g, '-')}-${reportId.substring(0, 8)}.json`);
        toast.success('Report downloaded!');
    } catch (error) {
        console.error('Error downloading report:', error);
        toast.error('Failed to download report');
    }
};

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
                        const totalAssets = (data.assets?.savings || 0) + (data.assets?.mutual_funds || 0) + (data.assets?.stocks || 0) +
                                          (data.assets?.real_estate || 0) + (data.assets?.fixed_deposits || 0) + (data.assets?.gold || 0);
                        const totalLiabilities = (data.liabilities?.loan || 0) + (data.liabilities?.home_loan || 0) +
                                                (data.liabilities?.car_loan || 0) + (data.liabilities?.personal_loan || 0) +
                                                (data.liabilities?.credit_card_due || 0);
                        reportData = {
                            type: 'Financial Summary',
                            period: `${startDate} to ${endDate}`,
                            assets: data.assets || {},
                            liabilities: data.liabilities || {},
                            budget: data.budget || {},
                            transactions: data.transactions || [],
                            investments: data.investments || {},
                            netWorth: totalAssets - totalLiabilities,
                            totalAssets: totalAssets,
                            totalLiabilities: totalLiabilities
                        };
                        break;
                    case 'goals':
                        reportData = {
                            type: 'Goals Progress Report',
                            period: `${startDate} to ${endDate}`,
                            goals: data.goals || [],
                            summary: {
                                total: data.goals?.length || 0,
                                completed: data.goals?.filter(g => {
                                    const current = g.current || g.current_amount || 0;
                                    return current >= (g.target || 0) && g.target > 0;
                                }).length || 0
                            }
                        };
                        break;
                    case 'investments':
                        reportData = {
                            type: 'Investment Report',
                            period: `${startDate} to ${endDate}`,
                            investments: data.investments || {},
                            assets: data.assets || {},
                            portfolioValue: data.investments?.portfolio_value || 
                                          ((data.assets?.mutual_funds || 0) + (data.assets?.stocks || 0))
                        };
                        break;
                    case 'budget':
                        reportData = {
                            type: 'Budget Report',
                            period: `${startDate} to ${endDate}`,
                            budget: data.budget || {},
                            transactions: data.transactions || []
                        };
                        break;
                    default:
                        reportData = data;
                }
                
                // Prepare report data for saving
                const reportToSave = {
                    ...reportData,
                    type: reportData.type || reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report',
                    period: `${startDate} to ${endDate}`,
                    format: format,
                    generated_at: new Date().toISOString()
                };
                
                // Save report to backend
                try {
                    await apiRequest('/finance/save_report', 'POST', reportToSave);
                    toast.success('Report generated, downloaded, and saved!');
                } catch (error) {
                    console.error('Error saving report:', error);
                    toast.warning('Report generated and downloaded, but failed to save to server');
                }
                
                // Download report
                if (format === 'json') {
                    downloadJSON(reportData, `report-${reportType}-${new Date().toISOString().split('T')[0]}.json`);
                    // Reload reports list
                    loadReportsData();
                } else if (format === 'pdf') {
                    // Generate PDF via backend (fetch for binary data)
                    try {
                        const token = localStorage.getItem('token');
                        const pdfResponse = await fetch('/api/finance/generate_pdf', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(reportToSave)
                        });
                        
                        if (!pdfResponse.ok) {
                            throw new Error('Failed to generate PDF');
                        }
                        
                        const blob = await pdfResponse.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast.success('PDF report generated and downloaded!');
                        // Reload reports list
                        loadReportsData();
                    } catch (error) {
                        console.error('Error generating PDF:', error);
                        toast.error('Failed to generate PDF report');
                    }
                }
            } catch (error) {
                toast.error('Failed to generate report');
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

// CSV download function removed - PDF is now the primary format

// addToRecentReports is now replaced by loadReportsData() which fetches from backend

async function exportMonthlyReport() {
    try {
        toast.info('Generating monthly report...');
        const data = await getFinancialData();
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        const reportData = {
            type: 'Monthly Report',
            period: `${startDate} to ${endDate}`,
            month: today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            assets: data.assets || {},
            liabilities: data.liabilities || {},
            budget: data.budget || {},
            transactions: data.transactions || []
        };
        
        // Save to backend
        try {
            await apiRequest('/finance/save_report', 'POST', {
                ...reportData,
                generated_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving report:', error);
        }
        
        downloadJSON(reportData, `monthly-report-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Monthly report downloaded and saved!');
        loadReportsData();
    } catch (error) {
        console.error('Error generating monthly report:', error);
        toast.error('Failed to generate monthly report');
    }
}

async function exportGoalsReport() {
    try {
        toast.info('Generating goals report...');
        const data = await getFinancialData();
        const goals = data.goals || [];
        const today = new Date();
        
        const reportData = {
            type: 'Goals Progress Report',
            period: `All time`,
            goals: goals,
            summary: {
                total: goals.length,
                completed: goals.filter(g => {
                    const current = g.current || g.current_amount || 0;
                    return current >= (g.target || 0) && g.target > 0;
                }).length,
                in_progress: goals.filter(g => {
                    const current = g.current || g.current_amount || 0;
                    const target = g.target || 0;
                    return current > 0 && current < target && target > 0;
                }).length
            },
            generated_at: today.toISOString()
        };
        
        // Save to backend
        try {
            await apiRequest('/finance/save_report', 'POST', reportData);
        } catch (error) {
            console.error('Error saving report:', error);
        }
        
        downloadJSON(reportData, `goals-report-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Goals report downloaded and saved!');
        loadReportsData();
    } catch (error) {
        console.error('Error generating goals report:', error);
        toast.error('Failed to generate goals report');
    }
}

async function exportInvestmentsReport() {
    try {
        toast.info('Generating investments report...');
        const data = await getFinancialData();
        const investments = data.investments || [];
        
        const reportData = {
            type: 'Investment Report',
            period: `All time`,
            investments: investments,
            assets: data.assets || {},
            portfolioValue: investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0),
            totalInvested: investments.reduce((sum, inv) => sum + (inv.amount_invested || 0), 0),
            generated_at: new Date().toISOString()
        };
        
        // Save to backend
        try {
            await apiRequest('/finance/save_report', 'POST', reportData);
        } catch (error) {
            console.error('Error saving report:', error);
        }
        
        downloadJSON(reportData, `investments-report-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Investments report downloaded and saved!');
        loadReportsData();
    } catch (error) {
        console.error('Error generating investments report:', error);
        toast.error('Failed to generate investments report');
    }
}

// ========== INSIGHTS PAGE ==========
async function loadInsightsPageData() {
    try {
        console.log('🔄 Loading AI-powered Insights...');
        
        // Show loading state
        const insightsContainer = document.getElementById('detailedInsights');
        if (insightsContainer) {
            insightsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-tertiary);">Analyzing your complete financial data with AI...</p>
                </div>
            `;
        }
        
        console.log('🤖 Calling AI insights endpoint...');
        
        // Call dedicated insights API endpoint
        const insightsResponse = await apiRequest('/finance/generate_insights', 'POST');
        
        console.log('✅ AI insights received:', insightsResponse);
        
        const aiInsightsText = insightsResponse.data?.insights || insightsResponse.message || 'Unable to generate insights at this time.';
        
        // Parse AI response into structured insights (try to extract key points)
        const insights = parseAIInsights(aiInsightsText);
        
        let warningCount = 0;
        let positiveCount = 0;
        let infoCount = 0;
        
        // Count insight types
        insights.forEach(insight => {
            if (insight.type === 'warning' || insight.type === 'error') {
                warningCount++;
            } else if (insight.type === 'success') {
                positiveCount++;
            } else {
                infoCount++;
            }
        });
        
        // Update stat cards
        updateElement('totalInsights', insights.length);
        updateElement('warningInsights', warningCount);
        updateElement('positiveInsights', positiveCount);
        
        // Display AI-generated insights
        if (insightsContainer) {
            if (insights.length > 0) {
                let html = '';
                html += `
                    <div style="padding: 1rem; background: var(--bg-elevated); border-radius: var(--radius-md); margin-bottom: 1.5rem; border-left: 4px solid var(--accent-primary);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-brain" style="color: var(--accent-primary);"></i>
                            <strong style="color: var(--text-primary);">AI-Powered Analysis</strong>
                        </div>
                        <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">Comprehensive financial insights generated by FinGenie AI</p>
                    </div>
                `;
                
                insights.forEach((insight, index) => {
                    const icon = insight.type === 'success' ? 'fa-check-circle' : 
                                insight.type === 'warning' ? 'fa-exclamation-triangle' : 
                                insight.type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
                    const color = insight.type === 'success' ? '#10b981' : 
                                 insight.type === 'warning' ? '#f59e0b' : 
                                 insight.type === 'error' ? '#ef4444' : '#3b82f6';
                    
                    // Extract one-line summary (first line or first sentence)
                    const fullText = cleanMarkdown(insight.text);
                    const summary = getInsightSummary(fullText);
                    const details = formatInsightDetails(fullText);
                    const cardId = `insight-card-${index}`;
                    
                    // Escape any quotes in title for onclick
                    const safeTitle = (insight.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    
                    html += `
                        <div id="${cardId}" class="insight-card" style="padding: 1rem; border-left: 4px solid ${color}; background: var(--bg-elevated); margin-bottom: 0.75rem; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" onclick="toggleInsightCard('${cardId}')" onmouseover="this.style.boxShadow='0 2px 6px rgba(0,0,0,0.15)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <i class="fas ${icon}" style="color: ${color}; font-size: 1.25rem; flex-shrink: 0;"></i>
                                <div style="flex: 1; min-width: 0;">
                                    ${insight.title ? `<div style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem; margin-bottom: 0.25rem;">${safeTitle}</div>` : ''}
                                    <div class="insight-summary" style="color: var(--text-primary); line-height: 1.5; font-size: 0.9rem;">${summary}</div>
                                    <div class="insight-details" style="display: none; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-primary); color: var(--text-primary); line-height: 1.6; font-size: 0.9rem;">${details}</div>
                                </div>
                                <i class="fas fa-chevron-down insight-chevron" style="color: var(--text-tertiary); font-size: 0.875rem; transition: transform 0.2s ease; flex-shrink: 0;"></i>
                            </div>
                        </div>
                    `;
                });
                
                // Also show full AI response in a collapsible section
                html += `
                    <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-elevated); border-radius: var(--radius-md);">
                        <details style="cursor: pointer;">
                            <summary style="font-weight: 600; color: var(--text-primary); padding: 0.5rem; user-select: none;">
                                <i class="fas fa-chevron-down"></i> View Full AI Analysis
                            </summary>
                            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-sm); color: var(--text-primary); line-height: 1.8; white-space: pre-wrap;">${markdownToHtml(aiInsightsText)}</div>
                        </details>
                    </div>
                `;
                
                insightsContainer.innerHTML = html;
            } else {
                // Fallback: show raw AI response if parsing fails
                insightsContainer.innerHTML = `
                    <div style="padding: 1.5rem; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 4px solid var(--accent-primary);">
                        <div style="display: flex; align-items: start; gap: 1rem;">
                            <i class="fas fa-brain" style="color: var(--accent-primary); font-size: 1.5rem; margin-top: 0.25rem;"></i>
                            <div style="flex: 1; color: var(--text-primary); line-height: 1.8; white-space: pre-wrap;">${markdownToHtml(aiInsightsText)}</div>
                        </div>
                    </div>
                `;
            }
        }
        
        console.log('✅ AI Insights page rendered successfully');
    } catch (error) {
        console.error('❌ Error loading AI insights:', error);
        const insightsContainer = document.getElementById('detailedInsights');
        if (insightsContainer) {
            insightsContainer.innerHTML = `
                <div style="padding: 1rem; border-left: 4px solid #ef4444; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                    <div style="display: flex; align-items: start; gap: 1rem;">
                        <i class="fas fa-exclamation-circle" style="color: #ef4444; font-size: 1.5rem;"></i>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">Error Loading Insights</h4>
                            <p style="margin: 0; color: var(--text-secondary);">Unable to generate AI insights at this time: ${error.message}</p>
                            <button class="btn btn-primary" onclick="refreshInsights()" style="margin-top: 1rem;">Retry</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// Helper function to build financial summary for AI (kept for backward compatibility, but insights now use backend)
function buildFinancialSummaryForAI(data) {
    // This function is now primarily used for reference
    // Actual insights generation uses backend endpoint with comprehensive data
    const assets = data.assets || {};
    const liabilities = data.liabilities || {};
    const goals = data.goals || [];
    const budget = data.budget || {};
    const transactions = data.transactions || [];
    const investments = data.investments || [];
    
    const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0) +
                       (assets.real_estate || 0) + (assets.fixed_deposits || 0) + (assets.gold || 0);
    
    const totalLiabilities = (liabilities.loan || 0) + (liabilities.home_loan || 0) +
                            (liabilities.car_loan || 0) + (liabilities.personal_loan || 0) +
                            (liabilities.credit_card_due || 0);
    
    let summary = `FINANCIAL SUMMARY (All amounts in ₹):
    
ASSETS:
- Savings: ₹${(assets.savings || 0).toLocaleString()}
- Mutual Funds: ₹${(assets.mutual_funds || 0).toLocaleString()}
- Stocks: ₹${(assets.stocks || 0).toLocaleString()}
- Real Estate: ₹${(assets.real_estate || 0).toLocaleString()}
- Fixed Deposits: ₹${(assets.fixed_deposits || 0).toLocaleString()}
- Gold: ₹${(assets.gold || 0).toLocaleString()}
- Total Assets: ₹${totalAssets.toLocaleString()}

LIABILITIES:
- Home Loan: ₹${(liabilities.home_loan || 0).toLocaleString()}
- Car Loan: ₹${(liabilities.car_loan || 0).toLocaleString()}
- Personal Loan: ₹${(liabilities.personal_loan || 0).toLocaleString()}
- Credit Card Due: ₹${(liabilities.credit_card_due || 0).toLocaleString()}
- Other Loans: ₹${(liabilities.loan || 0).toLocaleString()}
- Total Liabilities: ₹${totalLiabilities.toLocaleString()}

NET WORTH: ₹${(totalAssets - totalLiabilities).toLocaleString()}

GOALS:`;
    
    if (goals.length > 0) {
        goals.forEach(goal => {
            const current = goal.current || goal.current_amount || 0;
            const progress = goal.target > 0 ? Math.round((current / goal.target) * 100) : 0;
            summary += `\n- ${goal.name}: ₹${current.toLocaleString()} / ₹${goal.target.toLocaleString()} (${progress}%) by ${goal.year}`;
        });
    } else {
        summary += '\n- No goals set';
    }
    
    summary += '\n\nBUDGET:';
    const budgetCategories = budget.categories || [];
    if (budgetCategories.length > 0) {
        const totalBudget = budgetCategories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
        const totalSpent = budgetCategories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
        summary += `\n- Monthly Budget: ₹${totalBudget.toLocaleString()}`;
        summary += `\n- Spent This Month: ₹${totalSpent.toLocaleString()}`;
        budgetCategories.forEach(cat => {
            const percent = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
            summary += `\n  * ${cat.name}: ₹${cat.spent.toLocaleString()} / ₹${cat.budget.toLocaleString()} (${percent}%)`;
        });
    } else {
        summary += '\n- No budget data';
    }
    
    summary += '\n\nRECENT TRANSACTIONS:';
    if (transactions.length > 0) {
        const recentTransactions = transactions.slice(-10);
        recentTransactions.forEach(txn => {
            const type = txn.type === 'income' ? '+' : '-';
            summary += `\n${type} ₹${txn.amount.toLocaleString()} - ${txn.description || txn.category} (${txn.date || 'Unknown date'})`;
        });
    } else {
        summary += '\n- No recent transactions';
    }
    
    summary += '\n\nINVESTMENTS:';
    // Handle investments as array
    if (Array.isArray(investments) && investments.length > 0) {
        investments.forEach(inv => {
            const currentValue = inv.current_value || inv.value || 0;
            const invested = inv.amount_invested || inv.principal || 0;
            const returns = inv.returns || ((currentValue - invested) / invested * 100) || 0;
            summary += `\n  * ${inv.name || 'Investment'}: ₹${currentValue.toLocaleString()} (Returns: ${returns.toFixed(2)}%)`;
        });
    } else if (investments.portfolio_value) {
        summary += `\n- Portfolio Value: ₹${investments.portfolio_value.toLocaleString()}`;
        if (investments.holdings && investments.holdings.length > 0) {
            investments.holdings.forEach(holding => {
                const gainLoss = holding.gain_loss || 0;
                summary += `\n  * ${holding.name}: ₹${(holding.value || 0).toLocaleString()} (${gainLoss >= 0 ? '+' : ''}₹${gainLoss.toLocaleString()})`;
            });
        }
    } else {
        summary += '\n- No investment data';
    }
    
    return summary;
}

// Helper function to parse AI response into structured insights
function parseAIInsights(aiText) {
    const insights = [];
    
    // Clean the text - remove any greetings or explanations
    let cleanedText = aiText.trim();
    
    // Remove common greeting patterns at the start
    const greetingPatterns = [
        /^hello[^\n]*\n/i,
        /^hi[^\n]*\n/i,
        /^here[^\n]*insights[^\n]*\n/i,
        /^based[^\n]*data[^\n]*\n/i,
        /^let[^\n]*analyze[^\n]*\n/i
    ];
    
    greetingPatterns.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
    });
    
    // Split into sections by headers (## or all-caps section names)
    const sections = [];
    const lines = cleanedText.split('\n');
    let currentSection = { title: null, content: [] };
    
    lines.forEach(line => {
        const trimmed = line.trim();
        
        // Check if it's a section header
        const isMarkdownHeader = trimmed.match(/^##+\s+(.+)$/);
        const isAllCapsHeader = trimmed.match(/^[A-Z][A-Z\s]+$/); // All caps, no special chars except spaces
        const isEmptyAfterBullets = trimmed === '' || trimmed === '•' || trimmed === '-';
        
        if (isMarkdownHeader) {
            // Save previous section if it has content
            if (currentSection.title || currentSection.content.length > 0) {
                sections.push(currentSection);
            }
            currentSection = {
                title: isMarkdownHeader[1].trim(),
                content: []
            };
        } else if (isAllCapsHeader && trimmed.length > 3 && trimmed.length < 50 && !trimmed.includes('₹')) {
            // Save previous section
            if (currentSection.title || currentSection.content.length > 0) {
                sections.push(currentSection);
            }
            currentSection = {
                title: trimmed,
                content: []
            };
        } else if (!isEmptyAfterBullets) {
            // Add to current section
            currentSection.content.push(trimmed);
        }
    });
    
    // Add last section
    if (currentSection.title || currentSection.content.length > 0) {
        sections.push(currentSection);
    }
    
    // Convert sections to insights
    sections.forEach(section => {
        if (!section.title && section.content.length === 0) return;
        
        // Determine type from title/content
        let type = 'info';
        const titleLower = (section.title || '').toLowerCase();
        const contentText = section.content.join(' ').toLowerCase();
        
        if (titleLower.includes('warning') || titleLower.includes('alert') || titleLower.includes('concern') ||
            contentText.includes('critical') || contentText.includes('urgent') || contentText.includes('deficit')) {
            type = 'warning';
        } else if (titleLower.includes('strength') || titleLower.includes('positive') || titleLower.includes('achievement') ||
                   contentText.includes('excellent') || contentText.includes('great') || contentText.includes('robust')) {
            type = 'success';
        } else if (titleLower.includes('critical') || titleLower.includes('error') || contentText.includes('immediate action')) {
            type = 'error';
        }
        
        insights.push({
            type: type,
            title: section.title || 'Financial Insight',
            text: section.content.join('\n')
        });
    });
    
    // If no structured insights found, create one from the whole cleaned text
    if (insights.length === 0 && cleanedText) {
        insights.push({
            type: 'info',
            title: 'Financial Insights',
            text: cleanedText
        });
    }
    
    return insights;
}

// Helper function for markdown to HTML (basic version)
function markdownToHtml(text) {
    if (!text) return '';
    return text
        .replace(/### (.*$)/gim, '<h3>$1</h3>')
        .replace(/## (.*$)/gim, '<h2>$1</h2>')
        .replace(/# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

window.refreshInsights = async function() {
    try {
        toast.info('Refreshing insights...');
        await loadInsightsPageData();
        toast.success('Insights refreshed!');
    } catch (error) {
        console.error('Error refreshing insights:', error);
        toast.error('Failed to refresh insights');
    }
};

// Helper function to toggle insight card expansion
window.toggleInsightCard = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const summary = card.querySelector('.insight-summary');
    const details = card.querySelector('.insight-details');
    const chevron = card.querySelector('.insight-chevron');
    
    if (!details || !summary || !chevron) return;
    
    const isExpanded = details.style.display !== 'none';
    
    if (isExpanded) {
        details.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
    } else {
        details.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
    }
};

// Helper function to clean markdown formatting
function cleanMarkdown(text) {
    if (!text) return '';
    
    // Remove markdown headers
    text = text.replace(/^#{1,6}\s+/gm, '');
    
    // Remove markdown bold/italic but keep text
    text = text.replace(/\*\*([^\*]+)\*\*/g, '$1');  // Bold
    text = text.replace(/\*([^\*]+)\*/g, '$1');      // Italic
    text = text.replace(/__([^_]+)__/g, '$1');        // Bold
    text = text.replace(/_([^_]+)_/g, '$1');           // Italic
    
    // Remove markdown list markers but keep content
    text = text.replace(/^[-*•]\s+/gm, '');
    text = text.replace(/^\d+[.)]\s+/gm, '');
    
    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    
    return text;
}

// Helper function to extract one-line summary from insight text
function getInsightSummary(text) {
    if (!text) return '';
    
    // First, clean markdown
    const cleaned = cleanMarkdown(text);
    
    // Get first line or first sentence
    const firstLine = cleaned.split('\n')[0].trim();
    const firstSentence = cleaned.split(/[.!?]\s+/)[0].trim();
    
    // Use shorter of first line or first sentence, max 120 chars
    let summary = firstLine.length <= firstSentence.length ? firstLine : firstSentence;
    
    if (summary.length > 120) {
        const truncated = summary.substring(0, 117).trim();
        const lastSpace = truncated.lastIndexOf(' ');
        summary = (lastSpace > 80 ? truncated.substring(0, lastSpace) : truncated) + '...';
    }
    
    return summary || cleaned.substring(0, 120) + '...';
}

// Helper function to format insight details with proper line breaks and HTML escaping
function formatInsightDetails(text) {
    if (!text) return '';
    
    // Clean markdown first
    const cleaned = cleanMarkdown(text);
    
    // Escape HTML to prevent XSS and then format
    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    // Split by lines and format properly
    const lines = cleaned.split('\n');
    const formatted = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        // Escape HTML
        const escaped = escapeHtml(trimmed);
        
        // If it looks like a bullet point (starts with specific chars after cleaning)
        if (trimmed.match(/^[•\-]/) || trimmed.startsWith('**')) {
            return '<div style="margin: 0.5rem 0; padding-left: 1rem; position: relative;">' +
                   '<span style="position: absolute; left: 0;">•</span> ' +
                   escaped.replace(/^\*\*/, '').replace(/\*\*$/, '') +
                   '</div>';
        }
        
        // Regular paragraph
        return '<div style="margin: 0.75rem 0; line-height: 1.6;">' + escaped + '</div>';
    }).filter(line => line).join('');
    
    return formatted || escapeHtml(cleaned);
}

// Update sidebar user info
async function updateSidebarUserInfo() {
    try {
        // Try to fetch from backend first
        try {
            const profileResponse = await apiRequest('/auth/profile', 'GET');
            
            if (profileResponse.success && profileResponse.user) {
                const user = profileResponse.user;
                const nameEl = document.querySelector('.sidebar-user-name');
                const emailEl = document.querySelector('.sidebar-user-email');
                if (nameEl) nameEl.textContent = user.name || 'User';
                if (emailEl) emailEl.textContent = user.email || 'user@example.com';
                return;
            }
        } catch (error) {
            console.warn('Could not fetch profile for sidebar, using token:', error);
        }
        
        // Fallback to token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const nameEl = document.querySelector('.sidebar-user-name');
                const emailEl = document.querySelector('.sidebar-user-email');
                if (nameEl) nameEl.textContent = payload.name || 'User';
                if (emailEl) emailEl.textContent = payload.email || 'user@example.com';
            } catch (e) {
                console.warn('Could not decode token for sidebar:', e);
            }
        }
    } catch (error) {
        console.error('Error updating sidebar user info:', error);
    }
}

// Make it globally available
window.updateSidebarUserInfo = updateSidebarUserInfo;

// ========== PROFILE PAGE ==========
async function loadProfileData() {
    try {
        console.log('🔄 Loading profile data...');
        
        // Fetch user profile from backend
        try {
            const profileResponse = await apiRequest('/auth/profile', 'GET');
            
            if (profileResponse.success && profileResponse.user) {
                const user = profileResponse.user;
                
                // Update display header
                updateElement('profileDisplayName', user.name || 'User');
                updateElement('profileDisplayEmail', user.email || 'user@example.com');
                
                // Update sidebar user info
                const nameEl = document.querySelector('.sidebar-user-name');
                const emailEl = document.querySelector('.sidebar-user-email');
                if (nameEl) nameEl.textContent = user.name || 'User';
                if (emailEl) emailEl.textContent = user.email || 'user@example.com';
                
                // Populate form fields
                const nameInput = document.getElementById('profileName');
                const emailInput = document.getElementById('profileEmail');
                const phoneInput = document.getElementById('profilePhone');
                const dobInput = document.getElementById('profileDOB');
                
                if (nameInput) nameInput.value = user.name || '';
                if (emailInput) emailInput.value = user.email || '';
                if (phoneInput) phoneInput.value = user.phone || '';
                if (dobInput) dobInput.value = user.date_of_birth || '';
            } else {
                // Fallback to token if API fails
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        updateElement('profileDisplayName', payload.name || 'User');
                        updateElement('profileDisplayEmail', payload.email || 'user@example.com');
                        // Update sidebar
                        if (typeof updateSidebarUserInfo === 'function') {
                            updateSidebarUserInfo();
                        }
                        if (document.getElementById('profileName')) document.getElementById('profileName').value = payload.name || '';
                        if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = payload.email || '';
                    } catch (e) {
                        console.warn('Could not decode token');
                    }
                }
            }
        } catch (error) {
            console.warn('Could not fetch profile from backend, using token:', error);
            // Fallback to token
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    updateElement('profileDisplayName', payload.name || 'User');
                    updateElement('profileDisplayEmail', payload.email || 'user@example.com');
                    // Update sidebar
                    if (typeof updateSidebarUserInfo === 'function') {
                        updateSidebarUserInfo();
                    }
                    if (document.getElementById('profileName')) document.getElementById('profileName').value = payload.name || '';
                    if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = payload.email || '';
                } catch (e) {
                    console.warn('Could not decode token');
                }
            }
        }
        
        // Load account statistics
        try {
            const statsResponse = await apiRequest('/auth/profile/stats', 'GET');
            
            if (statsResponse.success && statsResponse.stats) {
                const stats = statsResponse.stats;
                updateElement('accountDaysActive', stats.days_active || '0');
                updateElement('accountDataUpdates', stats.data_updates || '0');
                updateElement('accountGoalsSet', stats.goals_set || '0');
                updateElement('accountReportsGen', stats.reports_generated || '0');
            } else {
                // Fallback to basic stats
                const goalsData = await getFinancialData().catch(() => ({ goals: [] }));
                updateElement('accountDaysActive', '1');
                updateElement('accountDataUpdates', '0');
                updateElement('accountGoalsSet', (goalsData.goals || []).length);
                updateElement('accountReportsGen', '0');
            }
        } catch (error) {
            console.warn('Could not fetch stats, using fallback:', error);
            // Fallback to basic stats
            const goalsData = await getFinancialData().catch(() => ({ goals: [] }));
            updateElement('accountDaysActive', '1');
            updateElement('accountDataUpdates', '0');
            updateElement('accountGoalsSet', (goalsData.goals || []).length);
            updateElement('accountReportsGen', '0');
        }
        
        // Load 2FA setting
        try {
            const profileData = await apiRequest('/auth/profile', 'GET');
            if (profileData.success && profileData.user) {
                const twoFactorEnabled = profileData.user.two_factor_enabled || false;
                update2FAToggle(twoFactorEnabled);
            }
        } catch (error) {
            console.warn('Could not load 2FA setting:', error);
        }
        
        console.log('✅ Profile data loaded');
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        toast.error('Failed to load profile data');
    }
}

// Helper function to update 2FA toggle visual state
function update2FAToggle(enabled) {
    const checkbox = document.getElementById('enable2FA');
    const toggleSlider = document.querySelector('#enable2FA').closest('label').querySelector('.toggle-slider');
    const toggleKnob = toggleSlider ? toggleSlider.querySelector('.toggle-knob') : null;
    const statusText = document.getElementById('twoFactorStatus');
    
    if (checkbox) {
        checkbox.checked = enabled;
    }
    
    if (toggleSlider && toggleKnob) {
        if (enabled) {
            toggleSlider.style.backgroundColor = 'var(--accent-primary)';
            toggleKnob.style.transform = 'translateX(24px)';
        } else {
            toggleSlider.style.backgroundColor = 'var(--bg-tertiary)';
            toggleKnob.style.transform = 'translateX(0)';
        }
    }
    
    if (statusText) {
        statusText.textContent = enabled 
            ? 'Two-factor authentication is enabled' 
            : 'Add an extra layer of security';
    }
}

function setupProfileHandlers() {
    const form = document.getElementById('profileForm');
    if (form) {
        // Remove any existing listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        document.getElementById('profileForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('profileName');
            const emailInput = document.getElementById('profileEmail');
            const phoneInput = document.getElementById('profilePhone');
            const dobInput = document.getElementById('profileDOB');
            
            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const dateOfBirth = dobInput ? dobInput.value : '';
            
            if (!name || !email) {
                toast.error('Name and email are required');
                return;
            }
            
            try {
                toast.info('Updating profile...');
                
                const updateData = { name, email };
                if (phone) updateData.phone = phone;
                if (dateOfBirth) updateData.date_of_birth = dateOfBirth;
                
                const response = await apiRequest('/auth/update_profile', 'POST', updateData);
                
                if (response.success) {
                    // Update display
                    updateElement('profileDisplayName', name);
                    updateElement('profileDisplayEmail', email);
                    
                    // Update token if email changed (new token returned)
                    if (response.token) {
                        localStorage.setItem('token', response.token);
                        toast.success('Profile updated successfully! Please refresh the page.');
                        // Update sidebar before refresh
                        if (typeof updateSidebarUserInfo === 'function') {
                            updateSidebarUserInfo();
                        }
                    } else {
                        toast.success('Profile updated successfully!');
                        // Update sidebar immediately
                        if (typeof updateSidebarUserInfo === 'function') {
                            updateSidebarUserInfo();
                        }
                    }
                } else {
                    toast.error(response.error || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                toast.error(error.message || 'Failed to update profile');
            }
        });
    }
    
    // Setup 2FA toggle handler
    const twoFactorCheckbox = document.getElementById('enable2FA');
    if (twoFactorCheckbox) {
        // Remove existing listeners
        const newCheckbox = twoFactorCheckbox.cloneNode(true);
        twoFactorCheckbox.parentNode.replaceChild(newCheckbox, twoFactorCheckbox);
        
        document.getElementById('enable2FA').addEventListener('change', async function(e) {
            const enabled = this.checked;
            
            if (enabled) {
                // Show setup modal when enabling
                show2FASetupModal();
                // Revert checkbox until setup is complete
                this.checked = false;
                update2FAToggle(false);
            } else {
                // Disable 2FA
                try {
                    toast.info('Disabling two-factor authentication...');
                    
                    const response = await apiRequest('/auth/update_2fa', 'POST', {
                        enabled: false
                    });
                    
                    if (response.success) {
                        update2FAToggle(false);
                        toast.success('Two-factor authentication disabled successfully!');
                    } else {
                        // Revert checkbox state on error
                        this.checked = true;
                        update2FAToggle(true);
                        toast.error(response.error || 'Failed to disable two-factor authentication');
                    }
                } catch (error) {
                    console.error('Error disabling 2FA:', error);
                    // Revert checkbox state on error
                    this.checked = true;
                    update2FAToggle(true);
                    toast.error(error.message || 'Failed to disable two-factor authentication');
                }
            }
        });
    }
}

window.show2FASetupModal = async function() {
    try {
        toast.info('Generating 2FA setup...');
        
        // Get TOTP secret and QR code
        const setupResponse = await apiRequest('/auth/setup_2fa', 'POST');
        
        if (!setupResponse.success) {
            toast.error(setupResponse.error || 'Failed to generate 2FA setup');
            return;
        }
        
        const { secret, qr_code, manual_entry_key } = setupResponse;
        let currentSecret = secret; // Store for verification
        
        showInfoModal(
            'Setup Two-Factor Authentication',
            `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">Scan this QR code with your authenticator app:</p>
                <div style="display: flex; justify-content: center; margin-bottom: 1rem; padding: 1rem; background: white; border-radius: var(--radius-md);">
                    <img src="${qr_code}" alt="2FA QR Code" style="max-width: 250px; height: auto;">
                </div>
                <p style="color: var(--text-tertiary); font-size: 0.875rem; margin-bottom: 0.5rem;">Or enter this code manually:</p>
                <div style="background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-sm); font-family: monospace; font-size: 0.9rem; letter-spacing: 2px; margin-bottom: 1rem;">
                    ${manual_entry_key}
                </div>
            </div>
            <form id="verify2FAForm">
                <div class="form-group">
                    <label class="form-label">Enter the 6-digit code from your authenticator app</label>
                    <input type="text" class="form-control" id="totpCode" placeholder="000000" maxlength="6" pattern="[0-9]{6}" required style="text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; font-family: monospace;">
                </div>
                <button type="submit" class="btn btn-primary w-100">
                    <i class="fas fa-check"></i> Verify & Enable
                </button>
                <button type="button" class="btn btn-secondary w-100" onclick="closeModal('infoModal')" style="margin-top: 0.5rem;">
                    Cancel
                </button>
            </form>
            `
        );
        
        // Focus on code input
        setTimeout(() => {
            const codeInput = document.getElementById('totpCode');
            if (codeInput) {
                codeInput.focus();
                // Auto-format as user types
                codeInput.addEventListener('input', function(e) {
                    this.value = this.value.replace(/\D/g, '').slice(0, 6);
                });
            }
        }, 100);
        
        // Handle form submission
        setTimeout(() => {
            const verifyForm = document.getElementById('verify2FAForm');
            if (verifyForm) {
                verifyForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const code = document.getElementById('totpCode').value.trim();
                    
                    if (code.length !== 6) {
                        toast.error('Please enter a valid 6-digit code');
                        return;
                    }
                    
                    try {
                        toast.info('Verifying code...');
                        
                        const response = await apiRequest('/auth/verify_2fa_setup', 'POST', {
                            code: code,
                            secret: currentSecret
                        });
                        
                        if (response.success) {
                            toast.success('Two-factor authentication enabled successfully!');
                            closeModal('infoModal');
                            
                            // Update toggle state
                            const checkbox = document.getElementById('enable2FA');
                            if (checkbox) {
                                checkbox.checked = true;
                                update2FAToggle(true);
                            }
                            
                            // Reload profile to get updated state
                            await loadProfileData();
                        } else {
                            toast.error(response.error || 'Invalid code. Please try again.');
                            document.getElementById('totpCode').value = '';
                            document.getElementById('totpCode').focus();
                        }
                    } catch (error) {
                        console.error('Error verifying 2FA:', error);
                        toast.error(error.message || 'Failed to verify code');
                        document.getElementById('totpCode').value = '';
                        document.getElementById('totpCode').focus();
                    }
                });
            }
        }, 100);
        
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        toast.error(error.message || 'Failed to setup two-factor authentication');
    }
};

window.showChangePasswordModal = function() {
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
                <input type="password" class="form-control" id="newPassword" required minlength="6">
                <small style="color: var(--text-tertiary); font-size: 0.875rem;">Password must be at least 6 characters</small>
            </div>
            <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-control" id="confirmPassword" required minlength="6">
            </div>
            <button type="submit" class="btn btn-primary w-100">
                <i class="fas fa-key"></i> Change Password
            </button>
        </form>
        `
    );
    
    // Remove any existing listeners and add new one
    setTimeout(() => {
        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            // Clone to remove existing listeners
            const newForm = passwordForm.cloneNode(true);
            passwordForm.parentNode.replaceChild(newForm, passwordForm);
            
            document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const currentPass = document.getElementById('currentPassword').value;
                const newPass = document.getElementById('newPassword').value;
                const confirmPass = document.getElementById('confirmPassword').value;
                
                if (!currentPass || !newPass || !confirmPass) {
                    toast.error('All fields are required');
                    return;
                }
                
                if (newPass !== confirmPass) {
                    toast.error('New passwords do not match');
                    return;
                }
                
                if (newPass.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    return;
                }
                
                try {
                    toast.info('Changing password...');
                    
                    const response = await apiRequest('/auth/change_password', 'POST', {
                        current_password: currentPass,
                        new_password: newPass,
                        confirm_password: confirmPass
                    });
                    
                    if (response.success) {
                        toast.success('Password changed successfully!');
                        closeModal('infoModal');
                        
                        // Clear form
                        document.getElementById('currentPassword').value = '';
                        document.getElementById('newPassword').value = '';
                        document.getElementById('confirmPassword').value = '';
                    } else {
                        toast.error(response.error || 'Failed to change password');
                    }
                } catch (error) {
                    console.error('Error changing password:', error);
                    toast.error(error.message || 'Failed to change password');
                }
            });
        }
    }, 100);
};

// ========== SETTINGS PAGE ==========
async function loadSettingsData() {
    try {
        // Load settings from backend
        const response = await apiRequest('/auth/settings', 'GET');
        
        if (response.success && response.settings) {
            const settings = response.settings;
            
            // General settings
            const currency = settings.currency || 'INR';
            const language = settings.language || 'en';
            const dateFormat = settings.dateFormat || 'DD/MM/YYYY';
            
            // Notification settings
            const emailNotifications = settings.emailNotifications !== false;
            const financialAlerts = settings.financialAlerts !== false;
            const goalReminders = settings.goalReminders !== false;
            const insightUpdates = settings.insightUpdates !== false;
            
            // Set form values
            if (document.getElementById('currencySetting')) {
                document.getElementById('currencySetting').value = currency;
            }
            if (document.getElementById('languageSetting')) {
                document.getElementById('languageSetting').value = language;
            }
            if (document.getElementById('dateFormatSetting')) {
                document.getElementById('dateFormatSetting').value = dateFormat;
            }
            if (document.getElementById('emailNotifications')) {
                document.getElementById('emailNotifications').checked = emailNotifications;
            }
            if (document.getElementById('financialAlerts')) {
                document.getElementById('financialAlerts').checked = financialAlerts;
            }
            if (document.getElementById('goalReminders')) {
                document.getElementById('goalReminders').checked = goalReminders;
            }
            if (document.getElementById('insightUpdates')) {
                document.getElementById('insightUpdates').checked = insightUpdates;
            }
        } else {
            // Use defaults if no settings found
            loadSettingsDataDefaults();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        // Load defaults on error
        loadSettingsDataDefaults();
    }
}

function loadSettingsDataDefaults() {
    // Set default values
    if (document.getElementById('currencySetting')) {
        document.getElementById('currencySetting').value = 'INR';
    }
    if (document.getElementById('languageSetting')) {
        document.getElementById('languageSetting').value = 'en';
    }
    if (document.getElementById('dateFormatSetting')) {
        document.getElementById('dateFormatSetting').value = 'DD/MM/YYYY';
    }
    if (document.getElementById('emailNotifications')) {
        document.getElementById('emailNotifications').checked = false;
    }
    if (document.getElementById('financialAlerts')) {
        document.getElementById('financialAlerts').checked = true;
    }
    if (document.getElementById('goalReminders')) {
        document.getElementById('goalReminders').checked = true;
    }
    if (document.getElementById('insightUpdates')) {
        document.getElementById('insightUpdates').checked = true;
    }
}

async function saveSettingsToBackend(settings) {
    try {
        const response = await apiRequest('/auth/settings', 'POST', {
            settings: settings
        });
        
        if (response.success) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

function setupSettingsHandlers() {
    const form = document.getElementById('settingsForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currency = document.getElementById('currencySetting').value;
            const language = document.getElementById('languageSetting').value;
            const dateFormat = document.getElementById('dateFormatSetting').value;
            
            // Get current settings and update general settings
            try {
                const currentResponse = await apiRequest('/auth/settings', 'GET');
                const currentSettings = (currentResponse.success && currentResponse.settings) ? currentResponse.settings : {};
                
                const updatedSettings = {
                    ...currentSettings,
                    currency: currency,
                    language: language,
                    dateFormat: dateFormat
                };
                
                const saved = await saveSettingsToBackend(updatedSettings);
                if (saved) {
                    toast.success('General settings saved successfully!');
                    // Reload settings and trigger refresh
                    if (typeof loadUserSettings === 'function') {
                        await loadUserSettings();
                        // Trigger refresh of all displayed data
                        window.dispatchEvent(new CustomEvent('settingsUpdated'));
                        // Reload current page data if available
                        if (typeof loadFinancialData === 'function') {
                            setTimeout(() => loadFinancialData(), 500);
                        }
                        // Reload budget if on budget page
                        if (typeof loadBudgetData === 'function' && document.getElementById('budgetCategoriesList')) {
                            setTimeout(() => loadBudgetData(), 500);
                        }
                        // Reload investments if on investments page
                        if (typeof loadInvestmentsData === 'function' && document.getElementById('investmentsList')) {
                            setTimeout(() => loadInvestmentsData(), 500);
                        }
                    }
                } else {
                    toast.error('Failed to save settings');
                }
            } catch (error) {
                console.error('Error saving general settings:', error);
                toast.error('Failed to save settings');
            }
        });
    }
    
    // Notification toggles - save on change
    ['emailNotifications', 'financialAlerts', 'goalReminders', 'insightUpdates'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', async function() {
                try {
                    // Get current settings and update notification settings
                    const currentResponse = await apiRequest('/auth/settings', 'GET');
                    const currentSettings = (currentResponse.success && currentResponse.settings) ? currentResponse.settings : {};
                    
                    const updatedSettings = {
                        ...currentSettings,
                        [id]: this.checked
                    };
                    
                    const saved = await saveSettingsToBackend(updatedSettings);
                    if (saved) {
                        toast.success('Notification settings updated!');
                    } else {
                        // Revert checkbox on error
                        this.checked = !this.checked;
                        toast.error('Failed to update notification settings');
                    }
                } catch (error) {
                    console.error('Error updating notification setting:', error);
                    // Revert checkbox on error
                    this.checked = !this.checked;
                    toast.error('Failed to update notification settings');
                }
            });
        }
    });
}

window.exportData = async function() {
    try {
        toast.info('Preparing your data export...');
        
        const response = await apiRequest('/auth/export-data', 'GET');
        
        if (response.success && response.data) {
            // Create a blob and download
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fingenie-data-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success('Data exported successfully!');
        } else {
            toast.error('Failed to export data');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        toast.error('Failed to export data');
    }
};

window.showDeleteAccountModal = function() {
    showInfoModal(
        'Delete Account',
        `
        <div style="margin-bottom: 1.5rem;">
            <div style="background: var(--danger-light, #fee); border: 1px solid var(--danger, #f00); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
                <p style="color: var(--danger, #d00); margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Warning: This action cannot be undone!</strong>
                </p>
            </div>
            <p style="color: var(--text-secondary);">
                Deleting your account will permanently remove:
            </p>
            <ul style="color: var(--text-secondary); margin: 0.5rem 0 1rem 1.5rem;">
                <li>Your profile and account information</li>
                <li>All financial data, goals, and investments</li>
                <li>Custom graphs and reports</li>
                <li>All settings and preferences</li>
            </ul>
        </div>
        <form id="deleteAccountForm">
            <div class="form-group">
                <label class="form-label">Type "delete my account" to confirm:</label>
                <input 
                    type="text" 
                    class="form-control" 
                    id="deleteConfirm" 
                    placeholder="delete my account"
                    required
                >
            </div>
            <button type="submit" class="btn btn-danger w-100" style="margin-top: 1rem;">
                <i class="fas fa-trash"></i> Delete My Account Permanently
            </button>
            <button type="button" class="btn btn-secondary w-100" onclick="closeModal('infoModal')" style="margin-top: 0.5rem;">
                Cancel
            </button>
        </form>
        `
    );
    
    // Handle form submission
    setTimeout(() => {
        const deleteForm = document.getElementById('deleteAccountForm');
        if (deleteForm) {
            deleteForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const confirmText = document.getElementById('deleteConfirm').value.trim();
                
                if (confirmText.toLowerCase() !== 'delete my account') {
                    toast.error('Please type "delete my account" exactly to confirm');
                    return;
                }
                
                try {
                    toast.info('Deleting your account...');
                    
                    const response = await apiRequest('/auth/delete-account', 'POST', {
                        confirm: confirmText
                    });
                    
                    if (response.success) {
                        toast.success('Account deleted successfully. You will be logged out.');
                        closeModal('infoModal');
                        
                        // Clear local storage and redirect to login
                        setTimeout(() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }, 2000);
                    } else {
                        toast.error(response.error || 'Failed to delete account');
                    }
                } catch (error) {
                    console.error('Error deleting account:', error);
                    toast.error(error.message || 'Failed to delete account');
                }
            });
        }
    }, 100);
};

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

// ==================== Custom Graph Functions ====================

// Store current graph config for saving
let currentGraphConfig = null;
let currentGraphDescription = '';

// Open create graph modal
window.openCreateGraphModal = function() {
    const modal = document.getElementById('createGraphModal');
    if (!modal) return;
    
    // Reset form
    document.getElementById('graphDescription').value = '';
    document.getElementById('graphPreviewContainer').style.display = 'none';
    document.getElementById('graphGenerateStatus').style.display = 'none';
    document.getElementById('generateGraphBtn').style.display = 'block';
    document.getElementById('saveGraphBtn').style.display = 'none';
    currentGraphConfig = null;
    currentGraphDescription = '';
    
    modal.style.display = 'flex';
};

// Generate graph with AI
window.generateGraphWithAI = async function(event) {
    if (event) event.preventDefault();
    
    const description = document.getElementById('graphDescription').value.trim();
    if (!description) {
        alert('Please describe the graph you want to create');
        return;
    }
    
    const statusDiv = document.getElementById('graphGenerateStatus');
    const previewContainer = document.getElementById('graphPreviewContainer');
    const generateBtn = document.getElementById('generateGraphBtn');
    const saveBtn = document.getElementById('saveGraphBtn');
    
    // Show loading state
    statusDiv.style.display = 'block';
    generateBtn.disabled = true;
    previewContainer.style.display = 'none';
    
    try {
        // Call API to generate graph
        const response = await apiRequest('/finance/generate_graph', 'POST', {
            description: description
        });
        
        if (response.data) {
            // Ensure unique colors for pie/doughnut charts before saving
            const config = response.data;
            const chartType = config.type || 'bar';
            if (chartType === 'pie' || chartType === 'doughnut') {
                const uniqueColors = generateUniqueColors(config.labels?.length || 0);
                if (config.datasets && config.datasets.length > 0) {
                    config.datasets[0].backgroundColor = uniqueColors;
                    config.datasets[0].borderColor = uniqueColors.map(c => adjustColorBrightness(c, -20));
                    config.datasets[0].borderWidth = 2;
                }
            }
            
            currentGraphConfig = config;
            currentGraphDescription = description;
            
            // Render preview
            renderGraphPreview(config);
            previewContainer.style.display = 'block';
            statusDiv.style.display = 'none';
            generateBtn.style.display = 'none';
            saveBtn.style.display = 'block';
        } else {
            throw new Error('No graph configuration returned');
        }
    } catch (error) {
        console.error('Error generating graph:', error);
        const errorMessage = error.message || 'Failed to generate graph';
        statusDiv.innerHTML = `<div style="color: var(--accent-danger); padding: 1rem; background: var(--bg-elevated); border-radius: var(--radius-md); border-left: 4px solid var(--accent-danger);">
            <i class="fas fa-exclamation-circle"></i> <strong>Error:</strong> ${errorMessage}
            ${errorMessage.includes('No financial data') ? '<br><br><small>Please add your financial information first (assets, liabilities, goals, budget, etc.) before creating graphs.</small>' : ''}
        </div>`;
    } finally {
        generateBtn.disabled = false;
    }
};

// Render graph preview
function renderGraphPreview(config) {
    const canvas = document.getElementById('graphPreviewCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    // Ensure unique colors for pie/doughnut charts
    const chartType = config.type || 'bar';
    if (chartType === 'pie' || chartType === 'doughnut') {
        const uniqueColors = generateUniqueColors(config.labels?.length || 0);
        if (config.datasets && config.datasets.length > 0) {
            config.datasets[0].backgroundColor = uniqueColors;
            config.datasets[0].borderColor = uniqueColors.map(c => adjustColorBrightness(c, -20));
            config.datasets[0].borderWidth = 2;
        }
    }
    
    // Prepare enhanced chart configuration with tooltips
    const chartConfig = {
        type: chartType,
        data: {
            labels: config.labels || [],
            datasets: config.datasets || []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                ...(config.options?.plugins || {}),
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label || '';
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed || context.raw || 0;
                            const isCurrency = chartType !== 'pie' && chartType !== 'doughnut';
                            
                            if (chartType === 'pie' || chartType === 'doughnut') {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            } else {
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        },
                        afterLabel: function(context) {
                            if (chartType === 'line' || chartType === 'bar') {
                                const dataset = context.dataset;
                                const index = context.dataIndex;
                                if (dataset.data.length > index + 1) {
                                    const nextValue = dataset.data[index + 1];
                                    const currentValue = context.parsed.y || context.raw || 0;
                                    if (nextValue && typeof currentValue === 'number' && typeof nextValue === 'number') {
                                        const change = nextValue - currentValue;
                                        const changePercent = currentValue > 0 ? ((change / currentValue) * 100).toFixed(1) : 0;
                                        if (change !== 0) {
                                            return `Change: ${change > 0 ? '+' : ''}₹${change.toLocaleString('en-IN')} (${changePercent}%)`;
                                        }
                                    }
                                }
                            }
                            return '';
                        }
                    }
                }
            },
            ...(config.options || {})
        }
    };
    
    // Add scales if needed (for non-pie charts)
    if (chartType !== 'pie' && chartType !== 'doughnut' && chartType !== 'radar' && chartType !== 'polarArea') {
        chartConfig.options.scales = {
            ...(config.options?.scales || {}),
            y: {
                ...(config.options?.scales?.y || {}),
                beginAtZero: config.options?.scales?.y?.beginAtZero ?? true,
                ticks: {
                    ...(config.options?.scales?.y?.ticks || {}),
                    callback: function(value) {
                        return '₹' + value.toLocaleString('en-IN');
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                ...(config.options?.scales?.x || {}),
                grid: {
                    display: false
                }
            }
        };
    }
    
    // Create chart
    canvas.chart = new Chart(canvas, chartConfig);
}

// Generate unique colors for pie charts
function generateUniqueColors(count) {
    const colorPalette = [
        '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6',
        '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#84cc16', '#eab308',
        '#6366f1', '#ec4899', '#06b6d4', '#22c55e', '#f43f5e', '#8b5cf6',
        '#14b8a6', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#10b981'
    ];
    
    if (count <= colorPalette.length) {
        return colorPalette.slice(0, count);
    }
    
    // If we need more colors, generate them
    const colors = [...colorPalette];
    for (let i = colorPalette.length; i < count; i++) {
        const hue = (i * 137.508) % 360; // Golden angle approximation
        colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
}

// Adjust color brightness
function adjustColorBrightness(color, percent) {
    if (color.startsWith('#')) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    return color;
}

// Save custom graph
window.saveCustomGraph = async function() {
    if (!currentGraphConfig) {
        alert('Please generate a graph first');
        return;
    }
    
    try {
        const response = await apiRequest('/finance/save_custom_graph', 'POST', {
            graph_config: currentGraphConfig,
            title: currentGraphConfig.title || 'Custom Graph',
            description: currentGraphDescription
        });
        
        if (response.data) {
            // Close modal
            if (typeof closeModal === 'function') {
                closeModal('createGraphModal');
            }
            
            // Reload custom graphs
            await loadCustomGraphs();
            
            // Show success message
            if (typeof toast !== 'undefined') {
                toast.success('Graph saved successfully!', 'success');
            } else {
                alert('Graph saved successfully!');
            }
        }
    } catch (error) {
        console.error('Error saving graph:', error);
        if (typeof toast !== 'undefined') {
            toast.error(error.message || 'Failed to save graph', 'error');
        } else {
            alert('Error: ' + (error.message || 'Failed to save graph'));
        }
    }
};

// Load custom graphs
window.loadCustomGraphs = async function() {
    const container = document.getElementById('customGraphsContainer');
    if (!container) return;
    
    try {
        const response = await apiRequest('/finance/get_custom_graphs', 'GET');
        const graphs = response.data || [];
        
        if (graphs.length === 0) {
            container.innerHTML = `
                <p style="color: var(--text-tertiary); grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    No custom graphs yet. Click "Create New Graph" to generate your first AI-powered visualization!
                </p>
            `;
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Render each graph
        graphs.forEach((graph, index) => {
            const graphCard = createGraphCard(graph);
            container.appendChild(graphCard);
        });
    } catch (error) {
        console.error('Error loading custom graphs:', error);
        container.innerHTML = `
            <p style="color: var(--accent-danger); grid-column: 1 / -1; text-align: center; padding: 2rem;">
                Error loading graphs: ${error.message || 'Unknown error'}
            </p>
        `;
    }
}

// Create graph card element
function createGraphCard(graph) {
    const card = document.createElement('div');
    card.className = 'card fade-in';
    card.style.animationDelay = '0.1s';
    
    const graphId = 'customGraph_' + graph.id;
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${escapeHtml(graph.title || 'Custom Graph')}</h3>
            <div class="card-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteCustomGraph('${graph.id}')" title="Delete graph">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="card-body">
            ${graph.description ? `<p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.875rem;">${escapeHtml(graph.description)}</p>` : ''}
            <div style="position: relative; height: 300px;">
                <canvas id="${graphId}"></canvas>
            </div>
        </div>
    `;
    
    // Render chart after card is added to DOM
    setTimeout(() => {
        renderCustomGraph(graphId, graph.config);
    }, 100);
    
    return card;
}

// Render custom graph
function renderCustomGraph(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    // Ensure unique colors for pie/doughnut charts
    const chartType = config.type || 'bar';
    if (chartType === 'pie' || chartType === 'doughnut') {
        const uniqueColors = generateUniqueColors(config.labels?.length || 0);
        if (config.datasets && config.datasets.length > 0) {
            config.datasets[0].backgroundColor = uniqueColors;
            config.datasets[0].borderColor = uniqueColors.map(c => adjustColorBrightness(c, -20));
            config.datasets[0].borderWidth = 2;
        }
    }
    
    // Prepare enhanced chart configuration with tooltips
    const chartConfig = {
        type: chartType,
        data: {
            labels: config.labels || [],
            datasets: config.datasets || []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                ...(config.options?.plugins || {}),
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label || '';
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed || context.raw || 0;
                            
                            if (chartType === 'pie' || chartType === 'doughnut') {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            } else {
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        },
                        afterLabel: function(context) {
                            if (chartType === 'line' || chartType === 'bar') {
                                const dataset = context.dataset;
                                const index = context.dataIndex;
                                if (dataset.data.length > index + 1) {
                                    const nextValue = dataset.data[index + 1];
                                    const currentValue = context.parsed.y || context.raw || 0;
                                    if (nextValue && typeof currentValue === 'number' && typeof nextValue === 'number') {
                                        const change = nextValue - currentValue;
                                        const changePercent = currentValue > 0 ? ((change / currentValue) * 100).toFixed(1) : 0;
                                        if (change !== 0) {
                                            return `Change: ${change > 0 ? '+' : ''}₹${change.toLocaleString('en-IN')} (${changePercent}%)`;
                                        }
                                    }
                                }
                            }
                            return '';
                        }
                    }
                }
            },
            ...(config.options || {})
        }
    };
    
    // Add scales if needed (for non-pie charts)
    if (chartType !== 'pie' && chartType !== 'doughnut' && chartType !== 'radar' && chartType !== 'polarArea') {
        chartConfig.options.scales = {
            ...(config.options?.scales || {}),
            y: {
                ...(config.options?.scales?.y || {}),
                beginAtZero: config.options?.scales?.y?.beginAtZero ?? true,
                ticks: {
                    ...(config.options?.scales?.y?.ticks || {}),
                    callback: function(value) {
                        return '₹' + value.toLocaleString('en-IN');
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                ...(config.options?.scales?.x || {}),
                grid: {
                    display: false
                }
            }
        };
    }
    
    // Create chart
    canvas.chart = new Chart(canvas, chartConfig);
}

// Enhance prompt with AI
window.enhancePrompt = async function() {
    const textarea = document.getElementById('graphDescription');
    const currentPrompt = textarea.value.trim();
    
    if (!currentPrompt) {
        alert('Please enter a description first before enhancing');
        return;
    }
    
    // Show loading state
    const originalValue = textarea.value;
    textarea.disabled = true;
    textarea.value = 'Enhancing prompt with AI...';
    
    try {
        // Call dedicated enhance prompt endpoint (full path since it's under /api/chat)
        const response = await apiRequest('/chat/enhance_prompt', 'POST', {
            prompt: currentPrompt
        });
        
        if (response.message) {
            const enhancedText = response.message.trim();
            
            if (enhancedText && enhancedText.length > 10) {
                textarea.value = enhancedText;
                if (typeof toast !== 'undefined') {
                    toast.success('Prompt enhanced successfully!', 'success');
                }
            } else {
                // Fallback: use original if extraction fails
                textarea.value = originalValue;
                if (typeof toast !== 'undefined') {
                    toast.warning('Could not extract enhanced prompt. Please try again.', 'warning');
                }
            }
        } else {
            textarea.value = originalValue;
        }
    } catch (error) {
        console.error('Error enhancing prompt:', error);
        textarea.value = originalValue;
        if (typeof toast !== 'undefined') {
            toast.error('Failed to enhance prompt. Please try again.', 'error');
        } else {
            alert('Failed to enhance prompt: ' + error.message);
        }
    } finally {
        textarea.disabled = false;
        textarea.focus();
    }
};

// Delete custom graph
window.deleteCustomGraph = async function(graphId) {
    if (!confirm('Are you sure you want to delete this graph?')) {
        return;
    }
    
    try {
        await apiRequest('/finance/delete_custom_graph', 'POST', {
            graph_id: graphId
        });
        
        // Reload graphs
        await loadCustomGraphs();
        
        if (typeof toast !== 'undefined') {
            toast.success('Graph deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting graph:', error);
        if (typeof toast !== 'undefined') {
            toast.error(error.message || 'Failed to delete graph', 'error');
        } else {
            alert('Error: ' + (error.message || 'Failed to delete graph'));
        }
    }
};

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
window.generateGraphWithAI = window.generateGraphWithAI;
window.openCreateGraphModal = window.openCreateGraphModal;
window.saveCustomGraph = window.saveCustomGraph;
window.deleteCustomGraph = window.deleteCustomGraph;

// Initialize pages when DOM is ready
// Update sidebar user info on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update sidebar with user info immediately
    if (typeof updateSidebarUserInfo === 'function') {
        updateSidebarUserInfo();
    }
    console.log('📄 pages-functionality.js loaded, initializePages is available:', typeof window.initializePages);
    // Wait for page to be loaded dynamically
    setTimeout(() => {
        if (typeof window.initializePages === 'function') {
            window.initializePages();
        }
    }, 500);
});

