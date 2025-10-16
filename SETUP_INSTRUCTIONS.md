# Olumba Setup Instructions

This guide helps you set up the Olumba project locally after cloning from GitHub.

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/YOUR_USERNAME/olumba-webapp.git
cd olumba-webapp
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your Supabase credentials
nano .env  # or use your preferred editor
```

### 3. Supabase Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and API keys

2. **Update .env file**:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Set up Database**:
   - Go to your Supabase dashboard → SQL Editor
   - Run `supabase/schema-fixed.sql`
   - Run `supabase/rls-policies-fixed.sql`
   - Run `supabase/storage-setup.sql`

4. **Update Frontend Config**:
   ```javascript
   // Edit public/js/config.js
   window.SUPABASE_URL = 'your_supabase_project_url';
   window.SUPABASE_ANON_KEY = 'your_supabase_anon_key';
   ```

### 4. Start Development Server
```bash
npm start
```

Visit: http://localhost:3000

## 📋 Features

- ✅ **Authentication**: User registration, login, role management
- ✅ **Project Management**: Create, manage, and collaborate on projects
- ✅ **Task Management**: Assign and track tasks
- ✅ **Document Management**: Upload and version control documents
- ✅ **Communication Hub**: Team messaging with mentions
- ✅ **City Approvals**: Track permit and approval processes
- ✅ **Real-time Updates**: Live notifications and updates
- ✅ **File Storage**: Secure file uploads with access control
- ✅ **Role-based Access**: Admin, Member, Consultant, Client roles

## 🗄️ Database Schema

The project includes a complete database schema with:
- Companies and user management
- Project and task tracking
- Document versioning
- Communication system
- Activity logging
- City approval tracking

## 🔐 Security

- Row Level Security (RLS) enabled
- JWT-based authentication
- Project-based access control
- Secure file storage
- Data isolation between companies

## 📚 Documentation

- `SUPABASE_SETUP_GUIDE.md` - Detailed Supabase setup
- `MIGRATION_CHECKLIST.md` - Migration from other systems
- `SUPABASE_INTEGRATION_SUMMARY.md` - Technical overview

## 🛠️ Development

### Project Structure
```
olumba-webapp/
├── public/           # Frontend files
├── server/           # Backend API
├── supabase/         # Database schema and setup
└── docs/            # Documentation
```

### Key Technologies
- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## 🧪 Testing

Test your setup:
1. Visit http://localhost:3000/supabase-test.html
2. Check connection status
3. Try user registration
4. Test file uploads

## 🚨 Troubleshooting

### Common Issues

1. **"Supabase client not initialized"**
   - Check your .env file has correct credentials
   - Verify frontend config.js is updated

2. **"Database connection failed"**
   - Ensure database schema is set up
   - Check RLS policies are applied

3. **"File upload failed"**
   - Verify storage buckets are created
   - Check storage policies

### Support

- Check the documentation files
- Review Supabase dashboard for errors
- Ensure all environment variables are set

## 📄 License

[Your License Here]

## 🤝 Contributing

[Your contribution guidelines here]
