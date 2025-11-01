// Main JavaScript file for FinGenie

const API_BASE_URL = '/api';

// Toast Notification System
class ToastManager {
    constructor() {
        this.container = this.initContainer();
    }

    initContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };

        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type] || 'Notification'}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.closest('.toast').remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

// Global toast instance
const toast = new ToastManager();

// Helper function for compatibility
function showToast(message, type = 'info', duration = 5000) {
    return toast.show(message, type, duration);
}

// Utility function to get auth token
function getAuthToken() {
    // Try localStorage first (more reliable)
    const localToken = localStorage.getItem('token');
    if (localToken) {
        return localToken;
    }
    
    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith('token=')) {
            // Handle URL-encoded cookie values
            const value = trimmed.substring(6); // 'token=' is 6 chars
            return decodeURIComponent(value);
        }
    }
    return null;
}

// Utility function to save auth token
function saveAuthToken(token) {
    // Save to localStorage for immediate access
    localStorage.setItem('token', token);
}

// Utility function to clear auth token
function clearAuthToken() {
    localStorage.removeItem('token');
    // Clear cookie by setting it to expire
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Utility function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
        credentials: 'include'
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // Try to parse JSON, but handle non-JSON responses
        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || `Request failed with status ${response.status}`);
        }
        
        if (!response.ok) {
            throw new Error(result.error || `Request failed with status ${response.status}`);
        }
        
        return result;
    } catch (error) {
        // If it's already an Error object, throw it as is
        if (error instanceof Error) {
            throw error;
        }
        // Otherwise wrap it
        throw new Error(error.message || 'Network error occurred');
    }
}

// Check if user is authenticated
function checkAuth() {
    const token = getAuthToken();
    console.log('Auth check - Token found:', !!token, 'Path:', window.location.pathname);
    if (!token && (window.location.pathname === '/dashboard' || window.location.pathname === '/chat')) {
        console.log('No token found, redirecting to login');
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Check auth with a small delay to allow cookies to be set
function checkAuthDelayed() {
    // Small delay to ensure cookies are set after redirect
    setTimeout(() => {
        checkAuth();
    }, 100);
}

// Login functionality
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Disable button during request
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
        
        try {
            const result = await apiRequest('/auth/login', 'POST', { email, password });
            
            // Save token to localStorage immediately
            if (result.token) {
                saveAuthToken(result.token);
            }
            
            toast.success('Login successful! Redirecting...', 'success', 2000);
            // Small delay to ensure token is saved before redirect
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 500);
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.message || 'Login failed. Please check your credentials.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });
}

// Signup functionality
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';
        
        try {
            const result = await apiRequest('/auth/signup', 'POST', { name, email, password });
            
            // Save token to localStorage immediately
            if (result.token) {
                saveAuthToken(result.token);
            }
            
            toast.success('Account created successfully! Redirecting...', 'success', 2000);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 500);
        } catch (error) {
            toast.error(error.message || 'Signup failed. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });
}

// Logout functionality
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await apiRequest('/auth/logout', 'POST');
            clearAuthToken();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            clearAuthToken();
            window.location.href = '/login';
        }
    });
}

