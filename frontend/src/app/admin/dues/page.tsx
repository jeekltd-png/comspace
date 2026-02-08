'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import apiClient from '@/lib/api';
import Link from 'next/link';
import {
  FiChevronLeft,
  FiUsers,
  FiDollarSign,
  FiAlertTriangle,
  FiTrendingUp,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiBarChart2,
} from 'react-icons/fi';

interface DashboardData {
  members: { total: number; active: number; lapsed: number; suspended: number };
  finances: { totalCollected: number; pendingDues: number; overdueDues: number };
  monthlyRevenue: { month: string; amount: number }[];
}

interface DuesRecord {
  _id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'failed' | 'waived';
  dueDate: string;
  paidDate: string | null;
  paymentMethod: string;
  periodStart: string;
  periodEnd: string;
  user: { firstName: string; lastName: string; email: string };
  plan: { name: string };
  membership: { memberNumber: string };
}

const duesStatusConfig: Record<string, { color: string; icon: any; bg: string }> = {
  paid: { color: 'text-green-700 dark:text-green-400', icon: FiCheckCircle, bg: 'bg-green-100 dark:bg-green-900/30' },
  pending: { color: 'text-amber-700 dark:text-amber-400', icon: FiClock, bg: 'bg-amber-100 dark:bg-amber-900/30' },
  overdue: { color: 'text-red-700 dark:text-red-400', icon: FiAlertCircle, bg: 'bg-red-100 dark:bg-red-900/30' },
  failed: { color: 'text-red-700 dark:text-red-400', icon: FiXCircle, bg: 'bg-red-100 dark:bg-red-900/30' },
  waived: { color: 'text-gray-700 dark:text-gray-400', icon: FiCheckCircle, bg: 'bg-gray-100 dark:bg-gray-900/30' },
};

export default function AdminDuesDashboardPage() {
  const { token } = useAppSelector((state) => state.auth);
  const [duesFilter, setDuesFilter] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  const { data: dashboard, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dues-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/membership/dashboard', { headers });
      return res.data.data;
    },
    enabled: !!token,
  });

  const { data: duesData, isLoading: duesLoading } = useQuery<{ dues: DuesRecord[] }>({
    queryKey: ['admin-all-dues', duesFilter],
    queryFn: async () => {
      const params = duesFilter ? `?status=${duesFilter}` : '';
      const res = await apiClient.get(`/membership/dues${params}`, { headers });
      return res.data.data;
    },
    enabled: !!token,
  });

  const handleExport = async () => {
    try {
      const res = await apiClient.get('/membership/dues/export', {
        headers,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `dues-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const stats = [
    {
      label: 'Total Members',
      value: dashboard?.members.total ?? 0,
      icon: FiUsers,
      color: 'text-brand-500',
      bg: 'bg-brand-50 dark:bg-brand-900/20',
    },
    {
      label: 'Active Members',
      value: dashboard?.members.active ?? 0,
      icon: FiCheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total Collected',
      value: `$${(dashboard?.finances.totalCollected ?? 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Overdue Dues',
      value: dashboard?.finances.overdueDues ?? 0,
      icon: FiAlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  const maxRevenue = Math.max(...(dashboard?.monthlyRevenue?.map((r) => r.amount) || [1]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="btn-ghost p-2">
            <FiChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiBarChart2 className="w-6 h-6 text-brand-500" />
              Dues Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Overview of membership dues and financial health
            </p>
          </div>
        </div>
        <button onClick={handleExport} className="btn-ghost flex items-center gap-2">
          <FiDownload className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats Grid */}
      {dashLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Chart */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <FiTrendingUp className="w-5 h-5 text-brand-500" />
          Monthly Revenue (Last 6 Months)
        </h2>
        {dashLoading ? (
          <div className="h-48 skeleton" />
        ) : (
          <div className="flex items-end gap-3 h-48">
            {(dashboard?.monthlyRevenue || []).map((r, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  ${r.amount.toLocaleString()}
                </p>
                <div
                  className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${Math.max((r.amount / maxRevenue) * 100, 4)}%`,
                    minHeight: '8px',
                  }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{r.month}</p>
              </div>
            ))}
            {(!dashboard?.monthlyRevenue || dashboard.monthlyRevenue.length === 0) && (
              <div className="w-full text-center text-gray-400 py-16">No revenue data yet</div>
            )}
          </div>
        )}
      </div>

      {/* Membership Breakdown */}
      {!dashLoading && dashboard && (
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Membership Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active', count: dashboard.members.active, color: 'bg-green-500' },
              { label: 'Lapsed', count: dashboard.members.lapsed, color: 'bg-amber-500' },
              { label: 'Suspended', count: dashboard.members.suspended, color: 'bg-red-500' },
              {
                label: 'Other',
                count: dashboard.members.total - dashboard.members.active - dashboard.members.lapsed - dashboard.members.suspended,
                color: 'bg-gray-400',
              },
            ].map((seg, i) => (
              <div key={i} className="text-center">
                <div className={`w-12 h-12 rounded-full ${seg.color} mx-auto mb-2 flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{seg.count}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{seg.label}</p>
              </div>
            ))}
          </div>
          {dashboard.members.total > 0 && (
            <div className="mt-4 h-3 rounded-full bg-gray-100 dark:bg-surface-700 overflow-hidden flex">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${(dashboard.members.active / dashboard.members.total) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${(dashboard.members.lapsed / dashboard.members.total) * 100}%` }}
              />
              <div
                className="bg-red-500 h-full transition-all"
                style={{ width: `${(dashboard.members.suspended / dashboard.members.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Dues Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Dues</h2>
          <select
            value={duesFilter}
            onChange={(e) => setDuesFilter(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-surface-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {duesLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 skeleton" />
            ))}
          </div>
        ) : (duesData?.dues || []).length === 0 ? (
          <div className="p-12 text-center text-gray-400">No dues records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-surface-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(duesData?.dues || []).map((d) => {
                  const sc = duesStatusConfig[d.status] || duesStatusConfig.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={d._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {d.user?.firstName} {d.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {d.membership?.memberNumber}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{d.plan?.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(d.periodStart).toLocaleDateString()} – {new Date(d.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {d.currency} {d.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize text-xs">
                        {d.paymentMethod?.replace('_', ' ') || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
