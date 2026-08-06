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
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { getActiveBOMItems } from '@/utils/bomUtils';
import { useOrders } from '@/contexts/order-context';
import { getAuthHeaders } from '@/lib/api';
import { isStageMatch, sortSizesAscending } from '@/utils/orderUtils';

async function safeFetchJson(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return { success: false, data: null };
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, data: null };
  }
}

interface Order {
  id: string;
  poNumber: string;
  customerName: string;
  poDate: string;
  deliveryDate?: string;
  totalAmount?: number;
  status?: string;
  activeStage?: string;
  itemsCount?: number;
  progress?: number;
  garmentDetails?: any[];
}

interface SizeRow {
  size: string;
  per_piece_qty?: number | string;
  perPieceQty?: number | string;
  total_qty_inc_wastage?: number | string;
  total_qty?: number | string;
  totalQty?: number | string;
  unit_price?: number | string;
  per_unit_price?: number | string;
  perUnitPrice?: number | string;
  final_price?: number | string;
  finalPrice?: number | string;
  orderQty?: number;
  garment_qty?: number;
}

interface ArticleGroup {
  id?: string;
  article_key?: string;
  article_name?: string;
  articleName?: string;
  materialName?: string;
  unit?: string;
  brand?: string;
  sizeType?: string;
  breakdown?: SizeRow[];
  sizes?: SizeRow[];
  size_breakdown?: SizeRow[];
  article_combined_qty?: number;
  totalCombinedQty?: number;
  totalCombinedAmount?: number;
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
  const selectedOption = (options || []).find(opt => getValue(opt) === value);
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

