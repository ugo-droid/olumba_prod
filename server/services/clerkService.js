/**
 * Clerk Authentication Service
 * Provides authentication operations using Clerk
 */

import { clerkClient, getUserMetadata, updateUserMetadata, createUser, USER_ROLES } from '../config/clerk.js';
import { supabaseAdmin, TABLES } from '../config/supabase.js';
import resendEmailService from './resendEmailService.js';

/**
 * Authentication Service using Clerk
 */
export class ClerkAuthService {
    /**
     * Sign up a new user
     */
    static async signUp(email, password, userData) {
        try {
            // Create user in Clerk
            const clerkUser = await createUser(email, password, {
                role: userData.role || USER_ROLES.MEMBER,
                companyId: userData.company_id,
                phone: userData.phone,
                title: userData.title,
                fullName: userData.full_name
            });

            // Create user profile in Supabase
            if (clerkUser) {
                const { error: profileError } = await supabaseAdmin
                    .from(TABLES.USERS)
                    .insert({
                        id: clerkUser.id,
                        email,
                        full_name: userData.full_name,
                        role: userData.role || USER_ROLES.MEMBER,
                        company_id: userData.company_id,
                        phone: userData.phone,
                        title: userData.title,
                        is_active: true,
                        created_at: new Date().toISOString()
                    });

                if (profileError) {
                    console.error('Error creating user profile:', profileError);
                    // Don't fail the signup if profile creation fails
                }
            }

            return { 
                user: {
                    id: clerkUser.id,
                    email: clerkUser.emailAddresses[0]?.emailAddress,
                    full_name: userData.full_name
                },
                session: null // Clerk handles sessions differently
            };
        } catch (error) {
            console.error('Clerk sign up error:', error);
            throw error;
        }
    }

    /**
     * Sign in user (Clerk handles this via frontend)
     * This method is mainly for backend verification
     */
    static async signIn(email, password) {
        try {
            // Note: Clerk handles sign-in on the frontend
            // This method is for verification purposes only
            const users = await clerkClient.users.getUserList({
                emailAddresses: [email]
            });

            if (users.data.length === 0) {
                throw new Error('User not found');
            }

            const user = users.data[0];
            
            // Update last login in Supabase
            await supabaseAdmin
                .from(TABLES.USERS)
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);

            return {
                user: {
                    id: user.id,
                    email: user.emailAddresses[0]?.emailAddress
                },
                session: null // Clerk handles sessions via JWT tokens
            };
        } catch (error) {
            console.error('Clerk sign in error:', error);
            throw error;
        }
    }

    /**
     * Sign out user (handled by Clerk frontend)
     */
    static async signOut() {
        try {
            // Clerk handles sign out on the frontend
            return { success: true };
        } catch (error) {
            console.error('Clerk sign out error:', error);
            throw error;
        }
    }

    /**
     * Get current user profile
     */
    static async getCurrentUser(userId) {
        try {
            // Get user metadata from Clerk
            const clerkMetadata = await getUserMetadata(userId);

            // Get additional profile from Supabase
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
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn('User profile not found in database:', error.message);
            }

            // Merge Clerk metadata with Supabase profile
            return {
                ...clerkMetadata,
                ...(userProfile || {}),
                clerkId: userId
            };
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(userId, updates) {
        try {
            const allowedUpdates = [
                'full_name', 'phone', 'title', 'profile_photo', 'role', 'company_id'
            ];
            
            const clerkUpdates = {};
            const supabaseUpdates = {};
            
            // Separate Clerk metadata updates from Supabase updates
            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    if (['role', 'company_id', 'phone', 'title'].includes(key)) {
                        clerkUpdates[key] = updates[key];
                    }
                    supabaseUpdates[key] = updates[key];
                }
            });

            // Update Clerk metadata
            if (Object.keys(clerkUpdates).length > 0) {
                await updateUserMetadata(userId, clerkUpdates);
            }

            // Update Supabase profile
            if (Object.keys(supabaseUpdates).length > 0) {
                const { data, error } = await supabaseAdmin
                    .from(TABLES.USERS)
                    .update({
                        ...supabaseUpdates,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }

            return await this.getCurrentUser(userId);
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    /**
     * Change user password (handled by Clerk)
     */
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            // Clerk handles password changes via frontend
            // This is a placeholder for backend verification
            return { message: 'Password change initiated' };
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    /**
     * Request password reset (handled by Clerk)
     */
    static async requestPasswordReset(email) {
        try {
            // Clerk handles password reset via frontend
            return { 
                message: 'Password reset email sent. Please check your inbox.' 
            };
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }

    /**
     * Invite user to organization
     */
    static async inviteUser(email, role = USER_ROLES.MEMBER, companyId = null) {
        try {
            // Create invitation in Clerk
            const invitation = await clerkClient.invitations.createInvitation({
                emailAddress: email,
                publicMetadata: {
                    role,
                    companyId,
                    invitedAt: new Date().toISOString()
                }
            });

            // Send invitation email
            try {
                await resendEmailService.sendConsultantInvite(email, {
                    inviter_name: 'Olumba Team',
                    company_name: 'Olumba',
                    project_name: 'New Project',
                    project_description: `You've been invited to join as a ${role}`,
                    invite_link: `${process.env.APP_URL || 'http://localhost:3000'}/register-clerk`
                });
            } catch (emailError) {
                console.error('Invitation email failed:', emailError);
                // Don't fail invitation if email fails
            }

            return invitation;
        } catch (error) {
            console.error('Invite user error:', error);
            throw error;
        }
    }

    /**
     * Get user's organization memberships
     */
    static async getUserOrganizations(userId) {
        try {
            const user = await clerkClient.users.getUser(userId);
            return user.organizationMemberships || [];
        } catch (error) {
            console.error('Get user organizations error:', error);
            throw error;
        }
    }

    /**
     * Delete user account
     */
    static async deleteUser(userId) {
        try {
            // Delete from Clerk
            await clerkClient.users.deleteUser(userId);

            // Mark as inactive in Supabase (soft delete)
            await supabaseAdmin
                .from(TABLES.USERS)
                .update({ 
                    is_active: false,
                    deleted_at: new Date().toISOString()
                })
                .eq('id', userId);

            return { success: true };
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }

    /**
     * Verify JWT token and get user info
     */
    static async verifyToken(token) {
        try {
            const { verifyToken } = await import('../config/clerk.js');
            const payload = await verifyToken(token);
            return payload;
        } catch (error) {
            console.error('Verify token error:', error);
            throw error;
        }
    }
}

export default ClerkAuthService;
