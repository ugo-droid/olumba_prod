/**
 * Resend Email Service for Olumba
 * Handles all transactional emails using Resend API
 */

import { Resend } from 'resend';

// Initialize Resend client with validation
let resend = null;
if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend email service initialized');
} else {
    console.warn('⚠️  RESEND_API_KEY not found - email service will be in development mode');
}

// Email configuration
const EMAIL_CONFIG = {
    from: 'Olumba <hello@olumba.app>',
    replyTo: 'support@olumba.app',
    appUrl: process.env.APP_URL || 'http://localhost:3000'
};

// Helper function to send email with fallback for dev mode
async function sendEmailWithFallback(emailData, devLogData) {
    if (!resend) {
        console.log(`\n📧 ${devLogData.type} EMAIL (DEV MODE):`);
        console.log('───────────────────────────────');
        console.log('To:', emailData.to[0]);
        console.log('Subject:', emailData.subject);
        if (devLogData.extraInfo) {
            Object.entries(devLogData.extraInfo).forEach(([key, value]) => {
                console.log(`${key}:`, value);
            });
        }
        console.log('───────────────────────────────\n');
        return { success: true, messageId: 'dev-mode' };
    }

    const data = await resend.emails.send(emailData);
    console.log(`✅ ${devLogData.type} email sent:`, data.id);
    return { success: true, messageId: data.id };
}

// Brand colors and styling
const BRAND_STYLES = {
    primaryColor: '#2171f2',
    secondaryColor: '#1557c0',
    textColor: '#22223B',
    lightTextColor: '#6b7280',
    backgroundColor: '#f5f7f8',
    borderColor: '#e5e7eb'
};

/**
 * Base HTML template with Olumba branding
 */
