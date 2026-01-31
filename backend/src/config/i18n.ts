import i18next from 'i18next';
import i18nextHttpMiddleware from 'i18next-http-middleware';




























































import Backend from 'i18next-fs-backend';
import path from 'path';

i18next
  .use(Backend)
  .use(i18nextHttpMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    fallbackLng: 'en',
    preload: ['en', 'es', 'fr', 'ar', 'de', 'yo', 'ig', 'ha', 'sw', 'am', 'ko', 'it'],
    supportedLngs: ['en', 'es', 'fr', 'ar', 'de', 'yo', 'ig', 'ha', 'sw', 'am', 'ko', 'it', 'zh', 'ja', 'pt', 'ru', 'hi'],
    ns: ['translation'],
    defaultNS: 'translation',
    detection: {
      order: ['querystring', 'cookie', 'header'],
      caches: ['cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupHeader: 'accept-language',
      cookieSecure: process.env.NODE_ENV === 'production',
      cookieSameSite: 'lax',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
export const i18nextMiddleware = i18nextHttpMiddleware.handle(i18next);
