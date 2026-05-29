"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import {
  Package,
  Plus,
  Save,
  Trash2,
  FileText,
  CheckCircle2,
  Box,
  AlertCircle,
  Calculator,
  ChevronDown
} from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';

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

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

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
          className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {isOpen && !disabled && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-500">No options found</li>
          ) : (
            filteredOptions.map((opt, idx) => (
              <li
                key={idx}
                className="px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer"
                onClick={() => {
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

  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPONumber, setSelectedPONumber] = useState<string>('');

  useEffect(() => {
    const custParam = searchParams.get('customerName');
    const poParam = searchParams.get('poNumber');
    if (custParam) setSelectedCustomer(custParam);
    else setSelectedCustomer('');
    
    if (poParam) setSelectedPONumber(poParam);
    else setSelectedPONumber('');
  }, [searchParams]);

  useEffect(() => {
    const loadOrders = () => {
      const ordersStr = localStorage.getItem('savedOrders');
      if (ordersStr) {
        try {
          setSavedOrders(JSON.parse(ordersStr));
        } catch (e) { }
      }
    };
    loadOrders();
    window.addEventListener('storage', loadOrders);
    return () => window.removeEventListener('storage', loadOrders);
  }, []);

  const activeOrders = savedOrders.filter(o => o.stage === 'Stock Check' && o.status === 'Submitted');

  useEffect(() => {
    // If the currently selected PO is no longer active in this stage, reset the form.
    if (selectedPONumber && !activeOrders.find(o => o.poNumber === selectedPONumber)) {
      setSelectedCustomer('');
      setSelectedPONumber('');
    }
  }, [activeOrders, selectedPONumber]);

  const customers = Array.from(new Set(activeOrders.map(o => o.customerName))).filter(Boolean) as string[];

  // Filter POs by customer
  const filteredOrders = activeOrders.filter(o => o.customerName === selectedCustomer);

  const poNumbers = Array.from(new Set(filteredOrders.map(o => o.poNumber))).filter(Boolean) as string[];

  const selectedOrder = filteredOrders.find(o => o.poNumber === selectedPONumber);
  const derivedPODate = selectedOrder ? selectedOrder.poDate : '';
  const activeSpecs = selectedOrder ? (selectedOrder.specs || []) : [];

  const isValidRow = (spec: GarmentSpec) => {
    return (spec.useExistingStock || 0) <= (spec.stockAvailable || 0) && (spec.useExistingStock || 0) <= spec.quantity;
  };

  const isFormValid = activeSpecs.every(isValidRow);
  const totalQuantity = activeSpecs.reduce((sum, spec) => sum + (spec.quantity || 0), 0);
  const totalProductionRequired = activeSpecs.reduce((sum, spec) => sum + Math.max(0, (spec.quantity || 0) - (spec.useExistingStock || 0)), 0);

  const handleCalculateBOM = () => {
    if (selectedOrder) {
      localStorage.setItem('bomCalculationDraft', JSON.stringify({
        selectedCustomer,
        selectedPODate: derivedPODate,
        selectedPONumber
      }));

      // Pipeline Tracking: Update order stage to BOM Calculation
      const updatedOrders = savedOrders.map(o => 
        o.id === selectedOrder.id ? { ...o, stage: 'BOM Calculation' } : o
      );
      localStorage.setItem('savedOrders', JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event('storage'));

      // RESET FORM STATE UPON SUCCESSFUL STAGE COMPLETION
      setSelectedCustomer('');
      setSelectedPONumber('');

      // Wipe query parameters from history so navigating back shows a clean form
      window.history.replaceState(null, '', window.location.pathname);
      router.push('/bom-calculation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8">
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

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden mt-6">
        <div className="border-b border-neutral-200 dark:border-slate-700 px-4 py-3 bg-neutral-50/50 dark:bg-slate-800/30 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <Box className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            Stock Calculation
          </h2>
        </div>
        <div className="p-4 sm:p-6">

          {/* Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm min-h-[38px] flex items-center"
              >
                {derivedPODate || "—"}
              </div>
            </div>
          </div>

          {/* Dynamic Table */}
          <div className="mb-6">
            {!selectedOrder ? (
              <div className="text-center p-8 border border-dashed border-neutral-300 dark:border-slate-700 rounded-xl bg-neutral-50 dark:bg-slate-800/50 text-neutral-500 dark:text-neutral-400 text-sm">
                Please select a customer and PO Number to view details.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-slate-800/80 border-b border-neutral-200 dark:border-slate-700 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">
                      <th className="px-4 py-3">PO Number</th>
                      <th className="px-4 py-3">PO Date</th>
                      <th className="px-4 py-3">Delivery Date</th>
                      <th className="px-4 py-3 min-w-[250px]">Garment Specifications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    <tr className="text-sm text-neutral-800 dark:text-neutral-200">
                      <td className="px-4 py-3 font-medium">{selectedOrder.poNumber}</td>
                      <td className="px-4 py-3">{selectedOrder.poDate}</td>
                      <td className="px-4 py-3">{selectedOrder.deliveryDate}</td>
                      <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                        {selectedOrder.specs && selectedOrder.specs.length > 0 ? (
                          selectedOrder.specs.map((spec, idx) => (
                            <div key={idx} className="flex justify-between border-b border-neutral-100 dark:border-slate-800 last:border-0 pb-1 last:pb-0">
                              <span>{spec.itemDescription} ({spec.size}) - {spec.pattern}</span>
                              <span className="font-medium text-neutral-900 dark:text-neutral-100">Qty: {spec.quantity}</span>
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

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-neutral-100 dark:border-slate-800 pt-6">
            <div className="flex-1">
              {selectedOrder && !isFormValid && (
                <p className="text-sm text-red-600 font-medium flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Please resolve stock allocation errors in Order Initiation before proceeding.</p>
              )}
              {selectedOrder && isFormValid && totalProductionRequired === 0 && totalQuantity > 0 && (
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Order can be fulfilled entirely using existing stock.</p>
              )}
            </div>
            <button
              onClick={handleCalculateBOM}
              disabled={!selectedOrder || !isFormValid || totalProductionRequired === 0 || totalQuantity === 0}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${!selectedOrder || !isFormValid || totalProductionRequired === 0 || totalQuantity === 0
                ? 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-slate-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
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
    <Suspense fallback={<div className="p-8 text-center text-neutral-500">Loading...</div>}>
      <StockCalculationContent />
    </Suspense>
  );
}
