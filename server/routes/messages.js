import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Get messages for a project
router.get('/project/:projectId', authenticateToken, (req, res) => {
    try {
        const messages = dbHelpers.all(
            `SELECT m.*, u.full_name as sender_name, u.profile_photo
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id
             WHERE m.project_id = ? AND m.parent_message_id IS NULL
             ORDER BY m.created_at DESC
             LIMIT 50`,
            [req.params.projectId]
        );
        
        // Get replies for each message
        messages.forEach(message => {
            message.replies = dbHelpers.all(
                `SELECT m.*, u.full_name as sender_name, u.profile_photo
                 FROM messages m
                 LEFT JOIN users u ON m.sender_id = u.id
                 WHERE m.parent_message_id = ?
                 ORDER BY m.created_at ASC`,
                [message.id]
            );
        });
        
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Get activity log for a project
router.get('/activity/:projectId', authenticateToken, (req, res) => {
    try {
        const activities = dbHelpers.all(
            `SELECT al.*, u.full_name as user_name
             FROM activity_log al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.entity_id = ? OR al.entity_id IN (
                 SELECT id FROM tasks WHERE project_id = ?
             ) OR al.entity_id IN (
                 SELECT id FROM documents WHERE project_id = ?
             )
             ORDER BY al.created_at DESC
             LIMIT 50`,
            [req.params.projectId, req.params.projectId, req.params.projectId]
        );
        
        res.json(activities);
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Failed to get activity' });
    }
});

// Post a message
router.post('/', authenticateToken, (req, res) => {
    try {
        const { project_id, content, parent_message_id, mentions } = req.body;
        
        if (!project_id || !content) {
            return res.status(400).json({ error: 'project_id and content are required' });
        }
        
        const messageId = uuidv4();
        
        dbHelpers.run(
            `INSERT INTO messages (id, project_id, parent_message_id, sender_id, content, mentions)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [messageId, project_id, parent_message_id || null, req.user.id, content, mentions || null]
        );
        
        // Create notifications and send emails for mentions
        if (mentions) {
            const mentionedUserIds = JSON.parse(mentions);
            const project = dbHelpers.get('SELECT name FROM projects WHERE id = ?', [project_id]);
            
            mentionedUserIds.forEach(async userId => {
                // Create in-app notification
                dbHelpers.run(
                    `INSERT INTO notifications (id, user_id, type, title, message, link)
                     VALUES (?, ?, 'comment_mention', 'You were mentioned', ?, ?)`,
                    [uuidv4(), userId, `${req.user.full_name} mentioned you in a comment`, `/project-detail.html?id=${project_id}`]
                );
                
                // Send email notification
                try {
                    const mentionedUser = dbHelpers.get('SELECT full_name, email FROM users WHERE id = ?', [userId]);
                    if (mentionedUser && mentionedUser.email) {
                        const mentionData = {
                            mentioned_user_name: mentionedUser.full_name,
                            sender_name: req.user.full_name,
                            project_name: project?.name || 'Unknown Project',
                            message_content: content.length > 100 ? content.substring(0, 100) + '...' : content,
                            project_link: `${process.env.APP_URL || 'http://localhost:3000'}/project-detail.html?id=${project_id}`
                        };
                        
                        await emailService.sendMentionEmail(mentionedUser.email, mentionData);
                    }
                } catch (emailError) {
                    console.error('Failed to send mention email:', emailError);
                    // Don't fail the whole request if email fails
                }
            });
        }
        
        const message = dbHelpers.get('SELECT * FROM messages WHERE id = ?', [messageId]);
        res.status(201).json(message);
    } catch (error) {
        console.error('Post message error:', error);
        res.status(500).json({ error: 'Failed to post message' });
    }
});

// Update message
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const { content } = req.body;
        
        const message = dbHelpers.get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        if (message.sender_id !== req.user.id) {
            return res.status(403).json({ error: 'Can only edit your own messages' });
        }
        
        dbHelpers.run(
            'UPDATE messages SET content = ?, updated_at = datetime("now") WHERE id = ?',
            [content, req.params.id]
        );
        
        const updated = dbHelpers.get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
        res.json(updated);
    } catch (error) {
        console.error('Update message error:', error);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// Delete message
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const message = dbHelpers.get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        if (message.sender_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Can only delete your own messages' });
        }
        
        dbHelpers.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

export default router;
