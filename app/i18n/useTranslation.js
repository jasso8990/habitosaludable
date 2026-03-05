// app/i18n/useTranslation.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { translations } from './translations';

const deviceLang = Localization.locale?.startsWith('es') ? 'es' : 'en';
let currentLanguage = deviceLang;
const listeners = [];

export const setLanguage = async (lang) => {
  currentLanguage = lang;
  await AsyncStorage.setItem('app_language', lang);
  listeners.forEach(cb => cb(lang));
};

export const useTranslation = () => {
  const [language, setLang] = useState(currentLanguage);

  useEffect(() => {
    AsyncStorage.getItem('app_language').then(saved => {
      if (saved) { currentLanguage = saved; setLang(saved); }
    });
    const listener = (lang) => setLang(lang);
    listeners.push(listener);
    return () => { const i = listeners.indexOf(listener); if (i > -1) listeners.splice(i, 1); };
  }, []);

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[language];
    for (const k of keys) val = val?.[k];
    return val || key;
  };

  return { t, language, setLanguage };
};
