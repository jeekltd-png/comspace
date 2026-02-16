'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useFormatPrice } from '@/lib/currency';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import type { Booking, BookingStatus } from '@/types/salon';

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'no-show': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function MyBookingsPage() {
  const salonEnabled = useFeatureFlag('salon');
  const bookingEnabled = useFeatureFlag('booking');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const formatPrice = useFormatPrice();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resp = await apiClient.get('/salon/bookings/mine', {
          params: filter ? { status: filter } : {},
        });
        setBookings(resp.data?.data?.bookings ?? []);
      } catch {
        // not auth'd or no bookings
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  const handleCancel = async (ref: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(ref);
    try {
      await apiClient.patch(`/salon/bookings/${ref}/status`, { status: 'cancelled' });
      setBookings((prev) =>
        prev.map((b) => (b.bookingRef === ref ? { ...b, status: 'cancelled' } : b)),
      );
    } catch {
      alert('Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  if (!salonEnabled && !bookingEnabled) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
        <Link
          href={`/${locale}/salon`}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
        >
          Book New
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-400'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You have no bookings{filter ? ` with status "${filter}"` : ''}.
          </p>
          <Link
            href={`/${locale}/salon`}
            className="text-brand-600 dark:text-brand-400 hover:underline"
          >
            Browse services →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {booking.service?.name || 'Service'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>📅 {formatDateLabel(booking.date)}</p>
                    <p>🕐 {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)}</p>
                    <p>💇 {booking.staff?.name || 'Any stylist'}{booking.staff?.title ? ` · ${booking.staff.title}` : ''}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400 font-mono">{booking.bookingRef}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {formatPrice(booking.price)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {['pending', 'confirmed'].includes(booking.status) && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                  <button
                    onClick={() => handleCancel(booking.bookingRef)}
                    disabled={cancelling === booking.bookingRef}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {cancelling === booking.bookingRef ? 'Cancelling…' : 'Cancel Booking'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
