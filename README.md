# Olumba - Modern AEC Project Management Platform

> **🚀 Now with Supabase Backend Integration**

Olumba is a comprehensive project management platform designed specifically for Architecture, Engineering, and Construction (AEC) firms. Built with modern cloud infrastructure, it streamlines collaboration, document management, and project tracking for teams working on complex building projects.

## ✨ Key Features

### 🏗️ **Project Management**
- Create, organize, and track multiple projects
- Real-time project status updates
- Budget and timeline tracking
- Project-based access control

### 👥 **Team Collaboration**
- Role-based access control (Admin, Member, Consultant, Client, Guest)
- Real-time communication hub with mentions
- Project-specific team management
- Secure consultant invitations

### ✅ **Task Management**
- Assign, track, and manage project tasks
- Priority levels and due date tracking
- Task status workflows
- Automated notifications

### 📁 **Document Management**
- Secure file upload with version control
- Support for CAD files (.dwg, .rvt), PDFs, and more
- Document sharing with access controls
- File organization by discipline

### 🏛️ **City Approvals Tracking**
- Monitor permit applications and approval processes
- Track submission deadlines
- Manage reviewer feedback and corrections
- Approval status notifications

### 🔔 **Real-time Features**
- Live notifications and updates
- Email notifications for mentions and assignments
- Activity logging and audit trails
- Real-time collaboration

## 🏗️ **Architecture**

### **Frontend**
- **HTML5, CSS3, JavaScript**: Modern web standards
- **Tailwind CSS**: Utility-first styling
- **Supabase JS Client**: Real-time data synchronization
- **Material Icons**: Consistent UI design

### **Backend & Database**
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Node.js + Express**: API server
- **Row Level Security (RLS)**: Data isolation and security
- **JWT Authentication**: Secure user sessions

### **Storage & Files**
- **Supabase Storage**: Scalable file storage with CDN
- **Access Control**: Project-based file permissions
- **Version Control**: Document versioning system

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 16+
- Supabase account (free tier available)
- Git

### **Installation**
```bash
# Clone the repository
git clone https://github.com/yourusername/olumba-webapp.git
cd olumba-webapp

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm start
```

Visit: http://localhost:3000

### **Supabase Setup**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema: `supabase/schema-fixed.sql`
3. Apply security policies: `supabase/rls-policies-fixed.sql`
4. Set up storage: `supabase/storage-setup.sql`
5. Update your `.env` and `public/js/config.js` files

📖 **Detailed setup instructions**: [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)

## 🗂️ **Project Structure**

```
olumba-webapp/
├── public/                    # Frontend application
│   ├── assets/               # Static assets (logos, images)
│   ├── js/                   # JavaScript modules
│   │   ├── config.js         # Frontend configuration
│   │   ├── supabaseClient.js # Supabase client setup
│   │   ├── api.js           # API helpers
│   │   └── nav.js           # Navigation component
│   ├── css/                 # Custom stylesheets
│   ├── *.html              # Application pages
│   └── supabase-test.html  # Connection testing page
├── server/                   # Backend API
│   ├── config/              # Server configuration
│   ├── services/            # Business logic services
│   ├── middleware/          # Authentication middleware
│   ├── routes/              # API endpoints
│   └── index.js            # Server entry point
├── supabase/                # Database setup
│   ├── schema-fixed.sql     # Database schema
│   ├── rls-policies-fixed.sql # Security policies
│   ├── storage-setup.sql    # File storage setup
│   └── sample-data.sql      # Test data
└── docs/                    # Documentation
    ├── SUPABASE_SETUP_GUIDE.md
    ├── MIGRATION_CHECKLIST.md
    └── SUPABASE_INTEGRATION_SUMMARY.md
```

## 🔐 **Security Features**

### **Authentication & Authorization**
- JWT-based authentication via Supabase Auth
- Role-based access control
- Project-level permissions
- Secure password requirements

### **Data Security**
- Row Level Security (RLS) on all tables
- Company data isolation
- Project-based access controls
- Encrypted data transmission

