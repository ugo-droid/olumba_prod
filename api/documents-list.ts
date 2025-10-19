// =============================
// Documents List API Endpoint
// =============================
// Demonstrates: Rate Limiting + Caching + Pagination + File Metadata

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
import { StorageHelpers } from '../lib/storage';

/**
 * GET /api/documents-list
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sortBy: Field to sort by (default: uploaded_at)
 * - sortOrder: asc or desc (default: desc)
 * - filter_project_id: Filter by project
 * - filter_discipline: Filter by discipline
 * - filter_mime_type: Filter by file type
 * - search: Search term (searches name and description)
 * 
 * Response includes:
 * - Document metadata
 * - Formatted file sizes
 * - Upload statistics
 * 
 * Example:
 * GET /api/documents-list?page=1&limit=20&filter_project_id=xxx&filter_discipline=Architectural
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
      'project_id',
      'organization_id',
      'discipline',
      'mime_type',
      'uploaded_by_user_id',
    ]);

    // Either project_id or organization_id required
    const projectId = filters.project_id || req.query.projectId;
    const organizationId = filters.organization_id || req.query.organizationId;

    if (!projectId && !organizationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Either project_id or organization_id is required',
      });
    return;
    }

    // Check cache
    const cacheKey = String(projectId || organizationId);
    const cacheParams = { ...paginationParams, ...filters };
    const cached = getFromCache('DOCUMENT_LIST', cacheKey, cacheParams);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.status(200).json(cached);
    return;
    }

    res.setHeader('X-Cache', 'MISS');

    // Build query
    let query = supabaseAdmin
      .from('documents')
      .select(
        `
        *,
        uploaded_by:users(id, full_name, email),
        project:projects(id, name, organization_id)
      `,
        { count: 'exact' }
      );

    // Apply primary filter
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Apply search
    const searchTerm = String(filters.search || req.query.search || '');
    if (searchTerm) {
      query = applySearch(query, searchTerm, ['name', 'description']);
    }

    // Apply filters
    if (filters.discipline) {
      query = query.eq('discipline', filters.discipline);
    }
    if (filters.mime_type) {
      query = query.eq('mime_type', filters.mime_type);
    }
    if (filters.uploaded_by_user_id) {
      query = query.eq('uploaded_by_user_id', filters.uploaded_by_user_id);
    }

    // Apply sorting
    query = applySorting(query, paginationParams, [
      'name',
      'uploaded_at',
      'file_size',
      'discipline',
      'mime_type',
    ]);

    // Get total count
    const { count } = await query;
    const total = count || 0;

    // Apply pagination
    query = applyPagination(query, paginationParams);

    // Execute
    const { data, error } = await query;

    if (error) {
      console.error('Documents list query error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch documents',
      });
    return;
    }

    // Enhance with formatted data
    const documents = (data || []).map((doc: any) => ({
      ...doc,
      file_size_formatted: StorageHelpers.formatBytes(doc.file_size || 0),
      file_extension: doc.name?.split('.').pop()?.toLowerCase() || 'unknown',
    }));

    // Calculate statistics
    const totalSize = documents.reduce((sum: number, doc: any) => sum + (doc.file_size || 0), 0);
    const disciplineBreakdown = documents.reduce((acc: Record<string, number>, doc: any) => {
      const discipline = doc.discipline || 'Uncategorized';
      acc[discipline] = (acc[discipline] || 0) + 1;
      return acc;
    }, {});

    // Create response
    const response = createPaginatedResponse(documents, total, paginationParams, {
      filters,
      projectId,
      organizationId,
      stats: {
        totalSize,
        totalSizeFormatted: StorageHelpers.formatBytes(totalSize),
        disciplineBreakdown,
      },
    });

    // Cache response
    setInCache('DOCUMENT_LIST', cacheKey, response, cacheParams);

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error('Documents list error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
}

export default withRateLimit(handler, 'READ');


