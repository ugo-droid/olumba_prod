/**
 * Supabase Service Layer
 * Provides a unified interface for all database operations using Supabase
 */

import { supabase, supabaseAdmin, TABLES, STORAGE_BUCKETS, USER_ROLES } from '../config/supabase.js';

/**
 * Authentication Service
 */
export class AuthService {
    /**
     * Sign up a new user
     */
    static async signUp(email, password, userData) {
        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: userData.full_name
                    }
                }
            });

            if (authError) throw authError;

            // Create user profile
            if (authData.user) {
                const { error: profileError } = await supabaseAdmin
                    .from(TABLES.USERS)
                    .insert({
                        id: authData.user.id,
                        email,
                        full_name: userData.full_name,
                        role: userData.role || USER_ROLES.MEMBER,
                        company_id: userData.company_id,
                        phone: userData.phone,
                        title: userData.title
                    });

                if (profileError) throw profileError;
            }

            return { user: authData.user, session: authData.session };
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }

    /**
     * Sign in user
     */
    static async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Update last login
            if (data.user) {
                await supabaseAdmin
                    .from(TABLES.USERS)
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', data.user.id);
            }

            return data;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    /**
     * Sign out user
     */
    static async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * Get current user profile
     */
    static async getCurrentUser(userId) {
        try {
            const { data, error } = await supabaseAdmin
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

            if (error) throw error;
            return data;
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
            const { data, error } = await supabaseAdmin
                .from(TABLES.USERS)
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
}

/**
 * Companies Service
 */
export class CompaniesService {
    static async create(companyData) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.COMPANIES)
                .insert(companyData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create company error:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.COMPANIES)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get company error:', error);
            throw error;
        }
    }

    static async update(id, updates) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.COMPANIES)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update company error:', error);
            throw error;
        }
    }
}

/**
 * Projects Service
 */
