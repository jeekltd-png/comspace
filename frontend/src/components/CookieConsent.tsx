'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const CONSENT_KEY = 'comspace_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto glass-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xl border border-gray-200/60 dark:border-gray-700/60">
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            We use cookies to enhance your experience, analyze site traffic, and personalize content.
            By continuing to use our site, you agree to our{' '}
            <a href="/privacy" className="text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:text-brand-700">
              Privacy Policy
            </a>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="btn-primary text-sm py-2 px-5"
          >
            Accept All
          </button>
          <button
            onClick={decline}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors sm:hidden"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
