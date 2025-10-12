// =============================
// Entitlement Calculation Logic
// =============================
import Stripe from 'stripe';
import { PRICE_IDS } from './stripe';
import { OrganizationEntitlement } from './supabaseAdmin';

// Base entitlements per tier (monthly and annual have same features)
const BASE_ENTITLEMENTS: Record<string, Omit<OrganizationEntitlement, 'organization_id' | 'id' | 'updated_at'>> = {
  [PRICE_IDS.STARTER_MONTHLY]: {
    tier: 'starter',
    max_internal_members: 3,
    base_storage_gb: 50,
    city_integrations: 0,
    extra_storage_gb: 0,
    external_collaborators_billable: false,
  },
  [PRICE_IDS.STARTER_ANNUAL]: {
    tier: 'starter',
    max_internal_members: 3,
    base_storage_gb: 50,
    city_integrations: 0,
    extra_storage_gb: 0,
    external_collaborators_billable: false,
  },
  [PRICE_IDS.PRO_MONTHLY]: {
    tier: 'pro',
    max_internal_members: 10,
    base_storage_gb: 250,
    city_integrations: 0,
    extra_storage_gb: 0,
    external_collaborators_billable: false,
  },
  [PRICE_IDS.PRO_ANNUAL]: {
    tier: 'pro',
    max_internal_members: 10,
    base_storage_gb: 250,
    city_integrations: 0,
    extra_storage_gb: 0,
    external_collaborators_billable: false,
  },
  [PRICE_IDS.STUDIO_MONTHLY]: {
    tier: 'studio',
    max_internal_members: 25,
    base_storage_gb: 750,
    city_integrations: 0,
    extra_storage_gb: 0,
    external_collaborators_billable: false,
  },
  [PRICE_IDS.STUDIO_ANNUAL]: {
    tier: 'studio',
    max_internal_members: 25,
    base_storage_gb: 750,
    city_integrations: 0,
    extra_storage_gb: 0,
    external_collaborators_billable: false,
  },
};

// Add-on effects per price ID
interface AddonEffect {
  cityIntegrations?: number;
  extraStorageGb?: number;
}

function getAddonEffect(priceId: string, quantity: number): AddonEffect {
  if (priceId === PRICE_IDS.CITY_INTEGRATIONS) {
    return { cityIntegrations: quantity };
  }
  if (priceId === PRICE_IDS.EXTRA_STORAGE_BLOCK) {
    return { extraStorageGb: 100 * quantity }; // 100 GB per block
  }
  return {};
}

/**
 * Derive complete entitlements from a Stripe subscription
 * Combines base tier entitlements with add-on effects
 */
export function deriveEntitlements(
  subscription: Stripe.Subscription,
  organizationId: string
): OrganizationEntitlement {
  // Start with default (no subscription)
  let entitlement: OrganizationEntitlement = {
    organization_id: organizationId,
    tier: 'none',
    max_internal_members: 0,
    base_storage_gb: 0,
    city_integrations: 0,
    extra_storage_gb: 0,
    external_collaborators_billable: false,
  };

  // Process all subscription line items
  for (const item of subscription.items.data) {
    const priceId = item.price.id;
    const quantity = item.quantity || 1;

    // Check if this is a base tier price
    if (BASE_ENTITLEMENTS[priceId]) {
      entitlement = {
        ...entitlement,
        ...BASE_ENTITLEMENTS[priceId],
        organization_id: organizationId,
      };
    }

    // Apply add-on effects
    const addonEffect = getAddonEffect(priceId, quantity);
    if (addonEffect.cityIntegrations !== undefined) {
      entitlement.city_integrations += addonEffect.cityIntegrations;
    }
    if (addonEffect.extraStorageGb !== undefined) {
      entitlement.extra_storage_gb += addonEffect.extraStorageGb;
    }
  }

  return entitlement;
}

/**
 * Calculate total storage available (base + extra blocks)
 */
export function getTotalStorage(entitlement: OrganizationEntitlement): number {
  return entitlement.base_storage_gb + entitlement.extra_storage_gb;
}

/**
 * Check if an organization can add more internal members
 */
export function canAddInternalMember(
  currentCount: number,
  entitlement: OrganizationEntitlement
): boolean {
  return currentCount < entitlement.max_internal_members;
}

/**
 * Get user-friendly tier name
 */
export function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    studio: 'Studio',
    none: 'Free Trial',
  };
  return names[tier] || tier;
}

/**
 * Validate if a price ID is a valid base plan
 */
export function isBasePlan(priceId: string): boolean {
  return priceId in BASE_ENTITLEMENTS;
}

/**
 * Validate if a price ID is a valid add-on
 */
export function isAddon(priceId: string): boolean {
  return priceId === PRICE_IDS.CITY_INTEGRATIONS || priceId === PRICE_IDS.EXTRA_STORAGE_BLOCK;
}

