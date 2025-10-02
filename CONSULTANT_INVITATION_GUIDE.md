# 📧 Consultant Invitation Flow - Complete Guide

## 🎯 Feature Overview

A **complete end-to-end consultant invitation system** that allows project admins to invite external consultants via email, with automatic project association and file access.

---

## ✨ What's Been Built

### Backend Components

1. **Email Service** (`server/services/emailService.js`)
   - Professional HTML email templates
   - Nodemailer integration
   - Development mode logging
   - Branded Olumba design

2. **API Endpoints**
   - `POST /api/users/invite-consultant` - Send consultant invitation
   - `GET /api/auth/validate-invitation/:token` - Validate invitation token
   - `POST /api/auth/register` - Enhanced to handle consultant signup

3. **Database Integration**
   - Invitations table with tokens
   - Auto-association with projects
   - Activity logging for audit trail

### Frontend Components

1. **Invite Consultant Modal** (Project Details Page)
   - Email input with validation
   - Personal message field
   - Success confirmation with shareable link

2. **Consultant Signup Page** (`consultant-signup.html`)
   - Invitation validation
   - Create account or login tabs
   - Auto-populated email
   - Company registration for consultants
   - Branded design

3. **Consultant Welcome Page** (`consultant-welcome.html`)
   - Project overview
   - Quick stats
   - File access instructions
   - Quick action cards

---

## 🔄 Complete Flow

### Step 1: Admin Invites Consultant

```
1. Admin goes to Project Details page
2. Clicks "Invite Consultant" button
3. Modal opens with form:
   ┌──────────────────────────────────┐
   │ Invite Consultant via Email      │
   ├──────────────────────────────────┤
   │ Email: consultant@example.com    │
   │ Message: [Optional personal msg] │
   │                                  │
   │ ℹ️ Consultant will automatically │
   │   get access to project files    │
   ├──────────────────────────────────┤
   │ [Cancel]  [Send Invitation]      │
   └──────────────────────────────────┘

4. Admin clicks "Send Invitation"
5. ✅ System:
   - Creates invitation record
   - Generates secure token
   - Sends email via nodemailer
   - Logs invitation event
   - Shows success with shareable link
```

### Step 2: Consultant Receives Email

```
📧 Email arrives with:
┌─────────────────────────────────────┐
│           OLUMBA Logo               │
│                                     │
│  You've been invited to join a      │
│  project! 🎉                        │
│                                     │
│  [Inviter Name] from [Company]      │
│  has invited you as a consultant    │
│                                     │
│  Project: [Project Name]            │
│  Role: Consultant                   │
│                                     │
│  [Join Project on Olumba] ← Button  │
│                                     │
│  Or copy this link:                 │
│  http://localhost:3000/consultant-  │
│  signup.html?token=abc123...        │
│                                     │
│  What happens next:                 │
│  1. Create account or log in        │
│  2. Auto-added to project           │
│  3. Access files & tools            │
│                                     │
│  Expires in 7 days                  │
└─────────────────────────────────────┘
```

### Step 3: Consultant Clicks Link

```
Browser opens: /consultant-signup.html?token=xxx

1. System validates token
2. Shows invitation details:
   ┌──────────────────────────────────┐
   │      You're Invited! 📧          │
   │  Join [Project Name]             │
   ├──────────────────────────────────┤
   │  Project: Office Building        │
   │  Company: Stellar Structures     │
   │  Invited By: Alex Harper         │
   │  Role: Consultant                │
   ├──────────────────────────────────┤
   │  [Create Account] [I Have Acct]  │
   └──────────────────────────────────┘
```

### Step 4A: New Consultant Signs Up

```
Create Account Tab:
┌──────────────────────────────────────┐
│ ℹ️ Creating account for:             │
│   consultant@example.com             │
├──────────────────────────────────────┤
│ Full Name: [John Smith]              │
│ Your Company: [ABC Consulting]       │
│ Job Title: [Structural Engineer]     │
│ Discipline: [Structural Eng. ▼]      │
│ Password: [••••••••]                 │
│ Confirm Password: [••••••••]         │
├──────────────────────────────────────┤
│ [Create Account & Join Project]      │
└──────────────────────────────────────┘

On Submit:
✅ Account created
✅ Consultant company registered
✅ Auto-assigned to project as consultant
✅ Invitation marked as "accepted"
✅ Activity logged
✅ → Redirects to Welcome Page
```

### Step 4B: Existing User Logs In

