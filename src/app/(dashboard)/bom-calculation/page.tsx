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
import { updateOrderAndLog } from '@/lib/logger';
import { useOrders } from '@/contexts/order-context';
import { getAuthHeaders } from '@/lib/api';
import { isStageMatch, sortSizesAscending } from '@/utils/orderUtils';

function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch(value);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = React.useMemo(() => {
    if (!search || search === value) {
      return options;
    }
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search, value]);

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
                key={idx}
                className="px-3 py-2 text-sm text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/50 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setSearch(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

const mockMaterials = [
  { id: 'denimFabric12oz', name: 'Denim Fabric (12oz)', category: 'Fabric', perPiece: 1.5, unit: 'meters', available: 800 },
  { id: 'cottonFabric', name: 'Cotton Fabric (Premium)', category: 'Fabric', perPiece: 1.2, unit: 'meters', available: 1500 },
  { id: 'silkFabric', name: 'Silk Fabric (Fine)', category: 'Fabric', perPiece: 2.0, unit: 'meters', available: 300 },
  { id: 'heavyDutyThreadNavy', name: 'Heavy Duty Thread (Navy)', category: 'Thread', perPiece: 0.1, unit: 'spools', available: 120 },
  { id: 'standardThreadWhite', name: 'Standard Thread (White)', category: 'Thread', perPiece: 0.1, unit: 'spools', available: 500 },
  { id: 'metalZippers15cm', name: 'Metal Zippers 15cm', category: 'Zippers', perPiece: 1, unit: 'units', available: 45 },
  { id: 'metalButtonsSilver', name: 'Metal Buttons (Silver)', category: 'Buttons', perPiece: 6, unit: 'units', available: 5000 },
  { id: 'brandTagsWoven', name: 'Brand Tags (Woven)', category: 'Collar/Cuff', perPiece: 1, unit: 'units', available: 5000 },
  { id: 'collarHooks', name: 'Collar Hooks', category: 'Hooks', perPiece: 2, unit: 'units', available: 3000 },
];

