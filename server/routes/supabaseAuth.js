/**
 * Supabase Authentication Routes
 * Handles user registration, login, and profile management with Supabase
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService, CompaniesService } from '../services/supabaseService.js';
import { authenticateSupabaseToken } from '../middleware/supabaseAuth.js';
import emailService from '../services/emailService.js';

const router = express.Router();

/**
 * Register a new user
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

        // Register user with Supabase
        const userData = {
            full_name,
            role,
            company_id: companyId,
            phone: req.body.phone,
            title: req.body.title
        };

        const result = await AuthService.signUp(email, password, userData);

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
            },
            session: result.session
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific Supabase errors
        if (error.message?.includes('already registered')) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        res.status(500).json({ 
            error: 'Registration failed',
            details: error.message 
        });
    }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        const result = await AuthService.signIn(email, password);

        // Get user profile
        const userProfile = await AuthService.getCurrentUser(result.user.id);

        res.json({
            message: 'Login successful',
            user: userProfile,
            session: result.session,
            access_token: result.session.access_token
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific auth errors
        if (error.message?.includes('Invalid login credentials')) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        res.status(500).json({ 
            error: 'Login failed',
            details: error.message 
        });
    }
});

/**
 * Logout user
 */
router.post('/logout', authenticateSupabaseToken, async (req, res) => {
    try {
        await AuthService.signOut();
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
router.get('/me', authenticateSupabaseToken, async (req, res) => {
    try {
        const userProfile = await AuthService.getCurrentUser(req.user.id);
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
router.put('/profile', authenticateSupabaseToken, async (req, res) => {
    try {
        const allowedUpdates = [
            'full_name', 'phone', 'title', 'profile_photo'
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

        const updatedUser = await AuthService.updateProfile(req.user.id, updates);
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
 * Change user password
 */
router.put('/password', authenticateSupabaseToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ 
                error: 'Current password and new password are required' 
            });
        }

        // Verify current password by attempting to sign in
        try {
            await AuthService.signIn(req.user.email, current_password);
        } catch (verifyError) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Update password using Supabase Admin API
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
            req.user.id,
            { password: new_password }
        );

        if (error) throw error;

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            error: 'Failed to change password',
            details: error.message 
        });
    }
});

/**
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.APP_URL}/reset-password`
        });

        if (error) throw error;

        res.json({ 
            message: 'Password reset email sent. Please check your inbox.' 
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ 
            error: 'Failed to send password reset email',
            details: error.message 
        });
    }
});

/**
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ 
                error: 'Reset token and new password are required' 
            });
        }

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) throw error;

        res.json({ message: 'Password reset successful' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            error: 'Failed to reset password',
            details: error.message 
        });
    }
});

/**
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token
        });

        if (error) throw error;

        res.json({
            session: data.session,
            access_token: data.session.access_token
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ 
            error: 'Failed to refresh token',
            details: error.message 
        });
    }
});

export default router;
