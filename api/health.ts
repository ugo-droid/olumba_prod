// =============================
// Health Check & Monitoring Endpoint
// =============================
// Provides system health status and metrics

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getHealthStatus } from '../lib/monitoring';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * GET /api/health
 * 
 * Returns comprehensive health status
 * No authentication required (public endpoint)
 * 
 * Response:
 * - status: healthy | degraded | unhealthy
 * - checks: database, storage, auth status
 * - metrics: performance data
 * - timestamp: current time
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Basic health check
    const health = await getHealthStatus();

    // Test database connection
    const { error: dbError } = await supabaseAdmin.from('organizations').select('id').limit(1);
    health.checks.database = !dbError;

    // Determine HTTP status based on health
    const httpStatus =
      health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return res.status(httpStatus).json({
      status: health.status,
      timestamp: health.timestamp,
      uptime: Math.round(health.uptime),
      version: process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'production',
      checks: health.checks,
      metrics: {
        requests: health.metrics.requests,
        cache: {
          hitRate: health.metrics.cache.hitRate,
          size: health.metrics.cache.size,
        },
        rateLimit: {
          activeClients: health.metrics.rateLimit.totalEntries,
        },
      },
      // Only include detailed errors for admins
      ...(req.query.detailed === 'true' && {
        errors: health.errors,
        fullMetrics: health.metrics,
      }),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

