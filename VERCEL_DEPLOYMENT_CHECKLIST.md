# Vercel Deployment Checklist for Olumba

## 🚀 Pre-Deployment Checklist

### ✅ Repository Ready
- [x] Code pushed to GitHub: `ugo-droid/olumba_prod`
- [x] All commits synchronized
- [x] Working tree clean
- [x] Production-ready code

### ✅ Environment Variables Prepared
- [x] RESEND_API_KEY configured
- [x] CLERK_SECRET_KEY ready
- [x] SUPABASE credentials available
- [x] All webhook secrets prepared

## 📋 Vercel Deployment Steps

### Step 1: Access Vercel Dashboard
- [ ] Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- [ ] Sign in with GitHub account
- [ ] Authorize GitHub repository access

### Step 2: Import Repository
- [ ] Click "New Project"
- [ ] Select "Import Git Repository"
- [ ] Find and select `ugo-droid/olumba_prod`
- [ ] Click "Import"

### Step 3: Configure Project Settings
- [ ] Project Name: `olumba`
- [ ] Framework Preset: `Other`
- [ ] Root Directory: `./`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `public`
- [ ] Install Command: `npm install`

### Step 4: Add Environment Variables
Add each variable with "Production" environment selected:

#### Application Configuration
- [ ] `NODE_ENV` = `production`
- [ ] `APP_URL` = `https://olumba.app`
- [ ] `ALLOWED_ORIGINS` = `https://olumba.app,https://www.olumba.app`

#### Supabase Configuration
- [ ] `SUPABASE_URL` = `https://mzxsugnnyydinywvwqxt.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `[your-service-role-key]`

#### Clerk Authentication
- [ ] `CLERK_SECRET_KEY` = `[your-clerk-secret-key]`
- [ ] `CLERK_PUBLISHABLE_KEY` = `[your-clerk-publishable-key]`
- [ ] `CLERK_WEBHOOK_SECRET` = `whsec_bhP9d/ho21QLIWeAN3SjkgYK1cBy9hBN`
- [ ] `CLERK_BILLING_WEBHOOK_SECRET` = `whsec_VHqzGGEUilg8XR43f/5b3M7kzT4Vl2MH`

#### Resend Email Service
- [ ] `RESEND_API_KEY` = `re_8duHTbw2_GV1dwgmtFNYKa3U3MdvDX1k3`
- [ ] `EMAIL_FROM` = `hello@olumba.app`

### Step 5: Deploy
- [ ] Click "Deploy"
- [ ] Monitor build logs
- [ ] Wait for deployment completion (2-3 minutes)

### Step 6: Post-Deployment Verification
- [ ] Test health endpoint: `https://your-app.vercel.app/api/health`
- [ ] Test status endpoint: `https://your-app.vercel.app/api/status`
- [ ] Verify application loads correctly
- [ ] Check for any error logs in Vercel dashboard

## 🔧 Custom Domain Configuration (Optional)

### Step 7: Add Custom Domain
- [ ] Go to Project Settings → Domains
- [ ] Add domain: `olumba.app`
- [ ] Add domain: `www.olumba.app`
- [ ] Configure DNS records as instructed by Vercel
- [ ] Wait for domain verification (up to 24 hours)

### DNS Configuration
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 🧪 Testing Checklist

### API Endpoints
- [ ] Health check: `/api/health`
- [ ] Status check: `/api/status`
- [ ] Authentication endpoints working
- [ ] Database connections functional

### Application Features
- [ ] User registration/login
- [ ] Email notifications working
- [ ] Project management features
- [ ] Document upload/sharing
- [ ] Task management
- [ ] Communication hub

### Third-Party Integrations
- [ ] Clerk authentication working
- [ ] Supabase database connected
- [ ] Resend emails sending
- [ ] Webhooks receiving events

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check build logs in Vercel dashboard
   - Verify all dependencies in package.json
   - Ensure build command is correct

2. **Environment Variables Not Working**
   - Verify all variables are set in Vercel
   - Check variable names match exactly
   - Ensure "Production" environment is selected

3. **API Endpoints Not Responding**
   - Check server logs in Vercel dashboard
   - Verify environment variables are loaded
   - Test endpoints individually

4. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies in Supabase
   - Ensure database tables exist

### Debug Commands
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test status endpoint
curl https://your-app.vercel.app/api/status

# Check Vercel logs
vercel logs --follow
```

## 🎯 Success Criteria

### ✅ Deployment Successful When:
- [ ] Application loads without errors
- [ ] Health endpoint returns 200 OK
- [ ] Status endpoint shows all services operational
- [ ] User can register and login
- [ ] Email notifications are sent
- [ ] Database operations work correctly
- [ ] All API endpoints respond appropriately

## 📊 Post-Deployment Monitoring

### Daily Checks
- [ ] Monitor Vercel dashboard for errors
- [ ] Check application performance
- [ ] Verify email delivery rates
- [ ] Monitor database performance

### Weekly Reviews
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Update dependencies if needed
- [ ] Review security alerts

## 🎉 Go-Live Checklist

### Final Launch Steps
- [ ] All tests passing
- [ ] Custom domain configured (if desired)
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Backup procedures in place
- [ ] Team notified of go-live
- [ ] Documentation updated

---

**Deployment Status**: Ready for Vercel deployment  
**Last Updated**: October 4, 2025  
**Repository**: `https://github.com/ugo-droid/olumba_prod`  
**Target URL**: `https://olumba.vercel.app` (or custom domain)
