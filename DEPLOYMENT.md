# Olumba Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Olumba to Vercel for production use. The deployment includes all necessary configurations for a secure, scalable, and production-ready AEC project management platform.

## Prerequisites

- [Vercel account](https://vercel.com)
- [GitHub repository](https://github.com) with Olumba code
- [Supabase project](https://supabase.com) configured
- [Clerk account](https://clerk.com) for authentication
- [Resend account](https://resend.com) for email services
- Custom domain (e.g., olumba.app)

## 🚀 Deployment Steps

### Step 1: Prepare Repository

1. **Ensure all code is committed and pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Verify all files are present:**
   - `vercel.json` - Vercel configuration
   - `.vercelignore` - Files to ignore during deployment
   - `server/production.js` - Production server configuration
   - `env.production.template` - Environment variables template

### Step 2: Connect to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository:**
   - Select your Olumba repository
   - Choose "Import" to connect
4. **Configure project settings:**
   - Project Name: `olumba`
   - Framework Preset: `Other`
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Install Command: `npm install`

### Step 3: Configure Environment Variables

1. **In Vercel Dashboard, go to your project → Settings → Environment Variables**

2. **Add the following variables (use values from `env.production.template`):**

   ```env
   # Application Configuration
   NODE_ENV=production
APP_URL=https://olumba.app
ALLOWED_ORIGINS=https://olumba.app,https://www.olumba.app

   # Supabase Configuration
   SUPABASE_URL=https://mzxsugnnyydinywvwqxt.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Clerk Authentication
   CLERK_SECRET_KEY=your_clerk_secret_key_here
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   CLERK_WEBHOOK_SECRET=whsec_bhP9d/ho21QLIWeAN3SjkgYK1cBy9hBN

   # Resend Email Service
   RESEND_API_KEY=re_8duHTbw2_GV1dwgmtFNYKa3U3MdvDX1k3

   # Email Configuration
   EMAIL_FROM=hello@olumba.app

   # Security
   JWT_SECRET=your_secure_jwt_secret_here
   ```

3. **Set environment for all variables to "Production"**

### Step 4: Configure Custom Domain

1. **In Vercel Dashboard → Project → Settings → Domains**
2. **Add your domain:**
   - Primary domain: `olumba.app`
   - Additional domain: `www.olumba.app`
3. **Configure DNS records as instructed by Vercel:**
   ```
   Type: A
   Name: @
   Value: 76.76.19.61

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. **Wait for domain verification (can take up to 24 hours)**

### Step 5: Configure Third-Party Services

#### Supabase Configuration
1. **Go to Supabase Dashboard → Settings → API**
2. **Update Site URL:**
   - Add `https://olumba.app` to allowed origins
   - Add `https://www.olumba.app` to allowed origins
3. **Configure RLS policies for production**
4. **Run database migrations:**
   ```sql
   -- Run the contents of supabase/webhook-tables.sql in Supabase SQL Editor
   ```

#### Clerk Configuration
1. **Go to Clerk Dashboard → Configure → Domains**
2. **Add production domains:**
   - `olumba.app`
   - `www.olumba.app`
3. **Configure webhook endpoints:**
   - Main webhook: `https://olumba.app/api/webhooks/clerk-webhook`
4. **Update allowed origins in Clerk settings**

#### Resend Configuration
1. **Go to Resend Dashboard → Domains**
2. **Add and verify your domain:**
   - Domain: `olumba.app`
   - Configure DNS records as instructed
3. **Update sender email:**
   - From: `hello@olumba.app`
   - Reply-to: `support@olumba.app`

### Step 6: Deploy Application

1. **In Vercel Dashboard, go to Deployments**
2. **Click "Deploy" to trigger deployment**
3. **Monitor deployment logs for any errors**
4. **Verify deployment success:**
   - Check `https://olumba.app/api/health`
   - Check `https://olumba.app/api/status`

### Step 7: Enable Monitoring and Analytics

#### Vercel Analytics
1. **Go to Vercel Dashboard → Project → Analytics**
2. **Enable Web Analytics**
3. **Add Analytics ID to environment variables:**
   ```env
   VERCEL_ANALYTICS_ID=your_analytics_id_here
   ```

#### Error Monitoring (Optional - Sentry)
1. **Create Sentry account and project**
2. **Add Sentry DSN to environment variables:**
   ```env
   SENTRY_DSN=your_sentry_dsn_here
   ```

### Step 8: SSL/HTTPS Configuration

1. **Vercel automatically provides SSL certificates**
2. **Verify HTTPS is working:**
   - Visit `https://olumba.app`
   - Check SSL certificate in browser
3. **Configure HSTS headers (already in `vercel.json`)**

## 🧪 Testing Production Deployment

### Health Checks

1. **API Health Check:**
   ```bash
   curl https://olumba.app/api/health
   ```

2. **API Status Check:**
   ```bash
   curl https://olumba.app/api/status
   ```

### Functionality Tests

1. **Authentication Flow:**
   - Visit `https://olumba.app/login-clerk.html`
   - Test user registration and login
   - Verify Clerk integration

2. **Email Functionality:**
   - Test user registration (should send welcome email)
   - Test consultant invitations
   - Verify Resend integration

3. **Database Operations:**
   - Create a test project
   - Add tasks and documents
   - Verify Supabase integration

4. **Webhook Functionality:**
   - Test Clerk webhooks
   - Verify user sync to Supabase

### Performance Tests

1. **Page Load Speed:**
   - Test homepage load time
   - Test dashboard performance
   - Check Core Web Vitals

2. **API Response Times:**
   - Monitor API endpoint performance
   - Check database query performance

## 📊 Monitoring and Maintenance

### Daily Monitoring

1. **Check Vercel Dashboard for:**
   - Deployment status
   - Function execution metrics
   - Error rates

2. **Monitor third-party services:**
   - Supabase dashboard for database performance
   - Clerk dashboard for authentication metrics
   - Resend dashboard for email delivery rates

### Weekly Maintenance

1. **Review error logs**
2. **Check performance metrics**
3. **Update dependencies if needed**
4. **Monitor security alerts**

### Monthly Maintenance

1. **Review and update environment variables**
2. **Check SSL certificate expiration**
3. **Review and optimize performance**
4. **Update documentation**

## 🔒 Security Checklist

- [ ] All environment variables are properly configured
- [ ] HTTPS is enabled and working
- [ ] CORS is properly configured
- [ ] Security headers are implemented
- [ ] API endpoints are protected
- [ ] Database access is secured with RLS
- [ ] Webhook signatures are verified
- [ ] Email sending is rate-limited
- [ ] Error messages don't leak sensitive information

## 🚨 Troubleshooting

### Common Issues

1. **Deployment Fails:**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are in package.json
   - Check environment variables are set

2. **Domain Not Working:**
   - Verify DNS records are correct
   - Wait for DNS propagation (up to 24 hours)
   - Check domain verification in Vercel

3. **API Errors:**
   - Check environment variables
   - Verify third-party service configurations
   - Review function logs in Vercel

4. **Email Not Sending:**
   - Verify Resend API key
   - Check domain verification in Resend
   - Review email logs

### Debug Commands

```bash
# Check environment variables
vercel env ls

# View deployment logs
vercel logs

# Test local production build
npm run build
npm run preview
```

## 📞 Support

For deployment issues:

1. **Check Vercel documentation:** https://vercel.com/docs
2. **Review third-party service documentation**
3. **Check GitHub issues for known problems**
4. **Contact support teams for critical issues**

## 🎯 Go-Live Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Custom domain configured and verified
- [ ] SSL certificate active
- [ ] All third-party services configured for production
- [ ] Database migrations completed
- [ ] Health checks passing
- [ ] Performance tests completed
- [ ] Security checklist verified

### Launch Day
- [ ] Final deployment completed
- [ ] Domain DNS updated
- [ ] All services tested in production
- [ ] Monitoring enabled
- [ ] Team notified of go-live
- [ ] Backup plans ready

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Check all integrations working
- [ ] Review performance metrics
- [ ] Address any issues promptly
- [ ] Document any deployment notes

---

## 🎉 Deployment Complete!

Your Olumba application should now be live at `https://olumba.app` with:
- ✅ Secure authentication via Clerk
- ✅ Reliable database via Supabase  
- ✅ Professional email delivery via Resend
- ✅ Optimized performance via Vercel
- ✅ SSL/HTTPS security
- ✅ Custom domain configuration
- ✅ Monitoring and analytics

The application is now ready for commercial use with enterprise-grade security, performance, and reliability.
