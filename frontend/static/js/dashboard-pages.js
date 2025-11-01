// Dashboard page functionality and button handlers

// Setup all button handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupButtonHandlers();
});

// Setup all button handlers
function setupButtonHandlers() {
    // Chart action buttons (ellipsis) - wait for them to exist
    setTimeout(() => {
        document.querySelectorAll('.card-header .card-action-btn').forEach(btn => {
            if (btn.querySelector('.fa-ellipsis-v')) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const card = this.closest('.card');
                    const chartId = card.querySelector('canvas')?.id;
                    const chartType = chartId?.includes('assets') ? 'assets' : 'overview';
                    toggleChartMenu(this, chartType);
                });
            }
        });

        // Info button in financial data form
        const infoBtn = document.querySelector('.card-header .fa-info-circle')?.closest('.card-action-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', function() {
                showInfoModal(
                    'Financial Data Entry Guide',
                    `<p>Enter your financial information below:</p>
                    <ul style="margin-top: 1rem; padding-left: 1.5rem; line-height: 1.8;">
                        <li><strong>Assets:</strong> Your savings, mutual funds, and stock investments</li>
                        <li><strong>Liabilities:</strong> Any loans or credit card debt</li>
                        <li><strong>Goals:</strong> Financial targets you want to achieve</li>
                    </ul>
                    <p style="margin-top: 1rem; color: var(--text-tertiary);">All amounts should be in ₹ (Indian Rupees).</p>`
                );
            });
        }

        // Notification button
        const notifBtn = document.querySelector('.fa-bell')?.closest('button');
        if (notifBtn) {
            notifBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleDropdown('notificationsDropdown', this);
            });
        }

        // Messages button
        const msgBtn = document.querySelector('.fa-envelope')?.closest('button');
        if (msgBtn) {
            msgBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleDropdown('messagesDropdown', this);
            });
        }
    }, 100);
}

// Toggle chart menu dropdown
function toggleChartMenu(button, chartType) {
    const menu = document.getElementById('chartMenu');
    if (!menu) return;
    
    const allMenus = document.querySelectorAll('.dropdown-menu');
    allMenus.forEach(m => {
        if (m !== menu) m.style.display = 'none';
    });
    
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        const rect = button.getBoundingClientRect();
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
        menu.style.display = 'block';
        menu.dataset.chartType = chartType;
        
        // Update menu links with correct chart type
        menu.querySelectorAll('a').forEach(link => {
            const onclick = link.getAttribute('onclick');
            if (onclick) {
                link.setAttribute('onclick', onclick.replace(/'assets'|'overview'/, `'${chartType}'`));
            }
        });
    }
}

// Toggle dropdown menus
function toggleDropdown(dropdownId, button) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    const allDropdowns = document.querySelectorAll('.dropdown-menu');
    allDropdowns.forEach(d => {
        if (d !== dropdown) d.style.display = 'none';
    });
    
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        const rect = button.getBoundingClientRect();
        // Use fixed positioning based on viewport coordinates (works when scrolled)
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 5) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        dropdown.style.display = 'block';
        
        // Adjust if dropdown goes off screen
        setTimeout(() => {
            const dropdownRect = dropdown.getBoundingClientRect();
            if (dropdownRect.bottom > window.innerHeight) {
                // Show above button if it would go off bottom
                dropdown.style.top = (rect.top - dropdownRect.height - 5) + 'px';
            }
            if (dropdownRect.left < 0) {
                dropdown.style.right = '10px';
                dropdown.style.left = 'auto';
            }
            if (dropdownRect.right > window.innerWidth) {
                dropdown.style.right = '10px';
            }
        }, 0);
    }
}

// Close dropdown
function closeDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) dropdown.style.display = 'none';
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Show info modal
function showInfoModal(title, content) {
    const modal = document.getElementById('infoModal');
    if (!modal) return;
    
    document.getElementById('infoModalTitle').textContent = title;
    document.getElementById('infoModalBody').innerHTML = content;
    modal.style.display = 'flex';
}

// Export chart
function exportChart(chartType) {
    const canvas = document.getElementById(chartType === 'assets' ? 'assetsChart' : 'overviewChart');
    if (canvas) {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chartType}-chart-${new Date().toISOString().split('T')[0]}.png`;
        a.click();
        if (typeof toast !== 'undefined') {
toast.success('Chart exported successfully!');
        }
    }
}

// Refresh chart
function refreshChart(chartType) {
    if (typeof window.loadFinancialData === 'function') {
        window.loadFinancialData();
        if (typeof toast !== 'undefined') {
toast.success('Chart data refreshed!');
        }
    }
}

// Show chart info
function showChartInfo(chartType) {
    const info = chartType === 'assets' 
        ? 'Asset Distribution shows how your total assets are allocated across savings, mutual funds, and stocks.'
        : 'Financial Overview displays your total assets, liabilities, and net worth in a bar chart format.';
    showInfoModal('Chart Information', `<p>${info}</p>`);
}

// Mark all notifications as read
function markAllNotificationsRead() {
    if (typeof toast !== 'undefined') {
toast.success('All notifications marked as read');
    }
    closeDropdown('notificationsDropdown');
}

// View all messages
function viewAllMessages() {
    if (typeof toast !== 'undefined') {
toast.info('Messages feature coming soon');
    }
    closeDropdown('messagesDropdown');
}

// Perform search
function performSearch(query) {
    if (typeof toast !== 'undefined') {
toast.info(`Searching for: ${query}`);
    }
    // Add search functionality here
}

// Generate report
function generateReport(type) {
    if (typeof toast !== 'undefined') {
toast.info(`Generating ${type} report...`);
    }
    // Add report generation here
}

// Save settings
function saveSettings() {
    if (typeof toast !== 'undefined') {
toast.success('Settings saved successfully!');
    }
}

// Close modals/dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-menu') && 
        !e.target.closest('.card-action-btn') && 
        !e.target.closest('.topbar-action-btn')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

