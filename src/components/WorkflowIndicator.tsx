import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';

// Full workflow sequence used to determine if a step is in the past
const allSteps = [
  'Order Initiation',
  'Stock Check',
  'BOM Calculation',
  'Inventory Check',
  'Procurement',
  'Material Allocation',
  'Material Release',
  'Production',
  'Quality & Packing',
  'Logistics',
  'Completed'
];

// Steps to actually display in the indicator
const displaySteps = [
  'Order Initiation',
  'Stock Check',
  'BOM Calculation',
  'Inventory Check',
  'Procurement',
  'Material Allocation',
  'Material Release',
  'Production'
];

const trackerKeyMap: { [key: string]: string } = {
  'Order Initiation': 'orderInitiation',
  'Stock Check': 'stockCheck',
  'BOM Calculation': 'bomCalculation',
  'Inventory Check': 'inventoryCheck',
  'Procurement': 'procurement',
  'Material Allocation': 'materialAllocation',
  'Material Release': 'materialRelease',
  'Production': 'production',
  'Quality & Packing': 'qualityPacking',
  'Logistics': 'logistics',
  'Completed': 'completed'
};

const stepToUrlMap: { [key: string]: string } = {
  'Order Initiation': '/orders',
  'Stock Check': '/stock-calculation',
  'BOM Calculation': '/bom-calculation',
  'Inventory Check': '/inventory',
  'Procurement': '/procurement',
  'Material Allocation': '/material-allocation',
  'Material Release': '/material-release',
  'Production': '/production',
  'Quality & Packing': '/quality-packing',
  'Logistics': '/logistics',
};

export default function WorkflowIndicator({ currentStep }: { currentStep: string }) {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadOrders = () => {
      let combinedOrders: any[] = [];
      const stored = localStorage.getItem('savedOrders');
      if (stored) {
        try {
          combinedOrders = [...combinedOrders, ...JSON.parse(stored)];
        } catch (e) { }
      }
      const draftsStr = localStorage.getItem('draftOrders');
      if (draftsStr) {
        try {
          const parsedDrafts = JSON.parse(draftsStr);
          const formattedDrafts = parsedDrafts.map((d: any) => ({
            ...d,
            status: 'Draft',
            stage: 'Order Initiation'
          }));
          combinedOrders = [...combinedOrders, ...formattedDrafts];
        } catch (e) { }
      }
      setOrders(combinedOrders);
    };
    loadOrders();

    window.addEventListener('storage', loadOrders);
    return () => window.removeEventListener('storage', loadOrders);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getOrdersForStage = (stage: string) => {
    if (stage === 'Order Initiation') {
      return orders.filter(o => o.status === 'Draft');
    }
    const targetStageIndex = allSteps.indexOf(stage);
    return orders.filter(o => {
      if (o.status !== 'Submitted') return false;
      const orderStage = o.stage || o.current_stage;
      const orderStageIndex = allSteps.indexOf(orderStage);
      if (orderStageIndex === -1) return false;
      return orderStageIndex <= targetStageIndex;
    });
  };

  return (
    <div
      className="flex flex-nowrap justify-between items-center w-full mb-6 text-sm bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-xl border border-neutral-200 dark:border-slate-700 shadow-sm"
      ref={dropdownRef}
    >
      {displaySteps.map((step, index) => {
        const isActive = step === currentStep;
        // If current step is not found, fallback to original logic (though it should be in allSteps)
        const currentIndex = allSteps.indexOf(currentStep) !== -1 ? allSteps.indexOf(currentStep) : displaySteps.indexOf(currentStep);
        const stepIndex = allSteps.indexOf(step);
        const isPast = stepIndex < currentIndex;

        const stageOrders = getOrdersForStage(step);

        const stageNameNode = (
          <span
            className={`font-semibold whitespace-nowrap px-1 sm:px-2 py-1 rounded-md transition-colors block text-center text-[11px] sm:text-xs xl:text-sm ${isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800'
                : isPast
                  ? 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-800'
                  : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-800'
              }`}
          >
            {t(`orderInitiation.tracker.${trackerKeyMap[step]}`) || t(`sidebar.${trackerKeyMap[step]}`) || step}
          </span>
        );

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 relative shrink-0">
              {stepToUrlMap[step] && !isActive ? (
                <Link href={stepToUrlMap[step]}>{stageNameNode}</Link>
              ) : (
                stageNameNode
              )}

              <div
                onClick={() => {
                  if (stageOrders.length > 0) {
                    setOpenDropdown(openDropdown === step ? null : step);
                  }
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${stageOrders.length > 0
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer dark:bg-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-800/80 shadow-sm'
                    : 'bg-neutral-100 text-neutral-400 dark:bg-slate-800 dark:text-neutral-500 cursor-default'
                  }`}
              >
                {stageOrders.length} Pending
              </div>

              {openDropdown === step && (
                <div className="absolute top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden transform -translate-x-1/2 left-1/2">
                  <div className="px-3 py-2 bg-neutral-50 dark:bg-slate-700/50 border-b border-neutral-200 dark:border-slate-700 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
                    Pending at {step}
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {stageOrders.map(order => (
                      <div key={order.id} className="flex justify-between items-center gap-2 px-3 py-2 text-xs border-b border-neutral-100 dark:border-slate-700/50 last:border-0 hover:bg-neutral-50 dark:hover:bg-slate-700/30 transition-colors">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate" title={order.poNumber}>
                          {order.poNumber}
                        </span>
                        <Link
                          href={`${stepToUrlMap[step] || '#'}?poNumber=${encodeURIComponent(order.poNumber)}&customerName=${encodeURIComponent(order.customerName)}`}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md font-semibold whitespace-nowrap shadow-sm shrink-0"
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

            {index < displaySteps.length - 1 && (
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
