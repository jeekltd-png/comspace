'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import apiClient from '@/lib/api';
import {
  FiSearch,
  FiMapPin,
  FiPhone,
  FiClock,
  FiStar,
  FiFilter,
  FiChevronDown,
} from 'react-icons/fi';

interface HealthcareProvider {
  _id: string;
  name: string;
  slug: string;
  subType: string;
  specialties: string[];
  shortDescription?: string;
  image?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  phone: string;
  hours: Array<{ day: number; isOpen: boolean; openTime: string; closeTime: string }>;
  isEmergency: boolean;
  languages: string[];
  serviceTags: string[];
  rating: number;
  reviewCount: number;
}

const SUB_TYPE_LABELS: Record<string, string> = {
  hospital: '🏥 Hospital',
  clinic: '🩺 Clinic',
  dental: '🦷 Dental',
  lab: '🔬 Laboratory',
  physio: '💪 Physiotherapy',
  specialist: '👨‍⚕️ Specialist',
  optometrist: '👁️ Optometrist',
  pharmacy: '💊 Pharmacy',
  'mental-health': '🧠 Mental Health',
};

export default function HealthcarePage() {
  const t = useTranslations();
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [subTypes, setSubTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (selectedSubType) params.subType = selectedSubType;
      if (selectedSpecialty) params.specialty = selectedSpecialty;

      const [provRes, specRes, typeRes] = await Promise.all([
        apiClient.get('/healthcare/providers', { params }),
        apiClient.get('/healthcare/providers/specialties'),
        apiClient.get('/healthcare/providers/sub-types'),
      ]);

      setProviders(provRes.data?.data?.providers || []);
      setSpecialties(specRes.data?.data?.specialties || []);
      setSubTypes(typeRes.data?.data?.subTypes || []);
    } catch (err) {
      console.error('Failed to load healthcare providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [selectedSubType, selectedSpecialty]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProviders();
  };

  const isOpenNow = (hours: HealthcareProvider['hours']): boolean => {
    if (!hours || hours.length === 0) return false;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayHours = hours.find(h => h.day === currentDay);
    if (!todayHours || !todayHours.isOpen) return false;
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Healthcare Services</h1>
          <p className="text-white/80 text-lg">Find doctors, clinics & hospitals near you</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, specialty, or service..."
                className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 bg-white shadow-lg focus:ring-2 focus:ring-white/50 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-white text-pink-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative">
            <select
              value={selectedSubType}
              onChange={(e) => setSelectedSubType(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="">All Types</option>
              {subTypes.map((st) => (
                <option key={st} value={st}>{SUB_TYPE_LABELS[st] || st}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="">All Specialties</option>
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏥</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No healthcare providers found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div
                key={provider._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {/* Card header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 mb-2">
                        {SUB_TYPE_LABELS[provider.subType] || provider.subType}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {provider.name}
                      </h3>
                    </div>
                    {provider.isEmergency && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        24/7
                      </span>
                    )}
                  </div>

                  {provider.shortDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {provider.shortDescription}
                    </p>
                  )}

                  {/* Specialties */}
                  {provider.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {provider.specialties.slice(0, 4).map((spec) => (
                        <span
                          key={spec}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        >
                          {spec}
                        </span>
                      ))}
                      {provider.specialties.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{provider.specialties.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {provider.address.street}, {provider.address.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiPhone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{provider.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className={isOpenNow(provider.hours) ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500'}>
                        {isOpenNow(provider.hours) ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <FiStar className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {provider.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({provider.reviewCount})
                    </span>
                  </div>
                  {provider.languages.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {provider.languages.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
