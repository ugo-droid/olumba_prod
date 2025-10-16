-- =============================
-- Supabase Billing Schema for AEC Platform
-- =============================
--
-- Run Instructions:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. Verify tables created in Table Editor
--
-- This schema creates:
-- - organizations: main org data with Stripe references
-- - organization_entitlements: feature limits and quotas
-- - members: user-to-org relationships with roles
-- - projects: org-owned projects with creator tracking
-- - billing_events: webhook audit trail
--
-- Dependencies: uuid-ossp extension (usually pre-installed)
-- =============================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================
-- ORGANIZATIONS TABLE
-- =============================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT DEFAULT 'none',
  billing_status TEXT DEFAULT 'none', -- none, active, past_due, canceled, incomplete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON organizations(stripe_subscription_id);

-- =============================
-- ORGANIZATION ENTITLEMENTS TABLE
-- =============================
CREATE TABLE IF NOT EXISTS organization_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'none',
  max_internal_members INTEGER NOT NULL DEFAULT 0,
  base_storage_gb INTEGER NOT NULL DEFAULT 0,
  city_integrations INTEGER NOT NULL DEFAULT 0,
  extra_storage_gb INTEGER NOT NULL DEFAULT 0,
  external_collaborators_billable BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Index for faster org lookups
CREATE INDEX IF NOT EXISTS idx_entitlements_org ON organization_entitlements(organization_id);

-- =============================
-- MEMBERS TABLE
-- =============================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, external
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_org ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(organization_id, role);

-- =============================
-- PROJECTS TABLE
-- =============================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- active, archived, completed
  created_by_user_id TEXT NOT NULL, -- Clerk user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(organization_id, status);

-- =============================
-- BILLING EVENTS TABLE (Webhook Audit Trail)
-- =============================
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event ID
  event_type TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_events_event_id ON billing_events(event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_processed ON billing_events(processed);

-- =============================
-- HELPER FUNCTIONS
-- =============================

-- Function to get current user's org ID from JWT
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM members 
  WHERE user_id = auth.jwt() ->> 'sub'
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to get current user's role in an org
CREATE OR REPLACE FUNCTION auth.user_role_in_org(org_id UUID)
RETURNS TEXT AS $$
  SELECT role 
  FROM members 
  WHERE user_id = auth.jwt() ->> 'sub'
    AND organization_id = org_id
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to check if user is internal (owner, admin, or member)
CREATE OR REPLACE FUNCTION auth.is_internal_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM members 
    WHERE user_id = auth.jwt() ->> 'sub'
      AND organization_id = org_id
      AND role IN ('owner', 'admin', 'member')
  );
$$ LANGUAGE SQL STABLE;

-- Function to check if user can manage org (owner or admin)
CREATE OR REPLACE FUNCTION auth.can_manage_org(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM members 
    WHERE user_id = auth.jwt() ->> 'sub'
      AND organization_id = org_id
      AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL STABLE;

-- =============================
-- TRIGGERS FOR UPDATED_AT
-- =============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_entitlements_updated_at
  BEFORE UPDATE ON organization_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================
-- SUCCESS MESSAGE
-- =============================
DO $$
BEGIN
  RAISE NOTICE '✅ Billing schema created successfully!';
  RAISE NOTICE 'Next step: Run billing-policies.sql to set up Row Level Security';
END $$;

