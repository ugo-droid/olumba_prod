import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../database/db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const router = express.Router();

// Validate invitation token
router.get('/validate-invitation/:token', async (req, res) => {
    try {
        const invitation = dbHelpers.get(
            `SELECT i.*, p.name as project_name, c.name as company_name, u.full_name as inviter_name
             FROM invitations i
             LEFT JOIN projects p ON i.project_id = p.id
             LEFT JOIN companies c ON i.company_id = c.id
             LEFT JOIN users u ON i.invited_by = u.id
             WHERE i.token = ? AND i.status = 'pending' AND i.expires_at > datetime("now")`,
            [req.params.token]
        );
        
        if (!invitation) {
            return res.status(404).json({ error: 'Invalid or expired invitation' });
        }
        
        res.json({
            valid: true,
            email: invitation.email,
            role: invitation.role,
            project_name: invitation.project_name,
            company_name: invitation.company_name,
            inviter_name: invitation.inviter_name,
            project_id: invitation.project_id
        });
    } catch (error) {
        console.error('Validate invitation error:', error);
        res.status(500).json({ error: 'Failed to validate invitation' });
    }
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, company_name, job_title, discipline, invitation_token } = req.body;
        
        // Validate input
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check if user already exists
        const existingUser = dbHelpers.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        let companyId;
        let role = 'member';
        
        // Check if there's an invitation
        if (invitation_token) {
            const invitation = dbHelpers.get(
                'SELECT * FROM invitations WHERE token = ? AND status = "pending" AND expires_at > datetime("now")',
                [invitation_token]
            );
            
            if (!invitation) {
                return res.status(400).json({ error: 'Invalid or expired invitation' });
            }
            
            companyId = invitation.company_id;
            role = invitation.role;
            
            // Mark invitation as accepted
            dbHelpers.run(
                'UPDATE invitations SET status = "accepted" WHERE id = ?',
                [invitation.id]
            );
            
            // If invitation has a project, auto-assign user to project
            if (invitation.project_id) {
                const projectMemberId = uuidv4();
                dbHelpers.run(
                    'INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
                    [projectMemberId, invitation.project_id, userId, 'consultant']
                );
            }
        } else if (company_name) {
            // Create new company
            companyId = uuidv4();
            dbHelpers.run(
                'INSERT INTO companies (id, name) VALUES (?, ?)',
                [companyId, company_name]
            );
            role = 'admin'; // First user of a new company is admin
        } else {
            return res.status(400).json({ error: 'Must provide invitation token or company name' });
        }
        
        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        
        // Create user
        const userId = uuidv4();
        dbHelpers.run(
            'INSERT INTO users (id, email, password_hash, full_name, job_title, discipline, role, company_id, email_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, "active")',
            [userId, email, password_hash, full_name, job_title, discipline, role, companyId]
        );
        
        // Create notification preferences
        dbHelpers.run(
            'INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)',
            [uuidv4(), userId]
        );
        
        // Generate token
        const token = generateToken(userId);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Store session
        dbHelpers.run(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [uuidv4(), userId, token, expiresAt]
        );
        
        res.json({
            message: 'Registration successful',
            token,
            user: {
                id: userId,
                email,
                full_name,
                role,
                company_id: companyId
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, mfa_code } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        // Get user
        const user = dbHelpers.get('SELECT * FROM users WHERE email = ?', [email]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Account is inactive' });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check MFA if enabled
        if (user.mfa_enabled) {
            if (!mfa_code) {
                return res.status(200).json({ mfa_required: true });
            }
            
            const verified = speakeasy.totp.verify({
                secret: user.mfa_secret,
                encoding: 'base32',
                token: mfa_code
            });
            
            if (!verified) {
                return res.status(401).json({ error: 'Invalid MFA code' });
            }
        }
        
        // Generate token
        const token = generateToken(user.id);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Store session
        dbHelpers.run(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [uuidv4(), user.id, token, expiresAt]
        );
        
        // Update last login
        dbHelpers.run(
            'UPDATE users SET last_login = datetime("now") WHERE id = ?',
            [user.id]
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                company_id: user.company_id,
                job_title: user.job_title,
                discipline: user.discipline
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        // Delete session
        dbHelpers.run('DELETE FROM sessions WHERE token = ?', [token]);
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = dbHelpers.get(
            'SELECT u.*, c.name as company_name FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.id = ?',
            [req.user.id]
        );
        
        delete user.password_hash;
        delete user.mfa_secret;
        
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Setup MFA
router.post('/mfa/setup', authenticateToken, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `Olumba (${req.user.email})`
        });
        
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        
        // Store secret temporarily (user must verify before enabling)
        dbHelpers.run(
            'UPDATE users SET mfa_secret = ? WHERE id = ?',
            [secret.base32, req.user.id]
        );
        
        res.json({
            secret: secret.base32,
            qrCode
        });
    } catch (error) {
        console.error('MFA setup error:', error);
        res.status(500).json({ error: 'MFA setup failed' });
    }
});

// Verify and enable MFA
router.post('/mfa/verify', authenticateToken, (req, res) => {
    try {
        const { code } = req.body;
        
        const user = dbHelpers.get('SELECT mfa_secret FROM users WHERE id = ?', [req.user.id]);
        
        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: code
        });
        
        if (!verified) {
            return res.status(400).json({ error: 'Invalid code' });
        }
        
        // Enable MFA
        dbHelpers.run('UPDATE users SET mfa_enabled = 1 WHERE id = ?', [req.user.id]);
        
        res.json({ message: 'MFA enabled successfully' });
    } catch (error) {
        console.error('MFA verify error:', error);
        res.status(500).json({ error: 'MFA verification failed' });
    }
});

// Disable MFA
router.post('/mfa/disable', authenticateToken, (req, res) => {
    try {
        const { code } = req.body;
        
        const user = dbHelpers.get('SELECT mfa_secret FROM users WHERE id = ?', [req.user.id]);
        
        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: code
        });
        
        if (!verified) {
            return res.status(400).json({ error: 'Invalid code' });
        }
        
        // Disable MFA
        dbHelpers.run('UPDATE users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?', [req.user.id]);
        
        res.json({ message: 'MFA disabled successfully' });
    } catch (error) {
        console.error('MFA disable error:', error);
        res.status(500).json({ error: 'MFA disable failed' });
    }
});

export default router;
