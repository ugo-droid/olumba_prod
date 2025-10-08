/**
 * Unified Authentication System
 * Handles authentication state and redirects across the application
 */

// Check if user is authenticated and redirect if needed
async function checkAuthAndRedirect() {
    try {
        // Initialize Clerk first
        if (window.clerkAuth) {
            await window.clerkAuth.initializeClerk();
            
            if (window.clerkAuth.isAuthenticated()) {
                console.log('✅ User is authenticated with Clerk');
                
                // Ensure user profile exists in backend
                try {
                    await window.clerkAuth.ensureUserProfileExists();
                } catch (profileError) {
                    console.warn('Failed to sync user profile:', profileError);
                }
                
                return true;
            }
        }
        
        // Check for legacy token authentication
        const token = localStorage.getItem('auth_token');
        if (token) {
            console.log('✅ User has legacy auth token');
            return true;
        }
        
        // If not authenticated, redirect to login
        console.log('❌ User not authenticated, redirecting to login');
        window.location.href = '/login-clerk.html';
        return false;
    } catch (error) {
        console.error('❌ Auth check failed:', error);
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