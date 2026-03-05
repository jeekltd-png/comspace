'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import apiClient from '@/lib/api';
import Link from 'next/link';
import {
  FiUser, FiMapPin, FiSettings, FiLock, FiPackage,
  FiMail, FiPhone, FiEdit2, FiHeart, FiDollarSign,
  FiClock, FiCheckCircle, FiTruck, FiShoppingBag,
  FiFileText, FiDownload, FiTrendingUp,
  FiCalendar, FiRefreshCw, FiXCircle,
  FiStar, FiBarChart2,
} from 'react-icons/fi';

interface DashboardData {
  stats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    spent30d: number;
    avgOrderValue: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    total: number;
    currency: string;
    status: string;
    createdAt: string;
    items: Array<{ name: string; image?: string }>;
    fulfillmentType: string;
  }>;
  monthlySpending: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  ordersByStatus: Record<string, number>;
  recentInvoices: Array<{
    _id: string;
    invoiceNumber: string;
    type: string;
    status: string;
    total: number;
    currency: string;
    issuedAt: string;
    pdfUrl: string;
  }>;
  membership: {
    status: string;
    plan: { name: string; amount: number; currency: string; interval: string; features: string[] };
    memberNumber: string;
    renewalDate: string;
    autoRenew: boolean;
  } | null;
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  processing: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',
  shipped: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
  'out-for-delivery': 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
  delivered: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  'ready-for-pickup': 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400',
  'picked-up': 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  refunded: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <FiClock className="w-4 h-4" />,
  confirmed: <FiCheckCircle className="w-4 h-4" />,
  processing: <FiRefreshCw className="w-4 h-4" />,
  shipped: <FiTruck className="w-4 h-4" />,
  'out-for-delivery': <FiTruck className="w-4 h-4" />,
  delivered: <FiCheckCircle className="w-4 h-4" />,
  'ready-for-pickup': <FiPackage className="w-4 h-4" />,
  'picked-up': <FiCheckCircle className="w-4 h-4" />,
  cancelled: <FiXCircle className="w-4 h-4" />,
  refunded: <FiRefreshCw className="w-4 h-4" />,
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      setLoadingData(true);
      try {
        const [dashRes, wishlistRes] = await Promise.all([
          apiClient.get('/users/dashboard').catch(() => null),
          apiClient.get('/wishlist').catch(() => ({ data: { data: { items: [] } } })),
        ]);

        if (dashRes?.data?.data) {
          setDashboard(dashRes.data.data);
        }

        const wishItems = wishlistRes?.data?.data?.items || wishlistRes?.data?.data?.wishlist || [];
        setWishlistCount(Array.isArray(wishItems) ? wishItems.length : 0);
      } catch {
        // Dashboard still shows profile info
      } finally {
        setLoadingData(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const getCompleteness = () => {
    if (!user) return 0;
    let score = 0;
    const total = 5;
    if (user.firstName) score++;
    if (user.lastName) score++;
    if (user.email) score++;
    if (user.phone) score++;
    if (user.addresses && user.addresses.length > 0) score++;
    return Math.round((score / total) * 100);
  };

  const formatCurrency = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${amount.toFixed(0)}`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-surface-800" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-surface-800 rounded-lg w-48" />
              <div className="h-4 bg-gray-200 dark:bg-surface-800 rounded-lg w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 dark:bg-surface-800 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <FiUser className="w-16 h-16 text-gray-300 dark:text-surface-600 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view your dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Access your account, orders, invoices and more.</p>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const completeness = getCompleteness();
  const stats = dashboard?.stats;
  const maxSpending = Math.max(...(dashboard?.monthlySpending?.map(m => m.total) || [1]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
      {/* ── Profile Header ── */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <FiMail className="w-4 h-4" /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <FiPhone className="w-4 h-4" /> {user.phone}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Profile {completeness}% complete</span>
                {completeness === 100 && <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />}
              </div>
              <div className="w-full max-w-xs h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${completeness === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>
          <Link href="/profile/edit" className="btn-secondary flex items-center gap-2 text-sm">
            <FiEdit2 className="w-4 h-4" /> Edit Profile
          </Link>
        </div>
      </div>

      {/* ── KPI Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Orders" value={loadingData ? '—' : String(stats?.totalOrders || 0)}
          icon={<FiShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
          bgColor="bg-brand-100 dark:bg-brand-900/30"
          subtitle={stats?.pendingOrders ? `${stats.pendingOrders} in progress` : undefined} />
        <KPICard title="Completed" value={loadingData ? '—' : String(stats?.completedOrders || 0)}
          icon={<FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
          bgColor="bg-green-100 dark:bg-green-900/30"
          subtitle={stats?.cancelledOrders ? `${stats.cancelledOrders} cancelled` : undefined} />
        <KPICard title="Wishlist" value={loadingData ? '—' : String(wishlistCount)}
          icon={<FiHeart className="w-5 h-5 text-red-500 dark:text-red-400" />}
          bgColor="bg-red-100 dark:bg-red-900/30" />
        <KPICard title="Total Spent" value={loadingData ? '—' : formatCurrency(stats?.totalSpent || 0)}
          icon={<FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />}
          bgColor="bg-green-100 dark:bg-green-900/30"
          subtitle={stats?.spent30d ? `${formatCurrency(stats.spent30d)} last 30d` : undefined} />
      </div>

      {/* ── Membership Banner ── */}
      {dashboard?.membership && (
        <div className="glass-card p-5 border-l-4 border-brand-500 bg-gradient-to-r from-brand-50/50 to-transparent dark:from-brand-900/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <FiStar className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {dashboard.membership.plan?.name || 'Active Membership'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Member #{dashboard.membership.memberNumber} &bull;{' '}
                  {dashboard.membership.plan?.interval} plan &bull;{' '}
                  <span className="text-green-600 dark:text-green-400 font-medium capitalize">{dashboard.membership.status}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {dashboard.membership.renewalDate && (
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <FiCalendar className="w-4 h-4" />
                  Renews {new Date(dashboard.membership.renewalDate).toLocaleDateString()}
                </span>
              )}
              <Link href="/membership" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">Manage →</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content: Orders + Spending ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiClock className="w-4 h-4 text-brand-500" /> Recent Orders
            </h2>
            <Link href="/orders" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View all →</Link>
          </div>
          {loadingData ? (
            <div className="p-6 text-center text-gray-400 animate-pulse">Loading orders...</div>
          ) : !dashboard?.recentOrders?.length ? (
            <div className="p-8 text-center">
              <FiPackage className="w-10 h-10 text-gray-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No orders yet</p>
              <Link href="/products" className="text-brand-600 text-sm hover:underline mt-2 inline-block">Start shopping →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-surface-800">
              {dashboard.recentOrders.map((order) => (
                <Link key={order._id} href={`/orders/${order._id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-surface-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-surface-800 flex items-center justify-center">
                      {statusIcons[order.status] || <FiPackage className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} &bull;{' '}
                        {new Date(order.createdAt).toLocaleDateString()} &bull; {order.fulfillmentType === 'delivery' ? '🚚' : '🏪'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'text-gray-600 bg-gray-100'}`}>
                      {order.status?.replace(/-/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total, order.currency)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Spending Trend */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-4 h-4 text-green-500" /> Spending Trend
          </h2>
          {loadingData ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-200 dark:bg-surface-800 rounded" />)}
            </div>
          ) : !dashboard?.monthlySpending?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No spending data yet</p>
          ) : (
            <div className="space-y-3">
              {dashboard.monthlySpending.map((month) => {
                const pct = maxSpending > 0 ? (month.total / maxSpending) * 100 : 0;
                const [year, mo] = month._id.split('-');
                const label = new Date(Number(year), Number(mo) - 1).toLocaleDateString('en', { month: 'short', year: '2-digit' });
                return (
                  <div key={month._id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(month.total)}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 3)}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{month.count} order{month.count !== 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          )}
          {stats?.avgOrderValue ? (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-surface-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Avg. Order Value</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(stats.avgOrderValue)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Invoices & Receipts ── */}
      {dashboard?.recentInvoices && dashboard.recentInvoices.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-brand-500" /> Invoices & Receipts
            </h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-surface-800">
            {dashboard.recentInvoices.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inv.type === 'receipt' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                    <FiFileText className={`w-4 h-4 ${inv.type === 'receipt' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{inv.type} &bull; {new Date(inv.issuedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    inv.status === 'paid' ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' :
                    inv.status === 'issued' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' :
                    'text-gray-600 bg-gray-50'
                  }`}>{inv.status}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(inv.total, inv.currency)}</span>
                  {inv.pdfUrl && (
                    <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/invoices/${inv._id}/download`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                      title="Download PDF">
                      <FiDownload className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Order Status Breakdown ── */}
      {dashboard?.ordersByStatus && Object.keys(dashboard.ordersByStatus).length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FiBarChart2 className="w-4 h-4 text-brand-500" /> Order Status Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(dashboard.ordersByStatus).map(([status, count]) => (
              <div key={status} className={`p-3 rounded-xl text-center ${statusColors[status] || 'text-gray-600 bg-gray-50 dark:bg-surface-800'}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs capitalize mt-1">{status.replace(/-/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickLink href="/orders" icon={<FiPackage />} title="Orders" description="View order history" color="brand" />
        <QuickLink href="/profile/addresses" icon={<FiMapPin />} title="Addresses" description="Manage saved addresses" color="green" />
        <QuickLink href="/profile/change-password" icon={<FiLock />} title="Password" description="Change your password" color="yellow" />
        <QuickLink href="/profile/preferences" icon={<FiSettings />} title="Preferences" description="Language & notifications" color="purple" />
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, bgColor, subtitle }: {
  title: string; value: string; icon: React.ReactNode; bgColor: string; subtitle?: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, description, color }: {
  href: string; icon: React.ReactNode; title: string; description: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };
  return (
    <Link href={href} className="glass-card p-5 hover:shadow-brand transition-all group">
      <div className={`w-10 h-10 rounded-2xl ${colorMap[color]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-lg`}>{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </Link>
  );
}
