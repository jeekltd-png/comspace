'use client';

import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addItem } from '@/store/slices/cartSlice';
import { FiStar, FiMinus, FiPlus, FiShoppingCart, FiHeart, FiShare2, FiChevronLeft, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface ProductImage {
  url: string;
  alt: string;
}

interface Product {
  _id: string;
  name: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  images: ProductImage[];
  rating: { average: number; count: number };
  stock: number;
  sku: string;
  category?: { name: string; slug: string };
  variants?: Array<{ name: string; options: string[] }>;
  specifications?: Record<string, string>;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const currency = useAppSelector(state => state.currency);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${id}`);
      return response.data.data.product || response.data.data;
    },
  });

  const formatPrice = (price: number) => {
    const converted = price * (currency.rates[currency.current] || 1);
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addItem({
        id: `${product._id}-${Date.now()}`,
        productId: product._id,
        name: product.name,
        price: product.basePrice,
        quantity,
        image: product.images[0]?.url || '/placeholder.png',
      })
    );
    toast.success(`${product.name} added to cart!`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="aspect-square rounded-3xl bg-gray-200 dark:bg-surface-800 animate-pulse" />
          <div className="mt-8 lg:mt-0 space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-surface-800 rounded-xl w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-surface-800 rounded-lg w-1/2 animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-surface-800 rounded-xl w-1/3 animate-pulse mt-4" />
            <div className="h-24 bg-gray-200 dark:bg-surface-800 rounded-xl animate-pulse mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const discount = product.compareAtPrice
    ? Math.round((1 - product.basePrice / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <li><Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link></li>
          <li>/</li>
          <li><Link href="/products" className="hover:text-gray-900 dark:hover:text-white transition-colors">Products</Link></li>
          <li>/</li>
          <li className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-12">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 dark:bg-surface-800">
            <Image
              src={product.images[selectedImage]?.url || '/placeholder.png'}
              alt={product.images[selectedImage]?.alt || product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === i
                      ? 'border-brand-500'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-surface-600'
                  }`}
                >
                  <Image src={img.url} alt={img.alt || `View ${i + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-8 lg:mt-0">
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(product.rating.average)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-surface-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {product.rating.average.toFixed(1)} ({product.rating.count} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mt-6">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatPrice(product.basePrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Short Description */}
          <p className="text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Stock */}
          <div className="mt-6">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-surface-800 rounded-2xl w-fit">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                aria-label="Decrease quantity"
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold text-gray-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                aria-label="Increase quantity"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>

            <button className="p-3 rounded-2xl border border-gray-200 dark:border-surface-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition-colors" aria-label="Add to wishlist">
              <FiHeart className="w-5 h-5" />
            </button>

            <button className="p-3 rounded-2xl border border-gray-200 dark:border-surface-700 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-200 dark:hover:border-brand-900/50 transition-colors" aria-label="Share product">
              <FiShare2 className="w-5 h-5" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-surface-700">
            <div className="flex flex-col items-center text-center gap-2">
              <FiTruck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <FiShield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Secure Checkout</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <FiRefreshCw className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="flex gap-1 border-b border-gray-200 dark:border-surface-700">
          {(['description', 'specs', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab === 'specs' ? 'Specifications' : tab}
            </button>
          ))}
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {product.description || product.shortDescription}
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <dl className="divide-y divide-gray-200 dark:divide-surface-700">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex py-3">
                      <dt className="w-1/3 font-medium text-gray-900 dark:text-white text-sm">{key}</dt>
                      <dd className="w-2/3 text-gray-600 dark:text-gray-400 text-sm">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No specifications available.</p>
              )}
              {product.sku && (
                <p className="text-xs text-gray-400 mt-4">SKU: {product.sku}</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Reviews coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
