"use client";
import React, { useState } from 'react';
import { Package, Search, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface PackingVerificationProps {
  onComplete: () => void;
  order?: any;
}

export default function PackingVerification({ onComplete, order }: PackingVerificationProps) {
  const { t } = useTranslation();
  const [manifestId, setManifestId] = useState('—');
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

  const orderId = order?.poNumber || '—';
  const targetQty = order?.specs?.reduce((sum: number, spec: any) => sum + (Number(spec.quantity) || 0), 0) || 0;
  const destination = order?.deliveryAddress || '—';
  const cartonCount = targetQty > 0 ? Math.ceil(targetQty / 40) : 0;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-border px-6 py-5 bg-neutral-50/50 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">{t('orderInitiation.tracker.verification') || 'Packing & Verification'}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('quality.stages.verification.desc') || 'Verify packed quantities against shipping manifest before final approval.'}</p>
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
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-card border border-border rounded-lg text-sm text-muted-foreground focus:outline-none"
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
                className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
                {t('logistics.verificationRemarks') || 'Verification Remarks'}
              </label>
              <textarea 
                placeholder={t('logistics.verificationRemarksPlaceholder') || "Any discrepancies or notes..."}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring/20 focus:border-blue-500 outline-none transition-all min-h-[100px]"
              />
            </div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-card rounded-xl p-6 border border-border flex flex-col">
            <h3 className="text-sm font-bold text-card-foreground mb-4 uppercase tracking-wider">{t('logistics.manifestSummary') || 'Manifest Summary'}</h3>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">{t('dashboard.recentOrders.headers.orderId') || 'Order ID'}</span>
                <span className="text-sm font-semibold text-foreground">{orderId}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">{t('logistics.targetQty') || 'Target Quantity'}</span>
                <span className="text-sm font-semibold text-foreground">{targetQty} pcs</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">{t('logistics.cartonCount') || 'Carton Count'}</span>
                <span className="text-sm font-semibold text-foreground">{cartonCount} Cartons</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">{t('logistics.destination') || 'Destination'}</span>
                <span className="text-sm font-semibold text-foreground">{destination}</span>
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
