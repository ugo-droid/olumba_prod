# Olumba Git Workflow Documentation

## Overview

This document outlines the complete Git workflow for the Olumba AEC project management platform, including repository setup, security measures, and deployment procedures.

## Repository Information

- **Repository**: `https://github.com/ugo-droid/olumba_prod.git`
- **Branch**: `main`
- **Latest Commit**: `19591af` - Security Update: Remove sensitive files and enhance .gitignore

## 🔒 Security Configuration

### .gitignore Configuration

The repository includes comprehensive .gitignore rules to protect sensitive data:

```gitignore
# Environment Variables (CRITICAL - Never commit these)
.env
.env.local
.env.production
.env.development
.env.test
.env.backup
.env.*.local

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# Database Files
data/
*.db
*.sqlite
*.sqlite3

# Uploads and Logs
uploads/
logs/
*.log

# Build Outputs
dist/
build/
.cache/

# OS and IDE Files
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary Files
tmp/
temp/
```

### Security Measures Implemented

1. **Environment Files Protected**:
   - `.env` - Contains all sensitive API keys and secrets
   - `.env.backup` - Removed from version control
   - `.env.example` - Removed from version control

2. **Sensitive Data Excluded**:
   - Database files and uploads
   - Log files and temporary data
   - Build artifacts and cache files

## 📋 Complete Git Workflow

### Step 1: Repository Setup (Already Completed)

```bash
# Initialize repository (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/ugo-droid/olumba_prod.git

# Verify remote configuration
git remote -v
```

### Step 2: Daily Development Workflow

```bash
# Navigate to project directory
cd /Users/ugo_mbelu/olumba

# Check current status
git status

# Stage all changes
git add .

# Review staged changes
git status

# Create commit with descriptive message
git commit -m "Feature: Brief description of changes

Detailed description of what was implemented:
- Specific feature or fix
- Technical details
- Impact on application

Related: #issue-number (if applicable)"

# Push to GitHub
git push origin main
```

### Step 3: Security Checklist (Before Each Commit)

- [ ] Verify `.env` files are not staged
- [ ] Check `.gitignore` excludes sensitive files
- [ ] Review staged files for sensitive data
- [ ] Ensure no API keys or secrets in commit
- [ ] Confirm database files are excluded

### Step 4: Authentication Options for GitHub Push

Since automated push requires authentication, use one of these methods:

#### Option A: Personal Access Token (Recommended)

```bash
# Create a Personal Access Token on GitHub:
# 1. Go to GitHub → Settings → Developer settings → Personal access tokens
# 2. Generate new token with 'repo' permissions
# 3. Use token as password when prompted

git push origin main
# Username: ugo-droid
# Password: [your-personal-access-token]
```

#### Option B: SSH Key Authentication

```bash
# Generate SSH key (if not already done)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add SSH key to GitHub account
# Then change remote URL to SSH
git remote set-url origin git@github.com:ugo-droid/olumba_prod.git
git push origin main
```

#### Option C: GitHub CLI

```bash
# Install GitHub CLI
brew install gh  # macOS
# or download from https://cli.github.com/

# Authenticate
gh auth login

# Push normally
git push origin main
```

## 🚀 Deployment Workflow

### Pre-Deployment Checklist

- [ ] All changes committed and pushed to GitHub
- [ ] Environment variables configured in deployment platform
- [ ] Production tests passing
- [ ] Security review completed
- [ ] Documentation updated

### Vercel Deployment Process

1. **Connect Repository to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import project from GitHub
   - Select `ugo-droid/olumba_prod`

2. **Configure Environment Variables**:
   ```env
   NODE_ENV=production
   APP_URL=https://olumba.app
   
   SUPABASE_URL=https://mzxsugnnyydinywvwqxt.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   CLERK_SECRET_KEY=[your-clerk-secret]
   RESEND_API_KEY=[your-resend-api-key]
   # ... other environment variables
   ```

3. **Deploy**:
   - Vercel automatically builds and deploys
   - Monitor deployment logs
   - Test production endpoints

## 📊 Commit History

### Recent Commits

1. **`19591af`** - 🔒 Security Update: Remove sensitive files and enhance .gitignore
2. **`86a2c8b`** - Prepare Olumba for production deployment on Vercel
3. **`de2f8b6`** - Integrate Resend email service for transactional emails
4. **`e2c1beb`** - Fix foreign key constraint error in webhook tables
5. **`7f56434`** - Add comprehensive Clerk webhook integration

### Commit Message Standards

Use this format for all commits:

```
Type: Brief description

Detailed description of changes:
- Specific feature or fix implemented
- Technical details and approach
- Impact on application functionality

Security considerations:
- Any security implications
- Environment variable changes
- Access control updates

Related: #issue-number (if applicable)
```

**Types**:
- `Feature:` - New functionality
- `Fix:` - Bug fixes
- `Security:` - Security improvements
- `Docs:` - Documentation updates
- `Refactor:` - Code improvements
- `Deploy:` - Deployment related

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Failed**:
   ```bash
   # Clear cached credentials
   git config --global --unset credential.helper
   git config --global credential.helper store
   ```

2. **Sensitive Files Committed**:
   ```bash
   # Remove from git tracking
   git rm --cached sensitive-file
   git commit -m "Remove sensitive file from tracking"
   ```

3. **Merge Conflicts**:
   ```bash
   # Pull latest changes
   git pull origin main
   # Resolve conflicts manually
   # Commit resolution
   git commit -m "Resolve merge conflicts"
   ```

### Emergency Procedures

1. **Revert Last Commit**:
   ```bash
   git reset --hard HEAD~1
   git push --force origin main
   ```

2. **Restore Deleted Files**:
   ```bash
   git checkout HEAD -- filename
   ```

## 📈 Repository Statistics

- **Total Commits**: 6
- **Active Branches**: 1 (main)
- **Files Tracked**: ~50
- **Repository Size**: ~2MB
- **Last Updated**: October 4, 2025

## 🎯 Next Steps

1. **Complete GitHub Authentication**:
   - Choose authentication method (token/SSH/CLI)
   - Push latest commit to GitHub
   - Verify repository is up to date

2. **Deploy to Vercel**:
   - Import repository in Vercel dashboard
   - Configure environment variables
   - Deploy and test production

3. **Set Up CI/CD**:
   - Configure automated deployments
   - Set up testing pipeline
   - Enable monitoring and alerts

## 📞 Support

For Git workflow issues:

1. Check this documentation first
2. Review GitHub authentication setup
3. Verify .gitignore configuration
4. Contact development team for assistance

---

**Last Updated**: October 4, 2025  
**Version**: 1.0.0  
**Maintained By**: Olumba Development Team
