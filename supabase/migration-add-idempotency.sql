-- Migration: Add idempotency support for Stripe webhooks
-- Run this in your Supabase SQL Editor after the main schema

-- Add idempotency_key column to billing_events table
-- This prevents processing the same webhook event multiple times
ALTER TABLE billing_events 
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

-- Create unique index on idempotency_key to enforce uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_idempotency 
ON billing_events(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Add index on event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_events_event_id 
ON billing_events(event_id);

-- Add index on organization_id for faster queries
CREATE INDEX IF NOT EXISTS idx_billing_events_org_id 
ON billing_events(organization_id);

-- Add processed_at timestamp
ALTER TABLE billing_events 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to set processed_at from created_at
UPDATE billing_events 
SET processed_at = created_at 
WHERE processed = true AND processed_at IS NULL;

-- Add comment explaining the idempotency system
COMMENT ON COLUMN billing_events.idempotency_key IS 
'Unique key to prevent duplicate processing of webhook events. Format: event_id';

COMMENT ON COLUMN billing_events.processed_at IS 
'Timestamp when the event was successfully processed';


