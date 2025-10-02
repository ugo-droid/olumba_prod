import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../database/db.js';
import { authenticateToken, checkProjectAccess } from '../middleware/auth.js';

const router = express.Router();

// Get all city approvals for user's projects
router.get('/', authenticateToken, (req, res) => {
    try {
        let approvals;
        
        if (req.user.role === 'admin' || req.user.role === 'member') {
            // Get all approvals for company projects
            approvals = dbHelpers.all(
                `SELECT ca.*, p.name as project_name, u.full_name as created_by_name,
                 (SELECT COUNT(*) FROM corrections WHERE approval_id = ca.id AND status != 'resolved') as pending_corrections
                 FROM city_approvals ca
                 JOIN projects p ON ca.project_id = p.id
                 LEFT JOIN users u ON ca.created_by = u.id
                 WHERE p.company_id = ?
                 ORDER BY ca.submission_date DESC`,
                [req.user.company_id]
            );
        } else {
            // Get approvals for user's assigned projects
            approvals = dbHelpers.all(
                `SELECT ca.*, p.name as project_name, u.full_name as created_by_name,
                 (SELECT COUNT(*) FROM corrections WHERE approval_id = ca.id AND status != 'resolved') as pending_corrections
                 FROM city_approvals ca
                 JOIN projects p ON ca.project_id = p.id
                 JOIN project_members pm ON p.id = pm.project_id
                 LEFT JOIN users u ON ca.created_by = u.id
                 WHERE pm.user_id = ?
                 ORDER BY ca.submission_date DESC`,
                [req.user.id]
            );
        }
        
        res.json(approvals);
    } catch (error) {
        console.error('Get city approvals error:', error);
        res.status(500).json({ error: 'Failed to get city approvals' });
    }
});

// Get single city approval with corrections
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const approval = dbHelpers.get(
            `SELECT ca.*, p.name as project_name, u.full_name as created_by_name
             FROM city_approvals ca
             JOIN projects p ON ca.project_id = p.id
             LEFT JOIN users u ON ca.created_by = u.id
             WHERE ca.id = ?`,
            [req.params.id]
        );
        
        if (!approval) {
            return res.status(404).json({ error: 'Approval not found' });
        }
        
        // Get corrections for this approval
        const corrections = dbHelpers.all(
            `SELECT c.*, u.full_name as assigned_to_name
             FROM corrections c
             LEFT JOIN users u ON c.assigned_to = u.id
             WHERE c.approval_id = ?
             ORDER BY c.created_at ASC`,
            [req.params.id]
        );
        
        approval.corrections = corrections;
        
        res.json(approval);
    } catch (error) {
        console.error('Get approval error:', error);
        res.status(500).json({ error: 'Failed to get approval' });
    }
});

