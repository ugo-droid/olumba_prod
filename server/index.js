import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import database (keep for backward compatibility during migration)
import { initializeDatabase } from './database/db.js';

// Import Supabase configuration (for database operations)
import './config/supabase.js';

// Import Clerk configuration
import './config/clerk.js';

// Import routes
import authRoutes from './routes/auth.js';
import supabaseAuthRoutes from './routes/supabaseAuth.js';
import clerkAuthRoutes from './routes/clerkAuth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import cityApprovalRoutes from './routes/cityApprovals.js';
import documentRoutes from './routes/documents.js';
import messageRoutes from './routes/messages.js';
import searchRoutes from './routes/search.js';
import clerkWebhookRoutes from './routes/clerkWebhooks.js';
import clerkBillingWebhookRoutes from './routes/clerkBillingWebhooks.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize database
try {
    initializeDatabase();
    console.log('✅ Database initialized');
} catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
}

// API Routes
app.use('/api/auth', clerkAuthRoutes); // New Clerk auth routes
app.use('/api/auth/supabase', supabaseAuthRoutes); // Supabase auth routes (deprecated)
app.use('/api/auth/legacy', authRoutes); // Legacy auth routes (deprecated)
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/city-approvals', cityApprovalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/webhooks', clerkWebhookRoutes);
app.use('/api/webhooks', clerkBillingWebhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all non-API routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 Olumba Server Started
    
    📍 Server running on: http://localhost:${PORT}
    📚 API available at: http://localhost:${PORT}/api
    
    Environment: ${process.env.NODE_ENV || 'development'}
    `);
});

export default app;
