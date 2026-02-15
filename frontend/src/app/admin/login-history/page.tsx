'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface LoginEntry {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; email: string; role: string } | null;
  email: string;
  action: string;
  ip: string;
  userAgent: string;
  device: {
    type: string;
    os: string;
    browser: string;
    isMobile: boolean;
  };
  geolocation?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  failureReason?: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  login_success: { label: 'Login Success', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: '✅' },
  login_failed: { label: 'Login Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: '❌' },
  logout: { label: 'Logout', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', icon: '🚪' },
  password_reset_request: { label: 'Password Reset Requested', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: '🔑' },
  password_reset_complete: { label: 'Password Reset Complete', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: '🔒' },
  account_locked: { label: 'Account Locked', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: '🔐' },
  account_unlocked: { label: 'Account Unlocked', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: '🔓' },
};

const DEVICE_ICONS: Record<string, string> = {
  desktop: '🖥️',
  mobile: '📱',
  tablet: '📲',
  bot: '🤖',
  unknown: '❓',
};

export default function LoginHistoryPage() {
  const { user: currentUser } = useAuth();
  const [entries, setEntries] = useState<LoginEntry[]>([]);
  const [stats, setStats] = useState({ totalFailed: 0, totalSuccess: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const canView = currentUser && ['superadmin', 'admin', 'admin1'].includes(currentUser.role);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (actionFilter) params.action = actionFilter;

      const resp = await apiClient.get('/admin/login-history', { params });
      setEntries(resp.data.data.entries);
      setStats(resp.data.data.stats);
      setPagination(resp.data.data.pagination);
    } catch (err) {
      console.error('Failed to load login history:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    if (canView) fetchHistory();
  }, [canView, fetchHistory]);

  if (!canView) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Access denied.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔐 Login History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor authentication events, detect suspicious activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">{stats.totalSuccess}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Successful Logins</div>
        </div>
        <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Failed Attempts</div>
        </div>
        <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-600">
            {stats.totalSuccess + stats.totalFailed > 0
              ? ((stats.totalFailed / (stats.totalSuccess + stats.totalFailed)) * 100).toFixed(1)
              : 0}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Failure Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm dark:bg-surface-800 dark:border-surface-700 dark:text-white">
          <option value="">All Events</option>
          <option value="login_success">Login Success</option>
          <option value="login_failed">Login Failed</option>
          <option value="logout">Logout</option>
          <option value="password_reset_request">Password Reset Requested</option>
          <option value="password_reset_complete">Password Reset Complete</option>
        </select>
        <button onClick={() => fetchHistory(1)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
          Filter
        </button>
      </div>

      {/* Login History Table */}
      <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading login history...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No login events found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-surface-800 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Event</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Device</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">IP Address</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Details</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
                {entries.map((entry) => {
                  const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: 'bg-gray-100 text-gray-800', icon: '•' };
                  return (
                    <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{actionInfo.icon}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {entry.user ? (
                            <>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {entry.user.firstName} {entry.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{entry.user.email}</div>
                            </>
                          ) : (
                            <div className="text-gray-500">{entry.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span>{DEVICE_ICONS[entry.device?.type] || '❓'}</span>
                          <div className="text-xs">
                            <div className="text-gray-700 dark:text-gray-300">{entry.device?.browser || 'Unknown'}</div>
                            <div className="text-gray-400">{entry.device?.os || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {entry.ip || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {entry.failureReason && (
                          <span className="text-red-500">Reason: {entry.failureReason.replace(/_/g, ' ')}</span>
                        )}
                        {entry.geolocation?.country && (
                          <span>📍 {entry.geolocation.city}, {entry.geolocation.country}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-surface-800">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => fetchHistory(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50 dark:border-surface-600 dark:text-gray-300">Prev</button>
              <button onClick={() => fetchHistory(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="px-3 py-1 rounded border text-sm disabled:opacity-50 dark:border-surface-600 dark:text-gray-300">Next</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
