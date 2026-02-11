'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateQuantity, removeItem, clearCart } from '@/store/slices/cartSlice';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft, FiShield } from 'react-icons/fi';

export default function CartPage() {
  const cartEnabled = useFeatureFlag('cart');
  const { items, total } = useAppSelector(state => state.cart);
  const currency = useAppSelector(state => state.currency);
  const dispatch = useAppDispatch();

  const formatPrice = (price: number) => {
    const converted = price * (currency.rates[currency.current] || 1);
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  // Feature gate: show friendly message if cart is disabled
  if (!cartEnabled) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-surface-800 flex items-center justify-center mb-6">
          <FiShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Shopping Cart Not Available</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
          This space is currently set up for information only. Shopping features are not enabled.
        </p>
        <Link href="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-surface-800 flex items-center justify-center mb-6">
          <FiShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
          Looks like you haven&apos;t added anything to your cart yet. Browse our products to find something you love.
        </p>
        <Link href="/products" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <button
          onClick={() => dispatch(clearCart())}
          className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="glass-card p-4 sm:p-6 flex gap-4 sm:gap-6">
              {/* Image */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-surface-800 flex-shrink-0">
                <Image
                  src={item.image || '/placeholder.png'}
                  alt={item.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    {item.variant && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Variant: {item.variant}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => dispatch(removeItem(item.id))}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-4">
                  {/* Quantity */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-surface-800 rounded-xl">
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            id: item.id,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        )
                      }
                      disabled={item.quantity <= 1}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-gray-900 dark:text-white text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            id: item.id,
                            quantity: item.quantity + 1,
                          })
                        )
                      }
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      aria-label="Increase quantity"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price */}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors mt-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className="text-green-600 dark:text-green-400">Free</span>
              </div>
              <div className="border-t border-gray-200 dark:border-surface-700 pt-3 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary w-full mt-6 text-center block">
              Proceed to Checkout
            </Link>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
              <FiShield className="w-3.5 h-3.5" />
              <span>Secure checkout powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
