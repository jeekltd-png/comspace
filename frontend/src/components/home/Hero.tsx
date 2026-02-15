'use client';

import Link from 'next/link';
import { FiArrowRight, FiShield, FiTruck, FiGlobe } from 'react-icons/fi';
import { Tooltip } from '@/components/ui/Tooltip';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-brand-300/30 via-transparent to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-accent-400/20 via-transparent to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="noise-bg absolute inset-0" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <Tooltip content="Pay in your local currency — we support USD, EUR, GBP, JPY, NGN, INR, BRL and 35+ more with real-time conversion rates." position="bottom" maxWidth={320}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-8 animate-fade-in cursor-help">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Now supporting 40+ currencies worldwide
          </div>
          </Tooltip>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            <span className="text-gray-900 dark:text-white">Shop the</span>
            <br />
            <span className="text-gradient">Future of Commerce</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Discover curated products from around the globe. Secure payments, real-time currency conversion, and lightning-fast delivery.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/products" className="btn-primary text-lg px-8 py-4 group">
              Explore Products
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/about" className="btn-secondary text-lg px-8 py-4">
              Learn More
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Tooltip content="256-bit SSL encryption on every transaction. Powered by Stripe for PCI-compliant payments." position="bottom">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 cursor-help">
              <FiShield className="w-5 h-5 text-brand-500" />
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            </Tooltip>
            <Tooltip content="Free standard shipping on all orders over $50. Express & international options available at checkout." position="bottom">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 cursor-help">
              <FiTruck className="w-5 h-5 text-brand-500" />
              <span className="text-sm font-medium">Free Shipping $50+</span>
            </div>
            </Tooltip>
            <Tooltip content="Shop in your local currency with real-time exchange rates. We support 40+ currencies worldwide." position="bottom">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 cursor-help">
              <FiGlobe className="w-5 h-5 text-brand-500" />
              <span className="text-sm font-medium">40+ Currencies</span>
            </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </section>
  );
}
