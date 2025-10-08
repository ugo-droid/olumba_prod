/**
 * Clerk Authentication Middleware
 * Provides authentication and authorization middleware for Express routes
 */

import { supabaseAdmin, TABLES } from '../config/supabase.js';
import { getUserMetadata, hasRole, hasAnyRole, USER_ROLES } from '../config/clerk.js';

/**
 * Middleware to authenticate requests using Clerk
 * Attaches user info to request object
 */
export const authenticateClerkToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token with Clerk
        const { clerkClient, verifyToken } = await import('../config/clerk.js');
        const payload = await verifyToken(token);
        
        if (!payload || !payload.sub) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get user metadata from Clerk
        const userMetadata = await getUserMetadata(payload.sub);
        
        if (!userMetadata || !userMetadata.isActive) {
            return res.status(401).json({ error: 'User account is inactive' });
        }

        // Get additional user profile from Supabase (for company info, etc.)
        try {
            const { data: userProfile, error } = await supabaseAdmin
                .from(TABLES.USERS)
                .select(`
                    *,
                    companies (
                        id,
                        name,
                        logo_url
                    )
                `)
                .eq('id', payload.sub)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.warn('User profile not found in database:', error.message);
            }

            // Merge Clerk metadata with Supabase profile
            req.user = {
                ...userMetadata,
                ...(userProfile || {}),
                clerkId: payload.sub
            };

        } catch (profileError) {
            // If user profile doesn't exist in Supabase, use Clerk data only
            req.user = {
                ...userMetadata,
                clerkId: payload.sub
            };
        }

        next();
    } catch (error) {
        console.error('Clerk authentication error:', error);
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

    if (!hasRole(req.user, USER_ROLES.ADMIN)) {
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

        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!hasAnyRole(req.user, allowedRoles)) {
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
        if (hasRole(req.user, USER_ROLES.ADMIN)) {
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
                if (hasRole(req.user, USER_ROLES.ADMIN) || 
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
        
        try {
            const { verifyToken } = await import('../config/clerk.js');
            const payload = await verifyToken(token);
            
            if (payload && payload.sub) {
                const userMetadata = await getUserMetadata(payload.sub);
                
                if (userMetadata && userMetadata.isActive) {
                    // Get additional profile info from Supabase
                    try {
                        const { data: userProfile, error } = await supabaseAdmin
                            .from(TABLES.USERS)
                            .select(`
                                *,
                                companies (
                                    id,
                                    name,
                                    logo_url
                                )
                            `)
                            .eq('id', payload.sub)
                            .single();

                        req.user = {
                            ...userMetadata,
                            ...(userProfile || {}),
                            clerkId: payload.sub
                        };
                    } catch (profileError) {
                        req.user = {
                            ...userMetadata,
                            clerkId: payload.sub
                        };
                    }
                }
            }
        } catch (authError) {
            // Ignore auth errors for optional auth
            console.warn('Optional auth error:', authError.message);
        }

        next();
    } catch (error) {
        // Don't fail the request for optional auth errors
        console.warn('Optional auth error:', error);
        next();
    }
};

/**
 * Middleware to ensure user profile exists in Supabase
 * Creates profile if it doesn't exist
 */
export const ensureUserProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user profile exists in Supabase
        const { data: existingProfile, error: fetchError } = await supabaseAdmin
            .from(TABLES.USERS)
            .select('id')
            .eq('id', req.user.id)
            .single();

        if (fetchError && fetchError.code === 'PGRST116') {
            // User profile doesn't exist, create it
            const { error: insertError } = await supabaseAdmin
                .from(TABLES.USERS)
                .insert({
                    id: req.user.id,
                    email: req.user.email,
                    full_name: req.user.fullName,
                    role: req.user.role || USER_ROLES.MEMBER,
                    company_id: req.user.companyId,
                    phone: req.user.phone,
                    title: req.user.title,
                    profile_photo: req.user.profileImageUrl,
                    is_active: true,
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('Error creating user profile:', insertError);
                return res.status(500).json({ error: 'Failed to create user profile' });
            }
        } else if (fetchError) {
            console.error('Error checking user profile:', fetchError);
            return res.status(500).json({ error: 'Failed to verify user profile' });
        }

        next();
    } catch (error) {
        console.error('Ensure user profile error:', error);
        return res.status(500).json({ error: 'Failed to ensure user profile' });
    }
};

export default {
    authenticateClerkToken,
    requireAdmin,
    requireRole,
    requireProjectAccess,
    requireProjectAdmin,
    optionalAuth,
    ensureUserProfile
};