// Create new submittal
router.post('/', authenticateToken, (req, res) => {
    try {
        const {
            project_id,
            submittal_name,
            submittal_type,
            city_jurisdiction,
            plan_check_number,
            submission_date,
            city_official,
            deadline,
            notes,
            document_ids
        } = req.body;
        
        if (!project_id || !submittal_name) {
            return res.status(400).json({ error: 'project_id and submittal_name are required' });
        }
        
        // Check project access
        const access = dbHelpers.get(
            `SELECT * FROM project_members WHERE project_id = ? AND user_id = ?
             UNION
             SELECT p.id as id, p.id as project_id, p.created_by as user_id, 'owner' as role, datetime('now') as created_at
             FROM projects p WHERE p.id = ? AND p.created_by = ?`,
            [project_id, req.user.id, project_id, req.user.id]
        );
        
        if (!access && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        const approvalId = uuidv4();
        
        dbHelpers.run(
            `INSERT INTO city_approvals (id, project_id, submittal_name, submittal_type, city_jurisdiction, plan_check_number, submission_date, city_official, deadline, notes, document_ids, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`,
            [
                approvalId,
                project_id,
                submittal_name,
                submittal_type || null,
                city_jurisdiction || null,
                plan_check_number || null,
                submission_date || new Date().toISOString().split('T')[0],
                city_official || null,
                deadline || null,
                notes || null,
                document_ids || null,
                req.user.id
            ]
        );
        
        // Create notification for project team
        const projectMembers = dbHelpers.all(
            'SELECT user_id FROM project_members WHERE project_id = ?',
            [project_id]
        );
        
        projectMembers.forEach(member => {
            if (member.user_id !== req.user.id) {
                dbHelpers.run(
                    `INSERT INTO notifications (id, user_id, type, title, message, link)
                     VALUES (?, ?, 'approval_status', 'New City Submittal', ?, ?)`,
                    [uuidv4(), member.user_id, `${submittal_name} has been submitted for approval`, `/city-approvals/${approvalId}`]
                );
            }
        });
        
        // Log activity
        dbHelpers.run(
            'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'create', 'city_approval', approvalId]
        );
        
        const approval = dbHelpers.get('SELECT * FROM city_approvals WHERE id = ?', [approvalId]);
        res.status(201).json(approval);
    } catch (error) {
        console.error('Create approval error:', error);
        res.status(500).json({ error: 'Failed to create submittal' });
    }
});

// Update approval status
router.put('/:id/status', authenticateToken, (req, res) => {
    try {
        const { status, city_official, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const validStatuses = ['submitted', 'under_review', 'corrections_required', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const updates = ['status = ?', 'updated_at = datetime("now")'];
        const values = [status];
        
        if (city_official) {
            updates.push('city_official = ?');
            values.push(city_official);
        }
        
        if (notes) {
            updates.push('notes = ?');
            values.push(notes);
        }
        
        values.push(req.params.id);
        
        dbHelpers.run(
            `UPDATE city_approvals SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        // Get the approval to find project members
        const approval = dbHelpers.get(
            'SELECT * FROM city_approvals WHERE id = ?',
            [req.params.id]
        );
        
        // Notify project team
        const projectMembers = dbHelpers.all(
            'SELECT user_id FROM project_members WHERE project_id = ?',
            [approval.project_id]
        );
        
        const statusMessages = {
            'under_review': 'is now under review',
            'corrections_required': 'requires corrections',
            'approved': 'has been approved!',
            'rejected': 'has been rejected'
        };
        
        projectMembers.forEach(member => {
            dbHelpers.run(
                `INSERT INTO notifications (id, user_id, type, title, message, link)
                 VALUES (?, ?, 'approval_status', 'Submittal Status Update', ?, ?)`,
                [uuidv4(), member.user_id, `${approval.submittal_name} ${statusMessages[status] || 'status updated'}`, `/city-approvals/${req.params.id}`]
            );
        });
        
        const updated = dbHelpers.get('SELECT * FROM city_approvals WHERE id = ?', [req.params.id]);
        res.json(updated);
    } catch (error) {
        console.error('Update approval status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Add correction to approval
router.post('/:id/corrections', authenticateToken, (req, res) => {
    try {
        const { description, assigned_to, due_date } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }
        
        const correctionId = uuidv4();
        
        dbHelpers.run(
            `INSERT INTO corrections (id, approval_id, description, assigned_to, due_date, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [correctionId, req.params.id, description, assigned_to || null, due_date || null]
        );
        
        // Create notification for assigned user
        if (assigned_to) {
            const approval = dbHelpers.get('SELECT * FROM city_approvals WHERE id = ?', [req.params.id]);
            
            dbHelpers.run(
                `INSERT INTO notifications (id, user_id, type, title, message, link)
                 VALUES (?, ?, 'task_assigned', 'Correction Required', ?, ?)`,
                [uuidv4(), assigned_to, `New correction needed for ${approval.submittal_name}`, `/city-approvals/${req.params.id}`]
            );
        }
        
        const correction = dbHelpers.get('SELECT * FROM corrections WHERE id = ?', [correctionId]);
        res.status(201).json(correction);
    } catch (error) {
        console.error('Add correction error:', error);
        res.status(500).json({ error: 'Failed to add correction' });
    }
});

// Update correction status
router.put('/corrections/:correctionId', authenticateToken, (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        dbHelpers.run(
            'UPDATE corrections SET status = ?, updated_at = datetime("now") WHERE id = ?',
            [status, req.params.correctionId]
        );
        
        // If all corrections are resolved, update approval status
        const correction = dbHelpers.get('SELECT * FROM corrections WHERE id = ?', [req.params.correctionId]);
        
        if (status === 'resolved') {
            const pendingCorrections = dbHelpers.get(
                'SELECT COUNT(*) as count FROM corrections WHERE approval_id = ? AND status != "resolved"',
                [correction.approval_id]
            );
            
            if (pendingCorrections.count === 0) {
                dbHelpers.run(
                    'UPDATE city_approvals SET status = "under_review" WHERE id = ?',
                    [correction.approval_id]
                );
            }
        }
        
        const updated = dbHelpers.get('SELECT * FROM corrections WHERE id = ?', [req.params.correctionId]);
        res.json(updated);
    } catch (error) {
        console.error('Update correction error:', error);
        res.status(500).json({ error: 'Failed to update correction' });
    }
});

// Delete approval
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        dbHelpers.run('DELETE FROM city_approvals WHERE id = ?', [req.params.id]);
        
        res.json({ message: 'Approval deleted successfully' });
    } catch (error) {
        console.error('Delete approval error:', error);
        res.status(500).json({ error: 'Failed to delete approval' });
    }
});

export default router;
