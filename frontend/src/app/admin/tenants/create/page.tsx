'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { FiArrowLeft, FiSave, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreateTenantPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tenantId: '',
    name: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    primaryColor: '#6C63FF',
    secondaryColor: '#10B981',
    accentColor: '#ec4899',
    fontFamily: 'Inter, sans-serif',
    // Features (all on by default)
    products: true,
    pricing: true,
    cart: true,
    checkout: true,
    delivery: true,
    pickup: true,
    reviews: true,
    wishlist: true,
    chat: false,
    socialLogin: true,
    // SEO
    seoTitle: '',
    seoDescription: '',
    // Payment
    currencies: 'USD',
    paymentMethods: 'card',
  });

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId || !form.name || !form.domain || !form.contactEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/admin/tenants', {
        tenantId: form.tenantId.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: form.name,
        domain: form.domain,
        branding: {
          logo: '/images/logo.png',
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          accentColor: form.accentColor,
          fontFamily: form.fontFamily,
        },
        features: {
          products: form.products,
          pricing: form.pricing,
          cart: form.cart,
          checkout: form.checkout,
          delivery: form.delivery,
          pickup: form.pickup,
          reviews: form.reviews,
          wishlist: form.wishlist,
          chat: form.chat,
          socialLogin: form.socialLogin,
        },
        contact: {
          email: form.contactEmail,
          phone: form.contactPhone,
          address: form.contactAddress,
        },
        payment: {
          supportedMethods: form.paymentMethods.split(',').map((s) => s.trim()).filter(Boolean),
          currencies: form.currencies.split(',').map((s) => s.trim()).filter(Boolean),
        },
        seo: {
          title: form.seoTitle || form.name,
          description: form.seoDescription,
        },
      });
      toast.success('Tenant created successfully!');
      router.push('/admin/tenants');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create tenant');
    } finally {
      setSaving(false);
    }
  };

  if (!authLoading && user?.role !== 'superadmin') {
    return (
      <div className="p-8 text-center">
        <FiShield className="mx-auto w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400">Only super administrators can create tenants.</p>
      </div>
    );
  }

  const featureFlags = [
    { key: 'products', label: 'Products' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'cart', label: 'Cart' },
    { key: 'checkout', label: 'Checkout' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'pickup', label: 'Pickup' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'chat', label: 'Live Chat' },
    { key: 'socialLogin', label: 'Social Login' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/admin/tenants" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 transition-colors">
        <FiArrowLeft className="w-4 h-4" /> Back to tenants
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Tenant</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tenant ID *" hint="Unique slug (e.g. acme-corp)">
              <input
                type="text"
                value={form.tenantId}
                onChange={(e) => updateField('tenantId', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="my-tenant"
                className="input-field"
                required
              />
            </Field>
            <Field label="Display Name *">
              <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="My Awesome Store" className="input-field" required />
            </Field>
            <Field label="Domain *" hint="Where this tenant is hosted">
              <input type="text" value={form.domain} onChange={(e) => updateField('domain', e.target.value)} placeholder="mystore.localhost:3000" className="input-field" required />
            </Field>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email *">
              <input type="email" value={form.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} placeholder="hello@company.com" className="input-field" required />
            </Field>
            <Field label="Phone">
              <input type="text" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} placeholder="+1-555-000-0000" className="input-field" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input type="text" value={form.contactAddress} onChange={(e) => updateField('contactAddress', e.target.value)} placeholder="123 Main St, City, State 12345" className="input-field" />
            </Field>
          </div>
        </Section>

        {/* Branding */}
        <Section title="Branding">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Primary">
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={(e) => updateField('primaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-surface-700 cursor-pointer" />
                <code className="text-xs text-gray-500">{form.primaryColor}</code>
              </div>
            </Field>
            <Field label="Secondary">
              <div className="flex items-center gap-2">
                <input type="color" value={form.secondaryColor} onChange={(e) => updateField('secondaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-surface-700 cursor-pointer" />
                <code className="text-xs text-gray-500">{form.secondaryColor}</code>
              </div>
            </Field>
            <Field label="Accent">
              <div className="flex items-center gap-2">
                <input type="color" value={form.accentColor} onChange={(e) => updateField('accentColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-surface-700 cursor-pointer" />
                <code className="text-xs text-gray-500">{form.accentColor}</code>
              </div>
            </Field>
            <Field label="Font">
              <select value={form.fontFamily} onChange={(e) => updateField('fontFamily', e.target.value)} className="input-field">
                <option value="Inter, sans-serif">Inter</option>
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Nunito, sans-serif">Nunito</option>
                <option value="system-ui, sans-serif">System UI</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Feature Flags */}
        <Section title="Features">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {featureFlags.map(({ key, label }) => (
              <label
                key={key}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                  (form as any)[key]
                    ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10'
                    : 'border-gray-200 bg-gray-50 dark:border-surface-700 dark:bg-surface-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={(form as any)[key]}
                  onChange={(e) => updateField(key, e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Payment & SEO */}
        <Section title="Payment & SEO">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Currencies" hint="Comma-separated (e.g. USD,EUR)">
              <input type="text" value={form.currencies} onChange={(e) => updateField('currencies', e.target.value)} className="input-field" />
            </Field>
            <Field label="Payment Methods" hint="Comma-separated">
              <input type="text" value={form.paymentMethods} onChange={(e) => updateField('paymentMethods', e.target.value)} className="input-field" />
            </Field>
            <Field label="SEO Title">
              <input type="text" value={form.seoTitle} onChange={(e) => updateField('seoTitle', e.target.value)} placeholder={form.name} className="input-field" />
            </Field>
            <Field label="SEO Description">
              <input type="text" value={form.seoDescription} onChange={(e) => updateField('seoDescription', e.target.value)} placeholder="A brief description…" className="input-field" />
            </Field>
          </div>
        </Section>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-surface-700">
          <Link href="/admin/tenants" className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm shadow-brand disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" /> {saving ? 'Creating…' : 'Create Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {hint && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
