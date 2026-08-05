"use client";

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  FileText,
  Settings,
  Download,
  Truck,
  DollarSign,
  Scissors,
  Layers,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Box,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { getActiveBOMItems } from '@/utils/bomUtils';
import { useOrders } from '@/contexts/order-context';
import { getAuthHeaders } from '@/lib/api';
import { isStageMatch, sortSizesAscending } from '@/utils/orderUtils';

interface SizeRow {
  size: string;
  perPieceQty: number | string;
  totalQty: number;
  perUnitPrice: string | number;
  finalPrice: number;
  orderQty: number;
}

interface MaterialGroup {
  id?: string;
  materialName: string;
  unit?: string;
  brand?: string;
  sizeType?: string;
  sizes: SizeRow[];
  totalCombinedQty: number;
  totalCombinedAmount: number;
  category?: string;
  fabric_width?: string;
  selectedWidth?: string;
  available_widths?: string[];
  brandOptions?: string[];
  selectedBrand?: string;
  missing?: number;
  finalQuantity?: number;
  available?: number;
}

type DropdownOption = string | { label: string; value: string };

function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  label: string;
}) {
  const getLabel = (opt: DropdownOption) => typeof opt === 'string' ? opt : opt.label;
  const getValue = (opt: DropdownOption) => typeof opt === 'string' ? opt : opt.value;

  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => getValue(opt) === value);
  const displayLabel = selectedOption ? getLabel(selectedOption) : value;
  const [search, setSearch] = useState(displayLabel);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(displayLabel);
  }, [displayLabel]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch(displayLabel);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [displayLabel]);

  const filteredOptions = React.useMemo(() => {
    if (!search || search === displayLabel) {
      return options;
    }
    return options.filter((opt) =>
      getLabel(opt).toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search, displayLabel]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full h-[42px] px-3 py-2.5 pr-10 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-card border border-border rounded-lg shadow-lg py-1">
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-500">No options found</li>
          ) : (
            filteredOptions.map((opt, idx) => (
              <li
                key={`opt-${getValue(opt)}-${idx}`}
                className="px-3 py-2 text-sm text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/50 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(getValue(opt));
                  setSearch(getLabel(opt));
                  setIsOpen(false);
                }}
              >
                {getLabel(opt)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// Helper: Safely parse JSON responses without crashing on HTML 404/500 pages
const safeFetchJson = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    console.error(`Fetch failed for ${url} with status ${res.status}`);
    return { success: false, data: null };
  }
  const data = await res.json();
  return { success: true, data };
};

// Sanitizer Helper: Converts "PO-2024-005 (Rishi)" -> "PO-2024-005"
const sanitizePOKey = (rawInput: any): string => {
  if (!rawInput) return '';
  const str = String(rawInput);
  return str
    .replace(/^PO:\s*/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .split('|')[0]
    .trim();
};

export default function BOMCalculationView() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthorized } = useAuth();
  const canAdvance = isAuthorized("Inventory Check");
  const { orders } = useOrders();

  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPODate, setSelectedPODate] = useState<string>('');
  const [selectedPONumber, setSelectedPONumber] = useState<string>('');
  const [detailedOrder, setDetailedOrder] = useState<any>(null);

  const [wastage, setWastage] = useState(5);
  const [materials, setMaterials] = useState<MaterialGroup[]>([]);
  const [, setGarmentSpecs] = useState<any>(null);
  const [sleeveType, setSleeveType] = useState<string>('');
  const [selectedGarmentIndex, setSelectedGarmentIndex] = useState<number>(0);
  const [isTotalBomMode, setIsTotalBomMode] = useState<boolean>(false);

  useEffect(() => {
    if (selectedPONumber) {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      safeFetchJson(`${BACKEND_URL}/purchase_orders/details/${selectedPONumber}`, {
        headers: getAuthHeaders()
      }).then(({ success, data }) => {
        if (success && data && data.success !== false) {
          setDetailedOrder({
            ...data,
            poNumber: data.po_number || selectedPONumber,
            specs: data.specs?.map((s: any) => ({
              ...s,
              itemDescription: s.item_description,
              stockAvailable: s.stock_available,
              useExistingStock: s.use_existing_stock,
              stockStatus: s.stock_status
            })) || []
          });
        }
      });
    } else {
      setDetailedOrder(null);
    }
  }, [selectedPONumber]);

  useEffect(() => {
    const ordersStr = localStorage.getItem('savedOrders');
    let loadedOrders = [];
    if (ordersStr) {
      try {
        loadedOrders = JSON.parse(ordersStr);
      } catch (e) { }
    }

    const params = new URLSearchParams(window.location.search);
    const urlPoNumber = params.get('poNumber');

    if (urlPoNumber) {
      const targetKeywords = ['bom calculation'];
      const targetOrder = loadedOrders.find((o: any) => o.poNumber === urlPoNumber && isStageMatch(o.stage, targetKeywords) && o.status === 'SUBMITTED');
      if (targetOrder) {
        setSelectedCustomer(targetOrder.customerName || '');
        setSelectedPODate(targetOrder.poDate || '');
        setSelectedPONumber(targetOrder.poNumber || '');
        setWastage(5);
        return;
      }
    }

    const draft = localStorage.getItem('bomCalculationDraft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.selectedCustomer) setSelectedCustomer(data.selectedCustomer);
        if (data.selectedPODate) setSelectedPODate(data.selectedPODate);
        if (data.selectedPONumber) setSelectedPONumber(data.selectedPONumber);
        if (data.wastage !== undefined) setWastage(data.wastage);
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 800);
    if (orders && orders.length > 0) {
      setIsLoaded(true);
    }
    return () => clearTimeout(timer);
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('bomCalculationDraft', JSON.stringify({ selectedCustomer, selectedPODate, selectedPONumber, wastage }));
  }, [selectedCustomer, selectedPODate, selectedPONumber, wastage]);

  const activeOrders = React.useMemo(() => {
    const targetKeywords = ['bom calculation'];
    return (orders || []).filter(o => isStageMatch(o.stage, targetKeywords) && o.status === 'SUBMITTED');
  }, [orders]);

  useEffect(() => {
    if (!isLoaded) return;
    if (selectedPONumber && !activeOrders.find(o => o.poNumber === selectedPONumber)) {
      setSelectedCustomer('');
      setSelectedPODate('');
      setSelectedPONumber('');
      setWastage(5);
      localStorage.removeItem('bomCalculationDraft');
    }
  }, [activeOrders, selectedPONumber, isLoaded]);

  const customers = Array.from(new Set(activeOrders.map(o => o.customerName))).filter(Boolean) as string[];

  const filteredOrders = activeOrders.filter(o =>
    o.customerName === selectedCustomer &&
    (selectedPODate ? o.poDate === selectedPODate : true)
  );

  // Handle PO Dropdown Change with safe fetch handling
  const handlePOChange = async (selectedPO: string) => {
    if (!selectedPO) {
      setMaterials([]);
      setGarmentSpecs(null);
      return;
    }

    const cleanPO = sanitizePOKey(selectedPO);
    setSelectedPONumber(cleanPO);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const flaskResult = await safeFetchJson(`${BACKEND_URL}/api/bom/calculate-from-db?poNumber=${encodeURIComponent(cleanPO)}`);

    if (flaskResult.success && flaskResult.data?.success) {
      setMaterials(flaskResult.data.materials || flaskResult.data.bom_calculations || []);
      setGarmentSpecs(flaskResult.data.garmentSpecs || null);
      return;
    }

    // Fallback to Next.js API route if backend is unavailable
    const nextResult = await safeFetchJson(`/api/bom/calculate?poNumber=${encodeURIComponent(cleanPO)}`);
    if (nextResult.success && nextResult.data?.success) {
      setMaterials(nextResult.data.materials || nextResult.data.bom_calculations || []);
      setGarmentSpecs(nextResult.data.garmentSpecs || null);
    } else {
      setMaterials([]);
      setGarmentSpecs(null);
    }
  };

  const poNumbers = Array.from(new Set(filteredOrders.map(o => o.poNumber))).filter(Boolean) as string[];
  const poDropdownOptions = poNumbers.map(po => {
    const order = filteredOrders.find(o => o.poNumber === po);
    const rawPo = sanitizePOKey(po);
    return { label: `${po} (${order?.customerName || selectedCustomer})`, value: rawPo };
  });

  const baseOrder = filteredOrders.find(o => o.poNumber === selectedPONumber);
  const currentOrder = detailedOrder ? { ...baseOrder, ...detailedOrder } : baseOrder;
  const activeSpecs = currentOrder ? (currentOrder.specs || []) : [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) {
        const parts = dateString.split(/[T ]/);
        return parts[0];
      }
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateString.split(/[T ]/)[0];
    }
  };

  const activeGarment = activeSpecs[selectedGarmentIndex] || activeSpecs[0];

  const totalProductionRequired = isTotalBomMode
    ? activeSpecs.reduce((sum: number, spec: any) => sum + Math.max(0, (Number(spec.quantity) || 0) - (Number(spec.useExistingStock) || 0)), 0)
    : activeGarment
      ? Math.max(0, (Number(activeGarment.quantity) || 0) - (Number(activeGarment.useExistingStock) || 0))
      : 0;

  const garmentType = isTotalBomMode ? 'Total Order' : (activeGarment?.itemDescription || 'Shirt');

  useEffect(() => {
    if (currentOrder && activeGarment) {
      const garmentDetailsArray = currentOrder?.garmentDetails || currentOrder?.garment_details || [];
      const matchingGarmentDetail = Array.isArray(garmentDetailsArray) && garmentDetailsArray.length > selectedGarmentIndex ? garmentDetailsArray[selectedGarmentIndex] : garmentDetailsArray[0];

      const sleeveValue =
        activeGarment?.sleeveType ||
        activeGarment?.sleeve_type ||
        activeGarment?.sleeve ||
        matchingGarmentDetail?.sleeveType ||
        matchingGarmentDetail?.sleeve_type ||
        matchingGarmentDetail?.sleeve ||
        currentOrder?.sleeveType ||
        currentOrder?.sleeve_type ||
        '';

      if (sleeveValue.toLowerCase().includes('half')) {
        setSleeveType('half_sleeve');
      } else if (sleeveValue.toLowerCase().includes('full')) {
        setSleeveType('full_sleeve');
      } else {
        setSleeveType('');
      }
    } else {
      setSleeveType('');
    }
  }, [currentOrder, activeGarment, selectedGarmentIndex]);

  useEffect(() => {
    if (selectedPONumber) {
      handlePOChange(selectedPONumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPONumber, selectedGarmentIndex, activeGarment?.itemDescription, sleeveType]);

  // Recalculate totals dynamically if wastage changes
  React.useEffect(() => {
    setMaterials(prev => prev.map(mat => {
      const sizes = mat.sizes.map((sz: SizeRow) => {
        const numericQty = parseFloat(String(sz.perPieceQty)) || 0;
        const numericPrice = parseFloat(String(sz.perUnitPrice)) || 0;

        const newTotalQty = (numericQty * sz.orderQty) * (1 + (wastage || 0) / 100);
        const newFinalPrice = newTotalQty * numericPrice;

        return {
          ...sz,
          totalQty: Number(newTotalQty.toFixed(2)),
          finalPrice: Number(newFinalPrice.toFixed(2))
        };
      });

      return {
        ...mat,
        sizes,
        totalCombinedQty: Number(sizes.reduce((sum: number, s: SizeRow) => sum + s.totalQty, 0).toFixed(2)),
        totalCombinedAmount: Number(sizes.reduce((sum: number, s: SizeRow) => sum + s.finalPrice, 0).toFixed(2))
      };
    }));
  }, [wastage]);

  const totals = React.useMemo(() => {
    let totalFabricMeters = 0;
    let totalAlliedUnits = 0;
    let grandTotalCost = 0;

    materials.forEach((mat) => {
      const isFabric = mat.materialName?.toLowerCase().includes('fabric');

      mat.sizes.forEach((s: any) => {
        const qty = parseFloat(String(s.totalQty)) || 0;
        const price = parseFloat(String(s.finalPrice)) || 0;

        if (isFabric) {
          totalFabricMeters += qty;
        } else {
          totalAlliedUnits += qty;
        }
        grandTotalCost += price;
      });
    });

    return {
      totalFabric: totalFabricMeters.toFixed(1),
      alliedMaterials: Math.round(totalAlliedUnits),
      estCost: grandTotalCost.toFixed(2)
    };
  }, [materials]);

  const itemsToProcure = totalProductionRequired > 0 ? materials.filter(m => (m.missing || 0) > 0).length : 0;

  return (
    <div className="max-w-full mx-auto space-y-4 sm:space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      <WorkflowIndicator currentStep="BOM Calculation" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-6 w-6 text-indigo-600" />
            {t('bom.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('bom.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. BOM Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Scissors className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('bom.fabric')}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{totals.totalFabric} <span className="text-sm font-normal text-muted-foreground">meters</span></p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Layers className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('bom.allied')}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{totals.alliedMaterials} <span className="text-sm font-normal text-muted-foreground">units</span></p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('bom.cost')}</p>
            </div>
            <p className="text-xl font-bold text-foreground">₹{Number(totals.estCost).toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Box className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('bom.shortages')}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{itemsToProcure} <span className="text-sm font-normal text-muted-foreground">{t('procurement.requestsHeader') || 'materials'}</span></p>
          </div>
        </div>

        {/* 2. Order Configuration */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="border-b border-border px-5 py-4 bg-neutral-50/50 dark:bg-card/30 rounded-t-xl">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {t('bom.config')}
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 items-end">
            <div className="w-full">
              <SearchableDropdown
                label="Customer Name"
                options={customers}
                value={selectedCustomer}
                placeholder="Select a Customer..."
                onChange={(val) => {
                  setSelectedCustomer(val);
                  setSelectedPODate('');
                  setSelectedPONumber('');
                  setWastage(5);
                }}
              />
            </div>
            <div className="w-full">
              <SearchableDropdown
                label="PO Number"
                options={poDropdownOptions}
                value={selectedPONumber}
                placeholder="Select a PO Number..."
                disabled={!selectedCustomer}
                onChange={(val) => {
                  setSelectedGarmentIndex(0);
                  setWastage(5);
                  handlePOChange(val);
                }}
              />
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">PO Date</label>
              <div className="w-full h-[42px] px-3 py-2.5 bg-neutral-50 dark:bg-card/50 border border-border text-neutral-700 dark:text-neutral-300 rounded-lg text-sm flex items-center cursor-not-allowed">
                {currentOrder && currentOrder.poDate ? formatDate(currentOrder.poDate) : "—"}
              </div>
            </div>
            <div className="w-full flex flex-col gap-1.5">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">CATEGORY</label>
              <div className="w-full h-[42px] px-3 py-2.5 bg-neutral-50 dark:bg-card/50 border border-border text-neutral-700 dark:text-neutral-300 rounded-lg text-sm flex items-center cursor-not-allowed select-none">
                {garmentType || 'N/A'}
              </div>
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                {t('bom.wastage')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={wastage}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 0;
                    if (val > 20) val = 20;
                    if (val < 0) val = 0;
                    setWastage(val);
                  }}
                  className="w-full h-[42px] px-3 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <span className="text-indigo-600 font-bold">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Garment Details */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-5 py-4 bg-neutral-50/50 dark:bg-card/30 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              {t('bom.details')}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTotalBomMode(!isTotalBomMode)}
                className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors ${isTotalBomMode
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-card text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
              >
                {isTotalBomMode ? 'View Individual BOM' : 'Total BOM Cal.'}
              </button>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                {t('bom.totalProd')}: {totalProductionRequired} pcs
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {!selectedPONumber || !currentOrder ? (
                <p className="text-sm text-neutral-500 py-2 col-span-full">Please select a PO number.</p>
              ) : activeSpecs.length === 0 ? (
                <p className="text-sm text-neutral-500 py-2 col-span-full">No specifications found for this order.</p>
              ) : (
                activeSpecs.map((spec: any, idx: number) => {
                  const isSelected = !isTotalBomMode && selectedGarmentIndex === idx;
                  const sValue = spec?.sleeveType || spec?.sleeve_type || spec?.sleeve || '';
                  const formattedSleeve = sValue ? sValue.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'N/A';

                  return (
                    <button
                      key={`spec-card-${idx}`}
                      onClick={() => setSelectedGarmentIndex(idx)}
                      className={`text-left transition-all p-3 rounded-lg border flex justify-between items-start ${isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                        : 'bg-neutral-50 dark:bg-card/50 border-neutral-100 dark:border-border hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:bg-neutral-100 dark:hover:bg-card/80'
                        }`}
                    >
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-foreground'}`}>
                          {spec.itemDescription || '-'}{spec.pattern && !((spec.itemDescription || '').toLowerCase().includes(spec.pattern.toLowerCase())) ? ` - ${spec.pattern}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Size: {typeof spec.size === 'string' ? sortSizesAscending(Array.from(new Set(spec.size.split(',').map((s: string) => s.trim()).filter(Boolean)))).join(', ') : (spec.size || '-')} | Ord: {spec.quantity || 0}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded border font-medium bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-zinc-800 dark:text-zinc-400">
                            Sleeve: {formattedSleeve}
                          </span>
                        </div>
                      </div>
                      <div className="text-right pl-3 border-l border-neutral-200">
                        <p className="text-[10px] text-muted-foreground uppercase">Req.</p>
                        <p className="text-sm font-bold text-foreground">
                          {Math.max(0, (Number(spec.quantity) || 0) - (Number(spec.useExistingStock) || 0))}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 4. Materials Calculation Table */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-6 py-5 flex justify-between items-center bg-neutral-50/50 dark:bg-card/30">
            <h2 className="text-lg font-semibold text-card-foreground">{t('bom.materials')}</h2>
          </div>

          <div className="w-full bg-[#0d121f] border-t border-gray-800 overflow-hidden text-gray-200">
            <div className="grid grid-cols-12 px-6 py-3 bg-gray-950/80 border-b border-gray-800 text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
              <div className="col-span-3">Material Inventory</div>
              <div className="col-span-2">Brand</div>
              <div className="col-span-1 text-center">Selected Sizes</div>
              <div className="col-span-2 text-center">Per Piece Qty</div>
              <div className="col-span-2 text-center">Total Qty <span className="text-[9px] text-gray-500 lowercase">(inc. wastage)</span></div>
              <div className="col-span-1 text-right">Per Unit Price</div>
              <div className="col-span-1 text-right">Final Price</div>
            </div>

            {materials && materials.length > 0 ? (
              materials.map((mat, matIdx) => {
                const combinedQty = Number(mat.totalCombinedQty || 0);
                const combinedPrice = Number(mat.totalCombinedAmount || 0);
                const matKey = `bom-row-${mat.id || mat.materialName || 'mat'}-${matIdx}`;

                return (
                  <div key={matKey} className="border-b border-gray-800/80">
                    <div className="grid grid-cols-12 px-6 py-4 items-start">

                      <div className="col-span-3 pr-4">
                        <h4 className="text-sm font-bold text-white">{mat.materialName}</h4>
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] bg-gray-800/80 text-gray-400 rounded-full border border-gray-700/50">
                          {mat.unit || 'units'}
                        </span>
                      </div>

                      <div className="col-span-2 pr-6 flex flex-col gap-2">
                        <span className="text-gray-400 text-xs py-1">
                          {mat.selectedBrand || mat.brand || 'No Brand'}
                        </span>
                        <span className="text-gray-300 text-xs px-2.5 py-1.5 rounded border border-gray-800">
                          {mat.selectedWidth || mat.fabric_width || "Standard Size"}
                        </span>
                      </div>

                      <div className="col-span-7 flex flex-col">
                        {(mat.sizes || []).map((row: SizeRow, sizeIdx: number) => (
                          <div
                            key={`size-${matKey}-${row.size || sizeIdx}`}
                            className="grid grid-cols-7 items-center py-2 border-b border-gray-800/40 last:border-0 text-xs"
                          >
                            <div className="col-span-1 flex justify-center">
                              <span className="bg-indigo-950/80 text-indigo-300 font-semibold px-2.5 py-0.5 rounded border border-indigo-800/50">
                                {row.size}
                              </span>
                            </div>

                            <div className="col-span-2 flex justify-center text-gray-200">
                              {row.perPieceQty ?? 0}
                            </div>

                            <div className="col-span-2 text-center font-bold text-gray-200">
                              {row.totalQty || 0}
                            </div>

                            <div className="col-span-1 flex items-center justify-end gap-1 text-gray-200">
                              <span className="text-gray-500">₹</span>
                              {row.perUnitPrice ?? 0}
                            </div>

                            <div className="col-span-1 text-right font-bold text-white">
                              ₹{(parseFloat(String(row.finalPrice)) || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                    <div className="grid grid-cols-12 px-6 py-2.5 bg-[#101626] border-t border-gray-800 text-xs font-bold items-center">
                      <div className="col-span-5"></div>
                      <div className="col-span-2 text-indigo-400 uppercase tracking-wider text-[11px]">
                        Total Combined Amount
                      </div>
                      <div className="col-span-2 text-center text-indigo-300 text-sm">
                        {combinedQty}
                      </div>
                      <div className="col-span-1"></div>
                      <div className="col-span-2 text-right text-indigo-300 text-sm">
                        ₹{combinedPrice.toFixed(2)}
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No materials found for this garment in DB.
              </div>
            )}
          </div>
          <div className="flex justify-between items-center px-6 py-4 bg-gray-900 border-t border-gray-800 rounded-b-xl text-sm font-semibold">
            <div className="text-gray-400">
              Wastage Margin Applied: <span className="text-indigo-400">{wastage}%</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 mr-3">GRAND TOTAL AMOUNT:</span>
              <span className="text-lg text-emerald-400 font-bold">
                ₹{Number(totals.estCost).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
          <div className="flex-1">
            {totalProductionRequired === 0 && (
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                No BOM required. Order fulfilled using existing stock.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-2.5 bg-card border border-border text-neutral-700 dark:text-neutral-300 rounded-lg shadow-sm hover:bg-muted transition-colors font-medium text-sm flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              {t('bom.export')}
            </button>
            {canAdvance ? (
              <button
                onClick={async () => {
                  if (currentOrder) {
                    try {
                      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

                      // FIX: Ensure total_qty and final_price map correctly to s.totalQty and s.finalPrice
                      const payload = {
                        po_number: currentOrder.poNumber,
                        customer_name: currentOrder.customerName,
                        wastage_margin: Number(wastage),
                        grand_total_amount: Number(totals.estCost),
                        materials: materials.map(m => ({
                          material_name: m.materialName || '',
                          brand: m.selectedBrand || m.brand || 'Standard',
                          size_breakdown: m.sizes.map((s: SizeRow) => ({
                            size: s.size,
                            per_piece_qty: Number(s.perPieceQty || 0),
                            total_qty: Number(s.totalQty || 0),         // Fixed property reference
                            per_unit_price: Number(s.perUnitPrice || 0),
                            final_price: Number(s.finalPrice || 0)       // Fixed property reference
                          }))
                        }))
                      };

                      const { success, data } = await safeFetchJson(`${BACKEND_URL}/api/bom/check-inventory`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...getAuthHeaders(true)
                        },
                        body: JSON.stringify(payload)
                      });

                      if (success && data && data.success !== false) {
                        window.dispatchEvent(new Event("orders-updated"));
                        const targetPoNumber = currentOrder.poNumber;

                        setSelectedCustomer('');
                        setSelectedPODate('');
                        setSelectedPONumber('');
                        setWastage(5);
                        localStorage.removeItem('bomCalculationDraft');

                        window.history.replaceState(null, '', window.location.pathname);
                        router.push(`/inventory?poNumber=${encodeURIComponent(targetPoNumber)}`);
                      } else {
                        alert(data?.error || "Failed to process order");
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Network error. Please try again.");
                    }
                  }
                }}
                disabled={totalProductionRequired === 0}
                className={`w-full sm:w-auto px-8 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${totalProductionRequired === 0
                  ? 'bg-muted text-neutral-400 cursor-not-allowed border border-border'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
              >
                {t('bom.checkInventory')}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="You do not have permission to access Inventory Check."
                className="w-full sm:w-auto px-8 py-2.5 bg-muted text-neutral-400 cursor-not-allowed border border-border rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2"
              >
                Max Stage Reached
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}