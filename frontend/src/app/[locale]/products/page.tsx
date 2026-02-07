import React from 'react';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';

async function fetchProducts() {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${base}/products?limit=50`, { cache: 'no-store' });
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.data?.products ?? [];
  } catch (e) {
    return [];
  }
}

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;
  const products = await fetchProducts();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Products</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover our collection of {products.length} amazing products
          </p>
        </div>

        {products.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                No products found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by adding some products to your store.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-mono">
                  npm --prefix backend run seed:sample
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {products.map((product: any) => (
                <ProductCard key={product._id} product={product} locale={locale} />
              ))}
            </div>

            {/* Recently Viewed */}
            <RecentlyViewed locale={locale} />
          </>
        )}
      </div>
    </main>
  );
}
