'use client';

import { useState } from 'react';
import { FiCalendar, FiUsers, FiCheck, FiX, FiClock } from 'react-icons/fi';
import type { Reservation, ReservationStatus } from '@/types/hotel';

interface ReservationCardProps {
  reservation: Reservation;
  onCancel?: (ref: string) => void;
  onViewDetails?: (ref: string) => void;
}

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; icon: typeof FiCheck }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: FiClock },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: FiCheck },
  checked_in: { label: 'Checked In', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: FiCheck },
  checked_out: { label: 'Checked Out', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: FiCheck },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: FiX },
  no_show: { label: 'No Show', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: FiX },
};

export default function ReservationCard({ reservation, onCancel, onViewDetails }: ReservationCardProps) {
  const statusCfg = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const propertyName =
    typeof reservation.property === 'object' ? reservation.property.name : 'Property';
  const guestName =
    typeof reservation.guest === 'object'
      ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
      : '';

  const canCancel = ['pending', 'confirmed'].includes(reservation.status);

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{propertyName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ref: {reservation.reservationRef}
          </p>
          {guestName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{guestName}</p>
          )}
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusCfg.label}
        </span>
      </div>

      {/* Dates & Guests */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FiCalendar className="w-4 h-4 text-brand-500" />
          <div>
            <p className="text-xs text-gray-400">Check-in</p>
            <p className="font-medium">{reservation.checkIn}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FiCalendar className="w-4 h-4 text-brand-500" />
          <div>
            <p className="text-xs text-gray-400">Check-out</p>
            <p className="font-medium">{reservation.checkOut}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FiUsers className="w-4 h-4 text-brand-500" />
          <div>
            <p className="text-xs text-gray-400">Guests</p>
            <p className="font-medium">
              {reservation.guests.adults} adult{reservation.guests.adults > 1 ? 's' : ''}
              {reservation.guests.children > 0 && `, ${reservation.guests.children} child`}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {reservation.nights} {reservation.nights === 1 ? 'night' : 'nights'}
          </span>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {reservation.pricing.currency === 'GBP' ? '£' : reservation.pricing.currency}{' '}
            {reservation.pricing.total.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(reservation.reservationRef)}
              className="px-3 py-1.5 text-sm font-medium text-brand-600 border border-brand-600
                         rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
            >
              View Details
            </button>
          )}
          {canCancel && onCancel && (
            <button
              onClick={() => onCancel(reservation.reservationRef)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300
                         rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
