'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import {
  FiUsers, FiPackage, FiShoppingBag, FiDollarSign,
  FiPlus, FiSearch, FiToggleLeft, FiToggleRight,
  FiChevronRight, FiGlobe, FiShield, FiActivity,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface TenantSummary {
  _id: string;
  tenantId: string;
  name: string;
  domain: string;
  type: string;
  isActive: boolean;
  branding: { primaryColor?: string; logo?: string };
  stats: {
    users: number;
    activeUsers: number;
    products: number;
    activeProducts: number;
    orders: number;
    revenue: number;
  };
  contact?: { email?: string; phone?: string };
  createdAt: string;
}

interface CrossTenantStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

const TENANT_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  platform:    { label: 'Platform',    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: '🏛️' },
  individual:  { label: 'Individual',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',       icon: '👤' },
  business:    { label: 'Business',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   icon: '🏢' },
  association: { label: 'Association', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   icon: '🌿' },
  education:   { label: 'Education',   color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',           icon: '🎓' },
};

export default function TenantsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [overview, setOverview] = useState<CrossTenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [tenantsRes, statsRes] = await Promise.all([
        apiClient.get('/admin/tenants'),
        apiClient.get('/admin/tenants/stats/overview'),
      ]);
      setTenants(tenantsRes.data.data.tenants);
      setOverview(statsRes.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'superadmin') {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const handleToggle = async (tenantId: string) => {
    setToggling(tenantId);
    try {
      const res = await apiClient.patch(`/admin/tenants/${tenantId}/toggle`);
      toast.success(res.data.data.message);
      setTenants((prev) =>
        prev.map((t) => (t.tenantId === tenantId ? { ...t, isActive: !t.isActive } : t))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle tenant');
    } finally {
      setToggling(null);
    }
  };

  const filtered = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tenantId.toLowerCase().includes(search.toLowerCase()) ||
      t.domain.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  if (!authLoading && user?.role !== 'superadmin') {
    return (
      <div className="p-8 text-center">
        <FiShield className="mx-auto w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400">Only super administrators can access tenant management.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-surface-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-surface-800 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-surface-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenant Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all individual, business, association and education tenants
          </p>
        </div>
        <Link
          href="/admin/tenants/create"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm shadow-brand"
        >
          <FiPlus className="w-4 h-4" /> New Tenant
        </Link>
      </div>

      {/* Cross-Tenant Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<FiGlobe />} label="Total Tenants" value={overview.totalTenants} sub={`${overview.activeTenants} active`} color="purple" />
          <StatCard icon={<FiUsers />} label="Total Users" value={overview.totalUsers} color="blue" />
          <StatCard icon={<FiPackage />} label="Total Products" value={overview.totalProducts} color="amber" />
          <StatCard icon={<FiDollarSign />} label="Total Revenue" value={`$${overview.totalRevenue.toLocaleString()}`} sub={`${overview.totalOrders} orders`} color="green" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tenants by name, ID, or domain…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-surface-800 rounded-xl p-1">
          {['all', 'platform', 'individual', 'business', 'association', 'education'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-white dark:bg-surface-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {type === 'all' ? 'All' : TENANT_TYPE_LABELS[type]?.label || type}
            </button>
          ))}
        </div>
      </div>

      {/* Tenant Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FiGlobe className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No tenants found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((tenant) => {
            const typeInfo = TENANT_TYPE_LABELS[tenant.type] || TENANT_TYPE_LABELS.individual;
            return (
              <div
                key={tenant.tenantId}
                className={`bg-white dark:bg-surface-900 border rounded-2xl p-5 transition-all hover:shadow-lg ${
                  tenant.isActive
                    ? 'border-gray-200 dark:border-surface-700'
                    : 'border-red-200 dark:border-red-900/50 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Tenant Identity */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: tenant.branding.primaryColor || '#6C63FF' }}
                    >
                      {tenant.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{tenant.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                        {!tenant.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <code className="text-xs bg-gray-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">{tenant.tenantId}</code>
                        {' · '}
                        <span>{tenant.domain}</span>
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-6 text-center lg:text-right">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{tenant.stats.users}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{tenant.stats.products}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Products</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{tenant.stats.orders}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">${tenant.stats.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(tenant.tenantId)}
                      disabled={tenant.tenantId === 'default' || toggling === tenant.tenantId}
                      title={tenant.isActive ? 'Deactivate tenant' : 'Activate tenant'}
                      className={`p-2 rounded-lg transition-colors ${
                        tenant.tenantId === 'default'
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : tenant.isActive
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                    >
                      {tenant.isActive ? <FiToggleRight className="w-5 h-5" /> : <FiToggleLeft className="w-5 h-5" />}
                    </button>
                    <Link
                      href={`/admin/tenants/${tenant.tenantId}`}
                      className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View <FiChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: 'purple' | 'blue' | 'amber' | 'green';
}) {
  const colors = {
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
