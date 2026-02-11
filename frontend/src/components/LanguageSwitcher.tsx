'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n';
import { FiGlobe, FiCheck } from 'react-icons/fi';

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: Locale) => {
    // Remove current locale from pathname
    const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
    
    // Construct new path with new locale
    const newPath = newLocale === 'en' 
      ? pathnameWithoutLocale || '/'
      : `/${newLocale}${pathnameWithoutLocale || '/'}`;
    
    router.push(newPath);
    setIsOpen(false);
    
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Select language"
      >
        <FiGlobe className="w-5 h-5" />
        <span className="text-sm font-medium">{localeNames[currentLocale as Locale] || 'English'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
            <div className="py-1">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => switchLanguage(locale)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>{localeNames[locale]}</span>
                  {currentLocale === locale && (
                    <FiCheck className="w-4 h-4 text-brand-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
