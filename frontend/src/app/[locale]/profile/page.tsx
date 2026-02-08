'use client';

import React from 'react';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { FiUser, FiMapPin, FiSettings, FiLock, FiPackage, FiMail, FiPhone, FiEdit2 } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-surface-800" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-surface-800 rounded-lg w-48" />
              <div className="h-4 bg-gray-200 dark:bg-surface-800 rounded-lg w-32" />
            </div>
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Profile Header */}
      <div className="glass-card p-6 md:p-8 mb-6">
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
