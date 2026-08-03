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
import { MetricCard } from '@/components/MetricCard';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';
import { useOrders } from '@/contexts/order-context';

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
    case 'In Stock': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
    case 'Fully Available': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
    case 'Available': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
    case 'Partial Stock': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
    case 'Partially Available': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
    case 'Low Stock': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
    case 'Out of Stock': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60';
    default: return 'bg-muted text-card-foreground border-border';
  }
};

export default function InventoryPage() {
  const router = useRouter();
  const { user, isAuthorized } = useAuth();
  const canAdvanceAlloc = isAuthorized("Material Allocation");
  const canAdvanceProcurement = isAuthorized("Procurement");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [storeInventoryData, setStoreInventoryData] = useState<any[]>([]);
  const [poInventoryData, setPoInventoryData] = useState<any[]>([]);
  const [apiAvailableMaterials, setApiAvailableMaterials] = useState<any[]>([]);

  const { orders } = useOrders();
  const [selectedPO, setSelectedPO] = useState<string>('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const po = params.get('poNumber');
      if (po) {
        setSelectedPO(po);
      }
    }
  }, []);

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle standard HTTP error statuses cleanly
      if (response.status === 401) {
        console.warn(`[401 Unauthorized] Request to ${endpoint}`);
        return { success: false, data: [], error: 'Unauthorized' };
      }

      if (!response.ok) {
        console.error(`[HTTP ${response.status}] Request to ${endpoint} failed`);
        return { success: false, data: [], error: `Server error ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (networkError) {
      // THIS PREVENTS THE RED SCREEN OF DEATH:
      // Catches CORS blocks, network drops, and offline server errors
      console.error(`[Network Error] Could not connect to API (${endpoint}):`, networkError);
      return { success: false, data: [], error: 'Network error or CORS issue' };
    }
  };

  const fetchPOInventory = async (poNumber: string) => {
    if (!poNumber || poNumber === 'UDF' || poNumber === 'undefined') return;
    const res = await apiFetch(`/api/inventory/check?po_number=${encodeURIComponent(poNumber)}`);
    if (res.success && Array.isArray(res.data)) {
      const formatted = res.data.map((item: any, index: number) => ({
        id: item.id || item.material_id || `MAT-${Math.floor(Math.random() * 1000)}`,
        name: item.material_name || item.name || `Item #${index + 1}`,
        category: item.category || 'Fabric',
        available: item.available_qty || 0,
        required: item.required_qty || 0,
        shortage: item.shortage_qty || 0,
        unit: item.unit || 'units',
        min_required: item.min_required || 0,
        original_status: item.original_status || 'Available'
      }));
      setPoInventoryData(formatted);
    } else {
      setPoInventoryData([]);
    }
  };

  const fetchAvailableMaterials = async (poNumber: string | null) => {
    const endpoint = poNumber
      ? `/api/inventory/available-materials?poNumber=${poNumber}`
      : `/api/inventory/available-materials`;
    const res = await apiFetch(endpoint);
    if (res.success && res.data && res.data.success && res.data.data) {
      setApiAvailableMaterials(res.data.data);
    } else {
      setApiAvailableMaterials([]);
    }
  };

  React.useEffect(() => {
    if (selectedPO) {
      if (orders) {
        const found = orders.find((o: any) => o.poNumber === selectedPO);
        if (found) setCurrentOrder(found);
        else setCurrentOrder(null);
      }
      setIsLoading(true);
      Promise.all([
        fetchPOInventory(selectedPO),
        fetchAvailableMaterials(selectedPO)
      ]).finally(() => setIsLoading(false));
    } else {
      setPoInventoryData([]);
      setCurrentOrder(null);
      fetchAvailableMaterials(null);
    }
  }, [selectedPO, orders]);

  React.useEffect(() => {
    // Fetch real store materials for fallback display
    const fetchStoreMaterials = async () => {
      const res = await apiFetch(`/store_materials/view?limit=1000`, {
        headers: {
          'X-API-Key': 'sasons_read_only_key_2026_abc'
        },
        cache: 'no-store'
      });

      if (res.success && res.data && res.data.success && res.data.data) {
        const formatted = res.data.data.map((item: any, index: number) => ({
          id: item.id || item.material_id || `MAT-${Math.floor(Math.random() * 1000)}`,
          name: item.material_name || item.name || `Item #${index + 1}`,
          category: item.category || 'Fabric',
          available: item.available_qty || 0,
          required: 0,
          unit: item.unit || 'units',
          min_required: item.min_required || 0,
          original_status: item.original_status || 'Available'
        }));
        setStoreInventoryData(formatted);
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
        const fuzzyMatch = currentOrder.specs?.find((s: any) => {
          const sDesc = (s.itemDescription || '').toLowerCase();
          const iName = (item.name || '').toLowerCase();
          return sDesc && iName && (iName.includes(sDesc) || sDesc.includes(iName));
        });
        return {
          id: `PR-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
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
      : storeInventoryData.map(item => ({ ...item, required: 0 }));

    const computedData = sourceData.map((item: any, index: number) => {
      let name = item.material_name || item.name || `Item #${index + 1}`;
      let category = item.category;
      let unit = item.unit;

      if (!name || name.includes('Unknown') || name.startsWith('Item #')) {
        const realItem = storeInventoryData.find(s => s.id.toString() === item.id?.toString());
        if (realItem) {
          name = realItem.material_name || realItem.name || name;
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
          status = available === 0 ? 'Out of Stock' : 'Partial Stock';
        } else {
          status = 'In Stock';
        }
      } else if (item.original_status || item.status) {
        // Fallback to store material status if no PO is active
        if (available <= 0) {
          status = 'Out of Stock';
        } else if (available <= minRequired) {
          status = 'Low Stock';
        } else {
          status = 'In Stock';
        }
      } else {
        if (available <= 0) status = 'Out of Stock';
      }

      // Populate summary analytics parameters concurrently
      if (required > 0) {
        if (status === 'In Stock' || status === 'Available') fullyAvailableCount++;
        else if (status === 'Partial Stock') partiallyAvailableCount++;
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
        computedStatus: available >= required ? 'In Stock' : (available > 0 ? 'Partial Stock' : 'Out of Stock')
      };
    });
  }, [searchTerm, storeInventoryData, validationData]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      <WorkflowIndicator currentStep="Inventory Check" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Box className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            {t('inventoryVal.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('inventoryVal.subtitle')}</p>
        </div>
      </div>

      {/* Allocation Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title={t('inventoryVal.fullyAvailable') as string}
          value={summary.fullyAvailableCount}
          icon={CheckCircle2}
          variant="green"
        />

        <MetricCard
          title={t('inventoryVal.partiallyAvailable') as string}
          value={summary.partiallyAvailableCount}
          icon={AlertTriangle}
          variant="amber"
        />

        <MetricCard
          title={t('inventoryVal.criticalShortages') as string}
          value={summary.criticalCount}
          icon={AlertCircle}
          variant="red"
        />

        <MetricCard
          title={t('inventoryVal.readiness') as string}
          value={hasShortage ? 'Required' : 'Ready'}
          subtitle={hasShortage ? 'Procurement' : 'For Allocation'}
          icon={Layers}
          variant={hasShortage ? "blue" : "green"}
        />
      </div>

      {/* Main Inventory Table Component Container */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">

        {/* Table Header & Controls */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-card-foreground">{t('inventoryVal.materialsHeader')}</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* PO Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedPO}
                  onChange={(e) => {
                    setSelectedPO(e.target.value);
                    const params = new URLSearchParams(window.location.search);
                    if (e.target.value) {
                      params.set('poNumber', e.target.value);
                    } else {
                      params.delete('poNumber');
                    }
                    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                  }}
                  className="block w-full sm:w-48 pl-3 pr-10 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring/20 focus:border-blue-500 sm:text-sm text-foreground appearance-none bg-card cursor-pointer text-ellipsis overflow-hidden"
                >
                  <option value="">Select Purchase Order</option>
                  {orders?.map((order: any) => (
                    <option key={order.poNumber} value={order.poNumber}>
                      {order.poNumber} {order.customerName ? `- ${order.customerName}` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

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
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring/20 focus:border-blue-500 sm:text-sm text-foreground bg-transparent"
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
                  className="block w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring/20 focus:border-blue-500 sm:text-sm text-foreground appearance-none bg-card cursor-pointer"
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
              <tr className="bg-neutral-50 dark:bg-card/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
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
                filteredInventory.map((item: any, index: number) => {
                  const isShortage = item.shortage > 0;
                  return (
                    <tr key={item.id || index} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 min-w-[200px]">
                        <div className="flex flex-col">
                          <span className={`text-sm font-semibold ${isShortage ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                            {safeT(`inventory.materials.items.${item.id}`, item.material_name || item.name || `Item #${index + 1}`)}
                          </span>
                          <span className={`text-xs ${isShortage ? 'text-red-500/80 dark:text-red-500' : 'text-muted-foreground'}`}>
                            {item.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {safeT(`inventory.categories.${item.category?.toLowerCase() || 'unknown'}`, item.category)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        {item.required.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {item.available.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-red-600 dark:text-red-400">
                        {isShortage ? item.shortage.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {item.unit === 'meters'
                          ? safeT('dashboard.stockAlerts.footer.metersRemaining', 'meters')
                          : item.unit === 'spools'
                            ? safeT('dashboard.stockAlerts.footer.spoolsRemaining', 'spools')
                            : safeT('dashboard.stockAlerts.footer.unitsRemaining', 'units')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                          {item.status}
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
              ) : isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p>Loading inventory data...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
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
        <div className="bg-neutral-50 dark:bg-card px-6 py-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('inventoryVal.showing') || 'Showing'}{' '}
            <span className="font-medium text-foreground">
              {filteredInventory.length === 0 ? 0 : 1}
            </span>{' '}
            {t('inventoryVal.to') || 'to'}{' '}
            <span className="font-medium text-foreground">
              {filteredInventory.length}
            </span>{' '}
            {t('inventoryVal.of') || 'of'}{' '}
            <span className="font-medium text-foreground">
              {filteredInventory.length}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-border rounded-md bg-card text-neutral-400 dark:text-slate-600 cursor-not-allowed opacity-50" disabled>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="p-2 border border-border rounded-md bg-card text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Available Materials Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mt-6">
        <div className="border-b border-border px-6 py-5 bg-neutral-50/50 dark:bg-card/30">
          <h2 className="text-lg font-semibold text-card-foreground">Available Materials</h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-neutral-50 dark:bg-card/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
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
                        <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground truncate text-left">
                      {item.required.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground truncate text-left">
                      {item.available.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground truncate text-left">
                      {item.allocatableQty.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 truncate text-left">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(item.computedStatus)}`}>
                        {item.computedStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p>Loading available materials...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
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
          (() => {
            const requiresServiceOutsource = currentOrder?.specs?.some((s: any) => s.outsourceType === 'Service Outsource');

            if (requiresServiceOutsource) {
              return (
                <button
                  onClick={() => advanceStage('/outsource', 'Service Outsource')}
                  disabled={hasShortage || filteredInventory.length === 0}
                  className={`w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${hasShortage || filteredInventory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ListChecks className="h-4 w-4" />
                  Route to Service Outsource
                </button>
              );
            }

            return (
              <button
                onClick={() => advanceStage('/material-allocation', 'Material Allocation')}
                disabled={hasShortage || filteredInventory.length === 0}
                className={`w-full sm:w-auto px-5 py-2.5 bg-card border border-border hover:bg-muted text-neutral-700 dark:text-neutral-300 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${hasShortage || filteredInventory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ListChecks className="h-4 w-4" />
                {t('inventoryVal.allocate') || 'Material Allocation'}
              </button>
            );
          })()
        ) : (
          <button
            type="button"
            disabled
            title="You do not have permission to access Material Allocation."
            className="w-full sm:w-auto px-5 py-2.5 bg-muted text-neutral-400 border border-border rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Max Stage Reached
          </button>
        )}

        {canAdvanceProcurement ? (
          <button
            onClick={() => advanceStage('/procurement', 'Procurement', true)}
            disabled={!hasShortage}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${!hasShortage
              ? 'bg-muted text-neutral-400 dark:text-slate-500 cursor-not-allowed border border-border'
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
            className="w-full sm:w-auto px-5 py-2.5 bg-muted text-neutral-400 border border-border rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Max Stage Reached
          </button>
        )}
      </div>

    </div>
  );
}
