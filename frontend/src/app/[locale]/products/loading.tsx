import { ProductGridSkeleton } from '@/components/skeletons';

export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb skeleton */}
        <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-32 mb-6 animate-pulse" />

        {/* Header skeleton */}
        <div className="mb-10 animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-surface-700 rounded-xl w-56 mb-3" />
          <div className="h-5 bg-gray-200 dark:bg-surface-700 rounded-lg w-40" />
        </div>

        {/* Products grid skeleton */}
        <ProductGridSkeleton count={12} />
      </div>
    </main>
  );
}
