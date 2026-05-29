"use client";
import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ApprovalSectionProps {
  onComplete: () => void;
}

export default function ApprovalSection({ onComplete }: ApprovalSectionProps) {
  const { t } = useTranslation();
  const [approvedBy, setApprovedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = () => {
    setIsApproving(true);
    setTimeout(() => {
      setIsApproving(false);
      onComplete();
    }, 800);
  };

  const isFormValid = approvedBy.trim() !== '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 flex items-center gap-3">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('quality.stages.approval.name') || 'Final Dispatch Approval'}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('quality.stages.approval.desc') || 'Authorized sign-off required before generating compliance documents.'}</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
              {t('quality.approvedBy') || 'Authorized Approver'} <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              placeholder={t('production.supervisorPlaceholder') || "Enter name of the authorizing manager"}
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-1.5">
              {t('quality.dispatchNotes') || 'Approval Conditions & Notes'}
            </label>
            <textarea 
              placeholder={t('quality.dispatchNotesPlaceholder') || "Any specific conditions for this shipment..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all min-h-[100px]"
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              onClick={handleApprove}
              disabled={!isFormValid || isApproving}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('logistics.verifying') || 'Approving...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('quality.grantApproval') || 'Grant Approval'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
