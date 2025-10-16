/**
 * Supabase Authentication Middleware
 * Validates JWT tokens from Supabase Auth and attaches user info to request
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AuthService } from '../services/supabaseService.js';

/**
 * Middleware to authenticate requests using Supabase JWT
 */
export const authenticateSupabaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify the JWT token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get user profile from our users table
        try {
            const userProfile = await AuthService.getCurrentUser(user.id);
            
            if (!userProfile || !userProfile.is_active) {
                return res.status(401).json({ error: 'User account is inactive' });
            }

            // Attach user info to request
            req.user = {
                id: user.id,
                email: user.email,
                ...userProfile
            };

            next();
        } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            return res.status(401).json({ error: 'User profile not found' });
        }

    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

/**
 * Middleware to check if user has specific role(s)
 */
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is a member of a specific project
 */
export const requireProjectAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const projectId = req.params.projectId || req.params.id || req.body.project_id;
        
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Admin users have access to all projects
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user is a member of the project
        const { data: membership, error } = await supabaseAdmin
            .from('project_members')
            .select('id, role')
            .eq('project_id', projectId)
            .eq('user_id', req.user.id)
            .single();

        if (error || !membership) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }

        // Attach project membership info to request
        req.projectMembership = membership;
        next();

    } catch (error) {
        console.error('Project access check error:', error);
        return res.status(500).json({ error: 'Failed to verify project access' });
    }
};

/**
 * Middleware to check if user has admin role in a specific project
 */
export const requireProjectAdmin = async (req, res, next) => {
    try {
        // First check project access - call it directly and handle the response
        requireProjectAccess(req, res, (error) => {
            if (error) {
                console.error('Project admin check error:', error);
                return res.status(500).json({ error: 'Failed to verify project admin access' });
            }
            
            // Only continue if requireProjectAccess succeeded
            try {
                // Check if user has admin role in the project or is a system admin
                if (req.user.role === 'admin' || 
                    ['owner', 'admin'].includes(req.projectMembership?.role)) {
                    return next();
                }

                return res.status(403).json({ error: 'Project admin access required' });
            } catch (checkError) {
                console.error('Project admin role check error:', checkError);
                return res.status(500).json({ error: 'Failed to verify project admin access' });
            }
        });

    } catch (error) {
        console.error('Project admin check error:', error);
        return res.status(500).json({ error: 'Failed to verify project admin access' });
    }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Continue without user info
        }

        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (!error && user) {
            try {
                const userProfile = await AuthService.getCurrentUser(user.id);
                if (userProfile && userProfile.is_active) {
                    req.user = {
                        id: user.id,
                        email: user.email,
                        ...userProfile
                    };
                }
            } catch (profileError) {
                // Ignore profile errors for optional auth
                console.warn('Optional auth profile error:', profileError);
            }
        }

        next();
    } catch (error) {
        // Don't fail the request for optional auth errors
        console.warn('Optional auth error:', error);
        next();
    }
};

export default {
    authenticateSupabaseToken,
    requireAdmin,
    requireRole,
    requireProjectAccess,
    requireProjectAdmin,
    optionalAuth
};
