/**
 * Universal Page Authentication
 * Handles authentication checks for all protected pages
 */

// Initialize page with proper authentication
async function initializePage(pageName, initCallback) {
    try {
        console.log(`🚀 Initializing ${pageName} page...`);
        
        // Initialize Clerk first
        if (window.clerkAuth) {
            await window.clerkAuth.initializeClerk();
        }
        
        // Check authentication
        if (!requireAuth()) {
            return; // Will redirect to login
        }
        
        console.log(`✅ User authenticated, loading ${pageName} page`);
        
        // Initialize navigation
        if (window.initNav) {
            initNav(pageName);
        }
        
        // Call page-specific initialization
        if (initCallback && typeof initCallback === 'function') {
            initCallback();
        }
        
    } catch (error) {
        console.error(`❌ Error initializing ${pageName} page:`, error);
        window.location.href = '/login-clerk.html';
    }
}

// Export for global use
window.initializePage = initializePage;