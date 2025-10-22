// Olumba Configuration
// This file provides configuration values for the frontend
// In production, these should be injected during build time

window.OLUMBA_CONFIG = {
  // Supabase Configuration
  supabaseUrl: 'YOUR_SUPABASE_URL_HERE',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY_HERE',
  
  // API Configuration
  apiBaseUrl: '/api',
  
  // App Configuration
  appName: 'Olumba',
  version: '2.0.0'
};

console.log('✅ Olumba configuration loaded');
