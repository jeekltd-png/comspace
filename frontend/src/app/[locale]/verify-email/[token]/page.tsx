'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiClient.get(`/auth/verify-email/${token}`);
        setMessage(resp.data?.message || 'Email verified');
        setStatus('success');
        setTimeout(() => router.push('/login'), 1500);
      } catch (err: any) {
        setMessage(err?.response?.data?.message || 'Verification failed');
        setStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Email verification</h1>
      {status === 'idle' && <div className="text-sm">Verifying...</div>}
      {message && <div className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message}</div>}
    </div>
  );
}