export class ProjectsService {
    static async getAll(userId) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.PROJECTS)
                .select(`
                    *,
                    companies (
                        id,
                        name
                    ),
                    project_members!inner (
                        user_id,
                        role
                    )
                `)
                .eq('project_members.user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get projects error:', error);
            throw error;
        }
    }

    static async getById(id, userId) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.PROJECTS)
                .select(`
                    *,
                    companies (
                        id,
                        name,
                        logo_url
                    ),
                    project_members (
                        id,
                        user_id,
                        role,
                        users (
                            id,
                            full_name,
                            email,
                            profile_photo,
                            title
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Check if user has access to this project
            const hasAccess = data.project_members.some(member => member.user_id === userId);
            if (!hasAccess) {
                throw new Error('Access denied to this project');
            }

            return data;
        } catch (error) {
            console.error('Get project error:', error);
            throw error;
        }
    }

    static async create(projectData, createdBy) {
        try {
            const { data: project, error: projectError } = await supabaseAdmin
                .from(TABLES.PROJECTS)
                .insert({
                    ...projectData,
                    created_by: createdBy
                })
                .select()
                .single();

            if (projectError) throw projectError;

            // Add creator as project owner
            const { error: memberError } = await supabaseAdmin
                .from(TABLES.PROJECT_MEMBERS)
                .insert({
                    project_id: project.id,
                    user_id: createdBy,
                    role: 'owner'
                });

            if (memberError) throw memberError;

            return project;
        } catch (error) {
            console.error('Create project error:', error);
            throw error;
        }
    }

    static async update(id, updates) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.PROJECTS)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update project error:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const { error } = await supabaseAdmin
                .from(TABLES.PROJECTS)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete project error:', error);
            throw error;
        }
    }

    static async addMember(projectId, userId, role = 'member', invitedBy) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.PROJECT_MEMBERS)
                .insert({
                    project_id: projectId,
                    user_id: userId,
                    role,
                    invited_by: invitedBy
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Add project member error:', error);
            throw error;
        }
    }

    static async removeMember(projectId, userId) {
        try {
            const { error } = await supabaseAdmin
                .from(TABLES.PROJECT_MEMBERS)
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Remove project member error:', error);
            throw error;
        }
    }
}

/**
 * Tasks Service
 */
export class TasksService {
    static async getByProject(projectId) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.TASKS)
                .select(`
                    *,
                    assigned_user:assigned_to (
                        id,
                        full_name,
                        profile_photo
                    ),
                    created_user:created_by (
                        id,
                        full_name
                    )
                `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get tasks error:', error);
            throw error;
        }
    }

    static async getByUser(userId) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.TASKS)
                .select(`
                    *,
                    projects (
                        id,
                        name
                    )
                `)
                .eq('assigned_to', userId)
                .order('due_date', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get user tasks error:', error);
            throw error;
        }
    }

    static async create(taskData) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.TASKS)
                .insert(taskData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create task error:', error);
            throw error;
        }
    }

    static async update(id, updates) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.TASKS)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update task error:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const { error } = await supabaseAdmin
                .from(TABLES.TASKS)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete task error:', error);
            throw error;
        }
    }
}

/**
 * Documents Service
 */
export class DocumentsService {
    static async getByProject(projectId) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.DOCUMENTS)
                .select(`
                    *,
                    uploaded_user:uploaded_by (
                        id,
                        full_name
                    )
                `)
                .eq('project_id', projectId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get documents error:', error);
            throw error;
        }
    }

    static async create(documentData) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.DOCUMENTS)
                .insert(documentData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create document error:', error);
            throw error;
        }
    }

    static async uploadFile(file, path) {
        try {
            const { data, error } = await supabaseAdmin.storage
                .from(STORAGE_BUCKETS.DOCUMENTS)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Upload file error:', error);
            throw error;
        }
    }

    static async getFileUrl(path) {
        try {
            const { data } = await supabaseAdmin.storage
                .from(STORAGE_BUCKETS.DOCUMENTS)
                .createSignedUrl(path, 3600); // 1 hour expiry

            return data?.signedUrl;
        } catch (error) {
            console.error('Get file URL error:', error);
            throw error;
        }
    }
}

/**
 * Messages Service
 */
export class MessagesService {
    static async getByProject(projectId) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.MESSAGES)
                .select(`
                    *,
                    sender:sender_id (
                        id,
                        full_name,
                        profile_photo
                    )
                `)
                .eq('project_id', projectId)
                .is('parent_message_id', null)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Get replies for each message
            for (const message of data) {
                const { data: replies, error: repliesError } = await supabaseAdmin
                    .from(TABLES.MESSAGES)
                    .select(`
                        *,
                        sender:sender_id (
                            id,
                            full_name,
                            profile_photo
                        )
                    `)
                    .eq('parent_message_id', message.id)
                    .order('created_at', { ascending: true });

                if (!repliesError) {
                    message.replies = replies;
                }
            }

            return data;
        } catch (error) {
            console.error('Get messages error:', error);
            throw error;
        }
    }

    static async create(messageData) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.MESSAGES)
                .insert(messageData)
                .select(`
                    *,
                    sender:sender_id (
                        id,
                        full_name,
                        profile_photo
                    )
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create message error:', error);
            throw error;
        }
    }
}

/**
 * Notifications Service
 */
export class NotificationsService {
    static async getByUser(userId) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.NOTIFICATIONS)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get notifications error:', error);
            throw error;
        }
    }

    static async getUnreadCount(userId) {
        try {
            const { count, error } = await supabaseAdmin
                .from(TABLES.NOTIFICATIONS)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return { count: count || 0 };
        } catch (error) {
            console.error('Get unread count error:', error);
            throw error;
        }
    }

    static async create(notificationData) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.NOTIFICATIONS)
                .insert(notificationData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create notification error:', error);
            throw error;
        }
    }

    static async markAsRead(id) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.NOTIFICATIONS)
                .update({ is_read: true })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Mark notification as read error:', error);
            throw error;
        }
    }
}

/**
 * Activity Log Service
 */
export class ActivityLogService {
    static async create(activityData) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.ACTIVITY_LOG)
                .insert(activityData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create activity log error:', error);
            throw error;
        }
    }

    static async getByProject(projectId) {
        try {
            const { data, error } = await supabaseAdmin
                .from(TABLES.ACTIVITY_LOG)
                .select(`
                    *,
                    user:user_id (
                        id,
                        full_name
                    )
                `)
                .eq('entity_id', projectId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get activity log error:', error);
            throw error;
        }
    }
}

// Export all services
export default {
    AuthService,
    CompaniesService,
    ProjectsService,
    TasksService,
    DocumentsService,
    MessagesService,
    NotificationsService,
    ActivityLogService
};
