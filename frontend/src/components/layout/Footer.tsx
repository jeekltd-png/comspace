'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiFacebook, FiTwitter, FiInstagram, FiMail } from 'react-icons/fi';

export function Footer() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ ' + data.message);
        setEmail('');
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (error) {
      setMessage('❌ Failed to subscribe. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">ComSpace</h3>
            <p className="text-gray-400">
              Your one-stop shop for all your needs. Quality products, secure
              payments, and fast delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/products" className="hover:text-white">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/shipping" className="hover:text-white">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-400 mb-4">
              Subscribe to get special offers and updates.
            </p>
            <form onSubmit={handleSubscribe}>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="px-4 py-2 rounded-l-lg flex-1 text-gray-900"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiMail />
                </button>
              </div>
              {message && (
                <p className={`text-sm mt-2 ${message.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </p>
              )}
            </form>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="hover:text-blue-400">
                <FiFacebook className="text-2xl" />
              </a>
              <a href="#" className="hover:text-blue-400">
                <FiTwitter className="text-2xl" />
              </a>
              <a href="#" className="hover:text-blue-400">
                <FiInstagram className="text-2xl" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ComSpace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
