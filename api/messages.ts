// =============================
// Messages API Endpoint
// =============================

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter';
import { withMonitoring } from '../lib/monitoring';
import { requireAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabaseAdmin';

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
        return await handleGet(req, res, user);
      case 'POST':
        return await handlePost(req, res, user);
      case 'PUT':
        return await handlePut(req, res, user);
      case 'DELETE':
        return await handleDelete(req, res, user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Messages API error:', error);

    if (error instanceof Error && error.message.includes('Authentication')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
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
    return res.status(200).json([]);
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
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Transform to include sender_name
    const messages = (data || []).map((msg: any) => ({
      ...msg,
      sender_name: msg.user?.full_name || 'Unknown User',
      sender_photo: msg.user?.profile_photo,
    }));

    return res.status(200).json(messages);
  }

  return res.status(400).json({ error: 'Invalid request' });
}

/**
 * POST - Create new message
 */
async function handlePost(req: VercelRequest, res: VercelResponse, user: any) {
  const { project_id, content, mentions, parent_id } = req.body as any;

  if (!project_id || !content) {
    return res.status(400).json({ error: 'Project ID and content are required' });
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
    return res.status(500).json({ error: 'Failed to post message' });
  }

  // TODO: Send notifications for mentions
  // TODO: Send email notifications

  return res.status(201).json(data);
}

/**
 * PUT - Update message
 */
async function handlePut(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Message ID required' });
  }

  const { content } = req.body as any;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
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
    return res.status(500).json({ error: 'Failed to update message' });
  }

  return res.status(200).json(data);
}

/**
 * DELETE - Delete message
 */
async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Message ID required' });
  }

  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', id)
    .eq('user_id', user.userId); // Can only delete own messages

  if (error) {
    console.error('Message deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }

  return res.status(200).json({ success: true });
}

export default withMonitoring(withRateLimit(handler, 'WRITE'), '/api/messages');