  const filteredOptions = (options || []).filter((opt) =>
    getLabel(opt).toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-muted' : 'cursor-pointer'}`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto py-1 text-sm">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={`opt-${idx}`}
                onClick={() => {
                  onChange(getValue(opt));
                  setSearch(getLabel(opt));
                  setIsOpen(false);
                }}
                className={`px-3.5 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${getValue(opt) === value ? 'bg-accent/50 font-semibold text-primary' : 'text-popover-foreground'}`}
              >
                {getLabel(opt)}
              </div>
            ))
          ) : (
            <div className="px-3.5 py-2.5 text-muted-foreground text-xs text-center">
              No matching options
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Lightweight React Error Boundary
class BOMErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("BOM Calculation Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-red-200 dark:border-red-900/50 text-center space-y-4 font-sans">
          <div className="inline-flex p-3 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Load BOM Calculation</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            A temporary component error occurred. Please retry or refresh the page.
          </p>
          {this.state.error?.message && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 max-w-lg mx-auto overflow-x-auto text-left">
              {this.state.error.message}
            </div>
          )}
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Retry & Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function BOMCalculationView() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { orders } = useOrders();

  const userRoles = (user?.role || '').split(',').map(r => r.trim().toLowerCase());
  const canAdvance = userRoles.some(r => ['admin', 'super admin', 'manager', 'production_manager'].includes(r));

  const sanitizePOKey = (raw: string) => {
    if (!raw) return '';
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^PO:\s*/i, '');
    cleaned = cleaned.replace(/\s*\(.*?\)/, '');
    cleaned = cleaned.split('|')[0].trim();
    return cleaned;
  };

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPODate, setSelectedPODate] = useState<string>('');
  const [selectedPONumber, setSelectedPONumber] = useState<string>('');
  const [detailedOrder, setDetailedOrder] = useState<any>(null);

  const [wastage, setWastage] = useState(5);
  const [articles, setArticles] = useState<ArticleGroup[]>([]);
  const [, setGarmentSpecs] = useState<any>(null);
  const [sleeveType, setSleeveType] = useState<string>('');
  const [selectedGarmentIndex, setSelectedGarmentIndex] = useState<number>(0);
  const [isTotalBomMode, setIsTotalBomMode] = useState<boolean>(false);
  const [bomApiData, setBomApiData] = useState<any>(null);
  const [urlNetQty, setUrlNetQty] = useState<number | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [cellInputStrings, setCellInputStrings] = useState<{ [key: string]: string }>({});

  const handleCellInputChange = (artIdx: number, sizeIdx: number, field: 'per_piece_qty' | 'per_unit_price', rawVal: string) => {
    if (rawVal !== '' && !/^\d*\.?\d*$/.test(rawVal)) {
      return;
    }
    const key = `${artIdx}-${sizeIdx}-${field}`;
    setCellInputStrings(prev => ({ ...prev, [key]: rawVal }));

    const numericVal = parseFloat(rawVal) || 0;
    handleCellEdit(artIdx, sizeIdx, field, numericVal);
  };

  const handleCellInputBlur = (artIdx: number, sizeIdx: number, field: 'per_piece_qty' | 'per_unit_price') => {
    const key = `${artIdx}-${sizeIdx}-${field}`;
    setCellInputStrings(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleCellEdit = (artIdx: number, sizeIdx: number, field: 'per_piece_qty' | 'per_unit_price', value: number) => {
    setArticles(prev => {
      const updated = [...prev];
      const art = { ...updated[artIdx] };
      const rawSizesArray = art.breakdown || art.size_breakdown || art.sizes || [];
      const sizesArray = [...rawSizesArray];
      const row = { ...sizesArray[sizeIdx] };
      
      if (field === 'per_piece_qty') {
        row.per_piece_qty = value;
        row.perPieceQty = value;
      } else if (field === 'per_unit_price') {
        row.unit_price = value;
        row.per_unit_price = value;
        row.perUnitPrice = value;
      }
      
      const numericQty = parseFloat(String(row.per_piece_qty ?? row.perPieceQty ?? 0)) || 0;
      const numericPrice = parseFloat(String(row.unit_price ?? row.per_unit_price ?? row.perUnitPrice ?? 0)) || 0;
      const orderQ = parseFloat(String(row.orderQty ?? row.garment_qty ?? 0)) || 0;
      
      const newTotalQty = (numericQty * orderQ) * (1 + (wastage || 0) / 100);
      const newFinalPrice = newTotalQty * numericPrice;
      
      row.total_qty_inc_wastage = Number(newTotalQty.toFixed(2));
      row.totalQty = Number(newTotalQty.toFixed(2));
      row.total_qty = Number(newTotalQty.toFixed(2));
      
      row.final_price = Number(newFinalPrice.toFixed(2));
      row.finalPrice = Number(newFinalPrice.toFixed(2));
      
      sizesArray[sizeIdx] = row;
      art.breakdown = sizesArray;
      art.sizes = sizesArray;
      art.size_breakdown = sizesArray;
      
      art.article_combined_qty = Number(sizesArray.reduce((sum: number, s: SizeRow) => sum + (Number(s?.total_qty_inc_wastage ?? s?.totalQty) || 0), 0).toFixed(2));
      art.totalCombinedQty = Number(sizesArray.reduce((sum: number, s: SizeRow) => sum + (Number(s?.total_qty_inc_wastage ?? s?.totalQty) || 0), 0).toFixed(2));
      art.totalCombinedAmount = Number(sizesArray.reduce((sum: number, s: SizeRow) => sum + (Number(s?.final_price ?? s?.finalPrice) || 0), 0).toFixed(2));
      
      updated[artIdx] = art;
      return updated;
    });
  };

  useEffect(() => {
    if (selectedPONumber) {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      safeFetchJson(`${BACKEND_URL}/purchase_orders/details/${selectedPONumber}`, {
        headers: getAuthHeaders()
      }).then(({ success, data }: any) => {
        if (success && data && data.success !== false) {
          setDetailedOrder({
            ...data,
            poNumber: data.po_number || selectedPONumber,
            specs: (data.specs || []).map((s: any) => ({
              ...s,
              itemDescription: s.item_description,
              stockAvailable: s.stock_available,
              useExistingStock: s.use_existing_stock,
              stockStatus: s.stock_status
            }))
          });
        }
      });
    } else {
      setDetailedOrder(null);
    }
  }, [selectedPONumber]);

  // Read netQty from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const netQtyParam = searchParams.get('netQty');
      if (netQtyParam !== null) {
        const parsedNetQty = parseFloat(netQtyParam);
        if (!isNaN(parsedNetQty)) {
          setUrlNetQty(parsedNetQty);
        }
      }
      const poParam = searchParams.get('poNumber');
      if (poParam) {
        setSelectedPONumber(poParam);
      }
    }
  }, []);

  const ordersList: Order[] = (orders || []).map((o: any) => ({
    id: o?.poNumber || o?.po_number || o?.id || '',
    poNumber: o?.poNumber || o?.po_number || '',
    customerName: o?.customerName || o?.customer_name || o?.clientName || o?.customer || '',
    poDate: o?.poDate || o?.po_date || '',
    deliveryDate: o?.deliveryDate || o?.delivery_date || '',
    totalAmount: o?.totalAmount || o?.total_amount || o?.total_value || 0,
    status: o?.status || 'Pending',
    activeStage: o?.stage || o?.activeStage || o?.step || 'BOM Calculation',
    itemsCount: o?.itemsCount || (o?.specifications ? o.specifications.length : 1),
    progress: o?.progress || 0,
    garmentDetails: (o?.specifications || o?.items || []).map((s: any) => ({
      category: s?.category || s?.fabric_type || 'Shirt',
      sleeveType: s?.sleeve_type || s?.sleeveType || s?.sleeve || 'full_sleeve',
      colors: s?.colors || s?.color ? [s.colors || s.color] : ['White'],
      sizes: s?.sizes || s?.size ? (typeof (s.sizes || s.size) === 'string' ? (s.sizes || s.size).split(',').map((sz: string) => sz.trim()) : (s.sizes || s.size)) : ['38', '40', '42'],
      quantity: Number(s?.quantity || s?.ordered_qty || 0),
      itemDescription: s?.itemDescription || s?.item_description || '',
      pattern: s?.pattern || '',
      stockAvailable: Number(s?.stockAvailable || s?.stock_available || s?.available_stock || 0),
      useExistingStock: Number(s?.useExistingStock || s?.use_existing_stock || 0),
      stockStatus: s?.stockStatus || s?.stock_status || ''
    }))
  }));

  const targetKeywords = ['bom calculation', 'bom', 'stage 4'];
  const activeOrders = ordersList.filter(o => isStageMatch(o.activeStage, targetKeywords) && o.status === 'SUBMITTED');

  const customerOptions: DropdownOption[] = Array.from(
    new Set(activeOrders.map(o => o.customerName).filter(Boolean))
  ).sort();

  const handleCustomerChange = (customerName: string) => {
    setSelectedCustomer(customerName);
    setSelectedPODate('');
    setSelectedPONumber('');
  };

  const filteredOrdersForCustomer = activeOrders.filter(
    o => !selectedCustomer || o.customerName === selectedCustomer
  );

  const poDateOptions: DropdownOption[] = Array.from(
    new Set(filteredOrdersForCustomer.map(o => o.poDate).filter(Boolean))
  ).sort();

  const handlePODateChange = (poDate: string) => {
    setSelectedPODate(poDate);
    setSelectedPONumber('');
  };

  const filteredOrders = activeOrders.filter(o =>
    (!selectedCustomer || o.customerName === selectedCustomer) &&
    (!selectedPODate || o.poDate === selectedPODate)
  );

  const poNumbers = Array.from(new Set(filteredOrders.map(o => o.poNumber))).filter(Boolean) as string[];
  const poDropdownOptions = poNumbers.map(po => {
    const order = filteredOrders.find(o => o.poNumber === po);
    const rawPo = sanitizePOKey(po);
    return { label: `${po} (${order?.customerName || selectedCustomer})`, value: rawPo };
  });

  const baseOrder = filteredOrders.find(o => o.poNumber === selectedPONumber);
  const currentOrder = detailedOrder ? { ...baseOrder, ...detailedOrder } : baseOrder;
  const activeSpecs = currentOrder ? (currentOrder.specs || currentOrder.garmentDetails || []) : [];

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

  const activeGarment = (activeSpecs || [])[selectedGarmentIndex] || (activeSpecs || [])[0];

  const totalProductionRequired = urlNetQty !== null
    ? urlNetQty
    : isTotalBomMode
      ? (activeSpecs || []).reduce((sum: number, spec: any) => sum + Math.max(0, (Number(spec?.quantity) || 0) - (Number(spec?.useExistingStock) || 0)), 0)
      : activeGarment
        ? Math.max(0, (Number(activeGarment?.quantity) || 0) - (Number(activeGarment?.useExistingStock) || 0))
        : 0;

  const garmentType = isTotalBomMode ? 'Total Order' : (activeGarment?.itemDescription || 'Shirt');

  // Fetch from unified BOM endpoint whenever PO or netQty changes
  useEffect(() => {
    if (!selectedPONumber) {
      setBomApiData(null);
      setArticles([]);
      return;
    }
    setIsLoadingApi(true);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const netQtyQuery = urlNetQty !== null ? `&net_qty=${urlNetQty}` : '';
    safeFetchJson(
      `${BACKEND_URL}/api/bom-calculation/${encodeURIComponent(selectedPONumber)}?dummy=1${netQtyQuery}`,
      { headers: getAuthHeaders() }
    ).then(({ success, data }: any) => {
      setIsLoadingApi(false);
      if (success && data && !data.error) {
        setBomApiData(data);
        const fetchedArticles = data.articles || data.materials || [];
        if (Array.isArray(fetchedArticles)) {
          setArticles(fetchedArticles as ArticleGroup[]);
        }
      } else {
        setBomApiData(null);
        setArticles([]);
      }
    }).catch((err: any) => {
      setIsLoadingApi(false);
      console.error("Fetch BOM calculation error:", err);
      setBomApiData(null);
      setArticles([]);
    });
  }, [selectedPONumber, urlNetQty]);

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

      if (typeof sleeveValue === 'string' && sleeveValue.toLowerCase().includes('half')) {
        setSleeveType('half_sleeve');
      } else if (typeof sleeveValue === 'string' && sleeveValue.toLowerCase().includes('full')) {
        setSleeveType('full_sleeve');
      } else {
        setSleeveType('');
      }
    } else {
      setSleeveType('');
    }
  }, [currentOrder, activeGarment, selectedGarmentIndex]);

  // Handle PO Dropdown Change with safe fetch handling
  const handlePOChange = async (selectedPO: string) => {
    if (!selectedPO) {
      setSelectedPONumber('');
      setArticles([]);
      setGarmentSpecs(null);
      return;
    }

    const cleanPO = sanitizePOKey(selectedPO);
    setSelectedPONumber(cleanPO);

    // Auto-fill PO Date & Customer Name if matching order found
    const match = activeOrders.find(o => sanitizePOKey(o.poNumber) === cleanPO || o.poNumber === cleanPO);
    if (match) {
      if (match.customerName) {
        setSelectedCustomer(match.customerName);
      }
      if (match.poDate) {
        setSelectedPODate(match.poDate);
      }
    }
  };

  // Recalculate totals dynamically if wastage changes
  React.useEffect(() => {
    setArticles(prev => (Array.isArray(prev) ? prev : []).map(art => {
      const sizesArray = art?.sizes || art?.size_breakdown || [];
      const sizes = sizesArray.map((sz: SizeRow) => {
        const numericQty = parseFloat(String(sz?.per_piece_qty ?? sz?.perPieceQty ?? 0)) || 0;
        const numericPrice = parseFloat(String(sz?.per_unit_price ?? sz?.perUnitPrice ?? 0)) || 0;
        const orderQ = sz?.orderQty || sz?.garment_qty || 0;

        const newTotalQty = (numericQty * orderQ) * (1 + (wastage || 0) / 100);
        const newFinalPrice = newTotalQty * numericPrice;

        return {
          ...sz,
          total_qty_inc_wastage: Number(newTotalQty.toFixed(2)),
          totalQty: Number(newTotalQty.toFixed(2)),
          final_price: Number(newFinalPrice.toFixed(2)),
          finalPrice: Number(newFinalPrice.toFixed(2))
        };
      });

      return {
        ...art,
        sizes,
        size_breakdown: sizes,
        article_combined_qty: Number(sizes.reduce((sum: number, s: SizeRow) => sum + (Number(s?.total_qty_inc_wastage ?? s?.totalQty) || 0), 0).toFixed(2)),
        totalCombinedQty: Number(sizes.reduce((sum: number, s: SizeRow) => sum + (Number(s?.total_qty_inc_wastage ?? s?.totalQty) || 0), 0).toFixed(2)),
        totalCombinedAmount: Number(sizes.reduce((sum: number, s: SizeRow) => sum + (Number(s?.final_price ?? s?.finalPrice) || 0), 0).toFixed(2))
      };
    }));
  }, [wastage]);

  const totals = React.useMemo(() => {
    let totalFabricMeters = 0;
    let totalAlliedUnits = 0;
    let grandTotalCost = 0;

    (articles || []).forEach((art) => {
      const name = (art?.article_name || art?.articleName || art?.materialName || '').toLowerCase();
      const isFabric = name.includes('fabric') || name.includes('cotton');
      const sizesArray = art?.sizes || art?.size_breakdown || [];

      sizesArray.forEach((s: any) => {
        const qty = parseFloat(String(s?.total_qty_inc_wastage ?? s?.total_qty ?? s?.totalQty ?? 0)) || 0;
        const price = parseFloat(String(s?.final_price ?? s?.finalPrice ?? 0)) || 0;

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
      alliedArticles: Math.round(totalAlliedUnits),
      estCost: grandTotalCost.toFixed(2)
    };
  }, [articles]);

  const itemsToProcure = totalProductionRequired > 0 ? (articles || []).filter(m => (m?.missing || 0) > 0).length : 0;

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
          <p className="text-sm text-muted-foreground mt-1">
            {t('bom.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">

        {/* 1. Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            <p className="text-xl font-bold text-foreground">{totals.alliedArticles} <span className="text-sm font-normal text-muted-foreground">units</span></p>
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
            <p className="text-xl font-bold text-foreground">{itemsToProcure} <span className="text-sm font-normal text-muted-foreground">articles</span></p>
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
                options={customerOptions}
                value={selectedCustomer}
                placeholder="Select a Customer..."
                onChange={handleCustomerChange}
              />
            </div>
            <div className="w-full">
              <SearchableDropdown
                label="PO Number"
                options={poDropdownOptions}
                value={selectedPONumber}
                placeholder="Select PO Number..."
                onChange={(poVal) => handlePOChange(poVal)}
              />
            </div>
            <div className="w-full">
              <SearchableDropdown
                label="PO Date"
                options={poDateOptions}
                value={selectedPODate}
                placeholder="Select Date..."
                disabled={!selectedCustomer}
                onChange={handlePODateChange}
              />
            </div>

            <div className="w-full">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t('bom.wastage')} (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={wastage}
                onChange={(e) => setWastage(Math.max(0, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="w-full text-right pb-1">
              <span className="text-xs text-muted-foreground">Order Status: </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Ready for Calc
              </span>
            </div>
          </div>
        </div>

        {/* 3. Garment Details */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Box className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('bom.details')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Specifications & Requirements for PO #{selectedPONumber || '—'}</p>
              </div>
            </div>
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
              <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                {t('bom.totalProd')}: {bomApiData?.target_production_qty ?? totalProductionRequired} pcs
              </span>
            </div>
          </div>
          <div className="p-5">
            {isLoadingApi ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium">Fetching Garment Details & BOM Specifications...</p>
              </div>
            ) : !selectedPONumber ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Please select a PO number.</p>
            ) : Array.isArray(bomApiData?.garments) && bomApiData.garments.length > 0 ? (
              /* --- Compact Garment Summary Cards View --- */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bomApiData.garments.map((g: any, gIdx: number) => {
                  const formattedSleeve = typeof g?.sleeve_type === 'string' && g.sleeve_type && g.sleeve_type.toLowerCase() !== 'n/a'
                    ? g.sleeve_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    : 'N/A';
                  return (
                    <div key={`garment-card-${gIdx}`} className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-base">
                            {g?.category || 'N/A'}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                            {formattedSleeve}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          urlNetQty !== null
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60'
                        }`}>
                          Target: {g?.target_production_qty ?? 0} pcs
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                          Sizes & Breakdown
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {typeof g?.size_breakdown === 'string' && g.size_breakdown ? (
                            g.size_breakdown.split(',').map((sb: string, sbIdx: number) => (
                              <span key={`sb-${sbIdx}`} className="inline-block bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200 text-xs shadow-2xs">
                                {sb.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300 font-mono">{g?.sizes || 'N/A'}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-200/60 dark:border-slate-700/50">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Total PO Quantity:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{g?.total_po_qty ?? 0} pcs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : bomApiData ? (
              /* Fallback single garment view */
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Sleeve Type</th>
                      <th className="py-3 px-4">Sizes & Breakdown</th>
                      <th className="py-3 px-4 text-center">Total PO Qty</th>
                      <th className="py-3 px-4 text-center">Target Prod. Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{bomApiData?.category || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {typeof bomApiData?.sleeve_type === 'string' && bomApiData.sleeve_type
                            ? bomApiData.sleeve_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">{bomApiData?.sizes || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-900 dark:text-white">{bomApiData?.total_po_qty ?? '—'} pcs</td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">{bomApiData?.target_production_qty ?? '—'} pcs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : Array.isArray(activeSpecs) && activeSpecs.length > 0 ? (
              /* --- Fallback: existing spec cards --- */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {activeSpecs.map((spec: any, idx: number) => {
                  const isSelected = !isTotalBomMode && selectedGarmentIndex === idx;
                  const sValue = spec?.sleeveType || spec?.sleeve_type || spec?.sleeve || '';
                  const formattedSleeve = typeof sValue === 'string' && sValue ? sValue.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'N/A';

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
                          {spec?.itemDescription || '-'}{spec?.pattern && !((spec?.itemDescription || '').toLowerCase().includes(spec.pattern.toLowerCase())) ? ` - ${spec.pattern}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Size: {typeof spec?.size === 'string' ? sortSizesAscending(Array.from(new Set(spec.size.split(',').map((s: string) => s.trim()).filter(Boolean)))).join(', ') : (spec?.size || '-')} | Ord: {spec?.quantity || 0}
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
                          {Math.max(0, (Number(spec?.quantity) || 0) - (Number(spec?.useExistingStock) || 0))}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 py-2">Loading specifications...</p>
            )}
          </div>
        </div>

        {/* 4. Articles Calculation Table - Dynamic Light/Dark Mode Styling */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Articles Calculation</h2>
          </div>

          <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="grid grid-cols-12 px-6 py-3 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold tracking-wider uppercase">
              <div className="col-span-3">ARTICLE INVENTORY</div>
              <div className="col-span-2">Brand</div>
              <div className="col-span-1 text-center">Selected Sizes</div>
              <div className="col-span-2 text-center">Per Piece Qty</div>
              <div className="col-span-2 text-center">Total Qty <span className="text-[9px] text-slate-500 dark:text-slate-400 lowercase">(inc. wastage)</span></div>
              <div className="col-span-1 text-right">Per Unit Price</div>
              <div className="col-span-1 text-right">Final Price</div>
            </div>

            {isLoadingApi ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium">Calculating Article Requirements...</p>
              </div>
            ) : Array.isArray(articles) && articles.length > 0 ? (
              articles.map((art, artIdx) => {
                const combinedQty = Number(art?.article_combined_qty ?? art?.totalCombinedQty ?? 0);
                const combinedPrice = Number(art?.totalCombinedAmount ?? 0);
                const artName = art?.article_name || art?.articleName || art?.materialName || 'Article';
                const artKey = `bom-row-${art?.id || artName}-${artIdx}`;
                const sizesArray = art?.breakdown || art?.size_breakdown || art?.sizes || [];

                return (
                  <div key={artKey} className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="grid grid-cols-12 px-6 py-4 items-start">

                      <div className="col-span-3 pr-4">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{artName}</h4>
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                          {art?.unit || 'units'}
                        </span>
                      </div>

                      <div className="col-span-2 pr-6 flex flex-col gap-2">
                        <span className="text-slate-600 dark:text-slate-400 text-xs py-1">
                          {art?.selectedBrand || art?.brand || 'No Brand'}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          {art?.selectedWidth || art?.fabric_width || "Standard Size"}
                        </span>
                      </div>

                      <div className="col-span-7 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                        {Array.isArray(sizesArray) && sizesArray.length > 0 ? (
                          sizesArray.map((row: SizeRow, sizeIdx: number) => {
                            const perPiece = row?.per_piece_qty ?? row?.perPieceQty ?? 0;
                            const totQty = row?.total_qty_inc_wastage ?? row?.total_qty ?? row?.totalQty ?? 0;
                            const unitPrice = row?.unit_price ?? row?.per_unit_price ?? row?.perUnitPrice ?? 0;
                            const rowFinalPrice = (parseFloat(String(totQty)) || 0) * (parseFloat(String(unitPrice)) || 0);
                            const finalPrice = rowFinalPrice > 0 ? rowFinalPrice : (row?.final_price ?? row?.finalPrice ?? 0);

                            return (
                              <div
                                key={`size-${artKey}-${row?.size || sizeIdx}`}
                                className="grid grid-cols-7 items-center py-2 text-xs hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                              >
                                <div className="col-span-1 flex justify-center">
                                  <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50">
                                    {row?.size}
                                  </span>
                                </div>

                                <div className="col-span-2 flex justify-center text-slate-700 dark:text-slate-300 font-medium">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    inputMode="decimal"
                                    value={cellInputStrings[`${artIdx}-${sizeIdx}-per_piece_qty`] !== undefined ? cellInputStrings[`${artIdx}-${sizeIdx}-per_piece_qty`] : String(perPiece ?? 0)}
                                    onChange={(e) => handleCellInputChange(artIdx, sizeIdx, 'per_piece_qty', e.target.value)}
                                    onBlur={() => handleCellInputBlur(artIdx, sizeIdx, 'per_piece_qty')}
                                    className="w-20 text-center border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono font-medium"
                                  />
                                </div>

                                <div className="col-span-2 text-center font-bold text-slate-900 dark:text-white font-mono">
                                  {totQty}
                                </div>

                                <div className="col-span-1 flex items-center justify-end gap-1 text-slate-700 dark:text-slate-300">
                                  <span className="text-slate-400 dark:text-slate-500">₹</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    inputMode="decimal"
                                    value={cellInputStrings[`${artIdx}-${sizeIdx}-per_unit_price`] !== undefined ? cellInputStrings[`${artIdx}-${sizeIdx}-per_unit_price`] : String(unitPrice ?? 0)}
                                    onChange={(e) => handleCellInputChange(artIdx, sizeIdx, 'per_unit_price', e.target.value)}
                                    onBlur={() => handleCellInputBlur(artIdx, sizeIdx, 'per_unit_price')}
                                    className="w-20 text-right border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono font-medium"
                                  />
                                </div>

                                <div className="col-span-1 text-right font-bold text-slate-900 dark:text-white">
                                  ₹{(parseFloat(String(finalPrice)) || 0).toFixed(2)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-2 text-xs text-slate-400 text-center">No size breakdown available</div>
                        )}
                      </div>

                    </div>

                    <div className="grid grid-cols-12 px-6 py-2.5 bg-indigo-50/60 dark:bg-slate-800/60 border-t border-indigo-100 dark:border-slate-700 text-xs font-bold items-center">
                      <div className="col-span-5"></div>
                      <div className="col-span-2 text-indigo-800 dark:text-indigo-300 uppercase tracking-wider text-[11px]">
                        Total Combined Amount
                      </div>
                      <div className="col-span-2 text-center text-indigo-900 dark:text-indigo-200 text-sm">
                        {combinedQty}
                      </div>
                      <div className="col-span-1"></div>
                      <div className="col-span-2 text-right text-indigo-900 dark:text-indigo-200 text-sm">
                        ₹{combinedPrice.toFixed(2)}
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No articles found for this garment in DB.
              </div>
            )}
          </div>
          <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 rounded-b-xl text-sm font-semibold">
            <div className="text-slate-600 dark:text-slate-400">
              Wastage Margin Applied: <span className="text-indigo-600 dark:text-indigo-400">{wastage}%</span>
            </div>
            <div className="text-right">
              <span className="text-slate-600 dark:text-slate-400 mr-3">GRAND TOTAL AMOUNT:</span>
              <span className="text-lg text-emerald-600 dark:text-emerald-400 font-bold">
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
              Export BOM / Articles
            </button>
            {canAdvance ? (
              <button
                onClick={async () => {
                  const targetPoNumber = selectedPONumber || currentOrder?.poNumber;
                  if (!targetPoNumber) {
                    alert("Please select a PO Number first.");
                    return;
                  }
                  try {
                    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

                    const payload = {
                      po_number: targetPoNumber,
                      customer_name: selectedCustomer || currentOrder?.customerName || '',
                      po_date: selectedPODate || currentOrder?.poDate || '',
                      wastage_margin_percent: Number(wastage),
                      grand_total_amount: Number(totals.estCost),
                      articles: (articles || []).map(a => ({
                        article_key: a?.article_key || '',
                        material_name: a?.article_name || a?.articleName || a?.materialName || '',
                        brand: a?.selectedBrand || a?.brand || 'Standard',
                        unit: a?.unit || 'units',
                        size_breakdown: (a?.breakdown || a?.size_breakdown || a?.sizes || []).map((s: SizeRow) => ({
                          size: s?.size,
                          garment_qty: Number(s?.garment_qty ?? s?.orderQty ?? 0),
                          per_piece_qty: Number(s?.per_piece_qty ?? s?.perPieceQty ?? 0),
                          total_qty: Number(s?.total_qty_inc_wastage ?? s?.total_qty ?? s?.totalQty ?? 0),
                          per_unit_price: Number(s?.unit_price ?? s?.per_unit_price ?? s?.perUnitPrice ?? 0),
                          final_price: Number(s?.final_price ?? s?.finalPrice ?? 0)
                        }))
                      }))
                    };

                    const { success, data }: any = await safeFetchJson(`${BACKEND_URL}/api/bom/save-done`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders(true)
                      },
                      body: JSON.stringify(payload)
                    });

                    if (success && data && data.success !== false) {
                      window.dispatchEvent(new Event("orders-updated"));

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
                }}
                disabled={!selectedPONumber || isLoadingApi}
                className={`w-full sm:w-auto px-8 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                  !selectedPONumber || isLoadingApi
                    ? 'bg-muted text-neutral-400 cursor-not-allowed border border-border'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-indigo-200'
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

export default function BOMCalculationViewWrapped() {
  return (
    <BOMErrorBoundary>
      <BOMCalculationView />
    </BOMErrorBoundary>
  );
}
