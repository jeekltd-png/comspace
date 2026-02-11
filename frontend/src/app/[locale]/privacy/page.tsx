import { getTranslations } from 'next-intl/server';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl">Last updated: February 2, 2026</p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            <h2 className="text-3xl font-bold mb-6">1. Introduction</h2>
            <p className="text-gray-600 mb-8">
              At ComSpace, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully.
            </p>

            <h2 className="text-3xl font-bold mb-6">2. Information We Collect</h2>
            <h3 className="text-2xl font-semibold mb-4">2.1 Personal Information</h3>
            <p className="text-gray-600 mb-4">We may collect personal information that you provide to us, including:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Name and contact information (email, phone, address)</li>
              <li>Account credentials (username, password)</li>
              <li>Payment information (credit card details, billing address)</li>
              <li>Order history and preferences</li>
              <li>Communications with customer service</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-4">2.2 Automatically Collected Information</h3>
            <p className="text-gray-600 mb-4">When you visit our website, we automatically collect:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages viewed and time spent on pages</li>
              <li>Referring website</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-4">2.3 Third-Party Information</h3>
            <p className="text-gray-600 mb-8">
              We may receive information about you from third-party services such as social media platforms, payment processors, and analytics providers.
            </p>

            <h2 className="text-3xl font-bold mb-6">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-600 mb-8 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders and account</li>
              <li>Provide customer support</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-3xl font-bold mb-6">4. Information Sharing</h2>
            <p className="text-gray-600 mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li><strong>Service Providers:</strong> Payment processors, shipping carriers, email service providers</li>
              <li><strong>Business Partners:</strong> With your consent for co-marketing activities</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="text-gray-600 mb-8">
              We do not sell your personal information to third parties for their marketing purposes.
            </p>

            <h2 className="text-3xl font-bold mb-6">5. Cookies and Tracking</h2>
            <p className="text-gray-600 mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Analyze website traffic and usage</li>
              <li>Provide personalized content and advertising</li>
              <li>Secure your account and prevent fraud</li>
            </ul>
            <p className="text-gray-600 mb-8">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our website.
            </p>

            <h2 className="text-3xl font-bold mb-6">6. Data Security</h2>
            <p className="text-gray-600 mb-6">
              We implement appropriate technical and organizational measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure data storage with access controls</li>
              <li>Regular security audits and testing</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="text-gray-600 mb-8">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>

            <h2 className="text-3xl font-bold mb-6">7. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correct:</strong> Update inaccurate or incomplete information</li>
              <li><strong>Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Object:</strong> Opt out of certain processing activities</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Withdraw Consent:</strong> Revoke consent for processing</li>
            </ul>
            <p className="text-gray-600 mb-8">
              To exercise these rights, please contact us at privacy@comspace.com.
            </p>

            <h2 className="text-3xl font-bold mb-6">8. Data Retention</h2>
            <p className="text-gray-600 mb-8">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Account information is retained until you request deletion or your account is inactive for an extended period.
            </p>

            <h2 className="text-3xl font-bold mb-6">9. Children's Privacy</h2>
            <p className="text-gray-600 mb-8">
              Our services are not directed to children under 13. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>

            <h2 className="text-3xl font-bold mb-6">10. International Data Transfers</h2>
            <p className="text-gray-600 mb-8">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this policy.
            </p>

            <h2 className="text-3xl font-bold mb-6">11. Changes to This Policy</h2>
            <p className="text-gray-600 mb-8">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our services constitutes acceptance of the updated policy.
            </p>

            <h2 className="text-3xl font-bold mb-6">12. Contact Us</h2>
            <p className="text-gray-600 mb-6">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="text-gray-600 mb-8 space-y-2">
              <li>Email: privacy@comspace.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Commerce Street, Suite 456, New York, NY 10001</li>
            </ul>

            {/* Contact CTA */}
            <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Questions about your privacy?</h3>
              <p className="text-gray-600 mb-6">
                Our privacy team is here to help with any questions or concerns.
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
