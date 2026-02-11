'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import {
  FiArrowLeft, FiUsers, FiPackage, FiShoppingBag, FiDollarSign,
  FiToggleLeft, FiToggleRight, FiEdit2, FiGlobe, FiMail, FiPhone,
  FiMapPin, FiActivity, FiShield, FiCheck, FiX, FiUser,
  FiTrendingUp, FiCalendar,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface TenantDetail {
  tenantId: string;
  name: string;
  domain: string;
  isActive: boolean;
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
  features: Record<string, boolean>;
  contact: { email?: string; phone?: string; address?: string };
  social?: Record<string, string>;
  seo?: { title?: string; description?: string };
  payment?: { supportedMethods?: string[]; currencies?: string[] };
  createdAt: string;
  updatedAt: string;
}

interface TenantStats {
  users: { total: number; active: number; newLast30d: number };
  products: { total: number; active: number };
  orders: { total: number; recentOrders: any[] };
  revenue: { allTime: number; last30d: number; orderCount: number };
  usersByRole: Record<string, number>;
  usersByAccountType: Record<string, number>;
}

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accountType: string;
  lastLogin?: string;
  isActive: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  products: 'Products', pricing: 'Pricing', cart: 'Cart', checkout: 'Checkout',
  delivery: 'Delivery', pickup: 'Pickup', reviews: 'Reviews', wishlist: 'Wishlist',
  chat: 'Live Chat', socialLogin: 'Social Login',
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin1: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  admin2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  merchant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  customer: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [tab, setTab] = useState<'overview' | 'users' | 'features' | 'branding'>('overview');

  // --- Users tab state ---
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [usersRoleFilter, setUsersRoleFilter] = useState('');

  useEffect(() => {
    if (!authLoading && user?.role === 'superadmin' && tenantId) {
      fetchDetail();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, tenantId]);

  useEffect(() => {
    if (tab === 'users' && tenantId) fetchUsers(1);
  }, [tab, usersRoleFilter]);

  const fetchDetail = async () => {
    try {
      const res = await apiClient.get(`/admin/tenants/${tenantId}`);
      setTenant(res.data.data.tenant);
      setStats(res.data.data.stats);
      setAdmins(res.data.data.admins);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page: number) => {
    setUsersLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (usersRoleFilter) params.role = usersRoleFilter;
      const res = await apiClient.get(`/admin/tenants/${tenantId}/users`, { params });
      setUsers(res.data.data.users);
      setUsersPagination(res.data.data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggle = async () => {
    if (tenantId === 'default') return;
    setToggling(true);
    try {
      const res = await apiClient.patch(`/admin/tenants/${tenantId}/toggle`);
      toast.success(res.data.data.message);
      if (tenant) setTenant({ ...tenant, isActive: !tenant.isActive });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle');
    } finally {
      setToggling(false);
    }
  };

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
        <div className="h-6 w-32 bg-gray-200 dark:bg-surface-800 rounded" />
        <div className="h-10 w-64 bg-gray-200 dark:bg-surface-800 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-surface-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tenant Not Found</h2>
        <Link href="/admin/tenants" className="text-brand-600 hover:underline">← Back to tenants</Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Back + Header */}
      <div>
        <Link href="/admin/tenants" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 transition-colors mb-4">
          <FiArrowLeft className="w-4 h-4" /> Back to all tenants
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: tenant.branding.primaryColor || '#6C63FF' }}
            >
              {tenant.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tenant.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                <code className="text-xs bg-gray-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">{tenant.tenantId}</code>
                {' · '}{tenant.domain}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tenantId !== 'default' && (
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tenant.isActive
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300'
                }`}
              >
                {tenant.isActive ? <><FiToggleRight className="w-4 h-4" /> Deactivate</> : <><FiToggleLeft className="w-4 h-4" /> Activate</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<FiUsers />} label="Users" value={stats.users.total} sub={`${stats.users.active} active · ${stats.users.newLast30d} new (30d)`} color="blue" />
          <StatCard icon={<FiPackage />} label="Products" value={stats.products.total} sub={`${stats.products.active} active`} color="amber" />
          <StatCard icon={<FiShoppingBag />} label="Orders" value={stats.orders.total} color="purple" />
          <StatCard icon={<FiDollarSign />} label="Revenue" value={`$${stats.revenue.allTime.toLocaleString()}`} sub={`$${stats.revenue.last30d.toLocaleString()} last 30d`} color="green" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-surface-700 -mb-px">
        {(['overview', 'users', 'features', 'branding'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiGlobe className="w-4 h-4 text-gray-400" /> Contact Info
            </h3>
            {tenant.contact?.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FiMail className="w-4 h-4 flex-shrink-0" /> {tenant.contact.email}
              </div>
            )}
            {tenant.contact?.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FiPhone className="w-4 h-4 flex-shrink-0" /> {tenant.contact.phone}
              </div>
            )}
            {tenant.contact?.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FiMapPin className="w-4 h-4 flex-shrink-0" /> {tenant.contact.address}
              </div>
            )}
            <div className="pt-3 border-t border-gray-200 dark:border-surface-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Created {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Users by Role */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-gray-400" /> Users by Role
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] || ROLE_COLORS.customer}`}>
                    {role}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Admins & Key Users */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiShield className="w-4 h-4 text-gray-400" /> Admins & Staff
            </h3>
            {admins.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No admin users found.</p>
            ) : (
              <div className="space-y-3">
                {admins.map((a) => (
                  <div key={a._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-medium flex-shrink-0">
                      {a.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${ROLE_COLORS[a.role] || ROLE_COLORS.customer}`}>
                      {a.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={usersRoleFilter}
              onChange={(e) => setUsersRoleFilter(e.target.value)}
              className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Roles</option>
              {['superadmin', 'admin', 'admin1', 'admin2', 'merchant', 'customer'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center ml-2">
              {usersPagination.total} total users
            </span>
          </div>

          {usersLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-gray-200 dark:bg-surface-800 rounded-xl" />)}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">No users found.</p>
          ) : (
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-surface-800">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-surface-700">
                  {users.map((u: any) => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.customer}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{u.accountType}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                            <FiCheck className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                            <FiX className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {usersPagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                  <p className="text-xs text-gray-500">Page {usersPagination.page} of {usersPagination.pages}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => fetchUsers(usersPagination.page - 1)}
                      disabled={usersPagination.page <= 1}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-surface-700 border border-gray-200 dark:border-surface-600 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => fetchUsers(usersPagination.page + 1)}
                      disabled={usersPagination.page >= usersPagination.pages}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-surface-700 border border-gray-200 dark:border-surface-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'features' && (
        <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Feature Flags</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => {
              const enabled = tenant.features?.[key] !== false;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    enabled
                      ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10'
                      : 'border-gray-200 bg-gray-50 dark:border-surface-700 dark:bg-surface-800'
                  }`}
                >
                  {enabled ? (
                    <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <FiX className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${enabled ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colors */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Brand Colors</h3>
            <div className="space-y-3">
              {[
                { label: 'Primary', color: tenant.branding.primaryColor },
                { label: 'Secondary', color: tenant.branding.secondaryColor },
                { label: 'Accent', color: tenant.branding.accentColor },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-surface-700" style={{ backgroundColor: c.color || '#ccc' }} />
                  <span className="text-sm text-gray-900 dark:text-white">{c.label}</span>
                  <code className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{c.color || 'Not set'}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Typography & Payment */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Typography</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Font: <span className="font-medium text-gray-900 dark:text-white" style={{ fontFamily: tenant.branding.fontFamily }}>{tenant.branding.fontFamily || 'System default'}</span>
              </p>
            </div>

            {tenant.payment && (
              <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Payment</h3>
                {tenant.payment.supportedMethods && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Methods</p>
                    <div className="flex flex-wrap gap-1">
                      {tenant.payment.supportedMethods.map((m) => (
                        <span key={m} className="px-2 py-0.5 bg-gray-100 dark:bg-surface-800 rounded text-xs text-gray-700 dark:text-gray-300">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {tenant.payment.currencies && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Currencies</p>
                    <div className="flex flex-wrap gap-1">
                      {tenant.payment.currencies.map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-gray-100 dark:bg-surface-800 rounded text-xs text-gray-700 dark:text-gray-300">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tenant.seo && (
              <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">SEO</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Title:</span>{' '}
                  {tenant.seo.title || 'Not set'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Description:</span>{' '}
                  {tenant.seo.description || 'Not set'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
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
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
