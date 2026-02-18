'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import {
  FiUsers, FiShoppingCart, FiDollarSign, FiPackage,
  FiTrendingUp, FiTrendingDown, FiEye, FiSearch,
  FiStar, FiActivity, FiBarChart2, FiRefreshCw,
} from 'react-icons/fi';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, Funnel, FunnelChart,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────
interface DashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
    totalOrders: number;
    ordersInPeriod: number;
    totalProducts: number;
    totalRevenue: number;
    revenueGrowth: number;
    avgOrderValue: number;
    pageViews: number;
    uniqueVisitors: number;
  };
  engagement: {
    dailyActivity: Array<{ _id: string; events: number; users: number }>;
    dailyActiveUsers: Array<{ _id: string; count: number }>;
    topPages: Array<{ _id: string; views: number; uniqueViews: number }>;
    topSearchTerms: Array<{ _id: string; count: number }>;
  };
  conversion: {
    cartAdditions: number;
    checkoutStarts: number;
    checkoutCompletes: number;
    conversionRate: number;
    formStarts: number;
    formCompletions: number;
    formCompletionRate: number;
  };
  products: {
    topViewed: Array<{ _id: string; name: string; views: number }>;
    topSold: Array<{ _id: string; name: string; totalSold: number; revenue: number }>;
  };
  reviews: {
    recent: Array<{
      _id: string;
      rating: number;
      title: string;
      comment: string;
      user: { firstName: string; lastName: string };
      createdAt: string;
    }>;
    avgRating: number;
    totalReviews: number;
  };
  orders: {
    byStatus: Record<string, number>;
  };
}

