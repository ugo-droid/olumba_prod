# Clerk Authentication Migration Guide

This guide documents the migration from Supabase Authentication to Clerk for the Olumba project.

## Overview

The Olumba project has been migrated from Supabase Authentication to Clerk while maintaining Supabase as the database and storage solution. This hybrid approach provides:

- **Clerk**: Authentication, user management, session handling
- **Supabase**: Database operations, file storage, real-time features

## Migration Components

### 1. Backend Changes

#### New Files Created:
- `server/config/clerk.js` - Clerk configuration and client setup
- `server/middleware/clerkAuth.js` - Authentication middleware using Clerk
- `server/services/clerkService.js` - Clerk authentication service layer
- `server/routes/clerkAuth.js` - Authentication API routes

#### Updated Files:
- `server/index.js` - Updated to use Clerk auth routes
- `.env` - Added Clerk configuration variables

### 2. Frontend Changes

#### New Files Created:
- `public/js/clerkClient.js` - Clerk frontend client configuration
- `public/login-clerk.html` - Login page using Clerk components
- `public/register-clerk.html` - Registration page using Clerk components

#### Updated Files:
- `public/js/config.js` - Added Clerk configuration
- `public/dashboard.html` - Updated to use Clerk authentication

### 3. Dependencies

#### Removed:
- `@clerk/nextjs` (not needed for Node.js/Express)

#### Added:
- `@clerk/backend` - Server-side Clerk operations
- `@clerk/clerk-sdk-node` - Node.js Clerk SDK

## Configuration Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Clerk Configuration
CLERK_PUBLISHABLE_KEY=YOUR_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET=YOUR_CLERK_WEBHOOK_SECRET
CLERK_JWT_TEMPLATE=olumba_user_metadata
```

### 2. Clerk Dashboard Setup

1. Create a new Clerk application at [clerk.com](https://clerk.com)
2. Configure authentication methods (email/password, social providers)
3. Set up email templates for invites and password resets
4. Configure JWT templates for custom claims
5. Set up webhooks for user events (optional)

### 3. JWT Template Configuration

Create a JWT template in Clerk with the following claims:

```json
{
  "role": "{{user.public_metadata.role}}",
  "companyId": "{{user.public_metadata.companyId}}",
  "title": "{{user.public_metadata.title}}",
  "phone": "{{user.public_metadata.phone}}"
}
```

## User Roles Implementation

User roles are now stored in Clerk's `publicMetadata`:

```javascript
// Available roles
const USER_ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member', 
    CONSULTANT: 'consultant',
    CLIENT: 'client'
};

// Setting user role
await updateUserMetadata(userId, {
    role: 'admin',
    companyId: 'company-123',
    title: 'Project Manager'
});
```

## Authentication Flow

### 1. User Registration

```javascript
// Frontend
const result = await window.clerkAuth.signUp(email, password, {
    role: 'member',
    companyId: companyId
});

// Backend creates user profile in Supabase
```

### 2. User Login

```javascript
// Frontend handles login via Clerk components
// Backend verifies JWT token and gets user info
const user = await getUserMetadata(userId);
```

### 3. Route Protection

```javascript
// Middleware protects routes
app.use('/api/projects', authenticateClerkToken, projectRoutes);

// Check user roles
if (!hasRole(user, USER_ROLES.ADMIN)) {
    return res.status(403).json({ error: 'Admin access required' });
}
```

## API Changes

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login verification |
| `/api/auth/me` | GET | Get current user profile |
| `/api/auth/profile` | PUT | Update user profile |
| `/api/auth/invite` | POST | Invite user to organization |
| `/api/auth/verify` | POST | Verify JWT token |

### Request/Response Format

All protected endpoints now require:
```javascript
headers: {
    'Authorization': 'Bearer <clerk-jwt-token>'
}
```

## Frontend Integration

### 1. Initialize Clerk

```javascript
// Load Clerk SDK
await window.clerkAuth.initializeClerk();

// Check authentication
if (window.clerkAuth.isAuthenticated()) {
    // User is logged in
    const user = window.clerkAuth.getCurrentUser();
}
```

### 2. Protected Pages

```javascript
// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.clerkAuth.isAuthenticated()) {
        window.location.href = '/login-clerk.html';
        return;
    }
    // Initialize page
});
```

### 3. API Calls

```javascript
// Include auth token in API calls
const token = await window.clerkAuth.getAuthToken();
const response = await fetch('/api/projects', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

## Migration Steps

### 1. Setup Clerk Account

1. Create Clerk account and application
2. Configure authentication methods
3. Set up email templates
4. Configure JWT templates

### 2. Update Environment

1. Add Clerk environment variables
2. Update frontend configuration
3. Test Clerk initialization

### 3. Deploy Changes

1. Deploy backend with new Clerk integration
2. Deploy frontend with Clerk components
3. Test authentication flows

### 4. User Migration

1. Export existing users from Supabase
2. Import users into Clerk (if needed)
3. Update user metadata with roles
4. Notify users of new login process

## Testing Checklist

### Authentication Flows
- [ ] User registration
- [ ] Email/password login
- [ ] Social login (if enabled)
- [ ] Password reset
- [ ] Account deletion
- [ ] Session management

### User Roles
- [ ] Admin access controls
- [ ] Member permissions
- [ ] Consultant access
- [ ] Client restrictions

### API Integration
- [ ] Protected route access
- [ ] User profile updates
- [ ] Organization management
- [ ] Project access controls

## Rollback Plan

If issues arise, you can rollback by:

1. Revert server routes to use Supabase auth
2. Update frontend to use original auth system
3. Remove Clerk dependencies
4. Restore original authentication flow

## Support

For issues with the migration:

1. Check Clerk dashboard for configuration issues
2. Verify environment variables are set correctly
3. Check browser console for frontend errors
4. Review server logs for backend issues

## Security Considerations

1. **JWT Tokens**: Clerk handles JWT generation and validation
2. **User Data**: Sensitive data remains in Supabase with RLS
3. **API Security**: All protected routes require valid Clerk JWT
4. **Session Management**: Clerk handles session lifecycle
5. **Password Security**: Clerk enforces password policies

## Performance Impact

- **Positive**: Reduced authentication complexity
- **Positive**: Better session management
- **Neutral**: API calls now include JWT verification
- **Positive**: Improved user experience with Clerk UI

## Future Enhancements

1. **Multi-factor Authentication**: Easy to enable in Clerk
2. **Social Providers**: Add Google, GitHub, etc.
3. **Organization Management**: Clerk organizations for teams
4. **Advanced Security**: Risk-based authentication
5. **User Analytics**: Clerk provides user behavior insights
