'use client';

import { useState, useEffect } from 'react';
import { FiHome } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';
import apiClient from '@/lib/api';
import HotelSearchBar from '@/components/hotel/HotelSearchBar';
import PropertyCard from '@/components/hotel/PropertyCard';
import type { AvailableProperty, Property } from '@/types/hotel';

export default function HotelPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchResults, setSearchResults] = useState<AvailableProperty[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load all properties on mount
  useEffect(() => {
    apiClient
      .get('/hotel/properties')
      .then(res => setProperties(res.data?.data?.properties || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle search
  const handleSearch = async (params: { checkIn: string; checkOut: string; guests: number }) => {
    setSearchLoading(true);
    try {
      const res = await apiClient.get('/hotel/availability', { params });
      setSearchResults(res.data?.data?.available || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => setSearchResults(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <IoBedOutline className="w-10 h-10" />
            Find Your Perfect Stay
          </h1>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Browse our rooms and properties, check availability, and book directly.
          </p>
          <HotelSearchBar onSearch={handleSearch} loading={searchLoading} />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Search results */}
        {searchResults !== null && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {searchResults.length} {searchResults.length === 1 ? 'property' : 'properties'} available
              </h2>
              <button
                onClick={clearSearch}
                className="text-sm text-brand-600 hover:underline"
              >
                Show all properties
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-2xl">
                <FiHome className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No properties available for the selected dates. Try different dates.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(result => (
                  <PropertyCard
                    key={result.property._id}
                    property={result.property}
                    nights={result.nights}
                    subtotal={result.subtotal}
                    nightlyBreakdown={result.nightlyBreakdown}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* All properties (default view) */}
        {searchResults === null && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Our Properties
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-56 bg-gray-200 dark:bg-surface-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 dark:bg-surface-700 rounded w-2/3" />
                      <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-full" />
                      <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-surface-800 rounded-2xl">
                <IoBedOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  No properties listed yet
                </h3>
                <p className="text-gray-400 mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(property => (
                  <PropertyCard key={property._id} property={property} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
