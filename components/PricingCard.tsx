// =============================
// PricingCard Component (React/TypeScript)
// =============================
// Modern React component for pricing display with checkout integration
// Usage: import { PricingCard } from './components/PricingCard';
// =============================

import React, { useState } from 'react';
import { billingClient } from '../lib/billingClient';

interface Plan {
  id: string;
  name: string;
  description: string;
  features: string[];
  pricing: {
    monthly: { price: number; priceId: string };
    annual: { price: number; priceId: string };
  };
  recommended?: boolean;
  cta: string;
  ctaStyle: 'primary' | 'secondary';
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 3 internal team members',
      'Unlimited external collaborators',
      '50 GB cloud storage',
      'Basic project management',
      'Email support',
    ],
    pricing: {
      monthly: { price: 99, priceId: process.env.NEXT_PUBLIC_PRICE_STARTER_MONTHLY || 'price_starter_monthly_XXXX' },
      annual: { price: 79, priceId: process.env.NEXT_PUBLIC_PRICE_STARTER_ANNUAL || 'price_starter_annual_XXXX' },
    },
    cta: 'Get Started',
    ctaStyle: 'secondary',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams with bigger projects',
    features: [
      'Up to 10 internal team members',
      'Unlimited external collaborators',
      '250 GB cloud storage',
      'Advanced project management',
      'City integration add-ons available',
      'Priority email support',
      'Custom branding',
    ],
    pricing: {
      monthly: { price: 249, priceId: process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY || 'price_pro_monthly_XXXX' },
      annual: { price: 199, priceId: process.env.NEXT_PUBLIC_PRICE_PRO_ANNUAL || 'price_pro_annual_XXXX' },
    },
    recommended: true,
    cta: 'Start Pro Trial',
    ctaStyle: 'primary',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'For large firms and enterprises',
    features: [
      'Up to 25 internal team members',
      'Unlimited external collaborators',
      '750 GB cloud storage',
      'Full project suite',
      'Unlimited city integrations',
      '24/7 phone & email support',
      'Dedicated account manager',
      'Advanced analytics',
    ],
    pricing: {
      monthly: { price: 499, priceId: process.env.NEXT_PUBLIC_PRICE_STUDIO_MONTHLY || 'price_studio_monthly_XXXX' },
      annual: { price: 399, priceId: process.env.NEXT_PUBLIC_PRICE_STUDIO_ANNUAL || 'price_studio_annual_XXXX' },
    },
    cta: 'Contact Sales',
    ctaStyle: 'secondary',
  },
];

interface PricingCardProps {
  organizationId: string;
  onError?: (error: Error) => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ organizationId, onError = () => {} }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  const calculateSavings = (monthly: number, annual: number): number => {
    const monthlyTotal = monthly * 12;
    const savings = ((monthlyTotal - (annual * 12)) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  const handleSelectPlan = async (plan: Plan) => {
    setLoading(plan.id);
    try {
      const period = isAnnual ? 'annual' : 'monthly';
      const priceId = plan.pricing[period].priceId;

      await billingClient.startCheckout({
        orgId: organizationId,
        priceId,
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      if (onError) {
        onError(error as Error);
      } else {
        alert('Failed to start checkout. Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that fits your team. Upgrade or downgrade anytime.</p>

        <div className="billing-toggle">
          <button
            onClick={() => setIsAnnual(false)}
            className={!isAnnual ? 'active' : 'inactive'}
          >
            Monthly
          </button>
          <label className="switch">
            <input
              type="checkbox"
              checked={isAnnual}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsAnnual(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <button
            onClick={() => setIsAnnual(true)}
            className={isAnnual ? 'active' : 'inactive'}
          >
            Annual <span className="savings-badge">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => {
          const period = isAnnual ? 'annual' : 'monthly';
          const price = plan.pricing[period].price;
          const annualTotal = isAnnual ? price * 12 : null;

          return (
            <div
              key={plan.id}
              className={`pricing-card ${plan.recommended ? 'recommended' : ''}`}
            >
              {plan.recommended && (
                <div className="recommended-badge">Most Popular</div>
              )}

              <div className="plan-name">{plan.name}</div>
              <div className="plan-description">{plan.description}</div>

              <div className="plan-price">
                ${price}
                <span>/mo</span>
              </div>

              {annualTotal && (
                <div className="plan-billing">Billed annually at ${annualTotal}</div>
              )}
              {!annualTotal && <div className="plan-billing">Billed monthly</div>}

              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>

              <button
                className={`plan-cta ${plan.ctaStyle}`}
                onClick={() => handleSelectPlan(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? 'Loading...' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="external-note">
        <h3>🎉 Invite Unlimited External Consultants — Free</h3>
        <p>
          Collaborate with architects, engineers, and consultants at no extra cost.
          You only pay for your internal team members.
        </p>
      </div>

      <style jsx>{`
        .pricing-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2rem;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .pricing-header h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .pricing-header p {
          font-size: 1.25rem;
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .billing-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .billing-toggle button {
          background: none;
          border: none;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          color: #9ca3af;
          transition: color 0.3s;
        }

        .billing-toggle button.active {
          color: #1f2937;
        }

        .switch {
          position: relative;
          width: 60px;
          height: 30px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e5e7eb;
          border-radius: 15px;
          transition: 0.3s;
        }

        .slider:before {
          position: absolute;
          content: '';
          height: 24px;
          width: 24px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
        }

        input:checked + .slider {
          background-color: #667eea;
        }

        input:checked + .slider:before {
          transform: translateX(30px);
        }

        .savings-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .pricing-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 2rem;
          position: relative;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .pricing-card.recommended {
          border: 3px solid #667eea;
          transform: scale(1.05);
        }

        .recommended-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #667eea;
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 2rem;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .plan-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .plan-description {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .plan-price {
          font-size: 3rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .plan-price span {
          font-size: 1.25rem;
          color: #6b7280;
          font-weight: 400;
        }

        .plan-billing {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .plan-features {
          list-style: none;
          margin-bottom: 2rem;
          padding: 0;
        }

        .plan-features li {
          padding: 0.75rem 0;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .plan-features li::before {
          content: '✓';
          color: #10b981;
          font-weight: bold;
          font-size: 1.25rem;
        }

        .plan-cta {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .plan-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .plan-cta.primary {
          background: #667eea;
          color: white;
        }

        .plan-cta.primary:hover:not(:disabled) {
          background: #5568d3;
        }

        .plan-cta.secondary {
          background: #f3f4f6;
          color: #1f2937;
        }

        .plan-cta.secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .external-note {
          text-align: center;
          margin-top: 3rem;
          padding: 2rem;
          background: #f9fafb;
          border-radius: 1rem;
        }

        .external-note h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .external-note p {
          font-size: 1.125rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default PricingCard;

