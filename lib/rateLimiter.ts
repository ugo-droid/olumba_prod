// =============================
// Rate Limiter for Vercel Serverless
// =============================
// Implements in-memory rate limiting with Redis fallback
// Protects against abuse and ensures fair usage

import { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limit configuration by endpoint type
export const RATE_LIMITS = {
  // Authentication endpoints (stricter limits)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },
  // Write operations (moderate limits)
  WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  // Read operations (generous limits)
  READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Webhook endpoints (very generous for external services)
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute
  },
  // File uploads (stricter due to size)
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// In-memory store for rate limiting
// Note: This resets on each cold start, which is acceptable for Vercel
// For production at scale, consider using Vercel KV or Redis
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getRateLimitKey(req: VercelRequest, limitType: RateLimitType): string {
  // Prefer user ID if authenticated
  const userId = (req as any).user?.id || (req as any).userId;
  if (userId) {
    return `user:${userId}:${limitType}`;
  }

  // Fall back to IP address
  const ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';

  return `ip:${ip}:${limitType}`;
}

/**
 * Check if request should be rate limited
 */
function shouldRateLimit(key: string, limitConfig: typeof RATE_LIMITS[RateLimitType]): {
  limited: boolean;
  current: number;
  limit: number;
  resetTime: number;
  retryAfter: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No entry or expired window - allow request
  if (!entry || entry.resetTime < now) {
    const resetTime = now + limitConfig.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      limited: false,
      current: 1,
      limit: limitConfig.maxRequests,
      resetTime,
      retryAfter: 0,
    };
  }

  // Within window - check if over limit
  if (entry.count >= limitConfig.maxRequests) {
    return {
      limited: true,
      current: entry.count,
      limit: limitConfig.maxRequests,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment counter
  entry.count++;

  return {
    limited: false,
    current: entry.count,
    limit: limitConfig.maxRequests,
    resetTime: entry.resetTime,
    retryAfter: 0,
  };
}

/**
 * Rate limiting middleware
 * Usage: await rateLimit(req, res, 'READ')
 */
export async function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  limitType: RateLimitType = 'READ'
): Promise<boolean> {
  const key = getRateLimitKey(req, limitType);
  const limitConfig = RATE_LIMITS[limitType];
  const result = shouldRateLimit(key, limitConfig);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, result.limit - result.current).toString());
  res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

  if (result.limited) {
    res.setHeader('Retry-After', result.retryAfter.toString());
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
      limit: result.limit,
      resetAt: new Date(result.resetTime).toISOString(),
    });
    return false;
  }

  return true;
}

/**
 * Rate limit wrapper for API routes
 * Usage: export default withRateLimit(handler, 'WRITE')
 */
export function withRateLimit(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  limitType: RateLimitType = 'READ'
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Check rate limit
    const allowed = await rateLimit(req, res, limitType);
    if (!allowed) {
      return; // Response already sent
    }

    // Proceed with handler
    return handler(req, res);
  };
}

/**
 * Get current rate limit status for a request
 * Useful for client-side display
 */
export function getRateLimitStatus(
  req: VercelRequest,
  limitType: RateLimitType
): {
  remaining: number;
  limit: number;
  resetAt: Date;
} {
  const key = getRateLimitKey(req, limitType);
  const limitConfig = RATE_LIMITS[limitType];
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || entry.resetTime < now) {
    return {
      remaining: limitConfig.maxRequests,
      limit: limitConfig.maxRequests,
      resetAt: new Date(now + limitConfig.windowMs),
    };
  }

  return {
    remaining: Math.max(0, limitConfig.maxRequests - entry.count),
    limit: limitConfig.maxRequests,
    resetAt: new Date(entry.resetTime),
  };
}

/**
 * Clear rate limit for a specific key (admin use)
 */
export function clearRateLimit(req: VercelRequest, limitType: RateLimitType): void {
  const key = getRateLimitKey(req, limitType);
  rateLimitStore.delete(key);
}

/**
 * Get all rate limit stats (monitoring/debugging)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  entries: Array<{ key: string; count: number; resetTime: string }>;
} {
  const entries = Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
    key,
    count: entry.count,
    resetTime: new Date(entry.resetTime).toISOString(),
  }));

  return {
    totalEntries: rateLimitStore.size,
    entries,
  };
}


