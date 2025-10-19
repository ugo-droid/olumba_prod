// =============================
// Usage Dashboard API
// =============================
// Returns organization usage stats and upgrade suggestions

import { VercelRequest, VercelResponse } from '@vercel/node';
import { withRateLimit } from '../lib/rateLimiter';
import { getUsageDashboard, getTierComparison } from '../lib/upgradeLogic';
import { withMonitoring } from '../lib/monitoring';

/**
 * GET /api/usage-dashboard
 * 
 * Query Parameters:
 * - organizationId: Required
 * 
 * Returns:
 * - Current tier and usage statistics
 * - Feature availability
 * - Upgrade suggestions
 * - Tier comparison
 * 
 * Example:
 * GET /api/usage-dashboard?organizationId=xxx
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const organizationId = req.query.organizationId as string;

    if (!organizationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'organizationId is required',
      });
    return;
    }

    // TODO: Verify user has access to this organization

    // Get usage dashboard
    const dashboard = await getUsageDashboard(organizationId);

    // Get tier comparison for upgrade UI
    const comparison = getTierComparison(dashboard.tier);

    res.status(200).json({
      organizationId,
      tier: dashboard.tier,
      usage: dashboard.usage,
      features: dashboard.features,
      suggestions: dashboard.suggestions,
      upgrade: {
        recommended: dashboard.suggestions.shouldUpgrade,
        currentTier: comparison.current,
        nextTier: comparison.nextTier,
        nextTierFeatures: comparison.nextTierFeatures,
        benefits: comparison.upgradeBenefits,
      },
    });
    return;
  } catch (error) {
    console.error('Usage dashboard error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
}

// Apply rate limiting and monitoring
export default withMonitoring(withRateLimit(handler, 'READ'), '/api/usage-dashboard');


