'use client';

import React from 'react';
import FieldHelp from '@/components/FieldHelp';
import { useTranslations } from 'next-intl';

export default function ProductCreatePage() {
  const t = useTranslations();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Product</h1>
      <form className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name (English)</span>
          <input name="name_en" className="mt-1 block w-full border rounded p-2" />
          <FieldHelp text={t('product.help.description')} />
        'use client';

        import React, { useState } from 'react';
        import FieldHelp from '@/components/FieldHelp';
        import { useTranslations } from 'next-intl';
        import apiClient from '@/lib/api';

        export default function AdminProductCreate() {
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
              title: form.get('title'),
              price: Number(form.get('price')) || 0,
              description: form.get('description'),
              sku: form.get('sku'),
              category: form.get('category'),
              inventory: Number(form.get('inventory')) || 0,
            };

            try {
              const resp = await apiClient.post('/api/products', payload);
              if (resp.data?.id) {
                setSuccess('Product created');
                (e.target as HTMLFormElement).reset();
              } else {
                setError(resp.data?.message || 'Create failed');
              }
            } catch (err: any) {
              setError(err?.response?.data?.message || err?.message || 'Create error');
            } finally {
              setLoading(false);
            }
          };

          return (
            <div className="max-w-3xl mx-auto p-6">
              <h1 className="text-2xl font-bold mb-4">Create Product</h1>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-medium">{t('product.title')}</span>
                  <input name="title" required className="mt-1 block w-full border rounded p-2" />
                  <FieldHelp text={t('product.help.title')} />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">{t('product.price')}</span>
                  <input name="price" type="number" step="0.01" required className="mt-1 block w-full border rounded p-2" />
                  <FieldHelp text={t('product.help.price')} />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">{t('product.description')}</span>
                  <textarea name="description" className="mt-1 block w-full border rounded p-2" />
                  <FieldHelp text={t('product.help.description')} />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">{t('product.sku')}</span>
                  <input name="sku" className="mt-1 block w-full border rounded p-2" />
                  <FieldHelp text={t('product.help.sku')} />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">{t('product.category')}</span>
                  <input name="category" className="mt-1 block w-full border rounded p-2" />
                  <FieldHelp text={t('product.help.category')} />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">{t('product.inventory')}</span>
                  <input name="inventory" type="number" className="mt-1 block w-full border rounded p-2" />
                  <FieldHelp text={t('product.help.inventory')} />
                </label>

                {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
                {success && <div role="status" className="text-sm text-green-600">{success}</div>}

                <div className="flex justify-end">
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading ? 'Saving...' : t('common.save')}</button>
                </div>
              </form>
            </div>
          );
        }
}
