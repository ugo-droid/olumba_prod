// =============================
// Response Caching Layer
// =============================
// In-memory caching with TTL support
// Optimized for Vercel serverless environment

import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  USER_PROFILE: 5 * 60, // 5 minutes
  PROJECT_LIST: 60, // 1 minute
  PROJECT_DETAIL: 2 * 60, // 2 minutes
  TASK_LIST: 30, // 30 seconds
  DOCUMENT_LIST: 60, // 1 minute
  ORGANIZATION: 10 * 60, // 10 minutes
  ENTITLEMENTS: 5 * 60, // 5 minutes
  STATIC_DATA: 60 * 60, // 1 hour
} as const;

export type CacheKey = keyof typeof CACHE_TTL;

interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

// In-memory cache store
const cacheStore = new Map<string, CacheEntry>();

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  evictions: 0,
};

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  let evicted = 0;

  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt < now) {
      cacheStore.delete(key);
      evicted++;
    }
  }

  if (evicted > 0) {
    cacheStats.evictions += evicted;
    console.log(`🧹 Cache cleanup: evicted ${evicted} expired entries`);
  }
}, 60 * 1000);

/**
 * Generate cache key from request
 */
function generateCacheKey(
  prefix: string,
  identifier: string,
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) {
    return `${prefix}:${identifier}`;
  }

  // Create deterministic hash of parameters
  const paramString = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash('md5').update(paramString).digest('hex').substring(0, 8);

  return `${prefix}:${identifier}:${hash}`;
}

/**
 * Get data from cache
 */
export function getFromCache<T = any>(
  cacheType: CacheKey,
  identifier: string,
  params?: Record<string, any>
): T | null {
  const key = generateCacheKey(cacheType, identifier, params);
  const entry = cacheStore.get(key);
  const now = Date.now();

  // Cache miss or expired
  if (!entry || entry.expiresAt < now) {
    cacheStats.misses++;
    if (entry) {
      // Expired - clean up
      cacheStore.delete(key);
      cacheStats.evictions++;
    }
    return null;
  }

  // Cache hit
  entry.hits++;
  cacheStats.hits++;
  return entry.data as T;
}

/**
 * Set data in cache
 */
export function setInCache<T = any>(
  cacheType: CacheKey,
  identifier: string,
  data: T,
  params?: Record<string, any>,
  customTtl?: number
): void {
  const key = generateCacheKey(cacheType, identifier, params);
  const ttlSeconds = customTtl || CACHE_TTL[cacheType];
  const now = Date.now();

  cacheStore.set(key, {
    data,
    expiresAt: now + ttlSeconds * 1000,
    createdAt: now,
    hits: 0,
  });

  cacheStats.sets++;
}

/**
 * Delete from cache (invalidation)
 */
export function deleteFromCache(
  cacheType: CacheKey,
  identifier: string,
  params?: Record<string, any>
): boolean {
  const key = generateCacheKey(cacheType, identifier, params);
  const deleted = cacheStore.delete(key);

  if (deleted) {
    cacheStats.deletes++;
  }

  return deleted;
}

/**
 * Delete all cache entries matching a prefix
 * Useful for invalidating related data
 */
export function deleteCacheByPrefix(prefix: string): number {
  let deleted = 0;

  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
      deleted++;
    }
  }

  cacheStats.deletes += deleted;
  return deleted;
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  const size = cacheStore.size;
  cacheStore.clear();
  cacheStats.deletes += size;
  console.log(`🧹 Cache cleared: ${size} entries removed`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats & {
  size: number;
  hitRate: number;
  entries: Array<{
    key: string;
    hits: number;
    age: number;
    ttl: number;
  }>;
} {
  const now = Date.now();
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? (cacheStats.hits / total) * 100 : 0;

  const entries = Array.from(cacheStore.entries())
    .map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: Math.round((now - entry.createdAt) / 1000),
      ttl: Math.max(0, Math.round((entry.expiresAt - now) / 1000)),
    }))
    .sort((a, b) => b.hits - a.hits) // Sort by most hits
    .slice(0, 20); // Top 20 entries

  return {
    ...cacheStats,
    size: cacheStore.size,
    hitRate: Math.round(hitRate * 100) / 100,
    entries,
  };
}

/**
 * Middleware to cache GET responses
 */
export function withCache(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<any>,
  cacheType: CacheKey,
  getIdentifier: (req: VercelRequest) => string
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(req, res);
    }

    const identifier = getIdentifier(req);
    const params = req.query;

    // Try to get from cache
    const cached = getFromCache(cacheType, identifier, params as Record<string, any>);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Age', String(Math.round((Date.now() - cached.createdAt) / 1000)));
      return res.status(200).json(cached);
    }

    // Cache miss - call handler
    res.setHeader('X-Cache', 'MISS');

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setInCache(cacheType, identifier, data, params as Record<string, any>);
      }
      return originalJson(data);
    };

    return handler(req, res);
  };
}

/**
 * Helper for caching user-specific data
 */
export function cacheUser<T>(userId: string, data: T, ttl?: number): void {
  setInCache('USER_PROFILE', userId, data, undefined, ttl);
}

export function getCachedUser<T>(userId: string): T | null {
  return getFromCache<T>('USER_PROFILE', userId);
}

export function invalidateUser(userId: string): void {
  deleteFromCache('USER_PROFILE', userId);
}

/**
 * Helper for caching organization data
 */
export function cacheOrganization<T>(orgId: string, data: T, ttl?: number): void {
  setInCache('ORGANIZATION', orgId, data, undefined, ttl);
}

export function getCachedOrganization<T>(orgId: string): T | null {
  return getFromCache<T>('ORGANIZATION', orgId);
}

export function invalidateOrganization(orgId: string): void {
  deleteCacheByPrefix(`ORGANIZATION:${orgId}`);
  deleteCacheByPrefix(`PROJECT_LIST:${orgId}`);
  deleteCacheByPrefix(`ENTITLEMENTS:${orgId}`);
}

/**
 * Helper for caching project lists
 */
export function cacheProjectList<T>(orgId: string, data: T, filters?: Record<string, any>): void {
  setInCache('PROJECT_LIST', orgId, data, filters);
}

export function getCachedProjectList<T>(orgId: string, filters?: Record<string, any>): T | null {
  return getFromCache<T>('PROJECT_LIST', orgId, filters);
}

export function invalidateProjectList(orgId: string): void {
  deleteCacheByPrefix(`PROJECT_LIST:${orgId}`);
}

/**
 * Helper for invalidating all cache related to a project
 */
export function invalidateProject(projectId: string, orgId?: string): void {
  deleteFromCache('PROJECT_DETAIL', projectId);
  deleteCacheByPrefix(`TASK_LIST:${projectId}`);
  deleteCacheByPrefix(`DOCUMENT_LIST:${projectId}`);

  if (orgId) {
    invalidateProjectList(orgId);
  }
}

/**
 * Warmup cache with frequently accessed data
 * Call this on cold starts or after cache clear
 */
export async function warmupCache(orgId: string, userId: string): Promise<void> {
  // This is a placeholder - implement based on your data access patterns
  console.log(`🔥 Cache warmup initiated for org:${orgId} user:${userId}`);
  // TODO: Pre-fetch and cache commonly accessed data
}


