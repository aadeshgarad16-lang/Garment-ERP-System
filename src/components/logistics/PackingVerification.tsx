"use client";
import React, { useState } from 'react';
import { Package, Search, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface PackingVerificationProps {
  onComplete: () => void;
}

export default function PackingVerification({ onComplete }: PackingVerificationProps) {
  const { t } = useTranslation();
  const [manifestId, setManifestId] = useState('MNF-2026-089');
  const [verifiedQty, setVerifiedQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onComplete();
    }, 800);
  };

  const isFormValid = verifiedQty.trim() !== '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('orderInitiation.tracker.verification') || 'Packing & Verification'}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('quality.stages.verification.desc') || 'Verify packed quantities against shipping manifest before final approval.'}</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
                {t('logistics.manifestId') || 'Shipping Manifest ID'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input 
                  type="text" 
                  value={manifestId}
                  onChange={(e) => setManifestId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 focus:outline-none"
                  readOnly
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">{t('logistics.manifestAutoDesc') || 'Manifest generated automatically from Quality & Packing module.'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
                {t('quality.verifiedQty') || 'Verified Quantity'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                placeholder={t('quality.verifiedQtyPlaceholder') || "Enter physical count"}
                value={verifiedQty}
                onChange={(e) => setVerifiedQty(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
                {t('logistics.remarks') || 'Verification Remarks'}
              </label>
              <textarea 
                placeholder={t('logistics.remarksPlaceholder') || "Any discrepancies or notes..."}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[100px]"
              />
            </div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-slate-900 rounded-xl p-6 border border-neutral-200 dark:border-slate-700 flex flex-col">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4 uppercase tracking-wider">{t('logistics.manifestSummary') || 'Manifest Summary'}</h3>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('dashboard.recentOrders.headers.orderId') || 'Order ID'}</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">PO-2026-004</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('logistics.targetQty') || 'Target Quantity'}</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">1000 pcs</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('logistics.cartonCount') || 'Carton Count'}</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">25 Cartons</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('logistics.destination') || 'Destination'}</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Warehouse B, Dubai</span>
              </div>
            </div>
            
            <button
              onClick={handleVerify}
              disabled={!isFormValid || isVerifying}
              className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('logistics.verifying') || 'Verifying...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('logistics.confirmVerify') || 'Confirm & Verify Packing'}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
