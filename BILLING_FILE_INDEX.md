# Billing System - Complete File Index

## 📦 New Files Created

### API Routes (Vercel Serverless Functions)
| File | Lines | Purpose |
|------|-------|---------|
| `api/billing-checkout.ts` | ~100 | Create Stripe Checkout sessions with validation |
| `api/billing-portal.ts` | ~60 | Open Customer Portal for self-service management |
| `api/billing-addon.ts` | ~90 | Add/update subscription add-ons with proration |
| `api/billing-usage.ts` | ~80 | Report metered usage (optional, for storage) |
| `api/stripe-webhook.ts` | ~400 | **Core**: Process webhooks & update entitlements |
| `api/health.ts` | ~10 | Health check endpoint |

**Total**: ~740 lines

---

### Library Files
| File | Lines | Purpose |
|------|-------|---------|
| `lib/stripe.ts` | ~40 | Stripe client, price IDs, config validation |
| `lib/supabaseAdmin.ts` | ~70 | Supabase admin client, TypeScript interfaces |
| `lib/entitlements.ts` | ~150 | **Core**: Entitlement calculation logic |
| `lib/billingClient.ts` | ~200 | TypeScript client SDK for frontend use |

**Total**: ~460 lines

---

### Database Files
| File | Lines | Purpose |
|------|-------|---------|
| `supabase/billing-schema.sql` | ~270 | **Core**: Tables, indexes, triggers, functions |
| `supabase/billing-policies.sql` | ~250 | **Core**: RLS policies, security, grants |

**Total**: ~520 lines

---

### UI Components
| File | Lines | Purpose |
|------|-------|---------|
| `components/PricingCard.tsx` | ~450 | React/TypeScript pricing component |
| `public/components/PricingCard.html` | ~380 | Standalone HTML pricing page |
| `public/js/billing.js` | ~120 | Vanilla JavaScript billing utilities |

**Total**: ~950 lines

---

### Configuration Files
| File | Lines | Purpose |
|------|-------|---------|
| `vercel.json` | ~40 | Vercel serverless config, raw body handling |
| `tsconfig.json` | ~20 | TypeScript configuration |
| `env.billing.template` | ~60 | Environment variable template |
| `package.json` | Updated | Added stripe, zod, @vercel/node dependencies |

**Total**: ~120 lines

---

### Documentation
| File | Lines | Purpose |
|------|-------|---------|
| `BILLING_IMPLEMENTATION_SUMMARY.md` | ~600 | Complete overview & architecture |
| `BILLING_RUNBOOK.md` | ~800 | Deployment & operations guide |
| `BILLING_TESTING.md` | ~500 | Testing scenarios & commands |
| `BILLING_FILE_INDEX.md` | ~300 | This file - complete inventory |

**Total**: ~2,200 lines

---

## 📊 Grand Total

- **Code Files**: 16 new + 1 updated
- **Total Lines of Code**: ~2,790 lines
- **Documentation**: ~2,200 lines
- **Combined Total**: ~4,990 lines

---

## 🎯 Core Files You Must Understand

### 1. `api/stripe-webhook.ts` (Priority: CRITICAL)
**Why**: Processes all Stripe events and updates entitlements
**Key Functions**:
- `processWebhookEvent()` - Routes events to handlers
- `handleSubscriptionChanged()` - Updates org & entitlements
- `updateEntitlements()` - Upserts entitlements in Supabase
- `constructEvent()` - Verifies webhook signature

**Dependencies**: stripe, supabaseAdmin, entitlements

### 2. `lib/entitlements.ts` (Priority: CRITICAL)
**Why**: Business logic for feature limits
**Key Functions**:
- `deriveEntitlements()` - Calculates from subscription
- `BASE_ENTITLEMENTS` - Tier definitions
- `getAddonEffect()` - Add-on calculation

**Change This When**: Adding new plans or add-ons

### 3. `supabase/billing-schema.sql` (Priority: CRITICAL)
**Why**: Database structure
**Key Tables**:
- `organizations` - Main org data
- `organization_entitlements` - Feature limits
- `members` - User roles
- `projects` - Org-owned projects
- `billing_events` - Audit trail

**Change This When**: Adding new features requiring DB fields

### 4. `supabase/billing-policies.sql` (Priority: CRITICAL)
**Why**: Security & access control
**Key Policies**:
- Members can read their org
- Only internal members can create projects
- Admins can manage members
- Service role bypasses RLS

**Change This When**: Modifying permission model

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│   User Clicks   │
│  "Get Started"  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ POST /api/billing-      │
│ checkout                │
│ (billing-checkout.ts)   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Stripe Checkout        │
│  Session Created        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  User Completes         │
│  Payment on Stripe      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Stripe Sends Webhook   │
│  to /api/stripe-webhook │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  stripe-webhook.ts      │
│  - Verify signature     │
│  - Log to billing_events│
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  entitlements.ts        │
│  deriveEntitlements()   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Supabase Update        │
│  - organizations        │
│  - org_entitlements     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  RLS Policies Apply     │
│  - User can now create  │
│    X projects           │
│  - Storage limit is Y   │
└─────────────────────────┘
```

---

## 📝 Quick Reference: Placeholder Values

Replace these before deploying:

### Stripe Price IDs
```typescript
// In lib/stripe.ts and env.billing.template
PRICE_STARTER_MONTHLY=price_starter_monthly_XXXX
PRICE_STARTER_ANNUAL=price_starter_annual_XXXX
PRICE_PRO_MONTHLY=price_pro_monthly_XXXX
PRICE_PRO_ANNUAL=price_pro_annual_XXXX
PRICE_STUDIO_MONTHLY=price_studio_monthly_XXXX
PRICE_STUDIO_ANNUAL=price_studio_annual_XXXX
PRICE_CITY_INTEGRATIONS=price_city_integration_XXXX
PRICE_EXTRA_STORAGE_BLOCK=price_extra_storage_block_XXXX
```

### Environment Variables
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE=eyJxxx

# Clerk
CLERK_SECRET_KEY=sk_live_xxx

# URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🚀 Deployment Steps (Quick Version)

### 1. Stripe Setup (15 min)
- Create 6 products (3 plans × 2 billing periods)
- Create 2 add-on products
- Copy 8 Price IDs
- Get API keys

### 2. Supabase Setup (10 min)
- Run `billing-schema.sql`
- Run `billing-policies.sql`
- Verify tables created
- Copy service role key

### 3. Vercel Setup (10 min)
```bash
npm install
cp env.billing.template .env.local
# Fill in .env.local
vercel --prod
```

### 4. Stripe Webhook (5 min)
- Create endpoint: `https://YOUR_DOMAIN/api/stripe-webhook`
- Select 6 events
- Copy signing secret
- Add to Vercel env vars
- Redeploy

