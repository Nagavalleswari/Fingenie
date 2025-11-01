// Theme Toggle Functionality with LocalStorage Persistence

// Get saved theme from localStorage or default to 'dark'
function getSavedTheme() {
    return localStorage.getItem('theme') || 'dark';
}

// Save theme to localStorage
function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update toggle button icons
    const themeIcons = document.querySelectorAll('.theme-icon');
    themeIcons.forEach(icon => {
        if (theme === 'light') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
}

// Toggle between dark and light themes
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    applyTheme(newTheme);
    saveTheme(newTheme);
    
    // Optional: Show toast notification
    if (typeof toast !== 'undefined') {
        const message = newTheme === 'light' ? 'Light mode activated ☀️' : 'Dark mode activated 🌙';
toast.success(message, 2000);
    }
}

// Initialize theme on page load
function initTheme() {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    
    // Add event listeners to all theme toggle buttons
    const toggleButtons = document.querySelectorAll('.theme-toggle, .theme-toggle-btn, .floating-theme-toggle');
    toggleButtons.forEach(button => {
        button.addEventListener('click', toggleTheme);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// Export functions for use in other scripts
window.themeToggle = {
    toggle: toggleTheme,
    apply: applyTheme,
    getSaved: getSavedTheme,
    save: saveTheme
};
