"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { LanguageCode, TRANSLATIONS, SUPPORTED_LANGUAGES } from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (keyOrText: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const saved = localStorage.getItem('buywise_lang') as LanguageCode;
    if (saved && TRANSLATIONS[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('buywise_lang', lang);
  };

  const t = (keyOrText: string): string => {
    if (!keyOrText) return '';

    // Always preserve official brand name untranslated
    if (keyOrText === 'BuyWise AI' || keyOrText === 'BuyWise' || keyOrText === 'BuyWiseAI') {
      return keyOrText;
    }

    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;

    // 1. Direct Key Lookup in Current Language
    if (currentDict[keyOrText]) {
      return currentDict[keyOrText];
    }

    // 2. Direct Key Lookup in English Master Dictionary
    // If input is a valid key (e.g. 'hero_title_1'), return current language translation
    // or fall back to English text (e.g. 'AI Visual & Price'), NEVER the raw key name!
    if (TRANSLATIONS.en[keyOrText]) {
      return currentDict[keyOrText] || TRANSLATIONS.en[keyOrText];
    }

    // Helper to normalize strings for reverse text matching (strip emojis/extra symbols)
    const normalize = (str: string) =>
      str
        .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}⚡🏆📋🔥🎟️⭐⚡✔✨🛍️▶️⏸️❓👤📱📚📸⚖️👗💰🔔✓↗]/gu, '')
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .toLowerCase();

    const normalizedInput = normalize(keyOrText);
    if (!normalizedInput) return keyOrText;

    // 3. Reverse Text Lookup (Match string literal to Key in TRANSLATIONS.en)
    for (const [key, val] of Object.entries(TRANSLATIONS.en)) {
      if (normalize(val) === normalizedInput || key.toLowerCase() === normalizedInput) {
        if (currentDict[key]) {
          return currentDict[key];
        }
        return val;
      }
    }

    // 4. Category Fallback Matching
    const catMap: Record<string, string> = {
      'mobiles': 'cat_mobiles',
      'mobiles smartphones': 'cat_mobiles',
      'fashion': 'cat_fashion',
      'fashion clothing': 'cat_fashion',
      'gifts': 'cat_gifts',
      'gifts novelties': 'cat_gifts',
      'beauty': 'cat_beauty',
      'beauty personal care': 'cat_beauty',
      'home': 'cat_home',
      'home kitchen': 'cat_home',
      'laptops': 'cat_laptops',
      'laptops computers': 'cat_laptops',
      'audio': 'cat_audio',
      'audio headphones': 'cat_audio',
      'smartwatches': 'cat_smartwatches',
      'smartwatches wearables': 'cat_smartwatches',
      'undergarments': 'cat_undergarments',
      'undergarments lingerie': 'cat_undergarments',
    };

    if (catMap[normalizedInput]) {
      const targetKey = catMap[normalizedInput];
      if (currentDict[targetKey]) return currentDict[targetKey];
      if (TRANSLATIONS.en[targetKey]) return TRANSLATIONS.en[targetKey];
    }

    // 5. Specs Fallback Matching
    const specMap: Record<string, string> = {
      'display': 'spec_display',
      'processor': 'spec_processor',
      'camera': 'spec_camera',
      'battery': 'spec_battery',
      'storage': 'spec_storage',
      'ram': 'spec_ram',
      'material': 'spec_material',
      'fabric': 'spec_fabric',
    };

    if (specMap[normalizedInput]) {
      const targetKey = specMap[normalizedInput];
      if (currentDict[targetKey]) return currentDict[targetKey];
      if (TRANSLATIONS.en[targetKey]) return TRANSLATIONS.en[targetKey];
    }

    // Fallback to original text if no translation found
    return keyOrText;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      language: 'en' as LanguageCode,
      setLanguage: () => {},
      t: (keyOrText: string) => TRANSLATIONS.en[keyOrText] || keyOrText,
    };
  }
  return context;
};
