"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Upload, MapPin, Save, X, Search, Check, ChevronDown } from "lucide-react";
import WorkflowIndicator from "@/components/WorkflowIndicator";
import { useAuth } from "@/context/AuthContext";
import { updateOrderAndLog } from "@/lib/logger";

let __idCounter = 0;
const generateId = () => `row-${Date.now()}-${__idCounter++}`;

// --- INTERFACES ---
interface GarmentSpec {
  id: string;
  category: string;
  gender: string;
  itemDescription: string;
  hsnCode: string;
  size: string;
  color: string;
  pattern: string;
  quantity: number;
  stockAvailable: number;
  unitPrice: number;
  photoName: string | null;
  productionType: "In House" | "Outsource";
}

interface DeliveryAddress {
  id: string;
  address: string;
  pinCode: string;
}

interface DetailedAllocation {
  id: string;
  deliveryAddress: string;
  pinCode?: string;
  itemId: string;
  color?: string;
  size: string;
  quantity: number;
}

interface DraftOrder {
  id: string;
  poNumber: string;
  dateSaved: string;
  totalQuantity: number;
  specs: GarmentSpec[];
  deliveryAddresses: DeliveryAddress[];
  detailedAllocations: DetailedAllocation[];
}

interface AddressTemplate {
  id: string;
  label: string;
  address: string;
  pinCode: string;
}

// --- CONSTANTS & STYLES ---
const INITIAL_TEMPLATES: AddressTemplate[] = [
  { id: "t1", label: "Corporate Office - Delhi", address: "Connaught Place, Block B, New Delhi", pinCode: "110001" },
  { id: "t2", label: "Fulfillment Center - Bangalore", address: "Electronic City Phase 1, Bangalore", pinCode: "560100" },
  { id: "t3", label: "Warehouse A - Mumbai", address: "Plot 14, MIDC Andheri East, Mumbai", pinCode: "400093" },
  { id: "t4", label: "Regional Hub - Chennai", address: "Guindy Industrial Estate, Chennai", pinCode: "600032" }
];

const INPUT_STYLE =
  "w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder-neutral-500 caret-black dark:caret-white focus:outline-none focus:ring-2 border-neutral-300 dark:border-slate-700 focus:ring-blue-500 transition shadow-sm";

const SIZE_OPTIONS = ["28", "30", "32", "34", "36", "38", "40", "42", "44", "XS", "S", "M", "L", "XL", "XXL", "XXXL"].map(s => ({ label: s, value: s }));

const COLOR_OPTIONS = [
  { label: "Red", value: "Red", colorCode: "#EF4444" },
  { label: "Blue", value: "Blue", colorCode: "#3B82F6" },
  { label: "Green", value: "Green", colorCode: "#22C55E" },
  { label: "Yellow", value: "Yellow", colorCode: "#EAB308" },
  { label: "Black", value: "Black", colorCode: "#000000" },
  { label: "White", value: "White", colorCode: "#FFFFFF" },
  { label: "Grey", value: "Grey", colorCode: "#6B7280" },
  { label: "Navy", value: "Navy", colorCode: "#1E3A8A" },
];

interface Option {
  label: string;
  value: string;
  colorCode?: string;
}

interface CustomMultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  isColorMode?: boolean;
  allowCustomAdd?: boolean;
}

