# Supabase Integration Setup Guide

This guide will walk you through setting up Supabase as the backend for your Olumba webapp.

## Prerequisites

- Node.js 16+ installed
- A Supabase account (free tier available)
- Access to your existing Olumba project

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `olumba-production` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

## Step 2: Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://mzxsugnnyydinywvwqxt.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 3: Set Up Environment Variables

1. Create a `.env` file in your project root:

```bash
# Copy from env.example and fill in your values
cp env.example .env
```

2. Edit `.env` with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App Configuration
APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@olumba.com

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the schema creation script:
   - Copy the contents of `supabase/schema.sql`
   - Paste into the SQL Editor
   - Click "Run"

3. Set up Row Level Security policies:
   - Copy the contents of `supabase/rls-policies.sql`
   - Paste into the SQL Editor
   - Click "Run"

4. Configure storage buckets:
   - Copy the contents of `supabase/storage-setup.sql`
   - Paste into the SQL Editor
   - Click "Run"

## Step 5: Configure Frontend

1. Update `public/js/config.js` with your Supabase credentials:

```javascript
// Replace with your actual Supabase project details
window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

2. Add Supabase client script to your HTML files. Add this before your other scripts:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script src="/js/supabaseClient.js"></script>
```

## Step 6: Update HTML Files

Update all your HTML files to include the new scripts. Here's the recommended order:

```html
<!-- In the <head> section -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script src="/js/supabaseClient.js"></script>
<script src="/js/api.js"></script>
<script src="/js/nav.js"></script>
```

## Step 7: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-js dotenv
```

## Step 8: Test the Setup

1. Start your development server:
```bash
npm start
```

2. Check the console for successful Supabase initialization:
   - You should see "✅ Supabase client initialized"
   - No error messages about missing environment variables

3. Test user registration:
   - Go to your app's registration page
   - Try creating a new account
   - Check Supabase dashboard → Authentication → Users

## Step 9: Data Migration (Optional)

If you have existing data in SQLite, you'll need to migrate it:

1. Export data from your current SQLite database
2. Transform the data to match the new Supabase schema
3. Import data using Supabase SQL Editor or the API

## Database Schema Overview

### Core Tables

- **companies**: Organization/company information
- **users**: User profiles (extends Supabase auth.users)
- **projects**: Project information and settings
- **project_members**: Many-to-many relationship for project access
- **tasks**: Task management with assignments and status
- **documents**: File metadata and organization
- **document_versions**: Version control for documents
- **messages**: Communication hub messages and comments
- **notifications**: In-app notifications
- **activity_log**: Audit trail for all actions
- **city_approvals**: City plan check tracking

### User Roles

- **admin**: Full system access
- **member**: Company member with project access
- **consultant**: External consultant with limited access
- **client**: Client with view-only access to specific projects
- **guest**: Temporary access for specific purposes

### Project Roles

- **owner**: Full project control
- **admin**: Project administration
- **member**: Full project participation
- **consultant**: External consultant access
- **client**: Client view access
- **viewer**: Read-only access

## Storage Configuration

### Buckets

- **documents**: Project files (.pdf, .dwg, .rvt, etc.)
- **avatars**: User profile photos
- **company-logos**: Company branding assets

### File Upload Limits

- Documents: 100MB per file
- Avatars: 5MB per file
- Company logos: 5MB per file

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access data they have permission to see
- Company data is isolated between organizations
- Project data is restricted to project members
- Admin users have appropriate elevated access

### Authentication

- JWT-based authentication via Supabase Auth
- Secure password requirements
- Email verification
- Password reset functionality
- Session management

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks, Documents, Messages
- Similar RESTful patterns for all resources
- All endpoints require authentication
- Access control based on project membership

## Real-time Features

Supabase provides real-time subscriptions for:
- New messages in projects
- Task status updates
- Document uploads
- Notification delivery

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env` file exists and has correct values
   - Restart your server after updating environment variables

2. **"Authentication failed"**
   - Verify your Supabase anon key is correct
   - Check that RLS policies are set up correctly

3. **"Access denied to this project"**
   - Ensure the user is added as a project member
   - Check project membership in Supabase dashboard

4. **File upload failures**
   - Verify storage buckets are created
   - Check file size limits
   - Ensure storage policies are configured

### Debug Mode

Enable debug logging by setting:
```javascript
window.APP_CONFIG.DEBUG = true;
```

This will log API requests, authentication status, and other helpful information.

## Production Deployment

### Environment Variables

Set these in your production environment:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL` (your production domain)
- `NODE_ENV=production`

### Security Checklist

- [ ] Service role key is kept secret
- [ ] RLS policies are enabled on all tables
- [ ] Storage policies restrict file access appropriately
- [ ] CORS is configured for your domain
- [ ] SSL/HTTPS is enabled
- [ ] Environment variables are secure

## Support

For issues with this integration:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the console logs for error messages
3. Verify your environment configuration
4. Test with a fresh user account

## Next Steps

After successful setup:
1. Test all major features (auth, projects, tasks, documents)
2. Import any existing data
3. Configure email notifications
4. Set up monitoring and backups
5. Deploy to production environment

---

**Note**: This integration maintains backward compatibility with your existing UI/UX while providing a robust, scalable backend infrastructure.
