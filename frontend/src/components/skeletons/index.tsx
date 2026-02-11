export function ProductCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-gray-200 dark:bg-surface-800" />
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-3/4" />
        {/* Price */}
        <div className="h-5 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/3" />
        {/* Rating */}
        <div className="h-3 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/2" />
        {/* Button */}
        <div className="h-10 bg-gray-200 dark:bg-surface-700 rounded-xl w-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square bg-gray-200 dark:bg-surface-800 rounded-2xl" />
        {/* Details */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded-lg w-3/4" />
          <div className="h-6 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/4" />
          <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/3" />
          <div className="space-y-2 mt-6">
            <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-full" />
            <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-4/6" />
          </div>
          <div className="h-12 bg-gray-200 dark:bg-surface-700 rounded-xl w-full mt-8" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-surface-700 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
          {[1, 2, 3, 4].map(j => (
            <div key={j} className="h-4 bg-gray-100 dark:bg-surface-800 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
