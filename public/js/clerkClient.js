/**
 * Clerk Client Configuration
 * Handles frontend authentication with Clerk
 */

// Clerk configuration from environment
const CLERK_PUBLISHABLE_KEY = window.CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsub2x1bWJhLmFwcCQ';

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
                await clerkInstance.load({
                    publishableKey: CLERK_PUBLISHABLE_KEY
                });
                console.log('✅ Clerk loaded and ready');
            }
            
            return clerkInstance;
        }
        
        // Wait for Clerk to be available with longer timeout
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds total
        console.log('Waiting for Clerk SDK to load...');
        
        while (!window.Clerk && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
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
            await clerkInstance.load({
                publishableKey: CLERK_PUBLISHABLE_KEY
            });
            console.log('✅ Clerk loaded and ready');
            
            // Add authentication state listener for automatic redirects
            clerkInstance.addListener((event) => {
                console.log('🔐 Clerk auth event:', event);
                if (event.user && event.user.id) {
                    // User signed in, check if we're on a login page and redirect
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('login-clerk.html') || currentPath.includes('register-clerk.html')) {
                        console.log('✅ User authenticated, redirecting to dashboard');
                        setTimeout(() => {
                            window.location.href = window.CLERK_SIGN_IN_REDIRECT_URL || '/dashboard.html';
                        }, 500);
                    }
                }
            });
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
            
            // Redirect to dashboard after successful sign in
            setTimeout(() => {
                window.location.href = window.CLERK_SIGN_IN_REDIRECT_URL || '/dashboard.html';
            }, 100);
            
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
        
        // Clear local storage including onboarding status
        localStorage.removeItem('onboarding_completed');
        localStorage.removeItem('user_profile');
        
        await clerkInstance.signOut();
        window.location.href = '/login-clerk.html';
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
            console.warn('No auth token available for profile update');
            return;
        }
        
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userProfile = await response.json();
            console.log('✅ User profile synced with backend:', userProfile);
            
            // Store user profile locally for quick access
            localStorage.setItem('user_profile', JSON.stringify(userProfile));
            return userProfile;
        } else {
            console.warn('Failed to sync user profile with backend:', response.status);
        }
    } catch (error) {
        console.error('Failed to update user profile:', error);
    }
}

/**
 * Ensure user profile exists in backend database
 */
async function ensureUserProfileExists() {
    try {
        const token = await getAuthToken();
        const user = getCurrentUser();
        
        if (!token || !user) {
            console.warn('No token or user available for profile creation');
            return;
        }
        
        // Try to get existing profile first
        const existingProfile = await updateUserProfile();
        if (existingProfile) {
            return existingProfile;
        }
        
        // If no profile exists, create one
        console.log('Creating user profile in backend...');
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.emailAddresses?.[0]?.emailAddress || user.email,
                profile_photo: user.profileImageUrl,
                role: 'member'
            })
        });
        
        if (response.ok) {
            const newProfile = await response.json();
            console.log('✅ User profile created in backend:', newProfile);
            localStorage.setItem('user_profile', JSON.stringify(newProfile));
            return newProfile;
        } else {
            console.error('Failed to create user profile:', response.status);
        }
    } catch (error) {
        console.error('Error ensuring user profile exists:', error);
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

/**
 * Redirect to onboarding
 */
function redirectToOnboarding() {
    window.location.href = '/onboarding.html';
}

/**
 * Check if user needs onboarding
 */
function needsOnboarding(user) {
    // Check for URL parameter to bypass onboarding (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('skipOnboarding') === 'true') {
        console.log('🔧 Skipping onboarding due to URL parameter');
        return false;
    }
    
    // Check local storage first (for backward compatibility)
    const localOnboardingCompleted = localStorage.getItem('onboarding_completed');
    if (localOnboardingCompleted === 'true') {
        console.log('✅ Onboarding completed (local storage)');
        return false;
    }
    
    // Check Clerk metadata
    const clerkOnboardingCompleted = user?.publicMetadata?.onboardingCompleted;
    if (clerkOnboardingCompleted) {
        console.log('✅ Onboarding completed (Clerk metadata)');
        return false;
    }
    
    console.log('⚠️ User needs onboarding', {
        hasUser: !!user,
        publicMetadata: user?.publicMetadata,
        localStorage: localOnboardingCompleted
    });
    
    return true;
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
    ensureUserProfileExists,
    requestPasswordReset,
    getUserOrganizations,
    redirectToSignIn,
    redirectToSignUp,
    redirectToDashboard,
    redirectToOnboarding,
    needsOnboarding
};
