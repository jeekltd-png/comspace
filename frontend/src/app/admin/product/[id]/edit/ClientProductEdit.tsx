'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { productSchema, type ProductFormData } from '@/lib/validations';
import {
  FiChevronLeft,
  FiSave,
  FiTrash2,
  FiLoader,
  FiImage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Props {
  productId: string;
}

export default function ClientProductEdit({ productId }: Props) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAdmin =
    !!user &&
    (user.role === 'admin' ||
      user.role === 'merchant' ||
      user.role === 'superadmin' ||
      user.role?.startsWith?.('admin'));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  // Fetch existing product
  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/products/${productId}`);
      return res.data.data;
    },
    enabled: !!productId && isAdmin,
  });

  // Pre-fill form when product loads
  useEffect(() => {
    if (product) {
      reset({
        name: product.name || '',
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        basePrice: product.price ?? product.basePrice ?? 0,
        compareAtPrice: product.compareAtPrice ?? undefined,
        sku: product.sku || '',
        category: product.category || '',
        stock: product.stock ?? product.inventory ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 5,
        isUnlimited: product.isUnlimited ?? false,
        isActive: product.isActive ?? true,
      });
    }
  }, [product, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const res = await apiClient.put(`/admin/products/${productId}`, {
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        price: data.basePrice,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice,
        sku: data.sku,
        category: data.category,
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        isUnlimited: data.isUnlimited,
        isActive: data.isActive,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
      router.push('/admin/products');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update product');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/admin/products/${productId}`);
    },
    onSuccess: () => {
      toast.success('Product deleted');
      router.push('/admin/products');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FiLoader className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">You are not authorized to edit products.</p>
        <Link href="/admin" className="text-brand-600 hover:underline mt-2 inline-block">
          Back to Admin
        </Link>
      </div>
    );
  }

  const isUnlimited = watch('isUnlimited');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="btn-ghost p-2">
            <FiChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: <span className="font-mono">{productId}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
        >
          <FiTrash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              {...register('name')}
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
              placeholder="e.g. Wireless Bluetooth Headphones"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Short Description
            </label>
            <input
              id="shortDescription"
              {...register('shortDescription')}
              className="input-field"
              placeholder="Brief product summary for listings"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Full Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="input-field"
              placeholder="Detailed product description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                SKU
              </label>
              <input
                id="sku"
                {...register('sku')}
                className="input-field font-mono"
                placeholder="PRD-001"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category
              </label>
              <input
                id="category"
                {...register('category')}
                className="input-field"
                placeholder="Electronics, Clothing, etc."
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  {...register('basePrice')}
                  className={`input-field pl-8 ${errors.basePrice ? 'border-red-400' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice.message}</p>}
            </div>
            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Compare-at Price <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  {...register('compareAtPrice')}
                  className="input-field pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('isUnlimited')}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Unlimited stock (don&apos;t track inventory)</span>
          </label>

          {!isUnlimited && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Stock Quantity
                </label>
                <input
                  id="stock"
                  type="number"
                  {...register('stock')}
                  className={`input-field ${errors.stock ? 'border-red-400' : ''}`}
                  placeholder="0"
                />
                {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
              </div>
              <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Low Stock Alert Threshold
                </label>
                <input
                  id="lowStockThreshold"
                  type="number"
                  {...register('lowStockThreshold')}
                  className="input-field"
                  placeholder="5"
                />
              </div>
            </div>
          )}
        </div>

        {/* Status & Images */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active (visible in store)</span>
          </label>

          {/* Product Images Preview */}
          {product?.images && product.images.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Images</p>
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img: string, i: number) => (
                  <div key={i} className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-800 border border-gray-200 dark:border-surface-700">
                    <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href="/admin/products" className="btn-ghost">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
