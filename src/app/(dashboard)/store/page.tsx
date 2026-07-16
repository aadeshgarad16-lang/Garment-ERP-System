"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Store,
  Layers,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  List,
  ChevronLeft,
} from "lucide-react";

import { getAuthHeaders } from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

// --- Utility Functions ---
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(Number(amount) || 0);
};

export const calculateTotalPrice = (availableQty: number | string, blockedQty: number | string, unitPrice: number | string): number => {
  const avail = Number(availableQty) || 0;
  // Per user requirements, do not add blockedQty to Total Price formula
  const price = Number(unitPrice) || 0;
  return avail * price;
};
// -------------------------

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

import { useSearchParams } from "next/navigation";

// ==========================================
// MAIN DASHBOARD PAGE
// ==========================================
export default function StorePage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'raw';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [editRequest, setEditRequest] = useState<{ type: string, item: any } | null>(null);

  // Sync tab state if the URL parameter changes directly
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (tab === 'raw' || tab === 'pre' || tab === 'list')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="max-w-full mx-auto space-y-4 sm:space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="h-6 w-6 text-indigo-600" />
            {activeTab === 'raw' ? 'Raw Material' : activeTab === 'pre' ? 'Pre-Stitched' : 'Material List'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage inventory and stock availability
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors border ${activeTab === "raw"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-card text-neutral-700 dark:text-neutral-300 border-border hover:bg-muted"
              }`}
          >
            Raw Material
          </button>

          <button
            onClick={() => setActiveTab("pre")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors border ${activeTab === "pre"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-card text-neutral-700 dark:text-neutral-300 border-border hover:bg-muted"
              }`}
          >
            Pre-Stitched
          </button>

          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors border ${activeTab === "list"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-card text-neutral-700 dark:text-neutral-300 border-border hover:bg-muted"
              }`}
          >
            Material List
          </button>
        </div>
      </div>

      {/* Dynamic Module Rendering */}
      {activeTab === "raw" && <RawMaterialModule editRequest={editRequest?.type === 'Material' ? editRequest.item : null} onEditConsumed={() => setEditRequest(null)} />}
      {activeTab === "pre" && <PreStitchedModule editRequest={editRequest?.type === 'Garment' ? editRequest.item : null} onEditConsumed={() => setEditRequest(null)} />}
      {activeTab === "list" && <MaterialListModule onEdit={(type, item) => {
        setEditRequest({ type, item });
        setActiveTab(type === 'Material' ? 'raw' : 'pre');
      }} />}
    </div>
  );
}

// ==========================================
// RAW MATERIAL MODULE
// ==========================================
function RawMaterialModule({ editRequest, onEditConsumed }: { editRequest?: any, onEditConsumed?: () => void }) {
  const [selectedCard, setSelectedCard] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    hsnCode: "all",
    materialName: "all",
    quantityRange: "all",
  });
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [activeDescriptionId, setActiveDescriptionId] = useState<number | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('material_name');
  const [sortOrder, setSortOrder] = useState('ASC');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [metrics, setMetrics] = useState({ total: 0, available: 0, low_stock: 0, out_of_stock: 0 });
  const [filterOptions, setFilterOptions] = useState({ categories: [], hsn_codes: [], material_names: [] });
  const [loading, setLoading] = useState(true);
  const [uiError, setUiError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScrollOrResize = () => {
      setActiveDescriptionId(null);
      setPopoverPosition(null);
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".description-cell") || target.closest(".description-popover")) {
        return;
      }
      setActiveDescriptionId(null);
      setPopoverPosition(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch metrics & dropdown dynamic filtering criteria from DB configuration endpoints
  const fetchDashboardMeta = useCallback(() => {
    fetch(`${BACKEND_URL}/store_materials/dashboard`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(setMetrics)
      .catch(console.error);
    fetch(`${BACKEND_URL}/store_materials/filters`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(setFilterOptions)
      .catch(console.error);
  }, []);

  const fetchMaterials = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: debouncedSearchTerm,
      hsnCode: filters.hsnCode,
      materialName: filters.materialName,
      quantityRange: filters.quantityRange,
      status: statusFilter !== "all" ? statusFilter : selectedCard,
      sortBy,
      sortOrder
    });

    fetch(`${BACKEND_URL}/store_materials/view?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        const mappedData = Array.isArray(data.data) ? data.data.map((item: any) => ({
          ...item,
          hsnCode: item.hsn_code !== undefined ? item.hsn_code : (item.hsnCode || ""),
          materialName: item.material_name !== undefined ? item.material_name : (item.materialName || ""),
          availableQty: item.available_qty !== undefined ? item.available_qty : (item.availableQty || 0),
          blockedQty: item.blocked_qty !== undefined ? item.blocked_qty : (item.blockedQty || 0),
          unitPrice: item.unit_price !== undefined ? item.unit_price : (item.unitPrice || 0),
          minimumRequired: item.min_required !== undefined ? item.min_required : (item.minimumRequired || 0),
          totalPrice: item.total_price !== undefined ? item.total_price : (item.totalPrice || 0),
        })) : [];
        setMaterials(mappedData);
        setTotalRecords(data.totalRecords || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch materials:", err);
        setMaterials([]);
        setLoading(false);
        setUiError("Unable to connect to the server. Working in offline mode.");
      });
  }, [page, limit, debouncedSearchTerm, statusFilter, selectedCard, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchDashboardMeta();
  }, [fetchDashboardMeta]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);



  useEffect(() => {
    const handleUpdate = () => {
      fetchDashboardMeta();
      fetchMaterials();
    };
    window.addEventListener("orders-updated", handleUpdate);
    window.addEventListener("inventory-updated", handleUpdate);
    return () => {
      window.removeEventListener("orders-updated", handleUpdate);
      window.removeEventListener("inventory-updated", handleUpdate);
    };
  }, [fetchDashboardMeta, fetchMaterials]);

  const [formData, setFormData] = useState({
    hsnCode: "",
    materialName: "",
    description: "",
    unit: "",
    rate: "",
    availableQty: "",
    blockedQty: "",
    unitPrice: "",
    minimumRequired: "",
    category: "Chemicals",
  });

  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const session = localStorage.getItem('sason_active_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUserRole(parsed.role || "");
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    if (editRequest && onEditConsumed) {
      setEditingId(editRequest.id || editRequest.material_id);
      setFormData({
        hsnCode: editRequest.hsn_code || "",
        materialName: editRequest.name || editRequest.material_name || "",
        description: editRequest.description || "",
        unit: editRequest.unit || "",
        rate: editRequest.unit_price ? editRequest.unit_price.toString() : "",
        availableQty: editRequest.available_qty ? editRequest.available_qty.toString() : "",
        blockedQty: editRequest.blocked_qty ? editRequest.blocked_qty.toString() : "",
        minimumRequired: editRequest.min_required ? editRequest.min_required.toString() : "",
        unitPrice: editRequest.unit_price ? editRequest.unit_price.toString() : "",
        category: editRequest.category || "Chemicals",
      });
      setShowModal(true);
      onEditConsumed();
    }
  }, [editRequest, onEditConsumed]);

  const getStatus = (item: any) => {
    const qty = Number(item.availableQty || 0);
    const min = Number(item.minimumRequired || 0);
    if (qty <= 0) return "out";
    if (qty <= min) return "low";
    return "available";
  };

  const handleSave = () => {
    if (
      !formData.hsnCode ||
      !formData.materialName ||
      !formData.description ||
      !formData.unit ||
      !formData.availableQty ||
      !formData.unitPrice ||
      !formData.minimumRequired
    ) {
      setUiError("Please fill all mandatory fields");
      return;
    }
    setUiError(null);
    const payload = {
      hsn_code: formData.hsnCode,
      material_name: formData.materialName,
      description: formData.description,
      unit: formData.unit,
      rate: Number(formData.rate || formData.unitPrice),
      available_qty: Number(formData.availableQty),
      blocked_qty: Number(formData.blockedQty || 0),
      unit_price: Number(formData.unitPrice),
      min_required: Number(formData.minimumRequired),
      category: formData.category || "Chemicals"
    };

    const targetUrl = editingId
      ? `${BACKEND_URL}/store_materials/edit/${editingId}`
      : `${BACKEND_URL}/store_materials/add`;

    fetch(targetUrl, {
      method: editingId ? 'PUT' : 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || "Failed to save material");
        }
        return res.json();
      })
      .then(() => {
        fetchMaterials();
        fetchDashboardMeta();
        setShowModal(false);
        setEditingId(null);
        setFormData({
          hsnCode: "",
          materialName: "",
          description: "",
          unit: "",
          rate: "",
          availableQty: "",
          blockedQty: "",
          unitPrice: "",
          minimumRequired: "",
          category: "Chemicals",
        });
      })
      .catch(err => {
        console.error(err);
        setUiError("Unable to connect to the server. Working in offline mode.");
      });
  };

  return (
    <div className="space-y-6">
      {uiError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{uiError}</span>
        </div>
      )}
      {/* Cards driven completely live by API Metrics variable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          onClick={() => { setSelectedCard("all"); setStatusFilter("all"); }}
          className={`cursor-pointer bg-white dark:bg-[#11131e] rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "all"
            ? "border-blue-400 dark:border-blue-500/50"
            : "border-border hover:border-blue-300 dark:border-blue-500/30 dark:hover:border-blue-500/50"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/80">
            <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Total Materials
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {metrics.total}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {metrics.total === 1 ? "Material" : "Materials"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setSelectedCard("available"); setStatusFilter("available"); }}
          className={`cursor-pointer bg-white dark:bg-[#0e1713] rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "available"
            ? "border-emerald-400 dark:border-emerald-500/50"
            : "border-border hover:border-emerald-300 dark:border-emerald-500/30 dark:hover:border-emerald-500/50"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/80">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Available
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {metrics.available}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {metrics.available === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setSelectedCard("low"); setStatusFilter("low"); }}
          className={`cursor-pointer bg-card rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "low"
            ? "border-amber-400 dark:border-amber-700"
            : "border-border hover:border-amber-300 dark:hover:border-amber-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/40">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Low Stock
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-foreground">
                {metrics.low_stock}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {metrics.low_stock === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setSelectedCard("out"); setStatusFilter("out"); }}
          className={`cursor-pointer bg-card rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "out"
            ? "border-red-400 dark:border-red-700"
            : "border-border hover:border-red-300 dark:hover:border-red-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-900/40">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-foreground">
                {metrics.out_of_stock}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {metrics.out_of_stock === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search raw materials..."
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-full text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200"
            />
          </div>

          {/* Filters Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-full text-neutral-700 dark:text-neutral-300 bg-card text-sm font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <Filter className="h-4 w-4 text-neutral-400" />
              <span>Filters</span>
              {Object.values(filters).some((v) => v !== "all") && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-400 rounded-full">
                  {Object.values(filters).filter((v) => v !== "all").length}
                </span>
              )}
            </button>
            {showFiltersDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFiltersDropdown(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-card rounded-2xl shadow-xl border border-border p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        HSN Code
                      </label>
                      <select
                        value={filters.hsnCode}
                        onChange={(e) => setFilters({ ...filters, hsnCode: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="all">All HSN Codes</option>
                        {Array.isArray(filterOptions.hsn_codes) && filterOptions.hsn_codes.map((code) => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Material Name
                      </label>
                      <select
                        value={filters.materialName}
                        onChange={(e) => setFilters({ ...filters, materialName: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="all">All Material Names</option>
                        {Array.isArray(filterOptions.material_names) && filterOptions.material_names.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Available Quantity
                      </label>
                      <select
                        value={filters.quantityRange}
                        onChange={(e) => setFilters({ ...filters, quantityRange: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="all">All Quantities</option>
                        <option value="high">High (&gt; 100)</option>
                        <option value="medium">Medium (50 - 100)</option>
                        <option value="low">Low (&lt; 50)</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-700">
                      <button
                        onClick={() => setFilters({ hsnCode: "all", materialName: "all", quantityRange: "all" })}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => { fetchMaterials(); setShowFiltersDropdown(false); }}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-xs transition-colors shadow-sm"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* All Status Dropdown */}
          <div className="relative min-w-[160px]">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="w-full flex items-center justify-between gap-2 px-5 py-2.5 border border-border rounded-full text-foreground bg-card text-sm font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-400" />
                <span>
                  {statusFilter === "all" && "All Status"}
                  {statusFilter === "available" && "In Stock"}
                  {statusFilter === "low" && "Low Stock"}
                  {statusFilter === "out" && "Out of Stock"}
                  {statusFilter === "pending" && "Pending Approval"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200" />
            </button>
            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute left-0 mt-2 w-full min-w-[180px] bg-card rounded-2xl shadow-xl border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {[
                    { value: "all", label: "All Status" },
                    { value: "available", label: "In Stock" },
                    { value: "low", label: "Low Stock" },
                    { value: "out", label: "Out of Stock" },
                    { value: "pending", label: "Pending Approval" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setStatusFilter(item.value);
                        setSelectedCard(item.value);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${statusFilter === item.value
                        ? "text-violet-600 dark:text-violet-400 font-semibold bg-violet-50/50 dark:bg-violet-950/20"
                        : "text-neutral-700 dark:text-neutral-300"
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Add Material Button */}
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                hsnCode: "",
                materialName: "",
                description: "",
                unit: "",
                rate: "",
                availableQty: "",
                blockedQty: "",
                unitPrice: "",
                minimumRequired: "",
                category: "Chemicals",
              });
              setShowModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-all duration-200 hover:shadow-lg active:scale-95 shadow-sm"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Add Material
          </button>
        </div>
      </div>

      {/* Table Structure mapping real dynamic list */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium align-middle">
                <th className="px-4 py-3.5 text-left">HSN Code</th>
                <th className="px-4 py-3.5 text-left">Material Name</th>
                <th className="px-4 py-3.5 text-left">Description</th>
                <th className="px-4 py-3.5 text-left">Unit</th>
                <th className="px-4 py-3.5 text-left">Available Qty</th>
                <th className="px-4 py-3.5 text-left">Blocked Qty</th>
                <th className="px-4 py-3.5 text-left">Unit Price</th>
                <th className="px-4 py-3.5 text-left">Total Price</th>
                <th className="px-4 py-3.5 text-left">Minimum Required</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-neutral-500">
                    Loading materials from live server...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-neutral-500">
                    No materials found in the database matching selected query filters.
                  </td>
                </tr>
              ) : (
                materials.map((item) => {
                  const totalPrice = calculateTotalPrice(item.availableQty, item.blockedQty, item.unitPrice);
                  const status = getStatus(item);
                  return (
                    <tr
                      key={item.id || item.material_id || Math.random()}
                      className="hover:bg-muted/60 transition-colors align-middle"
                    >
                      <td className="px-4 py-4 font-bold text-foreground text-left align-middle">
                        {item.hsnCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground text-left align-middle">
                        {item.materialName}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground relative description-cell text-left align-middle">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const isCurrentlyActive = activeDescriptionId === item.id;
                            if (isCurrentlyActive) {
                              setActiveDescriptionId(null);
                              setPopoverPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveDescriptionId(item.id);
                              setPopoverPosition({
                                top: rect.bottom,
                                left: rect.left + (rect.width - 240) / 2,
                              });
                            }
                          }}
                          className="cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors truncate max-w-[180px] block underline decoration-dotted underline-offset-4 decoration-neutral-400 hover:decoration-neutral-600 dark:decoration-slate-600 dark:hover:decoration-slate-400 text-left"
                          title="Click to view full description"
                        >
                          {item.description}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {item.unit || "Nos"}
                      </td>
                      <td className="px-4 py-4 text-left align-middle">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-sm font-bold text-foreground">
                            {item.availableQty}
                          </span>
                          {status === "available" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-semibold">
                              Available
                            </span>
                          )}
                          {status === "low" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] uppercase tracking-wider font-semibold">
                              Low Stock
                            </span>
                          )}
                          {status === "out" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] uppercase tracking-wider font-semibold">
                              Out Of Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {item.blockedQty || 0}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-primary text-left align-middle">
                        {formatCurrency(totalPrice)}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {item.minimumRequired}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingId(item.id || item.material_id);
                              setFormData({
                                hsnCode: item.hsnCode || "",
                                materialName: item.materialName || "",
                                description: item.description || "",
                                unit: item.unit || "",
                                rate: item.rate ? item.rate.toString() : (item.unitPrice ? item.unitPrice.toString() : ""),
                                availableQty: item.availableQty ? item.availableQty.toString() : "",
                                blockedQty: item.blockedQty ? item.blockedQty.toString() : "",
                                minimumRequired: item.minimumRequired ? item.minimumRequired.toString() : "",
                                unitPrice: item.unitPrice ? item.unitPrice.toString() : "",
                                category: item.category || "Chemicals",
                              });
                              setShowModal(true);
                            }}
                            className="p-1.5 bg-transparent text-amber-600 dark:text-amber-500 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Do you want to delete this database entry?")) {
                                fetch(`${BACKEND_URL}/store_materials/delete/${item.id || item.material_id}`, {
                                  method: 'PUT',
                                  headers: getAuthHeaders(true)
                                })
                                  .then(() => { fetchMaterials(); fetchDashboardMeta(); })
                                  .catch(err => console.error(err));
                              }
                            }}
                            className="p-1.5 bg-transparent text-red-600 dark:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Setup */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card p-6 rounded-xl w-full max-w-2xl shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-foreground">
                {editingId ? "Edit Material" : "Add Material"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  HSN Code <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="HSN Code"
                  value={formData.hsnCode}
                  onChange={(e) =>
                    setFormData({ ...formData, hsnCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Material Name <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Material Name"
                  value={formData.materialName}
                  onChange={(e) =>
                    setFormData({ ...formData, materialName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Chemicals">Chemicals</option>
                  <option value="Metals">Metals</option>
                  <option value="Plastics">Plastics</option>
                  <option value="Packaging">Packaging</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Unit</option>
                  <option value="Nos">Nos</option>
                  <option value="Kg">Kg</option>
                  <option value="Mtrs">Mtrs</option>
                  <option value="Roll">Roll</option>
                  <option value="Box">Box</option>
                  <option value="Pair">Pair</option>
                  <option value="Set">Set</option>
                  <option value="Ltr">Ltr</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Available Qty <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Quantity"
                  type="number"
                  value={formData.availableQty}
                  onChange={(e) =>
                    setFormData({ ...formData, availableQty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Blocked Qty
                </label>
                <input
                  placeholder="Blocked Quantity"
                  type="number"
                  value={formData.blockedQty}
                  onChange={(e) =>
                    setFormData({ ...formData, blockedQty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Unit Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Unit Price"
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Min Required <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Minimum Required"
                  type="number"
                  value={formData.minimumRequired}
                  disabled={editingId !== null && userRole !== 'Super Admin'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimumRequired: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none ${editingId !== null && userRole !== 'Super Admin' ? 'opacity-50 cursor-not-allowed bg-muted' : ''}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-border rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-muted text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm transition-colors shadow-sm"
              >
                Save Material
              </button>
            </div>
          </div>
        </div>
      )}
      {mounted && activeDescriptionId && popoverPosition && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: `${popoverPosition.top + 8}px`,
            left: `${popoverPosition.left}px`,
          }}
          className="description-popover w-[240px] bg-card rounded-xl shadow-xl border border-border p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left normal-case whitespace-normal"
        >
          <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
            Full Description
          </div>
          <p className="text-xs text-card-foreground leading-relaxed font-normal">
            {materials.find((m) => m.id === activeDescriptionId)?.description}
          </p>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-l border-t border-border rotate-45 translate-y-1"></div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ==========================================
// PRE-STITCHED MODULE
// ==========================================
function PreStitchedModule({ editRequest, onEditConsumed }: { editRequest?: any, onEditConsumed?: () => void }) {
  const [selectedCard, setSelectedCard] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<any>(null);
  const [columnFilters, setColumnFilters] = useState({
    category: "all",
    gender: "all",
    size: "all",
    colour: "all",
  });
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const [garments, setGarments] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('sku_no');
  const [sortOrder, setSortOrder] = useState('ASC');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [metrics, setMetrics] = useState({ total: 0, available: 0, low_stock: 0, out_of_stock: 0 });
  const [filterOptions, setFilterOptions] = useState({ categories: [], genders: [], sizes: [], colours: [] });
  const [loading, setLoading] = useState(true);
  const [uiError, setUiError] = useState<string | null>(null);

  const fetchDashboardMeta = useCallback(() => {
    fetch(`${BACKEND_URL}/store_garments/dashboard`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(setMetrics)
      .catch(console.error);
    fetch(`${BACKEND_URL}/store_garments/filters`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(setFilterOptions)
      .catch(console.error);
  }, []);

  const fetchGarments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: debouncedSearchTerm,
      category: columnFilters.category,
      gender: columnFilters.gender,
      size: columnFilters.size,
      colour: columnFilters.colour,
      status: statusFilter !== "all" ? statusFilter : selectedCard,
      sortBy,
      sortOrder
    });

    fetch(`${BACKEND_URL}/store_garments/view?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        const mappedData = Array.isArray(data.data) ? data.data.map((item: any) => ({
          ...item,
          skuNo: item.sku_no !== undefined ? item.sku_no : (item.skuNo || ""),
          hsnCode: item.hsn_code !== undefined ? item.hsn_code : (item.hsnCode || ""),
          imageUrl: item.image_url !== undefined ? item.image_url : (item.imageUrl || ""),
          availableQty: item.available_qty !== undefined ? item.available_qty : (item.availableQty || 0),
          blockedQty: item.blocked_qty !== undefined ? item.blocked_qty : (item.blockedQty || 0),
          unitPrice: item.unit_price !== undefined ? item.unit_price : (item.unitPrice || 0),
          minimumRequired: item.min_required !== undefined ? item.min_required : (item.minimumRequired || 0),
          totalPrice: item.total_price !== undefined ? item.total_price : (item.totalPrice || 0),
        })) : [];
        setGarments(mappedData);
        setTotalRecords(data.totalRecords || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch garments:", err);
        setGarments([]);
        setLoading(false);
        setUiError("Unable to connect to the server. Working in offline mode.");
      });
  }, [page, limit, debouncedSearchTerm, statusFilter, selectedCard, columnFilters, sortBy, sortOrder]);

  useEffect(() => {
    fetchDashboardMeta();
  }, [fetchDashboardMeta]);

  useEffect(() => {
    fetchGarments();
  }, [fetchGarments]);

  // Recalculate metrics based on actual array volume


  useEffect(() => {
    const handleUpdate = () => {
      fetchDashboardMeta();
      fetchGarments();
    };
    window.addEventListener("orders-updated", handleUpdate);
    window.addEventListener("inventory-updated", handleUpdate);
    return () => {
      window.removeEventListener("orders-updated", handleUpdate);
      window.removeEventListener("inventory-updated", handleUpdate);
    };
  }, [fetchDashboardMeta, fetchGarments]);

  const [formData, setFormData] = useState({
    skuNo: "",
    hsnCode: "",
    description: "",
    pattern: "",
    category: "Shirt",
    gender: "Male",
    size: "M",
    colour: "",
    availableQty: "",
    blockedQty: "",
    minimumRequired: "",
    unitPrice: "",
    image: "",
  });

  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const session = localStorage.getItem('sason_active_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUserRole(parsed.role || "");
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    if (editRequest && onEditConsumed) {
      setEditingId(editRequest.id || editRequest.garment_id);
      setFormData({
        skuNo: editRequest.name || editRequest.sku_no || "",
        hsnCode: editRequest.hsn_code || "",
        description: editRequest.description || "",
        pattern: editRequest.pattern || "",
        category: editRequest.category || "Shirt",
        gender: editRequest.gender || "Male",
        size: editRequest.size || "M",
        colour: editRequest.color || editRequest.colour || "",
        availableQty: editRequest.available_qty ? editRequest.available_qty.toString() : "",
        blockedQty: editRequest.blocked_qty ? editRequest.blocked_qty.toString() : "",
        minimumRequired: editRequest.min_required ? editRequest.min_required.toString() : "",
        unitPrice: editRequest.unit_price ? editRequest.unit_price.toString() : "",
        image: editRequest.image_url || "",
      });
      setShowModal(true);
      onEditConsumed();
    }
  }, [editRequest, onEditConsumed]);

  const getStatus = (item: any) => {
    const qty = Number(item.availableQty || 0);
    const min = Number(item.minimumRequired || 0);
    if (qty <= 0) return "out";
    if (qty <= min) return "low";
    return "available";
  };

  const handleSave = () => {
    if (
      !formData.skuNo ||
      !formData.hsnCode ||
      !formData.description ||
      !formData.pattern ||
      !formData.category ||
      !formData.gender ||
      !formData.size ||
      !formData.colour ||
      !formData.availableQty ||
      !formData.unitPrice ||
      !formData.minimumRequired
    ) {
      setUiError("Please fill all mandatory fields");
      return;
    }
    setUiError(null);
    const payload = {
      skuNo: formData.skuNo,
      hsnCode: formData.hsnCode,
      description: formData.description,
      pattern: formData.pattern,
      category: formData.category,
      gender: formData.gender,
      size: formData.size,
      colour: formData.colour,
      availableQty: Number(formData.availableQty),
      blockedQty: Number(formData.blockedQty || 0),
      minimumRequired: Number(formData.minimumRequired),
      unitPrice: Number(formData.unitPrice),
      image: formData.image,
    };

    const targetUrl = editingId
      ? `${BACKEND_URL}/store_garments/edit/${editingId}`
      : `${BACKEND_URL}/store_garments/add`;

    fetch(targetUrl, {
      method: editingId ? 'PUT' : 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || "Failed to save garment");
        }
        return res.json();
      })
      .then(() => {
        fetchGarments();
        fetchDashboardMeta();
        setShowModal(false);
        setEditingId(null);
      })
      .catch(err => {
        console.error(err);
        setUiError("Unable to connect to the server. Working in offline mode.");
      });
  };

  return (
    <div className="space-y-6">
      {uiError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{uiError}</span>
        </div>
      )}
      {/* Dynamic DB Status Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          onClick={() => { setSelectedCard("all"); setStatusFilter("all"); }}
          className={`cursor-pointer bg-white dark:bg-[#11131e] rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "all"
            ? "border-indigo-400 dark:border-indigo-500/50"
            : "border-border hover:border-indigo-300 dark:border-indigo-500/30 dark:hover:border-indigo-500/50"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/80">
            <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Total Garments
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {metrics.total}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {metrics.total === 1 ? "Garment" : "Garments"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setSelectedCard("available"); setStatusFilter("available"); }}
          className={`cursor-pointer bg-white dark:bg-[#0e1713] rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "available"
            ? "border-emerald-400 dark:border-emerald-500/50"
            : "border-border hover:border-emerald-300 dark:border-emerald-500/30 dark:hover:border-emerald-500/50"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/80">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Available
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {metrics.available}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {metrics.available === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setSelectedCard("low"); setStatusFilter("low"); }}
          className={`cursor-pointer bg-white dark:bg-[#1a1510] rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "low"
            ? "border-amber-400 dark:border-amber-500/50"
            : "border-border hover:border-amber-300 dark:border-amber-500/30 dark:hover:border-amber-500/50"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/80">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Low Stock
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {metrics.low_stock}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {metrics.low_stock === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => { setSelectedCard("out"); setStatusFilter("out"); }}
          className={`cursor-pointer bg-white dark:bg-[#1d1112] rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "out"
            ? "border-red-400 dark:border-red-500/50"
            : "border-border hover:border-red-300 dark:border-red-500/30 dark:hover:border-red-500/50"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-900/80">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Out of Stock
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {metrics.out_of_stock}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {metrics.out_of_stock === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Search Line */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search garments..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filters Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-neutral-700 dark:text-neutral-300 bg-card text-sm font-medium hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Filter className="h-4 w-4 text-neutral-400" />
              <span>Filters</span>
              {Object.values(columnFilters).some((v) => v !== "all") && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400 rounded-full">
                  {Object.values(columnFilters).filter((v) => v !== "all").length}
                </span>
              )}
            </button>
            {showFiltersDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFiltersDropdown(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-card rounded-xl shadow-xl border border-border p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Category
                      </label>
                      <select
                        value={columnFilters.category}
                        onChange={(e) => setColumnFilters({ ...columnFilters, category: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Categories</option>
                        {Array.isArray(filterOptions.categories) && filterOptions.categories.map((c) => (
                          <option key={String(c)} value={String(c)}>
                            {String(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Gender
                      </label>
                      <select
                        value={columnFilters.gender}
                        onChange={(e) => setColumnFilters({ ...columnFilters, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Genders</option>
                        {Array.isArray(filterOptions.genders) && filterOptions.genders.map((c) => (
                          <option key={String(c)} value={String(c)}>
                            {String(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Size
                      </label>
                      <select
                        value={columnFilters.size}
                        onChange={(e) => setColumnFilters({ ...columnFilters, size: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Sizes</option>
                        {Array.isArray(filterOptions.sizes) && filterOptions.sizes.map((c) => (
                          <option key={String(c)} value={String(c)}>
                            {String(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Colour
                      </label>
                      <select
                        value={columnFilters.colour}
                        onChange={(e) => setColumnFilters({ ...columnFilters, colour: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Colours</option>
                        {Array.isArray(filterOptions.colours) && filterOptions.colours.map((c) => (
                          <option key={String(c)} value={String(c)}>
                            {String(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-700">
                      <button
                        onClick={() => setColumnFilters({ category: "all", gender: "all", size: "all", colour: "all" })}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => { fetchGarments(); setShowFiltersDropdown(false); }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-xs transition-colors shadow-sm"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* All Status Dropdown */}
          <div className="relative min-w-[150px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSelectedCard(e.target.value); }}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="low">Low Stock</option>
              <option value="out">Out Of Stock</option>
            </select>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                skuNo: "",
                hsnCode: "",
                description: "",
                pattern: "",
                category: "Shirt",
                gender: "Male",
                size: "M",
                colour: "",
                availableQty: "",
                blockedQty: "",
                unitPrice: "",
                minimumRequired: "",
                image: "",
              });
              setShowModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Garment
          </button>
        </div>
      </div>

      {/* Table Interface View */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium align-middle">
                <th className="px-4 py-3.5 text-left">Category</th>
                <th className="px-4 py-3.5 text-left">Gender</th>
                <th className="px-4 py-3.5 text-left">Size</th>
                <th className="px-4 py-3.5 text-left">Colour</th>
                <th className="px-4 py-3.5 text-left">Available Qty</th>
                <th className="px-4 py-3.5 text-left">Blocked Qty</th>
                <th className="px-4 py-3.5 text-left">Unit Price</th>
                <th className="px-4 py-3.5 text-left">Available Value</th>
                <th className="px-4 py-3.5 text-left">Min Required</th>
                <th className="px-4 py-3.5 text-center">More</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-sm text-neutral-500">
                    Loading garments from live server...
                  </td>
                </tr>
              ) : garments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-sm text-neutral-500">
                    No garments found in the database.
                  </td>
                </tr>
              ) : (
                garments.map((item) => {
                  const totalPrice = calculateTotalPrice(item.availableQty, item.blockedQty, item.unitPrice);
                  const status = getStatus(item);
                  return (
                    <tr
                      key={item.id || item.garment_id || Math.random()}
                      className="hover:bg-muted/60 transition-colors align-middle"
                    >
                      <td className="px-4 py-4 text-sm text-foreground text-left align-middle">
                        {item.category}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {item.gender}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-foreground text-left align-middle">
                        {item.size}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {item.colour}
                      </td>
                      <td className="px-4 py-4 text-left align-middle">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-sm font-bold text-foreground">
                            {item.availableQty}
                          </span>
                          {status === "available" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-semibold">
                              Available
                            </span>
                          )}
                          {status === "low" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] uppercase tracking-wider font-semibold">
                              Low Stock
                            </span>
                          )}
                          {status === "out" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] uppercase tracking-wider font-semibold">
                              Out Of Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {item.blockedQty || 0}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-primary text-left align-middle">
                        {formatCurrency(totalPrice)}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground text-left align-middle">
                        {item.minimumRequired || item.min_required || 0}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setSelectedGarment(item);
                              setShowViewModal(true);
                            }}
                            className="p-1.5 bg-transparent text-blue-600 dark:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors inline-flex justify-center"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingId(item.id || item.garment_id);
                              setFormData({
                                skuNo: item.skuNo || "",
                                hsnCode: item.hsnCode || "",
                                description: item.description || "",
                                pattern: item.pattern || "",
                                category: item.category || "Shirt",
                                gender: item.gender || "Male",
                                size: item.size || "M",
                                colour: item.colour || "",
                                availableQty: item.availableQty ? item.availableQty.toString() : "",
                                blockedQty: item.blockedQty ? item.blockedQty.toString() : "",
                                minimumRequired: item.minimumRequired ? item.minimumRequired.toString() : (item.min_required ? item.min_required.toString() : ""),
                                unitPrice: item.unitPrice ? item.unitPrice.toString() : "",
                                image: item.image || "",
                              });
                              setShowModal(true);
                            }}
                            className="p-1.5 bg-transparent text-amber-600 dark:text-amber-500 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Do you want to delete this database entry?")) {
                                fetch(`${BACKEND_URL}/store_garments/delete/${item.id || item.garment_id}`, {
                                  method: 'PUT',
                                  headers: getAuthHeaders(true)
                                })
                                  .then(() => { fetchGarments(); fetchDashboardMeta(); })
                                  .catch(err => console.error(err));
                              }
                            }}
                            className="p-1.5 bg-transparent text-red-600 dark:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation/Edit Setup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-foreground">
                {editingId ? "Edit Garment" : "Add Garment"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  SKU No <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="SKU No"
                  value={formData.skuNo}
                  onChange={(e) =>
                    setFormData({ ...formData, skuNo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  HSN Code <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="HSN Code"
                  value={formData.hsnCode}
                  onChange={(e) =>
                    setFormData({ ...formData, hsnCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Pattern <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Pattern"
                  value={formData.pattern}
                  onChange={(e) =>
                    setFormData({ ...formData, pattern: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option>Shirt</option>
                  <option>Pant</option>
                  <option>T-Shirt</option>
                  <option>Blazer</option>
                  <option>Shorts</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Size <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option>XS</option>
                  <option>S</option>
                  <option>M</option>
                  <option>L</option>
                  <option>XL</option>
                  <option>XXL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Color <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.colour}
                  onChange={(e) =>
                    setFormData({ ...formData, colour: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Select Colour</option>
                  <option value="White">White</option>
                  <option value="Black">Black</option>
                  <option value="Navy Blue">Navy Blue</option>
                  <option value="Sky Blue">Sky Blue</option>
                  <option value="Grey">Grey</option>
                  <option value="Red">Red</option>
                  <option value="Green">Green</option>
                  <option value="Yellow">Yellow</option>
                  <option value="Brown">Brown</option>
                  <option value="Khaki">Khaki</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Available Qty <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Quantity"
                  type="number"
                  value={formData.availableQty}
                  onChange={(e) =>
                    setFormData({ ...formData, availableQty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Minimum Qty <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Quantity"
                  type="number"
                  min="0"
                  value={formData.minimumRequired}
                  disabled={editingId !== null && userRole !== 'Super Admin'}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumRequired: e.target.value })
                  }
                  className={`w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none ${editingId !== null && userRole !== 'Super Admin' ? 'opacity-50 cursor-not-allowed bg-muted' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Blocked Qty
                </label>
                <input
                  placeholder="Blocked Quantity"
                  type="number"
                  value={formData.blockedQty}
                  onChange={(e) =>
                    setFormData({ ...formData, blockedQty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Unit Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Unit Price"
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Image
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({
                          ...formData,
                          image: reader.result as string,
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full min-w-0 px-3 py-2 border border-border rounded-lg text-foreground bg-card text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {formData.image && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            image: "",
                          });
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-md flex items-center justify-center transition-colors"
                        title="Remove Image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-border rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-muted text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 text-sm transition-colors shadow-sm"
              >
                Save Garment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal Setup */}
      {showViewModal && selectedGarment && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-border">
            <div className="flex justify-between items-center mb-6 border-b border-neutral-100 dark:border-neutral-700 pb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Eye className="h-6 w-6 text-purple-600" />
                Garment Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-8">
              <div className="w-full sm:w-64 flex-shrink-0">
                {selectedGarment.image ? (
                  <img
                    src={selectedGarment.image}
                    alt={selectedGarment.description}
                    className="w-full aspect-[3/4] object-cover rounded-xl border border-border shadow-sm"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-muted border border-border rounded-xl flex items-center justify-center text-neutral-400 font-medium text-sm">
                    No Image Provided
                  </div>
                )}
              </div>

              <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-300 flex-1">
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      SKU No
                    </span>
                    <span className="text-base font-semibold text-foreground">
                      {selectedGarment.skuNo}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      HSN Code
                    </span>
                    <span className="text-base text-foreground font-medium">
                      {selectedGarment.hsnCode}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Description
                    </span>
                    <span className="text-base text-foreground font-medium">
                      {selectedGarment.description}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Pattern
                    </span>
                    <span className="text-base text-foreground font-medium">
                      {selectedGarment.pattern || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Min Required Qty
                    </span>
                    <span className="text-base text-foreground font-medium">
                      {selectedGarment.minimumRequired || selectedGarment.min_required || "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-700">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-muted text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MATERIAL LIST MODULE
// ==========================================
function MaterialListModule({ onEdit }: { onEdit: (type: string, item: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const session = localStorage.getItem('sason_active_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUserRole(parsed.role || "");
      } catch (e) { }
    }
  }, []);

  const fetchItems = useCallback(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/store_items/view?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setItems(data.data || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch items:", err);
        setItems([]);
        setLoading(false);
      });
  }, [page, limit, searchTerm]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <List className="h-5 w-5 text-indigo-500" />
          Unified Material List
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              <th className="px-4 py-3 font-medium rounded-tl-lg">Type</th>
              <th className="px-4 py-3 font-medium">Code/SKU</th>
              <th className="px-4 py-3 font-medium">Name/Desc</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Available</th>
              <th className="px-4 py-3 font-medium text-right">Min Required</th>
              <th className="px-4 py-3 font-medium text-right">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">No items found.</td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={`${item.type}-${item.id}-${index}`} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.type === 'Garment' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{item.hsn_code || item.name}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{item.name}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{item.category}</td>
                  <td className="px-4 py-3 text-right font-medium">{item.available_qty}</td>
                  <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">{item.min_required}</td>
                  <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">₹{item.unit_price}</td>
                  <td className="px-4 py-3 text-right">
                    {userRole === 'Super Admin' && (
                      <button
                        onClick={() => onEdit(item.type, item)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-700 pt-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-border rounded-lg hover:bg-neutral-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-border rounded-lg hover:bg-neutral-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}