"use client";

import React, { useState } from 'react';
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

// Mock Data representing Frozen materials from Material Allocation
const mockFrozenMaterials = [
  { id: 'MAT-001', name: 'Cotton Fabric (White)', category: 'Fabric', frozenQty: 1000, unit: 'meters', destination: 'Line 1 - Stitching' },
  { id: 'MAT-002', name: 'Polyester Thread (Navy)', category: 'Thread', frozenQty: 100, unit: 'spools', destination: 'Line 1 - Stitching' },
  { id: 'MAT-004', name: 'Plastic Buttons (Black)', category: 'Buttons', frozenQty: 5000, unit: 'pieces', destination: 'Line 2 - Assembly' },
  { id: 'MAT-006', name: 'Standard Collar (White)', category: 'Collar/Cuff', frozenQty: 600, unit: 'pieces', destination: 'Line 1 - Stitching' },
];

interface ReleaseState {
  releaseQty: number;
  status: 'Frozen' | 'Ready for Release' | 'Released to Production';
}

export default function MaterialReleasePage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [releaseStates, setReleaseStates] = useState<Record<string, ReleaseState>>(
    mockFrozenMaterials.reduce((acc, mat) => {
      acc[mat.id] = { releaseQty: 0, status: 'Frozen' };
      return acc;
    }, {} as Record<string, ReleaseState>)
  );
  
  const [releaseInfo, setReleaseInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0,5),
    storeManager: '',
    floorSupervisor: '',
    productionFloor: '',
    notes: ''
  });

  const [globalMessage, setGlobalMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [releaseCompleted, setReleaseCompleted] = useState(false);

  const handleReleaseChange = (id: string, value: string) => {
    const qty = parseInt(value, 10) || 0;
    setReleaseStates(prev => {
      const next = { ...prev };
      next[id].releaseQty = qty;
      
      const frozenQty = mockFrozenMaterials.find(m => m.id === id)?.frozenQty || 0;
      if (qty > 0 && qty <= frozenQty && next[id].status === 'Frozen') {
        next[id].status = 'Ready for Release';
      } else if (qty === 0 && next[id].status === 'Ready for Release') {
        next[id].status = 'Frozen';
      }
      
      return next;
    });
  };

  const handleReleaseToProduction = () => {
    setReleaseStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id].status === 'Ready for Release') {
          next[id].status = 'Released to Production';
        }
      });
      return next;
    });
    setGlobalMessage({ text: t('procurement.releaseSuccess') || 'Materials released successfully and sent to production.', type: 'success' });
    setReleaseCompleted(true);
  };

  // State Logic Variables
  const totalFrozen = mockFrozenMaterials.length;
  
  const isFormValid = releaseInfo.storeManager.trim() !== '' && 
                      releaseInfo.floorSupervisor.trim() !== '' && 
                      releaseInfo.productionFloor !== '';

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Frozen': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Ready for Release': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Released to Production': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Material Release" />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <PackageOpen className="h-6 w-6 text-indigo-600" />
            {t('procurement.materialRelease') || 'Material Release'}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">{t('procurement.materialReleaseDesc') || 'Issue frozen warehouse inventory to the production floor'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            onClick={handleReleaseToProduction}
            disabled={!hasValidReleasesToProcess}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              hasValidReleasesToProcess 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
            }`}
          >
            <FileSignature className="h-4 w-4" />
            {t('procurement.releaseToProduction') || 'Release to Production'}
          </button>
          
          {releaseCompleted && (
            <button 
              onClick={() => router.push('/production')}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 group"
            >
              {t('procurement.trackProduction') || 'Track Production'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {globalMessage && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${globalMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
          {globalMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
          <div>
            <p className="font-medium text-sm">{globalMessage.text}</p>
          </div>
        </div>
      )}

      {/* Release Details Section */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <span className="text-xs font-medium text-neutral-500 flex items-center gap-1 mb-1"><FileText className="h-3.5 w-3.5" /> {t('procurement.releaseId') || 'Release ID'}</span>
          <p className="text-sm font-semibold text-indigo-900 py-1.5">REL-2026-042</p>
        </div>
        <div>
          <span className="text-xs font-medium text-neutral-500 flex items-center gap-1 mb-1"><FileText className="h-3.5 w-3.5" /> {t('procurement.linkedPO') || 'Linked PO'}</span>
          <p className="text-sm font-semibold text-neutral-900 py-1.5">PO-2026-004</p>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 flex items-center gap-1 mb-1"><Clock className="h-3.5 w-3.5" /> {t('procurement.releaseDate') || 'Release Date'}</label>
          <input type="date" className="w-full px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 border rounded-lg border-neutral-300 focus:ring-indigo-500 focus:border-indigo-500" value={releaseInfo.date} onChange={e => setReleaseInfo({...releaseInfo, date: e.target.value})} disabled={releaseCompleted} />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 flex items-center gap-1 mb-1"><Clock className="h-3.5 w-3.5" /> {t('procurement.releaseTime') || 'Release Time'}</label>
          <input type="time" className="w-full px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 border rounded-lg border-neutral-300 focus:ring-indigo-500 focus:border-indigo-500" value={releaseInfo.time} onChange={e => setReleaseInfo({...releaseInfo, time: e.target.value})} disabled={releaseCompleted} />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 flex items-center gap-1 mb-1"><User className="h-3.5 w-3.5" /> {t('procurement.storeManager') || 'Store Manager'}</label>
          <input type="text" placeholder={t('procurement.managerName') || "Manager Name"} className="w-full px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 border rounded-lg border-neutral-300 focus:ring-indigo-500 focus:border-indigo-500" value={releaseInfo.storeManager} onChange={e => setReleaseInfo({...releaseInfo, storeManager: e.target.value})} disabled={releaseCompleted} />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 flex items-center gap-1 mb-1"><User className="h-3.5 w-3.5" /> {t('procurement.floorSupervisor') || 'Floor Supervisor'}</label>
          <input type="text" placeholder={t('procurement.supervisorName') || "Supervisor Name"} className="w-full px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 border rounded-lg border-neutral-300 focus:ring-indigo-500 focus:border-indigo-500" value={releaseInfo.floorSupervisor} onChange={e => setReleaseInfo({...releaseInfo, floorSupervisor: e.target.value})} disabled={releaseCompleted} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-neutral-500 flex items-center gap-1 mb-1"><Building2 className="h-3.5 w-3.5" /> {t('procurement.productionFloor') || 'Production Floor'}</label>
          <select className="w-full px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 border rounded-lg border-neutral-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white" value={releaseInfo.productionFloor} onChange={e => setReleaseInfo({...releaseInfo, productionFloor: e.target.value})} disabled={releaseCompleted}>
            <option value="">{t('procurement.selectProductionFloor') || 'Select Production Floor'}</option>
            <option value="Floor 1 - Cutting">{t('procurement.floor1') || 'Floor 1 - Cutting'}</option>
            <option value="Floor 2 - Stitching">{t('procurement.floor2') || 'Floor 2 - Stitching'}</option>
            <option value="Floor 3 - Finishing">{t('procurement.floor3') || 'Floor 3 - Finishing'}</option>
            <option value="Floor 4 - Quality Control">{t('procurement.floor4') || 'Floor 4 - Quality Control'}</option>
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <label className="text-xs font-medium text-neutral-500 flex items-center gap-1 mb-1"><FileText className="h-3.5 w-3.5" /> {t('procurement.notesOptional') || 'Notes (Optional)'}</label>
          <input type="text" placeholder={t('procurement.specialInstructions') || "Any special instructions or comments for the production floor"} className="w-full px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 border rounded-lg border-neutral-300 focus:ring-indigo-500 focus:border-indigo-500" value={releaseInfo.notes} onChange={e => setReleaseInfo({...releaseInfo, notes: e.target.value})} disabled={releaseCompleted} />
        </div>
      </div>

      {/* ERP Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100">
            <PackageOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">{t('procurement.totalFrozenMaterials') || 'Total Frozen Materials'}</p>
            <p className="text-2xl font-bold text-neutral-900">{totalFrozen}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">{t('procurement.releasedMaterials') || 'Released Materials'}</p>
            <p className="text-2xl font-bold text-neutral-900">{releasedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">{t('procurement.pendingRelease') || 'Pending Release'}</p>
            <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${allReleased ? 'bg-emerald-100' : 'bg-neutral-100'}`}>
            <Layers className={`h-6 w-6 ${allReleased ? 'text-emerald-600' : 'text-neutral-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">{t('procurement.releaseStatus') || 'Release Status'}</p>
            <p className={`text-sm font-bold mt-1 ${allReleased ? 'text-emerald-600' : 'text-neutral-900'}`}>{releaseStatusText}</p>
          </div>
        </div>
      </div>

      {releaseCompleted ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden mt-6">
          <div className="border-b border-emerald-100 px-6 py-5 bg-emerald-50/50 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-800">{t('procurement.releasedSuccessTitle') || 'Materials Released Successfully'}</h2>
            <p className="text-emerald-600 text-sm mt-1">{t('procurement.releasedSuccessDesc') || 'Inventory has been issued to the production floor.'}</p>
          </div>
          
          <div className="p-6">
            <h3 className="text-md font-bold text-neutral-800 mb-4">{t('procurement.releaseSummary') || 'Release Summary'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">{t('procurement.releaseId') || 'Release ID'}</p>
                <p className="font-semibold text-neutral-900">REL-2026-042</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">{t('orderInitiation.orderForm.orderId') || 'Order ID'}</p>
                <p className="font-semibold text-neutral-900">PO-2026-004</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">{t('procurement.productionFloor') || 'Production Floor'}</p>
                <p className="font-semibold text-neutral-900">{t(`procurement.floor_${releaseInfo.productionFloor.toLowerCase().replace(/ /g, '_')}`) || releaseInfo.productionFloor || 'Floor 1 - Cutting'}</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">{t('procurement.floorSupervisor') || 'Supervisor'}</p>
                <p className="font-semibold text-neutral-900">{releaseInfo.floorSupervisor}</p>
              </div>
            </div>

            <h3 className="text-md font-bold text-neutral-800 mb-4">{t('procurement.releasedMaterials') || 'Released Materials'}</h3>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    <th className="px-6 py-3">{t('inventory.materials.table.headers.name') || 'Material Name'}</th>
                    <th className="px-6 py-3 text-right">{t('procurement.releasedQty') || 'Released Qty'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {mockFrozenMaterials.filter(item => releaseStates[item.id].releaseQty > 0).map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-sm text-neutral-900">{t(`procurement.materials.${item.id}.name`) || item.name}</td>
                      <td className="px-6 py-3 text-sm font-medium text-neutral-900 text-right">{releaseStates[item.id].releaseQty} {t(`inventory.units.${item.unit}`) || item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => router.push('/production')}
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
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-5 bg-neutral-50/50">
              <h2 className="text-lg font-semibold text-neutral-800">{t('procurement.issueInventory') || 'Issue Inventory to Production'}</h2>
            </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-white border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                <th className="px-6 py-4">{t('inventory.materials.table.headers.name') || 'Material Name'}</th>
                <th className="px-6 py-4">{t('inventory.materials.table.headers.category') || 'Category'}</th>
                <th className="px-6 py-4 text-right">{t('procurement.frozenQty') || 'Frozen Qty'}</th>
                <th className="px-6 py-4">{t('procurement.destination') || 'Destination'}</th>
                <th className="px-6 py-4 text-center">{t('procurement.releaseQty') || 'Release Qty'}</th>
                <th className="px-6 py-4">{t('procurement.status') || 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {mockFrozenMaterials.map((item) => {
                const st = releaseStates[item.id];
                const isError = st.releaseQty > item.frozenQty;
                
                return (
                  <tr key={item.id} className={`transition-colors ${st.status === 'Released to Production' ? 'bg-emerald-50/30' : 'hover:bg-neutral-50/80'}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-900">{t(`procurement.materials.${item.id}.name`) || item.name}</span>
                        <span className="text-xs text-neutral-500">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{t(`inventory.categories.${item.category.toLowerCase()}`) || item.category}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-neutral-900">{item.frozenQty}</span>
                        <span className="text-xs text-neutral-500">{t(`inventory.units.${item.unit}`) || item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        {t(`procurement.destinations.${item.destination.toLowerCase().replace(/ /g, '_')}`) || item.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <input 
                          type="number" 
                          min="0"
                          max={item.frozenQty}
                          value={st.releaseQty}
                          onChange={(e) => handleReleaseChange(item.id, e.target.value)}
                          disabled={st.status === 'Released to Production'}
                          className={`w-24 px-3 py-1.5 border rounded-lg text-sm text-right ${
                            st.status === 'Released to Production' 
                              ? 'bg-neutral-100 border-neutral-200 text-neutral-500 cursor-not-allowed' 
                              : isError 
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900' 
                                : 'border-neutral-300 focus:ring-blue-500 focus:border-blue-500 bg-white text-neutral-800 placeholder:text-neutral-400'
                          }`}
                        />
                        <span className="text-xs text-neutral-500 w-12">{t(`inventory.units.${item.unit}`) || item.unit}</span>
                      </div>
                      {isError && <p className="text-[10px] text-red-600 mt-1 text-center font-medium">{t('procurement.exceedsFrozen') || 'Exceeds frozen'}</p>}
                    </td>
                    <td className="px-6 py-4">
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
      </>
      )}
    </div>
  );
}
