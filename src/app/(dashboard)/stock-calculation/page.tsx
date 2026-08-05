"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import {
  Package,
  Box,
  AlertCircle,
  CheckCircle2,
  Calculator,
  ChevronDown
} from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';
import { useOrders } from '@/contexts/order-context';
import { getAuthHeaders } from '@/lib/api';
import { isStageMatch, sortSizesAscending, getOrderSpecifications } from '@/utils/orderUtils';

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

interface GarmentSpec {
  id: string;
  itemDescription: string;
  size: string;
  pattern: string;
  quantity: number;
  unitPrice: number;
  photoName: string | null;
  stockAvailable?: number;
  useExistingStock?: number;
}

interface SavedOrder {
  id: string;
  poNumber: string;
  customerName: string;
  poDate: string;
  deliveryDate: string;
  poAmount: number | '';
  totalAmount: number | '';
  specs: GarmentSpec[];
  status: string;
  stage?: string;
  date: string;
}

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
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const filteredOptions = useMemo(() => {
    if (!search || search === value) {
      return options;
    }
    const query = search.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(query));
  }, [options, search, value]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
          className="w-full px-3 py-2 pr-10 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-card border border-border rounded-lg shadow-lg py-1 border-t-0">
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-500 italic">No options found</li>
          ) : (
            filteredOptions.map((opt, idx) => (
              <li
                key={idx}
                className="px-3 py-2 text-sm text-foreground hover:bg-blue-50 dark:hover:bg-blue-900/40 cursor-pointer transition-colors"
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

function StockCalculationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { user, isAuthorized } = useAuth();
  const canAdvanceBOM = isAuthorized("BOM Calculation");
  const canAdvanceQuality = isAuthorized("Quality & Packing");
  const canAdvanceProcurement = isAuthorized("Procurement");
  const { orders, updateOrderState, reloadOrders } = useOrders();

  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPONumber, setSelectedPONumber] = useState<string>('');
  const [detailedOrder, setDetailedOrder] = useState<any>(null);
  const [orderSpecifications, setOrderSpecifications] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [allocatedToPacking, setAllocatedToPacking] = useState(false);
  const [allocatedToBOM, setAllocatedToBOM] = useState(false);
  const [localPartialDispatched, setLocalPartialDispatched] = useState(false);

  useEffect(() => {
    setAllocatedToPacking(false);
    setAllocatedToBOM(false);
    setLocalPartialDispatched(false);
  }, [selectedPONumber]);

  // Synchronize component dropdown selections with search parameters safely
  useEffect(() => {
    setSelectedCustomer(searchParams.get('customerName') || '');
    setSelectedPONumber(searchParams.get('poNumber') || '');
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 800);
    if (orders && orders.length > 0) {
      setIsLoaded(true);
    }
    return () => clearTimeout(timer);
  }, [orders]);

  // Compute active tracking datasets inside a isolated block
  const activeOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    const filtered = orders.filter((o) => {
      // Extract stage from any possible field name
      const rawStage = String(
        o.stage || o.activeStage || o.currentStage || o.current_stage || o.step || ''
      ).toLowerCase().replace(/[\s_]+/g, '');

      // Match 'stockcheck'
      const isStockCheck = rawStage.includes('stockcheck');

      // Check completion flags
      const isCompleted = 
        o.stock_check_completed === true || 
        o.is_submitted === true || 
        String(o.status || '').toUpperCase() === 'COMPLETED';

      return isStockCheck && !isCompleted;
    });

    const formattedOrders = filtered.map(order => ({
      ...order,
      po_number: order.po_number || order.poNumber,
      customer_name: order.customer_name || order.customerName || order.clientName,
      po_date: order.po_date || order.poDate,
      delivery_date: order.delivery_date || order.deliveryDate,
      
      // MAP SPECIFICATIONS
      specifications: order.specifications || order.items || [
        {
          category: order.category || "Shirt",
          sleeve_type: order.sleeve_type || "full_sleeve",
          colors: order.colors || "Blue",
          sizes: order.sizes || "42, 44, 46, 48, 50",
          ordered_qty: order.quantity || order.ordered_qty || 100
        }
      ],
      available_stock: order.available_stock ?? order.storeStock ?? order.store_stock ?? 0
    }));

    if (formattedOrders.length === 0) {
      console.log("ALL ORDERS IN STORE:", orders);
    }

    return formattedOrders;
  }, [orders]);

  // Track layout boundaries and clear data parameters if an assignment shifts status metrics
  useEffect(() => {
    if (!isLoaded) return;
    if (selectedPONumber && !activeOrders.some((o) => o.poNumber === selectedPONumber)) {
      setSelectedCustomer('');
      setSelectedPONumber('');
    }
  }, [activeOrders, selectedPONumber, isLoaded]);

  // Unique lists derived directly from active states
  const customers = useMemo(() => {
    if (!activeOrders.length) return [];
    
    const names = activeOrders
      .map((o) => o.customerName || o.customer_name || o.clientName || o.customer?.name)
      .filter(Boolean);

    return Array.from(new Set(names));
  }, [activeOrders]);

  const poNumbers = useMemo(() => {
    if (!selectedCustomer) return [];
    return Array.from(
      new Set(
        activeOrders
          .filter((o) => o.customerName === selectedCustomer)
          .map((o) => o.poNumber || o.po_number)
      )
    ).filter(Boolean);
  }, [activeOrders, selectedCustomer]);

  const selectedOrder = useMemo(() => {
    return activeOrders.find(
      (o) => o.customerName === selectedCustomer && o.poNumber === selectedPONumber
    );
  }, [activeOrders, selectedCustomer, selectedPONumber]);

  useEffect(() => {
    if (selectedPONumber) {
      setStatusMessage(null);
      // 1. Find the selected order dynamically from your global or parent state
      const order = activeOrders.find(
        (o: any) => o.po_number === selectedPONumber || o.poNumber === selectedPONumber
      ) || orders.find(
        (o: any) => o.po_number === selectedPONumber || o.poNumber === selectedPONumber
      );

      if (!order) {
        setDetailedOrder(null);
        return;
      }

      // Fetch accurate specifications and total qty from the backend
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      fetch(`${BACKEND_URL}/api/stock-check/${selectedPONumber}`, {
        method: 'GET',
        headers: getAuthHeaders(true)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const specsList = order.specifications || order.items || order.specs || [];
          setDetailedOrder({
            ...order,
            poNumber: order.po_number || order.poNumber,
            customerName: order.customer_name || order.customerName || order.clientName,
            poDate: order.po_date || order.poDate || order.created_at || 'N/A',
            deliveryDate: order.delivery_date || order.deliveryDate || 'N/A',
            specificationsSummary: data.orderSpecification,
            totalQty: data.totalQty,
            storeStock: order.store_stock ?? order.available_stock ?? 0,
            status: data.status,
            specs: specsList.map((s: any) => ({
              ...s,
              itemDescription: s.item_description || s.garment_name || s.category,
              stockAvailable: s.stock_available || s.store_stock || 0,
              useExistingStock: s.use_existing_stock || 0,
              stockStatus: s.stock_status || ((s.store_stock || 0) >= (s.quantity || s.qty || 0) ? 'IN_STOCK' : (s.store_stock || 0) > 0 ? 'PARTIAL' : 'OUT_OF_STOCK')
            }))
          });
          setOrderSpecifications(specsList);
        } else {
          // Fallback if backend fails
          setDetailedOrder(null);
        }
      })
      .catch(err => {
        console.error("Failed to fetch stock check for PO:", err);
        setDetailedOrder(null);
      });
    } else {
      setDetailedOrder(null);
      setOrderSpecifications([]);
    }
  }, [selectedPONumber, activeOrders, orders]);

  // Structural metric processing updates
  const orderAnalysis = useMemo(() => {
    const specs = detailedOrder?.specs || [];
    if (specs.length === 0) {
      return { isFormValid: false, totalQuantity: 0, totalProductionRequired: 0, derivedPODate: '' };
    }

    let totalQuantity = 0;
    let totalProductionRequired = 0;
    let isFormValid = true;

    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      const allocation = spec.useExistingStock || 0;
      const stock = spec.stockAvailable || 0;

      if (allocation > stock || allocation > spec.quantity) {
        isFormValid = false;
      }
      totalQuantity += spec.quantity || 0;
      totalProductionRequired += Math.max(0, (spec.quantity || 0) - allocation);
    }

    return {
      isFormValid,
      totalQuantity,
      totalProductionRequired,
      derivedPODate: detailedOrder?.poDate ? detailedOrder.poDate : (detailedOrder?.order_date || ''),
    };
  }, [detailedOrder]);

  const displayOrder = detailedOrder || selectedOrder;
  
  const { isFullyAvailable, isPartiallyAvailable, isNotAvailableAtAll } = useMemo(() => {
    const specs = getOrderSpecifications(displayOrder);
    if (!specs || specs.length === 0) {
      return { isFullyAvailable: false, isPartiallyAvailable: false, isNotAvailableAtAll: true };
    }
    let allAvailable = true;
    let allOut = true;
    specs.forEach((s: any) => {
      const avail = s.stockAvailable || s.stock_available || 0;
      const req = s.quantity || s.qty || s.order_qty || 0;
      const status = s.stockStatus || (avail > 0 ? (avail >= req ? 'Available' : 'Low Stock') : 'Out of Stock');
      if (status !== 'Available') allAvailable = false;
      if (status !== 'Out of Stock') allOut = false;
    });
    return {
      isFullyAvailable: allAvailable,
      isPartiallyAvailable: !allAvailable && !allOut,
      isNotAvailableAtAll: allOut
    };
  }, [displayOrder]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      // If it ends with GM, fix it to GMT to allow proper Date parsing
      let cleanedDate = dateString.endsWith('GM') ? dateString + 'T' : dateString;
      const d = new Date(cleanedDate);
      if (isNaN(d.getTime())) {
        // Fallback: strip anything after time components
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

  useEffect(() => {
    if (allocatedToPacking && allocatedToBOM && displayOrder) {
      const finalizeSplit = async () => {
        await reloadOrders();
        window.dispatchEvent(new Event("orders-updated"));
        const actualPoNumber = displayOrder.poNumber || displayOrder.po_number;
        setSelectedCustomer('');
        setSelectedPONumber('');
        setAllocatedToPacking(false);
        setAllocatedToBOM(false);
        router.push(`/bom-calculation?poNumber=${encodeURIComponent(actualPoNumber)}`);
      };
      finalizeSplit();
    }
  }, [allocatedToPacking, allocatedToBOM, displayOrder, reloadOrders, router]);

  const { totalAvailableStock, totalRequiredQty } = useMemo(() => {
    let avail = 0;
    let req = 0;
    const specs = getOrderSpecifications(displayOrder);
    if (specs && specs.length > 0) {
      specs.forEach((s: any) => {
        const sReq = s.quantity || s.qty || s.order_qty || 0;
        const sAvail = s.stockAvailable || s.stock_available || 0;
        req += sReq;
        avail += Math.min(sAvail, sReq);
      });
    }
    return { totalAvailableStock: avail, totalRequiredQty: req };
  }, [displayOrder]);

  const handleCalculateBOM = async (routeTo: 'quality-packing' | 'bom-calculation' | 'calculate-bom' | 'split-quality-packing' | 'split-bom-calculation' | 'purchase-request' | 'service-outsource') => {
    if (displayOrder) {
      localStorage.setItem('bomCalculationDraft', JSON.stringify({
        selectedCustomer,
        selectedPODate: orderAnalysis.derivedPODate,
        selectedPONumber
      }));

      try {
        setStatusMessage(null);
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const actualPoNumber = displayOrder.poNumber || displayOrder.po_number;
        
        const endpoint = (routeTo === 'quality-packing' && isFullyAvailable)
          ? `${BACKEND_URL}/purchase_orders/bypass_to_packing` 
          : `${BACKEND_URL}/api/orders/split`;

        const requestPayload: any = { poNumber: actualPoNumber };
        if (!(routeTo === 'quality-packing' && isFullyAvailable)) {
          requestPayload.routeTo = routeTo;
        }

        if (routeTo === 'quality-packing' || routeTo === 'split-quality-packing') {
          requestPayload.status = 'In Progress';
          requestPayload.activeStage = 'Quality & Packing';
        } else {
          requestPayload.status = 'BOM';
          requestPayload.activeStage = 'BOM Calculation';
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...getAuthHeaders(true)
          },
          body: JSON.stringify(requestPayload)
        });
        
        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
        
        const data = await res.json();
        if (data.success) {
          if (routeTo === 'split-quality-packing') {
            setAllocatedToPacking(true);
            return;
          }
          if (routeTo === 'split-bom-calculation') {
            setAllocatedToBOM(true);
            return;
          }
          
          await reloadOrders();
          window.dispatchEvent(new Event("orders-updated"));
  
          let nextRoute = 'bom-calculation';
          if (routeTo === 'quality-packing') {
            nextRoute = 'quality-packing';
          } else if (routeTo === 'service-outsource') {
            nextRoute = 'out-source';
          }
          router.push(`/${nextRoute}?poNumber=${encodeURIComponent(actualPoNumber)}`);
        } else {
          setStatusMessage(data.error || "Failed to process order");
        }
      } catch (err) {
        console.error("Failed to advance stage:", err);
        setStatusMessage("Server error encountered during stage transition. Attempting local client fallback validation.");

        
        if (routeTo === 'split-quality-packing') {
          setAllocatedToPacking(true);
          return;
        }
        if (routeTo === 'split-bom-calculation') {
          setAllocatedToBOM(true);
          return;
        }
        
        // Fallback execution
        const actualPoNumber = displayOrder.poNumber || displayOrder.po_number;
        let nextRoute = 'bom-calculation';
        if (routeTo === 'quality-packing') {
          nextRoute = 'quality-packing';
        } else if (routeTo === 'service-outsource') {
          nextRoute = 'out-source';
        }
        router.push(`/${nextRoute}?poNumber=${encodeURIComponent(actualPoNumber)}`);
      }
    }
  };
  const isPartialDispatched = localPartialDispatched || displayOrder?.store_partially_processed;

  const handlePartialDispatch = async () => {
    if (!displayOrder) return;
    try {
      setStatusMessage(null);
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const actualPoNumber = displayOrder.poNumber || displayOrder.po_number;
      
      const res = await fetch(`${BACKEND_URL}/api/stock-check/dispatch-partial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(true)
        },
        body: JSON.stringify({ poNumber: actualPoNumber })
      });
      
      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setLocalPartialDispatched(true);
      } else {
        setStatusMessage(data.error || "Failed to dispatch partial stock");
      }
    } catch (err: any) {
      console.error("Failed to dispatch partial stock:", err);
      setStatusMessage(err.message || "Server error encountered");
    }
  };

  const handleSubmitBomShortage = async () => {
    if (!displayOrder) return;
    try {
      setStatusMessage(null);
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const actualPoNumber = displayOrder.poNumber || displayOrder.po_number;
      
      const res = await fetch(`${BACKEND_URL}/api/stock-check/submit-bom-shortage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(true)
        },
        body: JSON.stringify({ poNumber: actualPoNumber })
      });
      
      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
      const data = await res.json();
      if (data.success) {
        await reloadOrders();
        window.dispatchEvent(new Event("orders-updated"));
        setSelectedCustomer('');
        setSelectedPONumber('');
        router.push(`/bom-calculation?poNumber=${encodeURIComponent(actualPoNumber)}`);
      } else {
        setStatusMessage(data.error || "Failed to submit BOM shortage");
      }
    } catch (err: any) {
      console.error("Failed to submit BOM shortage:", err);
      setStatusMessage(err.message || "Server error encountered");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6">
      <WorkflowIndicator currentStep="Stock Check" />

      {statusMessage && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          Stock Check
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calculate garment requirements and allocate existing stock.
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border mt-6">
        <div className="border-b border-border px-6 py-4 bg-neutral-50/50 dark:bg-card/50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            Stock Calculation
          </h2>
        </div>
        <div className="p-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <SearchableDropdown
              label="Customer Name"
              options={customers}
              value={selectedCustomer}
              placeholder="Select a Customer Name..."
              onChange={(val) => {
                setSelectedCustomer(val);
                setSelectedPONumber('');
              }}
            />
            <SearchableDropdown
              label="PO Number"
              options={poNumbers}
              value={selectedPONumber}
              placeholder="Select a PO Number..."
              disabled={!selectedCustomer}
              onChange={(val) => setSelectedPONumber(val)}
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">PO Date</label>
              <div
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-card/40 border border-border text-neutral-700 dark:text-neutral-300 rounded-lg text-sm min-h-[38px] flex items-center shadow-inner whitespace-nowrap"
              >
                {formatDate(displayOrder?.poDate || displayOrder?.po_date || displayOrder?.order_date) || "—"}
              </div>
            </div>
          </div>

          <div className="mb-6">
            {!selectedPONumber || !displayOrder ? (
              <div className="text-center p-8 border border-dashed border-neutral-300 dark:border-border rounded-xl bg-neutral-50 dark:bg-card/30 text-muted-foreground text-sm italic">
                Please select a PO number.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-card/70 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      <th className="px-6 py-3.5">PO Number</th>
                      <th className="px-6 py-3.5 whitespace-nowrap">PO Date</th>
                      <th className="px-6 py-3.5 whitespace-nowrap">Delivery Date</th>
                      <th className="px-6 py-3.5 min-w-[280px]">Order Specifications</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 bg-card">
                    <tr className="text-sm text-card-foreground hover:bg-neutral-50/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400 whitespace-normal break-words max-w-[200px]">{displayOrder.poNumber || displayOrder.po_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(displayOrder.poDate || displayOrder.order_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(displayOrder.deliveryDate || displayOrder.delivery_date)}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground space-y-2">
                        {(() => {
                          if (!displayOrder) return null;
                          const specsDisplay = displayOrder.specificationsSummary || "No specifications available";

                          return (
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {specsDisplay}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-xs space-y-2">
                        {(() => {
                          if (!displayOrder) return <span className="italic min-h-[24px] flex items-center">—</span>;
                          
                          const totalQty = displayOrder.totalQty || 0;
                          const storeStock = Number(displayOrder?.available_stock ?? displayOrder?.storeStock ?? displayOrder?.store_stock) || 0;

                          const calculatedStatus = displayOrder.status || "OUT_OF_STOCK";

                          const isAvailable = calculatedStatus === 'IN_STOCK' || calculatedStatus === 'Available';
                          const isPartial = calculatedStatus === 'PARTIAL' || calculatedStatus === 'Partial Stock';

                          return (
                            <div className="flex items-center min-h-[24px]">
                              {isAvailable ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  In Stock ({storeStock})
                                </span>
                              ) : isPartial ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  Partial Stock ({storeStock})
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                  Out of Stock
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground font-medium ml-3">
                                Req: {totalQty}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-neutral-100 dark:border-border pt-6">
            <div className="flex-1">
              {displayOrder && displayOrder.hasAllocationError && (
                <p className="text-sm text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> Please resolve stock allocation errors in Order Initiation before proceeding.
                </p>
              )}
              {selectedOrder && orderAnalysis.isFormValid && orderAnalysis.totalProductionRequired === 0 && orderAnalysis.totalQuantity > 0 && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> Order can be fulfilled entirely using existing stock.
                </p>
              )}
            </div>

            {(() => {
              if (!displayOrder) return null;
              const specs = displayOrder?.specifications || displayOrder?.specs || displayOrder?.items || [];
              const isUniform = specs.some((s: any) => {
                const specText = s.order_specifications || s.itemDescription || s.item_description || s.garment_name || "";
                const category = s.category || s.item_category || s.garmentType || "";
                
                const isUniformApparel = 
                  (category.toLowerCase().includes('shirt') || category.toLowerCase().includes('pant') || specText.toLowerCase().includes('shirt') || specText.toLowerCase().includes('pant')) && 
                  specText.toLowerCase().includes('uniform');
                
                return s.is_uniform === true || s.isUniform === true || isUniformApparel;
              });
              
              const isServiceOutsource = specs.some((s: any) => s.serviceType === "Outsource" && (s.outsourceType === "Service Outsource" || !s.outsourceType));

              return (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {isUniform ? (
                    canAdvanceBOM ? (
                      <button
                        onClick={() => handleCalculateBOM('calculate-bom')}
                        disabled={!selectedOrder}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-semibold text-sm flex items-center justify-center gap-2 transition-all ${!selectedOrder
                            ? 'bg-muted text-neutral-400 cursor-not-allowed border border-border shadow-none'
                            : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 active:transform active:scale-[0.99]'
                          }`}
                      >
                        Go to BOM Calculation
                        <Calculator className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="You do not have permission to access BOM Calculation."
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-muted text-neutral-400 cursor-not-allowed border border-border shadow-none"
                      >
                        Max Stage Reached
                      </button>
                    )
                  ) : (
                    <>
                      {(() => {
                        const totalOrdered = specs.reduce((acc: number, curr: any) => acc + (curr.ordered_qty || curr.quantity || curr.qty || 0), 0) || displayOrder.quantity || 0;
                        const totalAvailable = displayOrder.available_stock ?? displayOrder.storeStock ?? displayOrder.store_stock ?? 0;
                        
                        let stockStatus = 'ZERO';
                        if (totalAvailable >= totalOrdered && totalOrdered > 0) stockStatus = 'FULL';
                        else if (totalAvailable > 0 && totalAvailable < totalOrdered) stockStatus = 'PARTIAL';

                        const handleStageTransition = (stage: 'Quality & Packing' | 'BOM Calculation') => {
                          handleCalculateBOM(stage === 'Quality & Packing' ? (isServiceOutsource ? 'service-outsource' : 'quality-packing') : 'bom-calculation');
                        };

                        return (
                          <>
                            {stockStatus === 'FULL' && (
                              <button onClick={() => handleStageTransition('Quality & Packing')} disabled={!selectedOrder} className="w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-[#2563EB] text-white hover:bg-blue-700 active:transform active:scale-[0.99]">
                                Send to Quality & Packing
                              </button>
                            )}

                            {stockStatus === 'ZERO' && (
                              <button onClick={() => handleStageTransition('BOM Calculation')} disabled={!selectedOrder} className="w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-white text-neutral-900 border border-border hover:bg-neutral-50 active:transform active:scale-[0.99]">
                                Go to BOM Calculation
                              </button>
                            )}

                            {stockStatus === 'PARTIAL' && (
                              <div className="flex flex-col gap-3 w-full sm:w-auto">
                                {!isPartialDispatched ? (
                                  <>
                                    <div className="text-sm text-neutral-700 dark:text-neutral-300 font-medium bg-neutral-50 dark:bg-card/40 px-4 py-2 rounded-lg border border-border">
                                      Available Stock: {totalAvailable} pcs | Shortage: {totalOrdered - totalAvailable} pcs
                                    </div>
                                    <button onClick={handlePartialDispatch} disabled={!selectedOrder} className="w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-[#2563EB] text-white hover:bg-blue-700 active:transform active:scale-[0.99]">
                                      Dispatch Available Stock ({totalAvailable} pcs) to Quality & Packing
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-sm text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4" />
                                      ✓ {totalAvailable} pcs dispatched. {totalOrdered - totalAvailable} pcs pending BOM Calculation.
                                    </div>
                                    <button onClick={handleSubmitBomShortage} disabled={!selectedOrder} className="w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-white text-neutral-900 border border-border hover:bg-neutral-50 active:transform active:scale-[0.99]">
                                      Dispatch Shortage ({totalOrdered - totalAvailable} pcs) to BOM Calculation
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockCalculationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-medium text-muted-foreground animate-pulse">Loading stock verification system...</div>}>
      <StockCalculationContent />
    </Suspense>
  );
}