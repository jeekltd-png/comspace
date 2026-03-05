'use client';

import { useState, useEffect } from 'react';

interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: { monthly: number; yearly: number; currency: string };
  limits: { admins: number; products: number; orders: number; storage: number; apiCalls: number };
  features: string[];
  commissionRate: number;
  sortOrder: number;
}

const FEATURE_LABELS: Record<string, string> = {
  products: 'Product Catalog',
  cart: 'Shopping Cart',
  checkout: 'Stripe Checkout',
  delivery: 'Delivery Fulfilment',
  pickup: 'Click & Collect',
  reviews: 'Product Reviews',
  wishlist: 'Wishlists',
  chat: 'AI Chat Support',
  coupons: 'Coupon & Promo Codes',
  analytics: 'Advanced Analytics',
  white_label: 'White-Label Branding',
  custom_domain: 'Custom Domain',
  api_access: 'API Access',
  email_support: 'Email Support',
  priority_support: 'Priority Support',
  dedicated_support: 'Dedicated Support',
  multi_location: 'Multi-Location',
  sla: 'SLA Guarantee',
  account_manager: 'Account Manager',
  custom_integrations: 'Custom Integrations',
};

const LIMIT_LABELS: Record<string, string> = {
  admins: 'Admin Users',
  products: 'Products',
  orders: 'Orders / month',
  storage: 'Storage',
  apiCalls: 'API Calls / day',
};

function formatLimit(key: string, value: number): string {
  if (value === -1) return 'Unlimited';
  if (key === 'storage') return `${value >= 1000 ? (value / 1000).toFixed(0) + ' GB' : value + ' MB'}`;
  return value.toLocaleString();
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/plans`)
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/subscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ planId, billingCycle: billing }),
        }
      );
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.message || 'Subscribed successfully!');
      }
    } catch {
      alert('Please log in to subscribe');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-950">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const popular = plans.find((p) => p.slug === 'growth');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-surface-950 dark:to-surface-900">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Start free for 14 days. No credit card required. Upgrade as you grow.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billing === 'yearly' ? 'bg-brand-600' : 'bg-gray-300 dark:bg-surface-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billing === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${billing === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
            >
              Yearly
              <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                Save ~17%
              </span>
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isPopular = plan._id === popular?._id;
            const price = billing === 'monthly' ? plan.price.monthly : plan.price.yearly;
            const perMonth = billing === 'yearly' ? Math.round(price / 12) : price;

            return (
              <div
                key={plan._id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  isPopular
                    ? 'border-brand-500 shadow-xl shadow-brand-500/10 scale-[1.02]'
                    : 'border-gray-200 dark:border-surface-700'
                } bg-white dark:bg-surface-900`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>

                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    £{perMonth}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400"> /month</span>
                  {billing === 'yearly' && (
                    <p className="text-xs text-gray-400 mt-1">£{price} billed annually</p>
                  )}
                </div>

                <div className="mt-1 text-xs text-gray-400">
                  + {plan.commissionRate}% transaction fee
                </div>

                <button
                  onClick={() => handleSubscribe(plan._id)}
                  className={`mt-6 w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    isPopular
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-gray-100 dark:bg-surface-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-surface-700'
                  }`}
                >
                  {plan.slug === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </button>

                {/* Limits */}
                <div className="mt-6 space-y-2 border-t border-gray-100 dark:border-surface-700 pt-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Includes
                  </p>
                  {Object.entries(plan.limits).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{LIMIT_LABELS[key] || key}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatLimit(key, val)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-400">
                        {FEATURE_LABELS[f] || f.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'What happens after my trial ends?',
                a: 'After the 14-day free trial, your account continues on the Starter plan. You can upgrade at any time. No automatic charges.',
              },
              {
                q: 'Can I change plans later?',
                a: 'Yes! Upgrade or downgrade at any time. Changes take effect immediately and billing adjusts pro-rata.',
              },
              {
                q: 'What are transaction fees?',
                a: 'A small percentage on each order processed through your store. Lower plans have higher rates, higher plans have lower rates. This is in addition to Stripe\'s processing fee.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes. If you\'re not satisfied within the first 30 days, contact us for a full refund.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-4">
                <summary className="cursor-pointer font-medium text-gray-900 dark:text-white flex justify-between items-center">
                  {q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
