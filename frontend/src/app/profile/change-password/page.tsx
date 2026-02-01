'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      const resp = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setMessage(resp.data?.message || 'Password changed');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Change password failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Change password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Current password</span>
          <input className="mt-1 block w-full border rounded p-2" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" required />
        </label>
        <label className="block">
          <span className="text-sm font-medium">New password</span>
          <input className="mt-1 block w-full border rounded p-2" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required minLength={8} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Confirm new password</span>
          <input className="mt-1 block w-full border rounded p-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required minLength={8} />
        </label>

        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end">
          <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving...' : 'Change password'}</button>
        </div>
      </form>
    </div>
  );
}
