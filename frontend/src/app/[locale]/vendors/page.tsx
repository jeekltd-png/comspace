'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';

interface Vendor {
  _id: string;
  storeName: string;
  slug: string;
  shortDescription?: string;
  logo?: string;
  rating: { average: number; count: number };
  totalProducts: number;
  userId?: { firstName: string; lastName: string; avatar?: string };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (search) params.search = search;

      const resp = await apiClient.get('/vendors', { params });
      setVendors(resp.data.data.vendors);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Discover Vendors & Services
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Find businesses, service providers & sellers on ComSpace
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-10">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Vendor Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse h-48 bg-gray-200 dark:bg-surface-700 rounded-2xl"
            />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {search ? 'No vendors found matching your search.' : 'No vendors available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Link
              key={vendor._id}
              href={`/vendors/${vendor.slug}`}
              className="group bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* Banner / Logo Area */}
              <div className="h-32 bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                {vendor.logo ? (
                  <img
                    src={vendor.logo}
                    alt={vendor.storeName}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-white dark:bg-surface-800 flex items-center justify-center">
                    <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                      {vendor.storeName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {vendor.storeName}
                </h2>
                {vendor.shortDescription && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {vendor.shortDescription}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-surface-800">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {vendor.rating.average.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({vendor.rating.count})
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {vendor.totalProducts} {vendor.totalProducts === 1 ? 'listing' : 'listings'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
