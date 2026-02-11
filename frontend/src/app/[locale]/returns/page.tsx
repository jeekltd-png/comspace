import { getTranslations } from 'next-intl/server';

export default async function ReturnsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Returns & Exchanges</h1>
          <p className="text-xl">Simple and hassle-free returns</p>
        </div>
      </section>

      {/* Returns Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            {/* Return Policy */}
            <h2 className="text-3xl font-bold mb-6">Our Return Policy</h2>
            <p className="text-gray-600 mb-6">
              We want you to be completely satisfied with your purchase. If you're not happy with your order, we offer a <strong>30-day return policy</strong> from the date of delivery.
            </p>

            {/* What Can Be Returned */}
            <h2 className="text-3xl font-bold mb-6 mt-12">What Can Be Returned</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-green-800">✓ Items Eligible for Return</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Unused items in original packaging</li>
                <li>Items with all tags and labels attached</li>
                <li>Products in resalable condition</li>
                <li>Defective or damaged items</li>
                <li>Wrong item received</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-red-800">✗ Items Not Eligible for Return</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Personal care items (opened)</li>
                <li>Food and perishable goods</li>
                <li>Gift cards</li>
                <li>Downloadable software or digital products</li>
                <li>Custom or personalized items</li>
                <li>Items returned after 30 days</li>
              </ul>
            </div>

            {/* How to Return */}
            <h2 className="text-3xl font-bold mb-6">How to Return an Item</h2>
            <div className="space-y-6 mb-12">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Start Your Return</h3>
                  <p className="text-gray-600">
                    Log into your account and go to Order History. Find your order and click "Request Return."
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Print Return Label</h3>
                  <p className="text-gray-600">
                    Once approved, you'll receive a prepaid return shipping label via email. Print it out.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Pack Your Item</h3>
                  <p className="text-gray-600">
                    Securely pack the item in its original packaging if possible. Attach the return label to the outside of the box.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Ship It Back</h3>
                  <p className="text-gray-600">
                    Drop off your package at any authorized shipping location. Keep your receipt as proof of return.
                  </p>
                </div>
              </div>
            </div>

            {/* Refunds */}
            <h2 className="text-3xl font-bold mb-6">Refunds</h2>
            <p className="text-gray-600 mb-6">
              Once we receive your return, we'll inspect it and process your refund within <strong>5-7 business days</strong>. The refund will be credited to your original payment method.
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-8 space-y-2">
              <li>Credit cards: 5-10 business days</li>
              <li>PayPal: 3-5 business days</li>
              <li>Original shipping charges are non-refundable (except for defective items)</li>
            </ul>

            {/* Exchanges */}
            <h2 className="text-3xl font-bold mb-6">Exchanges</h2>
            <p className="text-gray-600 mb-8">
              We don't offer direct exchanges. If you need a different size, color, or item, please return the original item and place a new order.
            </p>

            {/* Damaged Items */}
            <h2 className="text-3xl font-bold mb-6">Damaged or Defective Items</h2>
            <p className="text-gray-600 mb-6">
              If you receive a damaged or defective item, please contact us within <strong>48 hours</strong> of delivery. We'll arrange for a replacement or full refund at no cost to you.
            </p>

            {/* Contact */}
            <div className="mt-12 bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Need help with a return?</h3>
              <p className="text-gray-600 mb-6">
                Our customer service team is ready to assist you with any questions about returns or exchanges.
              </p>
              <div className="flex gap-4">
                <a
                  href="/contact"
                  className="inline-block bg-brand-600 text-white px-8 py-3 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Contact Support
                </a>
                <a
                  href="/profile"
                  className="inline-block border border-brand-600 text-brand-600 px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  View Orders
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
