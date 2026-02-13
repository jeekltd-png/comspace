'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';

interface VendorProfile {
  _id: string;
  storeName: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  banner?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  policies?: {
    returnPolicy?: string;
    shippingPolicy?: string;
  };
  rating: { average: number; count: number };
  totalProducts: number;
  totalSales: number;
  userId?: { firstName: string; lastName: string; avatar?: string; email: string };
}

interface Product {
  _id: string;
  name: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  isOnSale?: boolean;
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  rating: { average: number; count: number };
  category?: { name: string; slug: string };
}

export default function VendorProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchVendor = async () => {
      try {
        const resp = await apiClient.get(`/vendors/profile/${slug}`);
        setVendor(resp.data.data.vendor);
        setProducts(resp.data.data.products);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Vendor not found');
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [slug]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-surface-700 rounded-2xl" />
          <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-surface-700 rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !vendor) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            {error || 'Vendor not found'}
          </h2>
          <Link
            href="/vendors"
            className="text-brand-600 dark:text-brand-400 hover:underline mt-3 inline-block"
          >
            ← Browse all vendors
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Vendor Header */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 overflow-hidden mb-8">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-br from-brand-500/30 to-accent-500/30 relative">
          {vendor.banner && (
            <img
              src={vendor.banner}
              alt="Store banner"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Store Info */}
        <div className="p-6 -mt-10 relative">
          <div className="flex items-end gap-4 mb-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-surface-800 border-4 border-white dark:border-surface-900 shadow-lg flex items-center justify-center flex-shrink-0">
              {vendor.logo ? (
                <img
                  src={vendor.logo}
                  alt={vendor.storeName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                  {vendor.storeName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {vendor.storeName}
              </h1>
              {vendor.shortDescription && (
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {vendor.shortDescription}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <div className="flex items-center gap-1">
              <span className="text-amber-500 text-lg">★</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {vendor.rating.average.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">
                ({vendor.rating.count} reviews)
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {vendor.totalProducts} {vendor.totalProducts === 1 ? 'listing' : 'listings'}
            </div>
            {vendor.address?.city && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                📍 {[vendor.address.city, vendor.address.state, vendor.address.country]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}
          </div>

          {/* Social Links */}
          {vendor.socialLinks && (
            <div className="flex items-center gap-3">
              {vendor.socialLinks.website && (
                <a
                  href={vendor.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  🌐 Website
                </a>
              )}
              {vendor.socialLinks.instagram && (
                <a
                  href={vendor.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
                >
                  📸 Instagram
                </a>
              )}
              {vendor.socialLinks.facebook && (
                <a
                  href={vendor.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  📘 Facebook
                </a>
              )}
              {vendor.socialLinks.twitter && (
                <a
                  href={vendor.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
                >
                  🐦 Twitter
                </a>
              )}
            </div>
          )}

          {/* Description */}
          {vendor.description && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-surface-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {vendor.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Products by {vendor.storeName}
        </h2>

        {products.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => {
              const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
              return (
                <Link
                  key={product._id}
                  href={`/products/${product._id}`}
                  className="group bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-surface-800 overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage.url}
                        alt={primaryImage.alt || product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        📷
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {product.name}
                    </h3>
                    {product.category && (
                      <p className="text-xs text-gray-400 mt-1">{product.category.name}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        {product.isOnSale && product.salePrice ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-600 dark:text-red-400">
                              ${product.salePrice.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              ${product.basePrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900 dark:text-white">
                            ${product.basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {product.rating.count > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-amber-500">★</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {product.rating.average.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Policies */}
      {vendor.policies && (vendor.policies.returnPolicy || vendor.policies.shippingPolicy) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vendor.policies.returnPolicy && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📦 Return Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {vendor.policies.returnPolicy}
              </p>
            </div>
          )}
          {vendor.policies.shippingPolicy && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🚚 Shipping Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {vendor.policies.shippingPolicy}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
