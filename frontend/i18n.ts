import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en','es','fr','ar','de','yo','ig','ha','sw','am','ko','it','zh','ja','pt','ru','hi'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async function ({ locale }: { locale: string }) {
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`./src/locales/${locale}.json`)).default,
  };
});