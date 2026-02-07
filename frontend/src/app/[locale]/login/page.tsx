'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import apiClient from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await apiClient.post('/auth/login', { email, password });
      const { token, refreshToken } = resp.data.data;
      await login(token, refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" className="mt-1 block w-full border rounded p-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input name="password" className="mt-1 block w-full border rounded p-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-between items-center">
          <a className="text-sm text-blue-600" href="/forgot-password">Forgot password?</a>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Signing in...' : 'Sign in'}</button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <span>No account? </span>
          <a href="/register" className="text-blue-600">Create an account</a>
        </div>
      </form>
    </div>
  );
}
