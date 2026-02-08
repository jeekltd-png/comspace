import Link from 'next/link';
import { FiSmartphone, FiShoppingBag, FiHome, FiActivity, FiBook, FiGift } from 'react-icons/fi';

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: FiSmartphone, color: 'from-blue-500 to-cyan-500' },
  { name: 'Fashion', slug: 'fashion', icon: FiShoppingBag, color: 'from-pink-500 to-rose-500' },
  { name: 'Home & Garden', slug: 'home-garden', icon: FiHome, color: 'from-emerald-500 to-teal-500' },
  { name: 'Sports', slug: 'sports', icon: FiActivity, color: 'from-orange-500 to-amber-500' },
  { name: 'Books', slug: 'books', icon: FiBook, color: 'from-brand-500 to-indigo-500' },
  { name: 'Gifts', slug: 'gifts', icon: FiGift, color: 'from-red-500 to-pink-500' },
];

export function Categories() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">Shop by Category</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">Browse our curated collections</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group glass-card p-6 text-center hover:shadow-glass-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{category.name}</h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
