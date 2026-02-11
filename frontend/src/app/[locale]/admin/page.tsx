import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
}

export default function AdminDashboard() {
  const t = useTranslations('admin');
  
  // In a real app, fetch these from API
  const stats: DashboardStats = {
    totalProducts: 5,
    totalOrders: 0,
    totalUsers: 1,
    revenue: 0
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <Link 
              href="/"
              className="text-brand-600 hover:text-brand-800"
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon="📦"
            color="blue"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="🛒"
            color="green"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="👥"
            color="purple"
          />
          <StatCard
            title="Revenue"
            value={`$${stats.revenue.toFixed(2)}`}
            icon="💰"
            color="yellow"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionButton
              href="/admin/products/new"
              icon="➕"
              title="Add Product"
              description="Create a new product"
            />
            <ActionButton
              href="/admin/orders"
              icon="📋"
              title="View Orders"
              description="Manage all orders"
            />
            <ActionButton
              href="/admin/users"
              icon="👤"
              title="Manage Users"
              description="View and edit users"
            />
            <ActionButton
              href="/admin/theme"
              icon="🎨"
              title="Theme Editor"
              description="Colors, fonts & branding"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem
              action="Product Added"
              description="Mechanical Keyboard was added to inventory"
              time="2 hours ago"
            />
            <ActivityItem
              action="Database Seeded"
              description="Sample products and users were created"
              time="3 hours ago"
            />
            <ActivityItem
              action="Newsletter Subscription"
              description="Email service configured successfully"
              time="Today"
            />
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
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
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
      className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-brand-500 hover:shadow-md transition-all"
    >
      <span className="text-3xl mr-4">{icon}</span>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </Link>
  );
}

interface ActivityItemProps {
  action: string;
  description: string;
  time: string;
}

function ActivityItem({ action, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start border-l-4 border-brand-500 pl-4 py-2">
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{action}</p>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
      <span className="text-gray-500 text-sm">{time}</span>
    </div>
  );
}
