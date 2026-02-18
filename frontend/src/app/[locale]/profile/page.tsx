'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import apiClient from '@/lib/api';
import Link from 'next/link';
import {
  FiUser, FiMapPin, FiSettings, FiLock, FiPackage,
  FiMail, FiPhone, FiEdit2, FiHeart, FiDollarSign,
  FiClock, FiCheckCircle, FiTruck, FiShoppingBag,
} from 'react-icons/fi';

interface OrderSummary {
  total: number;
  pending: number;
  delivered: number;
  totalSpent: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ name: string }>;
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  processing: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',
  shipped: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
  delivered: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({ total: 0, pending: 0, delivered: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      setLoadingData(true);
      try {
        const [ordersRes, wishlistRes] = await Promise.all([
          apiClient.get('/orders?limit=5').catch(() => ({ data: { data: { orders: [], pagination: { total: 0 } } } })),
          apiClient.get('/wishlist').catch(() => ({ data: { data: { items: [] } } })),
        ]);

        const orders: RecentOrder[] = ordersRes.data.data.orders || [];
        const allTotal = ordersRes.data.data.pagination?.total || orders.length;
        const pending = orders.filter((o: RecentOrder) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length;
        const delivered = orders.filter((o: RecentOrder) => o.status === 'delivered').length;
        const totalSpent = orders.reduce((s: number, o: RecentOrder) => s + (o.total || 0), 0);

        setOrderSummary({ total: allTotal, pending, delivered, totalSpent });
        setRecentOrders(orders);

        const wishItems = wishlistRes.data.data?.items || wishlistRes.data.data?.wishlist || [];
        setWishlistCount(Array.isArray(wishItems) ? wishItems.length : 0);
      } catch {
        // silently fail — dashboard still shows profile
      } finally {
        setLoadingData(false);
      }
    };
    fetchDashboard();
  }, [user]);

  // Account completeness
  const getCompleteness = () => {
    if (!user) return 0;
    let score = 0;
    const total = 5;
    if (user.firstName) score++;
    if (user.lastName) score++;
    if (user.email) score++;
    if (user.phone) score++;
    if (user.addresses && user.addresses.length > 0) score++;
    return Math.round((score / total) * 100);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-surface-800" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-surface-800 rounded-lg w-48" />
              <div className="h-4 bg-gray-200 dark:bg-surface-800 rounded-lg w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-surface-800 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <FiUser className="w-16 h-16 text-gray-300 dark:text-surface-600 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view your profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Access your account settings and order history.</p>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const completeness = getCompleteness();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
      {/* Profile Header */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <FiMail className="w-4 h-4" /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <FiPhone className="w-4 h-4" /> {user.phone}
                </span>
              )}
            </div>
            {/* Account Completeness */}
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Profile {completeness}% complete</span>
                {completeness === 100 && <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />}
              </div>
              <div className="w-full max-w-xs h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${completeness === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <FiEdit2 className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {loadingData ? '—' : orderSummary.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <FiShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {loadingData ? '—' : orderSummary.pending}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <FiTruck className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Wishlist</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {loadingData ? '—' : wishlistCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FiHeart className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {loadingData ? '—' : `$${orderSummary.totalSpent.toFixed(0)}`}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiClock className="w-4 h-4 text-brand-500" /> Recent Orders
          </h2>
          <Link href="/orders" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
            View all →
          </Link>
        </div>
        {loadingData ? (
          <div className="p-6 text-center text-gray-400 animate-pulse">Loading...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <FiPackage className="w-10 h-10 text-gray-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No orders yet</p>
            <Link href="/products" className="text-brand-600 text-sm hover:underline mt-2 inline-block">
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-surface-800">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-surface-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-surface-800 flex items-center justify-center">
                    <FiPackage className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'text-gray-600 bg-gray-100'}`}>
                    {order.status?.replace(/-/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">${order.total?.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/orders" className="glass-card p-5 hover:shadow-brand transition-all group">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FiPackage className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Orders</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View order history</p>
        </Link>

        <Link href="/profile/addresses" className="glass-card p-5 hover:shadow-brand transition-all group">
          <div className="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FiMapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Addresses</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage saved addresses</p>
        </Link>

        <Link href="/profile/change-password" className="glass-card p-5 hover:shadow-brand transition-all group">
          <div className="w-10 h-10 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FiLock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Password</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Change your password</p>
        </Link>

        <Link href="/profile/preferences" className="glass-card p-5 hover:shadow-brand transition-all group">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FiSettings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Preferences</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Language & notifications</p>
        </Link>
      </div>
    </div>
  );
}
