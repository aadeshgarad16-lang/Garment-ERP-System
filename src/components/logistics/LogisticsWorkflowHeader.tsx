import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface LogisticsWorkflowHeaderProps {
  currentStep: number;
  completedSteps: number[];
}

export default function LogisticsWorkflowHeader({ currentStep, completedSteps }: LogisticsWorkflowHeaderProps) {
  const { t } = useTranslation();

  const phase3Steps = [
    { id: 1, name: t('orderInitiation.tracker.verification') || 'Packing & Verification' },
    { id: 2, name: t('orderInitiation.tracker.approval') || 'Approval' },
    { id: 3, name: t('logistics.complianceDocs') || 'Compliance Docs' },
    { id: 4, name: t('logistics.dispatch') || 'Dispatch' },
  ];

  const phase4Steps = [
    { id: 5, name: t('logistics.pod') || 'Proof of Delivery' },
    { id: 6, name: t('logistics.financialClosure') || 'Financial Closure' },
  ];

  const isPhase4Unlocked = completedSteps.includes(4);

  const renderStep = (step: { id: number; name: string }, isLocked: boolean = false) => {
    const isCompleted = completedSteps.includes(step.id);
    const isActive = currentStep === step.id;

    let bgClass = 'bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-slate-700';
    if (isCompleted) bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (isActive) bgClass = 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500';

    return (
      <div key={step.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgClass} transition-colors ${isLocked ? 'opacity-60' : ''}`}>
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : isLocked ? (
          <Lock className="h-4 w-4 text-neutral-400" />
        ) : (
          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-blue-200 text-blue-800 dark:text-blue-200' : 'bg-neutral-200 text-neutral-600 dark:text-neutral-400'}`}>
            {step.id}
          </div>
        )}
        <span className="text-sm font-medium whitespace-nowrap">{step.name}</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-5 md:p-6 mb-6">
      <div className="flex flex-col gap-6">
        
        {/* Phase III */}
        <div>
          <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">{t('logistics.phase3') || 'Phase III — Logistics & Documentation'}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {phase3Steps.map(step => renderStep(step))}
          </div>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-slate-800 w-full"></div>

        {/* Phase IV */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('logistics.phase4') || 'Phase IV — Fulfillment'}</h3>
            {!isPhase4Unlocked && (
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Lock className="h-3 w-3" /> {t('logistics.lockedUntilDispatch') || 'Locked until Dispatch'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {phase4Steps.map(step => renderStep(step, !isPhase4Unlocked))}
          </div>
        </div>

      </div>
    </div>
  );
}
