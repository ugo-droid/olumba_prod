# 🚀 Olumba Quick Start Guide

## Get Up and Running in 2 Minutes!

### 1. Open Your Browser
The server is already running! Open your browser and navigate to:
```
http://localhost:3000
```

### 2. Login with Demo Credentials
Use any of these demo accounts:

**Admin Account:**
- Email: `admin@stellar.com`
- Password: `password123`

**Regular User:**
- Email: `sarah@stellar.com`
- Password: `password123`

**Consultant:**
- Email: `consultant@greentech.com`
- Password: `password123`

**Client:**
- Email: `client@buildstream.com`
- Password: `password123`

### 3. Explore the Features

Once logged in, you can:

✅ **View Dashboard** - See projects, tasks, and activity overview
✅ **Browse Projects** - View all projects you have access to
✅ **Manage Tasks** - Create, assign, and track tasks
✅ **Invite Team Members** - Send invitations to collaborators
✅ **Update Your Profile** - Customize your user settings
✅ **Configure Notifications** - Set up your notification preferences

### 📱 Pages Available

- **Landing Page**: `/` - Public homepage
- **Login**: `/login.html` - Authentication
- **Dashboard**: `/dashboard.html` - Main overview
- **Projects**: `/projects.html` - Project management
- **Thank You**: `/thank-you.html` - Beta signup confirmation

### 🔧 Useful Commands

**Stop the Server:**
```bash
# Find the process
lsof -i :3000
# Kill it
kill -9 <PID>
```

**Restart the Server:**
```bash
npm start
```

**Reset Database:**
```bash
rm data/olumba.db
npm run init-db
npm run seed-db
```

### 📚 API Testing

The API is accessible at `http://localhost:3000/api`

**Test the Health Endpoint:**
```bash
curl http://localhost:3000/api/health
```

**Login via API:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stellar.com","password":"password123"}'
```

### 🎨 Key Features Demonstrated

1. **Authentication System**
   - JWT-based authentication
   - Secure password hashing
   - MFA support (can be enabled)
   - Session management

2. **Role-Based Access Control**
   - Different user roles with varying permissions
   - Company-level access control
   - Project-level permissions

3. **Project Management**
   - Create and manage projects
   - Assign team members
   - Track project status and deadlines

4. **Task Management**
   - Create tasks with assignments
   - Track task status and priorities
   - Subtasks support
   - Task dependencies

5. **Notification System**
   - Real-time in-app notifications
   - Customizable notification preferences
   - Email/SMS ready (configuration needed)

### 🔐 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ MFA support with TOTP
- ✅ Session management
- ✅ Activity logging
- ✅ Role-based access control

### 💡 Tips

- The admin account (`admin@stellar.com`) has full access to all features
- Try creating a new project to see the full workflow
- Invite team members to see collaboration features
- Check the Network tab in DevTools to see API calls in action

### 🐛 Troubleshooting

**Can't login?**
- Ensure the database was seeded: `npm run seed-db`
- Check the browser console for errors

**Server not responding?**
- Check if server is running: `lsof -i :3000`
- Restart the server: `npm start`

**Database errors?**
- Reset the database: `rm data/olumba.db && npm run init-db && npm run seed-db`

### 📖 Full Documentation

For complete documentation, see `README.md` in the project root.

---

**Enjoy exploring Olumba! 🎉**
