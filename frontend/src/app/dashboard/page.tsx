'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

interface OrderSummary {
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
  fulfillmentType?: string;
  items?: Array<{ name: string; image?: string }>;
}

interface DashboardData {
  orders: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    recent: OrderSummary[];
    byStatus: Record<string, number>;
  };
  spending: {
    total: number;
    last30d: number;
    currency: string;
    monthly: Array<{ _id: string; total: number; count: number }>;
  };
  membership?: {
    plan?: string;
    status?: string;
    expiresAt?: string;
  } | null;
  invoices: Array<{
    _id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    dueDate?: string;
    createdAt: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  confirmed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/users/dashboard');
        const d = res.data.data;
        setData({
          orders: {
            total: d.totalOrders || 0,
            completed: d.completedOrders || 0,
            pending: d.pendingOrders || 0,
            cancelled: d.cancelledOrders || 0,
            recent: d.recentOrders || [],
            byStatus: (d.ordersByStatus || []).reduce((acc: Record<string, number>, s: any) => {
              acc[s._id] = s.count; return acc;
            }, {}),
          },
          spending: {
            total: d.totalSpent?.[0]?.total || 0,
            last30d: d.spentLast30d?.[0]?.total || 0,
            currency: 'GBP',
            monthly: d.monthlySpending || [],
          },
          membership: d.membership || null,
          invoices: d.recentInvoices || [],
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDashboard();
  }, [user]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n / 100);

  if (!user) {
    return (
      <main className="p-6 max-w-5xl mx-auto">
        <div className="bg-gray-50 dark:bg-surface-900 p-8 rounded-2xl text-center">
          <p className="text-gray-600 dark:text-gray-400">Please <Link href="/auth/login" className="text-brand-600 hover:underline">sign in</Link> to view your dashboard.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user.firstName}! 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here&apos;s an overview of your account activity
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-surface-800 animate-pulse rounded-xl h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Orders', value: data?.orders.total ?? 0, icon: '📦', color: 'text-blue-600' },
              { label: 'Completed', value: data?.orders.completed ?? 0, icon: '✅', color: 'text-green-600' },
              { label: 'Total Spent', value: fmt(data?.spending.total ?? 0), icon: '💳', color: 'text-purple-600' },
              { label: 'Spent (30d)', value: fmt(data?.spending.last30d ?? 0), icon: '📅', color: 'text-amber-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-4">
                <div className="text-xl mb-1">{icon}</div>
                <div className={`text-xl font-bold ${color}`}>{String(value)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Spending Chart */}
          {(data?.spending.monthly?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-5 mb-6">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Monthly Spend</h2>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data!.spending.monthly.map(m => ({ month: m._id, spend: m.total / 100 }))}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} />
                  <RechartsTooltip formatter={(v: any) => [`£${v.toFixed(2)}`, 'Spend']} />
                  <Area type="monotone" dataKey="spend" stroke="#7C3AED" strokeWidth={2} fill="url(#spendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-surface-800">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Orders</h2>
                <Link href="/orders" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all →</Link>
              </div>
              {(data?.orders.recent?.length ?? 0) === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm mb-2">No orders yet</p>
                  <Link href="/products" className="text-brand-600 hover:underline text-sm">Start shopping →</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-surface-800">
                  {data!.orders.recent.slice(0, 6).map((order) => (
                    <div key={order.orderNumber} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-surface-800/50">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">#{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                          {order.fulfillmentType && ` · ${order.fulfillmentType}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                          {order.status}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('en-GB', { style: 'currency', currency: order.currency || 'GBP' }).format(order.total / 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column: Membership + Quick Links */}
            <div className="flex flex-col gap-4">
              {/* Membership card */}
              <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Membership</h3>
                {data?.membership ? (
                  <div>
                    <div className="text-lg font-bold text-brand-600 capitalize">{data.membership.plan || 'Active'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{data.membership.status}</div>
                    {data.membership.expiresAt && (
                      <div className="text-xs text-gray-400 mt-0.5">Expires: {new Date(data.membership.expiresAt).toLocaleDateString()}</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No active membership</p>
                    <Link href="/membership" className="text-xs text-brand-600 hover:underline">View plans →</Link>
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Quick Links</h3>
                <div className="space-y-1.5">
                  {[
                    { href: '/orders', label: '📦 My Orders' },
                    { href: '/membership', label: '⭐ Membership' },
                    { href: '/wishlist', label: '❤️ Wishlist' },
                    { href: '/products', label: '🛍️ Shop' },
                    { href: '/auth/profile', label: '👤 Edit Profile' },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-0.5">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Invoices */}
          {(data?.invoices?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-surface-800">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Invoices</h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-surface-800">
                {data!.invoices.slice(0, 4).map((inv) => (
                  <div key={inv._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-surface-800/50">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">#{inv.invoiceNumber}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || STATUS_COLORS.pending}`}>
                        {inv.status}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(inv.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
