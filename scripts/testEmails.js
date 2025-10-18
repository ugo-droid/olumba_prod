/**
 * Test Script for Resend Email Service
 * Tests all email templates with sample data
 */

import dotenv from 'dotenv';
import resendEmailService from '../lib/resendEmail.js';

// Load environment variables
dotenv.config();

// Test email configuration
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

console.log('🧪 Testing Resend Email Service...\n');

async function testWelcomeEmail() {
    console.log('📧 Testing Welcome Email...');
    try {
        const result = await resendEmailService.sendWelcomeEmail(TEST_EMAIL, {
            full_name: 'John Doe'
        });
        console.log('✅ Welcome email sent successfully:', result.messageId);
    } catch (error) {
        console.error('❌ Welcome email failed:', error.message);
    }
    console.log('');
}

async function testConsultantInvite() {
    console.log('📧 Testing Consultant Invite Email...');
    try {
        const result = await resendEmailService.sendConsultantInvite(TEST_EMAIL, {
            inviter_name: 'Jane Smith',
            company_name: 'Acme Architecture',
            project_name: 'Downtown Office Complex',
            project_description: 'A modern 20-story office building in the heart of downtown',
            invite_link: 'https://olumba.app/accept-invite/abc123'
        });
        console.log('✅ Consultant invite email sent successfully:', result.messageId);
    } catch (error) {
        console.error('❌ Consultant invite email failed:', error.message);
    }
    console.log('');
}

async function testTaskAssignment() {
    console.log('📧 Testing Task Assignment Email...');
    try {
        const result = await resendEmailService.sendTaskAssignmentEmail(TEST_EMAIL, {
            assignee_name: 'Mike Johnson',
            assigner_name: 'Sarah Wilson',
            task_name: 'Review Building Plans',
            task_description: 'Please review the structural plans for the foundation and provide feedback',
            priority: 'high',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            project_name: 'Downtown Office Complex',
            task_id: 'task_123'
        });
        console.log('✅ Task assignment email sent successfully:', result.messageId);
    } catch (error) {
        console.error('❌ Task assignment email failed:', error.message);
    }
    console.log('');
}

async function testDocumentNotification() {
    console.log('📧 Testing Document Notification Email...');
    try {
        const result = await resendEmailService.sendDocumentNotificationEmail(TEST_EMAIL, {
            recipient_name: 'Alex Brown',
            sharer_name: 'Emma Davis',
            file_name: 'Structural_Plans_v2.1.pdf',
            file_size: 2048576, // 2MB
            discipline: 'Structural',
            description: 'Updated structural plans with foundation modifications',
            project_name: 'Downtown Office Complex',
            document_id: 'doc_456'
        });
        console.log('✅ Document notification email sent successfully:', result.messageId);
    } catch (error) {
        console.error('❌ Document notification email failed:', error.message);
    }
    console.log('');
}

async function testProjectStatusUpdate() {
    console.log('📧 Testing Project Status Update Email...');
    try {
        const result = await resendEmailService.sendProjectStatusUpdateEmail(TEST_EMAIL, {
            member_name: 'David Lee',
            project_name: 'Downtown Office Complex',
            old_status: 'planning',
            new_status: 'active',
            update_message: 'All permits have been approved and construction can begin',
            project_id: 'proj_789'
        });
        console.log('✅ Project status update email sent successfully:', result.messageId);
    } catch (error) {
        console.error('❌ Project status update email failed:', error.message);
    }
    console.log('');
}

async function testMentionEmail() {
    console.log('📧 Testing Mention Email...');
    try {
        const result = await resendEmailService.sendMentionEmail(TEST_EMAIL, {
            mentioned_user_name: 'Lisa Chen',
            sender_name: 'Tom Anderson',
            message_content: 'Hey Lisa, could you review the electrical plans and let me know if the load calculations look correct? I noticed some discrepancies in the panel schedules.',
            project_name: 'Downtown Office Complex',
            project_link: 'https://olumba.app/projects/proj_789'
        });
        console.log('✅ Mention email sent successfully:', result.messageId);
    } catch (error) {
        console.error('❌ Mention email failed:', error.message);
    }
    console.log('');
}

async function testPasswordReset() {
    console.log('📧 Testing Password Reset Email...');
    try {
        const result = await resendEmailService.sendPasswordResetEmail(TEST_EMAIL, {
            user_name: 'Robert Taylor',
            reset_link: 'https://olumba.app/reset-password/token123'
        });
        console.log('✅ Password reset email sent successfully:', result.messageId);
    } catch (error) {
        console.error('❌ Password reset email failed:', error.message);
    }
    console.log('');
}

async function testCityApprovalUpdate() {
    console.log('📧 Testing City Approval Update Email...');
    try {
        const result = await resendEmailService.sendCityApprovalUpdateEmail(TEST_EMAIL, {
            recipient_name: 'Maria Rodriguez',
            project_name: 'Downtown Office Complex',
            submission_type: 'Building Permit',
            old_status: 'under_review',
            new_status: 'approved',
            notes: 'All requirements have been met. Permit approved with standard conditions.',
            reviewer_name: 'John Building Inspector',
            approval_id: 'approval_101'
        });
        console.log('✅ City approval update email sent successfully:', result.messageId);
    } catch (error) {
        console.error('❌ City approval update email failed:', error.message);
    }
    console.log('');
}

async function runAllTests() {
    console.log('🚀 Starting email service tests...\n');
    console.log(`📧 Test emails will be sent to: ${TEST_EMAIL}\n`);

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not found in environment variables');
        console.log('Please add RESEND_API_KEY to your .env file');
        process.exit(1);
    }

    await testWelcomeEmail();
    await testConsultantInvite();
    await testTaskAssignment();
    await testDocumentNotification();
    await testProjectStatusUpdate();
    await testMentionEmail();
    await testPasswordReset();
    await testCityApprovalUpdate();

    console.log('🎉 All email tests completed!');
    console.log(`Check ${TEST_EMAIL} for the test emails.`);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export { runAllTests };
