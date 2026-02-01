'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const resp = await apiClient.post(`/auth/reset/${token}`, { password });
      setMessage(resp.data?.message || 'Password reset');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">New password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border rounded p-2" type="password" required minLength={8} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Confirm password</span>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 block w-full border rounded p-2" type="password" required minLength={8} />
        </label>

        {message && <div className="text-sm text-green-600">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end">
          <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Resetting...' : 'Reset password'}</button>
        </div>
      </form>
    </div>
  );
}
