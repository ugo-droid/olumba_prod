// =============================
// Projects List API Endpoint
// =============================
// Demonstrates: Rate Limiting + Caching + Pagination

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter.js';
import { getCachedProjectList, cacheProjectList, invalidateProjectList } from '../lib/cache';
import {
  getPaginationParams,
  getFilterParams,
  createPaginatedResponse,
  applySorting,
  applyFilters,
  applyPagination,
  applySearch,
} from '../lib/pagination';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

/**
 * GET /api/projects-list
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sortBy: Field to sort by (default: created_at)
 * - sortOrder: asc or desc (default: desc)
 * - filter_status: Filter by status
 * - filter_organizationId: Filter by organization
 * - search: Search term (searches name and description)
 * 
 * Response Headers:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Remaining requests
 * - X-RateLimit-Reset: When the rate limit resets
 * - X-Cache: HIT or MISS
 * 
 * Example:
 * GET /api/projects-list?page=1&limit=20&sortBy=name&sortOrder=asc&filter_status=active&search=design
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
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
      'organization_id',
      'created_by_user_id',
    ]);

    // Extract organization_id for caching (required)
    const organizationId = filters.organization_id || req.query.organizationId;
    if (!organizationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'organization_id is required',
      });
    return;
    }

    // Try to get from cache
    const cacheKey = `${organizationId}`;
    const cacheParams = { ...paginationParams, ...filters };
    const cached = getCachedProjectList(cacheKey, cacheParams);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.status(200).json(cached);
    return;
    }

    res.setHeader('X-Cache', 'MISS');

    // Build Supabase query
    let query = supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply search if provided
    const searchTerm = String(filters.search || req.query.search || '');
    if (searchTerm) {
      query = applySearch(query, searchTerm, ['name', 'description']);
    }

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.created_by_user_id) {
      query = query.eq('created_by_user_id', filters.created_by_user_id);
    }

    // Apply sorting
    query = applySorting(query, paginationParams, [
      'name',
      'created_at',
      'updated_at',
      'deadline',
      'status',
    ]);

    // Get total count
    const { count } = await query;
    const total = count || 0;

    // Apply pagination
    query = applyPagination(query, paginationParams);

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Projects list query error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch projects',
      });
    return;
    }

    // Create paginated response
    const response = createPaginatedResponse(data || [], total, paginationParams, {
      filters,
      organizationId,
    });

    // Cache the response
    cacheProjectList(cacheKey, response, cacheParams);

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error('Projects list error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
}

// Export with rate limiting (READ limit: 100 req/min)
export default withRateLimit(handler, 'READ');


