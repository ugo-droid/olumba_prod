// =============================
// Billing Client Functions
// =============================
// Client-side billing utilities for checkout, portal, and add-ons
// Dependencies: None (vanilla JavaScript)
// Usage: Import these functions in your UI components
// =============================

/**
 * Initiate Stripe Checkout for a subscription
 * @param {string} orgId - Organization ID
 * @param {string} priceId - Stripe Price ID
 * @param {string} successUrl - URL to redirect after successful checkout
 * @param {string} cancelUrl - URL to redirect if user cancels
 * @returns {Promise<void>}
 */
export async function startCheckout(orgId, priceId, successUrl, cancelUrl) {
  try {
    const response = await fetch('/api/billing-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orgId,
        priceId,
        successUrl: successUrl || `${window.location.origin}/billing/success`,
        cancelUrl: cancelUrl || `${window.location.origin}/billing/cancel`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();

    // Redirect to Stripe Checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

/**
 * Open Stripe Customer Portal
 * @param {string} customerId - Stripe Customer ID
 * @param {string} returnUrl - URL to return to after portal session
 * @returns {Promise<void>}
 */
export async function openBillingPortal(customerId, returnUrl) {
  try {
    const response = await fetch('/api/billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: returnUrl || `${window.location.origin}/settings/billing`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portal session');
    }

    const data = await response.json();

    // Redirect to Customer Portal
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No portal URL returned');
    }
  } catch (error) {
    console.error('Portal error:', error);
    throw error;
  }
}

/**
 * Add or update subscription add-on
 * @param {string} subscriptionId - Stripe Subscription ID
 * @param {string} priceId - Add-on Price ID
 * @param {number} quantity - Quantity of add-on
 * @returns {Promise<object>}
 */
export async function addSubscriptionAddon(subscriptionId, priceId, quantity) {
  try {
    const response = await fetch('/api/billing-addon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        priceId,
        quantity,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add addon');
    }

    return await response.json();
  } catch (error) {
    console.error('Add-on error:', error);
    throw error;
  }
}

/**
 * Check if user can create project (not external role)
 * @param {string} role - User's role in organization
 * @returns {boolean}
 */
export function canCreateProject(role) {
  return ['owner', 'admin', 'member'].includes(role);
}

/**
 * Check if organization has reached member limit
 * @param {number} currentCount - Current internal member count
 * @param {number} maxAllowed - Max allowed by entitlements
 * @returns {boolean}
 */
export function hasReachedMemberLimit(currentCount, maxAllowed) {
  return currentCount >= maxAllowed;
}

/**
 * Format storage display
 * @param {number} gb - Gigabytes
 * @returns {string}
 */
export function formatStorage(gb) {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(1)} TB`;
  }
  return `${gb} GB`;
}

/**
 * Get tier display name
 * @param {string} tier - Tier identifier
 * @returns {string}
 */
export function getTierDisplayName(tier) {
  const names = {
    starter: 'Starter',
    pro: 'Pro',
    studio: 'Studio',
    none: 'Free Trial',
  };
  return names[tier] || tier;
}

/**
 * Calculate annual savings percentage
 * @param {number} monthlyPrice - Monthly price
 * @param {number} annualPrice - Annual price
 * @returns {number}
 */
export function calculateAnnualSavings(monthlyPrice, annualPrice) {
  const monthlyTotal = monthlyPrice * 12;
  const savings = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;
  return Math.round(savings);
}

