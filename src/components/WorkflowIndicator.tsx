import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/contexts/order-context';
import { useAuth } from '@/context/AuthContext';

// Full workflow sequence used to determine if a step is in the past
const allSteps = [
  'Order Initiation',
  'Order Specifications',
  'Stock Check',
  'BOM Calculation',
  'Inventory Check',
  'Material Allocation',
  'Procurement',
  'Material Release',
  'Production',
  'Quality & Packing',
  'Logistics',
  'Completed'
];

// Steps to actually display in the indicator
const displaySteps = [
  'Order Initiation',
  'Order Specifications',
  'Stock Check',
  'BOM Calculation',
  'Inventory Check',
  'Material Allocation',
  'Procurement',
  'Material Release',
  'Production'
];

const trackerKeyMap: { [key: string]: string } = {
  'Order Initiation': 'orderInitiation',
  'Order Specifications': 'orderSpecifications',
  'Stock Check': 'stockCheck',
  'BOM Calculation': 'bomCalculation',
  'Inventory Check': 'inventoryCheck',
  'Material Allocation': 'materialAllocation',
  'Procurement': 'procurement',
  'Material Release': 'materialRelease',
  'Production': 'production',
  'Quality & Packing': 'qualityPacking',
  'Logistics': 'logistics',
  'Completed': 'completed'
};

const stepToUrlMap: { [key: string]: string } = {
  'Order Initiation': '/orders',
  'Order Specifications': '/order-specifications',
  'Stock Check': '/stock-calculation',
  'BOM Calculation': '/bom-calculation',
  'Inventory Check': '/inventory',
  'Material Allocation': '/material-allocation',
  'Procurement': '/procurement',
  'Material Release': '/material-release',
  'Production': '/production',
  'Quality & Packing': '/quality-packing',
  'Logistics': '/logistics',
};

export default function WorkflowIndicator({ currentStep }: { currentStep: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthorized, user } = useAuth();
  
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  const { orders } = useOrders();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResetWorkflow = async () => {
    if (window.confirm("Are you sure you want to completely clear ALL workflow data? This cannot be undone and will reset the entire system to a fresh state.")) {
      try {
        const { resetWorkflowAPI, dispatchOrdersUpdated } = await import('@/lib/api');
        await resetWorkflowAPI();
        dispatchOrdersUpdated();
        router.push("/orders");
      } catch (err) {
        console.error("Failed to reset workflow data:", err);
      }
    }
  };

  const getOrdersForStage = (stage: string) => {
    if (stage === 'Order Initiation') {
      return orders.filter(o => o.status === 'DRAFT');
    }
    const targetStageIndex = allSteps.indexOf(stage);
    return orders.filter(o => {
      if (o.status !== 'SUBMITTED') return false;
      const orderStage = o.stage || o.current_stage || 'Order Initiation';
      const orderStageIndex = allSteps.indexOf(orderStage);
      if (orderStageIndex === -1) return false;
      return orderStageIndex <= targetStageIndex;
    });
  };

  const renderStep = (step: string, index: number, total: number) => {
    const isActive = step === currentStep;
    const currentIndex = allSteps.indexOf(currentStep) !== -1 ? allSteps.indexOf(currentStep) : displaySteps.indexOf(currentStep);
    const stepIndex = allSteps.indexOf(step);
    const isPast = stepIndex < currentIndex;
    const stageOrders = getOrdersForStage(step);
    const isStepAuthorized = isSuperAdmin ? true : isAuthorized(step);

    const stageNameNode = (
      <span
        className={`whitespace-nowrap transition-colors block text-center text-[9px] sm:text-[10px] lg:text-[11px] xl:text-sm ${isActive
          ? 'font-bold text-blue-600 dark:text-blue-400'
          : isPast
            ? 'font-medium text-neutral-600 dark:text-neutral-400'
            : 'font-medium text-neutral-400 dark:text-neutral-500'
          }`}
      >
        {t(`orderInitiation.tracker.${trackerKeyMap[step]}`) || t(`sidebar.${trackerKeyMap[step]}`) || step}
      </span>
    );

    return (
      <React.Fragment key={step}>
        <div className={`flex flex-col items-center gap-0.5 relative shrink min-w-0 z-20 ${!isStepAuthorized ? 'opacity-50 pointer-events-none' : ''}`}>
          {stepToUrlMap[step] && !isActive ? (
            isStepAuthorized ? (
              <Link href={stepToUrlMap[step]} className="hover:opacity-80 transition-opacity">
                {stageNameNode}
              </Link>
            ) : (
              <div className="cursor-not-allowed">
                {stageNameNode}
              </div>
            )
          ) : (
            <div className={!isStepAuthorized && !isActive ? "cursor-not-allowed" : ""}>
              {stageNameNode}
            </div>
          )}

          <div
            onClick={() => {
              if (isStepAuthorized && stageOrders.length > 0) {
                setOpenDropdown(openDropdown === step ? null : step);
              }
            }}
            className={`text-[9px] xl:text-xs font-semibold px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${isStepAuthorized && stageOrders.length > 0
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer dark:bg-blue-900/60 dark:text-blue-300 shadow-sm border border-blue-200/50'
              : 'bg-neutral-100 text-neutral-500 dark:bg-slate-800 dark:text-neutral-400 cursor-default border border-neutral-200/50'
              }`}
          >
            {stageOrders.length} Pending
          </div>

          {openDropdown === step && (
            <div className={`absolute top-full mt-2 w-max min-w-[280px] bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden ${index === 0 ? 'left-0' : index >= total - 2 ? 'right-0' : 'transform -translate-x-1/2 left-1/2'
              }`}>
              <div className="px-3 py-2 bg-neutral-50 dark:bg-slate-700/50 border-b border-neutral-200 dark:border-slate-700 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
                Pending at {step}
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {stageOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center gap-2 px-3 py-2 text-xs border-b border-neutral-100 dark:border-slate-700/50 last:border-0 hover:bg-neutral-50 dark:hover:bg-slate-700/30 transition-colors">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300" title={order.poNumber || 'Draft Order'}>
                      {order.poNumber || 'Draft Order'}
                    </span>
                    <Link
                      href={step === 'Order Initiation' ? `/orders?resumeId=${order.id}` : `${stepToUrlMap[step] || '#'}?poNumber=${encodeURIComponent(order.poNumber || '')}&customerName=${encodeURIComponent(order.customerName || '')}`}
                      className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md font-semibold whitespace-nowrap shadow-sm shrink-0 transition"
                      onClick={() => setOpenDropdown(null)}
                    >
                      Process
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {index < total - 1 && (
          <div className="flex items-center justify-center shrink-0">
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-300 dark:text-neutral-600" />
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleResetWorkflow}
          className="text-[11px] sm:text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 px-3 py-1.5 rounded border border-red-200 dark:border-red-800/50 transition-colors shadow-sm font-semibold"
        >
          Reset Workflow Data
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-700 shadow-sm p-4 w-full mb-8">
        <div className="flex flex-nowrap justify-between items-center w-full gap-0.5 sm:gap-1 lg:gap-2">
          {displaySteps.map((step, index) => renderStep(step, index, displaySteps.length))}
        </div>
      </div>
    </div>
  );
}