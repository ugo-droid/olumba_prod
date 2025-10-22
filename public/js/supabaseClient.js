// Supabase client for frontend use
// This file provides the Supabase client for browser/frontend operations

// Get configuration from config.js
const supabaseUrl = window.OLUMBA_CONFIG?.supabaseUrl || 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = window.OLUMBA_CONFIG?.supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY_HERE';

// Initialize Supabase client
let supabaseClient = null;

async function initializeSupabase() {
  try {
    // Dynamic import of Supabase client
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('✅ Supabase client initialized for Olumba');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    return null;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  window.supabaseClient = await initializeSupabase();
});

// Export for use in other scripts
window.initializeSupabase = initializeSupabase;