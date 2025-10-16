# Billing System Runbook

Complete deployment and operation guide for the Olumba billing system.

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Stripe Configuration](#stripe-configuration)
3. [Supabase Setup](#supabase-setup)
4. [Vercel Deployment](#vercel-deployment)
5. [Local Development](#local-development)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### Prerequisites

- Node.js 18+ installed
- Stripe account (test mode for development)
- Supabase account with project created
- Vercel account
- Clerk account with application configured

### Clone and Install

```bash
cd /path/to/olumba_prod
npm install

# Install required dependencies
npm install stripe @supabase/supabase-js zod
npm install -D @vercel/node typescript @types/node
```

---

## Stripe Configuration

### Step 1: Create Products & Prices

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create the following products:

#### Starter Plan
- Name: "Starter Plan"
- Description: "Up to 3 internal members, 50 GB storage"
- Create 2 prices:
  - Monthly: `$99/month` (save the Price ID as `PRICE_STARTER_MONTHLY`)
  - Annual: `$948/year` (save as `PRICE_STARTER_ANNUAL`)

#### Pro Plan
- Name: "Pro Plan"
- Description: "Up to 10 internal members, 250 GB storage"
- Create 2 prices:
  - Monthly: `$249/month` (save as `PRICE_PRO_MONTHLY`)
  - Annual: `$2,388/year` (save as `PRICE_PRO_ANNUAL`)

#### Studio Plan
- Name: "Studio Plan"
- Description: "Up to 25 internal members, 750 GB storage"
- Create 2 prices:
  - Monthly: `$499/month` (save as `PRICE_STUDIO_MONTHLY`)
  - Annual: `$4,788/year` (save as `PRICE_STUDIO_ANNUAL`)

#### Add-ons
- **City Integration**
  - Name: "City Integration"
  - Price: `$50/month` per integration
  - Save as `PRICE_CITY_INTEGRATIONS`

- **Extra Storage Block**
  - Name: "Extra Storage Block (100 GB)"
  - Price: `$25/month` per block
  - Save as `PRICE_EXTRA_STORAGE_BLOCK`

### Step 2: Get API Keys

1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Configure Customer Portal

1. Go to [Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
2. Enable:
   - ✅ Update subscriptions
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoice history
3. Set business information and branding
4. Save configuration

---

## Supabase Setup

### Step 1: Run Schema

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy entire contents of `supabase/billing-schema.sql`
5. Click **Run**
6. Verify tables created in **Table Editor**

### Step 2: Run RLS Policies

1. In **SQL Editor**, create new query
2. Copy entire contents of `supabase/billing-policies.sql`
3. Click **Run**
4. Verify RLS enabled in **Table Editor** → Select table → **RLS** tab

### Step 3: Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **anon/public key** (for client-side)
   - **service_role key** (for server-side, NEVER expose to client)

### Step 4: Test Database

Run test query:

```sql
-- Insert test organization
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Organization')
RETURNING *;

-- Verify created
SELECT * FROM organizations WHERE name = 'Test Organization';
```

---

## Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### Step 2: Link Project

```bash
cd /path/to/olumba_prod
vercel link
# Follow prompts to link to existing project or create new one
```

### Step 3: Configure Environment Variables

```bash
# Copy template
cp env.billing.template .env.local

# Edit .env.local with your actual values
nano .env.local
```

Paste all the keys collected from Stripe, Supabase, and Clerk.

### Step 4: Add Environment Variables to Vercel

Two options:

#### Option A: Via Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from `.env.local`
5. Select environments: **Production**, **Preview**, **Development**

#### Option B: Via CLI
```bash
# Add each variable
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE
vercel env add CLERK_SECRET_KEY
# ... etc
```

### Step 5: Deploy to Preview

```bash
vercel
```

This creates a preview deployment. Copy the URL (e.g., `https://olumba-prod-abc123.vercel.app`)

---

## Stripe Webhook Configuration

### Development (Local)

```bash
# Terminal 1: Run local server
npm run dev
# OR
vercel dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Copy the webhook signing secret (`whsec_xxx`) and add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Production

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter URL: `https://YOUR_DOMAIN/api/stripe-webhook`
4. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_xxx`)
7. Add to Vercel environment variables:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production
   # Paste the whsec_xxx value
   ```
8. Redeploy: `vercel --prod`

---

## Local Development

### Start Development Server

```bash
# Install dependencies
npm install

# Copy environment template
cp env.billing.template .env.local
# Edit .env.local with your test keys

# Start development server
npm run dev
# OR with Vercel
vercel dev
```

### Test Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Create checkout (replace IDs with your test values)
curl -X POST http://localhost:3000/api/billing-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "test-org",
    "priceId": "price_xxx",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel"
  }'
```

### View Logs

```bash
# Vercel logs
vercel logs

# Or watch server output in terminal
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Supabase schema and policies deployed
- [ ] Stripe products and prices created
- [ ] Stripe webhook endpoint configured
- [ ] Clerk production keys configured
- [ ] Test mode end-to-end tested

### Deploy to Production

```bash
# Deploy to production
vercel --prod

# Verify deployment
curl https://YOUR_DOMAIN/api/health
```

### Post-Deployment Verification

1. **Test Checkout Flow**
   - Visit pricing page
   - Click "Get Started"
   - Complete test checkout
   - Verify webhook processed
   - Check Supabase for org/entitlements

2. **Test Customer Portal**
   - Create subscription
   - Open portal
   - Change plan
   - Verify webhook updates entitlements

3. **Test Add-ons**
   - Add city integration via portal
   - Verify entitlements updated

4. **Monitor Logs**
   ```bash
   vercel logs --follow
   ```

---

## Monitoring & Maintenance

### Webhook Monitoring

Check webhook delivery in [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)

- Green checkmarks = successful
- Red X = failed (click to see error and retry)

### Vercel Function Logs

```bash
# Real-time logs
vercel logs --follow

# Logs from production
vercel logs --prod

# Logs for specific function
vercel logs api/stripe-webhook.ts
```

### Supabase Monitoring

1. Go to **Supabase Dashboard** → **Database** → **Logs**
2. Monitor:
   - Query performance
   - RLS policy violations
   - Connection count

### Check Billing Events

```sql
-- In Supabase SQL Editor
SELECT 
  event_id,
  event_type,
  organization_id,
  processed,
  created_at
FROM billing_events
ORDER BY created_at DESC
LIMIT 20;

-- Check for failed events
SELECT * FROM billing_events WHERE processed = false;
```

### Alerts Setup (Recommended)

1. **Vercel Integration**: Add Slack/Discord notifications
2. **Stripe Alerts**: Configure in Stripe Dashboard
3. **Supabase Alerts**: Set up via webhooks

---

## Troubleshooting

### Issue: "Missing environment variable"

**Symptom:** Error on function startup
**Solution:**
```bash
# Verify all env vars set
vercel env ls

# Add missing var
vercel env add VAR_NAME production
```

### Issue: "Webhook signature verification failed"

**Symptom:** 400 error from webhook endpoint
**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
2. Check webhook endpoint URL is correct
3. Ensure raw body parsing (configured in `vercel.json`)

### Issue: Entitlements not updating

**Symptom:** Subscription created but no entitlements in Supabase
**Solution:**
1. Check webhook logs in Stripe Dashboard
2. Verify `org_id` in subscription metadata
3. Check Supabase service role key is correct
4. Look for errors in Vercel function logs

### Issue: RLS policy blocking operations

**Symptom:** "permission denied" errors
**Solution:**
1. Verify Clerk JWT includes `sub` claim
2. Check user exists in `members` table with correct role
3. Test policies in SQL editor:
   ```sql
   SELECT set_config('request.jwt.claims', '{"sub": "user_xxx"}', true);
   SELECT * FROM projects; -- Should return projects for user's org
   ```

### Issue: "Cannot create project" for external user

**Symptom:** External collaborator blocked from creating projects
**Solution:** This is expected behavior! External users cannot create projects. Upgrade user role to 'member' or higher.

### Issue: Member limit not enforcing

**Symptom:** Can add more members than allowed
**Solution:**
1. Check `check_member_limit()` trigger is active:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'enforce_member_limit';
   ```
2. Re-run `supabase/billing-policies.sql` if missing

---

## Backup & Recovery

### Database Backups

Supabase automatically backs up database. To create manual backup:

```bash
# Export schema
pg_dump -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres --schema-only > schema-backup.sql

# Export data
pg_dump -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres --data-only > data-backup.sql
```

### Stripe Data Recovery

Stripe retains all data. To export:
1. Dashboard → **Developers** → **Events**
2. Use Stripe API to fetch historical data if needed

---

## Scaling Considerations

### High Traffic

1. **Vercel**: Automatically scales serverless functions
2. **Supabase**: Upgrade to Pro plan for connection pooling
3. **Stripe**: No limits on API calls

### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_projects_status_created 
  ON projects(status, created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM projects WHERE organization_id = 'xxx';
```

---

## Security Best Practices

- ✅ Never commit `.env.local` to git
- ✅ Use service role key only server-side
- ✅ Verify webhook signatures
- ✅ Enable RLS on all tables
- ✅ Rotate Stripe keys annually
- ✅ Monitor webhook deliveries
- ✅ Log all billing events
- ✅ Review RLS policies quarterly

---

## Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Clerk Support**: https://clerk.com/support

---

## Changelog

- **2025-10-12**: Initial billing system deployment
- **TODO**: Add idempotency keys
- **TODO**: Implement retry logic for webhook failures
- **TODO**: Add email notifications for payment failures
- **TODO**: Set up monitoring dashboards

---

## Quick Reference

### Essential URLs

- Pricing Page: `/components/PricingCard.html`
- Health Check: `/api/health`
- Webhook Endpoint: `/api/stripe-webhook`

### Essential Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Run SQL migrations
# Copy/paste in Supabase SQL Editor

# Check environment variables
vercel env ls
```

### Price IDs Reference

| Plan | Monthly | Annual |
|------|---------|--------|
| Starter | `PRICE_STARTER_MONTHLY` | `PRICE_STARTER_ANNUAL` |
| Pro | `PRICE_PRO_MONTHLY` | `PRICE_PRO_ANNUAL` |
| Studio | `PRICE_STUDIO_MONTHLY` | `PRICE_STUDIO_ANNUAL` |

| Add-on | Price ID |
|--------|----------|
| City Integration | `PRICE_CITY_INTEGRATIONS` |
| Extra Storage | `PRICE_EXTRA_STORAGE_BLOCK` |

---

**Need help?** Check the [Testing Guide](BILLING_TESTING.md) for detailed test scenarios.

