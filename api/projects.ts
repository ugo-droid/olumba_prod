// =============================
// Projects API Endpoint
// =============================

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter';
import { withMonitoring } from '../lib/monitoring';
import { requireAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { invalidateProjectList } from '../lib/cache';

/**
 * Universal Projects Handler
 * GET /api/projects - List all projects for user's organization
 * GET /api/projects/:id - Get single project
 * POST /api/projects - Create new project
 * PUT /api/projects/:id - Update project
 * DELETE /api/projects/:id - Delete project
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Authenticate user
    const user = await requireAuth(req);

    // Handle different HTTP methods
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
    console.error('Projects API error:', error);
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      res.status(401).json({ error: 'Unauthorized', message: error.message });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET - List projects or get single project
 */
async function handleGet(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  // Get single project
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        created_by:users!projects_created_by_user_id_fkey(id, full_name, email),
        members:project_members(
          id,
          role,
          user:users(id, full_name, email, profile_photo)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ error: 'Project not found' });
    return;
    }

    res.status(200).json(data);
    return;
  }

  // List all projects for user's organization
  if (!user.organizationId) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select(`
      *,
      created_by:users!projects_created_by_user_id_fkey(id, full_name),
      members:project_members(count)
    `)
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Projects list error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
    return;
  }

  // Add computed fields
  const projects = (data || []).map((project: any) => ({
    ...project,
    member_count: project.members?.[0]?.count || 0,
    overdue_tasks: 0, // TODO: Query tasks table
  }));

  res.status(200).json(projects);
    return;
}

/**
 * POST - Create new project
 */
async function handlePost(req: VercelRequest, res: VercelResponse, user: any) {
  if (!user.organizationId) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  const { name, description, start_date, deadline, address, budget } = req.body as any;

  if (!name) {
    res.status(400).json({ error: 'Project name is required' });
    return;
  }

  // Create project
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      name,
      description,
      start_date,
      deadline,
      address,
      budget,
      organization_id: user.organizationId,
      created_by_user_id: user.userId,
      status: 'planning',
    })
    .select()
    .single();

  if (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: 'Failed to create project' });
    return;
  }

  // Add creator as project member
  await supabaseAdmin.from('project_members').insert({
    project_id: data.id,
    user_id: user.userId,
    role: 'owner',
  });

  // Invalidate project list cache
  invalidateProjectList(user.organizationId);

  res.status(201).json(data);
    return;
}

/**
 * PUT - Update project
 */
async function handlePut(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ error: 'Project ID required' });
    return;
  }

  const updates = req.body;

  // Only allow specific fields to be updated
  const allowedFields = [
    'name',
    'description',
    'status',
    'start_date',
    'deadline',
    'address',
    'budget',
  ];

  const filteredUpdates: any = {};
  for (const field of allowedFields) {
    if (field in updates) {
      filteredUpdates[field] = updates[field];
    }
  }

  filteredUpdates.updated_at = new Date().toISOString();

  const { data, error} = await supabaseAdmin
    .from('projects')
    .update(filteredUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Project update error:', error);
    res.status(500).json({ error: 'Failed to update project' });
    return;
  }

  // Invalidate cache
  if (user.organizationId) {
    invalidateProjectList(user.organizationId);
  }

  res.status(200).json(data);
    return;
}

/**
 * DELETE - Delete project
 */
async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ error: 'Project ID required' });
    return;
  }

  const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);

  if (error) {
    console.error('Project deletion error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
    return;
  }

  // Invalidate cache
  if (user.organizationId) {
    invalidateProjectList(user.organizationId);
  }

  res.status(200).json({ success: true });
    return;
}

// Apply rate limiting and monitoring
export default withMonitoring(withRateLimit(handler, 'READ'), '/api/projects');


