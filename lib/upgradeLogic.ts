// =============================
// Subscription Upgrade & Feature Gating Logic
// =============================
// Enforces tier-based limits and handles upgrade flows

import { supabaseAdmin, OrganizationEntitlement } from './supabaseAdmin';
import { StorageHelpers, STORAGE_LIMITS } from './storage';

// Tier definitions matching Stripe products
export const TIERS = {
  NONE: 'none',
  STARTER: 'starter',
  PRO: 'pro',
  STUDIO: 'studio',
} as const;

export type Tier = typeof TIERS[keyof typeof TIERS];

// Feature entitlements by tier
export const TIER_FEATURES = {
  [TIERS.NONE]: {
    maxInternalMembers: 0,
    maxExternalCollaborators: 0,
    maxProjects: 0,
    maxStorageGB: 0,
    maxFileSizeGB: 0,
    cityIntegrations: 0,
    features: [] as string[],
  },
  [TIERS.STARTER]: {
    maxInternalMembers: 3,
    maxExternalCollaborators: 5,
    maxProjects: 5,
    maxStorageGB: 20,
    maxFileSizeGB: 2,
    cityIntegrations: 0,
    features: ['basic_projects', 'task_management', 'file_sharing', 'basic_notifications'],
  },
  [TIERS.PRO]: {
    maxInternalMembers: 15,
    maxExternalCollaborators: 25,
    maxProjects: 15,
    maxStorageGB: 100,
    maxFileSizeGB: 20,
    cityIntegrations: 3,
    features: [
      'basic_projects',
      'task_management',
      'file_sharing',
      'basic_notifications',
      'advanced_notifications',
      'real_time_collaboration',
      'city_approvals',
      'document_versioning',
      'advanced_search',
    ],
  },
  [TIERS.STUDIO]: {
    maxInternalMembers: 50,
    maxExternalCollaborators: 100,
    maxProjects: 50,
    maxStorageGB: 500, // Base, can add more
    maxFileSizeGB: 500,
    cityIntegrations: 10,
    features: [
      'basic_projects',
      'task_management',
      'file_sharing',
      'basic_notifications',
      'advanced_notifications',
      'real_time_collaboration',
      'city_approvals',
      'document_versioning',
      'advanced_search',
      'custom_workflows',
      'api_access',
      'white_label',
      'priority_support',
      'advanced_analytics',
    ],
  },
} as const;

/**
 * Get organization's current entitlements
 */
export async function getOrganizationEntitlements(
  organizationId: string
): Promise<OrganizationEntitlement | null> {
  const { data, error } = await supabaseAdmin
    .from('organization_entitlements')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    console.error('Failed to get entitlements:', error);
    return null;
  }

  return data;
}

/**
 * Check if organization can perform an action based on their tier
 */
