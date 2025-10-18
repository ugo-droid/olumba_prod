// =============================
// Pagination Helper
// =============================
// Standardized pagination for all list endpoints

import { VercelRequest } from '@vercel/node';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: Record<string, any>;
}

// Default pagination limits
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Parse pagination parameters from request
 */
export function getPaginationParams(req: VercelRequest): PaginationParams {
  const query = req.query;

  // Parse page number
  let page = parseInt(String(query.page || PAGINATION_DEFAULTS.PAGE), 10);
  if (isNaN(page) || page < 1) {
    page = PAGINATION_DEFAULTS.PAGE;
  }

  // Parse limit
  let limit = parseInt(String(query.limit || PAGINATION_DEFAULTS.LIMIT), 10);
  if (isNaN(limit) || limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
    limit = PAGINATION_DEFAULTS.LIMIT;
  }
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    limit = PAGINATION_DEFAULTS.MAX_LIMIT;
  }

  // Calculate offset
  const offset = (page - 1) * limit;

  // Parse sorting
  const sortBy = String(query.sortBy || query.sort_by || 'created_at');
  const sortOrder = (String(query.sortOrder || query.sort_order || 'desc').toLowerCase() === 'asc'
    ? 'asc'
    : 'desc') as 'asc' | 'desc';

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
  meta?: Record<string, any>
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  const hasNext = params.page < totalPages;
  const hasPrev = params.page > 1;

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
    ...(meta && { meta }),
  };
}

/**
 * Apply pagination to Supabase query
 */
export function applyPagination(
  query: any, // Supabase query builder
  params: PaginationParams
): any {
  return query.range(params.offset, params.offset + params.limit - 1);
}

/**
 * Apply sorting to Supabase query
 */
export function applySorting(
  query: any, // Supabase query builder
  params: PaginationParams,
  allowedFields: string[] = []
): any {
  // Validate sortBy field if allowedFields provided
  if (allowedFields.length > 0 && !allowedFields.includes(params.sortBy!)) {
    // Fall back to default
    params.sortBy = 'created_at';
  }

  return query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });
}

/**
 * Apply filtering to Supabase query
 */
export function applyFilters(
  query: any,
  filters: Record<string, any>,
  allowedFields: string[] = []
): any {
  for (const [field, value] of Object.entries(filters)) {
    // Skip if not in allowed fields
    if (allowedFields.length > 0 && !allowedFields.includes(field)) {
      continue;
    }

    // Skip empty values
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Handle array values (IN query)
    if (Array.isArray(value)) {
      query = query.in(field, value);
      continue;
    }

    // Handle range queries
    if (typeof value === 'object' && 'min' in value) {
      query = query.gte(field, value.min);
    }
    if (typeof value === 'object' && 'max' in value) {
      query = query.lte(field, value.max);
    }

    // Handle exact match
    if (typeof value !== 'object') {
      query = query.eq(field, value);
    }
  }

  return query;
}

/**
 * Parse filter parameters from request
 */
export function getFilterParams(
  req: VercelRequest,
  allowedFields: string[] = []
): Record<string, any> {
  const filters: Record<string, any> = {};
  const query = req.query;

  // Extract filter parameters (prefixed with filter_)
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('filter_')) {
      const field = key.replace('filter_', '');

      if (allowedFields.length === 0 || allowedFields.includes(field)) {
        filters[field] = value;
      }
    }
  }

  // Handle common filter patterns
  if (query.status) {
    filters.status = query.status;
  }
  if (query.search || query.q) {
    filters.search = query.search || query.q;
  }

  return filters;
}

/**
 * Apply search to Supabase query
 * Searches across multiple fields using OR
 */
export function applySearch(
  query: any,
  searchTerm: string,
  searchFields: string[]
): any {
  if (!searchTerm || searchFields.length === 0) {
    return query;
  }

  // Build OR query for search across multiple fields
  const searchConditions = searchFields.map((field) => `${field}.ilike.%${searchTerm}%`).join(',');

  return query.or(searchConditions);
}

/**
 * Complete pagination helper with all features
 */
export async function paginateQuery<T>(
  query: any,
  req: VercelRequest,
  options: {
    allowedSortFields?: string[];
    allowedFilterFields?: string[];
    searchFields?: string[];
    defaultSort?: { field: string; order: 'asc' | 'desc' };
  } = {}
): Promise<{ data: T[]; total: number; params: PaginationParams }> {
  const params = getPaginationParams(req);

  // Apply default sort if provided
  if (options.defaultSort && !req.query.sortBy && !req.query.sort_by) {
    params.sortBy = options.defaultSort.field;
    params.sortOrder = options.defaultSort.order;
  }

  // Get filters
  const filters = getFilterParams(req, options.allowedFilterFields);

  // Apply search if provided
  if (filters.search && options.searchFields) {
    query = applySearch(query, String(filters.search), options.searchFields);
    delete filters.search; // Remove from filters as it's handled separately
  }

  // Apply filters
  query = applyFilters(query, filters, options.allowedFilterFields);

  // Get total count before pagination
  const countQuery = query; // Clone query for count
  const { count } = await countQuery;

  // Apply sorting and pagination
  query = applySorting(query, params, options.allowedSortFields);
  query = applyPagination(query, params);

  // Execute query
  const { data, error } = await query;

  if (error) {
    throw new Error(`Pagination query failed: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    params,
  };
}

/**
 * Create pagination links for response headers
 */
export function getPaginationLinks(
  baseUrl: string,
  params: PaginationParams,
  totalPages: number
): {
  first: string;
  prev?: string;
  next?: string;
  last: string;
} {
  const buildUrl = (page: number) => {
    const url = new URL(baseUrl);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('limit', params.limit.toString());
    if (params.sortBy) {
      url.searchParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      url.searchParams.set('sortOrder', params.sortOrder);
    }
    return url.toString();
  };

  return {
    first: buildUrl(1),
    ...(params.page > 1 && { prev: buildUrl(params.page - 1) }),
    ...(params.page < totalPages && { next: buildUrl(params.page + 1) }),
    last: buildUrl(totalPages),
  };
}

/**
 * Cursor-based pagination (alternative to offset-based)
 * Better for large datasets and real-time data
 */
export interface CursorPaginationParams {
  limit: number;
  cursor?: string;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    nextCursor?: string;
    prevCursor?: string;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Get cursor pagination params from request
 */
export function getCursorPaginationParams(req: VercelRequest): CursorPaginationParams {
  const query = req.query;

  let limit = parseInt(String(query.limit || PAGINATION_DEFAULTS.LIMIT), 10);
  if (isNaN(limit) || limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
    limit = PAGINATION_DEFAULTS.LIMIT;
  }
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    limit = PAGINATION_DEFAULTS.MAX_LIMIT;
  }

  const cursor = query.cursor ? String(query.cursor) : undefined;
  const direction = query.direction === 'backward' ? 'backward' : 'forward';

  return { limit, cursor, direction };
}

/**
 * Create cursor-based paginated response
 */
export function createCursorPaginatedResponse<T extends { id: string }>(
  data: T[],
  params: CursorPaginationParams
): CursorPaginatedResponse<T> {
  const hasNext = data.length === params.limit;
  const hasPrev = !!params.cursor;

  return {
    data,
    pagination: {
      limit: params.limit,
      nextCursor: hasNext && data.length > 0 ? data[data.length - 1].id : undefined,
      prevCursor: hasPrev && data.length > 0 ? data[0].id : undefined,
      hasNext,
      hasPrev,
    },
  };
}


