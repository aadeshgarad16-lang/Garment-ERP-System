"use client";
import React, { useState } from 'react';
import { Truck, CheckCircle2, Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface DispatchSectionProps {
  onComplete: () => void;
}

export default function DispatchSection({ onComplete }: DispatchSectionProps) {
  const { t } = useTranslation();
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [eta, setEta] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      onComplete();
    }, 1000);
  };

  const isFormValid = courier.trim() !== '' && trackingNumber.trim() !== '' && eta !== '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('logistics.dispatchDetails') || 'Dispatch Details'}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('logistics.dispatchDetailsDesc') || 'Assign courier and initialize physical transit.'}</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
                {t('logistics.courierPartner') || 'Courier / Freight Partner'} <span className="text-red-500">*</span>
              </label>
              <select 
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white dark:bg-slate-900"
              >
                <option value="">{t('logistics.selectPartner') || 'Select Partner...'}</option>
                <option value="Maersk Logistics">Maersk Logistics</option>
                <option value="DHL Supply Chain">DHL Supply Chain</option>
                <option value="FedEx Freight">FedEx Freight</option>
                <option value="Internal Fleet">Internal Fleet</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
                {t('logistics.trackingNumber') || 'Tracking / AWB Number'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. AWB-12345678"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
              {t('logistics.eta') || 'Estimated Time of Arrival (ETA)'} <span className="text-red-500">*</span>
            </label>
            <div className="relative max-w-xs">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input 
                type="date" 
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              onClick={handleDispatch}
              disabled={!isFormValid || isDispatching}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDispatching ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('logistics.dispatching') || 'Dispatching...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('logistics.markDispatched') || 'Mark as Dispatched'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