### **File Security**
- Secure file uploads with type validation
- Access control based on project membership
- Signed URLs for file access
- Storage policies for different file types

## 🌟 **User Roles**

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | System administrator | Full system access, user management |
| **Member** | Company team member | Full project access within company |
| **Consultant** | External consultant | Limited access to assigned projects |
| **Client** | Project client | View-only access to specific projects |
| **Guest** | Temporary user | Restricted access for specific purposes |

## 📊 **Features Overview**

### **Dashboard**
- Project overview and statistics
- Recent activity feed
- Task assignments and deadlines
- Quick access to key features

### **Project Management**
- Project creation and configuration
- Team member management
- Budget and timeline tracking
- Status reporting

### **Communication Hub**
- Project-specific messaging
- User mentions with email notifications
- File sharing in conversations
- Activity timeline

### **Document Management**
- Drag-and-drop file uploads
- Version control and history
- Discipline-based organization
- Secure sharing and access control

### **City Approvals**
- Submission tracking
- Review status monitoring
- Deadline management
- Reviewer communication

## 🔧 **Configuration**

### **Environment Variables**
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

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
```

### **Frontend Configuration**
```javascript
// public/js/config.js
window.SUPABASE_URL = 'your_supabase_project_url';
window.SUPABASE_ANON_KEY = 'your_supabase_anon_key';
```

## 🧪 **Testing**

### **Connection Testing**
Visit http://localhost:3000/supabase-test.html to verify:
- Supabase client initialization
- Database connectivity
- Authentication system
- API endpoints

### **Feature Testing**
- User registration and login
- Project creation and management
- Task assignment and tracking
- File upload and download
- Real-time notifications
- Email delivery

## 🚀 **Deployment**

### **Production Checklist**
- [ ] Set up production Supabase project
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Enable SSL/HTTPS
- [ ] Configure email service
- [ ] Set up monitoring and backups
- [ ] Test all functionality

### **Hosting Options**
- **Vercel**: Seamless deployment with Supabase
- **Netlify**: Static site hosting with serverless functions
- **Railway**: Full-stack deployment
- **DigitalOcean**: VPS deployment
- **AWS/GCP/Azure**: Enterprise cloud deployment

## 📈 **Scalability**

### **Database Scaling**
- PostgreSQL with automatic scaling via Supabase
- Connection pooling and optimization
- Read replicas for high availability
- Point-in-time recovery

### **Storage Scaling**
- CDN-backed file storage
- Global edge locations
- Automatic image optimization
- Unlimited storage capacity

### **Performance**
- Real-time subscriptions
- Optimized queries with indexes
- Caching strategies
- Global CDN distribution

## 🤝 **Contributing**

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Set up your development environment
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## 📚 **Documentation**

- **[Setup Instructions](SETUP_INSTRUCTIONS.md)**: Complete setup guide
- **[Supabase Setup Guide](SUPABASE_SETUP_GUIDE.md)**: Detailed Supabase configuration
- **[Migration Checklist](MIGRATION_CHECKLIST.md)**: Migration from other systems
- **[Integration Summary](SUPABASE_INTEGRATION_SUMMARY.md)**: Technical overview

## 🆘 **Support**

### **Getting Help**
- 📖 Check the documentation
- 🔍 Search existing issues
- 💬 Join our community discussions
- 📧 Contact support: support@olumba.com

### **Resources**
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Node.js Documentation](https://nodejs.org/docs)

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 **Roadmap**

### **Coming Soon**
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] CAD software integrations
- [ ] Workflow automation
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Third-party API integrations

### **Recently Added**
- [x] Supabase backend integration
- [x] Real-time collaboration
- [x] Enhanced security with RLS
- [x] Scalable file storage
- [x] Email notifications
- [x] Modern authentication system

---

**Built with ❤️ for the AEC industry**

*Empowering architecture, engineering, and construction teams to deliver projects faster, smarter, and more collaboratively.*