// =============================
// Supabase Admin Client (Service Role)
// =============================
// Use ONLY on the server for bypassing RLS
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required but not set in environment variables');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not set in environment variables');
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Type definitions for database tables
export interface Organization {
  id: string;
  name: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  tier?: string;
  billing_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationEntitlement {
  id?: string;
  organization_id: string;
  tier: string;
  max_internal_members: number;
  base_storage_gb: number;
  city_integrations: number;
  extra_storage_gb: number;
  external_collaborators_billable: boolean;
  updated_at?: string;
}

export interface Member {
  id?: string;
  organization_id: string;
  user_id: string; // Clerk user ID
  role: 'owner' | 'admin' | 'member' | 'external';
  email: string;
  created_at?: string;
}

export interface Project {
  id?: string;
  organization_id: string;
  name: string;
  created_by_user_id: string;
  created_at?: string;
}

export interface BillingEvent {
  id?: string;
  event_id: string;
  event_type: string;
  organization_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  payload: any;
  processed: boolean;
  idempotency_key?: string;
  processed_at?: string;
  created_at?: string;
}