// ─── Main Dashboard Page ────────────────────────────────────────────────────
export default function AdminAnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeUsersRealtime, setActiveUsersRealtime] = useState(0);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, realtimeRes] = await Promise.all([
        apiClient.get(`/analytics/dashboard?range=${range}`),
        apiClient.get('/analytics/realtime').catch(() => ({ data: { data: { activeUsers: 0 } } })),
      ]);
      setData(dashRes.data.data);
      setActiveUsersRealtime(realtimeRes.data.data.activeUsers);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchDashboard();
    // Refresh realtime count every 30s
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get('/analytics/realtime');
        setActiveUsersRealtime(res.data.data.activeUsers);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchDashboard} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor user activity, sales, and engagement in real time
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Real-time indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              {activeUsersRealtime} active now
            </span>
          </div>
          {/* Range selector */}
          <div className="flex bg-gray-100 dark:bg-surface-800 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  range === r
                    ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Revenue"
              value={`$${data.overview.totalRevenue.toLocaleString()}`}
              change={data.overview.revenueGrowth}
              icon={<FiDollarSign />}
              color="green"
            />
            <KPICard
              title="Total Users"
              value={data.overview.totalUsers.toLocaleString()}
              subtitle={`${data.overview.newUsers} new`}
              change={data.overview.userGrowth}
              icon={<FiUsers />}
              color="blue"
            />
            <KPICard
              title="Orders"
              value={data.overview.totalOrders.toLocaleString()}
              subtitle={`${data.overview.ordersInPeriod} in period`}
              icon={<FiShoppingCart />}
              color="purple"
            />
            <KPICard
              title="Avg Order Value"
              value={`$${data.overview.avgOrderValue.toFixed(2)}`}
              icon={<FiBarChart2 />}
              color="amber"
            />
          </div>

          {/* Engagement Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Page Views"
              value={data.overview.pageViews.toLocaleString()}
              icon={<FiEye />}
              color="cyan"
              small
            />
            <KPICard
              title="Unique Visitors"
              value={data.overview.uniqueVisitors.toLocaleString()}
              icon={<FiActivity />}
              color="indigo"
              small
            />
            <KPICard
              title="Conversion Rate"
              value={`${data.conversion.conversionRate}%`}
              subtitle={`${data.conversion.checkoutCompletes}/${data.conversion.cartAdditions} carts`}
              icon={<FiTrendingUp />}
              color="emerald"
              small
            />
            <KPICard
              title="Avg Rating"
              value={data.reviews.avgRating > 0 ? `${data.reviews.avgRating} ★` : 'N/A'}
              subtitle={`${data.reviews.totalReviews} reviews`}
              icon={<FiStar />}
              color="yellow"
              small
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <ChartCard title="Daily Activity" subtitle="Events & unique users per day">
              <ActivityChart data={data.engagement.dailyActivity} />
            </ChartCard>

            {/* Order Status Distribution */}
            <ChartCard title="Order Status" subtitle="Orders by current status">
              <OrderStatusChart data={data.orders.byStatus} />
            </ChartCard>
          </div>

          {/* Conversion Funnel */}
          <ChartCard title="Conversion Funnel" subtitle="From cart to completed purchase">
            <ConversionFunnel data={data.conversion} />
          </ChartCard>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <ChartCard title="Top Products (by Sales)" subtitle="Best selling products in period">
              <div className="space-y-3">
                {data.products.topSold.length > 0 ? data.products.topSold.map((p, i) => (
                  <div key={p._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                        {p.name || 'Unknown Product'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{p.totalSold} sold</div>
                      <div className="text-xs text-gray-500">${p.revenue?.toFixed(2)}</div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>
                )}
              </div>
            </ChartCard>

            {/* Top Search Terms */}
            <ChartCard title="Top Search Terms" subtitle="What users are searching for">
              <div className="space-y-3">
                {data.engagement.topSearchTerms.length > 0 ? data.engagement.topSearchTerms.map((s, i) => (
                  <div key={s._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiSearch className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-800 dark:text-gray-200">"{s._id}"</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{s.count}×</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 text-center py-4">No search data yet</p>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Recent Reviews */}
          <ChartCard title="Recent Reviews" subtitle="Latest customer feedback">
            <div className="space-y-4">
              {data.reviews.recent.length > 0 ? data.reviews.recent.slice(0, 5).map((r) => (
                <div key={r._id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-surface-800 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-600">
                    {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {r.user?.firstName} {r.user?.lastName}
                      </span>
                      <Stars rating={r.rating} />
                    </div>
                    {r.title && <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.title}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{r.comment}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">No reviews yet</p>
              )}
            </div>
          </ChartCard>

          {/* Form Completion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Form Analytics" subtitle="Registration, checkout & other forms">
              <div className="grid grid-cols-2 gap-4">
                <MiniStat label="Form Starts" value={data.conversion.formStarts} />
                <MiniStat label="Form Completions" value={data.conversion.formCompletions} />
                <MiniStat label="Completion Rate" value={`${data.conversion.formCompletionRate}%`} />
                <MiniStat label="Abandonment" value={`${Math.max(0, 100 - data.conversion.formCompletionRate)}%`} />
              </div>
            </ChartCard>

            {/* Top Pages */}
            <ChartCard title="Most Visited Pages" subtitle="Top pages by views">
              <div className="space-y-2">
                {data.engagement.topPages.length > 0 ? data.engagement.topPages.slice(0, 8).map((p) => (
                  <div key={p._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[250px]">
                      {p._id || '/'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{p.uniqueViews} unique</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{p.views}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400 text-center py-4">No page view data yet</p>
                )}
              </div>
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function KPICard({
  title, value, subtitle, change, icon, color, small,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  small?: boolean;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  };

  return (
    <div className={`bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl ${small ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className={`${small ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 dark:text-white mt-1`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {change >= 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
          {Math.abs(change)}% vs previous period
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-xl text-center">
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xs ${i <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
      ))}
    </div>
  );
}

// ─── Charts ─────────────────────────────────────────────────────────────────

function ActivityChart({ data }: { data: Array<{ _id: string; events: number; users: number }> }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No activity data yet</p>;

  const chartData = data.map(d => ({
    date: d._id.slice(5),
    events: d.events,
    users: d.users,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <RechartsTooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        <Area type="monotone" dataKey="events" stroke="#6366f1" fill="url(#colorEvents)" strokeWidth={2} name="Events" />
        <Area type="monotone" dataKey="users" stroke="#22c55e" fill="url(#colorUsers)" strokeWidth={2} name="Users" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function OrderStatusChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No order data yet</p>;

  const PIE_COLORS: Record<string, string> = {
    pending: '#facc15',
    confirmed: '#60a5fa',
    processing: '#818cf8',
    shipped: '#a78bfa',
    'out-for-delivery': '#22d3ee',
    delivered: '#22c55e',
    'ready-for-pickup': '#2dd4bf',
    'picked-up': '#34d399',
    cancelled: '#f87171',
    refunded: '#9ca3af',
  };

  const chartData = entries.map(([status, count]) => ({
    name: status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    fill: PIE_COLORS[status] || '#94a3b8',
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          stroke="none"
        >
          {chartData.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.fill} />
          ))}
        </Pie>
        <RechartsTooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: '11px' }}
          formatter={(value: string) => <span className="text-gray-600 dark:text-gray-400">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ConversionFunnel({ data }: { data: DashboardData['conversion'] }) {
  const chartData = [
    { name: 'Cart Additions', value: data.cartAdditions, fill: '#60a5fa' },
    { name: 'Checkout Started', value: data.checkoutStarts, fill: '#818cf8' },
    { name: 'Checkout Completed', value: data.checkoutCompletes, fill: '#22c55e' },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" width={130} />
          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
            {chartData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2 text-center md:text-left">
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.conversionRate}%</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Conversion Rate</p>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5 h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5 h-64" />
        ))}
      </div>
    </div>
  );
}
