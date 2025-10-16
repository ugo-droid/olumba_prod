/**
 * Email Helper Functions for API Routes
 * Provides convenient functions for sending emails from various API endpoints
 */

import resendEmailService from './resendEmailService.js';
import { supabaseAdmin, TABLES } from '../config/supabase.js';

/**
 * Send task assignment notification
 */
export async function notifyTaskAssignment(taskData) {
    try {
        // Get assignee details
        const { data: assignee } = await supabaseAdmin
            .from(TABLES.USERS)
            .select('email, full_name')
            .eq('id', taskData.assigned_to)
            .single();

        if (!assignee) {
            console.warn('Assignee not found for task assignment notification');
            return;
        }

        // Get assigner details
        const { data: assigner } = await supabaseAdmin
            .from(TABLES.USERS)
            .select('full_name')
            .eq('id', taskData.created_by)
            .single();

        // Get project details
        const { data: project } = await supabaseAdmin
            .from(TABLES.PROJECTS)
            .select('name')
            .eq('id', taskData.project_id)
            .single();

        await resendEmailService.sendTaskAssignmentEmail(assignee.email, {
            assignee_name: assignee.full_name,
            assigner_name: assigner?.full_name || 'Team Member',
            task_name: taskData.name,
            task_description: taskData.description,
            priority: taskData.priority,
            due_date: taskData.due_date,
            project_name: project?.name || 'Unknown Project',
            task_id: taskData.id
        });

        console.log('✅ Task assignment notification sent');
    } catch (error) {
        console.error('❌ Task assignment notification failed:', error);
    }
}

/**
 * Send document sharing notification
 */
export async function notifyDocumentShared(documentData, recipientIds) {
    try {
        // Get document details
        const { data: document } = await supabaseAdmin
            .from(TABLES.DOCUMENTS)
            .select(`
                *,
                projects(name),
                users(full_name)
            `)
            .eq('id', documentData.document_id)
            .single();

        if (!document) {
            console.warn('Document not found for sharing notification');
            return;
        }

        // Get recipient details
        const { data: recipients } = await supabaseAdmin
            .from(TABLES.USERS)
            .select('email, full_name')
            .in('id', recipientIds);

        // Send notification to each recipient
        for (const recipient of recipients || []) {
            await resendEmailService.sendDocumentNotificationEmail(recipient.email, {
                recipient_name: recipient.full_name,
                sharer_name: document.users?.full_name || 'Team Member',
                file_name: documentData.file_name || document.name,
                file_size: documentData.file_size,
                discipline: document.discipline,
                description: document.description,
                project_name: document.projects?.name || 'Unknown Project',
                document_id: document.id
            });
        }

        console.log('✅ Document sharing notifications sent');
    } catch (error) {
        console.error('❌ Document sharing notification failed:', error);
    }
}

/**
 * Send project status update notification
 */
export async function notifyProjectStatusUpdate(projectId, oldStatus, newStatus, updateMessage = null) {
    try {
        // Get project details
        const { data: project } = await supabaseAdmin
            .from(TABLES.PROJECTS)
            .select(`
                name,
                project_members(user_id, users(email, full_name))
            `)
            .eq('id', projectId)
            .single();

        if (!project) {
            console.warn('Project not found for status update notification');
            return;
        }

        // Send notification to all project members
        for (const member of project.project_members || []) {
            if (member.users) {
                await resendEmailService.sendProjectStatusUpdateEmail(member.users.email, {
                    member_name: member.users.full_name,
                    project_name: project.name,
                    old_status: oldStatus,
                    new_status: newStatus,
                    update_message: updateMessage,
                    project_id: projectId
                });
            }
        }

        console.log('✅ Project status update notifications sent');
    } catch (error) {
        console.error('❌ Project status update notification failed:', error);
    }
}

/**
 * Send mention notification
 */
export async function notifyMention(mentionData) {
    try {
        // Get mentioned user details
        const { data: mentionedUser } = await supabaseAdmin
            .from(TABLES.USERS)
            .select('email, full_name')
            .eq('id', mentionData.mentioned_user_id)
            .single();

        if (!mentionedUser) {
            console.warn('Mentioned user not found');
            return;
        }

        // Get sender details
        const { data: sender } = await supabaseAdmin
            .from(TABLES.USERS)
            .select('full_name')
            .eq('id', mentionData.sender_id)
            .single();

        // Get project details
        const { data: project } = await supabaseAdmin
            .from(TABLES.PROJECTS)
            .select('name')
            .eq('id', mentionData.project_id)
            .single();

        await resendEmailService.sendMentionEmail(mentionedUser.email, {
            mentioned_user_name: mentionedUser.full_name,
            sender_name: sender?.full_name || 'Team Member',
            message_content: mentionData.message_content,
            project_name: project?.name || 'Unknown Project',
            project_link: `${process.env.APP_URL || 'http://localhost:3000'}/projects/${mentionData.project_id}`
        });

        console.log('✅ Mention notification sent');
    } catch (error) {
        console.error('❌ Mention notification failed:', error);
    }
}

/**
 * Send city approval update notification
 */
export async function notifyCityApprovalUpdate(approvalId, oldStatus, newStatus, notes = null) {
    try {
        // Get approval details
        const { data: approval } = await supabaseAdmin
            .from(TABLES.CITY_APPROVALS)
            .select(`
                *,
                projects(name, project_members(user_id, users(email, full_name)))
            `)
            .eq('id', approvalId)
            .single();

        if (!approval) {
            console.warn('Approval not found for update notification');
            return;
        }

        // Send notification to all project members
        for (const member of approval.projects?.project_members || []) {
            if (member.users) {
                await resendEmailService.sendCityApprovalUpdateEmail(member.users.email, {
                    recipient_name: member.users.full_name,
                    project_name: approval.projects.name,
                    submission_type: approval.submission_type,
                    old_status: oldStatus,
                    new_status: newStatus,
                    notes: notes || approval.notes,
                    reviewer_name: approval.reviewer_name,
                    approval_id: approvalId
                });
            }
        }

        console.log('✅ City approval update notifications sent');
    } catch (error) {
        console.error('❌ City approval update notification failed:', error);
    }
}

export default {
    notifyTaskAssignment,
    notifyDocumentShared,
    notifyProjectStatusUpdate,
    notifyMention,
    notifyCityApprovalUpdate
};