// Dashboard functionality - ALWAYS define loadFinancialData (make it available globally)
// Make loadFinancialData globally available FIRST, before any conditional logic
window.loadFinancialData = async function() {
    try {
        console.log('🔄 Loading financial data...');
        const result = await apiRequest('/finance/get_data');
        console.log('📦 Finance API response:', result);
        
        // Extract data from response
        const data = result.data || {};
        console.log('📊 Extracted data:', data);
        console.log('🔍 Data keys:', Object.keys(data));
        console.log('💰 Assets:', data.assets);
        console.log('💳 Liabilities:', data.liabilities);
        console.log('🎯 Goals:', data.goals);
        console.log('🏷️ Is Mock:', data.is_mock);
        
        // Check if this is mock data (backend sets is_mock flag)
        const isMockData = data.is_mock === true;
        
        // Backend already returns mock data when no real data exists
        // Just display whatever we received (real or mock)
        if (data && (data.assets || data.liabilities || data.goals || data.is_mock)) {
            console.log('✅ Displaying data (isMock:', isMockData, ')');
            await updateDashboardWithData(data, isMockData);
            
            if (isMockData) {
                toast.info('Showing demo data. Add your financial information to replace it.', 'info', 4000);
            }
        } else {
            // Truly empty - try to explicitly load mock data
            console.log('⚠️ Truly no data, explicitly loading mock data...');
            try {
                await apiRequest('/finance/load_mock_data', 'POST');
                const result2 = await apiRequest('/finance/get_data');
                const mockData = result2.data || {};
                console.log('✅ Mock data explicitly loaded:', mockData);
                await updateDashboardWithData(mockData, true);
                toast.info('Mock data loaded for demonstration', 'info');
            } catch (error) {
                console.error('❌ Error loading mock data:', error);
                toast.error('Could not load demo data. Please add your financial information.', 'error');
            }
        }
    } catch (error) {
        console.error('❌ Error loading financial data:', error);
        toast.error('Failed to load financial data: ' + error.message, 'error');
    }
};

// Dashboard initialization - load data when dashboard page loads
if (window.location.pathname === '/dashboard' || document.getElementById('totalAssets')) {
    // Load financial data on page load - ensure Chart.js is loaded first
    const initializeDashboard = async () => {
        console.log('🚀 Initializing dashboard...');
        // Wait for Chart.js to be available
        let retries = 0;
        const checkChartJS = () => {
            if (typeof Chart !== 'undefined') {
                console.log('✅ Chart.js loaded, loading financial data...');
                if (typeof window.loadFinancialData === 'function') {
                    window.loadFinancialData();
                } else {
                    console.error('❌ loadFinancialData function not available');
                }
            } else if (retries < 20) {
                retries++;
                setTimeout(checkChartJS, 100);
            } else {
                console.warn('⚠️ Chart.js failed to load, loading data anyway...');
                if (typeof window.loadFinancialData === 'function') {
                    window.loadFinancialData(); // Load data anyway, charts will fail gracefully
                }
            }
        };
        checkChartJS();
    };
    
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        // DOM already loaded
        initializeDashboard();
    }
}

// Dashboard form functionality
if (document.getElementById('financeForm')) {
    // Add goal button
    document.getElementById('addGoalBtn').addEventListener('click', () => {
        const container = document.getElementById('goalsContainer');
        const goalItem = document.createElement('div');
        goalItem.className = 'goal-item mb-2';
        goalItem.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <input type="text" class="form-control goal-name" placeholder="Goal name">
                </div>
                <div class="col-md-3">
                    <input type="number" class="form-control goal-target" placeholder="Target (₹)">
                </div>
                <div class="col-md-3">
                    <input type="number" class="form-control goal-year" placeholder="Year">
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-danger btn-sm remove-goal">Remove</button>
                </div>
            </div>
        `;
        container.appendChild(goalItem);
        
        // Add remove button functionality
        goalItem.querySelector('.remove-goal').addEventListener('click', () => {
            goalItem.remove();
        });
    });
    
    // Remove goal buttons
    document.querySelectorAll('.remove-goal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.goal-item').remove();
        });
    });
    
    // Submit financial data
    document.getElementById('financeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const assets = {
            savings: parseFloat(document.getElementById('savings').value) || 0,
            mutual_funds: parseFloat(document.getElementById('mutualFunds').value) || 0,
            stocks: parseFloat(document.getElementById('stocks').value) || 0
        };
        
        const liabilities = {
            loan: parseFloat(document.getElementById('loan').value) || 0,
            credit_card_due: parseFloat(document.getElementById('creditCard').value) || 0
        };
        
        const goals = [];
        document.querySelectorAll('.goal-item').forEach(item => {
            const name = item.querySelector('.goal-name').value;
            const target = parseFloat(item.querySelector('.goal-target').value);
            const year = parseInt(item.querySelector('.goal-year').value);
            
            if (name && target && year) {
                goals.push({ name, target, year });
            }
        });
        
        try {
            await apiRequest('/finance/add_data', 'POST', { assets, liabilities, goals });
            toast.success('Financial data saved successfully!', 'success');
            
            // Reload data
            await loadFinancialData();
            
            // Clear form
            document.getElementById('financeForm').reset();
            document.getElementById('goalsContainer').innerHTML = `
                <div class="goal-item mb-2">
                    <div class="row g-2">
                        <div class="col-md-4">
                            <input type="text" class="form-control goal-name" placeholder="Goal name">
                        </div>
                        <div class="col-md-3">
                            <input type="number" class="form-control goal-target" placeholder="Target (₹)">
                        </div>
                        <div class="col-md-3">
                            <input type="number" class="form-control goal-year" placeholder="Year">
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="btn btn-danger btn-sm w-100 remove-goal">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            toast.error(error.message || 'Failed to save financial data', 'error');
        }
    });
}

