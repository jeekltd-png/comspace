import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-brand-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">About ComSpace</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">Your trusted multi-tenant e-commerce platform built for the modern web</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-6">Who We Are</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              ComSpace is a cutting-edge multi-tenant e-commerce platform designed to empower merchants
              and provide customers with an exceptional shopping experience. Built with modern
              technologies, we offer a scalable and reliable platform for online commerce.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {[
              { title: 'Multi-Language', desc: '17 languages including English, Spanish, French, Arabic, German, and more.', icon: '🌍' },
              { title: 'Secure Payments', desc: 'Integration with Stripe ensures your transactions are safe and encrypted.', icon: '🔒' },
              { title: 'Real-time Inventory', desc: 'Our system tracks inventory in real-time for accurate stock information.', icon: '📦' },
              { title: 'Advanced Analytics', desc: 'Comprehensive analytics and reporting tools for merchants.', icon: '📊' },
            ].map(feature => (
              <div key={feature.title} className="glass-card p-6 text-center hover:shadow-brand transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-8 md:p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Technology Stack</h2>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB', 'Redis', 'Stripe', 'next-intl'].map(tech => (
                <span key={tech} className="px-4 py-2 rounded-full bg-gray-100 dark:bg-surface-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              Start Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
