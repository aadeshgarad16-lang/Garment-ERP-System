"use client";


import React, { useState, useCallback } from 'react';
import {
  PackageOpen,
  CheckCircle2,
  Layers,
  ArrowRight,
  AlertCircle,
  FileSignature,

  Clock,
  User,
  MapPin,
  Building2,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';

// Mock Data representing Frozen materials from Material Allocation
const mockFrozenMaterials = [
  { id: 'MAT-001', name: 'Cotton Fabric (White)', category: 'Fabric', frozenQty: 1000, unit: 'meters', destination: 'Line 1 - Stitching' },
  { id: 'MAT-002', name: 'Polyester Thread (Navy)', category: 'Thread', frozenQty: 100, unit: 'spools', destination: 'Line 1 - Stitching' },
  { id: 'MAT-004', name: 'Plastic Buttons (Black)', category: 'Buttons', frozenQty: 5000, unit: 'pieces', destination: 'Line 2 - Assembly' },
  { id: 'MAT-006', name: 'Standard Collar (White)', category: 'Collar/Cuff', frozenQty: 600, unit: 'pieces', destination: 'Line 1 - Stitching' },
];

const floorSupervisorsMap: Record<string, string[]> = {
  'Floor 1 - Cutting': ['Amit Sharma', 'Priya Patel'],
  'Floor 2 - Stitching': ['Rajesh Kumar', 'Sneha Reddy'],
  'Floor 3 - Finishing': ['Vikram Singh', 'Meera Nair'],
  'Floor 4 - Quality Control': ['Sanjay Dutt', 'Ananya Roy']
};

interface ReleaseState {
  releaseQty: number;
  status: 'Frozen' | 'Ready for Release' | 'Released to Production';
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Frozen': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Ready for Release': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Released to Production': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default: return 'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-slate-700';
  }
};