// Make updateDashboardWithData globally available
window.updateDashboardWithData = async function(data, isMockData) {
    console.log('updateDashboardWithData called with:', data, 'isMock:', isMockData);
    
    // Update summary cards
    const assets = data.assets || {};
    const liabilities = data.liabilities || {};
    
    const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0);
    const totalLiabilities = (liabilities.loan || 0) + (liabilities.credit_card_due || 0);
    const netWorth = totalAssets - totalLiabilities;
    
    console.log('Calculated totals - Assets:', totalAssets, 'Liabilities:', totalLiabilities, 'Net:', netWorth);
    
    // Animate number counting - check if elements exist first
    const totalAssetsEl = document.getElementById('totalAssets');
    const totalLiabilitiesEl = document.getElementById('totalLiabilities');
    const netWorthEl = document.getElementById('netWorth');
    
    if (totalAssetsEl) {
        animateNumber('totalAssets', totalAssets);
    } else {
        console.warn('totalAssets element not found');
    }
    if (totalLiabilitiesEl) {
        animateNumber('totalLiabilities', totalLiabilities);
    } else {
        console.warn('totalLiabilities element not found');
    }
    if (netWorthEl) {
        animateNumber('netWorth', netWorth);
    } else {
        console.warn('netWorth element not found');
    }
    
    // Update charts
    updateCharts(data);
    
    // Update goals progress (handles both stat card and detailed view)
    updateGoalsProgress(data.goals || []);
    
    // Generate and show analysis
    if (data && Object.keys(data).length > 0 && (data.assets || data.liabilities || data.goals)) {
        showFinancialAnalysis(data, totalAssets, totalLiabilities, netWorth);
    }
    
    // Update display (if element exists)
    const display = document.getElementById('financialDataDisplay');
    if (display) {
        if (Object.keys(data).length === 0 || (!data.assets && !data.liabilities && !data.goals)) {
            display.innerHTML = '<p class="text-muted">No financial data available. Please add your financial information above.</p>';
        } else {
            let html = '';
            
            // Show mock data notice
            if (isMockData) {
                html += '<div class="alert alert-info mb-3"><small><strong><i class="fas fa-info-circle"></i> Demo Mode:</strong> Showing mock data for demonstration purposes. You can replace this with your actual financial data using the form above.</small></div>';
            }
            
            html += '<div class="row">';
            
            if (data.assets && Object.keys(data.assets).length > 0) {
                html += '<div class="col-md-4"><h6>Assets</h6><ul>';
                for (const [key, value] of Object.entries(data.assets)) {
                    html += `<li><strong>${key.replace('_', ' ')}:</strong> ₹${value.toLocaleString()}</li>`;
                }
                html += '</ul></div>';
            }
            
            if (data.liabilities && Object.keys(data.liabilities).length > 0) {
                html += '<div class="col-md-4"><h6>Liabilities</h6><ul>';
                for (const [key, value] of Object.entries(data.liabilities)) {
                    html += `<li><strong>${key.replace('_', ' ')}:</strong> ₹${value.toLocaleString()}</li>`;
                }
                html += '</ul></div>';
            }
            
            if (data.goals && data.goals.length > 0) {
                html += '<div class="col-md-4"><h6>Goals</h6><ul>';
                data.goals.forEach(goal => {
                    html += `<li><strong>${goal.name}:</strong> ₹${goal.target.toLocaleString()} by ${goal.year}</li>`;
                });
                html += '</ul></div>';
            }
            
            html += '</div>';
            display.innerHTML = html;
        }
    }
};

