import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

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

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});























