import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../database/db.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { sendConsultantInvite } from '../services/emailService.js';

const router = express.Router();

// Get all users in company (admin only)
router.get('/', authenticateToken, authorize('admin'), (req, res) => {
    try {
        const users = dbHelpers.all(
            `SELECT id, email, full_name, job_title, discipline, role, status, last_login, created_at
             FROM users
             WHERE company_id = ?
             ORDER BY created_at DESC`,
            [req.user.company_id]
        );
        
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Send invitation (general)
router.post('/invite', authenticateToken, authorize('admin'), (req, res) => {
    try {
        const { email, role, project_id } = req.body;
        
        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }
        
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        dbHelpers.run(
            `INSERT INTO invitations (id, email, role, company_id, project_id, invited_by, token, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), email, role, req.user.company_id, project_id || null, req.user.id, token, expiresAt]
        );
        
        const invitationLink = `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/register.html?token=${token}`;
        
        res.json({ message: 'Invitation sent successfully', invitationLink });
    } catch (error) {
        console.error('Send invitation error:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

// Send consultant invitation with email
router.post('/invite-consultant', authenticateToken, async (req, res) => {
    try {
        const { email, project_id, message } = req.body;
        
        if (!email || !project_id) {
            return res.status(400).json({ error: 'Email and project_id are required' });
        }
        
        // Check if user has access to this project
        const project = dbHelpers.get(
            `SELECT p.*, c.name as company_name
             FROM projects p
             LEFT JOIN companies c ON p.company_id = c.id
             WHERE p.id = ?`,
            [project_id]
        );
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user already exists
        const existingUser = dbHelpers.get('SELECT id, email FROM users WHERE email = ?', [email]);
        
        // Generate invitation token
        const token = uuidv4();
        const invitationId = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Create invitation
        dbHelpers.run(
            `INSERT INTO invitations (id, email, role, company_id, project_id, invited_by, token, expires_at, status)
             VALUES (?, ?, 'consultant', ?, ?, ?, ?, ?, 'pending')`,
            [invitationId, email, req.user.company_id, project_id, req.user.id, token, expiresAt]
        );
        
        // Generate secure invite link
        const inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}/consultant-signup.html?token=${token}`;
        
        // Prepare email data
        const emailData = {
            inviter_name: req.user.full_name,
            company_name: project.company_name,
            project_name: project.name,
            project_description: project.description,
            invite_link: inviteLink,
            custom_message: message
        };
        
        // Send email
        await sendConsultantInvite(email, emailData);
        
        // Log activity
        dbHelpers.run(
            'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'invite_consultant', 'project', project_id, JSON.stringify({ email, invitation_id: invitationId })]
        );
        
        res.json({ 
            message: 'Consultant invitation sent successfully',
            invitationLink: inviteLink,
            email_sent: true,
            existing_user: !!existingUser
        });
    } catch (error) {
        console.error('Send consultant invitation error:', error);
        res.status(500).json({ error: 'Failed to send consultant invitation' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
    try {
        const { full_name, job_title, discipline, profile_photo } = req.body;
        
        const updates = [];
        const values = [];
        
        if (full_name) { updates.push('full_name = ?'); values.push(full_name); }
        if (job_title !== undefined) { updates.push('job_title = ?'); values.push(job_title); }
        if (discipline !== undefined) { updates.push('discipline = ?'); values.push(discipline); }
        if (profile_photo !== undefined) { updates.push('profile_photo = ?'); values.push(profile_photo); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        updates.push('updated_at = datetime("now")');
        values.push(req.user.id);
        
        dbHelpers.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        
        const user = dbHelpers.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
        delete user.password_hash;
        delete user.mfa_secret;
        
        res.json(user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get notification preferences
router.get('/notifications/preferences', authenticateToken, (req, res) => {
    try {
        const prefs = dbHelpers.get(
            'SELECT * FROM notification_preferences WHERE user_id = ?',
            [req.user.id]
        );
        
        res.json(prefs || {});
    } catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});

// Update notification preferences
router.put('/notifications/preferences', authenticateToken, (req, res) => {
    try {
        const {
            email_enabled,
            sms_enabled,
            in_app_enabled,
            task_assigned,
            document_updates,
            comments_mentions,
            deadline_reminders,
            permission_changes,
            email_digest
        } = req.body;
        
        const updates = [];
        const values = [];
        
        if (email_enabled !== undefined) { updates.push('email_enabled = ?'); values.push(email_enabled ? 1 : 0); }
        if (sms_enabled !== undefined) { updates.push('sms_enabled = ?'); values.push(sms_enabled ? 1 : 0); }
        if (in_app_enabled !== undefined) { updates.push('in_app_enabled = ?'); values.push(in_app_enabled ? 1 : 0); }
        if (task_assigned !== undefined) { updates.push('task_assigned = ?'); values.push(task_assigned ? 1 : 0); }
        if (document_updates !== undefined) { updates.push('document_updates = ?'); values.push(document_updates ? 1 : 0); }
        if (comments_mentions !== undefined) { updates.push('comments_mentions = ?'); values.push(comments_mentions ? 1 : 0); }
        if (deadline_reminders !== undefined) { updates.push('deadline_reminders = ?'); values.push(deadline_reminders ? 1 : 0); }
        if (permission_changes !== undefined) { updates.push('permission_changes = ?'); values.push(permission_changes ? 1 : 0); }
        if (email_digest) { updates.push('email_digest = ?'); values.push(email_digest); }
        
        if (updates.length > 0) {
            updates.push('updated_at = datetime("now")');
            values.push(req.user.id);
            
            dbHelpers.run(
                `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
                values
            );
        }
        
        const prefs = dbHelpers.get(
            'SELECT * FROM notification_preferences WHERE user_id = ?',
            [req.user.id]
        );
        
        res.json(prefs);
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

export default router;
