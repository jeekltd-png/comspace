'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';

interface Subscription {
  _id: string;
  tenant: string;
  plan: {
    name: string;
    slug: string;
    price: { monthly: number; yearly: number; currency: string };
    commissionRate: number;
  };
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  totalRevenue: number;
  totalCommission: number;
  addOns: Array<{ slug: string; name: string; price: number; activatedAt: string }>;
  cancelAtPeriodEnd: boolean;
}

interface Commission {
  _id: string;
  order: { orderNumber: string; total: number; status: string } | null;
  tenant: string;
  orderTotal: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface RevenueData {
  commissions: Array<{ _id: string; total: number; count: number }>;
  subscriptions: Array<{ _id: string; count: number; totalRevenue: number; totalCommission: number }>;
  topTenants: Array<{ tenant: string; totalRevenue: number; totalCommission: number; status: string; plan: any }>;
  monthlyRevenue: Array<{ _id: { year: number; month: number }; commission: number; gmv: number; orders: number }>;
}

export default function AdminBillingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'subscription' | 'commissions' | 'usage'>('overview');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [apiUsage, setApiUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, commRes] = await Promise.all([
        fetch(`${API}/billing/subscription`, { credentials: 'include' }),
        fetch(`${API}/billing/commissions?limit=50`, { credentials: 'include' }),
      ]);

      if (subRes.ok) {
        const d = await subRes.json();
        setSubscription(d.data);
      }
      if (commRes.ok) {
        const d = await commRes.json();
        setCommissions(d.data || []);
      }

      // SuperAdmin gets revenue dashboard
      if (user?.role === 'superadmin') {
        const revRes = await fetch(`${API}/billing/revenue`, { credentials: 'include' });
        if (revRes.ok) {
          const d = await revRes.json();
          setRevenue(d.data);
        }
      }

      // API usage
      const usageRes = await fetch(`${API}/billing/api-usage?days=30`, { credentials: 'include' });
      if (usageRes.ok) {
        const d = await usageRes.json();
        setApiUsage(d.data);
      }
    } catch (err) {
      console.error('Billing fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [API, user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cancelSubscription = async () => {
    if (!confirm('Cancel your subscription at end of billing period?')) return;
    try {
      const res = await fetch(`${API}/billing/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        fetchData();
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const totalCommEarned = commissions.reduce((s, c) => s + c.commissionAmount, 0);
  const totalGMV = commissions.reduce((s, c) => s + c.orderTotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Revenue</h1>
        <a
          href="/pricing"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          View Plans
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-surface-800 rounded-xl p-1">
        {(['overview', 'subscription', 'commissions', 'usage'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white dark:bg-surface-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {subscription?.plan?.name || 'Free'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {subscription?.status || 'No subscription'}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">GMV Processed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                £{totalGMV.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 mt-1">{commissions.length} orders</p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {user?.role === 'superadmin' ? 'Commission Earned' : 'Commission Paid'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                £{totalCommEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {subscription?.plan?.commissionRate ?? 0}% rate
              </p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">API Calls (30d)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {apiUsage?.summary?.totalCalls?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ~{apiUsage?.summary?.dailyAvg?.toLocaleString() || '0'}/day avg
              </p>
            </div>
          </div>

          {/* SuperAdmin Revenue Dashboard */}
          {user?.role === 'superadmin' && revenue && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Revenue</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Monthly Revenue Chart (text-based) */}
                <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-5">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Monthly Revenue</h3>
                  <div className="space-y-2">
                    {revenue.monthlyRevenue.slice(-6).map((m) => {
                      const label = `${m._id.year}-${String(m._id.month).padStart(2, '0')}`;
                      const maxGMV = Math.max(...revenue.monthlyRevenue.map((r) => r.gmv), 1);
                      const pct = Math.round((m.gmv / maxGMV) * 100);
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            <span>{label}</span>
                            <span>£{m.commission.toFixed(0)} comm / £{m.gmv.toFixed(0)} GMV</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-surface-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Tenants */}
                <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-5">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Top Tenants by Revenue</h3>
                  <div className="space-y-3">
                    {revenue.topTenants.slice(0, 5).map((t, i) => (
                      <div key={t.tenant} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.tenant}</p>
                          <p className="text-xs text-gray-400">
                            {t.plan?.name || 'No plan'} · {t.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            £{t.totalRevenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            £{t.totalCommission.toLocaleString()} comm
                          </p>
                        </div>
                      </div>
                    ))}
                    {revenue.topTenants.length === 0 && (
                      <p className="text-sm text-gray-400">No tenant revenue data yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscription Tab */}
      {tab === 'subscription' && (
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-6">
          {subscription ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {subscription.plan.name} Plan
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subscription.billingCycle === 'yearly' ? 'Annual' : 'Monthly'} billing ·{' '}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        subscription.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : subscription.status === 'trialing'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </p>
                </div>
                {!subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={cancelSubscription}
                    className="px-4 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Price</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    £
                    {subscription.billingCycle === 'yearly'
                      ? subscription.plan.price.yearly
                      : subscription.plan.price.monthly}
                    /{subscription.billingCycle === 'yearly' ? 'year' : 'month'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Commission Rate</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {subscription.plan.commissionRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Current Period</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} –{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                {subscription.trialEnd && (
                  <div>
                    <p className="text-xs text-gray-400">Trial Ends</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(subscription.trialEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Your subscription will cancel at the end of the current billing period.
                  </p>
                </div>
              )}

              {/* Add-Ons */}
              {subscription.addOns.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Active Add-Ons</h3>
                  <div className="space-y-2">
                    {subscription.addOns.map((addon) => (
                      <div
                        key={addon.slug}
                        className="flex justify-between items-center bg-gray-50 dark:bg-surface-800 px-3 py-2 rounded-lg"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">{addon.name}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          £{addon.price}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No active subscription</p>
              <a
                href="/pricing"
                className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                View Plans
              </a>
            </div>
          )}
        </div>
      )}

      {/* Commissions Tab */}
      {tab === 'commissions' && (
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Order</th>
                {user?.role === 'superadmin' && (
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Tenant</th>
                )}
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Order Total</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Rate</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Commission</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-700">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No commission records yet
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {c.order?.orderNumber || '—'}
                    </td>
                    {user?.role === 'superadmin' && (
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.tenant}</td>
                    )}
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      £{c.orderTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.commissionRate}%</td>
                    <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">
                      £{c.commissionAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* API Usage Tab */}
      {tab === 'usage' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-5">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
              API Usage — Last 30 Days
            </h3>
            {apiUsage?.usage?.length > 0 ? (
              <div className="space-y-2">
                {apiUsage.usage.slice(0, 14).map((day: any) => {
                  const maxCalls = Math.max(...apiUsage.usage.map((d: any) => d.calls), 1);
                  const pct = Math.round((day.calls / maxCalls) * 100);
                  return (
                    <div key={day.date}>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        <span>{day.date}</span>
                        <span>{day.calls.toLocaleString()} calls</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No API usage data yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
