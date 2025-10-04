/**
 * Clerk Webhooks
 * Handles webhook events from Clerk for user synchronization
 */

import express from 'express';
import { createClerkClient } from '@clerk/backend';
import { Webhook } from 'svix';
import { supabase, supabaseAdmin, TABLES } from '../config/supabase.js';

const router = express.Router();

// Initialize Clerk client for webhook verification
const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Handle Clerk webhook events
 */
router.post('/clerk-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
        
        if (!WEBHOOK_SECRET) {
            console.error('❌ CLERK_WEBHOOK_SECRET is not set');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        // Get headers
        const svix_id = req.headers['svix-id'];
        const svix_timestamp = req.headers['svix-timestamp'];
        const svix_signature = req.headers['svix-signature'];

        if (!svix_id || !svix_timestamp || !svix_signature) {
            console.error('❌ Missing required headers');
            return res.status(400).json({ error: 'Missing required headers' });
        }

        // Verify webhook signature
        const wh = new Webhook(WEBHOOK_SECRET);
        let evt;
        
        try {
            evt = wh.verify(req.body, {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            });
        } catch (err) {
            console.error('❌ Webhook verification failed:', err);
            return res.status(400).json({ error: 'Webhook verification failed' });
        }

        const { type, data } = evt;
        console.log(`📨 Received Clerk webhook: ${type}`);

        // Handle different event types
        switch (type) {
            case 'user.created':
                await handleUserCreated(data);
                break;
            case 'user.updated':
                await handleUserUpdated(data);
                break;
            case 'user.deleted':
                await handleUserDeleted(data);
                break;
            case 'organization.created':
            case 'organization.updated':
            case 'organization.deleted':
                await handleOrganizationEvent(type, data);
                break;
            case 'organizationMembership.created':
            case 'organizationMembership.updated':
            case 'organizationMembership.deleted':
                await handleOrganizationMembership(type, data);
                break;
            case 'organizationInvitation.created':
            case 'organizationInvitation.accepted':
            case 'organizationInvitation.revoked':
                await handleOrganizationInvitation(type, data);
                break;
            case 'session.created':
                await handleSessionCreated(data);
                break;
            case 'session.ended':
                await handleSessionEnded(data);
                break;
            default:
                console.log(`ℹ️ Unhandled webhook event type: ${type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Handle user.created webhook
 */
async function handleUserCreated(data) {
    try {
        const user = data;
        console.log(`👤 Creating user in Supabase: ${user.email_addresses[0]?.email_address}`);

        // Upsert user in Supabase (handles both create and update)
        const { error } = await supabaseAdmin
            .from(TABLES.USERS)
            .upsert({
                id: user.id,
                email: user.email_addresses[0]?.email_address ?? null,
                first_name: user.first_name ?? null,
                last_name: user.last_name ?? null,
                full_name: user.full_name ?? null,
                profile_image_url: user.profile_image_url ?? null,
                role: user.public_metadata?.role || 'member',
                company_id: user.public_metadata?.companyId || null,
                title: user.public_metadata?.title || null,
                phone: user.public_metadata?.phone || null,
                is_active: user.public_metadata?.isActive !== false,
                created_at: new Date(user.created_at).toISOString(),
                last_sign_in_at: user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : null,
                clerk_user_id: user.id
            });

        if (error) {
            console.error('❌ Error creating user in Supabase:', error);
        } else {
            console.log('✅ User created successfully in Supabase');
        }
    } catch (error) {
        console.error('❌ Error handling user.created:', error);
    }
}

/**
 * Handle user.updated webhook
 */
async function handleUserUpdated(data) {
    try {
        const user = data;
        console.log(`👤 Updating user in Supabase: ${user.email_addresses[0]?.email_address}`);

        // Upsert user in Supabase (handles both create and update)
        const { error } = await supabaseAdmin
            .from(TABLES.USERS)
            .upsert({
                id: user.id,
                email: user.email_addresses[0]?.email_address ?? null,
                first_name: user.first_name ?? null,
                last_name: user.last_name ?? null,
                full_name: user.full_name ?? null,
                profile_image_url: user.profile_image_url ?? null,
                role: user.public_metadata?.role || 'member',
                company_id: user.public_metadata?.companyId || null,
                title: user.public_metadata?.title || null,
                phone: user.public_metadata?.phone || null,
                is_active: user.public_metadata?.isActive !== false,
                last_sign_in_at: user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : null,
                updated_at: new Date().toISOString(),
                clerk_user_id: user.id
            });

        if (error) {
            console.error('❌ Error updating user in Supabase:', error);
        } else {
            console.log('✅ User updated successfully in Supabase');
        }
    } catch (error) {
        console.error('❌ Error handling user.updated:', error);
    }
}

/**
 * Handle user.deleted webhook
 */
async function handleUserDeleted(data) {
    try {
        const user = data;
        console.log(`👤 Deleting user from Supabase: ${user.id}`);

        // Soft delete user in Supabase (mark as inactive)
        const { error } = await supabaseAdmin
            .from(TABLES.USERS)
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('clerk_user_id', user.id);

        if (error) {
            console.error('❌ Error deleting user in Supabase:', error);
        } else {
            console.log('✅ User deleted successfully from Supabase');
        }
    } catch (error) {
        console.error('❌ Error handling user.deleted:', error);
    }
}

/**
 * Handle session.created webhook
 */
async function handleSessionCreated(data) {
    try {
        const session = data;
        console.log(`🔐 Session created for user: ${session.user_id}`);

        // Log session creation (optional - for analytics)
        const { error } = await supabaseAdmin
            .from(TABLES.ACTIVITY_LOG)
            .insert({
                user_id: session.user_id,
                action: 'session_created',
                details: {
                    session_id: session.id,
                    ip_address: session.client_ip,
                    user_agent: session.client_user_agent
                },
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Error logging session creation:', error);
        }
    } catch (error) {
        console.error('❌ Error handling session.created:', error);
    }
}

/**
 * Handle session.ended webhook
 */
async function handleSessionEnded(data) {
    try {
        const session = data;
        console.log(`🔐 Session ended for user: ${session.user_id}`);

        // Log session end (optional - for analytics)
        const { error } = await supabaseAdmin
            .from(TABLES.ACTIVITY_LOG)
            .insert({
                user_id: session.user_id,
                action: 'session_ended',
                details: {
                    session_id: session.id,
                    ended_at: new Date().toISOString()
                },
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Error logging session end:', error);
        }
    } catch (error) {
        console.error('❌ Error handling session.ended:', error);
    }
}

/**
 * Handle organization events (created, updated, deleted)
 */
async function handleOrganizationEvent(eventType, data) {
    try {
        const organization = data;
        console.log(`🏢 Handling organization event: ${eventType} - ${organization.name}`);

        switch (eventType) {
            case 'organization.created':
                // Create organization in Supabase
                const { error: createError } = await supabaseAdmin
                    .from(TABLES.ORGANIZATIONS)
                    .insert({
                        id: organization.id,
                        name: organization.name,
                        slug: organization.slug,
                        image_url: organization.image_url,
                        created_at: new Date(organization.created_at).toISOString(),
                        updated_at: new Date(organization.updated_at).toISOString()
                    });

                if (createError) {
                    console.error('❌ Error creating organization in Supabase:', createError);
                } else {
                    console.log('✅ Organization created successfully in Supabase');
                }
                break;

            case 'organization.updated':
                // Update organization in Supabase
                const { error: updateError } = await supabaseAdmin
                    .from(TABLES.ORGANIZATIONS)
                    .update({
                        name: organization.name,
                        slug: organization.slug,
                        image_url: organization.image_url,
                        updated_at: new Date(organization.updated_at).toISOString()
                    })
                    .eq('id', organization.id);

                if (updateError) {
                    console.error('❌ Error updating organization in Supabase:', updateError);
                } else {
                    console.log('✅ Organization updated successfully in Supabase');
                }
                break;

            case 'organization.deleted':
                // Soft delete organization in Supabase
                const { error: deleteError } = await supabaseAdmin
                    .from(TABLES.ORGANIZATIONS)
                    .update({
                        deleted_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', organization.id);

                if (deleteError) {
                    console.error('❌ Error deleting organization in Supabase:', deleteError);
                } else {
                    console.log('✅ Organization deleted successfully from Supabase');
                }
                break;
        }
    } catch (error) {
        console.error('❌ Error handling organization event:', error);
    }
}

/**
 * Handle organization membership events
 */
async function handleOrganizationMembership(eventType, data) {
    try {
        const membership = data;
        console.log(`👥 Handling organization membership: ${eventType} - User: ${membership.public_user_data?.user_id}`);

        // TODO: Implement organization membership tracking in your database
        // This could involve creating a memberships table to track user-organization relationships
        console.log(`ℹ️ Organization membership event logged: ${eventType}`);
    } catch (error) {
        console.error('❌ Error handling organization membership:', error);
    }
}

/**
 * Handle organization invitation events
 */
async function handleOrganizationInvitation(eventType, data) {
    try {
        const invitation = data;
        console.log(`📧 Handling organization invitation: ${eventType} - Email: ${invitation.email_address}`);

        // TODO: Implement invitation tracking in your database
        // This could involve creating an invitations table to track pending invitations
        console.log(`ℹ️ Organization invitation event logged: ${eventType}`);
    } catch (error) {
        console.error('❌ Error handling organization invitation:', error);
    }
}

export default router;