### 5. Test (15 min)
```bash
# Health check
curl https://YOUR_DOMAIN/api/health

# Test checkout with Stripe CLI
stripe listen --forward-to YOUR_DOMAIN/api/stripe-webhook

# Complete test checkout
# Verify Supabase updated
```

**Total Time**: ~55 minutes

---

## 🔧 Customization Points

### Change Plan Features
**File**: `lib/entitlements.ts`
**Line**: 8-48 (BASE_ENTITLEMENTS)
```typescript
[PRICE_IDS.PRO_MONTHLY]: {
  tier: 'pro',
  max_internal_members: 10,  // ← Change this
  base_storage_gb: 250,       // ← Change this
  // ...
}
```

### Add New Add-on
**Files**: 
1. `lib/stripe.ts` - Add price ID constant
2. `lib/entitlements.ts` - Add to `getAddonEffect()`
3. Create product in Stripe Dashboard

### Change Pricing Display
**Files**:
- `components/PricingCard.tsx` (React)
- `public/components/PricingCard.html` (HTML)

Update the `pricing` object with new prices.

### Add New Role
**Files**:
1. `supabase/billing-schema.sql` - Update members table check constraint
2. `supabase/billing-policies.sql` - Add policies for new role
3. `lib/supabaseAdmin.ts` - Update Member type

---

## 🐛 Common Issues & Fixes

| Issue | File to Check | Fix |
|-------|---------------|-----|
| Webhook fails signature verification | `api/stripe-webhook.ts` | Verify `STRIPE_WEBHOOK_SECRET` matches Dashboard |
| Entitlements not updating | `lib/entitlements.ts` | Check Price IDs match Stripe |
| RLS blocking queries | `supabase/billing-policies.sql` | Verify JWT includes `sub` claim |
| Cannot create projects | `supabase/billing-policies.sql` | Check user role is internal, not external |
| Member limit not enforcing | `supabase/billing-policies.sql` | Verify `check_member_limit()` trigger exists |

---

## 📚 Related Documentation

- **Architecture**: [BILLING_IMPLEMENTATION_SUMMARY.md](BILLING_IMPLEMENTATION_SUMMARY.md)
- **Deployment**: [BILLING_RUNBOOK.md](BILLING_RUNBOOK.md)
- **Testing**: [BILLING_TESTING.md](BILLING_TESTING.md)
- **This File**: Complete file inventory

---

## 🎓 Code Organization Principles

### API Routes (`api/`)
- One route per endpoint
- Zod validation on all inputs
- Error handling with proper status codes
- Logging for debugging

### Library Files (`lib/`)
- Reusable business logic
- No side effects (pure functions where possible)
- TypeScript interfaces for type safety
- Environment variable validation

### Database (`supabase/`)
- Idempotent migrations
- Comprehensive RLS policies
- Indexes on foreign keys
- Helper functions for common queries

### UI Components
- Vanilla JS for maximum compatibility
- React version for modern apps
- Styled components (no external CSS dependencies)
- Error handling and loading states

---

## ✅ Checklist: Before Going Live

### Code
- [ ] All placeholder Price IDs replaced
- [ ] Environment variables configured
- [ ] TypeScript compiles without errors
- [ ] No console.logs with sensitive data

### Stripe
- [ ] Products created in live mode
- [ ] Customer Portal configured
- [ ] Webhook endpoint added (live mode)
- [ ] Test payment flow end-to-end

### Supabase
- [ ] Schema deployed to production
- [ ] RLS policies tested
- [ ] Indexes created
- [ ] Backups configured

### Vercel
- [ ] Deployed to production
- [ ] Environment variables added
- [ ] Custom domain configured
- [ ] Function logs monitored

### Security
- [ ] No secrets in git
- [ ] RLS enabled on all tables
- [ ] Webhook signature verified
- [ ] CORS configured appropriately

### Monitoring
- [ ] Error tracking set up (Sentry)
- [ ] Logging configured
- [ ] Alerts for webhook failures
- [ ] Dashboard for key metrics

---

## 🎉 You're Done!

All billing system files are created and documented. Follow the deployment steps in [BILLING_RUNBOOK.md](BILLING_RUNBOOK.md) to go live!

**Questions?** Check the comprehensive guides:
1. [BILLING_IMPLEMENTATION_SUMMARY.md](BILLING_IMPLEMENTATION_SUMMARY.md) - Overview
2. [BILLING_RUNBOOK.md](BILLING_RUNBOOK.md) - Deployment
3. [BILLING_TESTING.md](BILLING_TESTING.md) - Testing

Good luck! 🚀

