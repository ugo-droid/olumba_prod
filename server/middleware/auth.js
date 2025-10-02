import jwt from 'jsonwebtoken';
import { dbHelpers } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if session exists and is valid
        const session = dbHelpers.get(
            'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
            [token]
        );
        
        if (!session) {
            return res.status(403).json({ error: 'Invalid or expired session' });
        }
        
        // Get user details
        const user = dbHelpers.get(
            'SELECT id, email, full_name, role, company_id, status FROM users WHERE id = ?',
            [decoded.userId]
        );
        
        if (!user || user.status !== 'active') {
            return res.status(403).json({ error: 'User not found or inactive' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Middleware to check user role
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        next();
    };
};

// Middleware to check company ownership
export const checkCompanyAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const companyId = req.params.companyId || req.body.company_id;
    
    if (req.user.role === 'admin' && req.user.company_id === companyId) {
        return next();
    }
    
    return res.status(403).json({ error: 'Access denied to this company' });
};

// Middleware to check project access
export const checkProjectAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const projectId = req.params.projectId || req.params.id || req.body.project_id;
    
    // Check if user has access to this project
    const access = dbHelpers.get(
        `SELECT pm.* FROM project_members pm
         JOIN projects p ON p.id = pm.project_id
         WHERE pm.project_id = ? AND pm.user_id = ?
         UNION
         SELECT NULL as id, p.id as project_id, p.created_by as user_id, 'owner' as role, datetime('now') as created_at
         FROM projects p
         WHERE p.id = ? AND p.created_by = ?`,
        [projectId, req.user.id, projectId, req.user.id]
    );
    
    if (!access) {
        return res.status(403).json({ error: 'Access denied to this project' });
    }
    
    req.projectRole = access.role;
    next();
};

// Generate JWT token
export const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );
};

// Log activity
export const logActivity = (userId, action, entityType, entityId, details = null) => {
    dbHelpers.run(
        'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [require('uuid').v4(), userId, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
};
