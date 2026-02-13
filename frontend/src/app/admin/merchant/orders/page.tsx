'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface OrderItem {
  product: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  currency: string;
  image?: string;
}

interface MerchantOrder {
  _id: string;
  orderNumber: string;
  user: { firstName: string; lastName: string; email: string };
  items: OrderItem[];
  merchantSubtotal: number;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  processing: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  shipped: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  delivered: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'ready-for-pickup': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
};

export default function MerchantOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (filter) params.status = filter;

      const resp = await apiClient.get('/vendors/me/orders', { params });
      setOrders(resp.data.data.orders);
      setPagination(resp.data.data.pagination);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'merchant') {
      fetchOrders();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user?.role === 'merchant') {
      fetchOrders(1);
    }
  }, [filter]);

  if (authLoading) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse h-64 bg-gray-200 dark:bg-surface-700 rounded-2xl" />
      </main>
    );
  }

  if (!user || user.role !== 'merchant') {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">Merchant access required</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Orders containing your products
          </p>
        </div>
        <Link
          href="/admin/merchant"
          className="text-brand-600 dark:text-brand-400 hover:underline text-sm"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-700'
              }`}
            >
              {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          )
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-surface-700 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {filter ? `No ${filter} orders.` : 'No orders yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${
                      statusColors[order.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {order.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    ${order.merchantSubtotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Customer: {order.user.firstName} {order.user.lastName} ({order.user.email})
              </p>

              <div className="border-t border-gray-100 dark:border-surface-800 pt-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-400">× {item.quantity}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchOrders(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-surface-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-surface-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchOrders(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-surface-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-surface-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
