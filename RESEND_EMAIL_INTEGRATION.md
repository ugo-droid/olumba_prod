# Resend Email Integration for Olumba

## Overview

Olumba now uses Resend as the primary email service for all transactional emails. This integration provides reliable, professional email delivery with beautiful, responsive templates designed specifically for AEC industry users.

## Features

### 📧 Email Types Supported

1. **Welcome Emails** - Sent after user signup
2. **Consultant Invitations** - Project collaboration invites
3. **Task Assignments** - New task notifications
4. **Document Sharing** - File upload/sharing alerts
5. **Project Status Updates** - Project lifecycle notifications
6. **Mention Notifications** - User mention alerts
7. **Password Reset** - Account security emails
8. **City Approval Updates** - Permit status notifications

### 🎨 Design Features

- **Professional Branding** - Olumba logo and brand colors
- **Responsive Design** - Works on all devices
- **AEC-Focused** - Industry-specific terminology and styling
- **Accessible** - Screen reader friendly
- **Consistent** - Unified design across all email types

## Setup Instructions

### 1. Environment Configuration

Add the following to your `.env` file:

```env
# Resend Configuration
RESEND_API_KEY=re_8duHTbw2_GV1dwgmtFNYKa3U3MdvDX1k3

# Email Configuration
APP_URL=http://localhost:3000
EMAIL_FROM=hello@olumba.com
```

### 2. Resend Dashboard Setup

1. **Go to [Resend Dashboard](https://resend.com/domains)**
2. **Add your domain** (e.g., `olumba.com`)
3. **Configure DNS records** as instructed by Resend
4. **Verify domain** for production use

### 3. Test Email Functionality

```bash
# Validate email service structure
node server/scripts/validateEmailService.js

# Send test emails (requires RESEND_API_KEY)
npm run test-emails
```

## Email Templates

### Welcome Email Template
- **Trigger**: User signup via Clerk webhook
- **Content**: Welcome message, platform features, getting started guide
- **CTA**: "Get Started" button to dashboard

### Consultant Invite Template
- **Trigger**: Project invitation
- **Content**: Inviter details, project information, role description
- **CTA**: "Join Project" button with invitation link

### Task Assignment Template
- **Trigger**: New task assigned to user
- **Content**: Task details, priority, due date, project context
- **CTA**: "View Task Details" button

### Document Sharing Template
- **Trigger**: Document uploaded/shared
- **Content**: File details, sharer info, project context
- **CTA**: "View Document" button

### Project Status Update Template
- **Trigger**: Project status changed
- **Content**: Status change details, update message, project context
- **CTA**: "View Project" button

### Mention Notification Template
- **Trigger**: User mentioned in comment
- **Content**: Comment preview, mentioner info, project context
- **CTA**: "View Discussion" button

### Password Reset Template
- **Trigger**: Password reset requested
- **Content**: Reset instructions, security notice
- **CTA**: "Reset Password" button

### City Approval Update Template
- **Trigger**: Permit status changed
- **Content**: Approval details, reviewer info, project context
- **CTA**: "View Approval Details" button

## API Usage

### Direct Email Service Usage

```javascript
import resendEmailService from '../services/resendEmailService.js';

// Send welcome email
await resendEmailService.sendWelcomeEmail('user@example.com', {
    full_name: 'John Doe'
});

// Send task assignment
await resendEmailService.sendTaskAssignmentEmail('user@example.com', {
    assignee_name: 'Jane Smith',
    assigner_name: 'Mike Johnson',
    task_name: 'Review Plans',
    priority: 'high',
    due_date: new Date(),
    project_name: 'Office Building',
    task_id: 'task_123'
});
```

### Helper Functions Usage

```javascript
import emailHelpers from '../services/emailHelpers.js';

// Notify task assignment (automatically gets user details)
await emailHelpers.notifyTaskAssignment(taskData);

// Notify document sharing
await emailHelpers.notifyDocumentShared(documentData, [recipientId1, recipientId2]);

// Notify project status update
await emailHelpers.notifyProjectStatusUpdate(projectId, 'planning', 'active', 'All permits approved');
```

## Integration Points

### 1. Clerk Webhooks
- **File**: `server/routes/clerkWebhooks.js`
- **Function**: Sends welcome emails on user creation
- **Trigger**: `user.created` webhook event

### 2. Task Management
- **File**: `server/routes/tasks.js`
- **Function**: Sends task assignment notifications
- **Trigger**: New task creation with assignee

### 3. Document Management
- **File**: `server/routes/documents.js`
- **Function**: Sends document sharing notifications
- **Trigger**: Document upload/sharing

### 4. Project Management
- **File**: `server/routes/projects.js`
- **Function**: Sends project status update notifications
- **Trigger**: Project status changes

### 5. Communication Hub
- **File**: `server/routes/messages.js`
- **Function**: Sends mention notifications
- **Trigger**: User mentions in comments

### 6. City Approvals
- **File**: `server/routes/cityApprovals.js`
- **Function**: Sends approval status notifications
- **Trigger**: Approval status changes

## Error Handling

The email service includes comprehensive error handling:

- **Graceful Failures**: Email failures don't break main functionality
- **Logging**: All email attempts are logged with success/failure status
- **Retry Logic**: Failed emails can be retried (implement as needed)
- **Fallback**: Console logging in development mode

## Monitoring

### Email Delivery Tracking
- **Resend Dashboard**: Track delivery rates, opens, clicks
- **Server Logs**: Monitor email sending success/failure
- **Webhook Events**: Track email events via Resend webhooks

### Performance Metrics
- **Delivery Rate**: Monitor successful email delivery
- **Open Rate**: Track email engagement
- **Click Rate**: Measure CTA effectiveness

## Security Considerations

- **API Key Protection**: Store RESEND_API_KEY securely
- **Rate Limiting**: Respect Resend API limits
- **Email Validation**: Validate email addresses before sending
- **Unsubscribe**: Include unsubscribe links in all emails

## Production Deployment

### 1. Domain Configuration
- Add your domain to Resend dashboard
- Configure DNS records (SPF, DKIM, DMARC)
- Verify domain for production use

### 2. Environment Variables
```env
RESEND_API_KEY=re_your_production_key
APP_URL=https://yourdomain.com
EMAIL_FROM=hello@yourdomain.com
```

### 3. Monitoring Setup
- Set up Resend webhook endpoints for email events
- Configure logging and monitoring
- Set up alerts for email delivery failures

## Troubleshooting

### Common Issues

1. **"Missing API key" Error**
   - Ensure RESEND_API_KEY is set in .env
   - Restart server after adding API key

2. **Email Not Delivered**
   - Check Resend dashboard for delivery status
   - Verify sender domain is configured
   - Check spam folders

3. **Template Rendering Issues**
   - Validate HTML template syntax
   - Test with sample data
   - Check browser developer tools

### Debug Commands

```bash
# Validate service structure
node server/scripts/validateEmailService.js

# Test specific email type
node -e "
import resendEmailService from './server/services/resendEmailService.js';
resendEmailService.sendWelcomeEmail('test@example.com', {full_name: 'Test'});
"
```

## Support

For issues with the email integration:

1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test with the validation script
4. Check Resend dashboard for delivery status
5. Review this documentation for troubleshooting steps

## Future Enhancements

- **Email Templates**: Additional template designs
- **Personalization**: Dynamic content based on user preferences
- **Analytics**: Advanced email engagement tracking
- **A/B Testing**: Template performance optimization
- **Internationalization**: Multi-language email support
