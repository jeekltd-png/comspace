'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import BookingWidget from '@/components/salon/BookingWidget';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import type { SalonService } from '@/types/salon';

export default function BookServicePage() {
  const salonEnabled = useFeatureFlag('salon');
  const bookingEnabled = useFeatureFlag('booking');
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const serviceSlug = searchParams.get('service');

  const [service, setService] = useState<SalonService | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceSlug) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const resp = await apiClient.get(`/salon/services/${serviceSlug}`);
        setService(resp.data?.data?.service ?? null);
      } catch {
        // service not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [serviceSlug]);

  if (!salonEnabled && !bookingEnabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Booking is not available
        </h1>
      </div>
    );
  }

  // Success state
  if (bookingRef) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-green-600 dark:text-green-400">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Booking Confirmed! 🎉
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Your appointment has been booked successfully.
        </p>
        <p className="text-lg font-mono font-bold text-brand-600 dark:text-brand-400 mb-6">
          Ref: {bookingRef}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href={`/${locale}/salon/bookings`}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
          >
            View My Bookings
          </Link>
          <Link
            href={`/${locale}/salon`}
            className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:border-brand-400 transition-colors"
          >
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Service not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          The service you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href={`/${locale}/salon`}
          className="text-brand-600 dark:text-brand-400 hover:underline"
        >
          ← Back to services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href={`/${locale}/salon`} className="hover:text-brand-600 dark:hover:text-brand-400">
          Services
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 dark:text-white">{service.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service details */}
        <div>
          {service.image && (
            <div className="relative rounded-2xl overflow-hidden mb-6">
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-64 object-cover"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{service.name}</h1>
          <span className="inline-block mt-1 text-xs font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wide">
            {service.category}
          </span>
          {service.description && (
            <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
              {service.description}
            </p>
          )}

          {/* Staff list */}
          {service.staffIds && service.staffIds.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Available stylists
              </h3>
              <div className="space-y-2">
                {service.staffIds.map((staff) => (
                  <div
                    key={staff._id}
                    className="flex items-center gap-3 p-2 rounded-xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-300">
                      {staff.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {staff.name}
                      </p>
                      {staff.title && (
                        <p className="text-xs text-gray-400">{staff.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking widget */}
        <BookingWidget
          service={service}
          onSuccess={(ref) => setBookingRef(ref)}
        />
      </div>
    </div>
  );
}
