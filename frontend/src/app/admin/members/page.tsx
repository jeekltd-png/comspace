'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import apiClient from '@/lib/api';
import Link from 'next/link';
import {
  FiUsers,
  FiSearch,
  FiChevronLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiFilter,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Member {
  _id: string;
  status: 'active' | 'lapsed' | 'suspended' | 'cancelled' | 'pending';
  memberNumber: string;
  joinDate: string;
  nextDueDate: string;
  lastPaymentDate: string;
  user: { _id: string; firstName: string; lastName: string; email: string; phone?: string };
  plan: { _id: string; name: string; amount: number; currency: string; interval: string };
}

const statusConfig: Record<string, { color: string; icon: any; label: string; bg: string }> = {
  active: { color: 'text-green-700 dark:text-green-400', icon: FiCheckCircle, label: 'Active', bg: 'bg-green-100 dark:bg-green-900/30' },
  lapsed: { color: 'text-amber-700 dark:text-amber-400', icon: FiAlertCircle, label: 'Lapsed', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  suspended: { color: 'text-red-700 dark:text-red-400', icon: FiXCircle, label: 'Suspended', bg: 'bg-red-100 dark:bg-red-900/30' },
  cancelled: { color: 'text-gray-700 dark:text-gray-400', icon: FiXCircle, label: 'Cancelled', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  pending: { color: 'text-brand-700 dark:text-brand-400', icon: FiClock, label: 'Pending', bg: 'bg-brand-100 dark:bg-brand-900/30' },
};

export default function AdminMembersPage() {
  const { token } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showRecordPayment, setShowRecordPayment] = useState<string | null>(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('manual');

  const headers = { Authorization: `Bearer ${token}` };

  const { data, isLoading } = useQuery<{ members: Member[]; pagination: any }>({
    queryKey: ['admin-members', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await apiClient.get(`/membership/members?${params}`, { headers });
      return res.data.data;
    },
    enabled: !!token,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/membership/members/${id}/status`, { status }, { headers });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Member status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const res = await apiClient.post(
        '/membership/members/record-payment',
        { membershipId, paymentMethod, notes: paymentNotes },
        { headers }
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Payment recorded');
      setShowRecordPayment(null);
      setPaymentNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record payment'),
  });

  const members = data?.members || [];
  const filteredMembers = search
    ? members.filter((m) => {
        const q = search.toLowerCase();
        return (
          m.user?.firstName?.toLowerCase().includes(q) ||
          m.user?.lastName?.toLowerCase().includes(q) ||
          m.user?.email?.toLowerCase().includes(q) ||
          m.memberNumber?.toLowerCase().includes(q)
        );
      })
    : members;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="btn-ghost p-2">
          <FiChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiUsers className="w-6 h-6 text-brand-500" />
            Members
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage association members and their membership status
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, or member number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field pl-10 pr-8 appearance-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="lapsed">Lapsed</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 skeleton" />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FiUsers className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No members found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {search ? 'Try adjusting your search.' : 'Members will appear here once they join.'}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-surface-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Member</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Member #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Next Due</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredMembers.map((m) => {
                  const s = statusConfig[m.status] || statusConfig.pending;
                  const Icon = s.icon;
                  return (
                    <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {m.user?.firstName} {m.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{m.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {m.memberNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 dark:text-white">{m.plan?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {m.plan?.currency} {m.plan?.amount?.toFixed(2)}/{m.plan?.interval}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${s.bg} ${s.color}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {m.nextDueDate ? new Date(m.nextDueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                updateStatusMutation.mutate({ id: m._id, status: e.target.value });
                              }
                            }}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-surface-800 text-gray-700 dark:text-gray-300"
                          >
                            <option value="">Change Status</option>
                            {['active', 'lapsed', 'suspended', 'cancelled'].map((st) => (
                              <option key={st} value={st} disabled={st === m.status}>
                                {st.charAt(0).toUpperCase() + st.slice(1)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setShowRecordPayment(m._id)}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                          >
                            <FiDollarSign className="w-3 h-3" /> Record Payment
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Record Manual Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="manual">Manual</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => recordPaymentMutation.mutate(showRecordPayment)}
                  disabled={recordPaymentMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                </button>
                <button onClick={() => setShowRecordPayment(null)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
