import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';

const dictionaries = { en, ta };
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('ui_lang') || 'en');

  const changeLang = useCallback((l) => {
    setLang(l);
    localStorage.setItem('ui_lang', l);
  }, []);

  const t = useCallback((key) => dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang: changeLang, t }), [lang, changeLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
