import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/contexts/order-context';
import { resetWorkflowAPI } from '@/lib/api';

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

// ─── Reset Confirmation Modal ────────────────────────────────────────────────

interface ResetModalProps {
  activeOrders: { poNumber: string; stage: string; customerName: string }[];
  onConfirmReset: () => void;
  onCancel: () => void;
  isResetting: boolean;
}

function ResetConfirmModal({ activeOrders, onConfirmReset, onCancel, isResetting }: ResetModalProps) {
  const hasActiveOrders = activeOrders.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className={`flex items-center gap-3 p-5 border-b border-neutral-200 dark:border-slate-700 ${hasActiveOrders ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
          <div className={`p-2 rounded-xl ${hasActiveOrders ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {hasActiveOrders ? 'Active Orders Detected' : 'Reset Workflow Data?'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {hasActiveOrders
                ? `${activeOrders.length} order${activeOrders.length > 1 ? 's are' : ' is'} currently in-progress`
                : 'This will clear the entire workspace'}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {hasActiveOrders ? (
            <>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                The following orders are currently <span className="font-semibold text-amber-600 dark:text-amber-400">in-progress</span> and have not been completed. Resetting will clear the workspace display but the orders will remain safely in the database and can be resumed at any time.
              </p>

              {/* Active orders list */}
              <div className="bg-neutral-50 dark:bg-slate-800/50 rounded-xl border border-neutral-200 dark:border-slate-700 overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest border-b border-neutral-200 dark:border-slate-700 bg-neutral-100/50 dark:bg-slate-700/30">
                  In-Progress Orders
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-neutral-100 dark:divide-slate-700/50">
                  {activeOrders.map(o => (
                    <div key={o.poNumber} className="flex items-center justify-between px-3 py-2.5 text-xs">
                      <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">{o.poNumber}</p>
                        <p className="text-neutral-500 dark:text-neutral-400">{o.customerName || '—'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30">
                        {o.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                After resetting, visit <span className="font-semibold text-blue-600 dark:text-blue-400">Order Initiation</span> and use the pending counter to resume these orders.
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              There are <span className="font-semibold">no active orders</span> in the system. Clicking confirm will completely clear all workflow progress bars and reset the workspace to a fresh state.
            </p>
          )}

          <div className={`text-xs rounded-xl p-3 border ${hasActiveOrders
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300'}`}>
            <strong>⚠ Note:</strong>{' '}
            {hasActiveOrders
              ? 'Your in-progress orders are stored in the database and will not be deleted. Only the local progress display will be cleared.'
              : 'This action will clear all local workflow state and cannot be undone.'}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 bg-neutral-50 dark:bg-slate-800/30 border-t border-neutral-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isResetting}
            className="px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmReset}
            disabled={isResetting}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${hasActiveOrders
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isResetting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Resetting...</>
            ) : (
              <><RefreshCw className="h-4 w-4" />{hasActiveOrders ? 'Clear & Resume Later' : 'Confirm Reset'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main WorkflowIndicator ──────────────────────────────────────────────────

export default function WorkflowIndicator({ currentStep }: { currentStep: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  const { orders, reloadOrders } = useOrders();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeInProgressOrders, setActiveInProgressOrders] = useState<{ poNumber: string; stage: string; customerName: string }[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Step 1: Open modal, compute active orders from context ─────────────────
  const handleResetClick = () => {
    // Find all orders that are NOT completed — these are "in-progress"
    const inProgress = orders
      .filter(o => {
        const stage = (o.stage || '').toLowerCase();
        const status = (o.status || '').toLowerCase();
        // Exclude fully completed orders
        return status !== 'completed' && stage !== 'completed';
      })
      .map(o => ({
        poNumber: o.poNumber,
        stage: o.stage || o.current_stage || 'Order Initiation',
        customerName: o.customerName || ''
      }));

    setActiveInProgressOrders(inProgress);
    setShowResetModal(true);
  };

  // ── Step 2: Execute reset after user confirms ──────────────────────────────
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      // Reset backend DB + localStorage
      await resetWorkflowAPI();

      localStorage.removeItem("savedOrders");
      localStorage.removeItem("bomCalculationDraft");
      localStorage.removeItem("autoGeneratedProcurementRequests");
      localStorage.removeItem("preStitchedInventory");
      localStorage.removeItem("systemLogs");
      localStorage.removeItem("archivedProcurementRequests");
      localStorage.removeItem("sasons_init_cleared");

      // Broadcast so context and all open tabs update
      window.dispatchEvent(new CustomEvent("orders-updated"));
      window.dispatchEvent(new Event("storage"));

      // Navigate cleanly to Orders Initiation
      window.location.href = "/orders";
    } catch (err) {
      console.error("Reset failed:", err);
      setIsResetting(false);
      setShowResetModal(false);
      alert("Reset failed. Please try again.");
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
        <div className="flex flex-col items-center gap-0.5 relative shrink min-w-0 z-20">
          {stepToUrlMap[step] && !isActive ? (
            <Link href={stepToUrlMap[step]} className="hover:opacity-80 transition-opacity">
              {stageNameNode}
            </Link>
          ) : (
            stageNameNode
          )}

          <div
            onClick={() => {
              if (stageOrders.length > 0) {
                setOpenDropdown(openDropdown === step ? null : step);
              }
            }}
            className={`text-[9px] xl:text-xs font-semibold px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${stageOrders.length > 0
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
          onClick={handleResetClick}
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

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <ResetConfirmModal
          activeOrders={activeInProgressOrders}
          onConfirmReset={handleConfirmReset}
          onCancel={() => !isResetting && setShowResetModal(false)}
          isResetting={isResetting}
        />
      )}
    </div>
  );
}
