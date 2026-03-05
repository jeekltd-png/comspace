'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import {
  FiUsers, FiPackage, FiShoppingBag, FiDollarSign,
  FiTrendingUp, FiTrendingDown, FiArrowRight, FiClock,
  FiCheckCircle, FiXCircle, FiTruck, FiRefreshCw,
  FiAlertTriangle, FiBarChart2, FiStar, FiFileText,
  FiSettings, FiPlusCircle, FiGrid, FiUserPlus,
} from 'react-icons/fi';

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
  revenue30d: number;
  newUsers30d: number;
  ordersByStatus: Array<{ _id: string; count: number }>;
  topProducts: Array<{ _id: string; name: string; totalSold: number; revenue: number }>;
  dailyRevenue: Array<{ _id: string; revenue: number; orders: number }>;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    total: number;
    currency?: string;
    status: string;
    createdAt: string;
    user?: { firstName?: string; lastName?: string; email?: string };
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending:    { label: 'Pending',    icon: <FiClock className="w-4 h-4" />,        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400' },
  confirmed:  { label: 'Confirmed',  icon: <FiCheckCircle className="w-4 h-4" />,  color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  processing: { label: 'Processing', icon: <FiRefreshCw className="w-4 h-4" />,    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' },
  shipped:    { label: 'Shipped',    icon: <FiTruck className="w-4 h-4" />,         color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
  delivered:  { label: 'Delivered',  icon: <FiCheckCircle className="w-4 h-4" />,  color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
  cancelled:  { label: 'Cancelled',  icon: <FiXCircle className="w-4 h-4" />,      color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
  refunded:   { label: 'Refunded',   icon: <FiRefreshCw className="w-4 h-4" />,    color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400' },
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isMerchant = user?.role === 'merchant';
  const isAdmin = ['admin', 'superadmin', 'admin1', 'admin2'].includes(user?.role || '');

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) { setLoading(false); return; }
    const fetchDashboard = async () => {
      try {
        const resp = await apiClient.get('/admin/dashboard');
        if (resp?.data?.data) setData(resp.data.data);
      } catch { /* Dashboard stats are optional */ }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, [authLoading, isAdmin]);

  const formatCurrency = (amount: number) => {
    try { return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount); }
    catch { return `$${amount.toFixed(0)}`; }
  };

  // Merchant view
  if (!authLoading && isMerchant && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <Link href="/" className="text-brand-600 hover:text-brand-800 dark:text-brand-400">← Back to Store</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAction href="/admin/merchant" icon={<FiBarChart2 />} title="My Dashboard" desc="View your stats & overview" />
            <QuickAction href="/admin/merchant/products" icon={<FiPackage />} title="My Products" desc="Manage your product listings" />
            <QuickAction href="/admin/merchant/orders" icon={<FiShoppingBag />} title="My Orders" desc="View & fulfill orders" />
            <QuickAction href="/admin/merchant/profile" icon={<FiSettings />} title="My Profile" desc="Edit your storefront & details" />
          </div>
        </div>
      </div>
    );
  }

  const maxDailyRev = Math.max(...(data?.dailyRevenue?.map(d => d.revenue) || [1]));
  const totalStatusOrders = data?.ordersByStatus?.reduce((s, o) => s + o.count, 0) || 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
      <header className="bg-white dark:bg-surface-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'superadmin' && (
              <Link href="/admin/tenants" className="btn-secondary text-sm flex items-center gap-1.5">
                <FiGrid className="w-4 h-4" /> Tenants
              </Link>
            )}
            <Link href="/" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 text-sm">← Store</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Revenue" value={loading ? '—' : formatCurrency(data?.revenue || 0)}
            subtitle={data?.revenue30d ? `${formatCurrency(data.revenue30d)} last 30d` : undefined}
            icon={<FiDollarSign className="w-5 h-5" />}
            iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            trend={data?.revenue30d && data?.revenue ? Math.round((data.revenue30d / (data.revenue || 1)) * 100) : undefined} />
          <KPICard title="Total Orders" value={loading ? '—' : String(data?.totalOrders || 0)}
            icon={<FiShoppingBag className="w-5 h-5" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
          <KPICard title="Total Users" value={loading ? '—' : String(data?.totalUsers || 0)}
            subtitle={data?.newUsers30d ? `+${data.newUsers30d} this month` : undefined}
            icon={<FiUsers className="w-5 h-5" />}
            iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
          <KPICard title="Products" value={loading ? '—' : String(data?.totalProducts || 0)}
            icon={<FiPackage className="w-5 h-5" />}
            iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        </div>

        {/* ── Revenue Chart + Order Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Revenue Chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FiTrendingUp className="w-4 h-4 text-green-500" /> Revenue (Last 7 Days)
            </h2>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-8 bg-gray-200 dark:bg-surface-800 rounded" />)}
              </div>
            ) : !data?.dailyRevenue?.length ? (
              <p className="text-sm text-gray-400 text-center py-12">No revenue data yet</p>
            ) : (
              <div className="space-y-2">
                {data.dailyRevenue.map((day) => {
                  const pct = maxDailyRev > 0 ? (day.revenue / maxDailyRev) * 100 : 0;
                  const label = new Date(day._id + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
                  return (
                    <div key={day._id} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-gray-500 dark:text-gray-400 text-right shrink-0">{label}</span>
                      <div className="flex-1 h-7 bg-gray-100 dark:bg-surface-800 rounded-lg overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${Math.max(pct, 4)}%` }}>
                          {pct > 30 && <span className="text-[10px] text-white font-medium">{formatCurrency(day.revenue)}</span>}
                        </div>
                      </div>
                      {pct <= 30 && <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-16">{formatCurrency(day.revenue)}</span>}
                      <span className="text-[10px] text-gray-400 shrink-0 w-12">{day.orders} ord</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Status Breakdown */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FiBarChart2 className="w-4 h-4 text-brand-500" /> Order Pipeline
            </h2>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-200 dark:bg-surface-800 rounded-lg" />)}
              </div>
            ) : !data?.ordersByStatus?.length ? (
              <p className="text-sm text-gray-400 text-center py-12">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {data.ordersByStatus.map((s) => {
                  const cfg = STATUS_CONFIG[s._id] || { label: s._id, icon: <FiPackage className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50 dark:bg-surface-800' };
                  const pct = (s.count / totalStatusOrders) * 100;
                  return (
                    <div key={s._id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${cfg.color}`}>
                      {cfg.icon}
                      <span className="flex-1 text-sm font-medium capitalize">{cfg.label}</span>
                      <span className="text-sm font-bold">{s.count}</span>
                      <span className="text-[10px] opacity-60 w-8 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Top Products + Recent Orders ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiStar className="w-4 h-4 text-amber-500" /> Top Products
              </h2>
              <Link href="/admin/products" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">All products →</Link>
            </div>
            {loading ? (
              <div className="p-6 animate-pulse space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-surface-800 rounded-lg" />)}
              </div>
            ) : !data?.topProducts?.length ? (
              <div className="p-8 text-center">
                <FiPackage className="w-10 h-10 text-gray-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No product data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-surface-800">
                {data.topProducts.map((product, i) => (
                  <div key={product._id} className="flex items-center gap-4 px-6 py-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      i === 1 ? 'bg-gray-200 text-gray-600 dark:bg-surface-700 dark:text-gray-300' :
                      'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                    }`}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.totalSold} sold</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiClock className="w-4 h-4 text-brand-500" /> Recent Orders
              </h2>
              <Link href="/admin/orders" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">All orders →</Link>
            </div>
            {loading ? (
              <div className="p-6 animate-pulse space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-surface-800 rounded-lg" />)}
              </div>
            ) : !data?.recentOrders?.length ? (
              <div className="p-8 text-center">
                <FiShoppingBag className="w-10 h-10 text-gray-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No recent orders</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-surface-800">
                {data.recentOrders.slice(0, 8).map((order) => {
                  const cfg = STATUS_CONFIG[order.status];
                  return (
                    <Link key={order._id} href={`/admin/orders/${order._id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-surface-800/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {order.user?.firstName ? `${order.user.firstName} ${order.user.lastName || ''}` : order.user?.email || 'Guest'} &bull;{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${cfg?.color || 'text-gray-600 bg-gray-50 dark:bg-surface-800'}`}>
                          {cfg?.icon} {order.status?.replace(/-/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Actions Grid ── */}
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <QuickAction href="/admin/products/new" icon={<FiPlusCircle />} title="Add Product" desc="Create listing" />
            <QuickAction href="/admin/orders" icon={<FiShoppingBag />} title="Orders" desc="Manage orders" />
            <QuickAction href="/admin/vendors" icon={<FiUsers />} title="Vendors" desc="Manage vendors" />
            <QuickAction href="/admin/theme" icon={<FiSettings />} title="Theme" desc="Branding & colors" />
            <QuickAction href="/admin/invoices" icon={<FiFileText />} title="Invoices" desc="View invoices" />
            <QuickAction href="/admin/members" icon={<FiUserPlus />} title="Members" desc="Manage members" />
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon, iconBg, trend }: {
  title: string; value: string; subtitle?: string; icon: React.ReactNode; iconBg: string; trend?: number;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
              {trend}% of total
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="flex flex-col items-center text-center p-4 rounded-xl border-2 border-gray-100 dark:border-surface-700 hover:border-brand-500 hover:shadow-md transition-all group">
      <span className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
      <span className="text-[11px] text-gray-500 dark:text-gray-400">{desc}</span>
    </Link>
  );
}
