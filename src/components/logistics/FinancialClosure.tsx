"use client";
import React, { useState } from 'react';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface FinancialClosureProps {
  onComplete: () => void;
}

export default function FinancialClosure({ onComplete }: FinancialClosureProps) {
  const { t } = useTranslation();
  const [freightCost, setFreightCost] = useState('');
  const [customsDuties, setCustomsDuties] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onComplete();
    }, 1000);
  };

  const isFormValid = freightCost.trim() !== '';

  return (
    <div className="bg-card rounded-xl shadow-sm border border-emerald-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-emerald-100 px-6 py-5 bg-emerald-50/50 flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-emerald-800">{t('logistics.financialClosure') || 'Financial Closure'}</h2>
          <p className="text-xs text-emerald-600 mt-0.5">{t('logistics.financialClosureDesc') || 'Log final shipping costs and archive the completed order.'}</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
                {t('logistics.freightCost') || 'Total Freight Cost ($)'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={freightCost}
                  onChange={(e) => setFreightCost(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
                {t('logistics.customsDuties') || 'Customs & Duties ($)'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={customsDuties}
                  onChange={(e) => setCustomsDuties(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              onClick={handleClose}
              disabled={!isFormValid || isClosing}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClosing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('logistics.archiving') || 'Archiving Order...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('logistics.closeOrder') || 'Close Order & Archive'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
