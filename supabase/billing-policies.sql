-- =============================
-- Supabase RLS Policies for Billing System
-- =============================
--
-- Run Instructions:
-- 1. Ensure billing-schema.sql has been run first
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 5. Verify policies in Table Editor → RLS tab
--
-- Security Model:
-- - Owners & Admins: Full access to their org data
-- - Members: Read access to their org, limited write
-- - External: Read-only access, cannot create projects
-- - Anonymous: No access
--
-- JWT Requirements:
-- - Clerk JWT must include 'sub' (user_id) in claims
-- - Frontend Supabase client must include Clerk JWT
-- =============================

-- =============================
-- ENABLE RLS ON ALL TABLES
-- =============================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- =============================
-- ORGANIZATIONS POLICIES
-- =============================

-- Members can read their own organization
CREATE POLICY "Members can read their organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = auth.jwt() ->> 'sub'
  )
);

-- Owners and admins can update their organization
CREATE POLICY "Owners and admins can update organization"
ON organizations FOR UPDATE
TO authenticated
USING (auth.can_manage_org(id))
WITH CHECK (auth.can_manage_org(id));

-- Owners can delete their organization
CREATE POLICY "Owners can delete organization"
ON organizations FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = auth.jwt() ->> 'sub'
      AND role = 'owner'
  )
);

-- Service role (webhook) can insert/update organizations
-- (No policy needed - service role bypasses RLS)

-- =============================
-- ORGANIZATION ENTITLEMENTS POLICIES
-- =============================

-- All members can read their organization's entitlements
CREATE POLICY "Members can read their entitlements"
ON organization_entitlements FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = auth.jwt() ->> 'sub'
  )
);

-- Only service role can update entitlements (via webhook)
-- (No policy needed - service role bypasses RLS)

-- =============================
-- MEMBERS POLICIES
-- =============================

-- Members can read other members in their organization
CREATE POLICY "Members can read org members"
ON members FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = auth.jwt() ->> 'sub'
  )
);

-- Owners and admins can invite new members
CREATE POLICY "Owners and admins can invite members"
ON members FOR INSERT
TO authenticated
WITH CHECK (auth.can_manage_org(organization_id));

-- Owners and admins can update member roles
CREATE POLICY "Owners and admins can update members"
ON members FOR UPDATE
TO authenticated
USING (auth.can_manage_org(organization_id))
WITH CHECK (auth.can_manage_org(organization_id));

-- Owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
ON members FOR DELETE
TO authenticated
USING (auth.can_manage_org(organization_id));

-- =============================
-- PROJECTS POLICIES
-- =============================

-- All members can read projects in their organization
CREATE POLICY "Members can read org projects"
ON projects FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = auth.jwt() ->> 'sub'
  )
);

-- Only INTERNAL members can create projects (not external collaborators)
CREATE POLICY "Internal members can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  auth.is_internal_member(organization_id)
  AND created_by_user_id = auth.jwt() ->> 'sub'
);

-- Project creator and org admins can update projects
CREATE POLICY "Creators and admins can update projects"
ON projects FOR UPDATE
TO authenticated
USING (
  created_by_user_id = auth.jwt() ->> 'sub'
  OR auth.can_manage_org(organization_id)
)
WITH CHECK (
  created_by_user_id = auth.jwt() ->> 'sub'
  OR auth.can_manage_org(organization_id)
);

-- Project creator and org admins can delete projects
CREATE POLICY "Creators and admins can delete projects"
ON projects FOR DELETE
TO authenticated
USING (
  created_by_user_id = auth.jwt() ->> 'sub'
  OR auth.can_manage_org(organization_id)
);

-- =============================
-- BILLING EVENTS POLICIES
-- =============================

-- Only owners and admins can read billing events
CREATE POLICY "Admins can read billing events"
ON billing_events FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM members 
    WHERE user_id = auth.jwt() ->> 'sub'
      AND role IN ('owner', 'admin')
  )
);

-- Only service role can insert billing events (via webhook)
-- (No policy needed - service role bypasses RLS)

-- =============================
-- ADDITIONAL SECURITY CHECKS
-- =============================

-- Prevent external collaborators from being upgraded to internal roles
-- without proper billing checks (enforce in application logic)

-- Example: Check member count before adding internal member
CREATE OR REPLACE FUNCTION check_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_internal_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Only check for internal roles
  IF NEW.role IN ('owner', 'admin', 'member') THEN
    -- Count current internal members
    SELECT COUNT(*) INTO current_internal_count
    FROM members
    WHERE organization_id = NEW.organization_id
      AND role IN ('owner', 'admin', 'member');

    -- Get max allowed from entitlements
    SELECT max_internal_members INTO max_allowed
    FROM organization_entitlements
    WHERE organization_id = NEW.organization_id;

    -- Check if limit exceeded
    IF current_internal_count >= max_allowed THEN
      RAISE EXCEPTION 'Internal member limit reached. Please upgrade your plan.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to members table
CREATE TRIGGER enforce_member_limit
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_member_limit();

-- =============================
-- GRANT PERMISSIONS
-- =============================

-- Grant service role full access (for webhooks)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant authenticated users limited access (enforced by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================
-- SUCCESS MESSAGE
-- =============================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created successfully!';
  RAISE NOTICE 'Security model:';
  RAISE NOTICE '  - Owners & Admins: Full org access';
  RAISE NOTICE '  - Members: Read access + limited write';
  RAISE NOTICE '  - External: Read-only, cannot create projects';
  RAISE NOTICE '  - Service role: Bypasses RLS for webhooks';
END $$;

