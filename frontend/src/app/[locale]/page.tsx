import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { FeaturedProducts } from '@/components/products/FeaturedProducts';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { PerksStrip } from '@/components/home/PerksStrip';
import { FiArrowRight } from 'react-icons/fi';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  const safe = (fn: () => string, fallback: string) => {
    try {
      const v = fn();
      if (!v || typeof v !== 'string') return fallback;
      return v;
    } catch {
      return fallback;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Language switcher floating */}
      <div className="fixed top-20 right-4 z-40">
        <LanguageSwitcher currentLocale={locale} />
      </div>

      <Hero />
      <Categories />

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              {safe(() => t('home.featured.subtitle'), 'Handpicked for you')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-1">
              {safe(() => t('home.featured.title'), 'Featured Products')}
            </h2>
          </div>
          <Link
            href={`/${locale}/products`}
            className="hidden sm:flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors group"
          >
            {safe(() => t('home.featured.viewAll'), 'View All')}
            <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <FeaturedProducts />
        <Link
          href={`/${locale}/products`}
          className="sm:hidden flex items-center justify-center gap-2 mt-8 btn-secondary w-full"
        >
          {safe(() => t('home.featured.viewAll'), 'View All Products')}
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Perks Strip */}
      <PerksStrip />
    </div>
  );
}
