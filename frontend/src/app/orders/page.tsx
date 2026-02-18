'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { FiPackage, FiChevronRight, FiShoppingBag, FiClock, FiCheckCircle, FiTruck, FiXCircle } from 'react-icons/fi';

interface OrderItem {
  product: { _id: string; name: string; images?: Array<{ url: string; alt: string }> };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  shippingAddress?: {
    city: string;
    country: string;
  };
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pending: { icon: FiClock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  processing: { icon: FiPackage, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-100 dark:bg-brand-900/30' },
  shipped: { icon: FiTruck, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  delivered: { icon: FiCheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  cancelled: { icon: FiXCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export default function OrdersPage() {
  const { token, user } = useAppSelector(state => state.auth);
  const currency = useAppSelector(state => state.currency);

  const { data, isLoading, error } = useQuery<{ orders: Order[] }>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await apiClient.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    enabled: !!token,
  });

  const formatPrice = (price: number) => {
    const converted = price * (currency.rates[currency.current] || 1);
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <FiPackage className="w-16 h-16 text-gray-300 dark:text-surface-600 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view orders</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
          You need to be signed in to see your order history.
        </p>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-200 dark:bg-surface-700 rounded-lg w-32" />
                <div className="h-6 bg-gray-200 dark:bg-surface-700 rounded-full w-24" />
              </div>
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 dark:bg-surface-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const orders = data?.orders || [];

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-surface-800 flex items-center justify-center mb-6">
          <FiShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
          When you place your first order, it will appear here.
        </p>
        <Link href="/products" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map(order => {
          const status = statusConfig[order.status] || statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <Link key={order._id} href={`/orders/${order._id}`} className="glass-card p-5 sm:p-6 hover:shadow-brand transition-shadow block cursor-pointer">
              {/* Order header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Order <span className="font-mono font-semibold text-gray-900 dark:text-white">#{order.orderNumber}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${status.color} ${status.bg}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {order.status}
                </div>
              </div>

              {/* Items preview */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {order.items.slice(0, 4).map((item, i) => (
                  <div
                    key={i}
                    className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-800 flex-shrink-0"
                  >
                    <Image
                      src={item.product?.images?.[0]?.url || '/placeholder.png'}
                      alt={item.product?.name || 'Product'}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    {item.quantity > 1 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    )}
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-500">+{order.items.length - 4}</span>
                  </div>
                )}
                <div className="flex-1" />
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                  <p className="text-xs text-gray-400">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
