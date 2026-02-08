'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { FiStar, FiShoppingCart } from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  shortDescription: string;
  basePrice: number;
  images: Array<{ url: string; alt: string }>;
  rating: { average: number; count: number };
}

export function FeaturedProducts() {
  const currency = useAppSelector(state => state.currency);

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await apiClient.get('/products?isFeatured=true&limit=8');
      return response.data.data.products;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass-card overflow-hidden animate-pulse">
            <div className="bg-gray-200 dark:bg-surface-800 h-64" />
            <div className="p-5 space-y-3">
              <div className="bg-gray-200 dark:bg-surface-700 h-4 rounded-full w-3/4" />
              <div className="bg-gray-200 dark:bg-surface-700 h-3 rounded-full w-full" />
              <div className="bg-gray-200 dark:bg-surface-700 h-3 rounded-full w-2/3" />
              <div className="flex justify-between items-center pt-2">
                <div className="bg-gray-200 dark:bg-surface-700 h-6 rounded-full w-20" />
                <div className="bg-gray-200 dark:bg-surface-700 h-8 w-8 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Unable to load products right now.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No featured products yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <Link
          key={product._id}
          href={`/products/${product._id}`}
          className="glass-card group overflow-hidden hover:shadow-brand transition-all duration-300 hover:-translate-y-1"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {/* Image */}
          <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-surface-800">
            <Image
              src={product.images[0]?.url || '/placeholder.png'}
              alt={product.images[0]?.alt || product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Quick add overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <span className="bg-white dark:bg-surface-800 text-gray-900 dark:text-white px-4 py-2 rounded-2xl text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                <FiShoppingCart className="w-4 h-4" />
                View Product
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                {currency.symbol}
                {(product.basePrice * (currency.rates[currency.current] || 1)).toFixed(2)}
              </span>
              <div className="flex items-center gap-1 text-sm">
                <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {product.rating.average.toFixed(1)}
                </span>
                <span className="text-gray-400 dark:text-gray-500">
                  ({product.rating.count})
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
