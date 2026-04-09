'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';

interface TenantSummary {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  plan?: string;
  userCount?: number;
  createdAt: string;
}

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  totalOrders: number;
  recentTenants: TenantSummary[];
}

interface SystemHealth {
  status: string;
  timestamp: string;
  mongo?: boolean;
  redis?: boolean;
}

const ROLE_BADGES: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  admin1: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  admin2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  merchant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  customer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState('');

  const isSuperAdmin = user?.role === 'superadmin';

  const fetchPlatformData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tenantsRes, dashRes] = await Promise.all([
        apiClient.get('/admin/tenants').catch(() => ({ data: { data: { tenants: [] } } })),
        apiClient.get('/admin/dashboard').catch(() => ({ data: { data: { stats: {} } } })),
      ]);

      const tenantList: TenantSummary[] = tenantsRes.data?.data?.tenants || [];
      setTenants(tenantList);

      const dashData = dashRes.data?.data;
      setStats({
        totalTenants: tenantList.length,
        activeTenants: tenantList.filter((t: TenantSummary) => t.isActive).length,
        totalUsers: dashData?.stats?.totalUsers || 0,
        totalRevenue: dashData?.stats?.totalRevenue || 0,
        totalOrders: dashData?.stats?.totalOrders || 0,
        recentTenants: tenantList.slice(0, 5),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load platform data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      // Use the public health endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:6060';
      const res = await fetch(`${apiUrl}/health`);
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: 'unreachable', timestamp: new Date().toISOString() });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPlatformData();
      fetchHealth();
      // Refresh health every 60s
      const interval = setInterval(fetchHealth, 60_000);
      return () => clearInterval(interval);
    }
  }, [isSuperAdmin, fetchPlatformData, fetchHealth]);

  if (!isSuperAdmin) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 rounded-2xl text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Superadmin Access Only</h2>
          <p className="text-red-600 dark:text-red-400 text-sm">This section is restricted to superadmin accounts.</p>
          <Link href="/admin" className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Back to Admin Panel</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>👑</span> Super Admin Control Panel
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Platform-wide oversight — all tenants, users and system health
          </p>
        </div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${ROLE_BADGES.superadmin}`}>
          {user?.firstName} {user?.lastName} · superadmin
        </span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* System Health Banner */}
      <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
        healthLoading ? 'bg-gray-50 dark:bg-surface-800' :
        health?.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
          healthLoading ? 'bg-gray-300 animate-pulse' :
          health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${health?.status === 'healthy' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            System Status: {healthLoading ? 'Checking...' : health?.status?.toUpperCase() || 'UNKNOWN'}
          </p>
          {health && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last checked: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button onClick={fetchHealth} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-surface-600 rounded px-2 py-1">
          ↻ Refresh
        </button>
      </div>

      {/* Platform Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-surface-800 animate-pulse rounded-xl h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Tenants', value: stats?.totalTenants ?? 0, icon: '🏢', color: 'text-blue-600' },
            { label: 'Active Tenants', value: stats?.activeTenants ?? 0, icon: '✅', color: 'text-green-600' },
            { label: 'Total Users', value: (stats?.totalUsers ?? 0).toLocaleString(), icon: '👥', color: 'text-purple-600' },
            { label: 'Total Orders', value: (stats?.totalOrders ?? 0).toLocaleString(), icon: '📦', color: 'text-amber-600' },
            { label: 'Total Revenue', value: `£${((stats?.totalRevenue ?? 0) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: '💰', color: 'text-emerald-600' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-4">
              <div className="text-xl mb-1">{icon}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { href: '/admin/tenants', icon: '🏢', title: 'Manage Tenants', desc: 'Create, edit & toggle tenants', color: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800' },
          { href: '/admin/users', icon: '👤', title: 'All Users', desc: 'Users across the platform', color: 'from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800' },
          { href: '/admin/billing', icon: '💰', title: 'Billing & Plans', desc: 'Subscriptions & revenue', color: 'from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800' },
          { href: '/admin/audit-log', icon: '📋', title: 'Audit Log', desc: 'All admin actions across platform', color: 'from-amber-500/10 to-yellow-500/10 border-amber-200 dark:border-amber-800' },
          { href: '/admin/white-label', icon: '🏷️', title: 'White Label', desc: 'Branding & assets per tenant', color: 'from-teal-500/10 to-cyan-500/10 border-teal-200 dark:border-teal-800' },
          { href: '/admin/analytics', icon: '📊', title: 'Analytics', desc: 'Platform-wide metrics', color: 'from-brand-500/10 to-purple-500/10 border-brand-200 dark:border-brand-800' },
          { href: '/admin/partners', icon: '🤝', title: 'Partners', desc: 'Affiliates & referrals', color: 'from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800' },
          { href: '/admin/settings', icon: '⚙️', title: 'Platform Settings', desc: 'Global config & security', color: 'from-gray-500/10 to-slate-500/10 border-gray-200 dark:border-gray-700' },
        ].map(({ href, icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className={`p-4 border rounded-xl bg-gradient-to-br ${color} hover:shadow-md transition-all hover:-translate-y-0.5 group`}
          >
            <div className="text-xl mb-1">{icon}</div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400">{title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
          </Link>
        ))}
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-surface-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Tenants</h2>
          <Link href="/admin/tenants" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm mb-3">No tenants yet</p>
            <Link href="/admin/tenants/create" className="text-brand-600 hover:underline text-sm">+ Create first tenant</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-surface-800">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">Tenant</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">Slug</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">Plan</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">Created</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
                {tenants.slice(0, 10).map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{t.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 capitalize">{t.plan || 'free'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tenants/${t._id}`} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permission Matrix */}
      <div className="mt-6 bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Role Permissions Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-4 font-medium">Capability</th>
                {['customer', 'merchant', 'admin2', 'admin1', 'admin', 'superadmin'].map(r => (
                  <th key={r} className="py-2 px-3 font-medium text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full ${ROLE_BADGES[r]}`}>{r}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-surface-800">
              {[
                { cap: 'Browse & purchase', perms: [true, true, true, true, true, true] },
                { cap: 'Manage own store', perms: [false, true, false, false, false, false] },
                { cap: 'View products/orders', perms: [false, true, true, true, true, true] },
                { cap: 'Manage users (view)', perms: [false, false, true, true, true, true] },
                { cap: 'Toggle user status', perms: [false, false, false, true, true, true] },
                { cap: 'Reset passwords', perms: [false, false, false, true, true, true] },
                { cap: 'Change user roles', perms: [false, false, false, false, true, true] },
                { cap: 'Create users', perms: [false, false, false, true, true, true] },
                { cap: 'Delete users', perms: [false, false, false, false, true, true] },
                { cap: 'Audit logs', perms: [false, false, false, true, true, true] },
                { cap: 'Billing & plans', perms: [false, false, false, false, true, true] },
                { cap: 'White-label config', perms: [false, false, false, false, true, true] },
                { cap: 'Tenant management', perms: [false, false, false, false, false, true] },
                { cap: 'Platform-wide access', perms: [false, false, false, false, false, true] },
              ].map(({ cap, perms }) => (
                <tr key={cap} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{cap}</td>
                  {perms.map((p, i) => (
                    <td key={i} className="py-2 px-3 text-center">
                      {p ? <span className="text-green-600 dark:text-green-400 font-bold">✓</span> : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
