import Link from 'next/link';

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: '📱' },
  { name: 'Fashion', slug: 'fashion', icon: '👕' },
  { name: 'Home & Garden', slug: 'home-garden', icon: '🏠' },
  { name: 'Sports', slug: 'sports', icon: '⚽' },
  { name: 'Books', slug: 'books', icon: '📚' },
  { name: 'Toys', slug: 'toys', icon: '🧸' },
];

export function Categories() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map(category => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center"
          >
            <div className="text-4xl mb-2">{category.icon}</div>
            <h3 className="font-semibold">{category.name}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
