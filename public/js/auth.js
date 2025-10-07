/**
 * Unified Authentication System
 * Handles authentication state and redirects across the application
 */

// Check if user is authenticated and redirect if needed
async function checkAuthAndRedirect() {
    try {
        // Wait for Clerk to be available
        if (window.clerkAuth && window.clerkAuth.isAuthenticated()) {
            console.log('User is authenticated');
            return true;
        }
        
        // If not authenticated, redirect to login
        console.log('User not authenticated, redirecting to login');
        window.location.href = '/login-clerk.html';
        return false;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login-clerk.html';
        return false;
    }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Only check auth on protected pages (not login/signup pages)
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login') || currentPath.includes('register') || currentPath === '/';
    
    if (!isAuthPage) {
        await checkAuthAndRedirect();
    }
});

// Export for use in other scripts
window.auth = {
    checkAuthAndRedirect
};