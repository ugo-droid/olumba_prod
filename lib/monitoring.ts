// =============================
// Monitoring & Alerts System
// =============================
// Tracks performance, errors, and sends alerts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getCacheStats } from './cache';
import { getRateLimitStats } from './rateLimiter';

// Monitoring configuration
export const MONITORING_CONFIG = {
  // Alert thresholds
  ERROR_RATE_THRESHOLD: 0.05, // 5% error rate triggers alert
  RESPONSE_TIME_THRESHOLD: 2000, // 2 seconds
  CACHE_HIT_RATE_MINIMUM: 0.5, // 50% cache hit rate minimum
  
  // Logging
  LOG_SLOW_QUERIES: true,
  SLOW_QUERY_THRESHOLD: 1000, // 1 second

  // Alert channels (set in environment)
  ALERT_EMAIL: process.env.ALERT_EMAIL || 'team@olumba.app',
  ALERT_WEBHOOK: process.env.ALERT_WEBHOOK_URL,
} as const;

// Performance metrics storage
interface PerformanceMetric {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
  error?: string;
  userId?: string;
  organizationId?: string;
}

const metricsBuffer: PerformanceMetric[] = [];
const MAX_BUFFER_SIZE = 1000;

// Error tracking
interface ErrorLog {
  message: string;
  stack?: string;
  endpoint: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

const errorBuffer: ErrorLog[] = [];
const MAX_ERROR_BUFFER = 100;

/**
 * Track API request performance
 */
export function trackRequest(metric: PerformanceMetric): void {
  metricsBuffer.push(metric);

  // Log slow queries
  if (MONITORING_CONFIG.LOG_SLOW_QUERIES && metric.duration > MONITORING_CONFIG.SLOW_QUERY_THRESHOLD) {
    console.warn(`⚠️ Slow request detected: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
  }

  // Trim buffer if too large
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.splice(0, metricsBuffer.length - MAX_BUFFER_SIZE);
  }

  // Check for alerts
  checkPerformanceAlerts();
}

/**
 * Track errors
 */
export function trackError(error: ErrorLog): void {
  errorBuffer.push(error);

  // Log error
  console.error(`❌ Error tracked: ${error.message} at ${error.endpoint}`);

  // Trim buffer
  if (errorBuffer.length > MAX_ERROR_BUFFER) {
    errorBuffer.splice(0, errorBuffer.length - MAX_ERROR_BUFFER);
  }

  // Check for alerts
  checkErrorAlerts();
}

/**
 * Middleware to automatically track requests
 */
export function withMonitoring(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  endpointName: string
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const startTime = Date.now();

    try {
      // Call original handler
      await handler(req, res);

      // Track successful request
      const duration = Date.now() - startTime;
      trackRequest({
        endpoint: endpointName,
        method: req.method || 'GET',
        status: res.statusCode,
        duration,
        timestamp: Date.now(),
        userId: (req as any).user?.id,
        organizationId: (req as any).organizationId,
      });
    } catch (error) {
      // Track error
      const duration = Date.now() - startTime;
      trackRequest({
        endpoint: endpointName,
        method: req.method || 'GET',
        status: 500,
        duration,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      trackError({
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        endpoint: endpointName,
        timestamp: Date.now(),
        userId: (req as any).user?.id,
      });

      // Re-throw to ensure proper error response
      throw error;
    }
  };
}

/**
 * Check for performance issues and send alerts
 */
function checkPerformanceAlerts(): void {
  if (metricsBuffer.length < 100) return; // Need enough data

  const recentMetrics = metricsBuffer.slice(-100); // Last 100 requests
  const avgResponseTime =
    recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;

  if (avgResponseTime > MONITORING_CONFIG.RESPONSE_TIME_THRESHOLD) {
    sendAlert({
      type: 'performance',
      severity: 'warning',
      message: `High average response time: ${Math.round(avgResponseTime)}ms`,
      data: { avgResponseTime, threshold: MONITORING_CONFIG.RESPONSE_TIME_THRESHOLD },
    });
  }
}

/**
 * Check for error rate issues
 */
function checkErrorAlerts(): void {
  if (metricsBuffer.length < 100) return;

  const recentMetrics = metricsBuffer.slice(-100);
  const errorCount = recentMetrics.filter((m) => m.status >= 500).length;
  const errorRate = errorCount / recentMetrics.length;

  if (errorRate > MONITORING_CONFIG.ERROR_RATE_THRESHOLD) {
    sendAlert({
      type: 'error_rate',
      severity: 'critical',
      message: `High error rate: ${Math.round(errorRate * 100)}%`,
      data: { errorRate, threshold: MONITORING_CONFIG.ERROR_RATE_THRESHOLD },
    });
  }
}

/**
 * Send alert (email, webhook, etc.)
 */
async function sendAlert(alert: {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data?: Record<string, any>;
}): Promise<void> {
  console.error(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

  // TODO: Implement actual alerting
  // Options:
  // 1. Send email via Resend
  // 2. Send webhook to Slack/Discord
  // 3. Log to external monitoring service (Sentry, DataDog, etc.)

  if (MONITORING_CONFIG.ALERT_WEBHOOK) {
    try {
      await fetch(MONITORING_CONFIG.ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alert,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
        }),
      });
    } catch (error) {
      console.error('Failed to send alert webhook:', error);
    }
  }
}

/**
 * Get comprehensive health status
 */
export async function getHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  metrics: {
    requests: {
      total: number;
      avgResponseTime: number;
      errorRate: number;
    };
    cache: ReturnType<typeof getCacheStats>;
    rateLimit: ReturnType<typeof getRateLimitStats>;
  };
  errors: ErrorLog[];
  checks: {
    database: boolean;
    storage: boolean;
    auth: boolean;
  };
}> {
  const recentMetrics = metricsBuffer.slice(-1000);
  const totalRequests = recentMetrics.length;
  const avgResponseTime =
    totalRequests > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
      : 0;
  const errorCount = recentMetrics.filter((m) => m.status >= 500).length;
  const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

  // Determine overall health
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (errorRate > 0.1 || avgResponseTime > 2000) {
    status = 'unhealthy';
  } else if (errorRate > 0.05 || avgResponseTime > 1000) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    metrics: {
      requests: {
        total: totalRequests,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 10000) / 100,
      },
      cache: getCacheStats(),
      rateLimit: getRateLimitStats(),
    },
    errors: errorBuffer.slice(-20), // Last 20 errors
    checks: {
      database: true, // TODO: Implement actual health checks
      storage: true,
      auth: true,
    },
  };
}

/**
 * Get performance metrics for a specific endpoint
 */
export function getEndpointMetrics(endpointName: string): {
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
} {
  const endpointMetrics = metricsBuffer.filter((m) => m.endpoint === endpointName);

  if (endpointMetrics.length === 0) {
    return {
      requestCount: 0,
      avgResponseTime: 0,
      errorRate: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
    };
  }

  const durations = endpointMetrics.map((m) => m.duration).sort((a, b) => a - b);
  const errorCount = endpointMetrics.filter((m) => m.status >= 500).length;

  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  return {
    requestCount: endpointMetrics.length,
    avgResponseTime: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
    errorRate: errorCount / endpointMetrics.length,
    p95ResponseTime: durations[p95Index] || 0,
    p99ResponseTime: durations[p99Index] || 0,
  };
}

/**
 * Log user activity for analytics
 */
export function logUserActivity(activity: {
  userId: string;
  organizationId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}): void {
  console.log(
    `📊 User Activity: ${activity.action} by ${activity.userId}${activity.resourceType ? ` on ${activity.resourceType}` : ''}`
  );

  // TODO: Store in database for analytics
  // Consider creating an 'activity_log' table in Supabase
}

/**
 * Export metrics for external monitoring (Datadog, New Relic, etc.)
 */
export function exportMetrics(): {
  metrics: PerformanceMetric[];
  errors: ErrorLog[];
  stats: ReturnType<typeof getHealthStatus>;
} {
  return {
    metrics: metricsBuffer.slice(-1000),
    errors: errorBuffer,
    stats: null as any, // Would need to await getHealthStatus()
  };
}


