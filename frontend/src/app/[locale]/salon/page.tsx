'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import SalonServiceCard from '@/components/salon/SalonServiceCard';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import type { SalonService } from '@/types/salon';

export default function SalonServicesPage() {
  const salonEnabled = useFeatureFlag('salon');
  const bookingEnabled = useFeatureFlag('booking');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [services, setServices] = useState<SalonService[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [svcResp, catResp] = await Promise.all([
          apiClient.get('/salon/services', {
            params: selectedCategory ? { category: selectedCategory } : {},
          }),
          apiClient.get('/salon/services/categories'),
        ]);
        setServices(svcResp.data?.data?.services ?? []);
        setCategories(catResp.data?.data?.categories ?? []);
      } catch {
        // graceful fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCategory]);

  if (!salonEnabled && !bookingEnabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Booking is not available
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This store does not currently offer appointment booking.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Our Services
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
          Browse our range of professional services and book your appointment online.
        </p>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => { setSelectedCategory(null); setLoading(true); }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              !selectedCategory
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-400'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setLoading(true); }}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service grid */}
      {!loading && services.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">
            No services available{selectedCategory ? ` in "${selectedCategory}"` : ''}.
          </p>
        </div>
      )}

      {!loading && services.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <SalonServiceCard key={svc._id} service={svc} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
