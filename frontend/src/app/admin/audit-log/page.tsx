'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface AuditEntry {
  _id: string;
  actor: { _id: string; firstName: string; lastName: string; email: string; role: string } | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: string;
  targetType?: string;
  targetId?: string;
  targetEmail?: string;
  description: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
  ip?: string;
  device?: { type: string; os: string; browser: string };
  status: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  user_management: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  order: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  product: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  vendor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  tenant: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  config: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  payment: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  system: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const STATUS_ICONS: Record<string, string> = {
  success: '✅',
  failure: '❌',
  warning: '⚠️',
};

export default function AuditLogPage() {
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canView = currentUser && ['superadmin', 'admin', 'admin1'].includes(currentUser.role);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (category) params.category = category;
      if (status) params.status = status;

      const resp = await apiClient.get('/admin/audit-logs', { params });
      setLogs(resp.data.data.logs);
      setPagination(resp.data.data.pagination);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    if (canView) fetchLogs();
  }, [canView, fetchLogs]);

  if (!canView) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Access denied. Higher admin privileges required.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📋 Audit Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete trail of all admin and system actions — {pagination.total} entries
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-lg px-3 py-2 text-sm dark:bg-surface-800 dark:border-surface-700 dark:text-white">
          <option value="">All Categories</option>
          <option value="auth">Auth</option>
          <option value="user_management">User Management</option>
          <option value="order">Orders</option>
          <option value="product">Products</option>
          <option value="vendor">Vendors</option>
          <option value="tenant">Tenants</option>
          <option value="config">Config</option>
          <option value="payment">Payments</option>
          <option value="system">System</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm dark:bg-surface-800 dark:border-surface-700 dark:text-white">
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="warning">Warning</option>
        </select>
        <button onClick={() => fetchLogs(1)} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
          Filter
        </button>
      </div>

      {/* Audit Log List */}
      <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No audit entries found</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-surface-800">
            {logs.map((log) => (
              <div key={log._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                <div
                  className="px-4 py-3 flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                >
                  <span className="text-lg mt-0.5">{STATUS_ICONS[log.status] || '•'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[log.category] || CATEGORY_COLORS.system}`}>
                        {log.category}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{log.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>By: {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : log.actorEmail}</span>
                      {log.ip && <span>IP: {log.ip}</span>}
                      {log.device && <span>{log.device.browser} / {log.device.os}</span>}
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === log._id && (
                  <div className="px-4 pb-3 ml-9">
                    <div className="bg-gray-50 dark:bg-surface-800 rounded-lg p-3 text-xs space-y-2">
                      {log.targetType && (
                        <div><strong>Target:</strong> {log.targetType} {log.targetId && `(${log.targetId})`} {log.targetEmail && `— ${log.targetEmail}`}</div>
                      )}
                      {log.changes && log.changes.length > 0 && (
                        <div>
                          <strong>Changes:</strong>
                          <ul className="mt-1 space-y-1">
                            {log.changes.map((c, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="font-mono text-gray-500">{c.field}:</span>
                                <span className="text-red-500 line-through">{String(c.oldValue)}</span>
                                <span>→</span>
                                <span className="text-green-600">{String(c.newValue)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div><strong>Actor Role:</strong> {log.actorRole}</div>
                      <div><strong>User Agent Device:</strong> {log.device ? `${log.device.type} — ${log.device.os} — ${log.device.browser}` : 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-surface-800">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50 dark:border-surface-600 dark:text-gray-300">Prev</button>
              <button onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="px-3 py-1 rounded border text-sm disabled:opacity-50 dark:border-surface-600 dark:text-gray-300">Next</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
