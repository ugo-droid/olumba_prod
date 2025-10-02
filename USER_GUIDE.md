# 📘 Olumba User Guide

## 🚀 Getting Started

### Your App is Running!
The Olumba server is live at: **http://localhost:3000**

## 🔐 Login

### Available Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing Page | http://localhost:3000 | Public homepage |
| Login | http://localhost:3000/login.html | Sign in |
| Dashboard | http://localhost:3000/dashboard.html | Main overview |
| Projects | http://localhost:3000/projects.html | Project management |
| Tasks | http://localhost:3000/tasks.html | Task list |
| Team | http://localhost:3000/team.html | Team management (Admin only) |
| Notifications | http://localhost:3000/notifications.html | Notification center |
| Settings | http://localhost:3000/settings.html | User settings |

### Demo Accounts

**Admin Account** (Full access):
- Email: `admin@stellar.com`
- Password: `password123`
- Can: Create projects, invite users, manage company

**Member Account** (Regular user):
- Email: `sarah@stellar.com`
- Password: `password123`
- Can: Access assigned projects, create tasks

## ✨ Features Guide

### 1. Dashboard
- **Overview**: See all your projects and tasks at a glance
- **Stats Cards**: View total projects, active tasks, completed tasks, and overdue items
- **Quick Links**: Click on any project or task to drill down

### 2. Projects
- **View All Projects**: See all projects you have access to
- **Create New Project**:
  1. Click "New Project" button
  2. Fill in project name (required)
  3. Add description, dates (optional)
  4. Click "Create Project"
- **Project Cards**: Show status, member count, overdue tasks
- **Status Types**: Planning, In Progress, On Hold, Completed

### 3. Tasks
- **View All Tasks**: See all tasks assigned to you
- **Filter Tasks**: Use tabs to filter by status (All, Pending, In Progress, Completed)
- **Update Status**: Click the dropdown to change task status
- **Task Details**: Shows project name, due date, priority

### 4. Team (Admin Only)
- **View Team**: See all company members
- **Invite Members**:
  1. Click "Invite Member" button
  2. Enter email and select role
  3. Copy invitation link and share
- **User Roles**:
  - **Admin**: Full access to everything
  - **Member**: Company employee access
  - **Consultant**: External consultant
  - **Client**: Read-only project access
  - **Guest**: Temporary viewer

### 5. Notifications
- **View Notifications**: See all system notifications
- **Mark as Read**: Click any notification
- **Mark All Read**: Click "Mark all as read" button
- **Notification Types**:
  - Task assignments
  - Document uploads
  - Comments and mentions
  - Permission changes

### 6. Settings
- **Profile Information**: Update your name, job title, discipline
- **Notification Preferences**: 
  - Toggle email notifications
  - Toggle in-app notifications
  - Control task assignment notifications
- **Security**: MFA setup (admin users)

## 🎨 Navigation

### Consistent Layout
All authenticated pages now have:
- **Left Sidebar**:
  - User info at top
  - Main navigation links
  - Settings at bottom
  - Logout button
- **Top Header**:
  - Olumba logo
  - Global search
  - Notification bell with badge
- **Main Content Area**:
  - Page-specific content

### Sidebar Links
- 🏠 Dashboard - Home overview
- 📁 Projects - Project management
- ✅ Tasks - Your task list
- 👥 Team - Team management (Admin)
- 🔔 Notifications - Notification center
- ⚙️ Settings - User preferences
- 🚪 Logout - Sign out

## 💡 Tips & Tricks

### Creating Projects
1. Go to Projects page
2. Click "+ New Project"
3. Only "Project Name" is required
4. Dates and description are optional
5. Projects start in "Planning" status

### Managing Tasks
- Update task status directly from the dropdown
- Filter tasks using the tabs at the top
- Tasks show their project and due date
- Priority levels: Low, Medium, High, Urgent

### Inviting Users
- Only admins can invite users
- Invitation links expire in 7 days
- Share the generated link with the invitee
- They'll register and join your company

### Notifications
- Bell icon shows unread count
- Click bell to go to notifications
- Unread notifications have a blue dot
- Configure preferences in Settings

## 🔍 Troubleshooting

### Can't Login?
- Ensure you're using correct credentials
- Try: admin@stellar.com / password123
- Check browser console for errors

### Projects Not Loading?
- Refresh the page
- Check if you're logged in
- Verify you have permission to view projects

### Sidebar Goes to Landing Page?
- This is now fixed with consistent navigation
- All pages use the same sidebar component
- Navigation is persistent across pages

### Can't Create Projects?
- This is now fixed
- Ensure you're logged in as admin or member
- Only project name is required

## 🎯 Workflow Example

### Typical User Flow
1. **Login** → Use demo credentials
2. **View Dashboard** → See overview
3. **Create Project** → Go to Projects, click New
4. **Invite Team** → Go to Team, invite members
5. **Manage Tasks** → View and update tasks
6. **Configure Settings** → Update profile and preferences

### Admin Workflow
1. Login as admin
2. Create company projects
3. Invite team members
4. Assign users to projects
5. Monitor progress on dashboard

### Member Workflow
1. Login as member
2. View assigned projects
3. Complete tasks
4. Update task status
5. Receive notifications

## 📱 Responsive Design

The app works on:
- ✅ Desktop (optimal experience)
- ✅ Tablet (responsive layout)
- ✅ Mobile (touch-friendly)

## 🔐 Security Notes

- Passwords are hashed with bcrypt
- JWT tokens expire after 7 days
- Sessions are tracked in database
- Activity is logged
- MFA available for enhanced security

## 📊 Data Management

### Current Demo Data
- 1 Company: "Stellar Structures Inc."
- 2 Users: Admin and Member
- 1 Project: "Grandview Residences"
- 1 Task: "Review architectural plans"

### Adding More Data
- Create projects via UI
- Invite users via Team page
- Tasks auto-created when projects created

## 🎉 You're Ready!

Open your browser to **http://localhost:3000** and start exploring!

---

**Need help?** Check README.md or QUICKSTART.md for more information.
