'use client';

import { useState, useEffect, useCallback } from 'react';

interface Partner {
  _id: string;
  user: { name: string; email: string } | null;
  code: string;
  name: string;
  email: string;
  type: string;
  status: string;
  commissionRate: number;
  stats: {
    referrals: number;
    activeTenants: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayout: number;
    currency: string;
  };
  createdAt: string;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/partners`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPartners(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch partners', err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API}/partners/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      fetchPartners();
    } catch {}
  };

  const recordPayout = async (id: string) => {
    const amount = prompt('Enter payout amount (£):');
    if (!amount) return;
    try {
      await fetch(`${API}/partners/${id}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      fetchPartners();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Programme</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} partners</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No partner applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => (
            <div
              key={p._id}
              className="bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{p.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-400">
                      {p.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : p.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="text-xs text-gray-400">{p.type}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{p.email}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Referrals: {p.stats.referrals}</span>
                    <span>Earned: £{p.stats.totalEarned.toFixed(2)}</span>
                    <span>Paid: £{p.stats.totalPaid.toFixed(2)}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Pending: £{p.stats.pendingPayout.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {p.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(p._id, 'active')}
                      className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100"
                    >
                      Approve
                    </button>
                  )}
                  {p.status === 'active' && (
                    <>
                      <button
                        onClick={() => recordPayout(p._id)}
                        className="px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/20 rounded-lg hover:bg-brand-100"
                      >
                        Payout
                      </button>
                      <button
                        onClick={() => updateStatus(p._id, 'suspended')}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100"
                      >
                        Suspend
                      </button>
                    </>
                  )}
                  {p.status === 'suspended' && (
                    <button
                      onClick={() => updateStatus(p._id, 'active')}
                      className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