export async function canPerformAction(
  organizationId: string,
  action: 'add_member' | 'create_project' | 'upload_file' | 'add_city_integration'
): Promise<{ allowed: boolean; reason?: string; currentUsage?: any; limit?: any }> {
  const entitlements = await getOrganizationEntitlements(organizationId);

  if (!entitlements) {
    return { allowed: false, reason: 'No entitlements found' };
  }

  const tierLimits = TIER_FEATURES[entitlements.tier as Tier];

  if (!tierLimits) {
    return { allowed: false, reason: 'Invalid tier' };
  }

  switch (action) {
    case 'add_member': {
      // Get current member count
      const { count } = await supabaseAdmin
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('role', 'member'); // Only count internal members

      const currentCount = count || 0;
      const allowed = currentCount < entitlements.max_internal_members;

      return {
        allowed,
        reason: allowed ? undefined : 'Member limit reached',
        currentUsage: currentCount,
        limit: entitlements.max_internal_members,
      };
    }

    case 'create_project': {
      // Get current project count
      const { count } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .neq('status', 'cancelled');

      const currentCount = count || 0;
      const allowed = currentCount < tierLimits.maxProjects;

      return {
        allowed,
        reason: allowed ? undefined : 'Project limit reached',
        currentUsage: currentCount,
        limit: tierLimits.maxProjects,
      };
    }

    case 'upload_file': {
      // Check storage quota
      const usage = await StorageHelpers.hasStorageSpace(organizationId, 0);
      const storageLimit = entitlements.base_storage_gb + (entitlements.extra_storage_gb || 0);
      const storageUsedGB = usage.current.usedBytes / (1024 * 1024 * 1024);

      const allowed = storageUsedGB < storageLimit;

      return {
        allowed,
        reason: allowed ? undefined : 'Storage limit reached',
        currentUsage: StorageHelpers.formatBytes(usage.current.usedBytes),
        limit: `${storageLimit} GB`,
      };
    }

    case 'add_city_integration': {
      const currentIntegrations = entitlements.city_integrations || 0;
      const allowed = currentIntegrations < tierLimits.cityIntegrations;

      return {
        allowed,
        reason: allowed ? undefined : 'City integrations limit reached',
        currentUsage: currentIntegrations,
        limit: tierLimits.cityIntegrations,
      };
    }

    default:
      return { allowed: true };
  }
}

/**
 * Check if organization has access to a feature
 */
export function hasFeature(tier: Tier, feature: string): boolean {
  const tierFeatures = TIER_FEATURES[tier];
  return tierFeatures.features.includes(feature as any);
}

/**
 * Get upgrade suggestions based on usage
 */
export async function getUpgradeSuggestions(
  organizationId: string
): Promise<{
  shouldUpgrade: boolean;
  currentTier: Tier;
  recommendedTier: Tier;
  reasons: string[];
}> {
  const entitlements = await getOrganizationEntitlements(organizationId);

  if (!entitlements) {
    return {
      shouldUpgrade: false,
      currentTier: TIERS.NONE,
      recommendedTier: TIERS.STARTER,
      reasons: ['No active subscription'],
    };
  }

  const currentTier = entitlements.tier as Tier;
  const reasons: string[] = [];
  let recommendedTier = currentTier;

  // Check member usage
  const { count: memberCount } = await supabaseAdmin
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', 'member');

  const memberUsage = (memberCount || 0) / entitlements.max_internal_members;
  if (memberUsage > 0.8) {
    reasons.push(`Using ${Math.round(memberUsage * 100)}% of member capacity`);
    if (currentTier === TIERS.STARTER) recommendedTier = TIERS.PRO;
    if (currentTier === TIERS.PRO) recommendedTier = TIERS.STUDIO;
  }

  // Check storage usage
  const storage = await StorageHelpers.hasStorageSpace(organizationId, 0);
  const storageUsage = storage.current.percentUsed / 100;
  if (storageUsage > 0.8) {
    reasons.push(`Using ${Math.round(storageUsage * 100)}% of storage capacity`);
    if (currentTier === TIERS.STARTER) recommendedTier = TIERS.PRO;
    if (currentTier === TIERS.PRO) recommendedTier = TIERS.STUDIO;
  }

  // Check project usage
  const { count: projectCount } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .neq('status', 'cancelled');

  const tierLimits = TIER_FEATURES[currentTier];
  const projectUsage = (projectCount || 0) / tierLimits.maxProjects;
  if (projectUsage > 0.8) {
    reasons.push(`Using ${Math.round(projectUsage * 100)}% of project capacity`);
    if (currentTier === TIERS.STARTER) recommendedTier = TIERS.PRO;
    if (currentTier === TIERS.PRO) recommendedTier = TIERS.STUDIO;
  }

  return {
    shouldUpgrade: reasons.length > 0 && recommendedTier !== currentTier,
    currentTier,
    recommendedTier,
    reasons,
  };
}

/**
 * Get tier comparison for upgrade UI
 */
