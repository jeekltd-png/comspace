'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiUsers, FiPlus, FiMinus, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import type { Property, HotelAddOn, AvailabilityResponse } from '@/types/hotel';

interface BookingWidgetProps {
  property: Property;
}

export default function HotelBookingWidget({ property }: BookingWidgetProps) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=dates, 2=guests+addons, 3=confirm
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addOns, setAddOns] = useState<HotelAddOn[]>([]);
  const [pricing, setPricing] = useState<AvailabilityResponse['available'][0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Fetch add-ons on mount
  useEffect(() => {
    apiClient
      .get('/hotel/add-ons')
      .then(res => setAddOns(res.data?.data?.addOns || []))
      .catch(() => {});
  }, []);

  // Check availability when dates are set
  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get('/hotel/availability', {
        params: {
          checkIn,
          checkOut,
          guests: adults + children,
          propertyId: property._id,
        },
      });

      const available = res.data?.data?.available || [];
      if (available.length === 0) {
        toast.error('This property is not available for the selected dates');
        setPricing(null);
        return;
      }

      setPricing(available[0]);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  // Create reservation
  const handleBook = async () => {
    setBookingLoading(true);
    try {
      const res = await apiClient.post('/hotel/reservations', {
        propertyId: property._id,
        checkIn,
        checkOut,
        guests: { adults, children, infants },
        addOnIds: selectedAddOns,
        specialRequests,
      });

      const reservation = res.data?.data?.reservation;
      toast.success(`Reservation ${reservation?.reservationRef} created!`);
      router.push(`/hotel/reservations`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setBookingLoading(false);
    }
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id],
    );
  };

  const totalGuests = adults + children;

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Book this property</h3>
        <p className="text-brand-600 font-bold text-xl">
          {property.currency === 'GBP' ? '£' : property.currency} {property.basePrice}
          <span className="text-sm font-normal text-gray-500"> / night</span>
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step >= s ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}
            >
              {step > s ? <FiCheck className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-600'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Dates */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                <FiCalendar className="w-3.5 h-3.5" /> Check-in
              </label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={e => {
                  setCheckIn(e.target.value);
                  if (checkOut && e.target.value >= checkOut) setCheckOut('');
                }}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-surface-700 dark:border-gray-600
                           focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                <FiCalendar className="w-3.5 h-3.5" /> Check-out
              </label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-surface-700 dark:border-gray-600
                           focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Min stay: {property.policies.minStay} night{property.policies.minStay > 1 ? 's' : ''} •
            Check-in: {property.policies.checkInTime} • Check-out: {property.policies.checkOutTime}
          </div>

          <button
            onClick={handleCheckAvailability}
            disabled={!checkIn || !checkOut || loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg
                       transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Check Availability'
            )}
          </button>
        </div>
      )}

      {/* Step 2: Guests & Add-ons */}
      {step === 2 && pricing && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
            <FiArrowLeft className="w-3.5 h-3.5" /> Change dates
          </button>

          {/* Guests */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Guests</h4>
            {[
              { label: 'Adults', value: adults, set: setAdults, min: 1 },
              { label: 'Children', value: children, set: setChildren, min: 0 },
              { label: 'Infants', value: infants, set: setInfants, min: 0 },
            ].map(({ label, value, set, min }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => set(Math.max(min, value - 1))}
                    disabled={value <= min}
                    className="p-1 rounded-full border border-gray-300 dark:border-gray-600 disabled:opacity-30"
                  >
                    <FiMinus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-medium">{value}</span>
                  <button
                    onClick={() => set(Math.min(property.maxGuests, value + 1))}
                    disabled={totalGuests >= property.maxGuests && label !== 'Infants'}
                    className="p-1 rounded-full border border-gray-300 dark:border-gray-600 disabled:opacity-30"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400">Max {property.maxGuests} guests</p>
          </div>

          {/* Add-ons */}
          {addOns.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Extras</h4>
              {addOns.map(addon => (
                <label
                  key={addon._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200
                             dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-700"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(addon._id)}
                      onChange={() => toggleAddOn(addon._id)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{addon.name}</p>
                      {addon.description && (
                        <p className="text-xs text-gray-400">{addon.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-brand-600">
                    £{addon.price}/{addon.per}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Special requests */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Special Requests
            </label>
            <textarea
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="Any special requirements..."
              maxLength={1000}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-surface-700 dark:border-gray-600
                         focus:ring-2 focus:ring-brand-500 text-sm resize-none"
            />
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors"
          >
            Review Booking
          </button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && pricing && (
        <div className="space-y-4">
          <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="bg-gray-50 dark:bg-surface-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Property</span>
              <span className="font-medium text-gray-900 dark:text-white">{property.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Dates</span>
              <span className="font-medium">{checkIn} → {checkOut}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nights</span>
              <span className="font-medium">{pricing.nights}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Guests</span>
              <span className="font-medium">{adults} adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} child` : ''}</span>
            </div>
            <hr className="border-gray-200 dark:border-gray-600" />

            {/* Nightly breakdown */}
            {pricing.nightlyBreakdown.map(night => (
              <div key={night.date} className="flex justify-between text-xs text-gray-500">
                <span>{night.date} {night.ratePlan ? `(${night.ratePlan})` : ''}</span>
                <span>£{night.modifiedPrice.toFixed(2)}</span>
              </div>
            ))}

            <hr className="border-gray-200 dark:border-gray-600" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">£{pricing.subtotal.toFixed(2)}</span>
            </div>

            {selectedAddOns.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Extras</span>
                <span className="font-medium">
                  {selectedAddOns.length} add-on{selectedAddOns.length > 1 ? 's' : ''}
                </span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total</span>
              <span className="text-brand-600">£{pricing.subtotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={bookingLoading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg
                       transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {bookingLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Confirm Reservation'
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            A 20% deposit will be required. Cancellation policy: {property.policies.cancellationPolicy}.
          </p>
        </div>
      )}
    </div>
  );
}
