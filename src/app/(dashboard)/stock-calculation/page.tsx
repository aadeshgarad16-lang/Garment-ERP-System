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
          className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg shadow-lg py-1 border-t-0">
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-500 italic">No options found</li>
          ) : (
            filteredOptions.map((opt, idx) => (
              <li
                key={idx}
                className="px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-blue-50 dark:hover:bg-blue-900/40 cursor-pointer transition-colors"
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
  const { user } = useAuth();
  const { orders } = useOrders();

  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPONumber, setSelectedPONumber] = useState<string>('');

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
    return (orders || []).filter(
      (o) => o.stage === 'Stock Check' && o.status === 'SUBMITTED'
    );
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
    return Array.from(new Set(activeOrders.map((o) => o.customerName))).filter(Boolean);
  }, [activeOrders]);

  const poNumbers = useMemo(() => {
    if (!selectedCustomer) return [];
    return Array.from(
      new Set(activeOrders.filter((o) => o.customerName === selectedCustomer).map((o) => o.poNumber))
    ).filter(Boolean);
  }, [activeOrders, selectedCustomer]);

  const selectedOrder = useMemo(() => {
    return activeOrders.find(
      (o) => o.customerName === selectedCustomer && o.poNumber === selectedPONumber
    );
  }, [activeOrders, selectedCustomer, selectedPONumber]);

  // Structural metric processing updates
  const orderAnalysis = useMemo(() => {
    const specs = selectedOrder?.specs || [];
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
      derivedPODate: selectedOrder?.poDate ? selectedOrder.poDate.split('T')[0] : '',
    };
  }, [selectedOrder]);

  const handleCalculateBOM = () => {
    if (selectedOrder) {
      localStorage.setItem('bomCalculationDraft', JSON.stringify({
        selectedCustomer,
        selectedPODate: orderAnalysis.derivedPODate,
        selectedPONumber
      }));

      updateOrderAndLog(selectedOrder.poNumber, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o) =>
          o.id === selectedOrder.id ? { ...o, stage: 'BOM Calculation' } : o
        );
      });

      setSelectedCustomer('');
      setSelectedPONumber('');

      window.history.replaceState(null, '', window.location.pathname);
      router.push('/bom-calculation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6">
      <WorkflowIndicator currentStep="Stock Check" />

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          Stock Check
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Calculate garment requirements and allocate existing stock.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 mt-6">
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <Box className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            Stock Calculation
          </h2>
        </div>
        <div className="p-6">

          {/* Configuration Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <SearchableDropdown
              label="Customer Name"
              options={customers}
              value={selectedCustomer}
              placeholder="Select a Customer..."
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
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-slate-800/40 border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm min-h-[38px] flex items-center shadow-inner"
              >
                {orderAnalysis.derivedPODate || "—"}
              </div>
            </div>
          </div>

          {/* Table Tracking Views */}
          <div className="mb-6">
            {!selectedOrder ? (
              <div className="text-center p-8 border border-dashed border-neutral-300 dark:border-slate-700 rounded-xl bg-neutral-50 dark:bg-slate-800/30 text-neutral-500 dark:text-neutral-400 text-sm italic">
                Please select a customer and PO Number to view details.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-slate-800/70 border-b border-neutral-200 dark:border-slate-700 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                      <th className="px-6 py-3.5">PO Number</th>
                      <th className="px-6 py-3.5">PO Date</th>
                      <th className="px-6 py-3.5">Delivery Date</th>
                      <th className="px-6 py-3.5 min-w-[280px]">Order Specifications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    <tr className="text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">{selectedOrder.poNumber}</td>
                      <td className="px-6 py-4">{selectedOrder.poDate ? selectedOrder.poDate.split('T')[0] : '—'}</td>
                      <td className="px-6 py-4">{selectedOrder.deliveryDate ? selectedOrder.deliveryDate.split('T')[0] : '—'}</td>
                      <td className="px-6 py-4 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
                        {selectedOrder.specs && selectedOrder.specs.length > 0 ? (
                          selectedOrder.specs.map((spec) => (
                            <div key={spec.id} className="flex justify-between border-b border-neutral-100 dark:border-slate-800 last:border-0 pb-1.5 last:pb-0">
                              <span className="font-medium text-neutral-700 dark:text-neutral-300">{spec.itemDescription} ({spec.size}) - {spec.pattern}</span>
                              <span className="font-semibold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-neutral-900 dark:text-neutral-100">Qty: {spec.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <span className="italic">No specifications available</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Row Elements */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-neutral-100 dark:border-slate-800 pt-6">
            <div className="flex-1">
              {selectedOrder && !orderAnalysis.isFormValid && (
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

            <button
              onClick={handleCalculateBOM}
              disabled={!selectedOrder || !orderAnalysis.isFormValid || orderAnalysis.totalProductionRequired === 0 || orderAnalysis.totalQuantity === 0}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-semibold text-sm flex items-center justify-center gap-2 transition-all ${!selectedOrder || !orderAnalysis.isFormValid || orderAnalysis.totalProductionRequired === 0 || orderAnalysis.totalQuantity === 0
                  ? 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-slate-700 shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:transform active:scale-[0.99]'
                }`}
            >
              {t('orderInitiation.stockCalculation.calculateBom')}
              <Calculator className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockCalculationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 animate-pulse">Loading stock verification system...</div>}>
      <StockCalculationContent />
    </Suspense>
  );
}