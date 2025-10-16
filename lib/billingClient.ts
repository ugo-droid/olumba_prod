// =============================
// Billing Client SDK (TypeScript)
// =============================
// Type-safe client-side billing utilities
// For use in Next.js, React, or TypeScript projects
// =============================

export interface CheckoutOptions {
  orgId: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
  quantity?: number;
}

export interface PortalOptions {
  customerId: string;
  returnUrl?: string;
}

export interface AddonOptions {
  subscriptionId: string;
  priceId: string;
  quantity: number;
}

export interface CheckoutResponse {
  url: string;
  sessionId: string;
}

export interface PortalResponse {
  url: string;
}

export interface AddonResponse {
  success: boolean;
  subscription: {
    id: string;
    items: Array<{
      id: string;
      priceId: string;
      quantity: number;
    }>;
  };
}

export class BillingClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Initiate Stripe Checkout for a subscription
   */
  async startCheckout(options: CheckoutOptions): Promise<void> {
    const { orgId, priceId, successUrl, cancelUrl, quantity = 1 } = options;

    const response = await fetch(`${this.baseUrl}/api/billing-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orgId,
        priceId,
        successUrl: successUrl || `${window.location.origin}/billing/success`,
        cancelUrl: cancelUrl || `${window.location.origin}/billing/cancel`,
        quantity,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data: CheckoutResponse = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  }

  /**
   * Open Stripe Customer Portal
   */
  async openPortal(options: PortalOptions): Promise<void> {
    const { customerId, returnUrl } = options;

    const response = await fetch(`${this.baseUrl}/api/billing-portal`, {
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

    const data: PortalResponse = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No portal URL returned');
    }
  }

  /**
   * Add or update subscription add-on
   */
  async addAddon(options: AddonOptions): Promise<AddonResponse> {
    const { subscriptionId, priceId, quantity } = options;

    const response = await fetch(`${this.baseUrl}/api/billing-addon`, {
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
  }
}

/**
 * Utility functions
 */
export const BillingUtils = {
  canCreateProject(role: string): boolean {
    return ['owner', 'admin', 'member'].includes(role);
  },

  hasReachedMemberLimit(currentCount: number, maxAllowed: number): boolean {
    return currentCount >= maxAllowed;
  },

  formatStorage(gb: number): string {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    return `${gb} GB`;
  },

  getTierDisplayName(tier: string): string {
    const names: Record<string, string> = {
      starter: 'Starter',
      pro: 'Pro',
      studio: 'Studio',
      none: 'Free Trial',
    };
    return names[tier] || tier;
  },

  calculateAnnualSavings(monthlyPrice: number, annualPrice: number): number {
    const monthlyTotal = monthlyPrice * 12;
    const savings = ((monthlyTotal - annualPrice) / monthlyTotal) * 100;
    return Math.round(savings);
  },
};

// Create default instance
export const billingClient = new BillingClient();

