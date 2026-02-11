'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

export default function PreferencesPage() {
  const { user, refreshUser } = useAuth();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setCurrency(user.preferences.currency || 'USD');
      setLanguage(user.preferences.language || 'en');
    }
  }, [user]);

  const save = async () => {
    setLoading(true);
    try {
      await apiClient.put('/auth/profile', { preferences: { currency, language } });
      setMessage('Preferences saved');
      await refreshUser();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Preferences</h1>
      <label className="block">
        <span className="text-sm font-medium">Currency</span>
        <input className="mt-1 block w-full border rounded p-2" value={currency} onChange={(e) => setCurrency(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Language</span>
        <input className="mt-1 block w-full border rounded p-2" value={language} onChange={(e) => setLanguage(e.target.value)} />
      </label>

      <div className="mt-4">
        <button onClick={save} disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded">{loading ? 'Saving...' : 'Save'}</button>
      </div>

      {message && <div className="text-sm text-green-600 mt-3">{message}</div>}
    </div>
  );
}