```
I Have an Account Tab:
┌──────────────────────────────────────┐
│ ℹ️ Log in with existing account      │
├──────────────────────────────────────┤
│ Email: [your@email.com]              │
│ Password: [••••••••]                 │
├──────────────────────────────────────┤
│ [Log In & Join Project]              │
└──────────────────────────────────────┘

On Submit:
✅ User authenticated
✅ Auto-assigned to project as consultant
✅ Invitation marked as "accepted"
✅ → Redirects to Welcome Page
```

### Step 5: Consultant Welcome Page

```
┌──────────────────────────────────────┐
│  Welcome to the Team! 🎉             │
│  You've successfully joined          │
│  [Project Name]                      │
├──────────────────────────────────────┤
│  [Tasks: 5] [Docs: 12] [Team: 8]     │
├──────────────────────────────────────┤
│  Project Info:                       │
│  Description, Status, Deadline       │
├──────────────────────────────────────┤
│  Quick Actions:                      │
│  📁 View Project                     │
│  ✅ View Tasks                       │
│  💬 Communication                    │
├──────────────────────────────────────┤
│  [Go to Dashboard]                   │
└──────────────────────────────────────┘

Access Granted:
✅ Project files (latest versions)
✅ Assigned tasks
✅ Communication threads
✅ Project updates
```

---

## 🔧 Technical Implementation

### Backend API

#### 1. Invite Consultant Endpoint

```javascript
POST /api/users/invite-consultant
Headers: Authorization: Bearer {token}
Body: {
  "email": "consultant@example.com",
  "project_id": "project-uuid",
  "message": "Optional personal message"
}

Response: {
  "message": "Consultant invitation sent successfully",
  "invitationLink": "http://localhost:3000/consultant-signup.html?token=xxx",
  "email_sent": true,
  "existing_user": false
}
```

**What it does**:
- Validates project access
- Creates invitation record
- Generates secure UUID token
- Sends branded HTML email
- Logs invitation event
- Returns shareable link

#### 2. Validate Invitation

```javascript
GET /api/auth/validate-invitation/:token

Response: {
  "valid": true,
  "email": "consultant@example.com",
  "role": "consultant",
  "project_name": "Office Building",
  "company_name": "Stellar Structures",
  "inviter_name": "Alex Harper",
  "project_id": "project-uuid"
}
```

#### 3. Register with Auto-Assignment

```javascript
POST /api/auth/register
Body: {
  "email": "consultant@example.com",
  "password": "securepassword",
  "full_name": "John Smith",
  "company_name": "ABC Consulting",  // For consultant
  "job_title": "Structural Engineer",
  "discipline": "Structural Engineering",
  "invitation_token": "invitation-uuid"
}

Auto-performs:
✅ Creates user account
✅ Creates consultant's company
✅ Marks invitation as accepted
✅ Adds user to project as consultant
✅ Creates notification preferences
```

### Email Template

