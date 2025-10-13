# Billing System Testing Guide

## Prerequisites

1. **Stripe CLI** installed
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   ```

2. **Environment Variables** configured (see `env.billing.template`)

3. **Local Development Server** running
   ```bash
   npm run dev
   # OR for Vercel local testing
   vercel dev
   ```

---

## Test 1: Health Check

Verify the API is running:

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "ok": true,
  "timestamp": "2025-10-12T...",
  "service": "olumba-billing"
}
```

---

## Test 2: Checkout Session Creation

Create a test checkout session:

```bash
curl -X POST http://localhost:3000/api/billing-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "test-org-123",
    "priceId": "price_pro_annual_XXXX",
    "successUrl": "http://localhost:3000/billing/success",
    "cancelUrl": "http://localhost:3000/billing/cancel"
  }'
```

**Expected Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Manual Test:**
1. Open the returned URL in a browser
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete checkout
4. Verify redirect to success URL

---

## Test 3: Webhook Event Processing

### Setup Webhook Forwarding

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

This will output a webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_xxx
```

Update your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Restart your dev server.

### Test Checkout Completed Event

1. Create a checkout session (Test 2)
2. Complete the checkout with test card
3. Watch the Stripe CLI output and server logs

**Expected Logs:**
```
Processing webhook event: checkout.session.completed (evt_xxx)
Checkout completed for org test-org-123, customer cus_xxx
Updated existing addon item si_xxx
```

### Test Subscription Events

Trigger test events manually:

```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test subscription updated
stripe trigger customer.subscription.updated

# Test payment failed
stripe trigger invoice.payment_failed

# Test payment succeeded
stripe trigger invoice.payment_succeeded
```

### Verify Database Updates

After each webhook:

1. Check Supabase → Table Editor → `organizations`
   - `stripe_customer_id` should be set
   - `stripe_subscription_id` should be set
   - `billing_status` should be 'active'

2. Check `organization_entitlements`
   - `tier` should match the selected plan
   - `max_internal_members` should be set correctly
   - `base_storage_gb` should be set correctly

3. Check `billing_events`
   - Event should be logged with `processed: true`

---

## Test 4: Customer Portal

```bash
curl -X POST http://localhost:3000/api/billing-portal \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_test_xxx",
    "returnUrl": "http://localhost:3000/settings/billing"
  }'
```

**Expected Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**Manual Test:**
1. Open the portal URL
2. Try changing plan (upgrade/downgrade)
3. Verify webhook fires `customer.subscription.updated`
4. Check entitlements updated in Supabase

---

## Test 5: Add-ons

```bash
curl -X POST http://localhost:3000/api/billing-addon \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_test_xxx",
    "priceId": "price_city_integration_XXXX",
    "quantity": 2
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_test_xxx",
    "items": [...]
  }
}
```

**Verify:**
1. Webhook fires `customer.subscription.updated`
2. Entitlements updated with `city_integrations: 2`

---

## Test 6: Payment Failure Handling

```bash
# Trigger payment failure
stripe trigger invoice.payment_failed
```

**Expected Behavior:**
1. Webhook processes event
2. Organization `billing_status` → `past_due`
3. TODO: Email notification sent to admins

---

## Test 7: Subscription Cancellation

In Stripe Dashboard or via CLI:

```bash
stripe subscriptions cancel sub_test_xxx
```

**Expected Behavior:**
1. Webhook fires `customer.subscription.deleted`
2. Organization `billing_status` → `canceled`
3. Entitlements reset to zero/free tier

---

## Test 8: RLS Policy Testing

### Test as Internal Member

```sql
-- In Supabase SQL Editor
-- Set JWT claims (simulate Clerk auth)
SELECT set_config('request.jwt.claims', '{"sub": "user_test_internal"}', true);

-- Try to create a project (should succeed)
INSERT INTO projects (organization_id, name, created_by_user_id)
VALUES ('org-uuid-here', 'Test Project', 'user_test_internal');
```

### Test as External Collaborator

```sql
-- Set JWT claims for external user
SELECT set_config('request.jwt.claims', '{"sub": "user_test_external"}', true);

-- Try to create a project (should fail)
INSERT INTO projects (organization_id, name, created_by_user_id)
VALUES ('org-uuid-here', 'Test Project', 'user_test_external');
-- Expected: ERROR - RLS policy violation
```

---

## Test 9: Member Limit Enforcement

1. Set entitlement `max_internal_members: 3`
2. Add 3 internal members
3. Try to add 4th internal member

**Expected:**
```
ERROR: Internal member limit reached. Please upgrade your plan.
```

---

## Test 10: Frontend Integration

### Test Pricing Page

1. Open `http://localhost:3000/components/PricingCard.html`
2. Toggle Annual/Monthly - verify prices update
3. Click "Get Started" - verify checkout session created
4. Complete checkout - verify redirect

### Test Billing Guards

```javascript
// In browser console
import { canCreateProject } from '/js/billing.js';

// Should return true
canCreateProject('member');

// Should return false
canCreateProject('external');
```

---

## Common Issues & Solutions

### Issue: Webhook signature verification failed
**Solution:** Ensure `STRIPE_WEBHOOK_SECRET` matches the CLI output or Dashboard endpoint secret

### Issue: 400 Bad Request on webhook
**Solution:** Verify `vercel.json` has raw body config for webhook endpoint

### Issue: Entitlements not updating
**Solution:** Check:
1. Subscription has `org_id` in metadata
2. Price IDs match those in `lib/entitlements.ts`
3. Supabase Service Role key is correct

### Issue: RLS policy blocking operations
**Solution:** 
1. Verify Clerk JWT includes `sub` claim
2. Check user exists in `members` table
3. Verify role is correct

---

## Automated Test Suite (TODO)

Create `tests/billing.test.ts`:

```typescript
// TODO: Implement with Jest or Vitest
describe('Billing API', () => {
  test('creates checkout session', async () => {
    // ...
  });

  test('processes webhook events', async () => {
    // ...
  });

  test('enforces member limits', async () => {
    // ...
  });
});
```

---

## Load Testing (Production)

```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 https://yourdomain.com/api/health
```

Monitor Vercel function logs for errors and performance.

---

## Security Checklist

- [ ] Webhook signature verification enabled
- [ ] Environment variables never logged
- [ ] RLS policies tested for all roles
- [ ] Service role key never exposed to client
- [ ] CORS configured appropriately
- [ ] Rate limiting configured (Vercel Edge Config)
- [ ] Idempotency keys implemented (TODO)

---

## Next Steps

1. ✅ Run all tests above
2. ✅ Fix any failing tests
3. ✅ Deploy to Vercel staging environment
4. ✅ Test with Stripe test mode
5. ✅ Switch to Stripe live mode for production
6. ✅ Set up monitoring (Sentry, LogRocket, etc.)
7. ✅ Configure alerts for webhook failures

