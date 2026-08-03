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
  id: string;
  materialName: string;
  unit: string;
  brand: string;
  sizeType: string;
  sizes: SizeRow[];
  totalCombinedQty: number;
  totalCombinedAmount: number;
  category?: string;
  fabric_width?: string;
  selectedWidth?: string;
  available_widths?: string[];
  brandOptions?: string[];
  selectedBrand?: string;
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
  { id: 'heavyDutyThreadNavy', name: 'Heavy Duty Thread (Navy)', category: 'Thread', perPiece: 0.1, unit: 'meters', available: 120 },
  { id: 'standardThreadWhite', name: 'Standard Thread (White)', category: 'Thread', perPiece: 0.1, unit: 'meters', available: 500 },
  { id: 'metalZippers15cm', name: 'Metal Zippers 15cm', category: 'Zippers', perPiece: 1, unit: 'units', available: 45 },
  { id: 'metalButtonsSilver', name: 'Metal Buttons (Silver)', category: 'Buttons', perPiece: 6, unit: 'units', available: 5000 },
  { id: 'brandTagsWoven', name: 'Brand Tags (Woven)', category: 'Collar/Cuff', perPiece: 1, unit: 'units', available: 5000 },
  { id: 'collarHooks', name: 'Collar Hooks', category: 'Hooks', perPiece: 2, unit: 'units', available: 3000 },
];

const safeNumber = (val: any) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

