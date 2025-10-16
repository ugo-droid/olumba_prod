import express from 'express';
import { dbHelpers } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Global search endpoint
router.get('/', authenticateToken, (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ projects: [], tasks: [], documents: [], users: [] });
        }
        
        const searchTerm = `%${q}%`;
        
        // Search projects
        const projects = dbHelpers.all(
            `SELECT p.*, 'project' as type
             FROM projects p
             WHERE p.company_id = ? AND (
                 p.name LIKE ? OR 
                 p.description LIKE ? OR 
                 p.address LIKE ?
             )
             LIMIT 10`,
            [req.user.company_id, searchTerm, searchTerm, searchTerm]
        );
        
        // Search tasks
        const tasks = dbHelpers.all(
            `SELECT t.*, p.name as project_name, 'task' as type
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE p.company_id = ? AND (
                 t.name LIKE ? OR 
                 t.description LIKE ?
             )
             LIMIT 10`,
            [req.user.company_id, searchTerm, searchTerm]
        );
        
        // Search documents
        const documents = dbHelpers.all(
            `SELECT d.*, p.name as project_name, 'document' as type
             FROM documents d
             JOIN projects p ON d.project_id = p.id
             WHERE p.company_id = ? AND d.name LIKE ?
             LIMIT 10`,
            [req.user.company_id, searchTerm]
        );
        
        // Search users (admin only)
        let users = [];
        if (req.user.role === 'admin') {
            users = dbHelpers.all(
                `SELECT id, full_name, email, job_title, role, 'user' as type
                 FROM users
                 WHERE company_id = ? AND (
                     full_name LIKE ? OR 
                     email LIKE ? OR 
                     job_title LIKE ?
                 )
                 LIMIT 10`,
                [req.user.company_id, searchTerm, searchTerm, searchTerm]
            );
        }
        
        res.json({
            projects,
            tasks,
            documents,
            users,
            total: projects.length + tasks.length + documents.length + users.length
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
