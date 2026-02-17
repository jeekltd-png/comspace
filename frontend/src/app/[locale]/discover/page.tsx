'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  FiSearch,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiClock,
  FiStar,
  FiChevronDown,
  FiSliders,
  FiX,
} from 'react-icons/fi';

interface DiscoveryResult {
  _id: string;
  name: string;
  slug?: string;
  _source: 'healthcare' | 'worship' | 'store';
  _distanceKm?: number;
  distance?: number;
  // Healthcare fields
  subType?: string;
  specialties?: string[];
  shortDescription?: string;
  image?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  phone?: string;
  hours?: Array<{ day: number; isOpen: boolean; openTime: string; closeTime: string }>;
  isEmergency?: boolean;
  serviceTags?: string[];
  rating?: number;
  reviewCount?: number;
  // Store fields
  spacePreset?: string;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories', icon: '🔍' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'worship', label: 'Worship', icon: '⛪' },
  { value: 'salon', label: 'Salon & Spa', icon: '💇' },
  { value: 'food-store', label: 'Food Store', icon: '🍎' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'gym', label: 'Gym & Fitness', icon: '🏋️' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'laundry', label: 'Laundry', icon: '🧺' },
  { value: 'home-services', label: 'Home Services', icon: '🔧' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'bnb', label: 'B&B', icon: '🛏️' },
];

const RADIUS_OPTIONS = [
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' },
];

export default function DiscoverPage() {
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState(10000);
  const [openNow, setOpenNow] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);

  // Request user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError('');
      },
      (err) => {
        setLocationError('Enable location access to find services near you');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const params = new URLSearchParams();

      if (userLocation) {
        params.set('lat', String(userLocation.lat));
        params.set('lng', String(userLocation.lng));
        params.set('radius', String(radius));
      }
      if (category) params.set('type', category);
      if (search) params.set('search', search);
      if (openNow) params.set('openNow', 'true');

      const res = await fetch(`${base}/discover?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setResults(json.data.results || []);
        setTotal(json.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Discovery search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, category, search, radius, openNow]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  const isOpenNow = (hours?: DiscoveryResult['hours']): boolean => {
    if (!hours || hours.length === 0) return false;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayHours = hours.find(h => h.day === currentDay);
    if (!todayHours || !todayHours.isOpen) return false;
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  };

  const getSourceBadge = (result: DiscoveryResult) => {
    if (result._source === 'healthcare') {
      const labels: Record<string, string> = {
        hospital: '🏥 Hospital', clinic: '🩺 Clinic', dental: '🦷 Dental',
        lab: '🔬 Lab', physio: '💪 Physio', specialist: '👨‍⚕️ Specialist',
        optometrist: '👁️ Optometrist', pharmacy: '💊 Pharmacy',
        'mental-health': '🧠 Mental Health',
      };
      return labels[result.subType || ''] || '🏥 Healthcare';
    }
    if (result._source === 'worship') {
      const labels: Record<string, string> = {
        church: '⛪ Church', mosque: '🕌 Mosque', temple: '🛕 Temple',
        synagogue: '🕍 Synagogue', chapel: '⛪ Chapel',
        'worship-centre': '🕊️ Worship Centre',
      };
      return labels[result.subType || ''] || '⛪ Worship';
    }
    const storeLabels: Record<string, string> = {
      salon: '💇 Salon', 'food-store': '🍎 Food', restaurant: '🍽️ Restaurant',
      gym: '🏋️ Gym', pharmacy: '💊 Pharmacy', laundry: '🧺 Laundry',
      'home-services': '🔧 Services', hotel: '🏨 Hotel', bnb: '🛏️ B&B',
    };
    return storeLabels[result.spacePreset || ''] || '🏪 Store';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero / Search header */}
      <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Discover Services Near You
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Find healthcare, salons, restaurants & more — sorted by distance
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, service, or specialty..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 bg-white shadow-lg focus:ring-2 focus:ring-white/50 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3.5 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
              aria-label="Toggle filters"
            >
              <FiSliders className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="px-6 py-3.5 bg-white text-brand-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Search
            </button>
          </form>

          {/* Location status */}
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <FiNavigation className="w-3.5 h-3.5" />
            {userLocation ? (
              <span>Using your current location</span>
            ) : (
              <button
                onClick={requestLocation}
                className="underline hover:text-white"
              >
                {locationError || 'Enable location for distance sorting'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category */}
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Radius */}
              <div className="relative">
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Within {opt.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Open now toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                  className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500"
                />
                <FiClock className="w-3.5 h-3.5" />
                Open now
              </label>

              {/* Close filters */}
              <button
                onClick={() => setShowFilters(false)}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} found`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No services found nearby
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Try expanding your search radius or changing your filters
            </p>
            {!userLocation && (
              <button
                onClick={requestLocation}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiNavigation className="w-4 h-4" />
                Enable Location
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <div
                key={result._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Badge row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                      {getSourceBadge(result)}
                    </span>
                    {result._distanceKm !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                        <FiMapPin className="w-3 h-3" />
                        {result._distanceKm} km
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {result.name}
                  </h3>

                  {/* Description */}
                  {result.shortDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {result.shortDescription}
                    </p>
                  )}

                  {/* Tags */}
                  {(result.specialties || result.serviceTags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(result.specialties || result.serviceTags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    {result.address && (
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {result.address.city}, {result.address.state}
                        </span>
                      </div>
                    )}
                    {result.phone && (
                      <div className="flex items-center gap-2">
                        <FiPhone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{result.phone}</span>
                      </div>
                    )}
                    {result.hours && (
                      <div className="flex items-center gap-2">
                        <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className={isOpenNow(result.hours) ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500'}>
                          {isOpenNow(result.hours) ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                {(result.rating !== undefined || result.isEmergency) && (
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <FiStar className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {(result.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({result.reviewCount || 0})
                      </span>
                    </div>
                    {result.isEmergency && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        24/7 Emergency
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
