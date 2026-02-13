'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  totalRevenue: number;
  totalItemsSold: number;
  orderCount: number;
  lowStockProducts: Array<{ name: string; stock: number; lowStockThreshold: number }>;
}

interface VendorProfile {
  _id: string;
  storeName: string;
  slug: string;
  description?: string;
  profileType?: 'seller' | 'showcase';
  isApproved: boolean;
  isActive: boolean;
}

export default function MerchantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'merchant') {
      setError('Access denied — merchant role required');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [statsResp, profileResp] = await Promise.all([
          apiClient.get('/vendors/me/stats'),
          apiClient.get('/vendors/me'),
        ]);
        setStats(statsResp.data.data);
        setProfile(profileResp.data.data.vendor);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-surface-700 rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <Link href="/" className="text-brand-600 dark:text-brand-400 hover:underline mt-2 inline-block">
            ← Back to store
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile?.profileType === 'showcase' ? 'Showcase Dashboard' : 'Merchant Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {profile ? profile.storeName : 'Set up your vendor profile to get started'}
          </p>
        </div>
        <Link href="/" className="text-brand-600 dark:text-brand-400 hover:underline text-sm">
          ← Back to Store
        </Link>
      </div>

      {/* Profile status banner */}
      {!profile && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">Welcome, {user?.firstName}!</h3>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            You need to create your profile before you can get started.
          </p>
          <Link
            href="/admin/merchant/profile"
            className="mt-3 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Profile →
          </Link>
        </div>
      )}

      {profile?.profileType === 'showcase' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-purple-800 dark:text-purple-300">🏪 Showcase Mode</h3>
          <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
            Your profile is set up as a showcase — visitors can see your services & contact info.
            When you&apos;re ready to sell, you can upgrade to a full seller profile.
          </p>
        </div>
      )}

      {profile && !profile.isApproved && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">Pending Approval</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            Your vendor profile is awaiting admin approval. Once approved, your products will be visible to buyers.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalProducts}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.activeProducts} active</p>
          </div>
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Orders</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.orderCount}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.totalItemsSold} items sold</p>
          </div>
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock</p>
            <p className={`text-3xl font-bold mt-1 ${stats.lowStockProducts.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
              {stats.lowStockProducts.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">products need restock</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/merchant/products"
          className="p-5 border border-gray-200 dark:border-surface-800 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="text-2xl mb-2">🛍️</div>
          <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            My Products
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your product catalog and inventory
          </p>
        </Link>

        <Link
          href="/admin/merchant/orders"
          className="p-5 border border-gray-200 dark:border-surface-800 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="text-2xl mb-2">📦</div>
          <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            My Orders
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View orders containing your products
          </p>
        </Link>

        <Link
          href="/admin/merchant/profile"
          className="p-5 border border-gray-200 dark:border-surface-800 rounded-2xl bg-gradient-to-br from-brand-500/10 to-purple-500/10 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="text-2xl mb-2">🏪</div>
          <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            Vendor Profile
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Edit your store details, logo, and policies
          </p>
        </Link>
      </div>

      {/* Low Stock Alert */}
      {stats && stats.lowStockProducts.length > 0 && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-3">⚠️ Low Stock Alerts</h3>
          <div className="space-y-2">
            {stats.lowStockProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-surface-800 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{product.name}</span>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {product.stock} remaining (threshold: {product.lowStockThreshold})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
