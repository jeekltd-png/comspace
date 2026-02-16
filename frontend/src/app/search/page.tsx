'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { FiSearch, FiStar, FiShoppingCart, FiFilter } from 'react-icons/fi';
import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFormatPrice } from '@/lib/currency';

interface Product {
  _id: string;
  name: string;
  shortDescription: string;
  basePrice: number;
  images: Array<{ url: string; alt: string }>;
  rating: { average: number; count: number };
  category?: { name: string };
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [sort, setSort] = useState('relevance');
  const { trackSearch, trackPageView } = useAnalytics();

  useEffect(() => {
    if (query) {
      trackSearch(query);
      trackPageView('/search', { query });
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['search', query, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ search: query, limit: '24' });
      if (sort === 'price-asc') params.set('sort', 'basePrice');
      if (sort === 'price-desc') params.set('sort', '-basePrice');
      if (sort === 'rating') params.set('sort', '-rating.average');
      if (sort === 'newest') params.set('sort', '-createdAt');

      const response = await apiClient.get(`/products?${params}`);
      return response.data.data;
    },
    enabled: query.length > 0,
  });

  const formatPrice = useFormatPrice();

  const products = data?.products || [];
  const total = data?.total || 0;

  if (!query) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-surface-800 flex items-center justify-center mb-6">
          <FiSearch className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Search Products</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Use the search bar above to find products.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} for`}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            &ldquo;{query}&rdquo;
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-gray-500" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="input-field py-2 text-sm"
            aria-label="Sort results"
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="bg-gray-200 dark:bg-surface-800 h-56" />
              <div className="p-5 space-y-3">
                <div className="bg-gray-200 dark:bg-surface-700 h-4 rounded-full w-3/4" />
                <div className="bg-gray-200 dark:bg-surface-700 h-3 rounded-full w-full" />
                <div className="bg-gray-200 dark:bg-surface-700 h-6 rounded-full w-20 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-16">
          <FiSearch className="w-12 h-12 text-gray-300 dark:text-surface-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No results found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Try a different search term.
          </p>
          <Link href="/products" className="btn-secondary">Browse All Products</Link>
        </div>
      )}

      {/* Results grid */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/products/${product._id}`}
              className="glass-card group overflow-hidden hover:shadow-brand transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-56 overflow-hidden bg-gray-100 dark:bg-surface-800">
                <Image
                  src={product.images[0]?.url || '/placeholder.png'}
                  alt={product.images[0]?.alt || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="bg-white dark:bg-surface-800 text-gray-900 dark:text-white px-4 py-2 rounded-2xl text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                    <FiShoppingCart className="w-4 h-4" />
                    View
                  </span>
                </div>
              </div>

              <div className="p-5">
                {product.category && (
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                    {product.category.name}
                  </span>
                )}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {product.shortDescription}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {formatPrice(product.basePrice)}
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {product.rating.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 bg-gray-200 dark:bg-surface-800 rounded-xl w-64 animate-pulse" />
      </div>
    }>
      <SearchResults />
    </React.Suspense>
  );
}
