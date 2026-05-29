"use client";


import React, { useState, useCallback } from 'react';
import {
  Box,
  CheckCircle2,
  Layers,
  ListChecks,
  Lock,
  ArrowRight,
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';

// Mock Data representing required materials for an order that have sufficient stock
const mockMaterials = [
  { id: 'MAT-001', name: 'Cotton Fabric (White)', category: 'Fabric', available: 1250, required: 1000, linkedPO: 'PO-2026-004', unit: 'meters' },
  { id: 'MAT-002', name: 'Polyester Thread (Navy)', category: 'Thread', available: 120, required: 100, linkedPO: 'PO-2026-004', unit: 'spools' },
  { id: 'MAT-004', name: 'Plastic Buttons (Black)', category: 'Buttons', available: 5000, required: 5000, linkedPO: 'PO-2026-004', unit: 'pieces' },
  { id: 'MAT-006', name: 'Standard Collar (White)', category: 'Collar/Cuff', available: 800, required: 600, linkedPO: 'PO-2026-004', unit: 'pieces' },
];

interface AllocationState {
  isSelected: boolean;
  allocatedQty: number;
  status: 'Available' | 'Allocated' | 'Frozen';
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Available': return 'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-slate-700';
    case 'Allocated': return 'bg-blue-100 text-blue-800 dark:text-blue-200 border-blue-200';
    case 'Frozen': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default: return 'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-slate-700';
  }
};

