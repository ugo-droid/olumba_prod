/**
 * Clerk Client Configuration
 * Handles frontend authentication with Clerk
 */

// Clerk configuration from environment
const CLERK_PUBLISHABLE_KEY = window.CLERK_PUBLISHABLE_KEY || 'pk_test_ZXhjaXRlZC1ob3VuZC02NC5jbGVyay5hY2NvdW50cy5kZXYk';

// Initialize Clerk
let clerkInstance = null;

/**
 * Initialize Clerk SDK
 */
async function initializeClerk() {
    try {
        console.log('Starting Clerk initialization...');
        console.log('Publishable key:', CLERK_PUBLISHABLE_KEY);
        
        // Check if Clerk is already loaded globally
        if (window.Clerk) {
            clerkInstance = window.Clerk;
            console.log('✅ Clerk already loaded globally');
            
            // Wait for Clerk to be ready
            if (clerkInstance.load) {
                await clerkInstance.load();
                console.log('✅ Clerk loaded and ready');
            }
            
            return clerkInstance;
        }
        
        // Wait for Clerk to be available with longer timeout
        let attempts = 0;
        const maxAttempts = 200; // 20 seconds total – accommodate slower networks
        console.log('Waiting for Clerk SDK to load...');
        
        while (!window.Clerk && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            

            // After 5 seconds, attempt to load Clerk from the public CDN as a fallback
            if (attempts === 50 && !window.Clerk) {
                console.warn('Primary Clerk SDK still unavailable after 5s – loading fallback CDN');
                if (!document.getElementById('clerk-sdk-fallback')) {
                    const fallbackScript = document.createElement('script');
                    fallbackScript.id = 'clerk-sdk-fallback';
                    fallbackScript.src = 'https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js';
                    fallbackScript.setAttribute('data-clerk-publishable-key', CLERK_PUBLISHABLE_KEY);
                    fallbackScript.async = true;
                    fallbackScript.crossOrigin = 'anonymous';
                    document.head.appendChild(fallbackScript);
                }
            }

            if (attempts % 20 === 0) {
                console.log(`Still waiting for Clerk... (${attempts}/${maxAttempts})`);
            }
        }
        
        if (!window.Clerk) {
            console.error('❌ Clerk SDK failed to load after 10 seconds');
            console.log('Available globals:', Object.keys(window).filter(key => key.toLowerCase().includes('clerk')));
            throw new Error('Clerk SDK failed to load - check network connection and publishable key');
        }
        
        clerkInstance = window.Clerk;
        console.log('✅ Clerk initialized successfully');
        console.log('Clerk instance:', clerkInstance);
        
        // Wait for Clerk to be ready
        if (clerkInstance.load) {
            await clerkInstance.load();
            console.log('✅ Clerk loaded and ready');
        }
        
        return clerkInstance;
    } catch (error) {
        console.error('❌ Failed to initialize Clerk:', error);
        throw error;
    }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    if (!clerkInstance) {
        console.log('🔍 isAuthenticated: Clerk instance not available');
        return false;
    }
    
    // Check if user is loaded and has an ID
    const user = clerkInstance.user;
    const isAuth = user && user.id;
    
    console.log('🔍 isAuthenticated check:', {
        hasInstance: !!clerkInstance,
        hasUser: !!user,
        userId: user?.id,
        isAuthenticated: isAuth
    });
    
    return isAuth;
}

/**
 * Get current user
 */
function getCurrentUser() {
    if (!isAuthenticated()) {
        return null;
    }
    return clerkInstance.user;
}

/**
 * Get authentication token
 */
async function getAuthToken() {
    if (!isAuthenticated()) {
        return null;
    }
    try {
        const session = await clerkInstance.session;
        return session ? await session.getToken() : null;
    } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
    }
}

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
    try {
        if (!clerkInstance) {
            await initializeClerk();
        }
        
        const result = await clerkInstance.signIn.create({
            identifier: email,
            password: password
        });
        
        if (result.status === 'complete') {
            // Update user profile in backend
            await updateUserProfile();
            return { success: true, user: result.createdUserId };
        } else {
            throw new Error('Sign in incomplete');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
}

/**
 * Sign up with email and password
 */
async function signUp(email, password, userData = {}) {
    try {
        if (!clerkInstance) {
            await initializeClerk();
        }
        
        const result = await clerkInstance.signUp.create({
            emailAddress: email,
            password: password,
            firstName: userData.firstName,
            lastName: userData.lastName
        });
        
        if (result.status === 'complete') {
            // Update user metadata
            await updateUserMetadata(userData);
            // Update user profile in backend
            await updateUserProfile();
            return { success: true, user: result.createdUserId };
        } else {
            throw new Error('Sign up incomplete');
        }
    } catch (error) {
        console.error('Sign up error:', error);
        throw error;
    }
}

/**
 * Sign out
 */
async function signOut() {
    try {
        if (!clerkInstance) {
            return;
        }
        
        await clerkInstance.signOut();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

/**
 * Update user metadata
 */
async function updateUserMetadata(metadata) {
    try {
        if (!clerkInstance || !clerkInstance.user) {
            return;
        }
        
        await clerkInstance.user.update({
            publicMetadata: metadata
        });
    } catch (error) {
        console.error('Failed to update user metadata:', error);
    }
}

/**
 * Update user profile in backend
 */
async function updateUserProfile() {
    try {
        const token = await getAuthToken();
        if (!token) {
            return;
        }
        
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn('Failed to update user profile in backend');
        }
    } catch (error) {
        console.error('Failed to update user profile:', error);
    }
}

/**
 * Request password reset
 */
async function requestPasswordReset(email) {
    try {
        if (!clerkInstance) {
            await initializeClerk();
        }
        
        await clerkInstance.client.signIn.create({
            strategy: 'reset_password_email_code',
            identifier: email
        });
        
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}

/**
 * Get user organizations
 */
async function getUserOrganizations() {
    try {
        if (!isAuthenticated()) {
            return [];
        }
        
        return clerkInstance.user.organizationMemberships || [];
    } catch (error) {
        console.error('Failed to get organizations:', error);
        return [];
    }
}

/**
 * Redirect to sign in page
 */
function redirectToSignIn() {
    window.location.href = '/login-clerk.html';
}

/**
 * Redirect to sign up page
 */
function redirectToSignUp() {
    window.location.href = '/register-clerk.html';
}

/**
 * Redirect to dashboard
 */
function redirectToDashboard() {
    window.location.href = '/dashboard.html';
}

// Initialize Clerk when the script loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeClerk();
    } catch (error) {
        console.error('Failed to initialize Clerk on page load:', error);
    }
});

// Export functions for use in other scripts
window.clerkAuth = {
    initializeClerk,
    isAuthenticated,
    getCurrentUser,
    getAuthToken,
    signIn,
    signUp,
    signOut,
    updateUserMetadata,
    updateUserProfile,
    requestPasswordReset,
    getUserOrganizations,
    redirectToSignIn,
    redirectToSignUp,
    redirectToDashboard
};
