'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import {
  FiTag, FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiPercent, FiDollarSign, FiCalendar, FiCheckCircle,
  FiXCircle, FiCopy, FiX, FiSave,
} from 'react-icons/fi';

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM: {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
} = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscount: 0,
  usageLimit: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/coupons');
      setCoupons(res.data.data.coupons);
    } catch {
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c._id);
    setForm({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount,
      maxDiscount: c.maxDiscount || 0,
      usageLimit: c.usageLimit,
      startDate: c.startDate.split('T')[0],
      endDate: c.endDate.split('T')[0],
    });
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiClient.patch(`/coupons/${editingId}`, form);
        setMessage('Coupon updated');
      } else {
        await apiClient.post('/coupons', form);
        setMessage('Coupon created');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await apiClient.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch {
      alert('Failed to delete coupon');
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await apiClient.patch(`/coupons/${c._id}`, { isActive: !c.isActive });
      fetchCoupons();
    } catch {
      alert('Failed to update coupon');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const filtered = search
    ? coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      )
    : coupons;

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiTag className="w-6 h-6" /> Coupons & Discounts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{coupons.length} total coupons</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coupons..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" /> New Coupon
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
          <FiCheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      {/* Coupons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-surface-800 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl p-12 text-center">
          <FiTag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No coupons found</p>
          <button onClick={openCreate} className="text-brand-600 text-sm hover:underline mt-2">
            Create your first coupon →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((coupon) => (
            <div
              key={coupon._id}
              className={`bg-white dark:bg-surface-900 border rounded-2xl p-5 transition-all ${
                !coupon.isActive || isExpired(coupon.endDate)
                  ? 'border-gray-200 dark:border-surface-700 opacity-60'
                  : 'border-brand-200 dark:border-brand-800 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCode(coupon.code)}
                    className="font-mono text-lg font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
                    title="Copy code"
                  >
                    {coupon.code}
                    <FiCopy className="w-3.5 h-3.5 opacity-50" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(coupon)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      coupon.isActive
                        ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-800'
                    }`}
                    title={coupon.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {coupon.isActive ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(coupon)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-50 dark:hover:bg-surface-800 rounded-lg">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(coupon._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {coupon.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{coupon.description}</p>
              )}

              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400">
                  {coupon.discountType === 'percentage' ? (
                    <><FiPercent className="w-3.5 h-3.5" /> {coupon.discountValue}% OFF</>
                  ) : (
                    <><FiDollarSign className="w-3.5 h-3.5" /> ${coupon.discountValue} OFF</>
                  )}
                </span>
                {isExpired(coupon.endDate) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">Expired</span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <FiCalendar className="w-3 h-3" />
                  {new Date(coupon.startDate).toLocaleDateString()} — {new Date(coupon.endDate).toLocaleDateString()}
                </div>
                {coupon.minOrderAmount > 0 && (
                  <div>Min order: ${coupon.minOrderAmount}</div>
                )}
                <div>
                  Used: {coupon.usedCount}{coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ' (unlimited)'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-surface-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Coupon' : 'New Coupon'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Code</span>
                <input
                  className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm uppercase font-mono focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="SUMMER20"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
                <input
                  className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="20% off summer sale"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</span>
                  <select
                    className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Value</span>
                  <input
                    type="number"
                    className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    min={0}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Min order ($)</span>
                  <input
                    type="number"
                    className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                    min={0}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Max discount ($)</span>
                  <input
                    type="number"
                    className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                    min={0}
                    placeholder="0 = no limit"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Usage limit (0 = unlimited)</span>
                <input
                  type="number"
                  className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                  min={0}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Start date</span>
                  <input
                    type="date"
                    className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">End date</span>
                  <input
                    type="date"
                    className="mt-1 block w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </label>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-surface-800 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.code}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
