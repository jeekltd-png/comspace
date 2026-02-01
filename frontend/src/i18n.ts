import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'es', 'fr', 'ar', 'de', 'yo', 'ig', 'ha', 'sw', 'am', 'ko', 'it', 'zh', 'ja', 'pt', 'ru', 'hi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  de: 'Deutsch',
  yo: 'Yorùbá',
  ig: 'Igbo',
  ha: 'Hausa',
  sw: 'Kiswahili',
  am: 'አማርኛ',
  ko: '한국어',
  it: 'Italiano',
  zh: '中文',
  ja: '日本語',
  pt: 'Português',
  ru: 'Русский',
  hi: 'हिन्दी',
};

import { getRequestConfig } from 'next-intl/server';
import enMessages from './locales/en.json';

export default getRequestConfig(async function ({ locale }: { locale: string }) {
  try {
    // Validate that the incoming `locale` parameter is valid
    if (!locales.includes(locale as Locale)) {
      // fallback to default locale instead of throwing notFound to avoid middleware edge-cases
      return { locale: defaultLocale, messages: enMessages };
    }

    try {
      const msgs = (await import(`./locales/${locale}.json`)).default;
      // Merge with default messages so missing keys are filled from English to avoid
      // MISSING_MESSAGE runtime errors and hydration mismatches
      const merged = { ...enMessages, ...msgs };

      // Log missing keys (present in default but missing in locale) to help debugging
      const flatten = (obj: any, prefix = ''): string[] => {
        return Object.keys(obj).reduce((acc: string[], k) => {
          const val = obj[k];
          const key = prefix ? `${prefix}.${k}` : k;
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            return acc.concat(flatten(val, key));
          }
          acc.push(key);
          return acc;
        }, [] as string[]);
      };

      try {
        const defaultKeys = new Set(flatten(enMessages));
        const localeKeys = new Set(flatten(msgs));
        const missing = [...defaultKeys].filter(k => !localeKeys.has(k));
        if (missing.length > 0) {
          console.warn(`[i18n] Locale "${locale}" is missing ${missing.length} translation key(s):`, missing.slice(0, 20));
        }
      } catch (e) {
        // ignore logging errors
      }

      return { locale, messages: merged };
    } catch (err) {
      // If messages for the requested locale are missing, log and fall back to default
      // This prevents server-side missing-message errors and hydration mismatches
      console.warn(`[i18n] Missing messages for locale ${locale}, falling back to default (${defaultLocale})`);
      return { locale: defaultLocale, messages: enMessages };
    }
  } catch (err) {
    // Any unexpected error: fall back to safe defaults to keep the app running
    console.error('[i18n] getRequestConfig failed, using default locale messages', err);
    return { locale: defaultLocale, messages: enMessages };
  }
});