const getBaseTemplate = (title, content, ctaButton = null, ctaLink = null) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: ${BRAND_STYLES.textColor};
            margin: 0;
            padding: 0;
            background-color: ${BRAND_STYLES.backgroundColor};
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #FFFFFF;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, ${BRAND_STYLES.primaryColor} 0%, ${BRAND_STYLES.secondaryColor} 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            width: 48px;
            height: 48px;
            margin: 0 auto 15px;
        }
        .header h1 {
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 900;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: ${BRAND_STYLES.textColor};
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 20px 0;
        }
        .content p {
            color: ${BRAND_STYLES.lightTextColor};
            font-size: 16px;
            margin: 0 0 15px 0;
        }
        .info-box {
            background: ${BRAND_STYLES.backgroundColor};
            border-left: 4px solid ${BRAND_STYLES.primaryColor};
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
        }
        .info-box h3 {
            color: ${BRAND_STYLES.primaryColor};
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 10px 0;
        }
        .info-box p {
            margin: 5px 0;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: ${BRAND_STYLES.primaryColor};
            color: #FFFFFF;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            margin: 20px 0;
            transition: background 0.3s;
        }
        .cta-button:hover {
            background: ${BRAND_STYLES.secondaryColor};
        }
        .link-box {
            background: ${BRAND_STYLES.backgroundColor};
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            word-break: break-all;
            font-size: 12px;
            color: ${BRAND_STYLES.lightTextColor};
        }
        .footer {
            background: ${BRAND_STYLES.backgroundColor};
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: ${BRAND_STYLES.lightTextColor};
        }
        .footer a {
            color: ${BRAND_STYLES.primaryColor};
            text-decoration: none;
        }
        .task-item {
            background: #f8fafc;
            border: 1px solid ${BRAND_STYLES.borderColor};
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
        }
        .priority-high { border-left: 4px solid #ef4444; }
        .priority-medium { border-left: 4px solid #f59e0b; }
        .priority-low { border-left: 4px solid #10b981; }
        .document-item {
            background: #f8fafc;
            border: 1px solid ${BRAND_STYLES.borderColor};
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            display: flex;
            align-items: center;
        }
        .document-icon {
            width: 24px;
            height: 24px;
            margin-right: 10px;
            opacity: 0.7;
        }
        @media (max-width: 600px) {
            .container {
                margin: 20px auto;
                border-radius: 0;
            }
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <svg class="logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path clip-rule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="white" fill-rule="evenodd"/>
            </svg>
            <h1>Olumba</h1>
        </div>
        
        <div class="content">
            ${content}
            
            ${ctaButton && ctaLink ? `
                <center>
                    <a href="${ctaLink}" class="cta-button">
                        ${ctaButton}
                    </a>
                </center>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>This is an automated message from Olumba.</p>
            <p>© 2024 Olumba. All rights reserved.</p>
            <p style="margin-top: 10px;">
                <a href="${EMAIL_CONFIG.appUrl}">Visit Olumba</a> | 
                <a href="${EMAIL_CONFIG.appUrl}/help">Help Center</a> |
                <a href="${EMAIL_CONFIG.appUrl}/unsubscribe">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Send welcome email after user signup
 */
export async function sendWelcomeEmail(recipientEmail, userData) {
    const content = `
        <h2>Welcome to Olumba! 🎉</h2>
        
        <p>Hi ${userData.full_name},</p>
        
        <p>Welcome to Olumba, the modern platform for AEC project management and collaboration!</p>
        
        <div class="info-box">
            <h3>What you can do with Olumba:</h3>
            <p>• Create and manage AEC projects</p>
            <p>• Collaborate with consultants and clients</p>
            <p>• Track tasks and project progress</p>
            <p>• Share and version documents</p>
            <p>• Get city approval updates</p>
        </div>
        
        <p>Your account is ready to go. Click the button below to get started with your first project!</p>
    `;

    const emailHtml = getBaseTemplate(
        'Welcome to Olumba',
        content,
        'Get Started',
        `${EMAIL_CONFIG.appUrl}/dashboard`
    );

    try {
        const data = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: [recipientEmail],
            subject: 'Welcome to Olumba! 🎉',
            html: emailHtml,
            text: `Welcome to Olumba, ${userData.full_name}! Your account is ready. Visit ${EMAIL_CONFIG.appUrl}/dashboard to get started.`
        });

        console.log('✅ Welcome email sent:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Welcome email failed:', error);
        throw error;
    }
}

/**
 * Send consultant invitation email
 */
export async function sendConsultantInvite(recipientEmail, invitationData) {
    const content = `
        <h2>You've been invited to join a project! 🎯</h2>
        
        <p>Hi there,</p>
        
        <p><strong>${invitationData.inviter_name}</strong> from <strong>${invitationData.company_name}</strong> has invited you to join as a consultant on an AEC project in Olumba.</p>
        
        <div class="info-box">
            <h3>${invitationData.project_name}</h3>
            <p><strong>Role:</strong> Consultant</p>
            <p><strong>Company:</strong> ${invitationData.company_name}</p>
            ${invitationData.project_description ? `<p><strong>Description:</strong> ${invitationData.project_description}</p>` : ''}
        </div>
        
        <p>Click the button below to accept the invitation and get access to project files and collaboration tools:</p>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
            Or copy and paste this link into your browser:
        </p>
        <div class="link-box">
            ${invitationData.invite_link}
        </div>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
            <strong>What happens next?</strong><br>
            1. Create your account or log in<br>
            2. You'll automatically be added to the project<br>
            3. Access project files, tasks, and collaboration tools<br>
            4. Start collaborating with the team
        </p>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 20px;">
            This invitation expires in <strong>7 days</strong>.
        </p>
    `;

    const emailHtml = getBaseTemplate(
        'Project Invitation',
        content,
        'Join Project on Olumba',
        invitationData.invite_link
    );

    try {
        return await sendEmailWithFallback(
            {
                from: EMAIL_CONFIG.from,
                to: [recipientEmail],
                subject: `You're invited to join ${invitationData.project_name} on Olumba`,
                html: emailHtml,
                text: `You've been invited to join ${invitationData.project_name} as a consultant. Visit ${invitationData.invite_link} to accept.`
            },
            {
                type: 'CONSULTANT INVITATION',
                extraInfo: {
                    'Project': invitationData.project_name,
                    'Link': invitationData.invite_link
                }
            }
        );
    } catch (error) {
        console.error('❌ Consultant invite email failed:', error);
        throw error;
    }
}

/**
 * Send task assignment notification email
 */
export async function sendTaskAssignmentEmail(recipientEmail, taskData) {
    const priorityClass = `priority-${taskData.priority}`;
    const priorityEmoji = {
        'urgent': '🔴',
        'high': '🟠',
        'medium': '🟡',
        'low': '🟢'
    };

    const content = `
        <h2>New Task Assigned to You! 📋</h2>
        
        <p>Hi ${taskData.assignee_name},</p>
        
        <p><strong>${taskData.assigner_name}</strong> has assigned you a new task in the <strong>${taskData.project_name}</strong> project.</p>
        
        <div class="task-item ${priorityClass}">
            <h3 style="margin: 0 0 10px 0; color: ${BRAND_STYLES.textColor};">${priorityEmoji[taskData.priority]} ${taskData.task_name}</h3>
            ${taskData.task_description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${taskData.task_description}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Priority:</strong> ${taskData.priority.toUpperCase()}</p>
            ${taskData.due_date ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(taskData.due_date).toLocaleDateString()}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Project:</strong> ${taskData.project_name}</p>
        </div>
        
        <p>Click the button below to view the task details and get started:</p>
    `;

    const emailHtml = getBaseTemplate(
        'Task Assignment',
        content,
        'View Task Details',
        `${EMAIL_CONFIG.appUrl}/tasks/${taskData.task_id}`
    );

    try {
        const data = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: [recipientEmail],
            subject: `New task assigned: ${taskData.task_name}`,
            html: emailHtml,
            text: `New task assigned: ${taskData.task_name} in ${taskData.project_name}. Priority: ${taskData.priority}. Due: ${taskData.due_date ? new Date(taskData.due_date).toLocaleDateString() : 'No due date'}.`
        });

        console.log('✅ Task assignment email sent:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Task assignment email failed:', error);
        throw error;
    }
}