// Add button to load mock data (if not already present)
if (document.getElementById('loadMockDataBtn')) {
    document.getElementById('loadMockDataBtn').addEventListener('click', async () => {
        try {
            const result = await apiRequest('/finance/load_mock_data', 'POST');
            toast.success('Mock data loaded successfully!', 'success');
            // Reload data
            if (typeof window.loadFinancialData === 'function') {
                await window.loadFinancialData();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load mock data', 'error');
        }
    });
}

// Markdown to HTML converter (simple version)
function markdownToHtml(text) {
    if (!text) return '';
    
    // Escape HTML first
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
    }
    
    // Bullet lists
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');
    
    return html;
}

// Format timestamp
function formatTimestamp(date = new Date()) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = 'Copied to clipboard!';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    });
}

// Toast notification CSS is now in style.css - no need for inline styles

// Chat functionality
if (document.getElementById('chatForm')) {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = chatForm.querySelector('button[type="submit"]');
    
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        // Disable input while sending
        messageInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        
        // Add user message to chat
        addMessageToChat('You', message, 'user');
        messageInput.value = '';
        
        // Show typing indicator
        const loadingId = addTypingIndicator();
        
        try {
            const result = await apiRequest('/chat/chat', 'POST', { message });
            
            // Remove typing indicator
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            
            // Add AI response with typing animation
            await addMessageToChatAnimated('FinGenie', result.message, 'ai');
        } catch (error) {
            // Remove typing indicator
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            
            addMessageToChat('FinGenie', `Error: ${error.message}`, 'ai');
        } finally {
            // Re-enable input
            messageInput.disabled = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span>Send</span>';
            messageInput.focus();
        }
    });
    
    // Enable Enter key to send (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const messageId = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = 'message ai loading';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="sender-name">
                <span class="sender-icon"><i class="fas fa-robot"></i></span>
                <span>FinGenie</span>
            </div>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageId;
}

function addMessageToChat(sender, message, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `message ${type} fade-in`;
    
    const senderIcon = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    const timestamp = formatTimestamp();
    const isUser = type === 'user';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="sender-name">
                <span class="sender-icon">${senderIcon}</span>
                <span>${sender}</span>
            </div>
            <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${markdownToHtml(message)}</div>
        <div class="message-actions">
            <button class="message-action-btn" onclick="copyToClipboard(\`${message.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
                <i class="fas fa-copy"></i> Copy
            </button>
            ${!isUser ? `<button class="message-action-btn" onclick="regenerateMessage('${messageId}')"><i class="fas fa-redo"></i> Regenerate</button>` : ''}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add hover effect
    messageDiv.addEventListener('mouseenter', () => {
        messageDiv.style.transform = 'scale(1.02)';
    });
    
    messageDiv.addEventListener('mouseleave', () => {
        messageDiv.style.transform = 'scale(1)';
    });
    
    return messageId;
}

