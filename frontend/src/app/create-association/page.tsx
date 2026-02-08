'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import apiClient from '@/lib/api';
import Link from 'next/link';
import {
  FiUsers,
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
  FiGlobe,
  FiDollarSign,
  FiShield,
  FiZap,
  FiHeart,
  FiStar,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const STEPS = ['About Your Association', 'Membership Plans', 'Branding', 'Review & Launch'];

interface AssociationForm {
  name: string;
  slug: string;
  description: string;
  category: string;
  contactEmail: string;
  website: string;
  plans: Array<{
    name: string;
    description: string;
    amount: string;
    interval: 'monthly' | 'quarterly' | 'yearly';
    features: string;
  }>;
  branding: {
    primaryColor: string;
    logo: string;
    tagline: string;
  };
}

export default function CreateAssociationPage() {
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState(false);
  const [form, setForm] = useState<AssociationForm>({
    name: '',
    slug: '',
    description: '',
    category: '',
    contactEmail: '',
    website: '',
    plans: [
      { name: 'Basic', description: 'Standard membership', amount: '25', interval: 'monthly', features: '' },
    ],
    branding: { primaryColor: '#7c3aed', logo: '', tagline: '' },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      // Step 1: Create the tenant / white-label instance
      const tenantRes = await apiClient.post(
        '/tenants',
        {
          name: form.name,
          slug: form.slug,
          description: form.description,
          category: form.category,
          contactEmail: form.contactEmail,
          website: form.website,
          branding: form.branding,
        },
        { headers }
      );
      const tenantId = tenantRes.data.data?.tenant?._id || tenantRes.data.data?._id;

      // Step 2: Create membership plans under this tenant
      const tenantHeaders = { ...headers, 'X-Tenant-ID': tenantId };
      for (const plan of form.plans) {
        if (plan.name && plan.amount) {
          await apiClient.post(
            '/membership/plans',
            {
              name: plan.name,
              description: plan.description,
              amount: parseFloat(plan.amount),
              currency: 'USD',
              interval: plan.interval,
              features: plan.features.split(',').map((f) => f.trim()).filter(Boolean),
            },
            { headers: tenantHeaders }
          );
        }
      }
      return { tenantId };
    },
    onSuccess: () => {
      setCreated(true);
      toast.success('Association created successfully! 🎉');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create association'),
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addPlan = () =>
    setForm((prev) => ({
      ...prev,
      plans: [...prev.plans, { name: '', description: '', amount: '', interval: 'monthly', features: '' }],
    }));

  const updatePlan = (idx: number, field: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      plans: prev.plans.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    }));

  const removePlan = (idx: number) =>
    setForm((prev) => ({ ...prev, plans: prev.plans.filter((_, i) => i !== idx) }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <FiShield className="w-12 h-12 text-brand-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Please sign in to create your association.
          </p>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-lg">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {form.name} is Live! 🎉
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your association has been created. Share your link with members so they can register and
            start paying dues.
          </p>
          <div className="bg-gray-50 dark:bg-surface-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your association URL</p>
            <p className="text-brand-600 dark:text-brand-400 font-mono font-semibold">
              {form.slug}.comspace.app
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/admin/members" className="btn-primary">
              Manage Members
            </Link>
            <Link href="/admin/dues" className="btn-ghost">
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-surface-900 dark:to-surface-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-4">
            <FiZap className="w-4 h-4" /> Create in 5 minutes
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Launch Your Association
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Set up your white-label space, define dues, and start collecting from members
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i <= step
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-200 dark:bg-surface-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {i < step ? <FiCheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-16 lg:w-24 h-0.5 mx-1 transition-all ${
                    i < step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-surface-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{STEPS[step]}</h2>

          {/* Step 0: About */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Association Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    updateField('name', e.target.value);
                    updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="input-field"
                  placeholder="e.g. Lagos Entrepreneurs Club"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    className="input-field"
                    placeholder="lagos-entrepreneurs-club"
                  />
                  <span className="text-sm text-gray-400 whitespace-nowrap">.comspace.app</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="What is your association about?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select...</option>
                    <option value="professional">Professional Association</option>
                    <option value="community">Community Group</option>
                    <option value="alumni">Alumni Association</option>
                    <option value="religious">Religious Organization</option>
                    <option value="sports">Sports Club</option>
                    <option value="cultural">Cultural Society</option>
                    <option value="trade">Trade Union</option>
                    <option value="cooperative">Cooperative</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    className="input-field"
                    placeholder="admin@club.org"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Plans */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define the membership tiers your members can subscribe to. You can add more later.
              </p>
              {form.plans.map((plan, i) => (
                <div
                  key={i}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FiStar className="w-4 h-4 text-brand-500" />
                      Plan {i + 1}
                    </h3>
                    {form.plans.length > 1 && (
                      <button
                        onClick={() => removePlan(i)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Plan Name
                      </label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => updatePlan(i, 'name', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Amount (USD)
                      </label>
                      <input
                        type="number"
                        value={plan.amount}
                        onChange={(e) => updatePlan(i, 'amount', e.target.value)}
                        className="input-field"
                        placeholder="25.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Billing Interval
                    </label>
                    <select
                      value={plan.interval}
                      onChange={(e) => updatePlan(i, 'interval', e.target.value)}
                      className="input-field"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={plan.description}
                      onChange={(e) => updatePlan(i, 'description', e.target.value)}
                      className="input-field"
                      placeholder="Short description of this tier"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Features (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={plan.features}
                      onChange={(e) => updatePlan(i, 'features', e.target.value)}
                      className="input-field"
                      placeholder="Access to events, Newsletter, Voting rights"
                    />
                  </div>
                </div>
              ))}
              <button onClick={addPlan} className="btn-ghost w-full flex items-center justify-center gap-2">
                + Add Another Plan
              </button>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize the look of your association's space. Members will see your brand, not ours.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.branding.primaryColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, primaryColor: e.target.value },
                      }))
                    }
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={form.branding.primaryColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        branding: { ...prev.branding, primaryColor: e.target.value },
                      }))
                    }
                    className="input-field w-32"
                  />
                  <div
                    className="flex-1 h-12 rounded-lg"
                    style={{ backgroundColor: form.branding.primaryColor }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={form.branding.tagline}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, tagline: e.target.value },
                    }))
                  }
                  className="input-field"
                  placeholder="Building the future, together"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logo URL (optional)
                </label>
                <input
                  type="url"
                  value={form.branding.logo}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, logo: e.target.value },
                    }))
                  }
                  className="input-field"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="mt-6 glass-card p-6 border-2 border-dashed border-brand-200 dark:border-brand-800">
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Preview</p>
                <div
                  className="h-2 rounded-full mb-4"
                  style={{ backgroundColor: form.branding.primaryColor }}
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{form.name || 'Your Association'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {form.branding.tagline || 'Your tagline here'}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-surface-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FiGlobe className="w-3 h-3" /> Association
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">{form.name}</p>
                  <p className="text-sm text-brand-600 dark:text-brand-400">{form.slug}.comspace.app</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{form.category || 'No category'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-surface-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FiHeart className="w-3 h-3" /> Branding
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: form.branding.primaryColor }}
                    />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {form.branding.primaryColor}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{form.branding.tagline || 'No tagline'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <FiDollarSign className="w-3 h-3" /> Membership Plans ({form.plans.length})
                </p>
                <div className="space-y-2">
                  {form.plans.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 dark:bg-surface-800 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">{p.description}</p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        ${p.amount}/{p.interval}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 text-sm text-brand-800 dark:text-brand-200">
                <p className="font-medium mb-1">Ready to launch?</p>
                <p>
                  This will create your association space and membership plans. You can always edit
                  settings later from the admin panel.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="btn-ghost flex items-center gap-2">
                <FiArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && !form.name}
                className="btn-primary flex items-center gap-2"
              >
                Next <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.name}
                className="btn-primary flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  'Creating...'
                ) : (
                  <>
                    Launch Association <FiZap className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
