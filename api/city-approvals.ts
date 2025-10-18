// =============================
// City Approvals API Endpoint
// =============================

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter';
import { withMonitoring } from '../lib/monitoring';
import { requireAuth } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Universal City Approvals Handler
 * GET /api/city-approvals - List all submittals
 * GET /api/city-approvals/:id - Get single submittal
 * POST /api/city-approvals - Create new submittal
 * PUT /api/city-approvals/:id/status - Update status
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
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('City approvals API error:', error);

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
 * GET - List submittals or get single submittal
 */
async function handleGet(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  // Get single submittal
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('city_approvals')
      .select(`
        *,
        project:projects(id, name, organization_id)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Submittal not found' });
    }

    // Get corrections for this submittal (if corrections table exists)
    // For now, return empty array
    const submittalWithCorrections = {
      ...data,
      corrections: [],
      pending_corrections: 0,
    };

    return res.status(200).json(submittalWithCorrections);
  }

  // List all submittals for user's organization
  if (!user.organizationId) {
    return res.status(400).json({ error: 'Organization ID required' });
  }

  // Get all projects in organization
  const { data: orgProjects } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('organization_id', user.organizationId);

  const projectIds = (orgProjects || []).map((p: any) => p.id);

  if (projectIds.length === 0) {
    return res.status(200).json([]);
  }

  const { data, error } = await supabaseAdmin
    .from('city_approvals')
    .select(`
      *,
      project:projects(id, name)
    `)
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('City approvals list error:', error);
    return res.status(500).json({ error: 'Failed to fetch submittals' });
  }

  // Add computed fields
  const submittals = (data || []).map((submittal: any) => ({
    ...submittal,
    project_name: submittal.project?.name,
    pending_corrections: 0, // TODO: Count from corrections table
  }));

  return res.status(200).json(submittals);
}

/**
 * POST - Create new submittal
 */
async function handlePost(req: VercelRequest, res: VercelResponse, user: any) {
  const {
    project_id,
    submittal_name,
    submittal_type,
    city_jurisdiction,
    plan_check_number,
    submission_date,
    deadline,
    city_official,
    notes,
    document_ids,
  } = req.body as any;

  if (!project_id || !submittal_name) {
    return res.status(400).json({ error: 'Project ID and submittal name are required' });
  }

  const { data, error } = await supabaseAdmin
    .from('city_approvals')
    .insert({
      project_id,
      submittal_name,
      submittal_type,
      city_jurisdiction,
      plan_check_number,
      submission_date,
      deadline,
      city_official,
      notes,
      document_ids,
      status: 'submitted',
      submitted_by_user_id: user.userId,
    })
    .select()
    .single();

  if (error) {
    console.error('City approval creation error:', error);
    return res.status(500).json({ error: 'Failed to create submittal' });
  }

  return res.status(201).json(data);
}

/**
 * PUT - Update submittal status
 */
async function handlePut(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Submittal ID required' });
  }

  // Check if this is a status update
  if (req.url?.includes('/status')) {
    const { status, city_official, notes } = req.body as any;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (city_official) updates.city_official = city_official;
    if (notes) updates.notes = notes;

    // Set review/approval dates
    if (status === 'under_review' && !updates.review_date) {
      updates.review_date = new Date().toISOString();
    }
    if (status === 'approved' && !updates.approval_date) {
      updates.approval_date = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('city_approvals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Status update error:', error);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    return res.status(200).json(data);
  }

  // General update
  const updates = req.body;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('city_approvals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('City approval update error:', error);
    return res.status(500).json({ error: 'Failed to update submittal' });
  }

  return res.status(200).json(data);
}

/**
 * DELETE - Delete submittal
 */
async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Submittal ID required' });
  }

  const { error } = await supabaseAdmin.from('city_approvals').delete().eq('id', id);

  if (error) {
    console.error('City approval deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete submittal' });
  }

  return res.status(200).json({ success: true });
}

export default withMonitoring(withRateLimit(handler, 'WRITE'), '/api/city-approvals');


