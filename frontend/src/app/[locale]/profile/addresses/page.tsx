'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { FiArrowLeft, FiMapPin, FiPlus, FiTrash2, FiSave, FiCheckCircle, FiStar } from 'react-icons/fi';

interface Address {
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { user, refreshUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setAddresses(user?.addresses || []);
  }, [user]);

  const addAddress = () => {
    setAddresses([...addresses, { label: '', street: '', city: '', state: '', country: '', postalCode: '', isDefault: false }]);
  };

  const updateAt = (idx: number, key: keyof Address, value: string | boolean) => {
    const copy = [...addresses];
    if (key === 'isDefault' && value === true) {
      copy.forEach((a, i) => { a.isDefault = i === idx; });
    } else {
      (copy[idx] as any)[key] = value;
    }
    setAddresses(copy);
  };

  const removeAt = (idx: number) => {
    const copy = [...addresses];
    copy.splice(idx, 1);
    setAddresses(copy);
  };

  const save = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await apiClient.put('/auth/profile', { addresses });
      setMessage({ type: 'success', text: 'Addresses saved successfully' });
      await refreshUser();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Save failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 mb-6">
        <FiArrowLeft className="w-4 h-4" /> Back to Profile
      </Link>

      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FiMapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Addresses</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your delivery addresses</p>
            </div>
          </div>
          <button
            onClick={addAddress}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-xl transition-colors"
          >
            <FiPlus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="space-y-4">
          {addresses.length === 0 && (
            <div className="text-center py-8">
              <FiMapPin className="w-10 h-10 text-gray-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No addresses saved yet</p>
            </div>
          )}
          {addresses.map((a, i) => (
            <div key={i} className="bg-gray-50 dark:bg-surface-800 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-surface-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent w-40"
                    value={a.label}
                    onChange={(e) => updateAt(i, 'label', e.target.value)}
                    placeholder="Label (e.g. Home)"
                  />
                  <button
                    onClick={() => updateAt(i, 'isDefault', true)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      a.isDefault
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                    }`}
                    title="Set as default"
                  >
                    <FiStar className="w-3.5 h-3.5" />
                    {a.isDefault ? 'Default' : 'Set default'}
                  </button>
                </div>
                <button
                  onClick={() => removeAt(i)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove address"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                value={a.street}
                onChange={(e) => updateAt(i, 'street', e.target.value)}
                placeholder="Street address"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={a.city}
                  onChange={(e) => updateAt(i, 'city', e.target.value)}
                  placeholder="City"
                />
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={a.state}
                  onChange={(e) => updateAt(i, 'state', e.target.value)}
                  placeholder="State/Province"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={a.country}
                  onChange={(e) => updateAt(i, 'country', e.target.value)}
                  placeholder="Country"
                />
                <input
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={a.postalCode}
                  onChange={(e) => updateAt(i, 'postalCode', e.target.value)}
                  placeholder="Postal code"
                />
              </div>
            </div>
          ))}

          {addresses.length > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={save}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <FiSave className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Addresses'}
              </button>
            </div>
          )}

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
    </div>
  );
}
