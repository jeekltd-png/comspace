'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

export default function ProfileEditPage() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put('/auth/profile', { firstName, lastName, phone });
      setMessage('Profile updated');
      await refreshUser();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">First name</span>
          <input className="mt-1 block w-full border rounded p-2" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Last name</span>
          <input className="mt-1 block w-full border rounded p-2" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Phone</span>
          <input className="mt-1 block w-full border rounded p-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        {message && <div className="text-sm text-green-600">{message}</div>}

        <div className="flex justify-end">
          <button disabled={loading} type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
