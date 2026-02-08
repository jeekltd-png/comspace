import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  const faqs = [
    {
      category: "Orders & Shipping",
      questions: [
        { q: "How long does shipping take?", a: "Standard shipping takes 5-7 business days. Express shipping (2-3 days) and overnight options are also available at checkout." },
        { q: "Do you ship internationally?", a: "Yes! We ship to over 100 countries worldwide. International shipping times vary by destination, typically 7-14 business days." },
        { q: "How can I track my order?", a: "Once your order ships, you'll receive a tracking number via email. You can also track orders in your account dashboard." },
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        { q: "What is your return policy?", a: "We offer a 30-day return policy for most items. Products must be unused and in original packaging." },
        { q: "How do I initiate a return?", a: "Log into your account, go to Order History, and select 'Request Return' next to the item you wish to return." },
        { q: "When will I receive my refund?", a: "Refunds are processed within 5-7 business days after we receive your return. The refund will go back to your original payment method." },
      ]
    },
    {
      category: "Payment & Security",
      questions: [
        { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay." },
        { q: "Is my payment information secure?", a: "Absolutely. We use industry-standard SSL encryption and never store your full credit card details." },
        { q: "Can I change my payment method after ordering?", a: "Payment methods cannot be changed once an order is placed. You can cancel and reorder if needed." },
      ]
    },
    {
      category: "Account & Support",
      questions: [
        { q: "Do I need an account to place an order?", a: "No, you can checkout as a guest. However, creating an account lets you track orders, save addresses, and access exclusive deals." },
        { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page and follow the instructions sent to your email." },
        { q: "How can I contact customer support?", a: "You can reach us via email at support@comspace.com, phone at +1 (555) 123-4567, or through our contact form." },
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-brand-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-white/80">Find answers to common questions</p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqs.map((category, idx) => (
            <div key={idx} className="mb-12">
              <h2 className="text-xl font-bold text-brand-600 dark:text-brand-400 mb-6 uppercase tracking-wider text-sm">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, qIdx) => (
                  <details key={qIdx} className="glass-card group">
                    <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors list-none flex items-center justify-between">
                      {faq.q}
                      <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
                    </summary>
                    <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* Still have questions */}
          <div className="glass-card p-8 md:p-12 text-center mt-16">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Still have questions?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Can&apos;t find the answer you&apos;re looking for? Our customer support team is here to help.
            </p>
            <Link href="/contact" className="btn-primary inline-flex items-center">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