// Add message with typing animation
async function addMessageToChatAnimated(sender, message, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `message ${type} fade-in`;
    
    const senderIcon = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    const timestamp = formatTimestamp();
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="sender-name">
                <span class="sender-icon">${senderIcon}</span>
                <span>${sender}</span>
            </div>
            <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content" id="content-${messageId}"></div>
        <div class="message-actions">
            <button class="message-action-btn" onclick="copyToClipboard(\`${message.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
                <i class="fas fa-copy"></i> Copy
            </button>
            <button class="message-action-btn" onclick="regenerateMessage('${messageId}')"><i class="fas fa-redo"></i> Regenerate</button>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Type out the message character by character
    const contentDiv = document.getElementById(`content-${messageId}`);
    const formattedMessage = markdownToHtml(message);
    let currentIndex = 0;
    
    return new Promise((resolve) => {
        const typingInterval = setInterval(() => {
            if (currentIndex < formattedMessage.length) {
                contentDiv.innerHTML = formattedMessage.substring(0, currentIndex + 1);
                currentIndex += 3; // Speed of typing (higher = faster)
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                clearInterval(typingInterval);
                contentDiv.innerHTML = formattedMessage; // Ensure complete message
                resolve();
            }
        }, 20); // Typing speed
    });
}

// Regenerate message (placeholder)
function regenerateMessage(messageId) {
    const messageDiv = document.getElementById(messageId);
    if (!messageDiv) return;
    
    // Get the last user message
    const chatMessages = document.getElementById('chatMessages');
    const messages = Array.from(chatMessages.querySelectorAll('.message.user'));
    if (messages.length === 0) return;
    
    const lastUserMessage = messages[messages.length - 1];
    const userMessageText = lastUserMessage.querySelector('.message-content').textContent;
    
    // Remove the current AI message
    messageDiv.remove();
    
    // Show typing indicator and regenerate
    const loadingId = addTypingIndicator();
    
    apiRequest('/chat/chat', 'POST', { message: userMessageText })
        .then(result => {
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            addMessageToChatAnimated('FinGenie', result.message, 'ai');
        })
        .catch(error => {
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            addMessageToChat('FinGenie', `Error: ${error.message}`, 'ai');
        });
}

// Animate number counting effect
function animateNumber(elementId, finalValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseFloat(element.textContent.replace(/[₹,]/g, '')) || 0;
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = (finalValue - startValue) / steps;
    let currentStep = 0;
    
    const counter = setInterval(() => {
        currentStep++;
        const currentValue = startValue + (increment * currentStep);
        
        if (currentStep >= steps) {
            element.textContent = `₹${finalValue.toLocaleString()}`;
            element.classList.add('counter-animate');
            clearInterval(counter);
        } else {
            element.textContent = `₹${Math.round(currentValue).toLocaleString()}`;
        }
    }, duration / steps);
}

// Chart instances
let assetsChart = null;
let overviewChart = null;

