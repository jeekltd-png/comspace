'use client';

import { useState } from 'react';
import { FiCalendar, FiUsers, FiSearch } from 'react-icons/fi';

interface SearchBarProps {
  onSearch: (params: { checkIn: string; checkOut: string; guests: number }) => void;
  loading?: boolean;
}

export default function HotelSearchBar({ onSearch, loading }: SearchBarProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const today = new Date().toISOString().slice(0, 10);

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;
    onSearch({ checkIn, checkOut, guests });
  };

  return (
    <div className="w-full bg-white dark:bg-surface-800 rounded-2xl shadow-lg p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Check-in */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
            <FiCalendar className="w-4 h-4" />
            Check-in
          </label>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={e => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) setCheckOut('');
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-surface-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Check-out */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
            <FiCalendar className="w-4 h-4" />
            Check-out
          </label>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-surface-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Guests */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
            <FiUsers className="w-4 h-4" />
            Guests
          </label>
          <select
            value={guests}
            onChange={e => setGuests(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-surface-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'Guest' : 'Guests'}
              </option>
            ))}
          </select>
        </div>

        {/* Search button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={handleSearch}
            disabled={!checkIn || !checkOut || loading}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700
                       text-white font-semibold rounded-lg transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiSearch className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
