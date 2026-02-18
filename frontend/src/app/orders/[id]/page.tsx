'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import {
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiCreditCard,
  FiMapPin,
  FiMail,
  FiPhone,
  FiBox,
} from 'react-icons/fi';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images?: Array<{ url: string; alt: string }>;
  };
  quantity: number;
  price: number;
  variant?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    street?: string;
    address?: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
    phone?: string;
  };
  trackingNumber?: string;
  notes?: string;
}

/* ── Status config ──────────────────────────────────────────────────────── */

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: FiClock },
  { key: 'processing', label: 'Processing', icon: FiBox },
  { key: 'shipped', label: 'Shipped', icon: FiTruck },
  { key: 'delivered', label: 'Delivered', icon: FiCheckCircle },
];

const statusColorMap: Record<string, string> = {
  pending: 'text-yellow-600',
  processing: 'text-blue-600',
  shipped: 'text-purple-600',
  delivered: 'text-green-600',
  cancelled: 'text-red-600',
};

function getStepIndex(status: string): number {
  if (status === 'cancelled') return -1;
  const idx = statusSteps.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { token } = useAppSelector((state) => state.auth);
  const currency = useAppSelector((state) => state.currency);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data?.order || res.data.data;
    },
    enabled: !!token,
  });

  const formatPrice = (price: number) => {
    const converted = price * (currency.rates[currency.current] || 1);
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  /* ── Auth guard ─────────────────────────────────────────────────────── */

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <FiPackage className="w-16 h-16 text-gray-300 dark:text-surface-600 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sign in to view this order
        </h1>
        <Link href="/login" className="btn-primary mt-4">
          Sign In
        </Link>
      </div>
    );
  }

  /* ── Loading skeleton ───────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 dark:bg-surface-700 rounded w-48" />
          <div className="h-20 bg-gray-200 dark:bg-surface-700 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-surface-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <FiXCircle className="w-16 h-16 text-red-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Order not found
        </h1>
        <p className="text-gray-500 mb-6">
          This order doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/orders" className="btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────────────────── */

  const activeStep = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const addr = order.shippingAddress;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Back link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold capitalize
            ${statusColorMap[order.status] || 'text-gray-600'}
            ${isCancelled ? 'bg-red-100 dark:bg-red-900/20' : 'bg-brand-50 dark:bg-brand-900/20'}
          `}
        >
          {isCancelled ? <FiXCircle className="w-4 h-4" /> : <FiPackage className="w-4 h-4" />}
          {order.status}
        </span>
      </div>

      {/* ── Order Timeline ────────────────────────────────────────────── */}
      {!isCancelled && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Order Progress
          </h2>
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-surface-700 mx-8" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-brand-600 dark:bg-brand-400 mx-8 transition-all duration-500"
              style={{
                width: `${activeStep >= 0 ? (activeStep / (statusSteps.length - 1)) * 100 : 0}%`,
              }}
            />

            {statusSteps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i <= activeStep;
              const isCurrent = i === activeStep;

              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${
                        isCurrent
                          ? 'bg-brand-600 dark:bg-brand-500 text-white ring-4 ring-brand-100 dark:ring-brand-900/40'
                          : isActive
                          ? 'bg-brand-600 dark:bg-brand-500 text-white'
                          : 'bg-gray-200 dark:bg-surface-700 text-gray-400 dark:text-surface-500'
                      }
                    `}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium text-center ${
                      isActive
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-gray-400 dark:text-surface-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled notice */}
      {isCancelled && (
        <div className="glass-card p-6 mb-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
          <div className="flex items-center gap-3">
            <FiXCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                Order Cancelled
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                This order was cancelled on {formatDate(order.updatedAt)}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking number */}
      {order.trackingNumber && (
        <div className="glass-card p-4 mb-6 flex items-center gap-3 bg-purple-50 dark:bg-purple-900/10">
          <FiTruck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tracking Number</p>
            <p className="font-mono font-semibold text-gray-900 dark:text-white">
              {order.trackingNumber}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Items list ────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Items ({order.items.length})
            </h2>
            <div className="divide-y divide-gray-100 dark:divide-surface-700">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-800 flex-shrink-0">
                    <Image
                      src={item.product?.images?.[0]?.url || '/placeholder.png'}
                      alt={item.product?.name || 'Product'}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product?._id}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                    >
                      {item.product?.name || 'Product'}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Variant: {item.variant}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Payment summary */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCreditCard className="w-5 h-5" />
              Payment
            </h2>
            <div className="space-y-2 text-sm">
              {order.subtotal != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
              )}
              {order.shippingCost != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white">
                    {order.shippingCost === 0
                      ? 'Free'
                      : formatPrice(order.shippingCost)}
                  </span>
                </div>
              )}
              {order.tax != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(order.tax)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-surface-700 font-semibold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-brand-600 dark:text-brand-400 text-lg">
                  {formatPrice(order.total)}
                </span>
              </div>
              {order.paymentMethod && (
                <p className="text-xs text-gray-400 pt-1 capitalize">
                  Paid via {order.paymentMethod}
                </p>
              )}
            </div>
          </div>

          {/* Shipping address */}
          {addr && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiMapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {(addr.firstName || addr.lastName) && (
                  <p className="font-medium text-gray-900 dark:text-white">
                    {addr.firstName} {addr.lastName}
                  </p>
                )}
                <p>{addr.street || addr.address}</p>
                <p>
                  {addr.city}
                  {addr.state ? `, ${addr.state}` : ''} {addr.zipCode}
                </p>
                <p>{addr.country}</p>
                {addr.phone && (
                  <p className="flex items-center gap-1.5 pt-1 text-gray-400">
                    <FiPhone className="w-3.5 h-3.5" />
                    {addr.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Need help */}
          <div className="glass-card p-6 bg-gray-50 dark:bg-surface-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              If you have questions about this order, contact our support team.
            </p>
            <a
              href="mailto:support@comspace.app"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              <FiMail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
