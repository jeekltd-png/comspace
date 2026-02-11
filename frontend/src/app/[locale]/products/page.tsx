import React from 'react';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiPackage } from 'react-icons/fi';

const PRODUCTS_PER_PAGE = 12;

async function fetchProducts(page: number) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(
      `${base}/products?limit=${PRODUCTS_PER_PAGE}&page=${page}&isActive=true`,
      { next: { revalidate: 60 } } // ISR: revalidate every 60s
    );
    if (!res.ok) return { products: [], total: 0 };
    const payload = await res.json();
    return {
      products: payload?.data?.products ?? [],
      total: payload?.data?.total ?? payload?.data?.products?.length ?? 0,
    };
  } catch {
    return { products: [], total: 0 };
  }
}

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp?.page || '1', 10) || 1);
  const { products, total } = await fetchProducts(currentPage);
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href={`/${locale}`} className="hover:text-brand-600 transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white font-medium">Products</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            Our Products
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {total > 0
              ? `Showing ${(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–${Math.min(currentPage * PRODUCTS_PER_PAGE, total)} of ${total} products`
              : 'No products available yet'}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <FiPackage className="w-8 h-8 text-brand-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No products found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Products will appear here once they&apos;re added to the store.
            </p>
            <code className="inline-block bg-gray-100 dark:bg-surface-800 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300">
              npm --prefix backend run seed:sample
            </code>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {products.map((product: any) => (
                <ProductCard key={product._id} product={product} locale={locale} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2" aria-label="Products pagination">
                {/* Previous */}
                {currentPage > 1 ? (
                  <Link
                    href={`/${locale}/products?page=${currentPage - 1}`}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
                  >
                    <FiChevronLeft className="w-4 h-4" /> Previous
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed">
                    <FiChevronLeft className="w-4 h-4" /> Previous
                  </span>
                )}

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                      ) : (
                        <Link
                          key={item}
                          href={`/${locale}/products?page=${item}`}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                            item === currentPage
                              ? 'bg-brand-600 text-white shadow-brand'
                              : 'bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600'
                          }`}
                          aria-current={item === currentPage ? 'page' : undefined}
                        >
                          {item}
                        </Link>
                      )
                    )}
                </div>

                {/* Next */}
                {currentPage < totalPages ? (
                  <Link
                    href={`/${locale}/products?page=${currentPage + 1}`}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
                  >
                    Next <FiChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed">
                    Next <FiChevronRight className="w-4 h-4" />
                  </span>
                )}
              </nav>
            )}

            {/* Recently Viewed */}
            <div className="mt-16">
              <RecentlyViewed locale={locale} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
