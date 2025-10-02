import express from 'express';
import { dbHelpers } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, (req, res) => {
    try {
        const { read, limit = 50 } = req.query;
        
        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [req.user.id];
        
        if (read !== undefined) {
            query += ' AND read = ?';
            params.push(read === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const notifications = dbHelpers.all(query, params);
        
        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Get unread count
router.get('/unread-count', authenticateToken, (req, res) => {
    try {
        const result = dbHelpers.get(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
            [req.user.id]
        );
        
        res.json({ count: result.count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, (req, res) => {
    try {
        dbHelpers.run(
            'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// Mark all as read
router.put('/read-all', authenticateToken, (req, res) => {
    try {
        dbHelpers.run(
            'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0',
            [req.user.id]
        );
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        dbHelpers.run(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

export default router;
