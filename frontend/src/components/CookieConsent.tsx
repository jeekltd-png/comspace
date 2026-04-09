'use client';

import { useState, useEffect } from 'react';
import { FiX, FiChevronDown, FiChevronUp, FiShield } from 'react-icons/fi';

const CONSENT_KEY = 'comspace_cookie_consent';

interface ConsentPrefs {
  necessary: true;   // always true — cannot be refused
  analytics: boolean;
  marketing: boolean;
}

function loadPrefs(): ConsentPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw) return JSON.parse(raw) as ConsentPrefs;
  } catch { /* ignore */ }
  return null;
}

function savePrefs(prefs: ConsentPrefs) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
  // Dispatch a custom event so other parts of the app can react (e.g. disable GA)
  window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: prefs }));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const prefs = loadPrefs();
    if (!prefs) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
    // Restore previous preferences so the event fires on page reload
    savePrefs(prefs);
  }, []);

  const acceptAll = () => {
    savePrefs({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
  };

  const rejectAll = () => {
    savePrefs({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
  };

  const saveCustom = () => {
    savePrefs({ necessary: true, analytics, marketing });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6 animate-slide-up"
    >
      <div className="max-w-2xl mx-auto glass-card p-5 sm:p-6 shadow-2xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <FiShield className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            <h2 className="font-semibold text-gray-900 dark:text-white text-base">Cookie Preferences</h2>
          </div>
          <button
            onClick={rejectAll}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Reject all and close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p id="cookie-consent-desc" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          We use cookies to keep the site working (strictly necessary), understand how it&#39;s used
          (analytics), and show relevant offers (marketing). You control which optional cookies are
          set. See our{' '}
          <a href="/privacy" className="text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:text-brand-700">
            Privacy Policy
          </a>{' '}
          for details.
        </p>

        {/* Manage preferences toggle */}
        <button
          onClick={() => setShowDetails(v => !v)}
          className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline mb-4"
          aria-expanded={showDetails}
        >
          {showDetails ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          Manage preferences
        </button>

        {/* Granular toggles */}
        {showDetails && (
          <div className="space-y-3 mb-5 border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* Necessary — always on */}
            <ConsentRow
              label="Strictly necessary"
              description="Required for the site to function (session, security, cart). Cannot be disabled."
              checked={true}
              disabled={true}
              onChange={() => {}}
            />
            <ConsentRow
              label="Analytics"
              description="Helps us understand which pages are popular and how visitors navigate. Data is anonymised."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ConsentRow
              label="Marketing"
              description="Enables personalised offers and relevant ads. Shared with trusted advertising partners."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <button
            onClick={rejectAll}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
          >
            Reject all
          </button>
          {showDetails && (
            <button
              onClick={saveCustom}
              className="px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-700 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
            >
              Save preferences
            </button>
          )}
          <button
            onClick={acceptAll}
            className="btn-primary text-sm py-2 px-5"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = `consent-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex items-start gap-4">
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
          disabled
            ? 'bg-brand-400 cursor-not-allowed opacity-70'
            : checked
            ? 'bg-brand-600'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
        aria-label={label}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <div>
        <label htmlFor={id} className={`text-sm font-medium ${disabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'} cursor-pointer`}>
          {label} {disabled && <span className="text-xs font-normal text-gray-400">(always on)</span>}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
