"use client";

import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Box,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  available: number;
  required: number;
  unit: string;
}

const mockInventory: InventoryItem[] = [];

const categories = ['All Categories', 'Fabric', 'Thread', 'Buttons', 'Zippers', 'Collar/Cuff', 'Hooks'];

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Fully Available': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
    case 'Available': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
    case 'Partially Available': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
    case 'Low Stock': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
    case 'Out of Stock': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60';
    default: return 'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-slate-700';
  }
};

export default function InventoryPage() {
  const router = useRouter();
  const { user, isAuthorized } = useAuth();
  const canAdvanceAlloc = isAuthorized("Material Allocation");
  const canAdvanceProcurement = isAuthorized("Procurement");
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const [storeInventoryData, setStoreInventoryData] = useState<any[]>([]);
  const [poInventoryData, setPoInventoryData] = useState<any[]>([]);
  const [apiAvailableMaterials, setApiAvailableMaterials] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchPOInventory = async (poNumber: string) => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
        const res = await fetch(`${BACKEND_URL}/api/check-inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poNumber })
        });
        const data = await res.json();
        if (data.success && data.data) {
           const formatted = data.data.map((item: any) => ({
             id: item.id || item.material_id || `MAT-${Math.floor(Math.random()*1000)}`,
             name: item.name || item.material_name || `Unknown Material`,
             category: item.category || 'Fabric',
             available: item.available_qty || 0,
             required: item.required_qty || 0,
             unit: item.unit || 'units',
             min_required: item.min_required || 0,
             original_status: item.original_status || 'Available'
           }));
           setPoInventoryData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch PO inventory:', err);
      }
    };

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const po = params.get('poNumber');
      if (po) {
        const ordersStr = localStorage.getItem('savedOrders');
        if (ordersStr) {
          const orders = JSON.parse(ordersStr);
          const found = orders.find((o: any) => o.poNumber === po);
          if (found) setCurrentOrder(found);
        }
        fetchPOInventory(po);
      }
    }
    
    const fetchAvailableMaterials = async (poNumber: string | null) => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
        const url = poNumber 
          ? `${BACKEND_URL}/api/inventory/available-materials?poNumber=${poNumber}`
          : `${BACKEND_URL}/api/inventory/available-materials`;
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setApiAvailableMaterials(data.data);
        } else {
          setApiAvailableMaterials([]);
        }
      } catch (err) {
        console.error('Failed to fetch available materials:', err);
        setApiAvailableMaterials([]);
      }
    };
    
    const params = new URLSearchParams(window.location.search);
    const poNumber = params.get('poNumber');
    fetchAvailableMaterials(poNumber);
    
    // Fetch real store materials for fallback display
    const fetchStoreMaterials = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
        const res = await fetch(`${BACKEND_URL}/store_materials/view?limit=1000`, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'sasons_read_only_key_2026_abc'
          },
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.success && data.data) {
           const formatted = data.data.map((item: any) => ({
             id: item.id || item.material_id || `MAT-${Math.floor(Math.random()*1000)}`,
             name: item.name || item.material_name || `Unknown Material`,
             category: item.category || 'Fabric',
             available: item.available_qty || 0,
             required: 0,
             unit: item.unit || 'units',
             min_required: item.min_required || 0,
             original_status: item.original_status || 'Available'
           }));
           setStoreInventoryData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch store materials:', err);
      }
    };
    fetchStoreMaterials();
  }, []);

  const advanceStage = (nextPath: string, nextStage: string, generateShortages: boolean = false) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    
    if (generateShortages && currentOrder) {
      const existingReqsStr = localStorage.getItem('autoGeneratedProcurementRequests');
      let reqs = existingReqsStr ? JSON.parse(existingReqsStr) : [];
      
      const newReqs = validationData.filter((item: any) => item.shortage > 0).map((item: any) => {
        const fuzzyMatch = currentOrder.specs?.find((s:any) => {
          const sDesc = (s.itemDescription || '').toLowerCase();
          const iName = (item.name || '').toLowerCase();
          return sDesc && iName && (iName.includes(sDesc) || sDesc.includes(iName));
        });
        return {
          id: `PR-${Date.now().toString().slice(-4)}-${Math.floor(Math.random()*1000)}`,
          material: item.name,
          category: item.category,
          required: item.required,
          available: item.available,
          shortage: item.shortage,
          unit: item.unit,
          supplier: 'Pending Assignment',
          cost: item.shortage * (fuzzyMatch?.unitPrice || 10),
          priority: item.available === 0 ? 'Critical' : 'High',
          status: 'Pending Procurement',
          linkedPO: currentOrder.poNumber
        };
      });
      
      if (newReqs.length > 0) {
        reqs = [...newReqs, ...reqs.filter((r: any) => r.linkedPO !== currentOrder.poNumber)];
        localStorage.setItem('autoGeneratedProcurementRequests', JSON.stringify(reqs));
      }
    }

    if (po) {
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', `Inventory Check Completed → ${nextStage}`, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? { ...o, stage: nextStage, status: nextStage } : o);
      });
      router.push(`${nextPath}?poNumber=${encodeURIComponent(po)}`);
    } else {
      router.push(nextPath);
    }
  };

  const { t } = useTranslation();
  const safeT = (key: string, fallback: string) => {
    const res = t(key);
    return res === key || !res ? fallback : res;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  // Memoized calculations to prevent performance lag on search input keystrokes
  const { validationData, summary } = useMemo(() => {
    let fullyAvailableCount = 0;
    let partiallyAvailableCount = 0;
    let criticalCount = 0;

    const sourceData = poInventoryData.length > 0 
      ? poInventoryData 
      : storeInventoryData.map(item => ({...item, required: 0}));

    const computedData = sourceData.map((item: any) => {
      let name = item.name || item.material_name;
      let category = item.category;
      let unit = item.unit;

      if (!name || name.includes('Unknown')) {
         const realItem = storeInventoryData.find(s => s.id.toString() === item.id?.toString());
         if (realItem) {
           name = realItem.name;
           category = realItem.category;
           unit = realItem.unit;
         }
      }

      const available = parseFloat(item.available_qty || item.available || 0);
      const required = parseFloat(item.required_qty || item.required || 0);
      const minRequired = parseFloat(item.min_required || 0);

      const shortage = Math.max(0, required - available);
      
      let status = 'Available';
      
      if (required > 0) {
        if (shortage > 0) {
          status = available === 0 ? 'Out of Stock' : 'Partially Available';
        } else {
          status = 'Fully Available';
        }
      } else if (item.original_status || item.status) {
        // Fallback to store material status if no PO is active
        if (available <= 0) {
           status = 'Out of Stock';
        } else if (available <= minRequired) {
           status = 'Low Stock';
        } else {
           status = 'Available';
        }
      } else {
        if (available <= 0) status = 'Out of Stock';
      }

      // Populate summary analytics parameters concurrently
      if (required > 0) {
        if (status === 'Fully Available' || status === 'Available') fullyAvailableCount++;
        else if (status === 'Partially Available') partiallyAvailableCount++;
        else if (status === 'Out of Stock') criticalCount++;
      }

      return { ...item, name, category, unit, available, required, shortage, status };
    });

    return {
      validationData: computedData,
      summary: { fullyAvailableCount, partiallyAvailableCount, criticalCount }
    };
  }, [currentOrder, storeInventoryData, poInventoryData]);

  const hasShortage = summary.partiallyAvailableCount > 0 || summary.criticalCount > 0;

  // Memoized filtered array items
  const filteredInventory = useMemo(() => {
    const cleanSearch = searchTerm.toLowerCase().trim();
    return validationData.filter((item: any) => {
      const matchesSearch = !cleanSearch ||
        item.name.toLowerCase().includes(cleanSearch) ||
        item.id.toLowerCase().includes(cleanSearch);
      const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter, validationData]);

  const shortageMaterials = filteredInventory.filter((item: any) => item.shortage > 0);
  
  const filteredAvailableMaterials = useMemo(() => {
    const cleanSearch = searchTerm.toLowerCase().trim();
    
    return storeInventoryData.filter((item: any) => {
      const available = parseFloat(item.available_qty || item.available || 0);
      const matchesSearch = !cleanSearch ||
        item.name?.toLowerCase().includes(cleanSearch) ||
        item.id?.toString().toLowerCase().includes(cleanSearch);
      
      const isRequiredForPO = validationData.some((v: any) => {
         const vName = (v.name || v.material_name || '').toLowerCase();
         const iName = (item.name || item.material_name || '').toLowerCase();
         return v.id?.toString() === item.id?.toString() ||
                (vName && iName && (vName.includes(iName) || iName.includes(vName)));
      });

      return matchesSearch && available > 0 && isRequiredForPO;
    }).map((item: any) => {
      const available = parseFloat(item.available_qty || item.available || 0);
      
      const poItem = validationData.find((v: any) => {
         const vName = (v.name || v.material_name || '').toLowerCase();
         const iName = (item.name || item.material_name || '').toLowerCase();
         return v.id?.toString() === item.id?.toString() ||
                (vName && iName && (vName.includes(iName) || iName.includes(vName)));
      });
      
      const required = poItem ? parseFloat(poItem.required || 0) : 0;

      return {
        ...item,
        available,
        required,
        allocatableQty: Math.min(required, available),
        computedStatus: available >= required ? 'Fully Available' : (available > 0 ? 'Partially Available' : 'Out of Stock')
      };
    });
  }, [searchTerm, storeInventoryData, validationData]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      <WorkflowIndicator currentStep="Inventory Check" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Box className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            {t('inventoryVal.title')}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">{t('inventoryVal.subtitle')}</p>
        </div>
      </div>

      {/* Allocation Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-950/50">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('inventoryVal.fullyAvailable')}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{summary.fullyAvailableCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-950/50">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('inventoryVal.partiallyAvailable')}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{summary.partiallyAvailableCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-950/50">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('inventoryVal.criticalShortages')}</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{summary.criticalCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4 sm:p-5 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${hasShortage ? 'bg-indigo-100 dark:bg-indigo-950/50' : 'bg-emerald-100 dark:bg-emerald-950/50'}`}>
            <Layers className={`h-6 w-6 ${hasShortage ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('inventoryVal.readiness')}</p>
            <p className={`text-sm font-bold mt-1 ${hasShortage ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {hasShortage ? (t('procurement.procCompletion') || 'Procurement Required') : (t('orderInitiation.tracker.materialAllocation') || 'Ready for Allocation')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Inventory Table Component Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">

        {/* Table Header & Controls */}
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('inventoryVal.materialsHeader')}</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('inventoryVal.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm text-neutral-900 dark:text-neutral-100 bg-transparent"
                />
              </div>

              {/* Category Dropdown Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-neutral-400" />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm text-neutral-900 dark:text-neutral-100 appearance-none bg-white dark:bg-slate-900 cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'All Categories' ? safeT('inventory.categories.allcategories', 'All Categories') : safeT(`inventory.categories.${cat.toLowerCase()}`, cat)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Table Layout */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-slate-900/50 border-b border-neutral-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
                <th scope="col" className="px-6 py-3 min-w-[200px]">{t('inventoryVal.materialsHeader')}</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3 text-right">Required Qty</th>
                <th scope="col" className="px-4 py-3 text-right">Available Qty</th>
                <th scope="col" className="px-4 py-3 text-right">Shortage Qty</th>
                <th scope="col" className="px-4 py-3">Unit</th>
                <th scope="col" className="px-4 py-3">{t('dashboard.recentOrders.headers.status') || 'Status'}</th>
                <th scope="col" className="px-6 py-3 text-center">{t('actions.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/60">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item: any) => {
                  const isShortage = item.shortage > 0;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 min-w-[200px]">
                        <div className="flex flex-col">
                          <span className={`text-sm font-semibold ${isShortage ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                            {safeT(`inventory.materials.items.${item.id}`, item.name)}
                          </span>
                          <span className={`text-xs ${isShortage ? 'text-red-500/80 dark:text-red-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            {item.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">
                        {safeT(`inventory.categories.${item.category?.toLowerCase() || 'unknown'}`, item.category)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {item.required.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-600 dark:text-neutral-400">
                        {item.available.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-red-600 dark:text-red-400">
                        {isShortage ? item.shortage.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-neutral-500 dark:text-neutral-400">
                        {item.unit === 'meters'
                          ? safeT('dashboard.stockAlerts.footer.metersRemaining', 'meters')
                          : item.unit === 'spools'
                            ? safeT('dashboard.stockAlerts.footer.spoolsRemaining', 'spools')
                            : safeT('dashboard.stockAlerts.footer.unitsRemaining', 'units')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                          {item.status === 'Fully Available' ? safeT('inventoryVal.status.fullyAvailable', 'Fully Available') : item.status === 'Available' ? safeT('inventoryVal.status.available', 'Available') : item.status === 'Partially Available' ? safeT('inventoryVal.status.partiallyAvailable', 'Partially Available') : safeT('inventoryVal.status.outofstock', 'Out of Stock')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <button className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors" title={t('actions.viewProfile')}>
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                      <p>{t('inventoryVal.noMaterialsFound') || 'No materials found matching your criteria.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-neutral-50 dark:bg-slate-900 px-6 py-3 border-t border-neutral-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('inventoryVal.showing') || 'Showing'}{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {filteredInventory.length === 0 ? 0 : 1}
            </span>{' '}
            {t('inventoryVal.to') || 'to'}{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {filteredInventory.length}
            </span>{' '}
            {t('inventoryVal.of') || 'of'}{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {filteredInventory.length}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-neutral-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-neutral-400 dark:text-slate-600 cursor-not-allowed opacity-50" disabled>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="p-2 border border-neutral-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Available Materials Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden mt-6">
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 dark:bg-slate-800/30">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">Available Materials</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-neutral-50 dark:bg-slate-900/50 border-b border-neutral-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
                <th scope="col" className="px-6 py-4 w-1/5 text-left">Material Name</th>
                <th scope="col" className="px-6 py-4 w-1/5 text-left">Required Qty</th>
                <th scope="col" className="px-6 py-4 w-1/5 text-left">Available Qty</th>
                <th scope="col" className="px-6 py-4 w-1/5 text-left">Allocatable Qty</th>
                <th scope="col" className="px-6 py-4 w-1/5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/60">
              {filteredAvailableMaterials.length > 0 ? (
                filteredAvailableMaterials.map((item: any) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 truncate text-left">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate text-left">
                      {item.required.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate text-left">
                      {item.available.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate text-left">
                      {item.allocatableQty.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 truncate text-left">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.computedStatus === 'Fully Available' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60' : item.computedStatus === 'Partially Available' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'}`}>
                        {item.computedStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                    <div className="flex flex-col items-center justify-center">
                      <p>{t('inventoryVal.noMaterialsFound') || 'No materials found matching your criteria.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Actions Row */}
      <div className="flex justify-end pt-2 gap-3 mt-4">
        {canAdvanceAlloc ? (
          <button
            onClick={() => advanceStage('/material-allocation', 'Material Allocation')}
            disabled={hasShortage || filteredInventory.length === 0}
            className={`w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-600 hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-700 dark:text-neutral-300 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${hasShortage || filteredInventory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ListChecks className="h-4 w-4" />
            {t('inventoryVal.allocate') || 'Material Allocation'}
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="You do not have permission to access Material Allocation."
            className="w-full sm:w-auto px-5 py-2.5 bg-neutral-100 dark:bg-slate-800 text-neutral-400 border border-neutral-200 dark:border-slate-700 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Max Stage Reached
          </button>
        )}

        {canAdvanceProcurement ? (
          <button
            onClick={() => advanceStage('/procurement', 'Procurement', true)}
            disabled={!hasShortage}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${!hasShortage
                ? 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 dark:text-slate-500 cursor-not-allowed border border-neutral-200 dark:border-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white'
              }`}
          >
            <Truck className="h-4 w-4" />
            {t('inventoryVal.purchaseRequest') || 'Create Purchase Request'}
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="You do not have permission to access Procurement."
            className="w-full sm:w-auto px-5 py-2.5 bg-neutral-100 dark:bg-slate-800 text-neutral-400 border border-neutral-200 dark:border-slate-700 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Max Stage Reached
          </button>
        )}
      </div>

    </div>
  );
}
