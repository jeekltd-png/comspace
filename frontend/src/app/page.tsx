import Link from 'next/link';
import { FeaturedProducts } from '@/components/products/FeaturedProducts';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Categories />
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Link
            href="/products"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            View All →
          </Link>
        </div>
        <FeaturedProducts />
      </section>
    </div>
  );
}