/**
 * Send document upload/sharing notification email
 */
export async function sendDocumentNotificationEmail(recipientEmail, documentData) {
    const fileTypeIcon = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'dwg': '📐',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'zip': '📦',
        'rar': '📦'
    };

    const extension = documentData.file_name.split('.').pop().toLowerCase();
    const icon = fileTypeIcon[extension] || '📁';

    const content = `
        <h2>New Document Shared! 📄</h2>
        
        <p>Hi ${documentData.recipient_name},</p>
        
        <p><strong>${documentData.sharer_name}</strong> has shared a new document in the <strong>${documentData.project_name}</strong> project.</p>
        
        <div class="document-item">
            <span class="document-icon">${icon}</span>
            <div>
                <h3 style="margin: 0 0 5px 0; color: ${BRAND_STYLES.textColor};">${documentData.file_name}</h3>
                <p style="margin: 0; font-size: 14px; color: ${BRAND_STYLES.lightTextColor};">
                    ${documentData.file_size ? `Size: ${(documentData.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                    ${documentData.discipline ? ` • ${documentData.discipline}` : ''}
                </p>
                ${documentData.description ? `<p style="margin: 5px 0 0 0; font-size: 14px;">${documentData.description}</p>` : ''}
            </div>
        </div>
        
        <p>Click the button below to view and download the document:</p>
    `;

    const emailHtml = getBaseTemplate(
        'Document Shared',
        content,
        'View Document',
        `${EMAIL_CONFIG.appUrl}/documents/${documentData.document_id}`
    );

    try {
        const data = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: [recipientEmail],
            subject: `New document shared: ${documentData.file_name}`,
            html: emailHtml,
            text: `New document shared: ${documentData.file_name} in ${documentData.project_name}. Shared by ${documentData.sharer_name}.`
        });

        console.log('✅ Document notification email sent:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Document notification email failed:', error);
        throw error;
    }
}

/**
 * Send project status update notification email
 */
export async function sendProjectStatusUpdateEmail(recipientEmail, projectData) {
    const statusEmoji = {
        'planning': '📋',
        'active': '🚀',
        'on_hold': '⏸️',
        'completed': '✅',
        'cancelled': '❌'
    };

    const content = `
        <h2>Project Status Updated! 📊</h2>
        
        <p>Hi ${projectData.member_name},</p>
        
        <p>The <strong>${projectData.project_name}</strong> project status has been updated.</p>
        
        <div class="info-box">
            <h3>${statusEmoji[projectData.new_status]} ${projectData.project_name}</h3>
            <p><strong>Previous Status:</strong> ${projectData.old_status}</p>
            <p><strong>New Status:</strong> ${projectData.new_status}</p>
            ${projectData.update_message ? `<p><strong>Update:</strong> ${projectData.update_message}</p>` : ''}
        </div>
        
        <p>Click the button below to view the project details and latest updates:</p>
    `;

    const emailHtml = getBaseTemplate(
        'Project Status Update',
        content,
        'View Project',
        `${EMAIL_CONFIG.appUrl}/projects/${projectData.project_id}`
    );

    try {
        const data = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: [recipientEmail],
            subject: `Project status updated: ${projectData.project_name}`,
            html: emailHtml,
            text: `Project status updated: ${projectData.project_name} - Status changed from ${projectData.old_status} to ${projectData.new_status}.`
        });

        console.log('✅ Project status update email sent:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Project status update email failed:', error);
        throw error;
    }
}

/**
 * Send mention notification email
 */
export async function sendMentionEmail(recipientEmail, mentionData) {
    const content = `
        <h2>You were mentioned in a comment! 💬</h2>
        
        <p>Hi ${mentionData.mentioned_user_name},</p>
        
        <p><strong>${mentionData.sender_name}</strong> mentioned you in a comment on the <strong>${mentionData.project_name}</strong> project.</p>
        
        <div class="info-box">
            <h3>Comment Preview</h3>
            <p style="font-style: italic; margin: 10px 0; padding: 15px; background: #f8fafc; border-radius: 8px;">
                "${mentionData.message_content.length > 200 ? mentionData.message_content.substring(0, 200) + '...' : mentionData.message_content}"
            </p>
        </div>
        
        <p>Click the button below to view the full conversation and respond:</p>
    `;

    const emailHtml = getBaseTemplate(
        'You were mentioned',
        content,
        'View Discussion',
        mentionData.project_link
    );

    try {
        const data = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: [recipientEmail],
            subject: `${mentionData.sender_name} mentioned you in ${mentionData.project_name}`,
            html: emailHtml,
            text: `${mentionData.sender_name} mentioned you in a comment on ${mentionData.project_name}. View: ${mentionData.project_link}`
        });

        console.log('✅ Mention email sent:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Mention email failed:', error);
        throw error;
    }
}

/**
 * Send password reset email (if not handled by Clerk)
 */
export async function sendPasswordResetEmail(recipientEmail, resetData) {
    const content = `
        <h2>Password Reset Request 🔐</h2>
        
        <p>Hi ${resetData.user_name},</p>
        
        <p>We received a request to reset your password for your Olumba account.</p>
        
        <p>Click the button below to reset your password. This link will expire in 1 hour for security reasons.</p>
        
        <div class="link-box">
            If the button doesn't work, copy and paste this link:<br>
            ${resetData.reset_link}
        </div>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 20px;">
            <strong>Didn't request this?</strong><br>
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
    `;

    const emailHtml = getBaseTemplate(
        'Password Reset',
        content,
        'Reset Password',
        resetData.reset_link
    );

    try {
        const data = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: [recipientEmail],
            subject: 'Reset your Olumba password',
            html: emailHtml,
            text: `Reset your Olumba password: ${resetData.reset_link}`
        });

        console.log('✅ Password reset email sent:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Password reset email failed:', error);
        throw error;
    }
}

/**
 * Send city approval status update email
 */
export async function sendCityApprovalUpdateEmail(recipientEmail, approvalData) {
    const statusEmoji = {
        'not_submitted': '📋',
        'submitted': '📤',
        'under_review': '👀',
        'corrections_required': '📝',
        'approved': '✅',
        'rejected': '❌'
    };

    const content = `
        <h2>City Approval Status Update! 🏛️</h2>
        
        <p>Hi ${approvalData.recipient_name},</p>
        
        <p>The city approval status for <strong>${approvalData.project_name}</strong> has been updated.</p>
        
        <div class="info-box">
            <h3>${statusEmoji[approvalData.new_status]} ${approvalData.submission_type}</h3>
            <p><strong>Project:</strong> ${approvalData.project_name}</p>
            <p><strong>Submission Type:</strong> ${approvalData.submission_type}</p>
            <p><strong>Previous Status:</strong> ${approvalData.old_status}</p>
            <p><strong>New Status:</strong> ${approvalData.new_status}</p>
            ${approvalData.notes ? `<p><strong>Notes:</strong> ${approvalData.notes}</p>` : ''}
            ${approvalData.reviewer_name ? `<p><strong>Reviewer:</strong> ${approvalData.reviewer_name}</p>` : ''}
        </div>
        
        <p>Click the button below to view the approval details:</p>
    `;

    const emailHtml = getBaseTemplate(
        'City Approval Update',
        content,
        'View Approval Details',
        `${EMAIL_CONFIG.appUrl}/city-approvals/${approvalData.approval_id}`
    );

    try {
        const data = await resend.emails.send({
            from: EMAIL_CONFIG.from,
            to: [recipientEmail],
            subject: `City approval update: ${approvalData.submission_type}`,
            html: emailHtml,
            text: `City approval status updated for ${approvalData.project_name}: ${approvalData.submission_type} - ${approvalData.old_status} → ${approvalData.new_status}`
        });

        console.log('✅ City approval update email sent:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ City approval update email failed:', error);
        throw error;
    }
}

// Export all email functions
export default {
    sendWelcomeEmail,
    sendConsultantInvite,
    sendTaskAssignmentEmail,
    sendDocumentNotificationEmail,
    sendProjectStatusUpdateEmail,
    sendMentionEmail,
    sendPasswordResetEmail,
    sendCityApprovalUpdateEmail
};
