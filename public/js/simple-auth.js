/**
 * Simplified Authentication System
 * One file, clear logic, no bloat
 */

// Simple auth check - returns true if authenticated
function isLoggedIn() {
    // For development, always return true to test pages
    // In production, check Clerk or token
    return true; // Simplified for testing
}

// Initialize page with simple auth check
function initPage(pageName, initCallback) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log(`Initializing ${pageName}...`);
        
        // Simple auth check
        if (!isLoggedIn()) {
            window.location.href = '/login-clerk.html';
            return;
        }
        
        // Initialize navigation
        if (window.initSimpleNav) {
            window.initSimpleNav(pageName);
        }
        
        // Run page-specific initialization
        if (initCallback) {
            initCallback();
        }
    });
}

// Export for global use
window.initPage = initPage;
window.isLoggedIn = isLoggedIn;