**Features**:
- ✅ Olumba branding (logo, colors)
- ✅ Gradient header (#2171f2)
- ✅ Project information card
- ✅ Call-to-action button
- ✅ Backup link
- ✅ Instructions
- ✅ Expiration notice
- ✅ Professional footer
- ✅ Responsive design

**Email Content**:
- Inviter name & company
- Project name & description
- Role assignment
- Secure invitation link
- Step-by-step instructions
- 7-day expiration warning

---

## 🎮 How to Use

### As a Project Admin:

```
1. Login to Olumba
2. Go to Projects
3. Click on a project
4. In Project Details page:
   
   Click "Invite Consultant" (green mail icon)
   
5. Fill in the modal:
   - Email: consultant@example.com
   - Message: "Looking forward to working with you!"
   - Click "Send Invitation"

6. ✅ Success message appears with:
   - "Email sent to consultant@example.com"
   - Shareable link displayed
   - Copy link to share manually if needed

7. Email is sent automatically
   (In dev mode: logged to console)

8. Consultant receives professional email
9. They click link and sign up/login
10. ✅ Automatically added to your project!
```

### As a Consultant:

```
1. Receive email: "You've been invited to join..."

2. Click "Join Project on Olumba" button

3. Invitation page loads with details:
   - Project name
   - Company name
   - Who invited you
   - Your role

4. Choose: Create Account or Log In

   NEW CONSULTANT:
   5a. Fill signup form
   6a. Create account
   7a. → Auto-added to project
   8a. → Welcome page appears

   EXISTING USER:
   5b. Enter email & password
   6b. Log in
   7b. → Auto-added to project
   8b. → Welcome page appears

9. Welcome page shows:
   - Project overview
   - Stats
   - Quick actions
   - "Go to Dashboard" button

10. ✅ Full access to project files!
```

---

## 📧 Email Configuration

### Development Mode (Default)

Emails are **logged to console** instead of sent:

```bash
📧 EMAIL WOULD BE SENT:
───────────────────────────────
To: consultant@example.com
Subject: You're invited to join Office Building on Olumba
Link: http://localhost:3000/consultant-signup.html?token=xxx
───────────────────────────────
```

### Production Mode

Update `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@olumba.com
APP_URL=https://your-olumba-domain.com
```

**For Gmail**:
1. Enable 2FA
2. Generate App Password
3. Use app password in SMTP_PASS

---

## 🎨 UI Components

### 1. Invite Consultant Button

**Location**: Project Details page → Team panel

**Design**:
- Green accent color (#22C55E)
- Mail icon
- "Invite Consultant" text
- Positioned next to "Add Member"

### 2. Invite Consultant Modal

**Features**:
- Email input with validation
- Personal message textarea
- Info box explaining auto-access
- Success message with link
- Green accent button
- Auto-closes after 10 seconds

### 3. Consultant Signup Page

**Features**:
- Invitation validation
- Project details display
- Tab switching (Signup/Login)
- Full signup form
- Password confirmation
- Company registration
- Branded design

### 4. Consultant Welcome Page

**Features**:
- Success celebration
- Project overview
- Stats cards
- Quick action links
- Direct project access

---

## 🔐 Security Features

✅ **Secure Tokens**: UUID v4 tokens
✅ **Expiration**: 7-day limit
✅ **One-time Use**: Marked as accepted
✅ **Validation**: Server-side token verification
✅ **Password Hashing**: bcrypt for new accounts
✅ **Audit Logging**: All invitations logged
✅ **Email Verification**: Pre-validated via token

---

## 📊 Database Schema

### Invitations Table

```sql
invitations:
- id (UUID)
- email (consultant email)
- role (always 'consultant' for this flow)
- company_id (inviting company)
- project_id (project to join)
- invited_by (admin user ID)
- token (secure UUID)
- expires_at (7 days from creation)
- status (pending/accepted/expired/revoked)
```

### Auto-Created Records

When consultant accepts:
1. **User account** (if new)
2. **Company** (consultant's company)
3. **Project member** (consultant role)
4. **Notification preferences**
5. **Activity log entry**

---

## 🎯 Testing Guide

### Test the Complete Flow

```bash
# 1. Login as admin
Open: http://localhost:3000/login.html
Email: admin@stellar.com
Password: password123

# 2. Go to project
Click: Projects → Grandview Residences

# 3. Invite consultant
Click: "Invite Consultant" (green mail button)
Fill form:
  - Email: newconsultant@example.com
  - Message: "Looking forward to collaborating!"
  - Send Invitation

# 4. Check console logs
Look for:
📧 Consultant invitation sent!
Email: newconsultant@example.com
Link: http://localhost:3000/consultant-signup.html?token=xxx

# 5. Copy the invitation link
# 6. Open in new browser/incognito window
Paste: http://localhost:3000/consultant-signup.html?token=xxx

# 7. See invitation details
Project, company, inviter all displayed

# 8. Create account
Fill: Name, company, job title, password
Click: "Create Account & Join Project"

# 9. Welcome page appears
See: Project stats, quick actions

# 10. Click "Go to Dashboard"
✅ Consultant is now in the system!

# 11. Return to admin account
Go to: Project Details
Check: Team panel
✅ New consultant appears in team list!
```

---

## 📧 Email Template Features

### Design Elements

- **Header**: Blue gradient with Olumba logo
- **Body**: Clean white background
- **Project Card**: Light blue background with border
- **CTA Button**: Large, blue, centered
- **Link Box**: Fallback link in grey box
- **Instructions**: Step-by-step guide
- **Footer**: Professional, linked footer

### Content Includes

✅ Inviter name
✅ Company name
✅ Project name & description
✅ Role assignment
✅ Personal message (if provided)
✅ Secure invitation link
✅ Instructions (4 steps)
✅ Expiration warning (7 days)
✅ Olumba branding

### Email Responsiveness

- Mobile-friendly design
- Readable on all devices
- Button sized for touch
- Link wrapping handled

---

## 🔗 API Integration Examples

### Frontend: Invite Consultant

```javascript
// In project detail page
async function inviteConsultant() {
  const email = 'consultant@example.com';
  const message = 'Welcome to the project!';
  
  const result = await users.inviteConsultant(email, projectId, message);
  
  console.log('Invitation sent!');
  console.log('Link:', result.invitationLink);
  console.log('Email sent:', result.email_sent);
}
```

### Frontend: Validate Invitation

```javascript
// In consultant signup page
const token = urlParams.get('token');
const inviteData = await auth.validateInvitation(token);

console.log('Project:', inviteData.project_name);
console.log('Company:', inviteData.company_name);
console.log('Invited by:', inviteData.inviter_name);
```

### Frontend: Register Consultant

```javascript
// After consultant fills form
await auth.register({
  email: inviteData.email,
  password: userPassword,
  full_name: 'John Smith',
  company_name: 'ABC Consulting',
  job_title: 'Structural Engineer',
  discipline: 'Structural Engineering',
  invitation_token: token
});

// Auto-redirects to welcome page
// User is now in system and assigned to project
```

---

## 🎨 Branding Consistency

All consultant invitation components match Olumba's design:

**Colors**:
- Primary: #2171f2 (Vibrant Blue)
- Success: #22C55E (Lime Green)
- Background: #FFFFFF / #F3F4F6
- Text: #22223B

**Typography**:
- Font: Inter
- Weights: 400, 500, 700, 900

**Components**:
- Rounded corners (8px, 12px)
- Consistent shadows
- Material icons
- Smooth transitions

---

## 📋 Audit & Compliance

### Activity Logging

Every consultant invitation creates an audit entry:

```sql
activity_log:
- user_id: Admin who sent invitation
- action: 'invite_consultant'
- entity_type: 'project'
- entity_id: project ID
- details: JSON with email & invitation ID
- timestamp: Auto-generated
```

### Invitation Tracking

```sql
invitations:
- Who invited (invited_by)
- When invited (created_at)
- Acceptance status (pending/accepted)
- Token (for security audit)
- Expiration (compliance)
```

### Access Control

- Only project admins/members can invite
- Consultants auto-get appropriate permissions
- File access level: Read + Comment
- Can't delete or modify (unless granted)

---

## 🚀 Quick Start

### 1. Invite a Consultant

```bash
1. Open: http://localhost:3000/project-detail.html?id=PROJECT_ID
2. Click: "Invite Consultant" (green button)
3. Enter: consultant@test.com
4. Send
5. Copy link from success message
```

### 2. Test as Consultant

```bash
1. Open link in new window/incognito
2. Create account
3. See welcome page
4. Access project
```

### 3. Verify in Admin View

```bash
1. Return to project details
2. Check team panel
3. ✅ Consultant is listed!
```

---

## 💡 Development Notes

### Console Logging (Dev Mode)

When SMTP is not configured, emails are logged to console:

```
📧 EMAIL WOULD BE SENT:
To: consultant@example.com
Subject: You're invited to join Office Building on Olumba
Link: http://localhost:3000/consultant-signup.html?token=abc-123-def

The email contains:
- Professional HTML template
- Project details
- Secure invitation link
- Instructions
```

### Production Deployment

To enable real emails:
1. Configure SMTP in .env
2. Test with real email service
3. Verify delivery
4. Monitor send logs

---

## 📈 Metrics & Tracking

### What's Logged

✅ Invitation sent (activity_log)
✅ Email delivery status
✅ Token validation attempts
✅ Successful signups
✅ Project assignments
✅ Failed attempts (for security)

### Admin Visibility

Admins can see:
- Who was invited
- When invitation was sent
- Invitation status
- Acceptance date
- Consultant's company

---

## 🎊 Features Summary

✅ **Email Invitations**: Professional branded emails
✅ **Secure Links**: UUID tokens, 7-day expiration
✅ **Auto-Assignment**: Consultant added to project automatically
✅ **File Access**: Immediate access to project documents
✅ **Dual Auth**: New signup or existing login
✅ **Company Registration**: Consultants can register their own company
✅ **Welcome Experience**: Guided onboarding to project
✅ **Audit Trail**: Complete logging for compliance
✅ **Branded Design**: Consistent with Olumba identity
✅ **Mobile-Friendly**: Responsive email & pages

---

## 🎯 Success Criteria Met

✅ **Allow admins to invite** → Button on project page
✅ **Generate secure link** → UUID token with expiration
✅ **Send email** → Nodemailer with HTML template
✅ **Clear CTA** → "Join Project on Olumba" button
✅ **Instructions** → 4-step guide in email
✅ **Signup/Login** → Both flows supported
✅ **Auto-associate** → Added to project automatically
✅ **Grant file access** → Consultant role permissions
✅ **Welcome page** → Project summary & actions
✅ **Audit logging** → Complete event tracking
✅ **Olumba branding** → All components styled
✅ **Modular code** → Reusable components
✅ **Documented** → This guide + code comments

---

## 🎉 You're All Set!

**The consultant invitation flow is complete and fully functional!**

### Quick Test:
1. Go to: http://localhost:3000/project-detail.html?id=PROJECT_ID
2. Click "Invite Consultant"
3. Send invitation
4. Check console for email preview
5. Copy link and test signup

**All components working, emails configured, and audit trail logging! 🚀**
