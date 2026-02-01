'use client';

import React, { useState } from 'react';
import FieldHelp from '@/components/FieldHelp';
import { useTranslations } from 'next-intl';
import apiClient from '@/lib/api';

export default function RegisterPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const form = new FormData(e.currentTarget as HTMLFormElement);
    const payload: any = {
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      email: form.get('email'),
      password: form.get('password'),
      confirmPassword: form.get('confirmPassword'),
      phone: form.get('phone'),
      isBusiness: false,
    };

    try {
      const resp = await apiClient.post('/auth/register', payload);
      if (resp.data?.success) {
        setSuccess('Account created — please check your email to verify.');
        (e.target as HTMLFormElement).reset();
      } else {
        setError(resp.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create an account</h1>
      <form className="space-y-4" onSubmit={handleSubmit} aria-labelledby="register-form">
        <div id="register-form" className="sr-only">Registration form</div>

        <label className="block">
          <span className="text-sm font-medium">{t('auth.firstName')}</span>
          <input aria-label={t('auth.firstName')} name="firstName" required className="mt-1 block w-full border rounded p-2" />
          <FieldHelp text={t('auth.help.firstName')} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('auth.lastName')}</span>
          <input aria-label={t('auth.lastName')} name="lastName" required className="mt-1 block w-full border rounded p-2" />
          <FieldHelp text={t('auth.help.lastName')} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('auth.email')}</span>
          <input aria-label={t('auth.email')} name="email" type="email" required className="mt-1 block w-full border rounded p-2" />
          <FieldHelp text={t('auth.help.email')} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('auth.password')}</span>
          <input aria-label={t('auth.password')} name="password" type="password" required minLength={8} className="mt-1 block w-full border rounded p-2" />
          <FieldHelp text={t('auth.help.password')} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('auth.confirmPassword')}</span>
          <input aria-label={t('auth.confirmPassword')} name="confirmPassword" type="password" required minLength={8} className="mt-1 block w-full border rounded p-2" />
          <FieldHelp text={t('auth.help.confirmPassword')} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('auth.phone')}</span>
          <input aria-label={t('auth.phone')} name="phone" className="mt-1 block w-full border rounded p-2" />
          <FieldHelp text={t('auth.help.phone')} />
        </label>

        {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
        {success && <div role="status" className="text-sm text-green-600">{success}</div>}

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded" aria-busy={loading}>{loading ? 'Creating...' : t('common.save')}</button>
        </div>
      </form>
    </div>
  );
}