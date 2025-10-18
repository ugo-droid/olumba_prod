# Optimization Implementation Plan

**Based on User Answers - October 18, 2025**

## ✅ Confirmed Architecture Decisions

### Database & Storage
- ✅ **Supabase Only** - Remove all SQLite code
- ✅ **Supabase Storage** - Start with Supabase, design for S3 migration
- ✅ **Storage Limits**: Starter (20GB), Pro (100GB), Studio (2TB)

### Authentication & Multi-tenancy
- ✅ **Clerk Organizations** - Use Clerk's built-in org feature
- ✅ **Complete Isolation** - Each company totally separate
- ✅ **Consultants**: Cross-company, not billed, must register

### Payments
- ✅ **Stripe Price IDs** - Real IDs available
- ✅ **Remove Lifetime** - Monthly/Annual only + Add-ons
- ✅ **Storage Location** - Environment variables (easier to manage)

### Email
- ✅ **Verified Senders**:
  - `team@olumba.app` (general)
  - `no-reply@olumba.app` (system)
  - `support@olumba.app` (customer service)
  - `newsletter@olumba.app` (marketing)

### Scale Requirements
- ✅ **High concurrency** expected (real-time chat/notifications)
- ✅ **5-15 projects per company**
- ✅ **Tens of thousands → millions of documents/month**
- ❓ **Server directory** - Need to clarify Vercel vs local

## 🔧 Implementation Order

### Step 1: Remove SQLite (CRITICAL)
- [ ] Delete `/server/database/db.js`
- [ ] Delete `/server/database/schema.sql`
- [ ] Delete `/data/olumba.db`
- [ ] Remove all SQLite imports
- [ ] Update seed scripts to use Supabase

### Step 2: Clean Dependencies
```bash
npm uninstall bcryptjs jsonwebtoken speakeasy qrcode nodemailer multer sql.js express-validator
```

### Step 3: Fix Environment Variables
- [ ] Change `SUPABASE_SERVICE_ROLE` → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Update all references

### Step 4: Stripe Improvements
- [ ] Update API version to `2025-02-24.acacia`
- [ ] Add idempotency key handling
- [ ] Remove lifetime payment logic
- [ ] Store Price IDs in environment

### Step 5: Email Service Updates
- [ ] Update sender addresses
- [ ] Implement sender selection by email type

### Step 6: Storage Abstraction
```typescript
// Create storage interface for future S3 migration
interface StorageProvider {
  upload(file: File, path: string): Promise<string>;
  download(path: string): Promise<Blob>;
  delete(path: string): Promise<void>;
}
```

### Step 7: Clerk Organizations Integration
- [ ] Map Clerk org_id to Supabase company_id
- [ ] Update RLS policies for org-based isolation
- [ ] Consultant workflow implementation

### Step 8: Authentication Cleanup
- [ ] Remove `simple-auth.js`
- [ ] Remove legacy token logic
- [ ] Remove `server/middleware/auth.js`

---

## 🎯 Files to Delete

### Database (SQLite)
- `/server/database/db.js`
- `/server/database/schema.sql`
- `/data/olumba.db`

### Authentication (Legacy)
- `/public/js/simple-auth.js`
- `/public/js/simple-nav.js`
- `/server/middleware/auth.js`

### Documentation (Redundant)
- Multiple MD files to consolidate later

---

## 📝 Files to Modify

### Critical Changes
1. `package.json` - Remove 8 dependencies
2. `lib/supabaseAdmin.ts` - Fix env var name
3. `lib/stripe.ts` - Update API version
4. `api/stripe-webhook.ts` - Add idempotency
5. `server/services/resendEmailService.js` - Update senders
6. `public/js/auth.js` - Remove legacy token logic

### New Files to Create
1. `lib/storage.ts` - Storage abstraction layer
2. `lib/clerkOrganizations.ts` - Clerk-Supabase mapping
3. `supabase/migration-add-idempotency.sql` - Idempotency column

---

## ⚠️ Server Directory Clarification Needed

**Question**: You have both:
- `/api` directory (Vercel serverless functions)
- `/server` directory (Express server)

**Need to know**:
- Is `/server` for local development only?
- Or are you deploying it separately?
- Should we remove it and use only `/api`?

**Recommendation**: 
For Vercel serverless, use only `/api` directory. Delete `/server` entirely or move to separate repo if needed for local dev.

---

*Ready to proceed with implementation*

