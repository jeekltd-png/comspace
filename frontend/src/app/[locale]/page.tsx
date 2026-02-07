import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  const safe = (fn: () => string, fallback: string) => {
    try {
      const v = fn();
      // if the translation returns the key itself (sometimes used as fallback), still use fallback
      if (!v || typeof v !== 'string' || v.includes('.') && v.split('.').length > 1 && v === fn.toString()) return fallback;
      return v;
    } catch (e) {
      // When translations are missing, fall back to English copy to avoid crashes/hydration errors
      // eslint-disable-next-line no-console
      console.warn('[i18n] missing translation, using fallback', e);
      return fallback;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with Language Switcher */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{safe(() => t('home.hero.title'), 'Welcome to ComSpace')}</h1>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <h2 className="text-5xl font-bold mb-4">{safe(() => t('home.hero.title'), 'Welcome to ComSpace')}</h2>
        <p className="text-xl text-gray-600 mb-8">{safe(() => t('home.hero.subtitle'), 'Your One-Stop Shop for Everything')}</p>
        <div className="space-x-4">
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {safe(() => t('home.hero.shopNow'), 'Shop Now')}
          </Link>
          <Link
            href="/about"
            className="inline-block px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {safe(() => t('home.hero.learnMore'), 'Learn More')}
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold mb-8">{safe(() => t('home.featured.title'), 'Featured Products')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Product cards would go here */}
          </div>
        </div>
      </section>
    </div>
  );
}
