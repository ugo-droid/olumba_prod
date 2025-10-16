# Supabase Migration Checklist

Use this checklist to ensure a smooth migration from your current SQLite setup to Supabase.

## Pre-Migration Setup

### ✅ Supabase Project Setup
- [ ] Create Supabase project
- [ ] Note down project URL and API keys
- [ ] Set up environment variables in `.env`
- [ ] Install Supabase dependencies (`npm install @supabase/supabase-js @supabase/auth-js`)

### ✅ Database Schema
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Run `supabase/rls-policies.sql` in Supabase SQL Editor
- [ ] Run `supabase/storage-setup.sql` in Supabase SQL Editor
- [ ] Verify all tables are created successfully
- [ ] Check that RLS is enabled on all tables

### ✅ Frontend Configuration
- [ ] Update `public/js/config.js` with your Supabase credentials
- [ ] Add Supabase CDN script to all HTML files
- [ ] Include config and supabaseClient scripts in HTML files
- [ ] Test frontend Supabase connection

## Migration Steps

### 1. Data Export (if migrating existing data)
- [ ] Export users from current SQLite database
- [ ] Export companies data
- [ ] Export projects and project members
- [ ] Export tasks with assignments
- [ ] Export documents metadata (files will need to be re-uploaded)
- [ ] Export messages and notifications
- [ ] Export activity logs
- [ ] Export city approvals data

### 2. User Migration
- [ ] Create admin user account through Supabase Auth
- [ ] Test admin login functionality
- [ ] Create sample member accounts
- [ ] Verify user roles are set correctly
- [ ] Test user profile updates

### 3. Company and Project Migration
- [ ] Create companies in Supabase
- [ ] Create projects and assign to companies
- [ ] Add project members with correct roles
- [ ] Verify project access controls work
- [ ] Test project CRUD operations

### 4. Task and Document Migration
- [ ] Migrate tasks with proper assignments
- [ ] Test task status updates
- [ ] Set up document metadata (without files initially)
- [ ] Test document upload functionality
- [ ] Verify file access controls

### 5. Communication Features
- [ ] Test message posting in projects
- [ ] Verify mention notifications work
- [ ] Test email notification delivery
- [ ] Check activity log generation

## Testing Phase

### Authentication Testing
- [ ] User registration works
- [ ] User login/logout works
- [ ] Password reset functionality
- [ ] JWT token validation
- [ ] Role-based access control
- [ ] Session management

### Project Management Testing
- [ ] Create new projects
- [ ] Add/remove project members
- [ ] Update project details
- [ ] Delete projects (admin only)
- [ ] Project access restrictions work

### Task Management Testing
- [ ] Create tasks in projects
- [ ] Assign tasks to users
- [ ] Update task status
- [ ] Task filtering and sorting
- [ ] Task notifications

### Document Management Testing
- [ ] Upload documents to projects
- [ ] Download documents
- [ ] Document versioning
- [ ] File access permissions
- [ ] Storage bucket policies

### Communication Testing
- [ ] Post messages in projects
- [ ] Reply to messages
- [ ] Mention users in messages
- [ ] Email notifications for mentions
- [ ] Real-time message updates

### City Approvals Testing
- [ ] Create city approval entries
- [ ] Update approval status
- [ ] Track approval timeline
- [ ] Approval notifications

## Performance and Security

### Security Verification
- [ ] RLS policies prevent unauthorized access
- [ ] File upload restrictions work
- [ ] API endpoints require authentication
- [ ] Admin-only functions are protected
- [ ] Cross-company data isolation

### Performance Testing
- [ ] Page load times are acceptable
- [ ] Large file uploads work
- [ ] Real-time updates perform well
- [ ] Database queries are optimized
- [ ] API response times are reasonable

## Production Deployment

### Environment Setup
- [ ] Set production environment variables
- [ ] Configure production Supabase project
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging

### Final Verification
- [ ] All features work in production
- [ ] Email notifications work
- [ ] File uploads/downloads work
- [ ] User authentication works
- [ ] Data backup strategy in place

## Post-Migration

### User Communication
- [ ] Notify users of the migration
- [ ] Provide updated login instructions
- [ ] Share any new features or changes
- [ ] Set up user support process

### Monitoring
- [ ] Set up error monitoring
- [ ] Monitor performance metrics
- [ ] Track user adoption
- [ ] Monitor storage usage
- [ ] Set up automated backups

### Cleanup
- [ ] Remove old SQLite database files
- [ ] Clean up unused code
- [ ] Update documentation
- [ ] Archive old authentication system
- [ ] Remove deprecated API endpoints

## Rollback Plan

In case of issues:
- [ ] Keep old SQLite system running in parallel initially
- [ ] Have database backup before migration
- [ ] Document rollback procedures
- [ ] Test rollback process
- [ ] Communicate rollback plan to stakeholders

## Success Criteria

Migration is successful when:
- [ ] All users can log in with their accounts
- [ ] All existing projects are accessible
- [ ] File uploads and downloads work
- [ ] Email notifications are delivered
- [ ] Real-time features work correctly
- [ ] Performance is equal or better than before
- [ ] No data loss occurred
- [ ] Security policies are enforced

---

**Note**: This migration maintains backward compatibility during the transition period. The old SQLite system can run alongside Supabase until you're confident in the new system.

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Migration Guide](https://supabase.com/docs/guides/migrations)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## Emergency Contacts

- Supabase Support: [support@supabase.com](mailto:support@supabase.com)
- Your development team contact information
- Database administrator contact information
