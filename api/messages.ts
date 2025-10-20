// =============================
// Messages API Endpoint
// =============================

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter.js';
import { withMonitoring } from '../lib/monitoring.js';
import { requireAuth } from '../lib/auth.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

/**
 * Messages Handler
 * GET /api/messages/project/:projectId - Get project messages
 * GET /api/messages/activity/:projectId - Get project activity  
 * POST /api/messages - Post new message
 * PUT /api/messages/:id - Update message
 * DELETE /api/messages/:id - Delete message
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireAuth(req);

    switch (req.method) {
      case 'GET':
        await handleGet(req, res, user);
        return;
      case 'POST':
        await handlePost(req, res, user);
        return;
      case 'PUT':
        await handlePut(req, res, user);
        return;
      case 'DELETE':
        await handleDelete(req, res, user);
        return;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    return;
    }
  } catch (error) {
    console.error('Messages API error:', error);

    if (error instanceof Error && error.message.includes('Authentication')) {
      res.status(401).json({ error: 'Unauthorized' });
    return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
}

/**
 * GET - Get messages or activity
 */
async function handleGet(req: VercelRequest, res: VercelResponse, user: any) {
  // Get project activity
  if (req.url?.includes('/activity/')) {
    const projectId = req.url.split('/activity/')[1];

    // For now, return empty activity - can be enhanced later
    // TODO: Create activity_log table for detailed tracking
    res.status(200).json([]);
    return;
  }

  // Get project messages
  if (req.url?.includes('/project/')) {
    const projectId = req.url.split('/project/')[1];

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        user:users(id, full_name, email, profile_photo)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Messages query error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    return;
    }

    // Transform to include sender_name
    const messages = (data || []).map((msg: any) => ({
      ...msg,
      sender_name: msg.user?.full_name || 'Unknown User',
      sender_photo: msg.user?.profile_photo,
    }));

    res.status(200).json(messages);
    return;
  }

  res.status(400).json({ error: 'Invalid request' });
    return;
}

/**
 * POST - Create new message
 */
async function handlePost(req: VercelRequest, res: VercelResponse, user: any) {
  const { project_id, content, mentions, parent_id } = req.body as any;

  if (!project_id || !content) {
    res.status(400).json({ error: 'Project ID and content are required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      project_id,
      user_id: user.userId,
      content,
      mentions,
      parent_id: parent_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ error: 'Failed to post message' });
    return;
  }

  // TODO: Send notifications for mentions
  // TODO: Send email notifications

  res.status(201).json(data);
    return;
}

/**
 * PUT - Update message
 */
async function handlePut(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ error: 'Message ID required' });
    return;
  }

  const { content } = req.body as any;

  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.userId) // Can only update own messages
    .select()
    .single();

  if (error) {
    console.error('Message update error:', error);
    res.status(500).json({ error: 'Failed to update message' });
    return;
  }

  res.status(200).json(data);
    return;
}

/**
 * DELETE - Delete message
 */
async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ error: 'Message ID required' });
    return;
  }

  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.userId); // Can only delete own messages

  if (error) {
    console.error('Message deletion error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
    return;
  }

  res.status(200).json({ success: true });
    return;
}

export default withMonitoring(withRateLimit(handler, 'WRITE'), '/api/messages');


