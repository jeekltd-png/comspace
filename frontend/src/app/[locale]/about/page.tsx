import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">About ComSpace</h1>
          <p className="text-xl">Your trusted multi-tenant e-commerce platform</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold mb-6">Who We Are</h2>
            <p className="text-gray-600 mb-6">
              ComSpace is a cutting-edge multi-tenant e-commerce platform designed to empower merchants
              and provide customers with an exceptional shopping experience. Built with modern
              technologies including Next.js, React, and Node.js, we offer a scalable and reliable
              platform for online commerce.
            </p>

            <h2 className="text-3xl font-bold mb-6 mt-12">Our Features</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Multi-Language Support</h3>
                <p className="text-gray-600">
                  We support 17 languages including English, Spanish, French, Arabic, German, and more,
                  making your shopping experience seamless in your preferred language.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
                <p className="text-gray-600">
                  Integration with Stripe and PayPal ensures your transactions are safe and secure.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Real-time Inventory</h3>
                <p className="text-gray-600">
                  Our system tracks inventory in real-time, ensuring accurate stock information.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Comprehensive analytics and reporting tools for merchants to track their business.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-6">Technology Stack</h2>
            <ul className="list-disc list-inside text-gray-600 mb-12 space-y-2">
              <li><strong>Frontend:</strong> Next.js 15, React 19, TypeScript, Tailwind CSS</li>
              <li><strong>Backend:</strong> Node.js, Express, MongoDB, Redis</li>
              <li><strong>Internationalization:</strong> next-intl with 17 language support</li>
              <li><strong>State Management:</strong> Redux Toolkit</li>
              <li><strong>Testing:</strong> Jest, React Testing Library</li>
            </ul>

            <div className="text-center mt-12">
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