export function getTierComparison(currentTier: Tier): {
  current: typeof TIER_FEATURES[Tier];
  nextTier?: Tier;
  nextTierFeatures?: typeof TIER_FEATURES[Tier];
  upgradeBenefits?: string[];
} {
  const current = TIER_FEATURES[currentTier];

  let nextTier: Tier | undefined;
  if (currentTier === TIERS.NONE || currentTier === TIERS.STARTER) nextTier = TIERS.PRO;
  if (currentTier === TIERS.PRO) nextTier = TIERS.STUDIO;

  if (!nextTier) {
    return { current }; // Already on highest tier
  }

  const nextTierFeatures = TIER_FEATURES[nextTier];
  const upgradeBenefits = nextTierFeatures.features.filter(
    (f) => !current.features.includes(f as any)
  );

  return {
    current,
    nextTier,
    nextTierFeatures,
    upgradeBenefits,
  };
}

/**
 * Validate file upload against tier limits
 */
export async function validateFileUpload(
  organizationId: string,
  fileSize: number
): Promise<{ allowed: boolean; reason?: string; upgradeTo?: Tier }> {
  const entitlements = await getOrganizationEntitlements(organizationId);

  if (!entitlements) {
    return { allowed: false, reason: 'No active subscription' };
  }

  const tier = entitlements.tier as Tier;
  const tierLimits = TIER_FEATURES[tier];

  // Check individual file size
  const fileSizeGB = fileSize / (1024 * 1024 * 1024);
  if (fileSizeGB > tierLimits.maxFileSizeGB) {
    let upgradeTo: Tier | undefined;
    if (tier === TIERS.STARTER) upgradeTo = TIERS.PRO;
    if (tier === TIERS.PRO) upgradeTo = TIERS.STUDIO;

    return {
      allowed: false,
      reason: `File size (${fileSizeGB.toFixed(2)} GB) exceeds ${tier} tier limit (${tierLimits.maxFileSizeGB} GB)`,
      upgradeTo,
    };
  }

  // Check total storage
  const storageCheck = await StorageHelpers.hasStorageSpace(organizationId, fileSize);
  if (!storageCheck.allowed) {
    return {
      allowed: false,
      reason: `Storage quota exceeded. Using ${StorageHelpers.formatBytes(storageCheck.current.usedBytes)} of ${storageCheck.current.totalBytes / (1024 * 1024 * 1024)} GB`,
      upgradeTo: tier === TIERS.STARTER ? TIERS.PRO : TIERS.STUDIO,
    };
  }

  return { allowed: true };
}

/**
 * Get usage dashboard data for organization
 */
export async function getUsageDashboard(organizationId: string): Promise<{
  tier: Tier;
  usage: {
    members: { current: number; limit: number; percentage: number };
    projects: { current: number; limit: number; percentage: number };
    storage: { current: string; limit: string; percentage: number };
    cityIntegrations: { current: number; limit: number; percentage: number };
  };
  features: string[];
  suggestions: any;
}> {
  const entitlements = await getOrganizationEntitlements(organizationId);

  if (!entitlements) {
    throw new Error('Organization entitlements not found');
  }

  const tier = entitlements.tier as Tier;
  const tierLimits = TIER_FEATURES[tier];

  // Get member count
  const { count: memberCount } = await supabaseAdmin
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('role', ['owner', 'admin', 'member']);

  // Get project count
  const { count: projectCount } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .neq('status', 'cancelled');

  // Get storage usage
  const storageUsage = await StorageHelpers.hasStorageSpace(organizationId, 0);
  const totalStorageGB = entitlements.base_storage_gb + (entitlements.extra_storage_gb || 0);

  // Get upgrade suggestions
  const suggestions = await getUpgradeSuggestions(organizationId);

  return {
    tier,
    usage: {
      members: {
        current: memberCount || 0,
        limit: entitlements.max_internal_members,
        percentage: Math.round(((memberCount || 0) / entitlements.max_internal_members) * 100),
      },
      projects: {
        current: projectCount || 0,
        limit: tierLimits.maxProjects,
        percentage: Math.round(((projectCount || 0) / tierLimits.maxProjects) * 100),
      },
      storage: {
        current: StorageHelpers.formatBytes(storageUsage.current.usedBytes),
        limit: `${totalStorageGB} GB`,
        percentage: Math.round(storageUsage.current.percentUsed),
      },
      cityIntegrations: {
        current: entitlements.city_integrations || 0,
        limit: tierLimits.cityIntegrations,
        percentage:
          tierLimits.cityIntegrations > 0
            ? Math.round(((entitlements.city_integrations || 0) / tierLimits.cityIntegrations) * 100)
            : 0,
      },
    },
    features: [...tierLimits.features],
    suggestions,
  };
}

