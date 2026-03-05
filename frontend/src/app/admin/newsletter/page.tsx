'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';

interface Subscriber {
  _id: string;
  email: string;
  tenant: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
}

export default function AdminNewsletterPage() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 25;

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (filter === 'active') params.set('isActive', 'true');
      if (filter === 'inactive') params.set('isActive', 'false');
      if (search) params.set('search', search);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/newsletter/subscribers?${params}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || data.data || []);
        setTotal(data.total || data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const exportCSV = () => {
    const header = 'Email,Status,Subscribed At,Unsubscribed At\n';
    const rows = subscribers
      .map(
        (s) =>
          `${s.email},${s.isActive ? 'Active' : 'Inactive'},${new Date(s.subscribedAt).toISOString()},${
            s.unsubscribedAt ? new Date(s.unsubscribedAt).toISOString() : ''
          }`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStatus = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/newsletter/subscribers/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isActive: !currentActive }),
        }
      );
      if (res.ok) {
        setSubscribers((prev) =>
          prev.map((s) =>
            s._id === id
              ? { ...s, isActive: !currentActive, unsubscribedAt: currentActive ? new Date().toISOString() : undefined }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Failed to update subscriber', err);
    }
  };

  const activeCount = subscribers.filter((s) => s.isActive).length;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Subscribers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total} total &middot; {activeCount} active on this page
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-surface-800 text-gray-900 dark:text-white placeholder-gray-400 border-0 focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : subscribers.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No subscribers found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell">
                  Subscribed
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-700">
              {subscribers.map((sub) => (
                <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                    {sub.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {new Date(sub.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleStatus(sub._id, sub.isActive)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        sub.isActive
                          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100'
                          : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100'
                      }`}
                    >
                      {sub.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-surface-800 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-surface-800 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
