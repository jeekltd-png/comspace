'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const resp = await apiClient.post('/auth/forgot-password', { email });
      setMessage(resp.data?.message || 'Requested password reset');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input className="mt-1 block w-full border rounded p-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>

        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded">{loading ? 'Sending...' : 'Send reset email'}</button>
        </div>
      </form>
    </div>
  );
}
