'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  removeFromWishlist,
  clearWishlist,
  hydrateWishlist,
} from '@/store/slices/wishlistSlice';
import { addItem } from '@/store/slices/cartSlice';
import {
  FiHeart,
  FiShoppingCart,
  FiTrash2,
  FiArrowLeft,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useFormatPrice } from '@/lib/currency';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.wishlist.items);
  const formatPrice = useFormatPrice();

  // Rehydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    dispatch(hydrateWishlist());
  }, [dispatch]);

  const handleRemove = (productId: string, name: string) => {
    dispatch(removeFromWishlist(productId));
    toast.success(`${name} removed from wishlist`);
  };

  const handleMoveToCart = (item: (typeof items)[0]) => {
    dispatch(
      addItem({
        id: `${item.productId}-default`,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
      })
    );
    dispatch(removeFromWishlist(item.productId));
    toast.success(`${item.name} moved to cart`);
  };

  const handleClearAll = () => {
    dispatch(clearWishlist());
    toast.success('Wishlist cleared');
  };

  /* ── Empty state ────────────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 rounded-full bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mb-6">
          <FiHeart className="w-10 h-10 text-pink-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your wishlist is empty
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
          Save items you love to your wishlist and come back to them later.
        </p>
        <Link href="/products" className="btn-primary">
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Browse Products
        </Link>
      </div>
    );
  }

  /* ── Populated state ────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Wishlist
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        <button
          onClick={handleClearAll}
          className="text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
        >
          <FiTrash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.productId}
            className="glass-card overflow-hidden group hover:shadow-brand transition-all"
          >
            {/* Image */}
            <Link href={`/products/${item.productId}`} className="block relative">
              <div className="relative aspect-square bg-gray-100 dark:bg-surface-800">
                <Image
                  src={item.image || '/placeholder.png'}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(item.productId, item.name);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
                aria-label="Remove from wishlist"
              >
                <FiX className="w-4 h-4" />
              </button>
            </Link>

            {/* Info */}
            <div className="p-4">
              <Link
                href={`/products/${item.productId}`}
                className="font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-2 block mb-2"
              >
                {item.name}
              </Link>
              <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mb-3">
                {formatPrice(item.price)}
              </p>
              <button
                onClick={() => handleMoveToCart(item)}
                className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
              >
                <FiShoppingCart className="w-4 h-4" />
                Move to Cart
              </button>
            </div>

            {/* Added date */}
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Added{' '}
                {new Date(item.addedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
