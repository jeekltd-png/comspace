import { getTranslations } from 'next-intl/server';

export default async function ShippingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Shipping Information</h1>
          <p className="text-xl">Everything you need to know about delivery</p>
        </div>
      </section>

      {/* Shipping Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            {/* Shipping Options */}
            <h2 className="text-3xl font-bold mb-6">Shipping Options</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Standard Shipping</h3>
                <p className="text-2xl font-bold text-blue-600 mb-3">FREE</p>
                <p className="text-gray-600 mb-4">On orders over $50</p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 5-7 business days</li>
                  <li>• Track your package</li>
                  <li>• $4.99 on orders under $50</li>
                </ul>
              </div>
              <div className="border rounded-lg p-6 border-blue-600">
                <h3 className="text-xl font-semibold mb-3">Express Shipping</h3>
                <p className="text-2xl font-bold text-blue-600 mb-3">$14.99</p>
                <p className="text-gray-600 mb-4">Fast delivery</p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 2-3 business days</li>
                  <li>• Priority handling</li>
                  <li>• Real-time tracking</li>
                </ul>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Overnight</h3>
                <p className="text-2xl font-bold text-blue-600 mb-3">$29.99</p>
                <p className="text-gray-600 mb-4">Next day delivery</p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 1 business day</li>
                  <li>• Order by 2 PM EST</li>
                  <li>• Signature required</li>
                </ul>
              </div>
            </div>

            {/* International Shipping */}
            <h2 className="text-3xl font-bold mb-6 mt-12">International Shipping</h2>
            <p className="text-gray-600 mb-6">
              We proudly ship to over 100 countries worldwide. International shipping rates and delivery times vary by destination.
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Canada & Mexico: 7-10 business days</li>
              <li>Europe: 10-14 business days</li>
              <li>Asia Pacific: 10-15 business days</li>
              <li>Rest of World: 14-21 business days</li>
            </ul>
            <p className="text-gray-600 mb-8">
              <strong>Note:</strong> International customers are responsible for any customs duties or import taxes.
            </p>

            {/* Order Processing */}
            <h2 className="text-3xl font-bold mb-6">Order Processing</h2>
            <p className="text-gray-600 mb-6">
              Orders are processed Monday through Friday (excluding holidays). Orders placed after 2:00 PM EST will be processed the next business day.
            </p>

            {/* Tracking */}
            <h2 className="text-3xl font-bold mb-6">Package Tracking</h2>
            <p className="text-gray-600 mb-6">
              Once your order ships, you'll receive a confirmation email with your tracking number. You can track your package at any time by:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Clicking the tracking link in your shipping confirmation email</li>
              <li>Logging into your account and viewing order history</li>
              <li>Contacting customer support with your order number</li>
            </ul>

            {/* Shipping Restrictions */}
            <h2 className="text-3xl font-bold mb-6">Shipping Restrictions</h2>
            <p className="text-gray-600 mb-6">
              Currently, we do not ship to PO boxes or APO/FPO addresses. All shipments require a signature upon delivery for orders over $500.
            </p>

            {/* Contact */}
            <div className="mt-12 bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Questions about shipping?</h3>
              <p className="text-gray-600 mb-6">
                Our customer service team is here to help with any shipping-related questions.
              </p>
              <a
                href="/contact"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
