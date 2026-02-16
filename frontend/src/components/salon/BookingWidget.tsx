'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { useFormatPrice } from '@/lib/currency';
import type { SalonService, StaffMember, SlotAvailability } from '@/types/salon';

// ── Types ────────────────────────────────────────────────────

interface BookingWidgetProps {
  service: SalonService;
  onSuccess: (bookingRef: string) => void;
}

type Step = 'date' | 'staff' | 'time' | 'confirm';

// ── Helpers ──────────────────────────────────────────────────

function getNext14Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ── Component ────────────────────────────────────────────────

export default function BookingWidget({ service, onSuccess }: BookingWidgetProps) {
  const formatPrice = useFormatPrice();

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availability, setAvailability] = useState<SlotAvailability[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<SlotAvailability | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dates = getNext14Days();

  // Fetch available slots when date is selected
  const fetchSlots = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    setAvailability([]);
    setSelectedStaff(null);
    setSelectedTime(null);
    try {
      const resp = await apiClient.get('/salon/bookings/slots', {
        params: { serviceId: service._id, date },
      });
      const data = resp.data?.data;
      setAvailability(data?.availability ?? []);
    } catch {
      setError('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  }, [service._id]);

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('staff');
  };

  const handleStaffSelect = (staff: SlotAvailability) => {
    setSelectedStaff(staff);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedStaff || !selectedTime) return;

    setSubmitting(true);
    setError(null);
    try {
      const resp = await apiClient.post('/salon/bookings', {
        serviceId: service._id,
        staffId: selectedStaff.staffId,
        date: selectedDate,
        startTime: selectedTime,
        notes: notes.trim() || undefined,
      });
      const bookingRef = resp.data?.data?.booking?.bookingRef;
      onSuccess(bookingRef || 'Confirmed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'confirm') setStep('time');
    else if (step === 'time') setStep('staff');
    else if (step === 'staff') setStep('date');
  };

  const displayPrice = service.salePrice ?? service.price;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg mx-auto">
      {/* Service summary header */}
      <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{service.name}</h2>
        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            {service.duration} min
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatPrice(displayPrice)}
          </span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(['date', 'staff', 'time', 'confirm'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-brand-600 text-white'
                  : i < ['date', 'staff', 'time', 'confirm'].indexOf(step)
                  ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
            {i < 3 && (
              <div className={`flex-1 h-0.5 ${
                i < ['date', 'staff', 'time', 'confirm'].indexOf(step) ? 'bg-brand-400' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Back button */}
      {step !== 'date' && (
        <button
          onClick={goBack}
          className="mb-4 text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      )}

      {/* ── Step 1: Date ─────────────────────────────────── */}
      {step === 'date' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Select a date
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => handleDateSelect(d)}
                className={`p-2 rounded-xl text-center text-sm border transition-colors ${
                  selectedDate === d
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 text-gray-700 dark:text-gray-300'
                }`}
              >
                {formatDateLabel(d)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Staff ────────────────────────────────── */}
      {step === 'staff' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Choose your stylist
          </h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : availability.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-6">
              No availability on this date. Please try another date.
            </p>
          ) : (
            <div className="space-y-2">
              {availability.map((staff) => (
                <button
                  key={staff.staffId}
                  onClick={() => handleStaffSelect(staff)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-400 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-300">
                    {staff.staffName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {staff.staffName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {staff.slots.length} slot{staff.slots.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Time ─────────────────────────────────── */}
      {step === 'time' && selectedStaff && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Pick a time — {selectedStaff.staffName}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {selectedStaff.slots.map((slot) => (
              <button
                key={slot}
                onClick={() => handleTimeSelect(slot)}
                className={`py-2 px-3 rounded-xl text-sm border font-medium transition-colors ${
                  selectedTime === slot
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 text-gray-700 dark:text-gray-300'
                }`}
              >
                {formatTime12h(slot)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm ──────────────────────────────── */}
      {step === 'confirm' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Confirm your appointment
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Service</span>
              <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Date</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedDate && formatDateLabel(selectedDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Time</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedTime && formatTime12h(selectedTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Stylist</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedStaff?.staffName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Duration</span>
              <span className="font-medium text-gray-900 dark:text-white">{service.duration} min</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
              <span className="text-gray-500 dark:text-gray-400 font-semibold">Total</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {formatPrice(displayPrice)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests? (optional)"
            maxLength={500}
            rows={2}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white placeholder-gray-400 mb-4"
          />

          <button
            onClick={handleBook}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Booking…
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
