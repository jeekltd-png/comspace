'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import {
  FiArrowLeft, FiPackage, FiUser, FiMail, FiPhone, FiMapPin,
  FiCreditCard, FiClock, FiTruck, FiCheckCircle, FiAlertCircle,
  FiDollarSign, FiHash, FiFileText, FiSend,
} from 'react-icons/fi';

// ─── Types ──────────────────────────────────────────────────────────────────
interface OrderItem {
  product: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  currency: string;
  image?: string;
  variant?: string;
}

interface StatusHistoryEntry {
  status: string;
  note?: string;
  timestamp: string;
}

interface OrderDetail {
  _id: string;
  orderNumber: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  discount?: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentType: string;
  deliveryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  pickupLocation?: string;
  notes?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out-for-delivery',
  'delivered',
  'ready-for-pickup',
  'picked-up',
  'cancelled',
  'refunded',
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  'out-for-delivery': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  'ready-for-pickup': 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  'picked-up': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <FiClock className="w-4 h-4" />,
  confirmed: <FiCheckCircle className="w-4 h-4" />,
  processing: <FiPackage className="w-4 h-4" />,
  shipped: <FiTruck className="w-4 h-4" />,
  'out-for-delivery': <FiTruck className="w-4 h-4" />,
  delivered: <FiCheckCircle className="w-4 h-4" />,
  'ready-for-pickup': <FiPackage className="w-4 h-4" />,
  'picked-up': <FiCheckCircle className="w-4 h-4" />,
  cancelled: <FiAlertCircle className="w-4 h-4" />,
  refunded: <FiDollarSign className="w-4 h-4" />,
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      setOrder(res.data.data.order);
      setNewStatus(res.data.data.order.status);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order?.status) return;
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const res = await apiClient.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        note: statusNote || undefined,
      });
      setOrder(res.data.data.order);
      setStatusNote('');
      setUpdateMsg({ type: 'success', text: `Status updated to "${newStatus.replace(/-/g, ' ')}"` });
    } catch (err: any) {
      setUpdateMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update status' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-surface-800 rounded-lg w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-surface-800 rounded-2xl" />
            <div className="h-32 bg-gray-200 dark:bg-surface-800 rounded-2xl" />
          </div>
          <div className="h-64 bg-gray-200 dark:bg-surface-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center">
        <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
        <button onClick={() => router.push('/admin/orders')} className="text-brand-600 hover:underline text-sm">
          ← Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Order {order.orderNumber}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusIcons[order.status]}
                {order.status.replace(/-/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-surface-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiPackage className="w-4 h-4 text-brand-500" />
                Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-surface-800">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 px-5 py-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100 dark:border-surface-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-surface-800 flex items-center justify-center">
                      <FiPackage className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {item.sku && <span className="flex items-center gap-1"><FiHash className="w-3 h-3" /> {item.sku}</span>}
                      {item.variant && <span>Variant: {item.variant}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Order Totals */}
            <div className="border-t border-gray-200 dark:border-surface-700 px-5 py-4 space-y-2 bg-gray-50/50 dark:bg-surface-800/50">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>{order.shippingFee > 0 ? `$${order.shippingFee.toFixed(2)}` : 'Free'}</span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-surface-700">
                <span>Total</span>
                <span>${order.total.toFixed(2)} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiSend className="w-4 h-4 text-brand-500" />
              Update Order Status
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Add a note (optional)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === order.status}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
            {updateMsg && (
              <p className={`text-sm mt-3 ${updateMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {updateMsg.text}
              </p>
            )}
          </div>

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiClock className="w-4 h-4 text-brand-500" />
                Order Timeline
              </h2>
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-surface-700" />
                <div className="space-y-4">
                  {[...order.statusHistory].reverse().map((entry, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        idx === 0
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 dark:bg-surface-800 text-gray-500'
                      }`}>
                        <span className="text-[10px]">{statusIcons[entry.status] || <FiClock className="w-3 h-3" />}</span>
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {entry.status.replace(/-/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Customer Notes */}
          {order.notes && (
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-brand-500" />
                Customer Notes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column – Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiUser className="w-4 h-4 text-brand-500" />
              Customer
            </h2>
            {order.user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {order.user.firstName?.[0]}{order.user.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <Link
                      href={`/admin/users`}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      View in Users
                    </Link>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-surface-800">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiMail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{order.user.email}</span>
                  </div>
                  {order.user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FiPhone className="w-4 h-4 text-gray-400" />
                      <span>{order.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Guest order</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCreditCard className="w-4 h-4 text-brand-500" />
              Payment
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Method</span>
                <span className="text-gray-900 dark:text-white capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className={`font-medium capitalize ${
                  order.paymentStatus === 'completed' ? 'text-green-600' :
                  order.paymentStatus === 'failed' ? 'text-red-500' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <span className="font-bold text-gray-900 dark:text-white">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Info */}
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiTruck className="w-4 h-4 text-brand-500" />
              Fulfillment
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Type</span>
                <span className="text-gray-900 dark:text-white capitalize">{order.fulfillmentType || 'delivery'}</span>
              </div>
              {order.fulfillmentType === 'pickup' && order.pickupLocation && (
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Pickup Location</p>
                  <p className="text-gray-900 dark:text-white">{order.pickupLocation}</p>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <FiMapPin className="w-3 h-3" /> Delivery Address
                  </p>
                  <div className="text-gray-900 dark:text-white text-sm leading-relaxed">
                    {order.deliveryAddress.street && <p>{order.deliveryAddress.street}</p>}
                    <p>
                      {[order.deliveryAddress.city, order.deliveryAddress.state].filter(Boolean).join(', ')}
                      {order.deliveryAddress.postalCode && ` ${order.deliveryAddress.postalCode}`}
                    </p>
                    {order.deliveryAddress.country && <p>{order.deliveryAddress.country}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
