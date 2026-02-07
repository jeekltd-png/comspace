'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductBadges } from '@/components/ProductBadge';
import { StockCountdownCompact } from '@/components/StockCountdown';
import { SocialShareCompact } from '@/components/SocialShare';
import { StarRating } from '@/components/ProductReviews';
import { useRecentlyViewed } from '@/components/RecentlyViewed';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';

interface Product {
  _id: string;
  sku: string;
  name: string;
  slug?: string;
  title?: string;
  description?: string;
  price: number;
  salePrice?: number;
  images?: string[];
  stock?: number;
  rating?: number;
  reviewCount?: number;
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  badge?: 'new' | 'sale' | 'hot' | 'limited' | 'bestseller' | 'featured';
}

interface ProductCardProps {
  product: Product;
  locale: string;
}

export default function ProductCard({ product, locale }: ProductCardProps) {
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  // Handle different naming conventions
  const productName = product.name || product.title || 'Product';
  const productSlug = product.slug || product.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const productImage = product.images?.[0] || '/images/placeholder.png';
  const productStock = product.stock ?? 100;
  const productRating = product.rating ?? 0;
  const productReviews = product.reviewCount ?? 0;
  
  // Determine badges
  const badges = [];
  
  // Check if product is new (you can add a createdAt check here)
  if (product.isNew) {
    badges.push({ type: 'new' as const });
  }
  
  // Check for sale
  if (product.salePrice && product.salePrice < product.price) {
    const discount = Math.round(((product.price - product.salePrice) / product.price) * 100);
    badges.push({ type: 'sale' as const, discount });
  }
  
  // Other badges
  if (product.isBestseller) badges.push({ type: 'bestseller' as const });
  if (product.isFeatured) badges.push({ type: 'featured' as const });
  if (product.badge) badges.push({ type: product.badge });
  
  const productUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${locale}/products/${productSlug}`
    : `/${locale}/products/${productSlug}`;
  
  const displayPrice = product.salePrice || product.price;

  const handleClick = () => {
    addToRecentlyViewed({
      _id: product._id,
      name: productName,
      price: displayPrice,
      images: product.images || [],
      slug: productSlug,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement add to cart
    console.log('Add to cart:', product._id);
    alert(`Added ${productName} to cart!`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement wishlist
    console.log('Add to wishlist:', product._id);
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Badges */}
      {badges.length > 0 && <ProductBadges badges={badges} />}

      {/* Free Shipping Badge */}
      {displayPrice >= 50 && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md font-bold z-10">
          FREE SHIPPING
        </div>
      )}

      {/* Image Section */}
      <Link href={`/${locale}/products/${productSlug}`} onClick={handleClick}>
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={productImage}
            alt={productName}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Quick View
            </span>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Link 
          href={`/${locale}/products/${productSlug}`}
          onClick={handleClick}
        >
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[3rem]">
            {productName}
          </h3>
        </Link>

        {/* Rating */}
        {productRating > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={productRating} size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ({productReviews})
            </span>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          {product.salePrice && product.salePrice < product.price ? (
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
        {productStock <= 10 && (
          <StockCountdownCompact stock={productStock} threshold={10} />
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-2 pt-2">
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            disabled={productStock === 0}
          >
            <FiShoppingCart size={18} />
            {productStock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="p-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-500 hover:text-red-500 dark:hover:border-red-400 dark:hover:text-red-400 transition-colors"
            aria-label="Add to wishlist"
          >
            <FiHeart size={20} />
          </button>
        </div>

        {/* Social Share */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Share:</span>
            <SocialShareCompact url={productUrl} title={productName} />
          </div>
        </div>
      </div>
    </div>
  );
}
