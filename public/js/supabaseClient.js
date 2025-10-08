/**
 * Supabase Client for Frontend
 * Handles authentication and API calls to Supabase
 */

// Import Supabase from CDN (add this to your HTML files)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

class SupabaseClient {
    constructor() {
        // These will be set from environment or config
        this.supabaseUrl = window.SUPABASE_URL || 'your_supabase_url';
        this.supabaseAnonKey = window.SUPABASE_ANON_KEY || 'your_supabase_anon_key';
        
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded. Please include the Supabase CDN script.');
            return;
        }
        
        this.client = supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
        this.currentUser = null;
        this.currentSession = null;
        
        // Initialize auth state
        this.initAuth();
    }

    /**
     * Initialize authentication state
     */
    async initAuth() {
        try {
            // Get current session
            const { data: { session }, error } = await this.client.auth.getSession();
            
            if (error) {
                console.error('Auth initialization error:', error);
                return;
            }

            if (session) {
                this.currentSession = session;
                await this.setCurrentUser(session.user);
            }

            // Listen for auth changes
            this.client.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event);
                
                if (session) {
                    this.currentSession = session;
                    await this.setCurrentUser(session.user);
                } else {
                    this.currentSession = null;
                    this.currentUser = null;
                    localStorage.removeItem('supabase_user');
                }
            });

        } catch (error) {
            console.error('Auth initialization failed:', error);
        }
    }

    /**
     * Set current user and store in localStorage
     */
    async setCurrentUser(user) {
        if (!user) return;

        try {
            // Get full user profile from our API
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.currentSession.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userProfile = await response.json();
                this.currentUser = userProfile;
                localStorage.setItem('supabase_user', JSON.stringify(userProfile));
            } else {
                // Fallback to basic user info
                this.currentUser = {
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email
                };
                localStorage.setItem('supabase_user', JSON.stringify(this.currentUser));
            }
        } catch (error) {
            console.error('Error setting current user:', error);
        }
    }

    /**
     * Sign up a new user
     */
    async signUp(email, password, userData = {}) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    ...userData
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Registration failed');
            }

            return result;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }

    /**
     * Sign in user - now delegates to Clerk
     */
    async signIn(email, password) {
        try {
            // If Clerk is available, use Clerk authentication
            if (window.clerkAuth) {
                console.log('Using Clerk authentication for sign in');
                return await window.clerkAuth.signIn(email, password);
            }
            
            // Fallback to legacy API authentication
            console.log('Using legacy API authentication for sign in');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Login failed');
            }

            // Set session manually since we're using our API
            this.currentSession = result.session;
            this.currentUser = result.user;
            localStorage.setItem('supabase_user', JSON.stringify(result.user));
            localStorage.setItem('supabase_token', result.access_token);

            return result;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            // Clear local state
            this.currentSession = null;
            this.currentUser = null;
            localStorage.removeItem('supabase_user');
            localStorage.removeItem('supabase_token');

            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        // Try to get from localStorage
        const storedUser = localStorage.getItem('supabase_user');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                return this.currentUser;
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('supabase_user');
            }
        }

        return null;
    }

    /**
     * Get access token
     */
    getAccessToken() {
        if (this.currentSession?.access_token) {
            return this.currentSession.access_token;
        }

        // Try to get from localStorage
        return localStorage.getItem('supabase_token');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        // First check Clerk authentication
        if (window.clerkAuth && window.clerkAuth.isAuthenticated()) {
            return true;
        }
        
        // Fallback to Supabase authentication
        return !!(this.getCurrentUser() && this.getAccessToken());
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        const token = this.getAccessToken();
        
        if (!token) {
            throw new Error('No access token available');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const response = await fetch(endpoint, {
            ...defaultOptions,
            ...options
        });

        if (response.status === 401) {
            // Token expired, redirect to login
            this.signOut();
            window.location.href = '/login-clerk.html';
            return;
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        try {
            const result = await this.apiRequest('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(updates)
            });

            // Update local user data
            this.currentUser = { ...this.currentUser, ...result };
            localStorage.setItem('supabase_user', JSON.stringify(this.currentUser));

            return result;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    /**
     * Upload file to Supabase Storage
     */
    async uploadFile(bucket, path, file) {
        try {
            const { data, error } = await this.client.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    /**
     * Get signed URL for file
     */
    async getFileUrl(bucket, path, expiresIn = 3600) {
        try {
            const { data, error } = await this.client.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn);

            if (error) throw error;
            return data.signedUrl;
        } catch (error) {
            console.error('Get file URL error:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time changes
     */
    subscribe(table, callback, filter = '*') {
        return this.client
            .channel(`public:${table}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table, filter }, 
                callback
            )
            .subscribe();
    }

    /**
     * Unsubscribe from real-time changes
     */
    unsubscribe(subscription) {
        if (subscription) {
            this.client.removeChannel(subscription);
        }
    }
}

// Create global instance
window.supabaseClient = new SupabaseClient();

// Backward compatibility with existing auth object
window.auth = {
    login: (email, password) => window.supabaseClient.signIn(email, password),
    register: (userData) => window.supabaseClient.signUp(userData.email, userData.password, userData),
    logout: () => window.supabaseClient.signOut(),
    getCurrentUser: () => window.supabaseClient.getCurrentUser(),
    isAuthenticated: () => window.supabaseClient.isAuthenticated(),
    updateProfile: (updates) => window.supabaseClient.updateProfile(updates)
};

// Helper functions for backward compatibility
window.getCurrentUser = () => window.supabaseClient.getCurrentUser();
window.getAuthToken = () => window.supabaseClient.getAccessToken();
window.requireAuth = () => {
    if (!window.supabaseClient.isAuthenticated()) {
        window.location.href = '/login-clerk.html';
        return false;
    }
    return true;
};
