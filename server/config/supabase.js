import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://mzxsugnnyydinywvwqxt.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eHN1Z25ueXlkaW55d3Z3cXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjkwNzUsImV4cCI6MjA3NDk0NTA3NX0.IdoLZqV6azxoIoNjSc6_LJWdVMcD_httDe0rHfATtGI';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables not set. Using defaults.');
}

// Create Supabase client for public operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
});

// Create Supabase admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Database table names (for consistency)
export const TABLES = {
    USERS: 'users',
    COMPANIES: 'companies',
    ORGANIZATIONS: 'organizations',
    PROJECTS: 'projects',
    TASKS: 'tasks',
    DOCUMENTS: 'documents',
    DOCUMENT_VERSIONS: 'document_versions',
    MESSAGES: 'messages',
    NOTIFICATIONS: 'notifications',
    ACTIVITY_LOG: 'activity_log',
    PROJECT_MEMBERS: 'project_members',
    CITY_APPROVALS: 'city_approvals',
    SUBSCRIPTIONS: 'subscriptions',
    PAYMENT_ATTEMPTS: 'payment_attempts'
};

// Storage bucket names
export const STORAGE_BUCKETS = {
    DOCUMENTS: 'documents',
    AVATARS: 'avatars',
    COMPANY_LOGOS: 'company-logos'
};

// User roles enum
export const USER_ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member',
    CONSULTANT: 'consultant',
    CLIENT: 'client',
    GUEST: 'guest'
};

// Project member roles
export const PROJECT_ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
    CONSULTANT: 'consultant',
    CLIENT: 'client',
    VIEWER: 'viewer'
};

console.log('✅ Supabase client initialized');
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Using ${supabaseServiceRoleKey ? 'Service Role' : 'Anon'} key for admin operations`);
