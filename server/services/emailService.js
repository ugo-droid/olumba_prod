import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure email transporter
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        console.log('✅ Email service configured');
    } catch (error) {
        console.warn('⚠️  Email service failed to initialize:', error.message);
        transporter = null;
    }
} else {
    console.log('📧 Email service in DEV mode - emails will be logged to console');
}

// Email templates
const getConsultantInviteTemplate = (data) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #22223B;
            margin: 0;
            padding: 0;
            background-color: #f5f7f8;
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
            background: linear-gradient(135deg, #2171f2 0%, #1557c0 100%);
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
            color: #22223B;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 20px 0;
        }
        .content p {
            color: #6b7280;
            font-size: 16px;
            margin: 0 0 15px 0;
        }
        .project-info {
            background: #f5f7f8;
            border-left: 4px solid #2171f2;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
        }
        .project-info h3 {
            color: #2171f2;
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 10px 0;
        }
        .project-info p {
            margin: 5px 0;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: #2171f2;
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
            background: #1557c0;
        }
        .link-box {
            background: #f5f7f8;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            word-break: break-all;
            font-size: 12px;
            color: #6b7280;
        }
        .footer {
            background: #f5f7f8;
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .footer a {
            color: #2171f2;
            text-decoration: none;
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
            <h2>You've been invited to join a project! 🎉</h2>
            
            <p>Hi there,</p>
            
            <p><strong>${data.inviter_name}</strong> from <strong>${data.company_name}</strong> has invited you to join as a consultant on an AEC project in Olumba.</p>
            
            <div class="project-info">
                <h3>${data.project_name}</h3>
                <p><strong>Role:</strong> Consultant</p>
                <p><strong>Company:</strong> ${data.company_name}</p>
                ${data.project_description ? `<p><strong>Description:</strong> ${data.project_description}</p>` : ''}
            </div>
            
            <p>Click the button below to accept the invitation and get access to project files and collaboration tools:</p>
            
            <center>
                <a href="${data.invite_link}" class="cta-button">
                    Join Project on Olumba
                </a>
            </center>
            
            <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
                Or copy and paste this link into your browser:
            </p>
            <div class="link-box">
                ${data.invite_link}
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
        </div>
        
        <div class="footer">
            <p>This is an automated message from Olumba.</p>
            <p>© 2024 Olumba. All rights reserved.</p>
            <p style="margin-top: 10px;">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}">Visit Olumba</a> | 
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/help">Help Center</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
};

// Send consultant invitation email
export async function sendConsultantInvite(recipientEmail, invitationData) {
    const emailHtml = getConsultantInviteTemplate(invitationData);
    
    const mailOptions = {
        from: `"Olumba" <${process.env.EMAIL_FROM || 'noreply@olumba.app'}>`,
        to: recipientEmail,
        subject: `You're invited to join ${invitationData.project_name} on Olumba`,
        html: emailHtml,
        text: `You've been invited to join ${invitationData.project_name} as a consultant. Visit ${invitationData.invite_link} to accept.`
    };
    
    try {
        if (transporter) {
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } else {
            // Log email to console in development
            console.log('\n📧 EMAIL WOULD BE SENT:');
            console.log('───────────────────────────────');
            console.log('To:', recipientEmail);
            console.log('Subject:', mailOptions.subject);
            console.log('Link:', invitationData.invite_link);
            console.log('───────────────────────────────\n');
            return { success: true, messageId: 'dev-mode' };
        }
    } catch (error) {
        console.error('❌ Email send failed:', error);
        throw error;
    }
}

// Email template for mentions
const getMentionTemplate = (data) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #22223B;
            margin: 0;
            padding: 0;
            background-color: #f5f7f8;
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
            background: linear-gradient(135deg, #2171f2 0%, #1557c0 100%);
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
        }
        .content {
            padding: 30px;
        }
        .mention-box {
            background: #f0f9ff;
            border-left: 4px solid #2171f2;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .cta-button {
            display: inline-block;
            background: #2171f2;
            color: #FFFFFF;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background: #f5f7f8;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You were mentioned in Olumba</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${data.mentioned_user_name},</h2>
            
            <p><strong>${data.sender_name}</strong> mentioned you in a comment on the <strong>${data.project_name}</strong> project.</p>
            
            <div class="mention-box">
                <p><strong>Comment:</strong></p>
                <p style="font-style: italic; margin: 10px 0;">"${data.message_content}"</p>
            </div>
            
            <p>Click below to view the full conversation and respond:</p>
            
            <center>
                <a href="${data.project_link}" class="cta-button">
                    View Project Discussion
                </a>
            </center>
        </div>
        
        <div class="footer">
            <p>This is an automated message from Olumba.</p>
            <p>© 2024 Olumba. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};

// Send mention notification email
export async function sendMentionEmail(recipientEmail, mentionData) {
    const emailHtml = getMentionTemplate(mentionData);
    
    const mailOptions = {
        from: `"Olumba" <${process.env.EMAIL_FROM || 'noreply@olumba.app'}>`,
        to: recipientEmail,
        subject: `${mentionData.sender_name} mentioned you in ${mentionData.project_name}`,
        html: emailHtml,
        text: `${mentionData.sender_name} mentioned you in a comment on ${mentionData.project_name}. View: ${mentionData.project_link}`
    };
    
    try {
        if (transporter) {
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Mention email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } else {
            // Log email to console in development
            console.log('\n📧 MENTION EMAIL WOULD BE SENT:');
            console.log('───────────────────────────────');
            console.log('To:', recipientEmail);
            console.log('Subject:', mailOptions.subject);
            console.log('Mentioned by:', mentionData.sender_name);
            console.log('Project:', mentionData.project_name);
            console.log('Link:', mentionData.project_link);
            console.log('───────────────────────────────\n');
            return { success: true, messageId: 'dev-mode' };
        }
    } catch (error) {
        console.error('❌ Mention email send failed:', error);
        throw error;
    }
}

// Send welcome email after signup
export async function sendWelcomeEmail(recipientEmail, userData) {
    const mailOptions = {
        from: `"Olumba" <${process.env.EMAIL_FROM || 'noreply@olumba.app'}>`,
        to: recipientEmail,
        subject: 'Welcome to Olumba!',
        html: `
            <h2>Welcome to Olumba, ${userData.full_name}!</h2>
            <p>Your account has been created successfully.</p>
            <p>You can now access your projects and collaborate with your team.</p>
            <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/login.html">Login to Olumba</a></p>
        `
    };
    
    try {
        if (transporter) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log('📧 Welcome email would be sent to:', recipientEmail);
        }
    } catch (error) {
        console.error('Welcome email failed:', error);
    }
}

export default {
    sendConsultantInvite,
    sendWelcomeEmail,
    sendMentionEmail
};
