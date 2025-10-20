// =============================
// Authentication Middleware
// =============================
// Verifies Clerk authentication tokens and extracts user info

import { VercelRequest } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  organizationId?: string;
  role?: string;
}

/**
 * Require authentication for an API endpoint
 * Throws error if not authenticated
 */
export async function requireAuth(req: VercelRequest): Promise<AuthenticatedUser> {
  // Get authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  // Extract token
  const token = authHeader.substring(7);

  try {
    // Verify JWT token with Clerk
    const payload = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    if (!payload || !payload.sub) {
      throw new Error('Invalid or expired token');
    }

    // Get user details
    const user = await clerkClient.users.getUser(payload.sub);

    return {
      userId: payload.sub,
      email: user.emailAddresses[0]?.emailAddress,
      organizationId: payload.org_id || null,
      role: payload.org_role || null,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 */
export async function optionalAuth(req: VercelRequest): Promise<AuthenticatedUser | null> {
  try {
    return await requireAuth(req);
  } catch (error) {
    return null;
  }
}

/**
 * Require specific role
 */
export async function requireRole(
  req: VercelRequest,
  allowedRoles: string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new Error(`Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`);
  }

  return user;
}

/**
 * Require organization membership
 */
export async function requireOrganization(req: VercelRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  if (!user.organizationId) {
    throw new Error('Organization membership required');
  }

  return user;
}

/**
 * Verify user has access to specific organization
 */
export async function verifyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const orgMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId,
    });

    return orgMemberships.data.some((membership: any) => membership.organization.id === organizationId);
  } catch (error) {
    console.error('Organization access verification error:', error);
    return false;
  }
}

/**
 * Extract Clerk session from cookie (for frontend requests)
 */
export async function getSessionFromCookie(req: VercelRequest): Promise<any> {
  const sessionCookie = req.cookies['__session'];

  if (!sessionCookie) {
    return null;
  }

  try {
    const payload = await clerkClient.verifyToken(sessionCookie, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    return payload;
  } catch (error) {
    return null;
  }
}


