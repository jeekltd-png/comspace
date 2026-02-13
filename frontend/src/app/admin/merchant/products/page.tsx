'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface Product {
  _id: string;
  name: string;
  sku: string;
  basePrice: number;
  stock: number;
  isActive: boolean;
  isUnlimited?: boolean;
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  category?: { name: string; slug: string };
  createdAt: string;
}

export default function MerchantProducts() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;

      const resp = await apiClient.get('/products/mine', { params });
      setProducts(resp.data.data.products);
      setPagination(resp.data.data.pagination);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'merchant') {
      fetchProducts();
    }
  }, [user, authLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination.total} total products
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/merchant"
            className="text-brand-600 dark:text-brand-400 hover:underline text-sm"
          >
            ← Dashboard
          </Link>
          <Link
            href="/admin/products/new"
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
          />
          <button
            type="submit"
            className="bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-300"
          >
            Search
          </button>
        </div>
      </form>

      {/* Products Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-surface-700 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No products yet.</p>
          <Link
            href="/admin/products/new"
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Create Your First Product
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-200 dark:border-surface-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-surface-800">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
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
              {products.map((product) => (
                <tr
                  key={product._id}
                  className="border-b border-gray-100 dark:border-surface-800 last:border-0 hover:bg-gray-50 dark:hover:bg-surface-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-surface-800 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0]?.url ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            📷
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </p>
                        {product.category && (
                          <p className="text-xs text-gray-400">{product.category.name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    ${product.basePrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {product.isUnlimited ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Unlimited</span>
                    ) : (
                      <span
                        className={
                          product.stock <= 5
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${
                        product.isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-surface-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="text-brand-600 dark:text-brand-400 hover:underline text-sm"
                    >
                      Edit
                    </Link>
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
                  onClick={() => fetchProducts(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-surface-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchProducts(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-200 dark:border-surface-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
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