/**
 * Purchase additional storage
 */
export async function purchaseAdditionalStorage(
  organizationId: string,
  storageGB: number
): Promise<{ success: boolean; newTotal: number }> {
  const entitlements = await getOrganizationEntitlements(organizationId);

  if (!entitlements) {
    throw new Error('Organization entitlements not found');
  }

  const newExtraStorage = (entitlements.extra_storage_gb || 0) + storageGB;

  const { error } = await supabaseAdmin
    .from('organization_entitlements')
    .update({
      extra_storage_gb: newExtraStorage,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to add storage: ${error.message}`);
  }

  return {
    success: true,
    newTotal: entitlements.base_storage_gb + newExtraStorage,
  };
}

/**
 * Middleware to check tier access for features
 */
export async function requireFeature(
  organizationId: string,
  feature: string
): Promise<{ hasAccess: boolean; tier: Tier; requiredTier?: Tier }> {
  const entitlements = await getOrganizationEntitlements(organizationId);

  if (!entitlements) {
    return { hasAccess: false, tier: TIERS.NONE, requiredTier: TIERS.STARTER };
  }

  const tier = entitlements.tier as Tier;
  const hasAccess = hasFeature(tier, feature);

  // Find which tier has this feature
  let requiredTier: Tier | undefined;
  if (!hasAccess) {
    for (const [tierName, limits] of Object.entries(TIER_FEATURES)) {
      if (limits.features.includes(feature as any)) {
        requiredTier = tierName as Tier;
        break;
      }
    }
  }

  return {
    hasAccess,
    tier,
    requiredTier,
  };
}

/**
 * Get tier pricing information (from environment variables)
 */
export function getTierPricing(): {
  [key in Tier]: {
    monthly?: string;
    annual?: string;
    displayName: string;
  };
} {
  return {
    [TIERS.NONE]: {
      displayName: 'Free Trial',
    },
    [TIERS.STARTER]: {
      monthly: process.env.PRICE_STARTER_MONTHLY,
      annual: process.env.PRICE_STARTER_ANNUAL,
      displayName: 'Starter',
    },
    [TIERS.PRO]: {
      monthly: process.env.PRICE_PRO_MONTHLY,
      annual: process.env.PRICE_PRO_ANNUAL,
      displayName: 'Pro',
    },
    [TIERS.STUDIO]: {
      monthly: process.env.PRICE_STUDIO_MONTHLY,
      annual: process.env.PRICE_STUDIO_ANNUAL,
      displayName: 'Studio',
    },
  };
}

/**
 * Calculate cost for additional storage
 */
export function calculateStorageCost(additionalGB: number): {
  priceId: string;
  quantity: number;
  totalCost: string;
} {
  const blockSizeGB = 100; // 100GB per block
  const blocks = Math.ceil(additionalGB / blockSizeGB);

  return {
    priceId: process.env.PRICE_EXTRA_STORAGE_BLOCK || '',
    quantity: blocks,
    totalCost: `${blocks} × 100GB blocks`,
  };
}