function CustomMultiSelect({ options, selectedValues, onChange, placeholder, isColorMode, allowCustomAdd }: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelection = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeSelection = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const [dynamicOptions, setDynamicOptions] = useState<Option[]>([]);
  const [deletedOptions, setDeletedOptions] = useState<string[]>([]);

  const allOptions = [...options, ...dynamicOptions].filter(opt => !deletedOptions.includes(opt.value));
  const filteredOptions = allOptions.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const showAddOption = allowCustomAdd && searchTerm.trim() !== "" && !allOptions.some(opt => opt.label.toLowerCase() === searchTerm.trim().toLowerCase());

  const handleAddCustom = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newColor = searchTerm.trim();
    const newOption: Option = { label: newColor, value: newColor, colorCode: "transparent" };
    setDynamicOptions([...dynamicOptions, newOption]);
    onChange([...selectedValues, newColor]);
    setSearchTerm("");
  };

  const handleDeleteOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    setDeletedOptions([...deletedOptions, value]);
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    }
  };

  const MAX_VISIBLE_TAGS = 2;
  const visibleTags = selectedValues.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = selectedValues.length - MAX_VISIBLE_TAGS;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`${INPUT_STYLE} min-h-[44px] h-auto py-1.5 flex items-center justify-between cursor-pointer`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 items-center">
          {selectedValues.length === 0 ? (
            <span className="text-neutral-400 dark:text-neutral-500 text-sm ml-1">{placeholder || "Select..."}</span>
          ) : (
            <>
              {visibleTags.map(val => {
                const opt = options.find(o => o.value === val);
                return (
                  <span key={val} className="flex items-center gap-1 bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 px-2 py-1 rounded-full text-xs font-medium border border-neutral-200 dark:border-slate-700">
                    {isColorMode && opt?.colorCode && (
                      <span className="w-2 h-2 rounded-full border border-neutral-300 dark:border-slate-600" style={{ background: opt.colorCode }} />
                    )}
                    {opt ? opt.label : val}
                    <button
                      type="button"
                      onClick={(e) => removeSelection(e, val)}
                      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              {hiddenCount > 0 && (
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-slate-800/50 px-2 py-1 rounded-full border border-neutral-200 dark:border-slate-700">
                  +{hiddenCount} more
                </span>
              )}
            </>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-neutral-100 dark:border-slate-800 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-neutral-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-md focus:outline-none transition-colors text-neutral-800 dark:text-neutral-200"
              />
            </div>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange([]); }}
                className="text-xs font-semibold text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 px-2 py-1 rounded transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {showAddOption && (
              <div
                onClick={handleAddCustom}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md cursor-pointer transition-colors border border-dashed border-blue-200 dark:border-blue-800 mb-1"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add &quot;{searchTerm.trim()}&quot;</span>
              </div>
            )}
            {filteredOptions.length === 0 && !showAddOption ? (
              <div className="p-3 text-center text-sm text-neutral-500">No results found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={(e) => { e.stopPropagation(); toggleSelection(opt.value); }}
                    className="group flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                  >
                    <div className={`flex items-center justify-center w-4 h-4 rounded border ${isSelected ? "bg-blue-500 border-blue-500" : "border-neutral-300 dark:border-slate-600 bg-white dark:bg-slate-900"}`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      {isColorMode && opt.colorCode && (
                        <span className="w-3 h-3 rounded-full border border-neutral-200 dark:border-slate-700" style={{ background: opt.colorCode }} />
                      )}
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{opt.label}</span>
                    </div>
                    {isColorMode && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOption(e, opt.value)}
                        className="text-neutral-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete option"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GarmentSpecsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const currentPoNumber = searchParams.get("poNumber") || `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // --- CORE STATE MANAGEMENT ---
  const [specs, setSpecs] = useState<GarmentSpec[]>([
    {
      id: "1",
      category: "",
      gender: "",
      itemDescription: "",
      hsnCode: "",
      size: "",
      color: "",
      pattern: "",
      quantity: 0,
      stockAvailable: 0,
      unitPrice: 0,
      photoName: null,
      productionType: "In House",
    },
  ]);

  const [deliveryType, setDeliveryType] = useState<"single" | "multi">("single");
  const [singleAddress, setSingleAddress] = useState("");
  const [singlePin, setSinglePin] = useState("");

  const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>([]);
  const [detailedAllocations, setDetailedAllocations] = useState<DetailedAllocation[]>([]);
  const [isLiveOrder, setIsLiveOrder] = useState(false);

  // --- UI STATE MANAGEMENT ---
  const [savedTemplates, setSavedTemplates] = useState<AddressTemplate[]>(INITIAL_TEMPLATES);
  const [activeDropdownRow, setActiveDropdownRow] = useState<string | null>(null);
  const [isSavedAddressesOpen, setIsSavedAddressesOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<DraftOrder[]>([]);

  // --- INTERACTION HOOKS ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdownRow(null);
        setIsSavedAddressesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("savedOrders");
    if (stored) {
      try {
        const savedOrders = JSON.parse(stored);
        const order = savedOrders.find((o: any) => o.poNumber === currentPoNumber);
        if (order) {
          setIsLiveOrder(true);
          setDeliveryType(order.deliveryType || "single");
          setSingleAddress(order.deliveryAddress || "");
          setSinglePin(order.deliveryPin || "");
          if (order.specs) {
            setSpecs(order.specs);

            const isSingle = (order.deliveryType || "single") === "single";

            if (!order.detailedAllocations || order.detailedAllocations.length === 0) {
              const parsedAllocations: DetailedAllocation[] = [];
              order.specs.forEach((s: GarmentSpec) => {
                const sizes = s.size ? s.size.split(",").map(sz => sz.trim()).filter(Boolean) : ["Standard"];
                sizes.forEach(sz => {
                  parsedAllocations.push({
                    id: generateId(),
                    deliveryAddress: isSingle ? (order.deliveryAddress || "Single Address") : "",
                    pinCode: isSingle ? (order.deliveryPin || "") : "",
                    itemId: s.id,
                    color: "",
                    size: sz,
                    quantity: 0
                  });
                });
              });
              setDetailedAllocations(parsedAllocations);
            } else {
              setDetailedAllocations(order.detailedAllocations);
            }
            if (order.deliveryAddresses && order.deliveryAddresses.length > 0) {
              setDeliveryAddresses(order.deliveryAddresses);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentPoNumber]);

  // Synchronize detailed allocations with garment specs when in Single Delivery mode
  useEffect(() => {
    if (deliveryType === "single") {
      setDetailedAllocations((prev) => {
        const newAllocations: DetailedAllocation[] = [];
        specs.forEach((s) => {
          const sizes = s.size ? s.size.split(",").map((sz) => sz.trim()).filter(Boolean) : ["Standard"];
          sizes.forEach((sz) => {
            const existing = prev.find((a) => a.itemId === s.id && a.size === sz);
            newAllocations.push({
              id: existing ? existing.id : generateId(),
              deliveryAddress: singleAddress,
              pinCode: singlePin,
              itemId: s.id,
              color: existing ? existing.color || "" : "",
              size: sz,
              quantity: sizes.length === 1 ? s.quantity : (existing ? existing.quantity : 0),
            });
          });
        });

        const isSame = prev.length === newAllocations.length && prev.every((p, i) => {
          const n = newAllocations[i];
          return p.itemId === n.itemId && p.size === n.size && p.quantity === n.quantity && p.deliveryAddress === n.deliveryAddress && p.pinCode === n.pinCode;
        });

        return isSame ? prev : newAllocations;
      });
    }
  }, [specs, deliveryType, singleAddress, singlePin]);

  // --- GARMENT MATRIX ACTION HANDLERS ---
  const addRow = () => {
    setSpecs((prev) => [
      ...prev,
      {
        id: generateId(),
        category: "",
        gender: "",
        itemDescription: "",
        hsnCode: "",
        size: "",
        color: "",
        pattern: "",
        quantity: 0,
        stockAvailable: 0,
        unitPrice: 0,
        photoName: null,
        productionType: "In House",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (specs.length > 1) {
      setSpecs((prev) => prev.filter((spec) => spec.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof GarmentSpec, value: string | number) => {
    setSpecs((prev) => prev.map((spec) => (spec.id === id ? { ...spec, [field]: value } : spec)));
  };

  // --- SHIPPING CONFIGURATION HANDLERS ---
  const addAddressRow = () => {
    setDeliveryAddresses((prev) => [...prev, { id: generateId(), address: "", pinCode: "" }]);
  };

  const removeAddressRow = (id: string) => {
    if (deliveryAddresses.length > 1) {
      setDeliveryAddresses((prev) => prev.filter((addr) => addr.id !== id));
    }
  };

  const updateAddressRow = (id: string, field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddresses((prev) => prev.map((addr) => (addr.id === id ? { ...addr, [field]: value } : addr)));
  };

  // --- ALLOCATION WORKBOOK HANDLERS ---
  const addAllocationRow = () => {
    setDetailedAllocations((prev) => [
      ...prev,
      { id: generateId(), deliveryAddress: "", itemId: "", color: "", size: "", quantity: 0 },
    ]);
  };

  const removeAllocationRow = (id: string) => {
    if (detailedAllocations.length > 1) {
      setDetailedAllocations((prev) => prev.filter((alloc) => alloc.id !== id));
    } else {
      setDetailedAllocations([{ id: generateId(), deliveryAddress: "", itemId: "", color: "", size: "", quantity: 0 }]);
    }
  };

  const updateAllocationRow = (id: string, field: keyof DetailedAllocation, value: string | number) => {
    setDetailedAllocations((prev) => prev.map((alloc) => (alloc.id === id ? { ...alloc, [field]: value } : alloc)));
  };

  const handleOkClick = (spec: GarmentSpec) => {
    if (deliveryType === "multi") {
      setDetailedAllocations((prev) => {
        const hasEmptyAlloc = prev.some(a => a.itemId === spec.id && a.deliveryAddress === "");
        if (hasEmptyAlloc) return prev;

        return [
          ...prev,
          { id: generateId(), deliveryAddress: "", itemId: spec.id, color: "", size: "", quantity: 0 },
        ];
      });
      setTimeout(() => {
        document.getElementById("multi-delivery-allocations")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      setTimeout(() => {
        const addressField = document.getElementById("single-delivery-address");
        if (addressField) {
          addressField.focus();
          addressField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // --- UTILITY CALCULATIONS & TEMPLATES ---
  const handleTemplateSelect = (rowId: string, template: AddressTemplate) => {
    setDeliveryAddresses((prev) =>
      prev.map((addr) =>
        addr.id === rowId ? { ...addr, address: template.address, pinCode: template.pinCode } : addr
      )
    );
    setActiveDropdownRow(null);
  };

  const handleSaveAddress = (addr: DeliveryAddress) => {
    const trimmedAddress = addr.address.trim();
    const trimmedPin = addr.pinCode.trim();

    if (!trimmedAddress || !trimmedPin) {
      alert("Please enter both a Delivery Address and a PIN Code before saving.");
      return;
    }

    const exists = savedTemplates.some(
      (t) => t.address.toLowerCase() === trimmedAddress.toLowerCase() && t.pinCode === trimmedPin
    );

    if (exists) {
      alert("This address is already saved in your templates.");
      return;
    }

    const newTemplate: AddressTemplate = {
      id: generateId(),
      label: trimmedAddress.split(",")[0] || "Custom Saved Address",
      address: trimmedAddress,
      pinCode: trimmedPin,
    };

    setSavedTemplates((prev) => [...prev, newTemplate]);
    alert("Address saved successfully!");
  };

  const getFilteredTemplates = (query: string) => {
    return [...savedTemplates]
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter((t) => !query || t.label.toLowerCase().includes(query.toLowerCase()) || t.address.toLowerCase().includes(query.toLowerCase()));
  };

  const calculateAllocatedQty = (itemId: string) => {
    return detailedAllocations
      .filter((alloc) => alloc.itemId === itemId)
      .reduce((sum, alloc) => sum + (alloc.quantity || 0), 0);
  };

  const hasExceedingItems = specs.some((s) => calculateAllocatedQty(s.id) > s.quantity);

  // --- VALIDATION AND STEP TRANSITIONS ---
  const validateFormOrAlert = (): boolean => {
    const invalidSpecs = specs.some((s) => !s.itemDescription.trim() || !s.quantity || s.quantity <= 0);

    if (invalidSpecs) {
      alert("Please complete all required fields in Order Specifications and ensure quantity > 0.");
      return false;
    }

    if (hasExceedingItems) {
      alert("Cannot proceed: One or more items exceed their maximum allowed allocation quantity.");
      return false;
    }

    return true;
  };

  const handleSaveAndAdvance = () => {
    if (!validateFormOrAlert()) return;
    router.push("/stock-calculation");
  };

  const handleFinalSubmit = () => {
    if (!validateFormOrAlert()) return;
    setShowConfirmModal(true);
  };

  const handleSubmitSpecifications = () => {
    const payload = {
      poNumber: currentPoNumber,
      poDate: new Date().toISOString(),
      specs,
      deliveryAddresses,
      detailedAllocations,
      stage: "Stock Check",
      status: "SUBMITTED",
    };

    updateOrderAndLog(currentPoNumber, user?.name || "System User", "Updated", "Saved Garment Specifications to drafts", (orders) => {
      const existingIndex = orders.findIndex((o: { poNumber: string }) => o.poNumber === currentPoNumber);
      if (existingIndex !== -1) {
        orders[existingIndex] = { ...orders[existingIndex], ...payload };
      } else {
        orders.push({ id: generateId(), ...payload });
      }
      return [...orders];
    });

    // Reset Forms
    setSpecs([{
      id: "1",
      category: "",
      gender: "",
      itemDescription: "",
      hsnCode: "",
      size: "",
      color: "",
      pattern: "",
      quantity: 0,
      stockAvailable: 0,
      unitPrice: 0,
      photoName: null,
      productionType: "In House",
    }]);
    setDeliveryAddresses([{ id: "1", address: "", pinCode: "" }]);
    setDetailedAllocations([{ id: "1", deliveryAddress: "", itemId: "", color: "", size: "", quantity: 0 }]);

    setShowConfirmModal(false);
    router.push(`/stock-calculation?poNumber=${currentPoNumber}`);
  };

  const onSaveDraft = () => {
    // Check if empty
    const isEmpty = specs.every(s => !s.itemDescription?.trim() && !s.size?.trim() && (s.quantity || 0) === 0);
    if (isEmpty) {
      alert("The form is empty. Cannot save as draft.");
      setShowConfirmModal(false);
      return;
    }

    // Check if duplicate
    const isDuplicate = savedDrafts.some(draft => {
      if (draft.specs.length !== specs.length) return false;
      return draft.specs.every((ds, i) =>
        ds.itemDescription === specs[i].itemDescription &&
        ds.size === specs[i].size &&
        ds.quantity === specs[i].quantity &&
        ds.pattern === specs[i].pattern
      );
    });

    if (isDuplicate) {
      alert("This is already saved as a draft. Cannot save again.");
      setShowConfirmModal(false);
      return;
    }

    const totalQty = specs.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const newDraft: DraftOrder = {
      id: generateId(),
      poNumber: `DRAFT-${Math.floor(1000 + Math.random() * 9000)}`,
      dateSaved: new Date().toLocaleString(),
      totalQuantity: totalQty,
      specs: [...specs],
      deliveryAddresses: [...deliveryAddresses],
      detailedAllocations: [...detailedAllocations],
    };

    setSavedDrafts((prev) => [...prev, newDraft]);

    // Clear forms after saving
    setSpecs([{
      id: generateId(),
      category: "",
      gender: "",
      itemDescription: "",
      hsnCode: "",
      size: "",
      color: "",
      pattern: "",
      quantity: 0,
      stockAvailable: 0,
      unitPrice: 0,
      photoName: null,
      productionType: "In House",
    }]);
    setDeliveryAddresses([{ id: generateId(), address: "", pinCode: "" }]);
    setDetailedAllocations([{ id: generateId(), deliveryAddress: "", itemId: "", color: "", size: "", quantity: 0 }]);

    alert("Order saved to drafts successfully.");
    setShowConfirmModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-6 mt-6">
      <WorkflowIndicator currentStep="Order Specifications" />

      {/* HEADER MARGIN & PREVIEW TOGGLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            Order Specifications Matrix
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Input, manage, and configure the material specifications for line items.
          </p>
        </div>
        {isLiveOrder ? (
          <div className="flex bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-lg border border-blue-100 dark:border-blue-800/50 shadow-sm">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Selected Delivery Format: {deliveryType === "single" ? "Single Delivery Address" : "Multi Delivery Address"}
            </span>
          </div>
        ) : (
          <div className="flex bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg border border-neutral-200 dark:border-slate-700 shadow-inner overflow-hidden">
            <button
              type="button"
              onClick={() => setDeliveryType("single")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${deliveryType === "single" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-neutral-200 dark:border-slate-700" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"}`}
            >
              Preview Format: Single Delivery
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("multi")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${deliveryType === "multi" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-neutral-200 dark:border-slate-700" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"}`}
            >
              Preview Format: Multi Delivery
            </button>
          </div>
        )}
      </div>

      {/* GARMENT LINE SPECIFICATIONS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            Garment Line Specifications
          </h2>
          <button
            type="button"
            onClick={addRow}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-100 transition font-medium"
          >
            <Plus className="h-4 w-4" /> Add Row
          </button>
        </div>

        <div className="p-6 bg-neutral-50/50 dark:bg-slate-800/30">
          <div className="space-y-8">
            {specs.map((spec, index) => (
              <div key={spec.id} className="relative bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm mt-4">
                <div className="absolute -top-3 left-6 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 shadow-sm">
                  Item #{index + 1}
                </div>
                {specs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(spec.id)}
                    className="absolute -top-3 right-6 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-200 dark:border-red-800 shadow-sm hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}

                <div className="flex flex-col gap-6 mt-2">

                  {/* Row 1: Primary Selects, Size & Color */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Select Category</label>
                      <select
                        value={spec.category || ""}
                        onChange={(e) => updateRow(spec.id, "category", e.target.value)}
                        className={`${INPUT_STYLE} h-[44px] shadow-sm`}
                      >
                        <option value="">Select...</option>
                        <option value="Shirts">Shirts</option>
                        <option value="T-Shirts">T-Shirts</option>
                        <option value="Pants">Pants</option>
                        <option value="Blazer">Blazer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Gender</label>
                      <select
                        value={spec.gender || ""}
                        onChange={(e) => updateRow(spec.id, "gender", e.target.value)}
                        className={`${INPUT_STYLE} h-[44px] shadow-sm`}
                      >
                        <option value="">Select...</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Size (Multi-Select)</label>
                      <CustomMultiSelect
                        options={SIZE_OPTIONS}
                        selectedValues={spec.size ? spec.size.split(',').map(s => s.trim()).filter(Boolean) : []}
                        onChange={(values) => updateRow(spec.id, "size", values.join(', '))}
                        placeholder="Select Sizes"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Color (Multi-Select)</label>
                      <CustomMultiSelect
                        options={COLOR_OPTIONS}
                        selectedValues={spec.color ? spec.color.split(',').map(c => c.trim()).filter(Boolean) : []}
                        onChange={(values) => updateRow(spec.id, "color", values.join(', '))}
                        placeholder="Select Colors"
                        isColorMode
                        allowCustomAdd
                      />
                    </div>
                  </div>

                  {/* Row 2: Symmetrical Small Metrics & Action Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">HSN Code</label>
                      <input
                        type="text"
                        value={spec.hsnCode || ""}
                        onChange={(e) => updateRow(spec.id, "hsnCode", e.target.value)}
                        className={`${INPUT_STYLE} h-[44px] shadow-sm`}
                        placeholder="e.g. 6205"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Quantity</label>
                      <input
                        type="number"
                        value={spec.quantity || ""}
                        onChange={(e) => updateRow(spec.id, "quantity", Number(e.target.value))}
                        className={`${INPUT_STYLE} h-[44px] shadow-sm`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Unit Price</label>
                      <input
                        type="number"
                        value={spec.unitPrice || ""}
                        onChange={(e) => updateRow(spec.id, "unitPrice", Number(e.target.value))}
                        className={`${INPUT_STYLE} h-[44px] shadow-sm`}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Action</label>
                      <select
                        value={spec.productionType || "In House"}
                        onChange={(e) => updateRow(spec.id, "productionType", e.target.value)}
                        className={`w-full ${INPUT_STYLE} h-[44px] text-sm shadow-sm`}
                      >
                        <option value="In House">In House</option>
                        <option value="Outsource">Outsource</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Large Textareas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Item Description</label>
                      <textarea
                        value={spec.itemDescription}
                        onChange={(e) => updateRow(spec.id, "itemDescription", e.target.value)}
                        className={`${INPUT_STYLE} min-h-[96px] resize-y py-3 shadow-sm`}
                        placeholder="e.g. Cotton Polo"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Pattern</label>
                      <textarea
                        value={spec.pattern || ""}
                        onChange={(e) => updateRow(spec.id, "pattern", e.target.value)}
                        className={`${INPUT_STYLE} min-h-[96px] resize-y py-3 shadow-sm`}
                        placeholder="e.g. Solid, Striped, Checked"
                      />
                    </div>
                  </div>

                  {/* Row 4: Grand Upload Photo Box */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Upload Photo</label>
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-[120px] border-2 border-dashed border-blue-400/80 dark:border-blue-600/80 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition shadow-sm group">
                      <div className="bg-blue-100 dark:bg-blue-900/60 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold truncate max-w-[90%] px-2">
                        {spec.photoName ? spec.photoName : "Drag & drop or click to select photo"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => updateRow(spec.id, "photoName", e.target.files?.[0]?.name || "")}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOkClick(spec)}
                      className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-sm transition-colors text-sm tracking-wider uppercase"
                    >
                      Ok
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAIL SPEC ALLOCATIONS */}
      <div id="multi-delivery-allocations" className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 dark:bg-slate-800/30 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            Detailed Specifications & Allocation
          </h2>
          <div className="flex items-center gap-3">
            {deliveryType === "multi" && (
              <>
                <select
                  onChange={(e) => {
                    const tmpl = savedTemplates.find((t) => t.id === e.target.value);
                    if (tmpl) {
                      const targetId = activeDropdownRow || detailedAllocations[detailedAllocations.length - 1]?.id;
                      if (targetId) {
                        updateAllocationRow(targetId, "deliveryAddress", `${tmpl.address}${tmpl.pinCode ? ` - PIN: ${tmpl.pinCode}` : ""}`);
                      } else {
                        alert("Please add a row or click on an address box first.");
                      }
                    }
                    e.target.value = "";
                  }}
                  className="px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-700 cursor-pointer shadow-sm transition-colors"
                  defaultValue=""
                >
                  <option value="" disabled>Saved Addresses...</option>
                  {savedTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <button
                  onClick={addAllocationRow}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Row
                </button>
              </>
            )}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-neutral-50 dark:bg-slate-800">
              <tr className="text-xs uppercase text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider">
                <th className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700 w-16">#</th>
                <th className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700 w-1/3">Address</th>
                <th className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700">Item</th>
                <th className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700 w-32">Size</th>
                <th className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700 w-32">Color</th>
                <th className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700 w-48">Quantity</th>
                <th className="px-4 py-4 border-b border-neutral-200 dark:border-slate-700 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-700">
              {detailedAllocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    Add a row above to configure detailed specifications.
                  </td>
                </tr>
              ) : (
                detailedAllocations.map((alloc, index) => {
                  const targetItem = alloc.itemId ? specs.find((s) => s.id === alloc.itemId) : null;
                  const targetQty = targetItem?.quantity || 0;
                  const allocatedQty = alloc.itemId ? calculateAllocatedQty(alloc.itemId) : 0;
                  const remainingQty = targetQty - allocatedQty;
                  const isExceeding = alloc.itemId && remainingQty < 0;
                  const isExact = alloc.itemId && remainingQty === 0;

                  return (
                    <tr key={alloc.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors align-top">
                      <td className="px-6 py-5 font-medium text-neutral-900 dark:text-neutral-100">
                        {index + 1}.
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="relative">
                          <textarea
                            rows={2}
                            value={deliveryType === "single" ? (singleAddress + (singlePin ? ` - PIN: ${singlePin}` : "")) : alloc.deliveryAddress}
                            onChange={(e) => updateAllocationRow(alloc.id, "deliveryAddress", e.target.value)}
                            onFocus={() => setActiveDropdownRow(alloc.id)}
                            readOnly={deliveryType === "single"}
                            placeholder="Delivery Location & PIN"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none text-sm ${deliveryType === "single"
                              ? "bg-neutral-100 dark:bg-slate-800 border-transparent text-neutral-600 dark:text-neutral-400 cursor-not-allowed"
                              : "bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100"
                              }`}
                          />
                          {deliveryType === "multi" && alloc.deliveryAddress.trim() !== "" && (
                            <button
                              type="button"
                              onClick={() => {
                                const isDuplicate = savedTemplates.some(t => alloc.deliveryAddress.includes(t.address));
                                if (!isDuplicate) {
                                  const newTemplate: AddressTemplate = {
                                    id: generateId(),
                                    label: `Saved Address (${new Date().toLocaleTimeString()})`,
                                    address: alloc.deliveryAddress,
                                    pinCode: ""
                                  };
                                  setSavedTemplates(prev => [...prev, newTemplate]);
                                  alert("Address saved to profile book!");
                                } else {
                                  alert("Address is already in your profile book.");
                                }
                              }}
                              className="mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors block"
                              title="Save for Later"
                            >
                              [💾 Save Address]
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <select
                            value={alloc.itemId}
                            onChange={(e) => updateAllocationRow(alloc.id, "itemId", e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-shadow pr-10 text-sm bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100"
                          >
                            <option value="">Select Item</option>
                            {specs.filter((s) => s.itemDescription.trim()).map((s) => (
                              <option key={s.id} value={s.id}>{s.itemDescription}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <select
                            value={alloc.size}
                            onChange={(e) => updateAllocationRow(alloc.id, "size", e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-shadow pr-10 text-sm font-semibold bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-600 text-blue-600 dark:text-blue-400"
                          >
                            <option value="">Select Size</option>
                            {alloc.itemId && specs.find((s) => s.id === alloc.itemId)?.size
                              ? specs.find((s) => s.id === alloc.itemId)!.size.split(",").map((sz, i) => (
                                <option key={i} value={sz.trim()}>
                                  {sz.trim()}
                                </option>
                              ))
                              : null}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <select
                            value={alloc.color || ""}
                            onChange={(e) => updateAllocationRow(alloc.id, "color", e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-shadow pr-10 text-sm font-semibold bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-600 text-blue-600 dark:text-blue-400"
                          >
                            <option value="">Select Color</option>
                            {alloc.itemId && specs.find((s) => s.id === alloc.itemId)?.color
                              ? specs.find((s) => s.id === alloc.itemId)!.color.split(",").map((c, i) => (
                                <option key={i} value={c.trim()}>
                                  {c.trim()}
                                </option>
                              ))
                              : null}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          value={alloc.quantity || ""}
                          onChange={(e) => updateAllocationRow(alloc.id, "quantity", Number(e.target.value))}
                          placeholder="0"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 transition-shadow ${isExceeding ? "border-red-500 ring-1 ring-red-500" : isExact ? "border-green-500 ring-1 ring-green-500" : "border-neutral-300 dark:border-slate-600"}`}
                        />
                        {alloc.itemId && targetItem && (
                          <div className="mt-1">
                            <p className={`text-xs font-medium ${isExceeding ? "text-red-500" : isExact ? "text-green-600 dark:text-green-500" : "text-neutral-500 dark:text-neutral-400"}`}>
                              {isExceeding
                                ? `Target: ${targetQty} (Exceeded by ${Math.abs(remainingQty)} units)`
                                : isExact
                                  ? `Target: ${targetQty} (0 Remaining) ✓`
                                  : `Target: ${targetQty} (${remainingQty} Remaining)`}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {deliveryType === "multi" && (
                          <button
                            type="button"
                            onClick={() => removeAllocationRow(alloc.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mx-auto block"
                            title="Delete Allocation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* FOOTER WIDGET BUTTONS */}
      <div className="w-full flex justify-between items-center mt-6 border-t border-neutral-200 dark:border-slate-700 pt-6">
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="px-5 py-2.5 border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition shadow-sm"
        >
          ← Back to Order Initiation
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowDraftsDrawer(true)}
            disabled={savedDrafts.length === 0}
            className="px-5 py-2.5 border border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            View Saved Drafts {savedDrafts.length > 0 && `(${savedDrafts.length})`}
          </button>
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={hasExceedingItems}
            className={`px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition shadow-sm ${hasExceedingItems ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleSaveAndAdvance}
            disabled={hasExceedingItems}
            className={`px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm ${hasExceedingItems ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Proceed to Stock Check →
          </button>
        </div>
      </div>

      {/* SUBMIT CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Confirm Submission
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm">
                Are you sure you want to submit this order specification? You can also save it as a draft to continue later.
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveDraft}
                  className="px-4 py-2 bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-slate-700 transition"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmitSpecifications}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER SECTION SHEET */}
      {showDraftsDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-neutral-200 dark:border-slate-700 transform transition-transform">
          <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/50">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Saved Drafts
            </h3>
            <button
              type="button"
              onClick={() => setShowDraftsDrawer(false)}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {savedDrafts.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center mt-10">No saved drafts found.</p>
            ) : (
              savedDrafts.map((draft) => (
                <div key={draft.id} className="border border-neutral-200 dark:border-slate-700 rounded-lg p-4 bg-neutral-50 dark:bg-slate-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{draft.poNumber}</h4>
                      <p className="text-xs text-neutral-500 mt-1">{draft.dateSaved}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-1 rounded font-medium">
                      {draft.totalQuantity} Items
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSpecs(draft.specs);
                      setDeliveryAddresses(draft.deliveryAddresses);
                      setDetailedAllocations(draft.detailedAllocations || [{ id: "1", deliveryAddress: "", itemId: "", color: "", size: "", quantity: 0 }]);
                      setShowDraftsDrawer(false);
                      alert(`Draft ${draft.poNumber} loaded successfully!`);
                    }}
                    className="w-full mt-3 px-3 py-2 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-600 rounded-md text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition"
                  >
                    Load Draft
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GarmentSpecsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Loading Order Specifications...
        </div>
      }
    >
      <GarmentSpecsContent />
    </Suspense>
  );
}