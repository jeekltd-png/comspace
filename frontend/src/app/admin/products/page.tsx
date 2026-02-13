'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { FiPlus, FiSearch, FiChevronLeft, FiChevronRight, FiEdit2, FiAlertTriangle } from 'react-icons/fi';

interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  stock: number;
  lowStockThreshold: number;
  isUnlimited: boolean;
  category: string;
  isActive: boolean;
  images: string[];
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/products?page=${page}&limit=${limit}`);
      setProducts(res.data.data.products);
      setTotal(res.data.data.pagination.total);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = search
    ? products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🛍️ Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <Link
            href="/admin/product/create"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No products found</p>
            <Link href="/admin/product/create" className="text-brand-600 hover:underline text-sm">Create your first product →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-surface-800">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">SKU</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Price</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Stock</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const lowStock = !product.isUnlimited && product.stock <= (product.lowStockThreshold || 5);
                  const outOfStock = !product.isUnlimited && product.stock === 0;

                  return (
                    <tr key={product._id} className="border-b border-gray-50 dark:border-surface-800 hover:bg-gray-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-surface-800 flex items-center justify-center text-gray-400 text-xs">IMG</div>
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-500">{product.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">${product.price?.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {product.isUnlimited ? (
                          <span className="text-xs text-green-600">∞ Unlimited</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {(outOfStock || lowStock) && <FiAlertTriangle className={`w-3 h-3 ${outOfStock ? 'text-red-500' : 'text-yellow-500'}`} />}
                            <span className={`text-sm ${outOfStock ? 'text-red-500 font-semibold' : lowStock ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-300'}`}>
                              {product.stock}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 capitalize">{product.category || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {product.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/product/${product._id}/edit`} className="text-brand-600 hover:text-brand-700">
                          <FiEdit2 className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-surface-800">
            <p className="text-xs text-gray-500">Page {page} of {totalPages} ({total} products)</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-800 disabled:opacity-50">
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-800 disabled:opacity-50">
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
