'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface Vendor {
  _id: string;
  storeName: string;
  slug: string;
  contactEmail?: string;
  isApproved: boolean;
  isActive: boolean;
  totalProducts: number;
  totalSales: number;
  rating: { average: number; count: number };
  createdAt: string;
  userId?: { firstName: string; lastName: string; email: string; avatar?: string };
}

export default function AdminVendorsPage() {
  const { user, loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchVendors = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (filter) params.status = filter;
      if (search) params.search = search;

      const resp = await apiClient.get('/vendors/admin/all', { params });
      setVendors(resp.data.data.vendors);
      setPagination(resp.data.data.pagination);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchVendors();
    }
  }, [user, authLoading, filter]);

  const handleApproval = async (vendorId: string, approved: boolean) => {
    try {
      await apiClient.patch(`/vendors/admin/${vendorId}/approve`, { approved });
      setVendors((prev) =>
        prev.map((v) => (v._id === vendorId ? { ...v, isApproved: approved } : v))
      );
    } catch (err) {
      console.error('Failed to update approval:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors(1);
  };

  if (authLoading) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse h-64 bg-gray-200 dark:bg-surface-700 rounded-2xl" />
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination.total} vendor{pagination.total !== 1 ? 's' : ''} registered
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2">
          {[
            { label: 'All', value: '' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === btn.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by store name..."
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
          />
          <button
            type="submit"
            className="bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-300"
          >
            Search
          </button>
        </form>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-surface-700 rounded-xl" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'pending'
              ? 'No pending vendor applications.'
              : 'No vendors registered yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-surface-800">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor._id}
                  className="border-b border-gray-100 dark:border-surface-800 last:border-0 hover:bg-gray-50 dark:hover:bg-surface-800/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {vendor.storeName}
                      </p>
                      <p className="text-xs text-gray-400">{vendor.contactEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {vendor.userId
                      ? `${vendor.userId.firstName} ${vendor.userId.lastName}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {vendor.totalProducts}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-amber-500">★</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {vendor.rating.average.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${
                        vendor.isApproved
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {vendor.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!vendor.isApproved ? (
                        <button
                          onClick={() => handleApproval(vendor._id, true)}
                          className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 px-3 py-1 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproval(vendor._id, false)}
                          className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-3 py-1 rounded-lg transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                      <Link
                        href={`/vendors/${vendor.slug}`}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-surface-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchVendors(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-surface-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-surface-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchVendors(pagination.page + 1)}
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
