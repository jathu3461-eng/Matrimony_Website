import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import ta from './ta';
import type { TranslationKey, TranslationDict } from './en';

export type Language = 'en' | 'ta';

const dictionaries: Record<Language, TranslationDict> = { en, ta };

interface I18nContextType {
  lang: Language;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  setLang: (lang: Language) => void;
  isTamil: boolean;
}

const STORAGE_KEY = 'mukurtham_lang';

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  t: (k) => k,
  setLang: () => {},
  isTamil: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'en' || v === 'ta') setLangState(v);
      setLoaded(true);
    });
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let value: string = dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return value;
    },
    [lang]
  );

  if (!loaded) return null;

  return (
    <I18nContext.Provider value={{ lang, t, setLang, isTamil: lang === 'ta' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export type { TranslationKey };
