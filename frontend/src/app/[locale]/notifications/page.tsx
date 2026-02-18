'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import {
  FiBell, FiPackage, FiTag, FiAlertCircle, FiInfo,
  FiCheckCircle, FiTrash2, FiCheck, FiInbox,
} from 'react-icons/fi';

// For now, notifications are generated client-side from order data
// A production system would have a dedicated notification service
interface Notification {
  id: string;
  type: 'order' | 'promo' | 'system' | 'account';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  link?: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  order: { icon: <FiPackage className="w-5 h-5" />, color: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' },
  promo: { icon: <FiTag className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  system: { icon: <FiAlertCircle className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
  account: { icon: <FiInfo className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
};

const STORAGE_KEY = 'comspace_notifications';

function getStoredNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function storeNotifications(notifs: Notification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
}

function generateDefaultNotifications(): Notification[] {
  return [
    {
      id: 'welcome',
      type: 'system',
      title: 'Welcome to ComSpace!',
      message: 'Your account is set up and ready. Start exploring our products and enjoy your shopping experience.',
      read: false,
      timestamp: new Date(),
      link: '/products',
    },
    {
      id: 'complete-profile',
      type: 'account',
      title: 'Complete your profile',
      message: 'Add your phone number and delivery address to speed up checkout.',
      read: false,
      timestamp: new Date(Date.now() - 60000),
      link: '/profile/edit',
    },
    {
      id: 'promo-launch',
      type: 'promo',
      title: 'New arrivals are here!',
      message: 'Check out the latest products added to our collection. Shop now and get free shipping on orders over $50.',
      read: false,
      timestamp: new Date(Date.now() - 3600000),
      link: '/products',
    },
  ];
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const stored = getStoredNotifications();
    if (stored.length === 0) {
      const defaults = generateDefaultNotifications();
      storeNotifications(defaults);
      setNotifications(defaults);
    } else {
      setNotifications(stored);
    }
  }, []);

  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    storeNotifications(updated);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    storeNotifications(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    storeNotifications(updated);
  };

  const clearAll = () => {
    setNotifications([]);
    storeNotifications([]);
  };

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <FiBell className="w-16 h-16 text-gray-300 dark:text-surface-600 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view notifications</h1>
        <Link href="/login" className="btn-primary mt-4">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiBell className="w-6 h-6" /> Notifications
            {unreadCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Stay updated on orders, promotions and account activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors"
            >
              <FiCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
            >
              <FiTrash2 className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 dark:bg-surface-800 rounded-xl p-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FiInbox className="w-12 h-12 text-gray-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.system;
            return (
              <div
                key={notif.id}
                className={`glass-card p-4 flex items-start gap-4 transition-all ${
                  !notif.read ? 'border-l-4 border-l-brand-500' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${
                        !notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                      {formatTime(notif.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        View →
                      </Link>
                    )}
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        <FiCheckCircle className="w-3 h-3" /> Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <FiTrash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
