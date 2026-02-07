import { getRequestConfig } from 'next-intl/server';
import enMessages from '../locales/en.json';
import esMessages from '../locales/es.json';
import frMessages from '../locales/fr.json';
import arMessages from '../locales/ar.json';
import deMessages from '../locales/de.json';
import yoMessages from '../locales/yo.json';
import igMessages from '../locales/ig.json';
import haMessages from '../locales/ha.json';
import swMessages from '../locales/sw.json';
import amMessages from '../locales/am.json';
import koMessages from '../locales/ko.json';
import itMessages from '../locales/it.json';
import zhMessages from '../locales/zh.json';
import jaMessages from '../locales/ja.json';
import ptMessages from '../locales/pt.json';
import ruMessages from '../locales/ru.json';
import hiMessages from '../locales/hi.json';
import { locales, type Locale } from '../i18n-constants';

const messages: Record<Locale, any> = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  ar: arMessages,
  de: deMessages,
  yo: yoMessages,
  ig: igMessages,
  ha: haMessages,
  sw: swMessages,
  am: amMessages,
  ko: koMessages,
  it: itMessages,
  zh: zhMessages,
  ja: jaMessages,
  pt: ptMessages,
  ru: ruMessages,
  hi: hiMessages,
};

export default getRequestConfig(async ({ locale }) => {
  // Validate locale - fallback to 'en'
  const validLocale = locale && locales.includes(locale as Locale) ? locale : 'en';
  
  return {
    locale: validLocale,
    messages: messages[validLocale] || enMessages
  };
});
