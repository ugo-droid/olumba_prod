/**
 * Frontend Configuration
 * Contains environment-specific settings for the Olumba app
 */

// Supabase Configuration (for database operations)
// These values should be replaced with your actual Supabase project details
window.SUPABASE_URL = 'https://mzxsugnnyydinywvwqxt.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eHN1Z25ueXlkaW55d3Z3cXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjkwNzUsImV4cCI6MjA3NDk0NTA3NX0.IdoLZqV6azxoIoNjSc6_LJWdVMcD_httDe0rHfATtGI';

// Clerk Configuration (for authentication)
// These values should be replaced with your actual Clerk project details
window.CLERK_PUBLISHABLE_KEY = 'pk_live_Y2xlcmsub2x1bWJhLmFwcCQ';

// App Configuration
window.APP_CONFIG = {
    // API Base URL
    API_BASE_URL: window.location.origin + '/api',
    
    // File upload settings
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_FILE_TYPES: [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-zip-compressed'
    ],
    
    // Real-time features
    ENABLE_REALTIME: true,
    
    // Feature flags
    FEATURES: {
        CLERK_AUTH: true,
        SUPABASE_DATABASE: true,
        LEGACY_AUTH: false,
        REAL_TIME_NOTIFICATIONS: true,
        FILE_VERSIONING: true,
        ADVANCED_SEARCH: true
    },
    
    // UI Settings
    ITEMS_PER_PAGE: 20,
    NOTIFICATION_TIMEOUT: 5000,
    
    // Storage buckets
    STORAGE_BUCKETS: {
        DOCUMENTS: 'documents',
        AVATARS: 'avatars',
        COMPANY_LOGOS: 'company-logos'
    }
};

// Environment detection
window.APP_CONFIG.IS_DEVELOPMENT = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1';

// Debug mode
window.APP_CONFIG.DEBUG = window.APP_CONFIG.IS_DEVELOPMENT;

// Console log configuration info in development
if (window.APP_CONFIG.DEBUG) {
    console.log('🔧 App Configuration:', window.APP_CONFIG);
    console.log('🔗 Supabase URL:', window.SUPABASE_URL);
}
