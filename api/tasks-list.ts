// =============================
// Tasks List API Endpoint
// =============================
// Demonstrates: Rate Limiting + Caching + Pagination + Advanced Filtering

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter';
import { getFromCache, setInCache } from '../lib/cache';
import {
  getPaginationParams,
  getFilterParams,
  createPaginatedResponse,
  applySorting,
  applyPagination,
  applySearch,
} from '../lib/pagination';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * GET /api/tasks-list
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sortBy: Field to sort by (default: created_at)
 * - sortOrder: asc or desc (default: desc)
 * - filter_status: Filter by status
 * - filter_priority: Filter by priority
 * - filter_assigned_to: Filter by assigned user
 * - filter_project_id: Filter by project
 * - search: Search term (searches name and description)
 * - overdue: Show only overdue tasks (boolean)
 * 
 * Example:
 * GET /api/tasks-list?page=1&limit=20&filter_status=in_progress&filter_priority=high&overdue=true
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get pagination parameters
    const paginationParams = getPaginationParams(req);
    
    // Get filter parameters
    const filters = getFilterParams(req, [
      'status',
      'priority',
      'assigned_to_user_id',
      'project_id',
      'created_by_user_id',
    ]);

    // Project ID is required
    const projectId = filters.project_id || req.query.projectId;
    if (!projectId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'project_id is required',
      });
    return;
    }

    // Check cache
    const cacheKey = String(projectId);
    const cacheParams = { ...paginationParams, ...filters, overdue: req.query.overdue };
    const cached = getFromCache('TASK_LIST', cacheKey, cacheParams);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.status(200).json(cached);
    return;
    }

    res.setHeader('X-Cache', 'MISS');

    // Build query
    let query = supabaseAdmin
      .from('tasks')
      .select('*, assigned_to:users(id, full_name, email), project:projects(id, name)', {
        count: 'exact',
      })
      .eq('project_id', projectId);

    // Apply search
    const searchTerm = String(filters.search || req.query.search || '');
    if (searchTerm) {
      query = applySearch(query, searchTerm, ['name', 'description']);
    }

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.assigned_to_user_id) {
      query = query.eq('assigned_to_user_id', filters.assigned_to_user_id);
    }

    // Handle overdue tasks filter
    if (req.query.overdue === 'true') {
      const now = new Date().toISOString();
      query = query.lt('due_date', now).neq('status', 'completed');
    }

    // Apply sorting
    query = applySorting(query, paginationParams, [
      'name',
      'created_at',
      'updated_at',
      'due_date',
      'priority',
      'status',
    ]);

    // Get total count
    const { count } = await query;
    const total = count || 0;

    // Apply pagination
    query = applyPagination(query, paginationParams);

    // Execute
    const { data, error } = await query;

    if (error) {
      console.error('Tasks list query error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch tasks',
      });
    return;
    }

    // Add computed fields
    const tasks = (data || []).map((task: any) => ({
      ...task,
      is_overdue:
        task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== 'completed',
    }));

    // Create response
    const response = createPaginatedResponse(tasks, total, paginationParams, {
      filters,
      projectId,
      overdueCount: tasks.filter((t: any) => t.is_overdue).length,
    });

    // Cache response
    setInCache('TASK_LIST', cacheKey, response, cacheParams);

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error('Tasks list error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
}

export default withRateLimit(handler, 'READ');


