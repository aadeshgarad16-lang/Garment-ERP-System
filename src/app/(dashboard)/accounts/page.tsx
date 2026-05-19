"use client";
import React from 'react';
import { PieChart } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function AccountsPage() {
  const { t } = useTranslation();
  return (
    <div className="h-full flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <PieChart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-700">{t('dashboard.sidebar.accounts') || 'Accounts'}</h2>
        <p className="text-neutral-500 mt-2">{t('dashboard.sidebar.underDevelopment') || 'This module is currently under development.'}</p>
      </div>
    </div>
  );
}
