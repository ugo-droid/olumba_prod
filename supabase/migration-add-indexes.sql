-- Migration: Add Performance Indexes
-- Run this in your Supabase SQL Editor
-- These indexes significantly improve query performance

-- =============================
-- Projects Table Indexes
-- =============================

-- Index for filtering projects by organization (most common query)
CREATE INDEX IF NOT EXISTS idx_projects_organization_id 
ON projects(organization_id, created_at DESC);

-- Index for filtering by status within organization
CREATE INDEX IF NOT EXISTS idx_projects_org_status 
ON projects(organization_id, status, created_at DESC);

-- Index for filtering by created_by (user's projects)
CREATE INDEX IF NOT EXISTS idx_projects_created_by 
ON projects(created_by_user_id, created_at DESC);

-- Index for deadline-based queries (upcoming deadlines)
CREATE INDEX IF NOT EXISTS idx_projects_deadline 
ON projects(deadline) 
WHERE deadline IS NOT NULL AND status NOT IN ('completed', 'cancelled');

-- =============================
-- Tasks Table Indexes
-- =============================

-- Index for filtering tasks by project (most common)
CREATE INDEX IF NOT EXISTS idx_tasks_project_id 
ON tasks(project_id, created_at DESC);

-- Index for user's assigned tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
ON tasks(assigned_to_user_id, status, due_date);

-- Index for filtering by status within project
CREATE INDEX IF NOT EXISTS idx_tasks_project_status 
ON tasks(project_id, status, priority DESC);

-- Index for due date queries (overdue tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
ON tasks(due_date) 
WHERE due_date IS NOT NULL AND status NOT IN ('completed', 'cancelled');

-- Index for priority-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_priority 
ON tasks(priority DESC, due_date);

-- =============================
-- Documents Table Indexes
-- =============================

-- Index for documents by project
CREATE INDEX IF NOT EXISTS idx_documents_project_id 
ON documents(project_id, uploaded_at DESC);

-- Index for documents by organization
CREATE INDEX IF NOT EXISTS idx_documents_organization_id 
ON documents(organization_id, uploaded_at DESC);

-- Index for uploaded by user
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by 
ON documents(uploaded_by_user_id, uploaded_at DESC);

-- Index for discipline-based filtering
CREATE INDEX IF NOT EXISTS idx_documents_discipline 
ON documents(project_id, discipline, uploaded_at DESC) 
WHERE discipline IS NOT NULL;

-- =============================
-- Members Table Indexes
-- =============================

-- Index for organization membership lookups
CREATE INDEX IF NOT EXISTS idx_members_organization_id 
ON members(organization_id, role);

-- Index for user's organizations
CREATE INDEX IF NOT EXISTS idx_members_user_id 
ON members(user_id, organization_id);

-- Composite index for permission checks
CREATE INDEX IF NOT EXISTS idx_members_user_org 
ON members(user_id, organization_id, role);

-- =============================
-- Organizations Table Indexes
-- =============================

-- Index for Clerk organization mapping
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_org_id 
ON organizations(clerk_org_id) 
WHERE clerk_org_id IS NOT NULL;

-- Index for billing status queries
CREATE INDEX IF NOT EXISTS idx_organizations_billing_status 
ON organizations(billing_status, tier);

-- Index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer 
ON organizations(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- =============================
-- Organization Entitlements Indexes
-- =============================

-- Index for organization entitlements lookup
CREATE INDEX IF NOT EXISTS idx_entitlements_organization_id 
ON organization_entitlements(organization_id);

-- =============================
-- Billing Events Indexes
-- =============================
-- (Already created in migration-add-idempotency.sql)
-- Included here for completeness

-- CREATE INDEX IF NOT EXISTS idx_billing_events_event_id 
-- ON billing_events(event_id);

-- CREATE INDEX IF NOT EXISTS idx_billing_events_org_id 
-- ON billing_events(organization_id);

-- CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_idempotency 
-- ON billing_events(idempotency_key) 
-- WHERE idempotency_key IS NOT NULL;

-- =============================
-- Messages/Comments Indexes
-- =============================

-- Index for project messages
CREATE INDEX IF NOT EXISTS idx_messages_project_id 
ON messages(project_id, created_at DESC) 
WHERE project_id IS NOT NULL;

-- Index for task messages
CREATE INDEX IF NOT EXISTS idx_messages_task_id 
ON messages(task_id, created_at DESC) 
WHERE task_id IS NOT NULL;

-- Index for user's messages
CREATE INDEX IF NOT EXISTS idx_messages_user_id 
ON messages(user_id, created_at DESC);

-- =============================
-- Notifications Indexes
-- =============================

-- Index for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id, created_at DESC);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- =============================
-- City Approvals Indexes
-- =============================

-- Index for project approvals
CREATE INDEX IF NOT EXISTS idx_city_approvals_project_id 
ON city_approvals(project_id, submission_date DESC);

-- Index for approval status
CREATE INDEX IF NOT EXISTS idx_city_approvals_status 
ON city_approvals(project_id, status, submission_date DESC);

-- =============================
-- Full-Text Search Indexes (PostgreSQL)
-- =============================

-- Create full-text search index for projects
CREATE INDEX IF NOT EXISTS idx_projects_search 
ON projects 
USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Create full-text search index for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_search 
ON tasks 
USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Create full-text search index for documents
CREATE INDEX IF NOT EXISTS idx_documents_search 
ON documents 
USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- =============================
-- Analyze Tables
-- =============================
-- Update statistics for query planner

ANALYZE projects;
ANALYZE tasks;
ANALYZE documents;
ANALYZE members;
ANALYZE organizations;
ANALYZE organization_entitlements;
ANALYZE billing_events;
ANALYZE messages;
ANALYZE notifications;
ANALYZE city_approvals;

-- =============================
-- Verify Indexes
-- =============================
-- Run this query to see all indexes:
-- SELECT tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;


