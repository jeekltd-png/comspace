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
  FiChevronDown,
  FiUsers,
} from 'react-icons/fi';

interface WorshipProvider {
  _id: string;
  name: string;
  slug: string;
  subType: string;
  faithTradition: string;
  denomination?: string;
  shortDescription?: string;
  image?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  phone: string;
  serviceSchedule: Array<{ day: number; time: string; label: string }>;
  hours: Array<{ day: number; isOpen: boolean; openTime: string; closeTime: string }>;
  ministries: string[];
  programmes: string[];
  leaderName?: string;
  leaderTitle?: string;
  languages: string[];
  serviceTags: string[];
  rating: number;
  reviewCount: number;
}

const SUB_TYPE_LABELS: Record<string, string> = {
  church: '⛪ Church',
  mosque: '🕌 Mosque',
  temple: '🛕 Temple',
  synagogue: '🕍 Synagogue',
  chapel: '⛪ Chapel',
  'worship-centre': '🕊️ Worship Centre',
};

const FAITH_LABELS: Record<string, string> = {
  christian: 'Christian',
  muslim: 'Muslim',
  hindu: 'Hindu',
  jewish: 'Jewish',
  buddhist: 'Buddhist',
  sikh: 'Sikh',
  'non-denominational': 'Non-Denominational',
  other: 'Other',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WorshipPage() {
  const t = useTranslations();
  const [providers, setProviders] = useState<WorshipProvider[]>([]);
  const [subTypes, setSubTypes] = useState<string[]>([]);
  const [traditions, setTraditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [selectedTradition, setSelectedTradition] = useState('');

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (selectedSubType) params.subType = selectedSubType;
      if (selectedTradition) params.faithTradition = selectedTradition;

      const [provRes, typeRes, tradRes] = await Promise.all([
        apiClient.get('/worship/providers', { params }),
        apiClient.get('/worship/providers/sub-types'),
        apiClient.get('/worship/providers/faith-traditions'),
      ]);

      setProviders(provRes.data?.data?.providers || []);
      setSubTypes(typeRes.data?.data?.subTypes || []);
      setTraditions(tradRes.data?.data?.traditions || []);
    } catch (err) {
      console.error('Failed to load worship providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [selectedSubType, selectedTradition]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProviders();
  };

  const isOpenNow = (hours: WorshipProvider['hours']): boolean => {
    if (!hours || hours.length === 0) return false;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayHours = hours.find(h => h.day === currentDay);
    if (!todayHours || !todayHours.isOpen) return false;
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  };

  const getNextService = (schedule: WorshipProvider['serviceSchedule']): string | null => {
    if (!schedule || schedule.length === 0) return null;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Find next upcoming service
    for (let offset = 0; offset < 7; offset++) {
      const checkDay = (currentDay + offset) % 7;
      const dayServices = schedule
        .filter(s => s.day === checkDay)
        .sort((a, b) => a.time.localeCompare(b.time));

      for (const svc of dayServices) {
        if (offset === 0 && svc.time <= currentTime) continue; // already passed today
        const dayLabel = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : DAY_NAMES[checkDay];
        return `${dayLabel} ${svc.time} — ${svc.label}`;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-violet-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Places of Worship</h1>
          <p className="text-white/80 text-lg">Find churches, worship centres & faith communities near you</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, denomination, ministry, or service..."
                className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 bg-white shadow-lg focus:ring-2 focus:ring-white/50 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
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
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
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
              value={selectedTradition}
              onChange={(e) => setSelectedTradition(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Traditions</option>
              {traditions.map((tr) => (
                <option key={tr} value={tr}>{FAITH_LABELS[tr] || tr}</option>
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
            <div className="text-6xl mb-4">⛪</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No places of worship found
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
                      <div className="flex gap-1.5 mb-2">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          {SUB_TYPE_LABELS[provider.subType] || provider.subType}
                        </span>
                        {provider.denomination && (
                          <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {provider.denomination}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {provider.name}
                      </h3>
                    </div>
                  </div>

                  {provider.leaderName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium">{provider.leaderTitle || 'Leader'}:</span> {provider.leaderName}
                    </p>
                  )}

                  {provider.shortDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {provider.shortDescription}
                    </p>
                  )}

                  {/* Ministries */}
                  {provider.ministries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {provider.ministries.slice(0, 4).map((ministry) => (
                        <span
                          key={ministry}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        >
                          {ministry}
                        </span>
                      ))}
                      {provider.ministries.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{provider.ministries.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Next service */}
                  {(() => {
                    const nextSvc = getNextService(provider.serviceSchedule);
                    return nextSvc ? (
                      <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                          Next service: {nextSvc}
                        </p>
                      </div>
                    ) : null;
                  })()}

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
