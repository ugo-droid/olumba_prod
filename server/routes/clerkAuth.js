/**
 * Clerk Authentication Routes
 * Handles user registration, login, and profile management with Clerk
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ClerkAuthService } from '../services/clerkService.js';
import { authenticateClerkToken, ensureUserProfile } from '../middleware/clerkAuth.js';
import { CompaniesService } from '../services/supabaseService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

/**
 * Register a new user
 * Note: Clerk handles the actual user creation, this endpoint creates the profile
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, company_name, role = 'member' } = req.body;

        // Validate required fields
        if (!email || !password || !full_name) {
            return res.status(400).json({ 
                error: 'Email, password, and full name are required' 
            });
        }

        // Create company if provided
        let companyId = null;
        if (company_name) {
            try {
                const company = await CompaniesService.create({
                    name: company_name
                });
                companyId = company.id;
            } catch (companyError) {
                console.error('Company creation error:', companyError);
                // Continue without company if creation fails
            }
        }

        // Create user with Clerk
        const userData = {
            full_name,
            role,
            company_id: companyId,
            phone: req.body.phone,
            title: req.body.title
        };

        const result = await ClerkAuthService.signUp(email, password, userData);

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(email, { full_name });
        } catch (emailError) {
            console.error('Welcome email failed:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: result.user.id,
                email: result.user.email,
                full_name
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific Clerk errors
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        res.status(500).json({ 
            error: 'Registration failed',
            details: error.message 
        });
    }
});

/**
 * Login user (verification endpoint)
 * Note: Actual login is handled by Clerk frontend
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Verify login with Clerk
        const result = await ClerkAuthService.signIn(email, password);

        // Get user profile
        const userProfile = await ClerkAuthService.getCurrentUser(result.user.id);

        res.json({
            message: 'Login successful',
            user: userProfile
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific auth errors
        if (error.message?.includes('Invalid') || error.message?.includes('not found')) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        res.status(500).json({ 
            error: 'Login failed',
            details: error.message 
        });
    }
});

/**
 * Logout user (handled by Clerk frontend)
 */
router.post('/logout', authenticateClerkToken, async (req, res) => {
    try {
        await ClerkAuthService.signOut();
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'Logout failed',
            details: error.message 
        });
    }
});

/**
 * Get current user profile
 */
router.get('/me', authenticateClerkToken, ensureUserProfile, async (req, res) => {
    try {
        const userProfile = await ClerkAuthService.getCurrentUser(req.user.id);
        res.json(userProfile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            error: 'Failed to get user profile',
            details: error.message 
        });
    }
});

/**
 * Update user profile
 */
router.put('/profile', authenticateClerkToken, ensureUserProfile, async (req, res) => {
    try {
        const allowedUpdates = [
            'full_name', 'phone', 'title', 'profile_photo', 'role', 'company_id'
        ];
        
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const updatedUser = await ClerkAuthService.updateProfile(req.user.id, updates);
        res.json(updatedUser);

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            error: 'Failed to update profile',
            details: error.message 
        });
    }
});

/**
 * Change user password (initiated via Clerk frontend)
 */
router.put('/password', authenticateClerkToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ 
                error: 'Current password and new password are required' 
            });
        }

        // Clerk handles password change via frontend
        const result = await ClerkAuthService.changePassword(
            req.user.id, 
            current_password, 
            new_password
        );

        res.json(result);

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            error: 'Failed to change password',
            details: error.message 
        });
    }
});

/**
 * Request password reset (handled by Clerk)
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await ClerkAuthService.requestPasswordReset(email);
        res.json(result);

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ 
            error: 'Failed to send password reset email',
            details: error.message 
        });
    }
});

/**
 * Verify JWT token
 */
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const payload = await ClerkAuthService.verifyToken(token);
        res.json({ valid: true, payload });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ 
            error: 'Invalid or expired token',
            details: error.message 
        });
    }
});

/**
 * Invite user to organization
 */
router.post('/invite', authenticateClerkToken, async (req, res) => {
    try {
        const { email, role, company_id } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const invitation = await ClerkAuthService.inviteUser(
            email, 
            role || 'member', 
            company_id || req.user.companyId
        );

        res.json({
            message: 'Invitation sent successfully',
            invitation
        });

    } catch (error) {
        console.error('Invite user error:', error);
        res.status(500).json({ 
            error: 'Failed to send invitation',
            details: error.message 
        });
    }
});

/**
 * Get user's organizations
 */
router.get('/organizations', authenticateClerkToken, async (req, res) => {
    try {
        const organizations = await ClerkAuthService.getUserOrganizations(req.user.id);
        res.json(organizations);
    } catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({ 
            error: 'Failed to get organizations',
            details: error.message 
        });
    }
});

/**
 * Delete user account
 */
router.delete('/account', authenticateClerkToken, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password confirmation is required' });
        }

        // Verify password before deletion
        try {
            await ClerkAuthService.signIn(req.user.email, password);
        } catch (verifyError) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        await ClerkAuthService.deleteUser(req.user.id);
        res.json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ 
            error: 'Failed to delete account',
            details: error.message 
        });
    }
});

export default router;
