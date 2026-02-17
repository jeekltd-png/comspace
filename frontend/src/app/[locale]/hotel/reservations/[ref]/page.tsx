'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiCalendar, FiUsers, FiMessageSquare, FiClock } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import type { Reservation, GuestMessage } from '@/types/hotel';

export default function ReservationDetailPage() {
  const params = useParams();
  const ref = params?.ref as string;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const fetchData = async () => {
      try {
        const [resRes, msgRes] = await Promise.all([
          apiClient.get(`/hotel/reservations/${ref}`),
          apiClient.get('/hotel/messages', { params: { reservationId: ref } }).catch(() => ({ data: { data: { messages: [] } } })),
        ]);
        setReservation(resRes.data?.data?.reservation || null);
        setMessages(msgRes.data?.data?.messages || []);
      } catch {
        toast.error('Failed to load reservation details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ref]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !reservation) return;
    setSendingMessage(true);
    try {
      const res = await apiClient.post('/hotel/messages', {
        reservationId: reservation._id,
        type: 'general',
        message: newMessage,
      });
      setMessages(prev => [...prev, res.data?.data?.message]);
      setNewMessage('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-950 py-8 px-4">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded w-1/3 mb-6" />
          <div className="h-64 bg-gray-200 dark:bg-surface-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <IoBedOutline className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400">Reservation not found</h2>
          <Link href="/hotel/reservations" className="text-brand-600 hover:underline mt-2 block">
            Back to reservations
          </Link>
        </div>
      </div>
    );
  }

  const property = typeof reservation.property === 'object' ? reservation.property : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/hotel/reservations"
          className="inline-flex items-center gap-1 text-brand-600 hover:underline mb-6"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Reservations
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {property?.name || 'Property'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Reservation: {reservation.reservationRef}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold
                ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
            >
              {reservation.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          {/* Stay details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1"><FiCalendar className="w-3 h-3" /> Check-in</p>
              <p className="font-semibold text-gray-900 dark:text-white">{reservation.checkIn}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1"><FiCalendar className="w-3 h-3" /> Check-out</p>
              <p className="font-semibold text-gray-900 dark:text-white">{reservation.checkOut}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1"><FiClock className="w-3 h-3" /> Nights</p>
              <p className="font-semibold text-gray-900 dark:text-white">{reservation.nights}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1"><FiUsers className="w-3 h-3" /> Guests</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {reservation.guests.adults} adult{reservation.guests.adults > 1 ? 's' : ''}
                {reservation.guests.children > 0 ? `, ${reservation.guests.children} child` : ''}
              </p>
            </div>
          </div>

          {/* Pricing breakdown */}
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Pricing</h3>
            {reservation.pricing.nightlyBreakdown?.map(night => (
              <div key={night.date} className="flex justify-between text-sm text-gray-500">
                <span>{night.date} {night.ratePlan ? `(${night.ratePlan})` : ''}</span>
                <span>£{night.modifiedPrice.toFixed(2)}</span>
              </div>
            ))}
            {reservation.pricing.addOns?.length > 0 && (
              <>
                <hr className="border-gray-100 dark:border-gray-700" />
                {reservation.pricing.addOns.map((addon, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-500">
                    <span>{addon.name} (×{addon.quantity})</span>
                    <span>£{addon.total.toFixed(2)}</span>
                  </div>
                ))}
              </>
            )}
            <hr className="border-gray-100 dark:border-gray-700" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-brand-600">£{reservation.pricing.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Payment status</span>
              <span className="capitalize">{reservation.payment.paymentStatus.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Special requests */}
          {reservation.specialRequests && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Special Requests</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{reservation.specialRequests}</p>
            </div>
          )}
        </div>

        {/* Status history */}
        {reservation.statusHistory && reservation.statusHistory.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Status History</h3>
            <div className="space-y-2">
              {reservation.statusHistory.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-brand-500 rounded-full" />
                  <span className="font-medium capitalize">{entry.status.replace(/_/g, ' ')}</span>
                  <span className="text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                  {entry.note && <span className="text-gray-500">— {entry.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guest messaging */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiMessageSquare className="w-5 h-5 text-brand-500" />
            Messages
          </h3>

          {messages.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No messages yet. Send a message to the host.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {messages.map(msg => (
                <div
                  key={msg._id}
                  className={`p-3 rounded-lg max-w-[80%] ${
                    msg.isFromGuest
                      ? 'bg-brand-50 dark:bg-brand-900/20 ml-auto'
                      : 'bg-gray-100 dark:bg-surface-700'
                  }`}
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200">{msg.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-surface-700 dark:border-gray-600
                         focus:ring-2 focus:ring-brand-500 text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700
                         transition-colors disabled:opacity-50 font-medium text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
