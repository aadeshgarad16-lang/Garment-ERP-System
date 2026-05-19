"use client";

import { useLanguage } from '@/contexts/language-context';

export function useTranslation() {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, i18n: { changeLanguage: setLanguage, language } };
}
