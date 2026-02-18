'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { FiArrowLeft, FiSettings, FiSave, FiCheckCircle, FiGlobe, FiDollarSign, FiBell } from 'react-icons/fi';

const CURRENCIES = [
  { value: 'USD', label: '🇺🇸 USD — US Dollar' },
  { value: 'EUR', label: '🇪🇺 EUR — Euro' },
  { value: 'GBP', label: '🇬🇧 GBP — British Pound' },
  { value: 'CAD', label: '🇨🇦 CAD — Canadian Dollar' },
  { value: 'AUD', label: '🇦🇺 AUD — Australian Dollar' },
  { value: 'JPY', label: '🇯🇵 JPY — Japanese Yen' },
  { value: 'CHF', label: '🇨🇭 CHF — Swiss Franc' },
  { value: 'INR', label: '🇮🇳 INR — Indian Rupee' },
  { value: 'CNY', label: '🇨🇳 CNY — Chinese Yuan' },
  { value: 'BRL', label: '🇧🇷 BRL — Brazilian Real' },
  { value: 'ZAR', label: '🇿🇦 ZAR — South African Rand' },
  { value: 'NGN', label: '🇳🇬 NGN — Nigerian Naira' },
  { value: 'KES', label: '🇰🇪 KES — Kenyan Shilling' },
];

const LANGUAGES = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'pt', label: '🇧🇷 Português' },
  { value: 'zh', label: '🇨🇳 中文' },
  { value: 'ja', label: '🇯🇵 日本語' },
  { value: 'ar', label: '🇸🇦 العربية' },
  { value: 'hi', label: '🇮🇳 हिन्दी' },
  { value: 'sw', label: '🇰🇪 Kiswahili' },
];

export default function PreferencesPage() {
  const { user, refreshUser } = useAuth();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setCurrency(user.preferences.currency || 'USD');
      setLanguage(user.preferences.language || 'en');
      const notifs = (user.preferences as any).notifications;
      if (notifs) {
        setEmailNotifications(notifs.email !== false);
        setOrderUpdates(notifs.push !== false);
      }
    }
  }, [user]);

  const save = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await apiClient.put('/auth/profile', {
        preferences: { currency, language, emailNotifications, orderUpdates }
      });
      setMessage({ type: 'success', text: 'Preferences saved successfully' });
      await refreshUser();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Save failed' });
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "mt-1.5 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors appearance-none";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 mb-6">
        <FiArrowLeft className="w-4 h-4" /> Back to Profile
      </Link>

      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <FiSettings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Preferences</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Customize your shopping experience</p>
          </div>
        </div>

        {/* Currency & Language */}
        <div className="space-y-5 pt-2">
          <div className="pb-3 border-b border-gray-100 dark:border-surface-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiGlobe className="w-4 h-4 text-gray-400" /> Regional
            </h3>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <FiDollarSign className="w-3.5 h-3.5" /> Currency
            </span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectClass}>
              {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <FiGlobe className="w-3.5 h-3.5" /> Language
            </span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClass}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-surface-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiBell className="w-4 h-4 text-gray-400" /> Notifications
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive promotional emails and updates</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? 'bg-brand-600' : 'bg-gray-300 dark:bg-surface-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Order Updates</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about order status changes</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={orderUpdates}
              onClick={() => setOrderUpdates(!orderUpdates)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                orderUpdates ? 'bg-brand-600' : 'bg-gray-300 dark:bg-surface-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                orderUpdates ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <FiSave className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' && <FiCheckCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
