import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../database/db.js';
import { authenticateToken, checkProjectAccess, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin: Get all projects in company with aggregates
router.get('/company', authenticateToken, authorize('admin'), (req, res) => {
    try {
        const projects = dbHelpers.all(
            `SELECT p.*, 
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'overdue') as overdue_tasks,
             (SELECT COUNT(*) FROM documents WHERE project_id = p.id AND is_latest = 1) as latest_documents,
             (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
             FROM projects p
             WHERE p.company_id = ?
             ORDER BY p.created_at DESC`,
            [req.user.company_id]
        );

        res.json(projects);
    } catch (error) {
        console.error('Admin company projects error:', error);
        res.status(500).json({ error: 'Failed to get company projects' });
    }
});

// Get all projects (filtered by user access)
router.get('/', authenticateToken, (req, res) => {
    try {
        let projects;
        
        if (req.user.role === 'admin') {
            // Admins see all company projects
            projects = dbHelpers.all(
                `SELECT p.*, 
                 (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'overdue') as overdue_tasks,
                 (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
                 FROM projects p
                 WHERE p.company_id = ?
                 ORDER BY p.created_at DESC`,
                [req.user.company_id]
            );
        } else {
            // Other users see only projects they're assigned to
            projects = dbHelpers.all(
                `SELECT DISTINCT p.*,
                 (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'overdue') as overdue_tasks,
                 (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
                 pm.role as my_role
                 FROM projects p
                 LEFT JOIN project_members pm ON p.id = pm.project_id
                 WHERE pm.user_id = ? OR p.created_by = ?
                 ORDER BY p.created_at DESC`,
                [req.user.id, req.user.id]
            );
        }
        
        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to get projects' });
    }
});

// Get single project
router.get('/:id', authenticateToken, checkProjectAccess, (req, res) => {
    try {
        const project = dbHelpers.get(
            `SELECT p.*, c.name as company_name,
             u.full_name as created_by_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
             (SELECT COUNT(*) FROM documents WHERE project_id = p.id AND is_latest = 1) as document_count
             FROM projects p
             LEFT JOIN companies c ON p.company_id = c.id
             LEFT JOIN users u ON p.created_by = u.id
             WHERE p.id = ?`,
            [req.params.id]
        );
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Get project members
        const members = dbHelpers.all(
            `SELECT pm.*, u.full_name, u.email, u.job_title, u.profile_photo
             FROM project_members pm
             JOIN users u ON pm.user_id = u.id
             WHERE pm.project_id = ?`,
            [req.params.id]
        );
        
        project.members = members;
        project.my_role = req.projectRole;
        
        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
});

// Create project
router.post('/', authenticateToken, authorize('admin', 'member'), (req, res) => {
    try {
        const {
            name,
            description,
            address,
            discipline,
            start_date,
            deadline,
            budget,
            members = []
        } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }
        
        const projectId = uuidv4();
        
        dbHelpers.run(
            `INSERT INTO projects (id, name, description, address, company_id, discipline, start_date, deadline, budget, created_by, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planning')`,
            [
                projectId, 
                name, 
                description || null, 
                address || null, 
                req.user.company_id, 
                discipline || null, 
                start_date || null, 
                deadline || null, 
                budget || null, 
                req.user.id
            ]
        );
        
        // Add project members if provided
        if (members.length > 0) {
            const insertMember = dbHelpers.prepare(
                'INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)'
            );
            
            members.forEach(member => {
                insertMember.run(uuidv4(), projectId, member.user_id, member.role);
            });
        }
        
        // Log activity
        dbHelpers.run(
            'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'create', 'project', projectId]
        );
        
        const project = dbHelpers.get('SELECT * FROM projects WHERE id = ?', [projectId]);
        
        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', authenticateToken, checkProjectAccess, (req, res) => {
    try {
        if (req.projectRole !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only project managers and admins can update projects' });
        }
        
        const { name, description, address, status, discipline, start_date, deadline, budget } = req.body;
        
        const updates = [];
        const values = [];
        
        if (name) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address); }
        if (status) { updates.push('status = ?'); values.push(status); }
        if (discipline) { updates.push('discipline = ?'); values.push(discipline); }
        if (start_date) { updates.push('start_date = ?'); values.push(start_date); }
        if (deadline) { updates.push('deadline = ?'); values.push(deadline); }
        if (budget !== undefined) { updates.push('budget = ?'); values.push(budget); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        updates.push('updated_at = datetime("now")');
        values.push(req.params.id);
        
        dbHelpers.run(
            `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        // Log activity
        dbHelpers.run(
            'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'update', 'project', req.params.id, JSON.stringify(req.body)]
        );
        
        const project = dbHelpers.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        
        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authenticateToken, checkProjectAccess, authorize('admin'), (req, res) => {
    try {
        dbHelpers.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
        
        // Log activity
        dbHelpers.run(
            'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'delete', 'project', req.params.id]
        );
        
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Add project member
router.post('/:id/members', authenticateToken, checkProjectAccess, (req, res) => {
    try {
        if (req.projectRole !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only project managers and admins can add members' });
        }
        
        const { user_id, role } = req.body;
        
        if (!user_id || !role) {
            return res.status(400).json({ error: 'user_id and role are required' });
        }
        
        // Check if user exists
        const user = dbHelpers.get('SELECT id FROM users WHERE id = ?', [user_id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if already a member
        const existing = dbHelpers.get(
            'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
            [req.params.id, user_id]
        );
        
        if (existing) {
            return res.status(400).json({ error: 'User is already a project member' });
        }
        
        const memberId = uuidv4();
        dbHelpers.run(
            'INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
            [memberId, req.params.id, user_id, role]
        );
        
        // Create notification
        dbHelpers.run(
            `INSERT INTO notifications (id, user_id, type, title, message, link)
             VALUES (?, ?, 'permission_change', 'Added to Project', 'You have been added to a project', ?)`,
            [uuidv4(), user_id, `/projects/${req.params.id}`]
        );
        
        res.status(201).json({ message: 'Member added successfully' });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Remove project member
router.delete('/:id/members/:userId', authenticateToken, checkProjectAccess, (req, res) => {
    try {
        if (req.projectRole !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only project managers and admins can remove members' });
        }
        
        dbHelpers.run(
            'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
            [req.params.id, req.params.userId]
        );
        
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

export default router;
