import { getTranslations } from 'next-intl/server';
import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-white/80">We&apos;d love to hear from you</p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="md:col-span-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a message</h2>
              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                    <input id="contact-name" type="text" className="input-field" placeholder="Your name" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <input id="contact-email" type="email" className="input-field" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                  <input id="contact-subject" type="text" className="input-field" placeholder="How can we help?" />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                  <textarea id="contact-message" rows={6} className="input-field resize-none" placeholder="Your message..." />
                </div>
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Get in touch</h2>
              <div className="space-y-6">
                {[
                  { icon: FiMail, title: 'Email', lines: ['support@comspace.com', 'sales@comspace.com'] },
                  { icon: FiPhone, title: 'Phone', lines: ['+1 (555) 123-4567', 'Mon-Fri: 9AM - 6PM EST'] },
                  { icon: FiMapPin, title: 'Address', lines: ['123 Commerce Street, Suite 456', 'New York, NY 10001, US'] },
                  { icon: FiClock, title: 'Business Hours', lines: ['Mon-Fri: 9AM - 6PM', 'Sat: 10AM - 4PM', 'Sun: Closed'] },
                ].map(item => (
                  <div key={item.title} className="glass-card p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.title}</h3>
                      {item.lines.map((line, i) => (
                        <p key={i} className="text-gray-600 dark:text-gray-400 text-sm">{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
