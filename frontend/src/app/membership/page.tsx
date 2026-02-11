'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import apiClient from '@/lib/api';
import Link from 'next/link';
import {
  FiCreditCard,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiShield,
  FiArrowRight,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Plan {
  _id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
}

interface Membership {
  _id: string;
  status: 'active' | 'lapsed' | 'suspended' | 'cancelled' | 'pending';
  memberNumber: string;
  joinDate: string;
  nextDueDate: string;
  lastPaymentDate: string;
  autoRenew: boolean;
  plan: Plan;
  user: { firstName: string; lastName: string; email: string };
}

interface DuesRecord {
  _id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'failed' | 'waived';
  dueDate: string;
  paidDate?: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
  plan: { name: string; interval: string };
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  active: { color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400', icon: FiCheckCircle, label: 'Active' },
  lapsed: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400', icon: FiAlertCircle, label: 'Lapsed' },
  suspended: { color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400', icon: FiX, label: 'Suspended' },
  cancelled: { color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/30 dark:text-gray-400', icon: FiX, label: 'Cancelled' },
  pending: { color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400', icon: FiClock, label: 'Pending' },
};

const duesStatusConfig: Record<string, { color: string; label: string }> = {
  paid: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Paid' },
  pending: { color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', label: 'Pending' },
  overdue: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Overdue' },
  failed: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Failed' },
  waived: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', label: 'Waived' },
};

export default function MembershipPage() {
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [showPlans, setShowPlans] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch current membership
  const { data: membershipData, isLoading: loadingMembership } = useQuery<{ membership: Membership | null }>({
    queryKey: ['membership'],
    queryFn: async () => {
      const res = await apiClient.get('/membership/me', { headers });
      return res.data.data;
    },
    enabled: !!token,
  });

  // Fetch available plans
  const { data: plansData } = useQuery<{ plans: Plan[] }>({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const res = await apiClient.get('/membership/plans', { headers });
      return res.data.data;
    },
    enabled: !!token,
  });

  // Fetch dues history
  const { data: duesData, isLoading: loadingDues } = useQuery<{ dues: DuesRecord[] }>({
    queryKey: ['my-dues'],
    queryFn: async () => {
      const res = await apiClient.get('/membership/me/dues', { headers });
      return res.data.data;
    },
    enabled: !!token && !!membershipData?.membership,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiClient.post('/membership/subscribe', { planId }, { headers });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Membership activated!');
      queryClient.invalidateQueries({ queryKey: ['membership'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues'] });
      setShowPlans(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to subscribe');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/membership/cancel', {}, { headers });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Membership cancelled');
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <FiShield className="w-16 h-16 text-brand-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in Required</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Please sign in to view your membership.</p>
          <Link href="/login" className="btn-primary">
            Sign In <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (loadingMembership) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  const membership = membershipData?.membership;
  const plans = plansData?.plans || [];
  const dues = duesData?.dues || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Membership</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your membership and dues payments</p>

      {/* ─── No Membership ─── */}
      {!membership || membership.status === 'cancelled' ? (
        <div className="space-y-8">
          <div className="glass-card p-8 text-center">
            <FiCreditCard className="w-16 h-16 text-brand-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {membership?.status === 'cancelled' ? 'Membership Cancelled' : 'No Active Membership'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Choose a plan to become a member and start paying your dues.
            </p>
            <button onClick={() => setShowPlans(true)} className="btn-primary">
              View Plans <FiArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Plan Selection */}
          {(showPlans || !membership) && plans.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Available Plans</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div key={plan._id} className="glass-card p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                        {plan.currency} {plan.amount.toFixed(2)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">/{plan.interval}</span>
                    </div>
                    {plan.features.length > 0 && (
                      <ul className="space-y-2 mb-6 flex-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={() => subscribeMutation.mutate(plan._id)}
                      disabled={subscribeMutation.isPending}
                      className="btn-primary w-full mt-auto"
                    >
                      {subscribeMutation.isPending ? 'Joining...' : 'Join Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plans.length === 0 && (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No membership plans available yet. Contact your admin.</p>
            </div>
          )}
        </div>
      ) : (
        /* ─── Active / Lapsed Membership ─── */
        <div className="space-y-8">
          {/* Membership Card */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {membership.plan?.name || 'Membership'}
                  </h2>
                  {(() => {
                    const s = statusConfig[membership.status] || statusConfig.pending;
                    const Icon = s.icon;
                    return (
                      <span className={`badge ${s.color}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {s.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Member #{membership.memberNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {membership.plan?.currency} {membership.plan?.amount?.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">/{membership.plan?.interval}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {new Date(membership.joinDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Next Due</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {membership.nextDueDate
                    ? new Date(membership.nextDueDate).toLocaleDateString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Payment</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {membership.lastPaymentDate
                    ? new Date(membership.lastPaymentDate).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {(membership.status as string) !== 'cancelled' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel your membership?')) {
                      cancelMutation.mutate();
                    }
                  }}
                  className="btn-ghost text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Cancel Membership
                </button>
              )}
            </div>
          </div>

          {/* Dues History */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment History</h2>
            {loadingDues ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 skeleton" />
                ))}
              </div>
            ) : dues.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <FiCalendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No payment records yet.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-surface-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Period</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Amount</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Paid Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {dues.map((d) => {
                        const ds = duesStatusConfig[d.status] || duesStatusConfig.pending;
                        return (
                          <tr key={d._id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {new Date(d.periodStart).toLocaleDateString()} – {new Date(d.periodEnd).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                              {d.currency} {d.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${ds.color}`}>{ds.label}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              {d.paidDate ? new Date(d.paidDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                              {d.paymentMethod.replace('_', ' ')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