export default function MaterialReleasePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const advanceStage = (nextPath: string, nextStage: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? { ...o, stage: nextStage } : o);
      });
      router.push(`${nextPath}?poNumber=${encodeURIComponent(po)}`);
    } else {
      router.push(nextPath);
    }
  };


  const [releaseStates, setReleaseStates] = useState<Record<string, ReleaseState>>(
    mockFrozenMaterials.reduce((acc, mat) => {
      acc[mat.id] = { releaseQty: 0, status: 'Frozen' };
      return acc;
    }, {} as Record<string, ReleaseState>)
  );

  const [releaseInfo, setReleaseInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    productionFloor: '',
    notes: ''
  });

  const [globalMessage, setGlobalMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [releaseCompleted, setReleaseCompleted] = useState(false);



  const handleFloorChange = useCallback((floor: string) => {
    setReleaseInfo(prev => ({
      ...prev,
      productionFloor: floor
    }));
  }, []);

  const handleReleaseChange = useCallback((id: string, value: string) => {
    const qty = parseInt(value, 10) || 0;
    setReleaseStates(prev => {
      const next = { ...prev };
      next[id] = { ...next[id], releaseQty: qty };

      const frozenQty = mockFrozenMaterials.find(m => m.id === id)?.frozenQty || 0;
      if (qty > 0 && qty <= frozenQty && next[id].status === 'Frozen') {
        next[id] = { ...next[id], status: 'Ready for Release' };
      } else if (qty === 0 && next[id].status === 'Ready for Release') {
        next[id] = { ...next[id], status: 'Frozen' };
      }

      return next;
    });
  }, []);

  const handleReleaseToProduction = useCallback(() => {
    setReleaseStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id].status === 'Ready for Release') {
          next[id] = { ...next[id], status: 'Released to Production' };
        }
      });
      return next;
    });
    setGlobalMessage({ text: t('procurement.releaseSuccess') || 'Materials released successfully and sent to production.', type: 'success' });
    setReleaseCompleted(true);
  }, [t]);

  // State Logic Variables
  const totalFrozen = mockFrozenMaterials.length;

  const isFormValid = releaseInfo.productionFloor !== '';

  const hasValidReleasesToProcess = isFormValid && mockFrozenMaterials.some(mat => {
    const st = releaseStates[mat.id];
    return st.status === 'Ready for Release' && st.releaseQty > 0 && st.releaseQty <= mat.frozenQty;
  });

  const releasedCount = Object.values(releaseStates).filter(st => st.status === 'Released to Production').length;
  const pendingCount = totalFrozen - releasedCount;

  const allReleased = releasedCount === totalFrozen;

  let releaseStatusText = t('procurement.awaitingRelease') || 'Awaiting Release';
  if (allReleased) releaseStatusText = t('procurement.fullyReleased') || 'Fully Released';
  else if (releasedCount > 0) releaseStatusText = t('procurement.partiallyReleased') || 'Partially Released';

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Material Release" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <PackageOpen className="h-6 w-6 text-indigo-600" />
            {t('procurement.materialRelease') || 'Material Release'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">{t('procurement.materialReleaseDesc') || 'Issue frozen warehouse inventory to the production floor'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button
            onClick={handleReleaseToProduction}
            disabled={!hasValidReleasesToProcess}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${hasValidReleasesToProcess
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-slate-700'
              }`}
          >
            <FileSignature className="h-4 w-4" />
            {t('procurement.releaseToProduction') || 'Release to Production'}
          </button>

          {releaseCompleted && (
            <button
              onClick={() => advanceStage('/production', 'Production')}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 group"
            >
              {t('procurement.trackProduction') || 'Track Production'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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

      {/* Release Details Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1"><FileText className="h-3.5 w-3.5" /> {t('procurement.linkedPO') || 'Linked PO'}</span>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 py-1.5">PO-2026-004</p>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1"><Clock className="h-3.5 w-3.5" /> {t('procurement.releaseDate') || 'Release Date'}</label>
          <input type="date" className="w-full px-3 py-1.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" value={releaseInfo.date} onChange={e => setReleaseInfo({ ...releaseInfo, date: e.target.value })} disabled={releaseCompleted} />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1"><Clock className="h-3.5 w-3.5" /> {t('procurement.releaseTime') || 'Release Time'}</label>
          <input type="time" className="w-full px-3 py-1.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" value={releaseInfo.time} onChange={e => setReleaseInfo({ ...releaseInfo, time: e.target.value })} disabled={releaseCompleted} />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1"><Building2 className="h-3.5 w-3.5" /> Allocate Material</label>
          <select className="w-full px-3 py-1.5 text-sm text-neutral-800 dark:text-neutral-200 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900" value={releaseInfo.productionFloor} onChange={e => handleFloorChange(e.target.value)} disabled={releaseCompleted}>
            <option value="">Select Allocate material</option>
            <option value="Person 1">Person 1</option>
            <option value="Person 2">Person 2</option>
          </select>
        </div>

        <div className="md:col-span-2 lg:col-span-4">
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1"><FileText className="h-3.5 w-3.5" /> {t('procurement.notesOptional') || 'Notes (Optional)'}</label>
          <input type="text" placeholder={t('procurement.specialInstructions') || "Any special instructions or comments for the production floor"} className="w-full px-3 py-1.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500" value={releaseInfo.notes} onChange={e => setReleaseInfo({ ...releaseInfo, notes: e.target.value })} disabled={releaseCompleted} />
        </div>
      </div>

      {/* ERP Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100">
            <PackageOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('procurement.totalFrozenMaterials') || 'Total Frozen Materials'}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalFrozen}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('procurement.releasedMaterials') || 'Released Materials'}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{releasedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('procurement.pendingRelease') || 'Pending Release'}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-6 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${allReleased ? 'bg-emerald-100' : 'bg-neutral-100 dark:bg-slate-800'}`}>
            <Layers className={`h-6 w-6 ${allReleased ? 'text-emerald-600' : 'text-neutral-600 dark:text-neutral-400'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('procurement.releaseStatus') || 'Release Status'}</p>
            <p className={`text-sm font-bold mt-1 ${allReleased ? 'text-emerald-600' : 'text-neutral-900 dark:text-neutral-100'}`}>{releaseStatusText}</p>
          </div>
        </div>
      </div>

      {releaseCompleted ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-emerald-200 overflow-hidden mt-6">
          <div className="border-b border-emerald-100 px-6 py-5 bg-emerald-50/50 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-800">{t('procurement.releasedSuccessTitle') || 'Materials Released Successfully'}</h2>
            <p className="text-emerald-600 text-sm mt-1">{t('procurement.releasedSuccessDesc') || 'Inventory has been issued to the production floor.'}</p>
          </div>

          <div className="p-6">
            <h3 className="text-md font-bold text-neutral-800 dark:text-neutral-200 mb-4">{t('procurement.releaseSummary') || 'Release Summary'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-neutral-50 dark:bg-slate-900 rounded-lg border border-neutral-100 dark:border-slate-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('procurement.releaseId') || 'Release ID'}</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">REL-2026-042</p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-slate-900 rounded-lg border border-neutral-100 dark:border-slate-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('orderInitiation.orderForm.orderId') || 'Order ID'}</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">PO-2026-004</p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-slate-900 rounded-lg border border-neutral-100 dark:border-slate-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Allocate material</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{releaseInfo.productionFloor || 'Allocate to Person 1'}</p>
              </div>

            </div>

            <h3 className="text-md font-bold text-neutral-800 dark:text-neutral-200 mb-4">{t('procurement.releasedMaterials') || 'Released Materials'}</h3>
            <div className="border border-neutral-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-slate-900 border-b border-neutral-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
                    <th scope="col" className="px-6 py-3">{t('inventory.materials.table.headers.name') || 'Material Name'}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('procurement.releasedQty') || 'Released Qty'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                  {mockFrozenMaterials.filter(item => releaseStates[item.id].releaseQty > 0).map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-sm text-neutral-900 dark:text-neutral-100">{t(`inventory.materials.items.${item.id}`) || item.name}</td>
                      <td className="px-6 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100 text-right">{releaseStates[item.id].releaseQty} {t(`inventory.units.${item.unit}`) || item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => advanceStage('/production', 'Production')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 group"
              >
                {t('procurement.trackProduction') || 'Track Production'}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Release Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">
            <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 dark:bg-slate-800/30">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('procurement.issueInventory') || 'Issue Inventory to Production'}</h2>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse ">
                <thead>
                  <tr className="bg-white dark:bg-slate-900 border-b border-neutral-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
                    <th scope="col" className="px-4 py-3">{t('inventory.materials.table.headers.name') || 'Material Name'}</th>
                    <th scope="col" className="px-4 py-3">{t('inventory.materials.table.headers.category') || 'Category'}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t('procurement.frozenQty') || 'Frozen Qty'}</th>
                    <th scope="col" className="px-4 py-3">{t('procurement.destination') || 'Destination'}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('procurement.releaseQty') || 'Release Qty'}</th>
                    <th scope="col" className="px-4 py-3">{t('procurement.status') || 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                  {mockFrozenMaterials.map((item) => {
                    const st = releaseStates[item.id];
                    const isError = st.releaseQty > item.frozenQty;

                    return (
                      <tr key={item.id} className={`transition-colors ${st.status === 'Released to Production' ? 'bg-emerald-50/30' : 'hover:bg-neutral-50/80'}`}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t(`inventory.materials.items.${item.id}`) || item.name}</span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{t(`inventory.categories.${item.category.toLowerCase()}`) || item.category}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.frozenQty}</span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t(`inventory.units.${item.unit}`) || item.unit}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                            {t(`procurement.destinations.${item.destination.toLowerCase().replace(/ /g, '_')}`) || item.destination}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={item.frozenQty}
                              value={st.releaseQty}
                              onChange={(e) => handleReleaseChange(item.id, e.target.value)}
                              disabled={st.status === 'Released to Production'}
                              className={`w-24 px-3 py-1.5 border rounded-lg text-sm text-right ${st.status === 'Released to Production'
                                ? 'bg-neutral-100 dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                                : isError
                                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900'
                                  : 'border-neutral-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400'
                                }`}
                            />
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 w-12">{t(`inventory.units.${item.unit}`) || item.unit}</span>
                          </div>
                          {isError && <p className="text-[10px] text-red-600 mt-1 text-center font-medium">{t('procurement.exceedsFrozen') || 'Exceeds frozen'}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${getStatusStyle(st.status)}`}>
                            {st.status === 'Frozen' ? (t('procurement.frozen') || 'Frozen') : st.status === 'Ready for Release' ? (t('procurement.readyForRelease') || 'Ready for Release') : (t('procurement.released') || 'Released')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Duplicate Submit Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleReleaseToProduction}
              disabled={!hasValidReleasesToProcess}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${hasValidReleasesToProcess
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-slate-700'
                }`}
            >
              <FileSignature className="h-4 w-4" />
              {t('procurement.releaseToProduction') || 'Release to Production'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
