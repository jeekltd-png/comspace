import { getTranslations } from 'next-intl/server';

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  const faqs = [
    {
      category: "Orders & Shipping",
      questions: [
        {
          q: "How long does shipping take?",
          a: "Standard shipping takes 5-7 business days. Express shipping (2-3 days) and overnight options are also available at checkout."
        },
        {
          q: "Do you ship internationally?",
          a: "Yes! We ship to over 100 countries worldwide. International shipping times vary by destination, typically 7-14 business days."
        },
        {
          q: "How can I track my order?",
          a: "Once your order ships, you'll receive a tracking number via email. You can also track orders in your account dashboard."
        }
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          q: "What is your return policy?",
          a: "We offer a 30-day return policy for most items. Products must be unused and in original packaging."
        },
        {
          q: "How do I initiate a return?",
          a: "Log into your account, go to Order History, and select 'Request Return' next to the item you wish to return."
        },
        {
          q: "When will I receive my refund?",
          a: "Refunds are processed within 5-7 business days after we receive your return. The refund will go back to your original payment method."
        }
      ]
    },
    {
      category: "Payment & Security",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay."
        },
        {
          q: "Is my payment information secure?",
          a: "Absolutely. We use industry-standard SSL encryption and never store your full credit card details."
        },
        {
          q: "Can I change my payment method after ordering?",
          a: "Payment methods cannot be changed once an order is placed. You can cancel and reorder if needed."
        }
      ]
    },
    {
      category: "Account & Support",
      questions: [
        {
          q: "Do I need an account to place an order?",
          a: "No, you can checkout as a guest. However, creating an account lets you track orders, save addresses, and access exclusive deals."
        },
        {
          q: "How do I reset my password?",
          a: "Click 'Forgot Password' on the login page and follow the instructions sent to your email."
        },
        {
          q: "How can I contact customer support?",
          a: "You can reach us via email at support@comspace.com, phone at +1 (555) 123-4567, or through our contact form."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl">Find answers to common questions</p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {faqs.map((category, idx) => (
            <div key={idx} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-blue-600">{category.category}</h2>
              <div className="space-y-6">
                {category.questions.map((faq, qIdx) => (
                  <div key={qIdx} className="border-b pb-6">
                    <h3 className="text-lg font-semibold mb-3">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Still have questions? */}
          <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? Our customer support team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
