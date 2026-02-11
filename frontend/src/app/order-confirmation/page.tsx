'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiPackage, FiArrowRight, FiMail } from 'react-icons/fi';
import confetti from 'canvas-confetti';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger confetti on mount
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#c084fc', '#d8b4fe', '#ec4899', '#7c3aed'],
      });
    } catch {
      // canvas-confetti might not be installed; fail silently
    }

    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-surface-950 flex items-center justify-center px-4 py-20">
      <div className={`max-w-lg w-full transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="glass-card p-8 sm:p-12 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <FiCheckCircle className="w-10 h-10 text-green-500" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">
            Thank you for your purchase. Your order has been placed successfully.
          </p>

          {/* Order ID */}
          {orderId && (
            <div className="bg-gray-50 dark:bg-surface-800 rounded-2xl p-4 mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Order Number</p>
              <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                {orderId.length > 12 ? `#${orderId.slice(-8).toUpperCase()}` : `#${orderId.toUpperCase()}`}
              </p>
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20">
              <FiMail className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Confirmation Email</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">We&apos;ve sent a receipt to your email address.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <FiPackage className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Shipping Updates</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Track your order status in your orders page.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/orders" className="btn-primary flex-1 flex items-center justify-center gap-2">
              View My Orders <FiArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/products" className="btn-ghost flex-1">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
