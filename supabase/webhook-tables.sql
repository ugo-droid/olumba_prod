-- Clerk Webhook Integration Database Tables
-- Run this SQL in your Supabase SQL Editor

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    organization_id TEXT REFERENCES organizations(id),
    status TEXT NOT NULL,
    plan_id TEXT,
    plan_name TEXT,
    price_id TEXT,
    quantity INTEGER DEFAULT 1,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_attempts table
CREATE TABLE IF NOT EXISTS payment_attempts (
    id TEXT PRIMARY KEY,
    subscription_id TEXT REFERENCES subscriptions(id),
    user_id UUID REFERENCES users(id),
    organization_id TEXT REFERENCES organizations(id),
    status TEXT NOT NULL,
    amount BIGINT,
    currency TEXT,
    payment_method_id TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription_status column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_subscription_id ON payment_attempts(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Enable RLS (Row Level Security) on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
-- Note: Clerk organizations don't use auth.uid(), so we'll use a more permissive policy for now
CREATE POLICY "Users can view organizations" ON organizations
    FOR SELECT USING (true);

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Create RLS policies for payment_attempts
CREATE POLICY "Users can view their own payment attempts" ON payment_attempts
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Grant necessary permissions
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON payment_attempts TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE organizations IS 'Clerk organizations synchronized via webhooks';
COMMENT ON TABLE subscriptions IS 'User subscriptions and billing information';
COMMENT ON TABLE payment_attempts IS 'Payment attempts and transaction history from Clerk';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: active, past_due, inactive, etc.';
