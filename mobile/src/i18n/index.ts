import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import de from './locales/de.json';
import yo from './locales/yo.json';
import ig from './locales/ig.json';
import ha from './locales/ha.json';
import sw from './locales/sw.json';
import am from './locales/am.json';
import ko from './locales/ko.json';
import it from './locales/it.json';

const LANGUAGE_STORAGE_KEY = '@comspace_language';

// Get device locale
const deviceLanguage = Localization.locale.split('-')[0];

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  ar: { translation: ar },
  de: { translation: de },
  yo: { translation: yo },
  ig: { translation: ig },
  ha: { translation: ha },
  sw: { translation: sw },
  am: { translation: am },
  ko: { translation: ko },
  it: { translation: it },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language preference
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((savedLanguage) => {
  if (savedLanguage && i18n.language !== savedLanguage) {
    i18n.changeLanguage(savedLanguage);
  }
});

// Save language changes
i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
});

export default i18n;
