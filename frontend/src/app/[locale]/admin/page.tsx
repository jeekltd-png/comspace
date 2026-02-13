'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const isMerchant = user?.role === 'merchant';
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.role === 'admin1' ||
    user?.role === 'admin2';

  useEffect(() => {
    if (authLoading) return;
    const fetchStats = async () => {
      try {
        if (isAdmin) {
          const resp = await apiClient.get('/admin/stats').catch(() => null);
          if (resp?.data?.data) {
            setStats(resp.data.data);
          }
        }
      } catch {
        // Stats fetch is optional
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [authLoading, isAdmin]);

  // Merchant-only: redirect to merchant dashboard
  if (!authLoading && isMerchant && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <Link href="/" className="text-brand-600 hover:text-brand-800 dark:text-brand-400">← Back to Store</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionButton href="/admin/merchant" icon="📊" title="My Dashboard" description="View your stats & overview" />
            <ActionButton href="/admin/merchant/products" icon="📦" title="My Products" description="Manage your product listings" />
            <ActionButton href="/admin/merchant/orders" icon="📋" title="My Orders" description="View & fulfill orders" />
            <ActionButton href="/admin/merchant/profile" icon="🏪" title="My Profile" description="Edit your storefront & details" />
            <ActionButton href="/vendors" icon="🔍" title="Browse Vendors" description="See all vendors on marketplace" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
      <header className="bg-white dark:bg-surface-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <Link href="/" className="text-brand-600 hover:text-brand-800 dark:text-brand-400">← Back to Store</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Products" value={loading ? '...' : stats.totalProducts} icon="📦" color="blue" />
          <StatCard title="Total Orders" value={loading ? '...' : stats.totalOrders} icon="🛒" color="green" />
          <StatCard title="Total Users" value={loading ? '...' : stats.totalUsers} icon="👥" color="purple" />
          <StatCard title="Revenue" value={loading ? '...' : `$${stats.revenue.toFixed(2)}`} icon="💰" color="yellow" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionButton href="/admin/products/new" icon="➕" title="Add Product" description="Create a new product" />
            <ActionButton href="/admin/orders" icon="📋" title="View Orders" description="Manage all orders" />
            <ActionButton href="/admin/vendors" icon="🏪" title="Manage Vendors" description="Approve & manage vendors" />
            <ActionButton href="/admin/theme" icon="🎨" title="Theme Editor" description="Colors, fonts & branding" />
            <ActionButton href="/admin/analytics" icon="📈" title="Analytics" description="View site analytics" />
            <ActionButton href="/admin/members" icon="👥" title="Members" description="Manage members & dues" />
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`${colorClasses[color]} w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

function ActionButton({ href, icon, title, description }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="flex items-start p-4 border-2 border-gray-200 dark:border-surface-700 rounded-2xl hover:border-brand-500 hover:shadow-md transition-all bg-white dark:bg-surface-900"
    >
      <span className="text-3xl mr-4">{icon}</span>
      <div>
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
      </div>
    </Link>
  );
}
