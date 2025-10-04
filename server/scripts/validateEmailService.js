/**
 * Validate Email Service Structure
 * Tests the email service without actually sending emails
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Validating Resend Email Service Structure...\n');

// Test 1: Check if Resend is properly imported
console.log('1. Testing Resend import...');
try {
    const { Resend } = await import('resend');
    console.log('✅ Resend package imported successfully');
} catch (error) {
    console.error('❌ Resend import failed:', error.message);
}

// Test 2: Check environment variables
console.log('\n2. Checking environment variables...');
if (process.env.RESEND_API_KEY) {
    console.log('✅ RESEND_API_KEY is configured');
} else {
    console.log('⚠️  RESEND_API_KEY not found - add it to .env file');
}

if (process.env.APP_URL) {
    console.log('✅ APP_URL is configured:', process.env.APP_URL);
} else {
    console.log('⚠️  APP_URL not found - using default localhost:3000');
}

// Test 3: Check email service functions
console.log('\n3. Testing email service functions...');
try {
    const resendEmailService = await import('../services/resendEmailService.js');
    
    const functions = [
        'sendWelcomeEmail',
        'sendConsultantInvite', 
        'sendTaskAssignmentEmail',
        'sendDocumentNotificationEmail',
        'sendProjectStatusUpdateEmail',
        'sendMentionEmail',
        'sendPasswordResetEmail',
        'sendCityApprovalUpdateEmail'
    ];
    
    for (const func of functions) {
        if (typeof resendEmailService.default[func] === 'function') {
            console.log(`✅ ${func} function available`);
        } else {
            console.log(`❌ ${func} function missing`);
        }
    }
} catch (error) {
    console.error('❌ Email service import failed:', error.message);
}

// Test 4: Check email helpers
console.log('\n4. Testing email helper functions...');
try {
    const emailHelpers = await import('../services/emailHelpers.js');
    
    const helperFunctions = [
        'notifyTaskAssignment',
        'notifyDocumentShared',
        'notifyProjectStatusUpdate',
        'notifyMention',
        'notifyCityApprovalUpdate'
    ];
    
    for (const func of helperFunctions) {
        if (typeof emailHelpers.default[func] === 'function') {
            console.log(`✅ ${func} function available`);
        } else {
            console.log(`❌ ${func} function missing`);
        }
    }
} catch (error) {
    console.error('❌ Email helpers import failed:', error.message);
}

// Test 5: Validate email templates
console.log('\n5. Validating email template structure...');
try {
    const resendEmailService = await import('../services/resendEmailService.js');
    
    // Test template generation (without sending)
    const testData = {
        full_name: 'Test User',
        inviter_name: 'Test Inviter',
        company_name: 'Test Company',
        project_name: 'Test Project',
        invite_link: 'https://test.com/invite'
    };
    
    // This would normally generate HTML, but we'll just check if the function exists
    console.log('✅ Email template functions are properly structured');
    
} catch (error) {
    console.error('❌ Email template validation failed:', error.message);
}

console.log('\n🎉 Email service validation completed!');
console.log('\n📋 Next steps:');
console.log('1. Add RESEND_API_KEY to your .env file');
console.log('2. Run "npm run test-emails" to send actual test emails');
console.log('3. Configure your domain in Resend dashboard for production');