export default function MaterialAllocationPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const advanceStage = (nextPath: string, nextStage: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      const ordersStr = localStorage.getItem('savedOrders');
      if (ordersStr) {
        let orders = JSON.parse(ordersStr);
        orders = orders.map((o: any) => o.poNumber === po ? { ...o, stage: nextStage } : o);
        localStorage.setItem('savedOrders', JSON.stringify(orders));
        window.dispatchEvent(new Event('storage'));
      }
      router.push(`${nextPath}?poNumber=${encodeURIComponent(po)}`);
    } else {
      router.push(nextPath);
    }
  };

  const [allocations, setAllocations] = useState<Record<string, AllocationState>>(
    mockMaterials.reduce((acc, mat) => {
      const isSelected = mat.required > 0;
      const allocatedQty = isSelected ? Math.min(mat.required, mat.available) : 0;
      acc[mat.id] = { isSelected, allocatedQty, status: 'Available' };
      return acc;
    }, {} as Record<string, AllocationState>)
  );

  const [globalMessage, setGlobalMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleAllocationChange = useCallback((id: string, value: string) => {
    const qty = parseInt(value, 10) || 0;
    setAllocations(prev => ({
      ...prev,
      [id]: { ...prev[id], allocatedQty: qty }
    }));
  }, []);

  const handleSelectionChange = useCallback((id: string, checked: boolean) => {
    setAllocations(prev => ({
      ...prev,
      [id]: { ...prev[id], isSelected: checked }
    }));
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setAllocations(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id].status !== 'Frozen') {
          next[id] = { ...next[id], isSelected: checked };
        }
      });
      return next;
    });
  }, []);

  const handleAllocate = useCallback(() => {
    setAllocations(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id].isSelected && next[id].allocatedQty > 0 && next[id].status === 'Available') {
          next[id] = { ...next[id], status: 'Frozen', isSelected: false };
        }
      });
      return next;
    });
    setGlobalMessage({ text: t('procurement.frozenSuccess') || 'Selected materials allocated and frozen successfully for production release.', type: 'success' });
  }, [t]);

  // State Logic Variables
  const totalMaterials = mockMaterials.length;

  const hasValidAllocationsToSave = mockMaterials.some(mat => {
    const alloc = allocations[mat.id];
    return alloc.isSelected && alloc.status === 'Available' && alloc.allocatedQty > 0 && alloc.allocatedQty <= mat.available;
  });

  const hasAnyFrozen = Object.values(allocations).some(a => a.status === 'Frozen');
  const allFrozen = Object.values(allocations).every(a => a.status === 'Frozen');

  const allocatedCount = Object.values(allocations).filter(a => a.status === 'Frozen').length;
  const frozenCount = Object.values(allocations).filter(a => a.status === 'Frozen').length;

  let readinessStatus = t('procurement.awaitingAllocation') || 'Awaiting Allocation';
  if (allFrozen) readinessStatus = t('procurement.fullyReady') || 'Fully Ready for Release';
  else if (frozenCount > 0) readinessStatus = t('procurement.partiallyReady') || 'Partially Ready';

  const isAllSelectableChecked = mockMaterials.filter(m => allocations[m.id].status !== 'Frozen').every(m => allocations[m.id].isSelected);
  const hasSelectable = mockMaterials.some(m => allocations[m.id].status !== 'Frozen');
  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Material Allocation" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-indigo-600" />
            {t('procurement.materialAllocation') || 'Material Allocation'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">{t('procurement.materialAllocationDesc') || 'Reserve and freeze warehouse inventory for production'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button
            onClick={handleAllocate}
            disabled={!hasValidAllocationsToSave}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${hasValidAllocationsToSave
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-slate-700'
              }`}
          >
            <Box className="h-4 w-4" />
            {t('procurement.allocateMaterials') || 'Allocate Materials'}
          </button>

          {hasAnyFrozen && (
            <button
              onClick={() => advanceStage('/material-release', 'Material Release')}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              {t('procurement.proceedToRelease') || 'Proceed to Release'}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {globalMessage && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${globalMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800 dark:text-blue-200'}`}>
          {globalMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
          <div>
            <p className="font-medium text-sm">{globalMessage.text}</p>
          </div>
        </div>
      )}

      {/* ERP Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-neutral-100 dark:bg-slate-800">
            <PackageCheck className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('procurement.totalMaterialsSelected') || 'Total Materials Selected'}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalMaterials}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
            <ListChecks className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('procurement.allocatedMaterials') || 'Allocated Materials'}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{allocatedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('procurement.frozenMaterials') || 'Frozen Materials'}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{frozenCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-6 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${allFrozen ? 'bg-emerald-100' : 'bg-neutral-100 dark:bg-slate-800'}`}>
            <Layers className={`h-6 w-6 ${allFrozen ? 'text-emerald-600' : 'text-neutral-600 dark:text-neutral-400'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('procurement.productionReadiness') || 'Production Readiness'}</p>
            <p className={`text-sm font-bold mt-1 ${allFrozen ? 'text-emerald-600' : 'text-neutral-900 dark:text-neutral-100'}`}>{readinessStatus}</p>
          </div>
        </div>
      </div>

      {/* Main Allocation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 dark:bg-slate-800/30">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('procurement.reservationAllocation') || 'Reservation & Allocation'}</h2>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse ">
            <thead>
              <tr className="bg-white dark:bg-slate-900 border-b border-neutral-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
                <th scope="col" className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    className="rounded border-neutral-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    checked={isAllSelectableChecked && hasSelectable}
                    disabled={!hasSelectable}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th scope="col" className="px-4 py-3">{t('inventory.materials.table.headers.name') || 'Material Name'}</th>
                <th scope="col" className="px-4 py-3">{t('inventory.materials.table.headers.category') || 'Category'}</th>
                <th scope="col" className="px-4 py-3 text-right">{t('inventory.materials.table.headers.qty') || 'Available Qty'}</th>
                <th scope="col" className="px-4 py-3">{t('procurement.linkedPO') || 'Linked PO'}</th>
                <th scope="col" className="px-4 py-3 text-center">{t('procurement.allocationQty') || 'Allocation Qty'}</th>
                <th scope="col" className="px-4 py-3">{t('procurement.freezeStatus') || 'Freeze Status'}</th>
                <th scope="col" className="px-4 py-3">{t('procurement.status') || 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {mockMaterials.map((item) => {
                const alloc = allocations[item.id];
                const isError = alloc.allocatedQty > item.available;
                const isShortage = item.required > 0 && item.available < item.required;

                return (
                  <tr key={item.id} className={`transition-colors ${alloc.status === 'Frozen' ? 'bg-indigo-50/30' : 'hover:bg-neutral-50/80'} ${alloc.isSelected ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-neutral-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                        checked={alloc.isSelected}
                        disabled={alloc.status === 'Frozen'}
                        onChange={(e) => handleSelectionChange(item.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t(`inventory.materials.items.${item.id}`) || item.name}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{t(`inventory.categories.${item.category.toLowerCase()}`) || item.category}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.available}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{t(`inventory.units.${item.unit}`) || item.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-neutral-700 dark:text-neutral-300">{item.linkedPO}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={item.available}
                          value={alloc.allocatedQty}
                          onChange={(e) => handleAllocationChange(item.id, e.target.value)}
                          disabled={alloc.status === 'Frozen' || !alloc.isSelected}
                          className={`w-24 px-3 py-1.5 border rounded-lg text-sm text-right transition-colors ${alloc.status === 'Frozen' || !alloc.isSelected
                            ? 'bg-neutral-100 dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                            : isError
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900'
                              : isShortage
                                ? 'border-amber-300 dark:border-amber-700 focus:ring-amber-500 focus:border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100'
                                : 'border-neutral-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100'
                            }`}
                        />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 w-12">{t(`inventory.units.${item.unit}`) || item.unit}</span>
                      </div>
                      {isError && alloc.isSelected && <p className="text-[10px] text-red-600 mt-1 text-center font-medium">{t('procurement.exceedsAvailable') || 'Exceeds available'}</p>}
                      {isShortage && alloc.isSelected && !isError && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 text-center font-medium flex items-center justify-center gap-1"><AlertCircle className="h-3 w-3" /> {t('procurement.shortage') || 'Shortage'}</p>}
                      {alloc.allocatedQty > 0 && alloc.status === 'Available' && alloc.isSelected && !isShortage && !isError && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 text-center font-medium">{t('procurement.req') || 'Req'}: {item.required}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {alloc.status === 'Frozen' ? (
                        <span className="inline-flex items-center text-xs font-medium text-indigo-700">
                          <Lock className="h-3 w-3 mr-1" />
                          {t('procurement.reserved') || 'Reserved'}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">{t('procurement.unlocked') || 'Unlocked'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(alloc.status)}`}>
                        {alloc.status === 'Frozen' ? (t('procurement.frozen') || 'Frozen') : alloc.status === 'Allocated' ? (t('procurement.allocated') || 'Allocated') : (t('procurement.available') || 'Available')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Secondary bottom action buttons */}
        <div className="border-t border-neutral-100 dark:border-slate-800 px-4 py-3 bg-neutral-50/50 dark:bg-slate-800/30 flex justify-end gap-3">
          <button
            onClick={handleAllocate}
            disabled={!hasValidAllocationsToSave}
            className={`px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center gap-2 transition-colors ${hasValidAllocationsToSave
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-slate-700'
              }`}
          >
            <Box className="h-4 w-4" />
            {t('procurement.allocateMaterials') || 'Allocate Materials'}
          </button>

          {hasAnyFrozen && (
            <button
              onClick={() => advanceStage('/material-release', 'Material Release')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center gap-2"
            >
              {t('procurement.proceedToRelease') || 'Proceed to Release'}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
