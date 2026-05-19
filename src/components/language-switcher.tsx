"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', label: 'EN', nativeName: 'English' },
    { code: 'mr', name: 'Marathi', label: 'MR', nativeName: 'मराठी' },
    { code: 'hi', name: 'Hindi', label: 'HI', nativeName: 'हिंदी' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 transition-colors text-sm font-medium text-neutral-700 bg-white"
        type="button"
      >
        <Globe className="h-4 w-4 text-neutral-500" />
        <span>{currentLang.nativeName}</span>
        <ChevronDown className="h-3 w-3 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-1 border border-neutral-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-100/50 px-1.5 py-0.5 rounded text-[10px] tracking-wider">{lang.label}</span>
                <span>{lang.nativeName}</span>
              </div>
              {language === lang.code && <Check className="h-4 w-4 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
