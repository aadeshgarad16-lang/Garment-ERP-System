"use client";


import React from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

const languages = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'mr', name: 'मराठी', flag: 'MR' },
  { code: 'hi', name: 'हिंदी', flag: 'HI' },
];

export default function LanguageSelectionPage() {
  const router = useRouter();
  const { t, setLanguage } = useLanguage();

  const handleSelectLanguage = (langCode: string) => {
    setLanguage(langCode);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-slate-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Globe className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {t('languageSelection.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
          {t('languageSelection.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-neutral-200/50 sm:rounded-2xl sm:px-10 border border-neutral-100 dark:border-slate-800">
          <div className="space-y-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className="w-full flex items-center justify-between p-4 border border-neutral-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/50 px-2.5 py-1.5 rounded-lg tracking-wider">{lang.flag}</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">{lang.name}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>

          <div className="mt-8">
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-slate-900 px-2 text-neutral-500 dark:text-neutral-400 text-center">
                {t('languageSelection.changeLater')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
