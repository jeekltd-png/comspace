'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';

interface Product {
  _id: string;
  name: string;
  shortDescription: string;
  basePrice: number;
  images: Array<{ url: string; alt: string }>;
  rating: { average: number; count: number };
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = useAppSelector(state => state.currency);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/products?isFeatured=true&limit=8');
        setProducts(response.data.data.products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 h-64 rounded-lg mb-4"></div>
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <Link
          key={product._id}
          href={`/products/${product._id}`}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
        >
          <div className="relative h-64">
            <Image
              src={product.images[0]?.url || '/placeholder.png'}
              alt={product.images[0]?.alt || product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {product.shortDescription}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-blue-600">
                {currency.symbol}
                {(product.basePrice * (currency.rates[currency.current] || 1)).toFixed(
                  2
                )}
              </span>
              <div className="flex items-center text-sm text-yellow-500">
                <span>⭐ {product.rating.average.toFixed(1)}</span>
                <span className="text-gray-500 ml-1">
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
