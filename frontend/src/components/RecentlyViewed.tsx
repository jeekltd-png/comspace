'use client';

// Recently Viewed Products - Track and display products user has viewed
// This is a quick-win feature that enhances UX with minimal effort

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  slug: string;
}

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('recentlyViewed');
    if (stored) {
      try {
        setRecentProducts(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing recently viewed:', error);
      }
    }
  }, []);

  const addToRecentlyViewed = (product: Product) => {
    setRecentProducts((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p._id !== product._id);
      // Add to beginning
      const updated = [product, ...filtered].slice(0, 10); // Keep only 10
      // Save to localStorage
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentProducts([]);
    localStorage.removeItem('recentlyViewed');
  };

  return {
    recentProducts,
    addToRecentlyViewed,
    clearRecentlyViewed,
  };
}

// Component to display recently viewed products
export default function RecentlyViewed({ locale }: { locale: string }) {
  const { recentProducts } = useRecentlyViewed();

  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recentProducts.map((product) => (
            <Link
              key={product._id}
              href={`/${locale}/products/${product.slug}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="aspect-square relative mb-3 overflow-hidden rounded-md">
                <Image
                  src={product.images[0] || '/images/placeholder.png'}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="text-sm font-medium line-clamp-2 mb-2">
                {product.name}
              </h3>
              <p className="text-lg font-bold text-blue-600">
                ${product.price.toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Usage in Product Detail Page:
// import { useRecentlyViewed } from '@/components/RecentlyViewed';
// 
// export default function ProductDetailPage({ product }) {
//   const { addToRecentlyViewed } = useRecentlyViewed();
//   
//   useEffect(() => {
//     addToRecentlyViewed(product);
//   }, [product]);
//   
//   return (
//     <div>
//       {/* Product details */}
//       <RecentlyViewed locale={locale} />
//     </div>
//   );
// }
