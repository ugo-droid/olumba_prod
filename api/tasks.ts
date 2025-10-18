// =============================
// Tasks API Endpoint  
// =============================

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter';
import { withMonitoring } from '../lib/monitoring';
import { requireAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Universal Tasks Handler
 * GET /api/tasks/my-tasks - Get current user's tasks
 * GET /api/tasks/project/:projectId - Get project tasks
 * GET /api/tasks/:id - Get single task
 * POST /api/tasks - Create new task
 * PUT /api/tasks/:id - Update task
 * DELETE /api/tasks/:id - Delete task
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
    console.error('Tasks API error:', error);

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
 * GET - List tasks
 */
async function handleGet(req: VercelRequest, res: VercelResponse, user: any) {
  const { id, projectId, myTasks } = req.query;

  // Get my tasks
  if (req.url?.includes('/my-tasks') || myTasks === 'true') {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        project:projects(id, name, organization_id),
        assigned_to:users!tasks_assigned_to_user_id_fkey(id, full_name),
        created_by:users!tasks_created_by_user_id_fkey(id, full_name)
      `)
      .eq('assigned_to_user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('My tasks error:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }

    return res.status(200).json(data || []);
  }

  // Get single task
  if (id && !req.url?.includes('/project/')) {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        project:projects(id, name),
        assigned_to:users!tasks_assigned_to_user_id_fkey(id, full_name, email),
        created_by:users!tasks_created_by_user_id_fkey(id, full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json(data);
  }

  // Get tasks by project
  if (req.url?.includes('/project/') || projectId) {
    const pid = projectId || req.url?.split('/project/')[1];
    
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assigned_to:users!tasks_assigned_to_user_id_fkey(id, full_name, email),
        created_by:users!tasks_created_by_user_id_fkey(id, full_name)
      `)
      .eq('project_id', pid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Project tasks error:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }

    return res.status(200).json(data || []);
  }

  return res.status(400).json({ error: 'Invalid request' });
}

/**
 * POST - Create new task
 */
async function handlePost(req: VercelRequest, res: VercelResponse, user: any) {
  const {
    project_id,
    name,
    description,
    status,
    priority,
    assigned_to_user_id,
    due_date,
  } = req.body as any;

  if (!project_id || !name) {
    return res.status(400).json({ error: 'Project ID and task name are required' });
  }

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({
      project_id,
      name,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      assigned_to_user_id: assigned_to_user_id || null,
      created_by_user_id: user.userId,
      due_date: due_date || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Task creation error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }

  return res.status(201).json(data);
}

/**
 * PUT - Update task
 */
async function handlePut(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Task ID required' });
  }

  const updates = req.body;

  // Allowed fields
  const allowedFields = [
    'name',
    'description',
    'status',
    'priority',
    'assigned_to_user_id',
    'due_date',
    'completed_at',
  ];

  const filteredUpdates: any = {};
  for (const field of allowedFields) {
    if (field in updates) {
      filteredUpdates[field] = updates[field];
    }
  }

  filteredUpdates.updated_at = new Date().toISOString();

  // If marking as completed, set completed_at
  if (filteredUpdates.status === 'completed' && !filteredUpdates.completed_at) {
    filteredUpdates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(filteredUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Task update error:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }

  return res.status(200).json(data);
}

/**
 * DELETE - Delete task
 */
async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Task ID required' });
  }

  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);

  if (error) {
    console.error('Task deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }

  return res.status(200).json({ success: true });
}

export default withMonitoring(withRateLimit(handler, 'WRITE'), '/api/tasks');


