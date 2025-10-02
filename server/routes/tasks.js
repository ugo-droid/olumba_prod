import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../database/db.js';
import { authenticateToken, checkProjectAccess } from '../middleware/auth.js';

const router = express.Router();

// Get tasks for a project
router.get('/project/:projectId', authenticateToken, checkProjectAccess, (req, res) => {
    try {
        const tasks = dbHelpers.all(
            `SELECT t.*, u.full_name as assigned_to_name, c.full_name as created_by_name,
             (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) as subtask_count,
             (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND completed = 1) as completed_subtasks
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.id
             LEFT JOIN users c ON t.created_by = c.id
             WHERE t.project_id = ?
             ORDER BY 
               CASE t.status 
                 WHEN 'overdue' THEN 1
                 WHEN 'in_progress' THEN 2
                 WHEN 'pending' THEN 3
                 ELSE 4
               END,
               t.priority DESC,
               t.due_date ASC`,
            [req.params.projectId]
        );
        
        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

// Get tasks assigned to current user
router.get('/my-tasks', authenticateToken, (req, res) => {
    try {
        const tasks = dbHelpers.all(
            `SELECT t.*, p.name as project_name, c.full_name as created_by_name
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             LEFT JOIN users c ON t.created_by = c.id
             WHERE t.assigned_to = ?
             ORDER BY t.due_date ASC, t.priority DESC`,
            [req.user.id]
        );
        
        res.json(tasks);
    } catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

// Get single task
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const task = dbHelpers.get(
            `SELECT t.*, u.full_name as assigned_to_name, c.full_name as created_by_name, p.name as project_name
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.id
             LEFT JOIN users c ON t.created_by = c.id
             JOIN projects p ON t.project_id = p.id
             WHERE t.id = ?`,
            [req.params.id]
        );
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Get subtasks
        const subtasks = dbHelpers.all(
            'SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC',
            [req.params.id]
        );
        
        // Get dependencies
        const dependencies = dbHelpers.all(
            `SELECT td.*, t.name as task_name, t.status
             FROM task_dependencies td
             JOIN tasks t ON td.depends_on_task_id = t.id
             WHERE td.task_id = ?`,
            [req.params.id]
        );
        
        task.subtasks = subtasks;
        task.dependencies = dependencies;
        
        res.json(task);
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to get task' });
    }
});

// Create task
router.post('/', authenticateToken, (req, res) => {
    try {
        const { project_id, name, description, assigned_to, due_date, priority } = req.body;
        
        if (!project_id || !name) {
            return res.status(400).json({ error: 'project_id and name are required' });
        }
        
        // Check project access
        const access = dbHelpers.get(
            `SELECT * FROM project_members WHERE project_id = ? AND user_id = ?
             UNION
             SELECT p.id as id, p.id as project_id, p.created_by as user_id, 'owner' as role, datetime('now') as created_at
             FROM projects p WHERE p.id = ? AND p.created_by = ?`,
            [project_id, req.user.id, project_id, req.user.id]
        );
        
        if (!access) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        const taskId = uuidv4();
        
        dbHelpers.run(
            `INSERT INTO tasks (id, project_id, name, description, assigned_to, due_date, priority, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [taskId, project_id, name, description, assigned_to, due_date, priority || 'medium', req.user.id]
        );
        
        // Create notification for assigned user
        if (assigned_to) {
            dbHelpers.run(
                `INSERT INTO notifications (id, user_id, type, title, message, link)
                 VALUES (?, ?, 'task_assigned', 'New Task Assigned', ?, ?)`,
                [uuidv4(), assigned_to, `You have been assigned: ${name}`, `/tasks/${taskId}`]
            );
        }
        
        const task = dbHelpers.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const { name, description, assigned_to, due_date, status, priority } = req.body;
        
        const updates = [];
        const values = [];
        
        if (name) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (assigned_to !== undefined) { updates.push('assigned_to = ?'); values.push(assigned_to); }
        if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date); }
        if (status) { updates.push('status = ?'); values.push(status); }
        if (priority) { updates.push('priority = ?'); values.push(priority); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        updates.push('updated_at = datetime("now")');
        values.push(req.params.id);
        
        dbHelpers.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
        
        const task = dbHelpers.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Add subtask
router.post('/:id/subtasks', authenticateToken, (req, res) => {
    try {
        const { name, due_date } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Subtask name is required' });
        }
        
        const subtaskId = uuidv4();
        dbHelpers.run(
            'INSERT INTO subtasks (id, task_id, name, due_date) VALUES (?, ?, ?, ?)',
            [subtaskId, req.params.id, name, due_date]
        );
        
        const subtask = dbHelpers.get('SELECT * FROM subtasks WHERE id = ?', [subtaskId]);
        res.status(201).json(subtask);
    } catch (error) {
        console.error('Add subtask error:', error);
        res.status(500).json({ error: 'Failed to add subtask' });
    }
});

// Toggle subtask completion
router.put('/subtasks/:subtaskId/toggle', authenticateToken, (req, res) => {
    try {
        const subtask = dbHelpers.get('SELECT * FROM subtasks WHERE id = ?', [req.params.subtaskId]);
        
        if (!subtask) {
            return res.status(404).json({ error: 'Subtask not found' });
        }
        
        dbHelpers.run(
            'UPDATE subtasks SET completed = ? WHERE id = ?',
            [subtask.completed ? 0 : 1, req.params.subtaskId]
        );
        
        const updated = dbHelpers.get('SELECT * FROM subtasks WHERE id = ?', [req.params.subtaskId]);
        res.json(updated);
    } catch (error) {
        console.error('Toggle subtask error:', error);
        res.status(500).json({ error: 'Failed to toggle subtask' });
    }
});

// Delete task
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        dbHelpers.run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
