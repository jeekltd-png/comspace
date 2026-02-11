import { getTranslations } from 'next-intl/server';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-xl">Last updated: February 2, 2026</p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            <h2 className="text-3xl font-bold mb-6">1. Introduction</h2>
            <p className="text-gray-600 mb-8">
              Welcome to ComSpace. These Terms and Conditions govern your use of our website and services. By accessing or using ComSpace, you agree to be bound by these terms. If you disagree with any part of these terms, you may not access our service.
            </p>

            <h2 className="text-3xl font-bold mb-6">2. Use of Service</h2>
            <h3 className="text-2xl font-semibold mb-4">2.1 Eligibility</h3>
            <p className="text-gray-600 mb-6">
              You must be at least 18 years old to use our service. By using ComSpace, you represent and warrant that you meet this age requirement.
            </p>
            <h3 className="text-2xl font-semibold mb-4">2.2 Account Registration</h3>
            <p className="text-gray-600 mb-6">
              When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <h3 className="text-2xl font-semibold mb-4">2.3 Prohibited Activities</h3>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-600 mb-8 space-y-2">
              <li>Use our service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Upload malicious code or viruses</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use automated systems to access the service</li>
            </ul>

            <h2 className="text-3xl font-bold mb-6">3. Products and Pricing</h2>
            <h3 className="text-2xl font-semibold mb-4">3.1 Product Information</h3>
            <p className="text-gray-600 mb-6">
              We make every effort to display product information accurately. However, we do not warrant that product descriptions, pricing, or other content is accurate, complete, or error-free.
            </p>
            <h3 className="text-2xl font-semibold mb-4">3.2 Pricing</h3>
            <p className="text-gray-600 mb-6">
              Prices are subject to change without notice. We reserve the right to modify or discontinue products at any time. In the event of a pricing error, we reserve the right to cancel orders placed at the incorrect price.
            </p>
            <h3 className="text-2xl font-semibold mb-4">3.3 Order Acceptance</h3>
            <p className="text-gray-600 mb-8">
              All orders are subject to acceptance by ComSpace. We may refuse or cancel any order for any reason, including product availability, errors in pricing, or suspected fraud.
            </p>

            <h2 className="text-3xl font-bold mb-6">4. Payment Terms</h2>
            <p className="text-gray-600 mb-6">
              Payment is due at the time of purchase. We accept major credit cards, PayPal, and other payment methods as indicated at checkout. By providing payment information, you represent that you are authorized to use the payment method.
            </p>

            <h2 className="text-3xl font-bold mb-6">5. Shipping and Delivery</h2>
            <p className="text-gray-600 mb-6">
              We will ship your order to the address you provide. Title and risk of loss pass to you upon delivery to the carrier. Delivery times are estimates and not guaranteed. See our <a href="/shipping" className="text-brand-600 hover:underline">Shipping Information</a> page for details.
            </p>

            <h2 className="text-3xl font-bold mb-6">6. Returns and Refunds</h2>
            <p className="text-gray-600 mb-6">
              Our return policy allows returns within 30 days of delivery for most items. See our <a href="/returns" className="text-brand-600 hover:underline">Returns & Exchanges</a> page for complete details.
            </p>

            <h2 className="text-3xl font-bold mb-6">7. Intellectual Property</h2>
            <p className="text-gray-600 mb-6">
              All content on ComSpace, including text, graphics, logos, images, and software, is the property of ComSpace or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
            </p>

            <h2 className="text-3xl font-bold mb-6">8. Limitation of Liability</h2>
            <p className="text-gray-600 mb-6">
              ComSpace shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Our total liability to you for all claims shall not exceed the amount you paid for the product or service in question.
            </p>

            <h2 className="text-3xl font-bold mb-6">9. Indemnification</h2>
            <p className="text-gray-600 mb-6">
              You agree to indemnify and hold ComSpace harmless from any claims, damages, liabilities, and expenses arising from your use of our service or violation of these terms.
            </p>

            <h2 className="text-3xl font-bold mb-6">10. Privacy</h2>
            <p className="text-gray-600 mb-6">
              Your use of ComSpace is also governed by our <a href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</a>. Please review our Privacy Policy to understand our practices.
            </p>

            <h2 className="text-3xl font-bold mb-6">11. Modifications to Terms</h2>
            <p className="text-gray-600 mb-6">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of ComSpace after changes constitutes acceptance of the modified terms.
            </p>

            <h2 className="text-3xl font-bold mb-6">12. Governing Law</h2>
            <p className="text-gray-600 mb-6">
              These terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-3xl font-bold mb-6">13. Contact Information</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <ul className="text-gray-600 mb-8 space-y-2">
              <li>Email: legal@comspace.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Commerce Street, Suite 456, New York, NY 10001</li>
            </ul>

            {/* Contact CTA */}
            <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Questions about our terms?</h3>
              <p className="text-gray-600 mb-6">
                Our legal team is available to answer any questions you may have.
              </p>
              <a
                href="/contact"
                className="inline-block bg-brand-600 text-white px-8 py-3 rounded-lg hover:bg-brand-700 transition-colors"
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
