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
        const resp = await apiClient.get('/api/white-label/config');
        if (mounted && resp.data?.config) setData(resp.data.config);
      } catch (_) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  const handleUpload = async (file: File, kind: 'logo' | 'hero') => {
    setError(null);
    setSuccess(null);
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Unsupported image type. Use PNG, JPEG or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5MB)');
      return;
    }

    const form = new FormData();
    form.append('file', file, file.name);

    try {
      const resp = await apiClient.post('/api/white-label/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { url } = resp.data.data;
      setData((d: any) => ({ ...d, assets: { ...(d.assets || {}), [kind === 'logo' ? 'logo' : 'heroImage']: { url } } }));
      setSuccess('Uploaded');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    const form = new FormData(e.currentTarget as HTMLFormElement);

    const payload: any = {
      domain: form.get('domain'),
      contact: { email: form.get('contactEmail') },
      features: {
        delivery: !!form.get('feature_delivery'),
        pickup: !!form.get('feature_pickup'),
        reviews: !!form.get('feature_reviews'),
        wishlist: !!form.get('feature_wishlist'),
      }
    };

    // include uploaded asset URLs if present
    if (data.assets?.logo?.url) payload['branding.assets.logo.url'] = data.assets.logo.url;
    if (data.assets?.heroImage?.url) payload['branding.assets.heroImage.url'] = data.assets.heroImage.url;

    try {
      const resp = await apiClient.put('/api/white-label/config/' + (data.tenantId || ''), payload);
      if (resp.data?.config) {
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
            <div className="mt-1 space-y-2">
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')} />
                {data?.assets?.logo?.url && <img src={data.assets.logo.url} alt="logo" className="h-10" />}
              </div>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'hero')} />
                {data?.assets?.heroImage?.url && <img src={data.assets.heroImage.url} alt="hero" className="h-20" />}
              </div>
            </div>
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
            <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-600 text-white rounded">{saving ? 'Saving...' : t('common.save')}</button>
          </div>
        </form>
      )}
    </div>
  );
}