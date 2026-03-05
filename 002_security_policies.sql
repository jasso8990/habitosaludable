// app/i18n/useTranslation.js
// Hook para usar traducciones en cualquier pantalla

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { translations } from './translations';

// Detectar idioma del dispositivo automáticamente
const deviceLanguage = Localization.locale?.startsWith('es') ? 'es' : 'en';

let currentLanguage = deviceLanguage;
const listeners = [];

// Función para cambiar idioma globalmente
export const setLanguage = async (lang) => {
  currentLanguage = lang;
  await AsyncStorage.setItem('app_language', lang);
  listeners.forEach(cb => cb(lang));
};

// Hook principal
export const useTranslation = () => {
  const [language, setLang] = useState(currentLanguage);

  useEffect(() => {
    // Cargar idioma guardado
    AsyncStorage.getItem('app_language').then(saved => {
      if (saved) {
        currentLanguage = saved;
        setLang(saved);
      }
    });

    const listener = (lang) => setLang(lang);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return { t, language, setLanguage };
};