// Update charts with financial data
function updateCharts(data) {
    const assets = data.assets || {};
    const liabilities = data.liabilities || {};
    
    // Asset Distribution Pie Chart
    const assetsCtx = document.getElementById('assetsChart');
    if (assetsCtx) {
        const savings = assets.savings || 0;
        const mutualFunds = assets.mutual_funds || 0;
        const stocks = assets.stocks || 0;
        
        // Only create chart if we have Chart.js available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }
        
        if (assetsChart) {
            assetsChart.destroy();
        }
        
        // Ensure canvas has proper size
        const canvasContainer = assetsCtx.parentElement;
        if (canvasContainer) {
            canvasContainer.style.height = '300px';
            canvasContainer.style.position = 'relative';
        }
        
        // If all values are zero, show a message or use minimum display value
        const totalAssets = savings + mutualFunds + stocks;
        const chartData = totalAssets > 0 
            ? [savings, mutualFunds, stocks]
            : [1, 0, 0]; // Show placeholder if no data
        
        assetsChart = new Chart(assetsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Savings', 'Mutual Funds', 'Stocks'],
                datasets: [{
                    data: chartData,
                    backgroundColor: [
                        '#059669',
                        '#10b981',
                        '#34d399'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                family: 'Inter',
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Financial Overview Bar Chart
    const overviewCtx = document.getElementById('overviewChart');
    if (overviewCtx) {
        const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0);
        const totalLiabilities = (liabilities.loan || 0) + (liabilities.credit_card_due || 0);
        const netWorth = totalAssets - totalLiabilities;
        
        // Only create chart if we have Chart.js available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }
        
        if (overviewChart) {
            overviewChart.destroy();
        }
        
        // Ensure canvas has proper size
        const canvasContainer = overviewCtx.parentElement;
        if (canvasContainer) {
            canvasContainer.style.height = '300px';
            canvasContainer.style.position = 'relative';
        }
        
        overviewChart = new Chart(overviewCtx, {
            type: 'bar',
            data: {
                labels: ['Assets', 'Liabilities', 'Net Worth'],
                datasets: [{
                    label: 'Amount (₹)',
                    data: [totalAssets, totalLiabilities, Math.max(0, netWorth)],
                    backgroundColor: [
                        '#10b981',
                        '#dc2626',
                        '#3b82f6'
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `₹${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            },
                            font: {
                                family: 'Inter'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Inter'
                            }
                        }
                    }
                }
            }
        });
    }
}

// Update goals progress
function updateGoalsProgress(goals) {
    // Update stat card with simple metric
    const progressStatCard = document.getElementById('goalsProgress');
    
    // Update detailed goals container
    const goalsContainer = document.getElementById('goalsContainer');
    
    if (!goals || goals.length === 0) {
        // Update stat card
        if (progressStatCard) {
            progressStatCard.textContent = '0%';
        }
        
        // Update detailed container
        if (goalsContainer) {
            goalsContainer.innerHTML = `
                <p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">
                    <i class="fas fa-bullseye" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                    No financial goals set yet. Add your first goal to start tracking!
                </p>
            `;
        }
        return;
    }
    
    // Calculate overall progress for stat card
    const totalAssets = parseFloat(document.getElementById('totalAssets')?.textContent.replace(/[₹,]/g, '') || 0);
    const totalGoalTarget = goals.reduce((sum, g) => sum + (g.target || 0), 0);
    const overallProgress = totalGoalTarget > 0 && totalAssets > 0 
        ? Math.min(100, Math.round((totalAssets / totalGoalTarget) * 100))
        : 0;
    
    // Update stat card with simple metric
    if (progressStatCard) {
        progressStatCard.textContent = `${overallProgress}%`;
    }
    
    // Show detailed goals in the container below
    if (goalsContainer) {
        let html = '';
        goals.forEach((goal, index) => {
            const currentYear = new Date().getFullYear();
            const yearsRemaining = Math.max(0, goal.year - currentYear);
            const monthsRemaining = yearsRemaining * 12;
            const monthlyTarget = monthsRemaining > 0 ? Math.round(goal.target / monthsRemaining) : goal.target;
            
            // Calculate individual goal progress
            const goalProgress = totalAssets > 0 && goal.target > 0 
                ? Math.min(100, Math.round((totalAssets / goal.target) * 100))
                : 0;
            
            html += `
                <div class="goal-progress-item fade-in mb-3" style="animation-delay: ${index * 0.1}s; padding: 1.5rem; border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-tertiary);">
                    <div class="goal-progress-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <div class="goal-progress-title" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.1rem;">
                                <i class="fas fa-bullseye" style="color: var(--accent-cyan); margin-right: 0.5rem;"></i>
                                ${goal.name}
                            </div>
                            <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; color: var(--text-tertiary); font-size: 0.9rem;">
                                <span><i class="fas fa-tag"></i> Target: ₹${goal.target.toLocaleString()}</span>
                                <span><i class="fas fa-calendar"></i> By ${goal.year}</span>
                                <span><i class="fas fa-clock"></i> ${yearsRemaining} years remaining</span>
                            </div>
                        </div>
                        <div style="text-align: right; margin-left: 1rem;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 0.25rem;">
                                ${goalProgress}%
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Complete</div>
                        </div>
                    </div>
                    <div style="background: var(--bg-elevated); border-radius: var(--radius-md); height: 10px; overflow: hidden; margin-bottom: 0.75rem; position: relative;">
                        <div style="background: var(--gradient-primary); height: 100%; width: ${goalProgress}%; transition: width 0.5s ease; border-radius: var(--radius-md);"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-tertiary); font-size: 0.875rem; padding-top: 0.5rem; border-top: 1px solid var(--border-primary);">
                        <span><i class="fas fa-calculator"></i> ~₹${monthlyTarget.toLocaleString()}/month needed</span>
                        <span style="color: var(--accent-cyan); font-weight: 600;">
                            ₹${Math.max(0, goal.target - totalAssets).toLocaleString()} remaining
                        </span>
                    </div>
                </div>
            `;
        });
        goalsContainer.innerHTML = html;
    }
}

// Export data function
function exportData() {
    apiRequest('/finance/get_data')
        .then(result => {
            const data = result.data || {};
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fingenie-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Data exported successfully!', 'success');
        })
        .catch(error => {
            showToast('Error exporting data: ' + error.message, 'error');
        });
}

// Show financial analysis
function showFinancialAnalysis(data, totalAssets, totalLiabilities, netWorth) {
    const assets = data.assets || {};
    const liabilities = data.liabilities || {};
    const goals = data.goals || [];
    
    let insights = [];
    
    // Asset allocation analysis
    if (totalAssets > 0) {
        const savingsRatio = (assets.savings || 0) / totalAssets * 100;
        const investmentRatio = ((assets.mutual_funds || 0) + (assets.stocks || 0)) / totalAssets * 100;
        
        if (savingsRatio > 50) {
            insights.push({
                type: 'warning',
                icon: 'fa-lightbulb',
                text: `Your savings account (${savingsRatio.toFixed(1)}%) is high. Consider investing ${(savingsRatio - 30).toFixed(0)}% more into mutual funds or stocks for better returns.`
            });
        } else if (investmentRatio > 70) {
            insights.push({
                type: 'info',
                icon: 'fa-info-circle',
                text: `Great investment allocation (${investmentRatio.toFixed(1)}%)! Maintain an emergency fund of 3-6 months expenses.`
            });
        } else {
            insights.push({
                type: 'success',
                icon: 'fa-check-circle',
                text: `Well-balanced portfolio! Savings: ${savingsRatio.toFixed(1)}%, Investments: ${investmentRatio.toFixed(1)}%`
            });
        }
    }
    
    // Debt analysis
    if (totalLiabilities > 0 && totalAssets > 0) {
        const debtRatio = (totalLiabilities / totalAssets) * 100;
        
        if (debtRatio > 40) {
            insights.push({
                type: 'error',
                icon: 'fa-exclamation-triangle',
                text: `High debt-to-asset ratio (${debtRatio.toFixed(1)}%). Focus on paying off high-interest debt first. Consider paying ₹${Math.round(totalLiabilities * 0.2).toLocaleString()} monthly.`
            });
        } else if (debtRatio < 20) {
            insights.push({
                type: 'success',
                icon: 'fa-check-circle',
                text: `Excellent! Low debt ratio (${debtRatio.toFixed(1)}%). You're in a strong financial position.`
            });
        } else {
            insights.push({
                type: 'warning',
                icon: 'fa-chart-line',
                text: `Moderate debt level (${debtRatio.toFixed(1)}%). Aim to reduce it below 30% for better financial health.`
            });
        }
    }
    
    // Net worth analysis
    if (netWorth > 0) {
        insights.push({
            type: 'info',
            icon: 'fa-chart-line',
            text: `Current net worth: ₹${netWorth.toLocaleString()}. With proper investment strategy, this could grow to ₹${(netWorth * 1.5).toLocaleString()} in 2-3 years.`
        });
    }
    
    // Goals analysis
    if (goals.length > 0) {
        const totalGoalTarget = goals.reduce((sum, g) => sum + (g.target || 0), 0);
        const currentAvailable = totalAssets - totalLiabilities;
        const progressPercent = totalGoalTarget > 0 ? (currentAvailable / totalGoalTarget * 100) : 0;
        
        if (progressPercent >= 100) {
            insights.push({
                type: 'success',
                icon: 'fa-trophy',
                text: `Congratulations! You've achieved your financial goals! Consider setting new objectives.`
            });
        } else if (progressPercent >= 50) {
            insights.push({
                type: 'info',
                icon: 'fa-bullseye',
                text: `Great progress! ${progressPercent.toFixed(1)}% towards your goals. Keep saving ₹${Math.round((totalGoalTarget - currentAvailable) / (goals.length * 12)).toLocaleString()} monthly to achieve them.`
            });
        } else {
            insights.push({
                type: 'warning',
                icon: 'fa-bullseye',
                text: `You're ${progressPercent.toFixed(1)}% towards your goals. Increase savings by ₹${Math.round((totalGoalTarget - currentAvailable) / (goals.length * 12)).toLocaleString()} monthly.`
            });
        }
    }
    
    // Display insights
    const analysisCard = document.getElementById('financialAnalysisCard');
    const analysisDiv = document.getElementById('financialAnalysis');
    
    if (analysisDiv && insights.length > 0) {
        let html = '<div class="analysis-insights">';
        insights.forEach(insight => {
            html += `
                <div class="insight-item insight-${insight.type}">
                    <i class="fas ${insight.icon}"></i>
                    <span>${insight.text}</span>
                </div>
            `;
        });
        html += '</div>';
        analysisDiv.innerHTML = html;
        
        // Show the analysis card
        if (analysisCard) {
            analysisCard.style.display = 'block';
        }
    } else if (analysisCard) {
        analysisCard.style.display = 'none';
    }
}

// Show insights function
function showInsights() {
    apiRequest('/finance/get_data')
        .then(result => {
            const data = result.data || {};
            const assets = data.assets || {};
            const liabilities = data.liabilities || {};
            const goals = data.goals || [];
            
            const totalAssets = (assets.savings || 0) + (assets.mutual_funds || 0) + (assets.stocks || 0);
            const totalLiabilities = (liabilities.loan || 0) + (liabilities.credit_card_due || 0);
            const netWorth = totalAssets - totalLiabilities;
            
            showFinancialAnalysis(data, totalAssets, totalLiabilities, netWorth);
            
            // Show modal with insights
            const analysisDiv = document.getElementById('financialAnalysis');
            if (analysisDiv && analysisDiv.innerHTML) {
                showModal('Financial Insights & Analysis', analysisDiv.innerHTML);
            } else {
                toast.info('View detailed analysis on the dashboard', 'info');
            }
        })
        .catch(error => {
            toast.error('Failed to load insights', 'error');
        });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#dc2626' : '#3b82f6';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        font-weight: 500;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show modal
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-lightbulb"></i> ${title}</h5>
                    <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    document.body.appendChild(modal);
}

// Refresh dashboard
function refreshDashboard() {
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Refreshing...';
    
    if (typeof loadFinancialData === 'function') {
        loadFinancialData().finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            showToast('Dashboard refreshed!', 'success');
        });
    } else {
        location.reload();
    }
}

// Check authentication on page load
// Wait for DOM to be ready before checking auth
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname === '/dashboard' || window.location.pathname === '/chat') {
            checkAuthDelayed();
        } else {
            checkAuth();
        }
    });
} else {
    // DOM is already loaded
    if (window.location.pathname === '/dashboard' || window.location.pathname === '/chat') {
        checkAuthDelayed();
    } else {
        checkAuth();
    }
}

