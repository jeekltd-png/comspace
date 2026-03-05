'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';

interface Promotion {
  _id: string;
  product: { name: string; images: any[] } | null;
  merchant: { name: string; email: string } | null;
  type: string;
  status: string;
  budget: { daily: number; total: number; spent: number; currency: string };
  pricing: { model: string; amount: number };
  performance: { impressions: number; clicks: number; conversions: number; revenue: number };
  startsAt: string;
  endsAt: string;
}

export default function AdminPromotionsPage() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [promoRes, statsRes] = await Promise.all([
        fetch(`${API}/promotions`, { credentials: 'include' }),
        fetch(`${API}/promotions/stats`, { credentials: 'include' }),
      ]);
      if (promoRes.ok) {
        const d = await promoRes.json();
        setPromotions(d.data || []);
      }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch promotions', err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API}/promotions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch {}
  };

  const totalSpent = stats.reduce((s, r) => s + (r.totalSpent || 0), 0);
  const totalClicks = stats.reduce((s, r) => s + (r.totalClicks || 0), 0);
  const totalImps = stats.reduce((s, r) => s + (r.totalImpressions || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promoted Listings</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-4">
          <p className="text-xs text-gray-400 uppercase">Active</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {stats.find((s) => s._id === 'active')?.count || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-4">
          <p className="text-xs text-gray-400 uppercase">Total Spend</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">£{totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-4">
          <p className="text-xs text-gray-400 uppercase">Impressions</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{totalImps.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-4">
          <p className="text-xs text-gray-400 uppercase">Clicks</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{totalClicks.toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No promoted listings yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Product</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell">Budget</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell">Performance</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-700">
              {promotions.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                      {p.product?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">{p.merchant?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">{p.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : p.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-surface-700 dark:text-gray-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    £{p.budget.spent.toFixed(2)} / £{p.budget.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {p.performance.impressions} imps · {p.performance.clicks} clicks
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(p._id, 'active')}
                          className="px-2 py-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 rounded hover:bg-green-100"
                        >
                          Approve
                        </button>
                      )}
                      {p.status === 'active' && (
                        <button
                          onClick={() => updateStatus(p._id, 'paused')}
                          className="px-2 py-1 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded hover:bg-yellow-100"
                        >
                          Pause
                        </button>
                      )}
                      {p.status === 'paused' && (
                        <button
                          onClick={() => updateStatus(p._id, 'active')}
                          className="px-2 py-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 rounded hover:bg-green-100"
                        >
                          Resume
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
