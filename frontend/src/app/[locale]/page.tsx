import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();

  return (
    <div className="min-h-screen">
      {/* Header with Language Switcher */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('home.hero.title')}</h1>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <h2 className="text-5xl font-bold mb-4">{t('home.hero.title')}</h2>
        <p className="text-xl text-gray-600 mb-8">{t('home.hero.subtitle')}</p>
        <div className="space-x-4">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {t('home.hero.shopNow')}
          </button>
          <button className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            {t('home.hero.learnMore')}
          </button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold mb-8">{t('home.featured.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Product cards would go here */}
          </div>
        </div>
      </section>
    </div>
  );
}
