// Example Product Card Component with All Quick Wins Integrated
// This shows how to use all the new features together

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductBadges } from '@/components/ProductBadge';
import { StockCountdownCompact } from '@/components/StockCountdown';
import { SocialShareCompact } from '@/components/SocialShare';
import { StarRating } from '@/components/ProductReviews';
import { useRecentlyViewed } from '@/components/RecentlyViewed';

interface Product {
  _id: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  badge?: 'new' | 'sale' | 'hot' | 'limited' | 'bestseller' | 'featured';
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
}

interface ProductCardProps {
  product: Product;
  locale: string;
}

export default function EnhancedProductCard({ product, locale }: ProductCardProps) {
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  const productUrl = `${window.location.origin}/${locale}/products/${product.slug}`;
  
  // Determine which badges to show
  const badges = [];
  if (product.isNew) badges.push({ type: 'new' as const });
  if (product.salePrice && product.discount) {
    badges.push({ type: 'sale' as const, discount: product.discount });
  }
  if (product.isBestseller) badges.push({ type: 'bestseller' as const });
  if (product.isFeatured) badges.push({ type: 'featured' as const });
  if (product.badge) badges.push({ type: product.badge });

  const handleClick = () => {
    addToRecentlyViewed({
      _id: product._id,
      name: product.name,
      price: product.salePrice || product.price,
      images: product.images,
      slug: product.slug,
    });
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Badges */}
      {badges.length > 0 && <ProductBadges badges={badges} />}

      {/* Image Section */}
      <Link href={`/${locale}/products/${product.slug}`} onClick={handleClick}>
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={product.images[0] || '/images/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          
          {/* Quick View Overlay (appears on hover) */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Quick View
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <Link 
          href={`/${locale}/products/${product.slug}`}
          onClick={handleClick}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <StarRating rating={product.rating} size="sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">
                ${product.salePrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Countdown */}
        <StockCountdownCompact stock={product.stock} threshold={10} />

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2">
          {/* Add to Cart Button */}
          <button
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* Wishlist Button */}
          <button
            className="ml-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Add to wishlist"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Social Share */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Share:</span>
            <SocialShareCompact url={productUrl} title={product.name} />
          </div>
        </div>
      </div>

      {/* Free Shipping Badge (if applicable) */}
      {product.price >= 50 && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md font-bold">
          FREE SHIPPING
        </div>
      )}
    </div>
  );
}

// Usage Example in Products Page:
// <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//   {products.map((product) => (
//     <EnhancedProductCard key={product._id} product={product} locale={locale} />
//   ))}
// </div>
