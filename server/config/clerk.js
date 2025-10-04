/**
 * Clerk Configuration
 * Handles Clerk authentication setup and initialization
 */

import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { createClerkClient, verifyToken as clerkVerifyToken } from '@clerk/backend';

// Initialize Clerk client
export const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

// Middleware for routes that require authentication
export const requireAuth = ClerkExpressRequireAuth({
    // Custom error handling
    onError: (error, req, res) => {
        console.error('Clerk authentication error:', error);
        return res.status(401).json({ 
            error: 'Authentication required',
            details: error.message 
        });
    }
});

// Middleware for routes that optionally check authentication
export const withAuth = ClerkExpressWithAuth({
    // Custom error handling
    onError: (error, req, res) => {
        console.error('Clerk optional auth error:', error);
        // For optional auth, we don't fail the request
        return;
    }
});

/**
 * Get user metadata including custom roles
 */
export const getUserMetadata = async (userId) => {
    try {
        const user = await clerkClient.users.getUser(userId);
        return {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            profileImageUrl: user.profileImageUrl,
            // Custom metadata for roles and company info
            role: user.publicMetadata?.role || 'member',
            companyId: user.publicMetadata?.companyId || null,
            title: user.publicMetadata?.title || null,
            phone: user.publicMetadata?.phone || null,
            isActive: user.publicMetadata?.isActive !== false, // Default to true
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt
        };
    } catch (error) {
        console.error('Error getting user metadata:', error);
        throw error;
    }
};

/**
 * Update user metadata (roles, company info, etc.)
 */
export const updateUserMetadata = async (userId, metadata) => {
    try {
        const user = await clerkClient.users.updateUser(userId, {
            publicMetadata: {
                ...metadata,
                updatedAt: new Date().toISOString()
            }
        });
        return user;
    } catch (error) {
        console.error('Error updating user metadata:', error);
        throw error;
    }
};

/**
 * Create a new user with metadata
 */
export const createUser = async (email, password, metadata = {}) => {
    try {
        const user = await clerkClient.users.createUser({
            emailAddress: [email],
            password,
            publicMetadata: {
                ...metadata,
                createdAt: new Date().toISOString()
            }
        });
        return user;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

/**
 * Verify JWT token and get user info
 */
export const verifyToken = async (token) => {
    try {
        const payload = await clerkVerifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY
        });
        return payload;
    } catch (error) {
        console.error('Error verifying token:', error);
        throw error;
    }
};

/**
 * User role helpers
 */
export const USER_ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member',
    CONSULTANT: 'consultant',
    CLIENT: 'client'
};

/**
 * Check if user has specific role
 */
export const hasRole = (user, requiredRole) => {
    if (!user || !user.role) return false;
    
    // Admin has access to everything
    if (user.role === USER_ROLES.ADMIN) return true;
    
    // Check exact role match
    return user.role === requiredRole;
};

/**
 * Check if user has any of the required roles
 */
export const hasAnyRole = (user, requiredRoles) => {
    if (!user || !user.role) return false;
    
    // Admin has access to everything
    if (user.role === USER_ROLES.ADMIN) return true;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(user.role);
};

export default {
    clerkClient,
    requireAuth,
    withAuth,
    getUserMetadata,
    updateUserMetadata,
    createUser,
    verifyToken,
    USER_ROLES,
    hasRole,
    hasAnyRole
};
