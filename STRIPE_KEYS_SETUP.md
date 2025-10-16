# 🔑 Stripe Keys Setup - Quick Reference

## ✅ Already Added

Your Stripe **Publishable Key** has been added to `.env.local`:
```
STRIPE_PUBLISHABLE_KEY=pk_live_51PaLfLET...
```

---

## ⚠️ Still Needed

### 1. Stripe Secret Key (CRITICAL)

**Where to find it:**
1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. In the "Standard keys" section, reveal your **Secret key**
3. It starts with `sk_live_...`

**Add to `.env.local`:**
```bash
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET_KEY
```

⚠️ **IMPORTANT**: Never share this key or commit it to git!

---

### 2. Stripe Price IDs (Required for Billing)

You need to create 8 products/prices in Stripe:

**Where to create:**
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click "+ Add product" for each plan below

**Create these products:**

#### Starter Plan
- **Name**: "Starter Plan"
- **Description**: "Up to 3 internal members, 50 GB storage"
- **Recurring**: 
  - Monthly: $99/month → Copy Price ID to `PRICE_STARTER_MONTHLY`
  - Annual: $948/year → Copy Price ID to `PRICE_STARTER_ANNUAL`

#### Pro Plan
- **Name**: "Pro Plan"
- **Description**: "Up to 10 internal members, 250 GB storage"
- **Recurring**: 
  - Monthly: $249/month → Copy Price ID to `PRICE_PRO_MONTHLY`
  - Annual: $2,388/year → Copy Price ID to `PRICE_PRO_ANNUAL`

#### Studio Plan
- **Name**: "Studio Plan"
- **Description**: "Up to 25 internal members, 750 GB storage"
- **Recurring**: 
  - Monthly: $499/month → Copy Price ID to `PRICE_STUDIO_MONTHLY`
  - Annual: $4,788/year → Copy Price ID to `PRICE_STUDIO_ANNUAL`

#### Add-on: City Integrations
- **Name**: "City Integration"
- **Description**: "Access to one city integration"
- **Recurring**: $50/month → Copy Price ID to `PRICE_CITY_INTEGRATIONS`

#### Add-on: Extra Storage
- **Name**: "Extra Storage Block (100 GB)"
- **Description**: "Additional 100 GB of storage"
- **Recurring**: $25/month → Copy Price ID to `PRICE_EXTRA_STORAGE_BLOCK`

**Add all Price IDs to `.env.local`**

---

### 3. Stripe Webhook Secret (After Deployment)

**When to set up**: After deploying to Vercel

**Steps:**
1. Deploy to Vercel: `vercel --prod`
2. Note your deployment URL (e.g., `https://olumba.vercel.app`)
3. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
4. Click "+ Add endpoint"
5. Enter URL: `https://YOUR_DOMAIN/api/stripe-webhook`
6. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
7. Click "Add endpoint"
8. Reveal the **Signing secret** (starts with `whsec_...`)
9. Copy to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

---

### 4. Supabase Keys

**Where to find:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**

**Copy these values:**
```bash
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # anon/public key
SUPABASE_SERVICE_ROLE=eyJhbGc...  # service_role key (NEVER expose to client!)
```

---

### 5. Clerk Keys

**Where to find:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys**

**Copy these values:**
```bash
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  # Same as above
```

---

### 6. Application URLs

**Update with your actual domain:**
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUCCESS_URL=https://yourdomain.com/billing/success
NEXT_PUBLIC_CANCEL_URL=https://yourdomain.com/billing/cancel
NEXT_PUBLIC_PORTAL_RETURN_URL=https://yourdomain.com/settings/billing
```

---

## 📋 Quick Checklist

- [x] Stripe Publishable Key (already added)
- [ ] Stripe Secret Key
- [ ] 8 Stripe Price IDs (3 plans × 2 periods + 2 add-ons)
- [ ] Stripe Webhook Secret (after deployment)
- [ ] Supabase URL
- [ ] Supabase Anon Key
- [ ] Supabase Service Role Key
- [ ] Clerk Publishable Key
- [ ] Clerk Secret Key
- [ ] Application URLs (your domain)

---

## 🚀 After Adding All Keys

### For Local Development:
```bash
npm install
npm run dev
```

### For Production (Vercel):
```bash
# Add all env vars to Vercel
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
# ... repeat for all keys

# Or use the Vercel Dashboard:
# Project → Settings → Environment Variables

# Deploy
vercel --prod
```

---

## 🔐 Security Notes

✅ `.env.local` is in `.gitignore` - it will NOT be committed  
✅ Publishable keys (pk_live_...) are safe to expose  
⚠️ Secret keys (sk_live_...) must NEVER be exposed to client-side code  
⚠️ Service role keys should ONLY be used server-side  

---

## 📖 Next Steps

Once all keys are added:
1. Read: [START_WITH_BILLING.md](START_WITH_BILLING.md)
2. Deploy: [BILLING_RUNBOOK.md](BILLING_RUNBOOK.md)
3. Test: [BILLING_TESTING.md](BILLING_TESTING.md)

---

**Need help?** See [BILLING_RUNBOOK.md](BILLING_RUNBOOK.md) for detailed setup instructions.

