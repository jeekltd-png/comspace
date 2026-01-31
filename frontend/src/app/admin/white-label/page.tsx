'use client';

import React, { useEffect, useState } from 'react';
import FieldHelp from '@/components/FieldHelp';
import { useTranslations } from 'next-intl';
import apiClient from '@/lib/api';

export default function WhiteLabelSettingsPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<any>({ logo: '', domain: '', contactEmail: '', features: {} });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await apiClient.get('/api/white-label');
        if (mounted && resp.data) setData(resp.data);
      } catch (_) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      logo: form.get('logo'),
      domain: form.get('domain'),
      contactEmail: form.get('contactEmail'),
      features: {
        delivery: !!form.get('feature_delivery'),
        pickup: !!form.get('feature_pickup'),
        reviews: !!form.get('feature_reviews'),
        wishlist: !!form.get('feature_wishlist'),
      }
    };

    try {
      const resp = await apiClient.put('/api/white-label', payload);
      if (resp.data?.tenantId) {
        setSuccess('Saved');
      } else {
        setError(resp.data?.message || 'Save failed');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Save error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">White Label Settings</h1>
      {loading ? <div>Loading…</div> : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">{t('whiteLabel.branding')}</span>
            <input name="logo" placeholder="https://cdn.yoursite.com/logo.png" defaultValue={data.logo || ''} className="mt-1 block w-full border rounded p-2" />
            <FieldHelp text={t('whiteLabel.help.branding')} />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t('whiteLabel.domain')}</span>
            <input name="domain" placeholder="yourstore.com" defaultValue={data.domain || ''} className="mt-1 block w-full border rounded p-2" />
            <FieldHelp text={t('whiteLabel.help.domain')} />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t('whiteLabel.contactEmail')}</span>
            <input name="contactEmail" placeholder="support@yourstore.com" defaultValue={data.contactEmail || ''} className="mt-1 block w-full border rounded p-2" />
            <FieldHelp text={t('whiteLabel.help.contactEmail')} />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t('whiteLabel.features')}</span>
            <div className="mt-1 space-y-1">
              <label className="flex items-center gap-2"><input name="feature_delivery" defaultChecked={!!data.features?.delivery} type="checkbox" /> Delivery</label>
              <label className="flex items-center gap-2"><input name="feature_pickup" defaultChecked={!!data.features?.pickup} type="checkbox" /> Pickup</label>
              <label className="flex items-center gap-2"><input name="feature_reviews" defaultChecked={!!data.features?.reviews} type="checkbox" /> Reviews</label>
              <label className="flex items-center gap-2"><input name="feature_wishlist" defaultChecked={!!data.features?.wishlist} type="checkbox" /> Wishlist</label>
            </div>
            <FieldHelp text={t('whiteLabel.help.features')} />
          </label>

          {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
          {success && <div role="status" className="text-sm text-green-600">{success}</div>}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Saving...' : t('common.save')}</button>
          </div>
        </form>
      )}
    </div>
  );
}