export default function BOMCalculationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthorized } = useAuth();
  const canAdvance = isAuthorized("Inventory Check");
  const { orders } = useOrders();

  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPODate, setSelectedPODate] = useState<string>('');
  const [selectedPONumber, setSelectedPONumber] = useState<string>('');
  const [detailedOrder, setDetailedOrder] = useState<any>(null);

  const [wastage, setWastage] = useState(5);
  const [editableMaterials, setEditableMaterials] = useState<any[]>([]);
  const [sizePerPieceOverrides, setSizePerPieceOverrides] = useState<Record<string, Record<string, number>>>({});
  const [sizeUnitPriceOverrides, setSizeUnitPriceOverrides] = useState<Record<string, Record<string, number>>>({});
  const [sizeLaborCostOverrides, setSizeLaborCostOverrides] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (selectedPONumber) {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      fetch(`${BACKEND_URL}/purchase_orders/details/${selectedPONumber}`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
           if(data.success !== false) {
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
        })
        .catch(console.error);
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
        return; // Prioritize URL param over draft
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
    // If the currently selected PO is no longer active in this stage, reset the form.
    if (selectedPONumber && !activeOrders.find(o => o.poNumber === selectedPONumber)) {
      setSelectedCustomer('');
      setSelectedPODate('');
      setSelectedPONumber('');
      setWastage(5);
      localStorage.removeItem('bomCalculationDraft');
    }
  }, [activeOrders, selectedPONumber, isLoaded]);

  const customers = Array.from(new Set(activeOrders.map(o => o.customerName))).filter(Boolean) as string[];
  const dates = Array.from(new Set(activeOrders.filter(o => o.customerName === selectedCustomer).map(o => o.poDate))).filter(Boolean) as string[];

  const filteredOrders = activeOrders.filter(o =>
    o.customerName === selectedCustomer &&
    (selectedPODate ? o.poDate === selectedPODate : true)
  );

  const poNumbers = Array.from(new Set(filteredOrders.map(o => o.poNumber))).filter(Boolean) as string[];

  const baseOrder = filteredOrders.find(o => o.poNumber === selectedPONumber);
  const currentOrder = detailedOrder ? { ...baseOrder, ...detailedOrder } : baseOrder;
  const activeSpecs = currentOrder ? (currentOrder.specs || []) : [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      let cleanedDate = dateString.endsWith('GM') ? dateString + 'T' : dateString;
      const d = new Date(cleanedDate);
      if (isNaN(d.getTime())) {
        const parts = dateString.split(/[T ]/);
        return parts.length > 3 ? `${parts[1]} ${parts[2]} ${parts[3]}` : parts[0];
      }
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return dateString.split(/[T ]/)[0];
    }
  };

  const totalProductionRequired = activeSpecs.reduce((sum: number, spec: any) => sum + Math.max(0, (Number(spec.quantity) || 0) - (Number(spec.useExistingStock) || 0)), 0);

  // Calculate BOM data dynamically per order
  const getCalculatedMaterials = () => {
    if (!selectedPONumber || activeSpecs.length === 0) return [];

    const materialReqs: Record<string, number> = {};

    activeSpecs.forEach((spec: any) => {
      const prodReq = Math.max(0, (Number(spec.quantity) || 0) - (Number(spec.useExistingStock) || 0));
      if (prodReq <= 0) return;

      const desc = (spec.itemDescription || '').toLowerCase();
      const pattern = (spec.pattern || '').toLowerCase();

      // Determine what materials this spec needs strictly based on description
      const neededIds = ['brandTagsWoven']; // Universal

      const isDenim = desc.includes('denim') || desc.includes('jeans') || pattern.includes('denim');
      const isShirt = desc.includes('shirt') || desc.includes('polo') || desc.includes('top') || pattern.includes('shirt');
      const isSilk = desc.includes('silk') || desc.includes('blouse') || desc.includes('dress') || pattern.includes('silk');
      const isPant = desc.includes('pant') || desc.includes('trouser') || desc.includes('short');
      const isCotton = desc.includes('cotton') || pattern.includes('cotton');

      if (isDenim) {
        neededIds.push('denimFabric12oz', 'heavyDutyThreadNavy', 'metalZippers15cm', 'metalButtonsSilver');
      } else if (isSilk) {
        neededIds.push('silkFabric', 'standardThreadWhite', 'metalZippers15cm');
      } else if (isShirt || isCotton) {
        neededIds.push('cottonFabric', 'standardThreadWhite', 'collarHooks', 'metalButtonsSilver');
      } else if (isPant) {
        neededIds.push('cottonFabric', 'heavyDutyThreadNavy', 'metalZippers15cm', 'metalButtonsSilver');
      } else {
        // Strict fallback: only provide cotton fabric and thread if no specific garment type is recognized.
        // This ensures the material list looks realistic for a generic input.
        neededIds.push('cottonFabric', 'standardThreadWhite');
      }

      neededIds.forEach(id => {
        const mat = mockMaterials.find(m => m.id === id);
        if (mat) {
          materialReqs[id] = (materialReqs[id] || 0) + (mat.perPiece * prodReq);
        }
      });
    });

    return Object.keys(materialReqs).map(id => {
      const mat = mockMaterials.find(m => m.id === id)!;
      const baseRequired = materialReqs[id];
      const wastageAmount = baseRequired * (wastage / 100);
      const finalQuantity = Math.ceil(baseRequired + wastageAmount);

      const missing = Math.max(0, finalQuantity - mat.available);

      let status = 'Available';
      if (missing > 0) status = 'Procurement Required';
      else if (mat.available - finalQuantity < (finalQuantity * 0.2)) status = 'Low Stock'; // less than 20% buffer left

      const stockRatio = finalQuantity > 0 ? Math.min(100, Math.round((mat.available / finalQuantity) * 100)) : 100;

      return {
        ...mat,
        baseRequired,
        wastageAmount,
        finalQuantity,
        missing,
        status,
        stockRatio
      };
    });
  };

  const calculatedMaterials = getCalculatedMaterials();

  useEffect(() => {
    setEditableMaterials(prev => {
      const newMats = getCalculatedMaterials();
      return newMats.map(mat => {
        const existing = prev.find(e => e.id === mat.id);
        return {
          ...mat,
          brand: existing?.brand || '',
          laborCostPerUnit: existing?.laborCostPerUnit || 0,
          perUnitPrice: existing?.perUnitPrice !== undefined ? existing.perUnitPrice : (mat.category === 'Fabric' ? 5 : 0.5),
          totalQty: existing?.totalQty !== undefined ? existing.totalQty : mat.finalQuantity,
          perPiece: existing?.perPiece !== undefined ? existing.perPiece : mat.perPiece,
        };
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPONumber, totalProductionRequired, wastage]);

  const updateMaterial = (id: string, field: string, value: any) => {
    setEditableMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const updateSizePerPiece = (materialId: string, size: string, value: any) => {
    setSizePerPieceOverrides(prev => ({
      ...prev,
      [materialId]: {
        ...(prev[materialId] || {}),
        [size]: Number(value)
      }
    }));
  };

  const updateSizeUnitPrice = (materialId: string, size: string, value: any) => {
    setSizeUnitPriceOverrides(prev => ({
      ...prev,
      [materialId]: {
        ...(prev[materialId] || {}),
        [size]: Number(value)
      }
    }));
  };

  const updateSizeLaborCost = (materialId: string, size: string, value: any) => {
    setSizeLaborCostOverrides(prev => ({
      ...prev,
      [materialId]: {
        ...(prev[materialId] || {}),
        [size]: Number(value)
      }
    }));
  };

  const uniqueSizes = sortSizesAscending(Array.from(new Set(
    activeSpecs.flatMap((s: any) => {
      if (Array.isArray(s.size)) return s.size.map(String).map((x: string) => x.trim());
      if (typeof s.size === 'string') return s.size.split(',').map((x: string) => x.trim()).filter(Boolean);
      if (s.size) return [String(s.size).trim()];
      return [];
    })
  )));

  const totalFabric = editableMaterials.filter(m => m.category === 'Fabric').reduce((acc, curr) => acc + Number(curr.totalQty || 0), 0);
  const totalAllied = editableMaterials.filter(m => m.category !== 'Fabric').reduce((acc, curr) => acc + Number(curr.totalQty || 0), 0);
  const itemsToProcure = totalProductionRequired > 0 ? editableMaterials.filter(m => m.missing > 0).length : 0;
  
  const estimatedCost = editableMaterials.reduce((acc, curr) => {
    const finalPrice = (Number(curr.totalQty || 0) * Number(curr.perUnitPrice || 0)) + (Number(curr.laborCostPerUnit || 0) * totalProductionRequired);
    return acc + finalPrice;
  }, 0);

  useEffect(() => {
    if (totalProductionRequired > 0) {
      const shortages = calculatedMaterials.filter(m => m.missing > 0).map(m => ({
        id: `PR-${selectedPONumber}-${m.id}`,
        material: m.name,
        category: m.category,
        required: m.finalQuantity,
        available: m.available,
        shortage: m.missing,
        unit: m.unit,
        supplier: 'Auto Assigned Vendor',
        cost: m.missing * (m.category === 'Fabric' ? 5 : 0.5),
        priority: 'Critical',
        status: 'Pending Procurement'
      }));
      localStorage.setItem('autoGeneratedProcurementRequests', JSON.stringify(shortages));
    } else {
      localStorage.removeItem('autoGeneratedProcurementRequests');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalProductionRequired, selectedPONumber]);

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
        {/* 1. BOM Summary Cards (Top) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Scissors className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('bom.fabric')}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{totalFabric.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">meters</span></p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Layers className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('bom.allied')}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{totalAllied.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">units</span></p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{t('bom.cost')}</p>
            </div>
            <p className="text-xl font-bold text-foreground">₹{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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

        {/* 2. Order Configuration (Horizontal Full-Width) */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="border-b border-border px-5 py-4 bg-neutral-50/50 dark:bg-card/30 rounded-t-xl">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {t('bom.config')}
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
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
                }}
              />
            </div>
            <div className="w-full">
              <SearchableDropdown
                label="PO Number"
                options={poNumbers}
                value={selectedPONumber}
                placeholder="Select a PO Number..."
                disabled={!selectedCustomer}
                onChange={(val) => setSelectedPONumber(val)}
              />
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">PO Date</label>
              <div className="w-full h-[42px] px-3 py-2.5 bg-neutral-50 dark:bg-card/50 border border-border text-neutral-700 dark:text-neutral-300 rounded-lg text-sm flex items-center">
                {currentOrder && currentOrder.poDate ? formatDate(currentOrder.poDate) : "—"}
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
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100">
              {t('bom.totalProd')}: {totalProductionRequired} pcs
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {!selectedPONumber || !currentOrder ? (
                <p className="text-sm text-neutral-500 py-2 col-span-full">Please select a PO number.</p>
              ) : activeSpecs.length === 0 ? (
                <p className="text-sm text-neutral-500 py-2 col-span-full">No specifications found for this order.</p>
              ) : (
                activeSpecs.map((spec: any, idx: number) => (
                  <div key={idx} className="bg-neutral-50 dark:bg-card/50 p-3 rounded-lg border border-neutral-100 dark:border-border flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">{spec.itemDescription || '-'} - {spec.pattern || '-'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Size: {typeof spec.size === 'string' ? sortSizesAscending(spec.size.split(',').map((s: string) => s.trim())).join(', ') : (spec.size || '-')} | Ord: {spec.quantity || 0}</p>
                    </div>
                    <div className="text-right pl-3 border-l border-neutral-200 dark:border-neutral-600">
                      <p className="text-[10px] text-muted-foreground uppercase">Req.</p>
                      <p className="text-sm font-bold text-indigo-700">{Math.max(0, (Number(spec.quantity) || 0) - (Number(spec.useExistingStock) || 0))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Procurement Trigger Panel (Only if shortages) */}
        {itemsToProcure > 0 && (
          <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-card p-2 rounded-lg border border-red-200 flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800">{t('procurement.requestsHeader') || 'Procurement Needed'}</h3>
                  <p className="text-xs text-red-600 mt-1">{itemsToProcure} {t('bom.shortages') || 'materials are short for this order.'}</p>
                </div>
              </div>
              <button onClick={() => router.push('/procurement')} className="px-6 py-2.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap">
                <Truck className="h-4 w-4" />
                {t('procurement.createRequest') || 'Trigger Procurement'}
              </button>
            </div>
          </div>
        )}

        {/* 4. Materials Calculation Table */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-6 py-5 flex justify-between items-center bg-neutral-50/50 dark:bg-card/30">
            <h2 className="text-lg font-semibold text-card-foreground">{t('bom.materials')}</h2>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-card border-b border-neutral-100 dark:border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  <th className="px-4 py-3.5 w-[20%] text-left font-semibold">Material Inventory</th>
                  <th className="px-4 py-3.5 w-[14%] text-left font-semibold">Brand</th>
                  <th className="px-4 py-3.5 w-[12%] text-left font-semibold">Selected Sizes</th>
                  <th className="px-4 py-3.5 w-[10%] text-right font-semibold">Per Piece Qty</th>
                  <th className="px-4 py-3.5 w-[12%] text-right font-semibold">Total Qty <span className="text-[9px] block text-neutral-400 lowercase">(inc. wastage)</span></th>
                  <th className="px-4 py-3.5 w-[10%] text-right font-semibold">Per Unit Price</th>
                  <th className="px-4 py-3.5 w-[12%] text-right font-semibold">Final Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {editableMaterials.map((item, idx) => {
                  const isShortage = item.missing > 0;
                  
                  // Calculate size breakdown
                  const sizeRows = uniqueSizes.map((size: any) => {
                    let volume = 0;
                    activeSpecs.forEach((spec: any) => {
                      let specSizes: string[] = [];
                      if (Array.isArray(spec.size)) {
                         specSizes = spec.size.map(String).map((x: string) => x.trim());
                      } else if (typeof spec.size === 'string') {
                         specSizes = spec.size.split(',').map((x: string) => x.trim()).filter(Boolean);
                      } else if (spec.size) {
                         specSizes = [String(spec.size).trim()];
                      }

                      if (!specSizes.includes(size)) return;
                      
                      const prodReq = Math.max(0, (Number(spec.quantity) || 0) - (Number(spec.useExistingStock) || 0));
                      if (prodReq <= 0) return;
                      
                      const sizeVolume = prodReq / specSizes.length;
                      
                      const desc = (spec.itemDescription || '').toLowerCase();
                      const pattern = (spec.pattern || '').toLowerCase();
                      const neededIds = ['brandTagsWoven'];
                      
                      const isDenim = desc.includes('denim') || desc.includes('jeans') || pattern.includes('denim');
                      const isShirt = desc.includes('shirt') || desc.includes('polo') || desc.includes('top') || pattern.includes('shirt');
                      const isSilk = desc.includes('silk') || desc.includes('blouse') || desc.includes('dress') || pattern.includes('silk');
                      const isPant = desc.includes('pant') || desc.includes('trouser') || desc.includes('short');
                      const isCotton = desc.includes('cotton') || pattern.includes('cotton');

                      if (isDenim) {
                        neededIds.push('denimFabric12oz', 'heavyDutyThreadNavy', 'metalZippers15cm', 'metalButtonsSilver');
                      } else if (isSilk) {
                        neededIds.push('silkFabric', 'standardThreadWhite', 'metalZippers15cm');
                      } else if (isShirt || isCotton) {
                        neededIds.push('cottonFabric', 'standardThreadWhite', 'collarHooks', 'metalButtonsSilver');
                      } else if (isPant) {
                        neededIds.push('cottonFabric', 'heavyDutyThreadNavy', 'metalZippers15cm', 'metalButtonsSilver');
                      } else {
                        neededIds.push('cottonFabric', 'standardThreadWhite');
                      }

                      if (neededIds.includes(item.id)) {
                        volume += sizeVolume;
                      }
                    });

                    const currentPerPiece = sizePerPieceOverrides[item.id]?.[size] ?? Number(item.perPiece || 0);
                    const baseReq = volume * currentPerPiece;
                    const wastageAmount = baseReq * (wastage / 100);
                    const sizeTotalQty = Math.ceil(baseReq + wastageAmount);
                    const currentPerUnitPrice = sizeUnitPriceOverrides[item.id]?.[size] ?? Number(item.perUnitPrice || 0);
                    const sizeFinalPrice = (sizeTotalQty * currentPerUnitPrice);

                    return {
                      size,
                      volume,
                      sizeTotalQty,
                      sizeFinalPrice
                    };
                  }).filter(sr => sr.volume > 0);

                  const hasSizeBreakdown = sizeRows.length > 0;
                  
                  const combinedTotalQty = hasSizeBreakdown 
                    ? sizeRows.reduce((sum, sr) => sum + sr.sizeTotalQty, 0)
                    : Number(item.totalQty || 0);
                  
                  const combinedFinalPrice = hasSizeBreakdown
                    ? sizeRows.reduce((sum, sr) => sum + sr.sizeFinalPrice, 0)
                    : (combinedTotalQty * Number(item.perUnitPrice || 0));

                  return (
                    <React.Fragment key={idx}>
                      {!hasSizeBreakdown ? (
                        <tr className={isShortage ? "bg-red-50/50 dark:bg-red-900/10" : "bg-neutral-50/30 dark:bg-slate-800/20"}>
                          <td className="px-4 py-3 text-left align-top">
                            <div className="flex flex-col">
                              <span className={`text-sm font-semibold ${isShortage ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}>{item.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="bg-neutral-100 dark:bg-card text-neutral-600 dark:text-neutral-300 text-[10px] font-medium px-2 py-0.5 rounded-sm border border-neutral-200 dark:border-border">
                                  {item.unit}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-left align-top">
                             <input 
                               type="text" 
                               value={item.brand} 
                               onChange={(e) => updateMaterial(item.id, 'brand', e.target.value)}
                               placeholder="Enter brand"
                               className="w-full bg-transparent border border-transparent hover:border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded pl-0 pr-2 py-1 text-sm transition-colors mb-2"
                             />
                             <select
                               onChange={(e) => updateMaterial(item.id, 'brand', e.target.value)}
                               className="w-full bg-zinc-900 border border-zinc-700 text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                             >
                               <option value="">Standard Size</option>
                               <option value="44-45">44-45</option>
                               <option value="58-60">58-60</option>
                             </select>
                          </td>
                          <td className="px-4 py-3 text-left align-top pt-4">
                            <span className="text-xs text-muted-foreground pl-2">-</span>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                             <input 
                               type="number"
                               min="0"
                               step="0.1"
                               value={item.perPiece} 
                               onChange={(e) => updateMaterial(item.id, 'perPiece', e.target.value)}
                               className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-sm transition-colors"
                             />
                          </td>
                          <td className="px-4 py-3 text-right align-top pt-4">
                               <input 
                                 type="number" 
                                 min="0"
                                 value={item.totalQty} 
                                 onChange={(e) => updateMaterial(item.id, 'totalQty', e.target.value)}
                                 className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-sm font-semibold transition-colors"
                               />
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                             <div className="relative flex items-center">
                               <span className="absolute left-2 text-muted-foreground text-sm">₹</span>
                               <input 
                                 type="number" 
                                 min="0"
                                 value={item.perUnitPrice} 
                                 onChange={(e) => updateMaterial(item.id, 'perUnitPrice', e.target.value)}
                                 className="w-full pl-6 text-right bg-transparent border border-transparent hover:border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-sm transition-colors"
                               />
                             </div>
                          </td>
                          <td className="px-4 py-3 text-right align-top pt-4">
                              <span className={`text-sm font-bold pr-2 ${isShortage ? 'text-red-700 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                ₹{combinedFinalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                          </td>
                        </tr>
                      ) : (
                        sizeRows.map((sr, sIdx) => (
                          <tr key={`${idx}-size-${sIdx}`} className={`transition-colors ${sIdx !== 0 ? 'border-t border-neutral-100 dark:border-slate-800/50' : ''} ${isShortage ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-neutral-50/30 dark:bg-slate-800/20'}`}>
                            {sIdx === 0 && (
                              <>
                                <td rowSpan={sizeRows.length} className="px-4 py-3 text-left align-top bg-white dark:bg-background border-b border-neutral-100 dark:border-slate-800/50">
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-semibold ${isShortage ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}>{item.name}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="bg-neutral-100 dark:bg-card text-neutral-600 dark:text-neutral-300 text-[10px] font-medium px-2 py-0.5 rounded-sm border border-neutral-200 dark:border-border">
                                        {item.unit}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td rowSpan={sizeRows.length} className="px-4 py-3 text-left align-top bg-white dark:bg-background border-b border-neutral-100 dark:border-slate-800/50">
                                   <input 
                                     type="text" 
                                     value={item.brand} 
                                     onChange={(e) => updateMaterial(item.id, 'brand', e.target.value)}
                                     placeholder="Enter brand"
                                     className="w-full bg-transparent border border-transparent hover:border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded pl-0 pr-2 py-1 text-sm transition-colors mb-2"
                                   />
                                   <select
                                     onChange={(e) => updateMaterial(item.id, 'brand', e.target.value)}
                                     className="w-full bg-zinc-900 border border-zinc-700 text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                   >
                                     <option value="">Standard Size</option>
                                     <option value="44-45">44-45</option>
                                     <option value="58-60">58-60</option>
                                   </select>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-2 text-left pl-6">
                              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold px-2 py-1 rounded">
                                {sr.size}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">
                               <input 
                                 type="number"
                                 min="0"
                                 step="0.1"
                                 value={sizePerPieceOverrides[item.id]?.[sr.size] ?? item.perPiece} 
                                 onChange={(e) => updateSizePerPiece(item.id, sr.size, e.target.value)}
                                 className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded pl-0 pr-3 py-1 text-sm transition-colors"
                               />
                            </td>
                            <td className="px-4 py-2 text-right pt-4">
                              <span className="text-sm font-semibold text-foreground pr-3">{sr.sizeTotalQty}</span>
                            </td>
                            <td className="px-4 py-2 text-right">
                               <div className="relative flex items-center">
                                 <span className="absolute left-2 text-muted-foreground text-sm">₹</span>
                                 <input 
                                   type="number" 
                                   min="0"
                                   step="0.1"
                                   value={sizeUnitPriceOverrides[item.id]?.[sr.size] ?? item.perUnitPrice} 
                                   onChange={(e) => updateSizeUnitPrice(item.id, sr.size, e.target.value)}
                                   className="w-full pl-6 text-right bg-transparent border border-transparent hover:border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-sm transition-colors"
                                 />
                               </div>
                            </td>
                            <td className="px-4 py-2 text-right pt-4">
                              <span className={`text-sm font-medium pr-2 ${isShortage ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                ₹{sr.sizeFinalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}

                      {hasSizeBreakdown && (
                        <tr className="bg-indigo-50/30 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-900/50">
                          <td colSpan={4} className="px-4 py-2.5 text-right">
                            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider pr-3">
                              Total Combined Amount
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300 pr-3">
                              {combinedTotalQty}
                            </span>
                          </td>
                          <td className="px-4 py-2.5"></td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300 pr-2">
                              ₹{combinedFinalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-neutral-50 dark:bg-card px-4 py-3 border-t border-border text-xs text-muted-foreground flex justify-between">
            <p>{t('bom.wastage') || 'Calculations include wastage margin.'}</p>
            <p>{t('dashboard.recentOrders.headers.amount') || 'Last recalculated: Just now'}</p>
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
                        
                        const bomLines = editableMaterials.map(m => ({
                          material_id: m.id,
                          material_name: m.name,
                          category: m.category,
                          unit: m.unit,
                          per_piece_qty: Number(m.perPiece || 0),
                          final_qty: Number(m.totalQty || 0),
                          brand: m.brand || '',
                          unit_price: Number(m.perUnitPrice || 0),
                          amount: (Number(m.totalQty || 0) * Number(m.perUnitPrice || 0))
                        }));

                        const res = await fetch(`${BACKEND_URL}/api/bom/save`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...getAuthHeaders(true)
                          },
                          body: JSON.stringify({
                            poNumber: currentOrder.poNumber,
                            bomLines: bomLines,
                            wastagePct: wastage
                          })
                        });

                        const data = await res.json();
                      
                      if (res.ok && data.success !== false) {
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
                        alert(data.error || "Failed to process order");
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