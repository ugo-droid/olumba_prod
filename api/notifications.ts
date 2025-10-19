// =============================
// Notifications API Endpoint
// =============================

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter';
import { withMonitoring } from '../lib/monitoring';
import { requireAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Notifications Handler
 * GET /api/notifications - Get user's notifications
 * PUT /api/notifications/:id/read - Mark as read
 * PUT /api/notifications/mark-all-read - Mark all as read
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireAuth(req);

    switch (req.method) {
      case 'GET':
        await handleGet(req, res, user);
        return;
      case 'PUT':
        await handlePut(req, res, user);
        return;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    return;
    }
  } catch (error) {
    console.error('Notifications API error:', error);

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
 * GET - Get user's notifications
 */
async function handleGet(req: VercelRequest, res: VercelResponse, user: any) {
  const { unread } = req.query;

  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Filter by unread if requested
  if (unread === 'true') {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Notifications query error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
    return;
  }

  res.status(200).json(data || []);
    return;
}

/**
 * PUT - Mark notifications as read
 */
async function handlePut(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  // Mark all as read
  if (req.url?.includes('/mark-all-read')) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.userId)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all read error:', error);
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    return;
    }

    res.status(200).json({ success: true });
    return;
  }

  // Mark single notification as read
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.userId)
      .select()
      .single();

    if (error) {
      console.error('Mark read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    return;
    }

    res.status(200).json(data);
    return;
  }

  res.status(400).json({ error: 'Invalid request' });
    return;
}

export default withMonitoring(withRateLimit(handler, 'READ'), '/api/notifications');


