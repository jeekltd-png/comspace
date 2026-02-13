'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface VendorFormData {
  storeName: string;
  description: string;
  shortDescription: string;
  contactEmail: string;
  contactPhone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  addressPostalCode: string;
  website: string;
  facebook: string;
  instagram: string;
  twitter: string;
  returnPolicy: string;
  shippingPolicy: string;
}

export default function MerchantProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormData>();

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'merchant') {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const resp = await apiClient.get('/vendors/me');
        const vendor = resp.data.data.vendor;
        setExistingProfile(vendor);

        if (vendor) {
          reset({
            storeName: vendor.storeName || '',
            description: vendor.description || '',
            shortDescription: vendor.shortDescription || '',
            contactEmail: vendor.contactEmail || user.email || '',
            contactPhone: vendor.contactPhone || '',
            addressStreet: vendor.address?.street || '',
            addressCity: vendor.address?.city || '',
            addressState: vendor.address?.state || '',
            addressCountry: vendor.address?.country || '',
            addressPostalCode: vendor.address?.postalCode || '',
            website: vendor.socialLinks?.website || '',
            facebook: vendor.socialLinks?.facebook || '',
            instagram: vendor.socialLinks?.instagram || '',
            twitter: vendor.socialLinks?.twitter || '',
            returnPolicy: vendor.policies?.returnPolicy || '',
            shippingPolicy: vendor.policies?.shippingPolicy || '',
          });
        } else {
          reset({ contactEmail: user.email || '' });
        }
      } catch (err) {
        console.error('Failed to load vendor profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, reset]);

  const onSubmit = async (data: VendorFormData) => {
    setSaving(true);
    setMessage(null);

    const payload = {
      storeName: data.storeName,
      description: data.description,
      shortDescription: data.shortDescription,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      address: {
        street: data.addressStreet,
        city: data.addressCity,
        state: data.addressState,
        country: data.addressCountry,
        postalCode: data.addressPostalCode,
      },
      socialLinks: {
        website: data.website || undefined,
        facebook: data.facebook || undefined,
        instagram: data.instagram || undefined,
        twitter: data.twitter || undefined,
      },
      policies: {
        returnPolicy: data.returnPolicy || undefined,
        shippingPolicy: data.shippingPolicy || undefined,
      },
    };

    try {
      if (existingProfile) {
        const resp = await apiClient.put('/vendors/me', payload);
        setExistingProfile(resp.data.data.vendor);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        const resp = await apiClient.post('/vendors/me', payload);
        setExistingProfile(resp.data.data.vendor);
        setMessage({ type: 'success', text: 'Vendor profile created! It will be reviewed by an admin.' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save profile',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded w-1/3" />
          <div className="h-96 bg-gray-200 dark:bg-surface-700 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!user || user.role !== 'merchant') {
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">Merchant access required</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {existingProfile ? 'Edit Profile' : 'Create Your Profile'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {existingProfile
              ? `Your store: ${existingProfile.storeName}`
              : 'Set up your presence on ComSpace'}
          </p>
        </div>
        <Link
          href="/admin/merchant"
          className="text-brand-600 dark:text-brand-400 hover:underline text-sm"
        >
          ← Dashboard
        </Link>
      </div>

      {existingProfile && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            existingProfile.isApproved
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}
        >
          {existingProfile.isApproved
            ? '✅ Your vendor profile is approved. Your products are visible to buyers.'
            : '⏳ Your vendor profile is pending approval. Products won\'t be visible until approved.'}
        </div>
      )}

      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-6 space-y-6"
      >
        {/* Store Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Store Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('storeName', { required: 'Store name is required' })}
            className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="e.g. Anna's Artisan Goods"
          />
          {errors.storeName && (
            <p className="text-xs text-red-500 mt-1">{errors.storeName.message}</p>
          )}
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Short Description
          </label>
          <input
            {...register('shortDescription')}
            className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="Brief tagline for your store"
            maxLength={300}
          />
        </div>

        {/* Full Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="Tell buyers about your store, products, and values..."
          />
        </div>

        {/* Contact */}
        <div className="border-t border-gray-200 dark:border-surface-700 pt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                {...register('contactEmail')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="store@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone
              </label>
              <input
                {...register('contactPhone')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border-t border-gray-200 dark:border-surface-700 pt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Address</h3>
          <div className="space-y-4">
            <input
              {...register('addressStreet')}
              className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Street address"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                {...register('addressCity')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="City"
              />
              <input
                {...register('addressState')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="State"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                {...register('addressCountry')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Country"
              />
              <input
                {...register('addressPostalCode')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Postal Code"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-200 dark:border-surface-700 pt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Website
              </label>
              <input
                {...register('website')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="https://yourstore.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Instagram
              </label>
              <input
                {...register('instagram')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="https://instagram.com/yourstore"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Facebook
              </label>
              <input
                {...register('facebook')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="https://facebook.com/yourstore"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Twitter
              </label>
              <input
                {...register('twitter')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="https://twitter.com/yourstore"
              />
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="border-t border-gray-200 dark:border-surface-700 pt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Store Policies</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Return Policy
              </label>
              <textarea
                {...register('returnPolicy')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Describe your return and refund policy..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Shipping Policy
              </label>
              <textarea
                {...register('shippingPolicy')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Describe your shipping times, costs, and regions..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/merchant"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : existingProfile
              ? 'Update Profile'
              : 'Create Profile'}
          </button>
        </div>
      </form>
    </main>
  );
}
