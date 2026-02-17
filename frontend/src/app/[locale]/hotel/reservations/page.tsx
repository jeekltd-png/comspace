'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiArrowRight } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import ReservationCard from '@/components/hotel/ReservationCard';
import type { Reservation } from '@/types/hotel';

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (filter) params.status = filter;

      const res = await apiClient.get('/hotel/reservations/mine', { params });
      setReservations(res.data?.data?.reservations || []);
      setTotalPages(res.data?.data?.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filter, page]);

  const handleCancel = async (ref: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await apiClient.patch(`/hotel/reservations/${ref}/status`, {
        status: 'cancelled',
        note: 'Cancelled by guest',
      });
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch {
      toast.error('Failed to cancel reservation');
    }
  };

  const handleViewDetails = (ref: string) => {
    router.push(`/hotel/reservations/${ref}`);
  };

  const statuses = ['', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FiCalendar className="w-8 h-8 text-brand-600" />
              My Reservations
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View and manage your hotel bookings
            </p>
          </div>
          <button
            onClick={() => router.push('/hotel')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg
                       hover:bg-brand-700 transition-colors font-medium"
          >
            Book a Room <FiArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {statuses.map(s => (
            <button
              key={s || 'all'}
              onClick={() => { setFilter(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${filter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-surface-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
            >
              {s ? s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        {/* Reservations list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-surface-800 rounded-xl p-5 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-surface-700 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-surface-800 rounded-2xl">
            <IoBedOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
              No reservations found
            </h3>
            <p className="text-gray-400 mt-1 mb-4">
              {filter ? 'Try a different filter' : 'You haven\'t made any reservations yet'}
            </p>
            <button
              onClick={() => router.push('/hotel')}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(reservation => (
              <ReservationCard
                key={reservation._id}
                reservation={reservation}
                onCancel={handleCancel}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors
                  ${page === p
                    ? 'bg-brand-600 text-white'
                    : 'bg-white dark:bg-surface-800 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