export default function BOMCalculationView() {
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
  const [summary, setSummary] = useState({ total_fabric: 0, allied_materials: 0, est_cost: 0 });
  const [sizePerPieceOverrides, setSizePerPieceOverrides] = useState<Record<string, Record<string, number>>>({});
  const [sizeUnitPriceOverrides, setSizeUnitPriceOverrides] = useState<Record<string, Record<string, number>>>({});
  const [sizeLaborCostOverrides, setSizeLaborCostOverrides] = useState<Record<string, Record<string, number>>>({});
  const [sleeveType, setSleeveType] = useState<string>('');
  const [selectedGarmentIndex, setSelectedGarmentIndex] = useState<number>(0);
  const [isTotalBomMode, setIsTotalBomMode] = useState<boolean>(false);

  useEffect(() => {
    if (selectedPONumber) {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      fetch(`${BACKEND_URL}/purchase_orders/details/${selectedPONumber}`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (data.success !== false) {
            console.log("Selected PO Full Payload:", data);
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

  const activeGarment = activeSpecs[selectedGarmentIndex] || activeSpecs[0];

  const totalProductionRequired = isTotalBomMode
    ? activeSpecs.reduce((sum: number, spec: any) => sum + Math.max(0, (Number(spec.quantity) || 0) - (Number(spec.useExistingStock) || 0)), 0)
    : activeGarment
      ? Math.max(0, (Number(activeGarment.quantity) || 0) - (Number(activeGarment.useExistingStock) || 0))
      : 0;

  const garmentType = isTotalBomMode ? 'Total Order' : (activeGarment?.itemDescription || 'Shirt');

  useEffect(() => {
    if (currentOrder && activeGarment) {
      console.log('--- PO OR GARMENT CHANGED ---');
      console.log('Current Order Object:', currentOrder);
      console.log('Active Garment:', activeGarment);

      const garmentDetailsArray = currentOrder?.garmentDetails || currentOrder?.garment_details || [];
      const matchingGarmentDetail = Array.isArray(garmentDetailsArray) && garmentDetailsArray.length > selectedGarmentIndex ? garmentDetailsArray[selectedGarmentIndex] : garmentDetailsArray[0];

      const sleeveValue =
        activeGarment?.sleeveType ||
        activeGarment?.sleeve_type ||
        activeGarment?.sleeve ||
        matchingGarmentDetail?.sleeveType ||
        matchingGarmentDetail?.sleeve_type ||
        matchingGarmentDetail?.sleeve ||
        currentOrder?.garmentSpec?.sleeveType ||
        currentOrder?.garmentSpec?.sleeve_type ||
        currentOrder?.items?.[selectedGarmentIndex]?.sleeve_type ||
        currentOrder?.items?.[selectedGarmentIndex]?.sleeveType ||
        currentOrder?.items?.[selectedGarmentIndex]?.sleeve ||
        currentOrder?.sleeveType ||
        currentOrder?.sleeve_type ||
        '';

      console.log('Extracted Sleeve Value for selected garment:', sleeveValue);

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

  const formatSleeveType = (s: string) => {
    if (!s) return 'N/A';
    return s.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  const displaySleeveType = formatSleeveType(sleeveType);

  const selectedSizes = React.useMemo(() => {
    if (!activeGarment) return [];
    let specSizes: string[] = [];
    if (Array.isArray(activeGarment.size)) {
      specSizes = activeGarment.size.map(String).map((x: string) => x.trim());
    } else if (typeof activeGarment.size === 'string') {
      specSizes = activeGarment.size.split(',').map((x: string) => x.trim()).filter(Boolean);
    } else if (activeGarment.size) {
      specSizes = [String(activeGarment.size).trim()];
    }

    const prodReq = Math.max(0, (Number(activeGarment.quantity) || 0) - (Number(activeGarment.useExistingStock) || 0));
    const qtyPerSize = specSizes.length > 0 ? Math.ceil(prodReq / specSizes.length) : 0;

    return specSizes.map((s: string) => ({ size: s, quantity: qtyPerSize }));
  }, [activeGarment]);

  const sizesDependency = JSON.stringify(selectedSizes);

  useEffect(() => {
    const fetchForSpec = async (spec: any, index: number, BACKEND_URL: string) => {
      const garmentDetailsArray = currentOrder?.garmentDetails || currentOrder?.garment_details || [];
      const matchingGarmentDetail = Array.isArray(garmentDetailsArray) && garmentDetailsArray.length > index ? garmentDetailsArray[index] : garmentDetailsArray[0];

      const sValue =
        spec?.sleeveType || spec?.sleeve_type || spec?.sleeve ||
        matchingGarmentDetail?.sleeveType || matchingGarmentDetail?.sleeve_type || matchingGarmentDetail?.sleeve ||
        currentOrder?.garmentSpec?.sleeveType || currentOrder?.garmentSpec?.sleeve_type ||
        currentOrder?.items?.[index]?.sleeve_type || currentOrder?.items?.[index]?.sleeveType || currentOrder?.items?.[index]?.sleeve ||
        currentOrder?.sleeveType || currentOrder?.sleeve_type || '';
      let sType = '';
      if (sValue.toLowerCase().includes('half')) sType = 'half_sleeve';
      else if (sValue.toLowerCase().includes('full')) sType = 'full_sleeve';

      const specProdReq = Math.max(0, (Number(spec.quantity) || 0) - (Number(spec.useExistingStock) || 0));

      let specSizesArr: string[] = [];
      if (Array.isArray(spec.size)) {
        specSizesArr = spec.size.map(String).map((x: string) => x.trim());
      } else if (typeof spec.size === 'string') {
        specSizesArr = spec.size.split(',').map((x: string) => x.trim()).filter(Boolean);
      } else if (spec.size) {
        specSizesArr = [String(spec.size).trim()];
      }
      const qtyPerSize = specSizesArr.length > 0 ? Math.ceil(specProdReq / specSizesArr.length) : 0;
      const parsedSizes = specSizesArr.map((s: string) => ({ size: s, quantity: qtyPerSize }));

      const gType = spec?.itemDescription || 'Shirt';

      const payload = {
        category: gType,
        sleeveType: sType.includes('half') ? 'half_sleeve' : 'full_sleeve',
        sizes: parsedSizes,
        orderQty: specProdReq,
        wastageMargin: wastage
      };

      console.log("[BOM Debug] fetchForSpec payload:", payload);

      const res = await fetch(`${BACKEND_URL}/api/bom/calculate-from-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { data, sType };
    };

    const fetchBOMCalculations = async (po: string) => {
      if (!po) return;
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const identifier = activeGarment?.itemDescription || activeGarment?.item_description || activeGarment?.garment_id || po;
        const totalOrderQty = totalProductionRequired || 0;

        const activePoSizes = selectedSizes.map((s: any) => s.size);

        const res = await fetch(`${BACKEND_URL}/api/bom-calculations?category=${encodeURIComponent(identifier)}&sleeveType=${encodeURIComponent(sleeveType || '')}`);
        const data = await res.json();

        if (data.success) {
          const rawItems = data.articles || data.materials || [];

          const parseNumericQty = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return '';
            const cleaned = String(val).replace(/[^0-9.]/g, '');
            return cleaned ? parseFloat(cleaned) : '';
          };

          const calculatedItems: MaterialGroup[] = rawItems.map((item: any) => {
            const parsedPiece = parseNumericQty(item.per_piece_qty);
            const perPiece = Number(parsedPiece) || 0;
            const itemWastage = Number(item.wastage_margin) || wastage || 0;

            const sizes: SizeRow[] = activePoSizes.map((sz: string) => {
              const sizeObj = selectedSizes.find((s: any) => s.size === sz);
              const qtyForThisSize = sizeObj ? sizeObj.quantity : 0;

              const totalQty = (perPiece * qtyForThisSize) * (1 + itemWastage / 100);
              const finalPrice = 0; // Prices blank by default

              return {
                size: sz,
                perPieceQty: parsedPiece,
                totalQty: Number(totalQty.toFixed(2)),
                perUnitPrice: '', // Default blank
                finalPrice: Number(finalPrice.toFixed(2)),
                orderQty: qtyForThisSize
              };
            });

            const totalCombinedQty = sizes.reduce((sum, s) => sum + s.totalQty, 0);
            const totalCombinedAmount = sizes.reduce((sum, s) => sum + s.finalPrice, 0);

            return {
              id: item.id || item.material_inventory || item.article_name,
              materialName: item.article_name || item.material_inventory,
              unit: item.unit || (item.material_inventory?.toLowerCase().includes('thread') ? 'meters' : 'units'),
              brand: item.brand || '',
              selectedBrand: item.selectedBrand || item.brand || 'Standard',
              brandOptions: item.brandOptions || [],
              sizeType: 'Standard Size',
              fabric_width: item.fabric_width || '',
              selectedWidth: item.selectedWidth || item.fabric_width || '',
              available_widths: item.available_widths || null,
              sizes,
              totalCombinedQty: Number(totalCombinedQty.toFixed(2)),
              totalCombinedAmount: Number(totalCombinedAmount.toFixed(2)),
              category: item.category || ''
            };
          });

          setEditableMaterials(calculatedItems);
        } else {
          setEditableMaterials([]);
        }
      } catch (err) {
        console.error("Failed to load BOM calculations:", err);
        setEditableMaterials([]);
      }
    };

    fetchBOMCalculations(selectedPONumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPONumber, selectedGarmentIndex, activeGarment?.itemDescription, activeGarment?.garment_id, sleeveType]);

  // Recalculate totals dynamically if wastage changes
  React.useEffect(() => {
    setEditableMaterials(prev => prev.map(mat => {
      const sizes = mat.sizes.map(sz => {
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
        totalCombinedQty: Number(sizes.reduce((sum, s) => sum + s.totalQty, 0).toFixed(2)),
        totalCombinedAmount: Number(sizes.reduce((sum, s) => sum + s.finalPrice, 0).toFixed(2))
      };
    }));
  }, [wastage]);

  const calculatedMaterials = editableMaterials;

  const updateMaterialField = (matIndex: number, field: string, value: any) => {
    setEditableMaterials(prev => {
      const next = [...prev];
      next[matIndex] = { ...next[matIndex], [field]: value };
      return next;
    });
  };

  const recalculateGroupTotals = (data: MaterialGroup[], groupIndex: number) => {
    const group = data[groupIndex];
    group.totalCombinedQty = Number(group.sizes.reduce((sum, s) => sum + (parseFloat(String(s.totalQty)) || 0), 0).toFixed(2));
    group.totalCombinedAmount = Number(group.sizes.reduce((sum, s) => sum + (parseFloat(String(s.finalPrice)) || 0), 0).toFixed(2));
  };

  const handlePerPieceQtyChange = (materialIndex: number, sizeIndex: number, newValue: string) => {
    setEditableMaterials(prev => {
      const updatedTable = [...prev];
      const mat = { ...updatedTable[materialIndex] };
      const sizes = [...mat.sizes];
      const row = { ...sizes[sizeIndex] };

      row.perPieceQty = newValue;

      const numericQty = parseFloat(newValue) || 0;
      const numericWastage = parseFloat(String(wastage)) || 0;
      row.totalQty = Number(((numericQty * row.orderQty) * (1 + numericWastage / 100)).toFixed(2));

      const numericPrice = parseFloat(String(row.perUnitPrice)) || 0;
      row.finalPrice = Number((row.totalQty * numericPrice).toFixed(2));

      sizes[sizeIndex] = row;
      mat.sizes = sizes;
      updatedTable[materialIndex] = mat;

      recalculateGroupTotals(updatedTable, materialIndex);
      return updatedTable;
    });
  };

  const handlePerUnitPriceChange = (materialIndex: number, sizeIndex: number, newValue: string) => {
    setEditableMaterials(prev => {
      const updatedTable = [...prev];
      const mat = { ...updatedTable[materialIndex] };
      const sizes = [...mat.sizes];
      const row = { ...sizes[sizeIndex] };

      row.perUnitPrice = newValue;

      const numericPrice = parseFloat(newValue) || 0;
      const numericTotalQty = parseFloat(String(row.totalQty)) || 0;
      row.finalPrice = Number((numericTotalQty * numericPrice).toFixed(2));

      sizes[sizeIndex] = row;
      mat.sizes = sizes;
      updatedTable[materialIndex] = mat;

      recalculateGroupTotals(updatedTable, materialIndex);
      return updatedTable;
    });
  };

  const uniqueSizes = sortSizesAscending(Array.from(new Set(
    activeSpecs.flatMap((s: any) => {
      if (Array.isArray(s.size)) return s.size.map(String).map((x: string) => x.trim());
      if (typeof s.size === 'string') return s.size.split(',').map((x: string) => x.trim()).filter(Boolean);
      if (s.size) return [String(s.size).trim()];
      return [];
    })
  )));

  const totals = React.useMemo(() => {
    let totalFabricMeters = 0;
    let totalAlliedUnits = 0;
    let grandTotalCost = 0;

    editableMaterials.forEach((mat) => {
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
  }, [editableMaterials]);
  const itemsToProcure = totalProductionRequired > 0 ? editableMaterials.filter(m => m.missing > 0).length : 0;

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
        supplier: 'Auto Assigned Supplier',
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

        {/* 2. Order Configuration (Horizontal Full-Width) */}
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
                options={poNumbers}
                value={selectedPONumber}
                placeholder="Select a PO Number..."
                disabled={!selectedCustomer}
                onChange={(val) => {
                  const newOrder = filteredOrders.find(o => o.poNumber === val) || detailedOrder;
                  console.log("Selected PO Object:", newOrder);
                  setSelectedPONumber(val);
                  setSelectedGarmentIndex(0);
                  setWastage(5);
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

                  const garmentDetailsArray = currentOrder?.garmentDetails || currentOrder?.garment_details || [];
                  const matchingGarmentDetail = Array.isArray(garmentDetailsArray) && garmentDetailsArray.length > idx ? garmentDetailsArray[idx] : garmentDetailsArray[0];

                  const sValue =
                    spec?.sleeveType ||
                    spec?.sleeve_type ||
                    spec?.sleeve ||
                    matchingGarmentDetail?.sleeveType ||
                    matchingGarmentDetail?.sleeve_type ||
                    matchingGarmentDetail?.sleeve ||
                    currentOrder?.garmentSpec?.sleeveType ||
                    currentOrder?.garmentSpec?.sleeve_type ||
                    currentOrder?.items?.[idx]?.sleeve_type ||
                    currentOrder?.items?.[idx]?.sleeveType ||
                    currentOrder?.items?.[idx]?.sleeve ||
                    currentOrder?.sleeveType ||
                    currentOrder?.sleeve_type ||
                    '';
                  const formattedSleeve = sValue ? sValue.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'N/A';

                  return (
                    <button
                      key={idx}
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
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded border font-medium ${isSelected ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-800' : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'}`}>
                            Sleeve: {formattedSleeve}
                          </span>
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded border font-medium ${isSelected ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-800' : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'}`}>
                            Category: {spec.garment_category || spec.garment_type || spec.category || 'Shirt'}
                          </span>
                        </div>
                      </div>
                      <div className={`text-right pl-3 border-l ${isSelected ? 'border-indigo-200 dark:border-indigo-800' : 'border-neutral-200 dark:border-neutral-600'}`}>
                        <p className="text-[10px] text-muted-foreground uppercase">Req.</p>
                        <p className={`text-sm font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-foreground'}`}>
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

          <div className="w-full bg-[#0d121f] border-t border-gray-800 overflow-hidden text-gray-200">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-3 bg-gray-950/80 border-b border-gray-800 text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
              <div className="col-span-3">Material Inventory</div>
              <div className="col-span-2">Brand</div>
              <div className="col-span-1 text-center">Selected Sizes</div>
              <div className="col-span-2 text-center">Per Piece Qty</div>
              <div className="col-span-2 text-center">Total Qty <span className="text-[9px] text-gray-500 lowercase">(inc. wastage)</span></div>
              <div className="col-span-1 text-right">Per Unit Price</div>
              <div className="col-span-1 text-right">Final Price</div>
            </div>

            {/* Material Block Repeat */}
            {editableMaterials && editableMaterials.length > 0 ? (
              editableMaterials.map((mat, matIdx) => {
                const combinedQty = mat.totalCombinedQty;
                const combinedPrice = mat.totalCombinedAmount;

                return (
                  <div key={`bom-row-${mat.materialName}-${mat.id || matIdx}`} className="border-b border-gray-800/80">
                    <div className="grid grid-cols-12 px-6 py-4 items-start">
                      
                      {/* Left Metadata Panel */}
                      <div className="col-span-3 pr-4">
                        <h4 className="text-sm font-bold text-white">{mat.materialName}</h4>
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] bg-gray-800/80 text-gray-400 rounded-full border border-gray-700/50">
                          {mat.unit || 'units'}
                        </span>
                      </div>

                      <div className="col-span-2 pr-6 flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Enter brand"
                          value={mat.selectedBrand || mat.brand || ''}
                          onChange={(e) => updateMaterialField(matIdx, 'selectedBrand', e.target.value)}
                          className="w-full bg-transparent text-gray-400 text-xs focus:outline-none placeholder-gray-600 py-1"
                        />
                        <select
                          value={mat.selectedWidth || mat.fabric_width || "Standard Size"}
                          onChange={(e) => updateMaterialField(matIdx, 'selectedWidth', e.target.value)}
                          className="w-full bg-[#141b2d] text-gray-300 text-xs px-2.5 py-1.5 rounded border border-gray-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {mat.available_widths && mat.available_widths.length > 0 ? (
                            mat.available_widths.map((spec: string) => (
                              <option className="bg-slate-800" key={spec} value={spec}>{spec}</option>
                            ))
                          ) : (
                            <>
                              <option className="bg-slate-800" value={mat.fabric_width || "Standard Size"}>
                                {mat.fabric_width || "Standard Size"}
                              </option>
                              <option className="bg-slate-800" value="Custom Size">Custom Size</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Right Size-wise Rows */}
                      <div className="col-span-7 flex flex-col">
                        {mat.sizes.map((row: any, sizeIdx: number) => (
                          <div 
                            key={`size-${mat.id || matIdx}-${row.size}-${sizeIdx}`} 
                            className="grid grid-cols-7 items-center py-2 border-b border-gray-800/40 last:border-0 text-xs"
                          >
                            
                            {/* Size Badge */}
                            <div className="col-span-1 flex justify-center">
                              <span className="bg-indigo-950/80 text-indigo-300 font-semibold px-2.5 py-0.5 rounded border border-indigo-800/50">
                                {row.size}
                              </span>
                            </div>

                            {/* Per Piece Qty Input */}
                            <div className="col-span-2 flex justify-center">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={row.perPieceQty ?? ''}
                                onChange={(e) => handlePerPieceQtyChange(matIdx, sizeIdx, e.target.value)}
                                className="w-16 bg-transparent text-center text-gray-200 text-xs py-1 focus:bg-gray-800/80 focus:border focus:border-indigo-500 rounded focus:outline-none transition-all"
                              />
                            </div>

                            {/* Total Qty */}
                            <div className="col-span-2 text-center font-bold text-gray-200">
                              {row.totalQty || 0}
                            </div>

                            {/* Per Unit Price Input */}
                            <div className="col-span-1 flex items-center justify-end gap-1">
                              <span className="text-gray-500">₹</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={row.perUnitPrice ?? ''}
                                onChange={(e) => handlePerUnitPriceChange(matIdx, sizeIdx, e.target.value)}
                                className="w-12 bg-transparent text-right text-gray-200 text-xs py-1 focus:bg-gray-800/80 focus:border focus:border-indigo-500 rounded focus:outline-none transition-all"
                              />
                            </div>

                            {/* Final Price */}
                            <div className="col-span-1 text-right font-bold text-white">
                              ₹{(parseFloat(row.finalPrice) || 0).toFixed(2)}
                            </div>

                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Subtotal Summary Bar */}
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

                      const payload = {
                        po_number: currentOrder.poNumber,
                        customer_name: currentOrder.customerName,
                        wastage_margin: Number(wastage),
                        grand_total_amount: Number(totals.estCost),
                        materials: editableMaterials.map(m => ({
                          material_name: m.materialName || '',
                          brand: m.selectedBrand || m.brand || 'Standard',
                          size_breakdown: m.sizes.map((s: any) => ({
                            size: s.size,
                            per_piece_qty: Number(s.perPieceQty || 0),
                            total_qty: Number(s.sizeTotalQty || 0),
                            per_unit_price: Number(s.perUnitPrice || 0),
                            final_price: Number(s.sizeFinalPrice || 0)
                          }))
                        }))
                      };

                      const res = await fetch(`${BACKEND_URL}/api/bom/check-inventory`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...getAuthHeaders(true)
                        },
                        body: JSON.stringify(payload)
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