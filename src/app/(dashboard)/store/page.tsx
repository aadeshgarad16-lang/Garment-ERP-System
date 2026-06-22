"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Store,
  Layers,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Box,
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";

// ==========================================
// MAIN DASHBOARD PAGE
// ==========================================
export default function StorePage() {
  const [activeTab, setActiveTab] = useState("raw");

  return (
    <div className="max-w-full mx-auto space-y-4 sm:space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Store className="h-6 w-6 text-indigo-600" />
            Store Dashboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Manage inventory and stock availability
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors border ${activeTab === "raw"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white dark:bg-slate-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800"
              }`}
          >
            Raw Material
          </button>

          <button
            onClick={() => setActiveTab("pre")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors border ${activeTab === "pre"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white dark:bg-slate-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800"
              }`}
          >
            Pre-Stitched
          </button>
        </div>
      </div>

      {/* Dynamic Module Rendering */}
      {activeTab === "raw" && <RawMaterialModule />}
      {activeTab === "pre" && <PreStitchedModule />}
    </div>
  );
}

// ==========================================
// RAW MATERIAL MODULE
// ==========================================
function RawMaterialModule() {
  const [selectedCard, setSelectedCard] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rawColumnFilters, setRawColumnFilters] = useState({
    hsnCode: "all",
    materialName: "all",
  });

  // Filters state
  const [filters, setFilters] = useState({
    category: "all",
    supplier: "all",
    dateRange: "all",
  });
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [activeDescriptionId, setActiveDescriptionId] = useState<number | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

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

  const [materials, setMaterials] = useState([
    {
      id: 1,
      hsnCode: "520811",
      materialName: "Cotton Fabric",
      description: "16*12 Drill Cotton Beige",
      unit: "Mtrs",
      rate: 120,
      availableQty: 500,
      blockedQty: 25,
      unitPrice: 120,
      minimumRequired: 200,
      category: "Plastics",
      dateCreated: "2026-06-18",
    },
    {
      id: 2,
      hsnCode: "520812",
      materialName: "Buttons",
      description: "White Plastic Button",
      unit: "Nos",
      rate: 2,
      availableQty: 80,
      blockedQty: 25,
      unitPrice: 2,
      minimumRequired: 100,
      category: "Metals",
      dateCreated: "2026-06-01",
    },
    {
      id: 3,
      hsnCode: "520813",
      materialName: "Labels",
      description: "Brand Label",
      unit: "Nos",
      rate: 5,
      availableQty: 0,
      blockedQty: 25,
      unitPrice: 5,
      minimumRequired: 50,
      category: "Packaging",
      dateCreated: "2026-05-20",
    },
  ]);

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

  const getStatus = (item: any) => {
    if (item.availableQty === 0) return "out";
    if (item.availableQty <= item.minimumRequired) return "low";
    return "available";
  };

  const filteredMaterials = materials.filter((item) => {
    const status = getStatus(item);
    const matchesSearch =
      item.hsnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = statusFilter === "all" || status === statusFilter;
    const matchesCard = selectedCard === "all" || status === selectedCard;
    const matchesHsn =
      rawColumnFilters.hsnCode === "all" ||
      item.hsnCode === rawColumnFilters.hsnCode;
    const matchesMaterial =
      rawColumnFilters.materialName === "all" ||
      item.materialName === rawColumnFilters.materialName;

    const matchesCategory =
      filters.category === "all" || item.hsnCode === filters.category;
    const matchesSupplier =
      filters.supplier === "all" || item.materialName === filters.supplier;

    let matchesDate = true;
    if (filters.dateRange !== "all") {
      if (filters.dateRange === "high") {
        matchesDate = item.availableQty > 100;
      } else if (filters.dateRange === "medium") {
        matchesDate = item.availableQty >= 50 && item.availableQty <= 100;
      } else if (filters.dateRange === "low") {
        matchesDate = item.availableQty < 50;
      }
    }

    return (
      matchesSearch &&
      matchesFilter &&
      matchesCard &&
      matchesHsn &&
      matchesMaterial &&
      matchesCategory &&
      matchesSupplier &&
      matchesDate
    );
  });

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
      alert("Please fill all mandatory fields");
      return;
    }
    const payload = {
      id: editingId ?? Date.now(),
      hsnCode: formData.hsnCode,
      materialName: formData.materialName,
      description: formData.description,
      unit: formData.unit,
      rate: Number(formData.rate || formData.unitPrice),
      availableQty: Number(formData.availableQty),
      blockedQty: Number(formData.blockedQty || 0),
      unitPrice: Number(formData.unitPrice),
      minimumRequired: Number(formData.minimumRequired),
      category: formData.category || "Chemicals",
      dateCreated: editingId
        ? (materials.find((m) => m.id === editingId) as any)?.dateCreated ||
        "2026-06-22"
        : "2026-06-22",
    };

    if (editingId) {
      setMaterials(materials.map((m) => (m.id === editingId ? payload : m)));
    } else {
      setMaterials([...materials, payload]);
    }

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
  };

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          onClick={() => setSelectedCard("all")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "all"
            ? "border-blue-400 dark:border-blue-700"
            : "border-neutral-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/40">
            <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Total Materials
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {materials.length}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {materials.length === 1 ? "Material" : "Materials"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedCard("available")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "available"
            ? "border-emerald-400 dark:border-emerald-700"
            : "border-neutral-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Available
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {materials.filter((m) => getStatus(m) === "available").length}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {materials.filter((m) => getStatus(m) === "available")
                  .length === 1
                  ? "Item"
                  : "Items"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedCard("low")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "low"
            ? "border-amber-400 dark:border-amber-700"
            : "border-neutral-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/40">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Low Stock
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {materials.filter((m) => getStatus(m) === "low").length}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {materials.filter((m) => getStatus(m) === "low").length === 1
                  ? "Item"
                  : "Items"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedCard("out")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "out"
            ? "border-red-400 dark:border-red-700"
            : "border-neutral-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-900/40">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Out of Stock
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {materials.filter((m) => getStatus(m) === "out").length}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {materials.filter((m) => getStatus(m) === "out").length === 1
                  ? "Item"
                  : "Items"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search raw materials..."
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-slate-700 rounded-full text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200"
            />
          </div>

          {/* Filters Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 dark:border-slate-700 rounded-full text-neutral-700 dark:text-neutral-300 bg-white dark:bg-slate-900 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
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
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-slate-700 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        HSN Code
                      </label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-slate-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="all">All HSN Codes</option>
                        <option value="520811">520811 (Cotton Fabric)</option>
                        <option value="520812">520812 (Buttons)</option>
                        <option value="520813">520813 (Labels)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        Material Name
                      </label>
                      <select
                        value={filters.supplier}
                        onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-slate-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="all">All Materials</option>
                        <option value="Cotton Fabric">Cotton Fabric</option>
                        <option value="Buttons">Buttons</option>
                        <option value="Labels">Labels</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        Available Quantity
                      </label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-slate-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="all">All Quantities</option>
                        <option value="high">High (&gt; 100)</option>
                        <option value="medium">Medium (50 - 100)</option>
                        <option value="low">Low (&lt; 50)</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-slate-800">
                      <button
                        onClick={() => setFilters({ category: "all", supplier: "all", dateRange: "all" })}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowFiltersDropdown(false)}
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
              className="w-full flex items-center justify-between gap-2 px-5 py-2.5 border border-neutral-200 dark:border-slate-700 rounded-full text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
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
                <div className="absolute left-0 mt-2 w-full min-w-[180px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-slate-800 ${statusFilter === item.value
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

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium align-middle">
                <th className="px-5 py-3.5 text-right">HSN Code</th>
                <th className="px-5 py-3.5 text-right">Material Name</th>
                <th className="px-5 py-3.5 text-right">Description</th>
                <th className="px-5 py-3.5 text-right">Unit</th>
                <th className="px-5 py-3.5 text-right">Available Qty</th>
                <th className="px-5 py-3.5 text-right">Blocked Qty</th>
                <th className="px-5 py-3.5 text-right">Unit Price</th>
                <th className="px-5 py-3.5 text-right">Total Price</th>
                <th className="px-5 py-3.5 text-right">Minimum Required</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMaterials.map((item) => {
                const totalPrice = item.availableQty * item.unitPrice;
                const status = getStatus(item);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/60 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-foreground text-right">
                      {item.hsnCode}
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground text-right">
                      {item.materialName}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground relative description-cell text-right">
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
                        className="cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors truncate max-w-[180px] block underline decoration-dotted underline-offset-4 decoration-neutral-400 hover:decoration-neutral-600 dark:decoration-slate-600 dark:hover:decoration-slate-400 text-right ml-auto"
                        title="Click to view full description"
                      >
                        {item.description}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground text-right">
                      {item.unit || "Nos"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
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
                    <td className="px-5 py-4 text-sm text-muted-foreground text-right">
                      {item.blockedQty || 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground text-right">
                      ₹{item.unitPrice}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-primary text-right">
                      ₹{totalPrice.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground text-right">
                      {item.minimumRequired}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setFormData({
                              hsnCode: item.hsnCode,
                              materialName: item.materialName,
                              description: item.description,
                              unit: item.unit,
                              rate: item.rate
                                ? item.rate.toString()
                                : item.unitPrice.toString(),
                              availableQty: item.availableQty.toString(),
                              blockedQty: item.blockedQty?.toString() || "",
                              unitPrice: item.unitPrice.toString(),
                              minimumRequired: item.minimumRequired.toString(),
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
                          onClick={() =>
                            setMaterials(
                              materials.filter((m) => m.id !== item.id),
                            )
                          }
                          className="p-1.5 bg-transparent text-red-600 dark:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Setup */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-2xl shadow-2xl border border-neutral-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimumRequired: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-slate-800 text-sm transition-colors"
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
          className="description-popover w-[240px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-neutral-200 dark:border-slate-700 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left normal-case whitespace-normal"
        >
          <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
            Full Description
          </div>
          <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal">
            {materials.find((m) => m.id === activeDescriptionId)?.description}
          </p>
          {/* Small tail arrow pointing to cell */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-slate-900 border-l border-t border-neutral-200 dark:border-slate-700 rotate-45 translate-y-1"></div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ==========================================
// PRE-STITCHED MODULE
// ==========================================
function PreStitchedModule() {
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

  const [garments, setGarments] = useState([
    {
      id: 1,
      skuNo: "PG-001",
      hsnCode: "620520",
      description: "School Shirt",
      pattern: "Half Sleeve",
      category: "Shirt",
      gender: "Male",
      size: "M",
      colour: "White",
      availableQty: 120,
      blockedQty: 15,
      unitPrice: 350,
      image: "",
    },
    {
      id: 2,
      skuNo: "PG-002",
      hsnCode: "620530",
      description: "Corporate Shirt",
      pattern: "Full Sleeve",
      category: "Shirt",
      gender: "Male",
      size: "L",
      colour: "Blue",
      availableQty: 20,
      blockedQty: 10,
      unitPrice: 450,
      image: "",
    },
    {
      id: 3,
      skuNo: "PG-003",
      hsnCode: "620540",
      description: "School Pant",
      pattern: "Regular Fit",
      category: "Pant",
      gender: "Female",
      size: "S",
      colour: "Navy",
      availableQty: 0,
      blockedQty: 10,
      unitPrice: 550,
      image: "",
    },
  ]);

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
    unitPrice: "",
    image: "",
  });

  const getStatus = (item: any) => {
    if (item.availableQty === 0) return "out";
    if (item.availableQty <= 50) return "low";
    return "available";
  };

  const filteredGarments = garments.filter((item) => {
    const status = getStatus(item);
    const matchesSearch =
      item.skuNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hsnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.colour.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = statusFilter === "all" || status === statusFilter;
    const matchesCard = selectedCard === "all" || status === selectedCard;

    const matchesCategory =
      columnFilters.category === "all" ||
      item.category === columnFilters.category;
    const matchesGender =
      columnFilters.gender === "all" || item.gender === columnFilters.gender;
    const matchesSize =
      columnFilters.size === "all" || item.size === columnFilters.size;
    const matchesColour =
      columnFilters.colour === "all" || item.colour === columnFilters.colour;

    return (
      matchesSearch &&
      matchesFilter &&
      matchesCard &&
      matchesCategory &&
      matchesGender &&
      matchesSize &&
      matchesColour
    );
  });

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
      (!formData.image && !editingId)
    ) {
      alert("Please fill all mandatory fields");
      return;
    }
    const payload = {
      id: editingId ?? Date.now(),
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
      unitPrice: Number(formData.unitPrice),
      image: formData.image,
    };

    if (editingId) {
      setGarments(garments.map((g) => (g.id === editingId ? payload : g)));
    } else {
      setGarments([...garments, payload]);
    }

    setShowModal(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Cards Setup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          onClick={() => setSelectedCard("all")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "all"
            ? "border-indigo-400 dark:border-indigo-700"
            : "border-neutral-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/40">
            <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Total Garments
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {garments.length}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {garments.length === 1 ? "Garment" : "Garments"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedCard("available")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "available"
            ? "border-emerald-400 dark:border-emerald-700"
            : "border-neutral-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Available
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {garments.filter((g) => getStatus(g) === "available").length}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {garments.filter((g) => getStatus(g) === "available").length ===
                  1
                  ? "Item"
                  : "Items"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedCard("low")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "low"
            ? "border-amber-400 dark:border-amber-700"
            : "border-neutral-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/40">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Low Stock
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {garments.filter((g) => getStatus(g) === "low").length}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {garments.filter((g) => getStatus(g) === "low").length === 1
                  ? "Item"
                  : "Items"}
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedCard("out")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md h-full ${selectedCard === "out"
            ? "border-red-400 dark:border-red-700"
            : "border-neutral-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800"
            }`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100 dark:bg-red-900/40">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Out of Stock
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {garments.filter((g) => getStatus(g) === "out").length}
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                {garments.filter((g) => getStatus(g) === "out").length === 1
                  ? "Item"
                  : "Items"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Search Line */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search garments..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filters Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-700 dark:text-neutral-300 bg-white dark:bg-slate-900 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-neutral-200 dark:border-slate-700 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        Category
                      </label>
                      <select
                        value={columnFilters.category}
                        onChange={(e) => setColumnFilters({ ...columnFilters, category: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-slate-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Categories</option>
                        {Array.from(new Set(garments.map((g) => g.category))).map((c) => (
                          <option key={String(c)} value={String(c)}>
                            {String(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        Gender
                      </label>
                      <select
                        value={columnFilters.gender}
                        onChange={(e) => setColumnFilters({ ...columnFilters, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-slate-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Genders</option>
                        {Array.from(new Set(garments.map((g) => g.gender))).map((c) => (
                          <option key={String(c)} value={String(c)}>
                            {String(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        Size
                      </label>
                      <select
                        value={columnFilters.size}
                        onChange={(e) => setColumnFilters({ ...columnFilters, size: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-slate-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Sizes</option>
                        {Array.from(new Set(garments.map((g) => g.size))).map((c) => (
                          <option key={String(c)} value={String(c)}>
                            {String(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        Colour
                      </label>
                      <select
                        value={columnFilters.colour}
                        onChange={(e) => setColumnFilters({ ...columnFilters, colour: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-200 dark:border-slate-700 rounded-xl text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Colours</option>
                        {Array.from(new Set(garments.map((g) => g.colour))).map((c) => (
                          <option key={String(c)} value={String(c)}>
                            {String(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-slate-800">
                      <button
                        onClick={() => setColumnFilters({ category: "all", gender: "all", size: "all", colour: "all" })}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowFiltersDropdown(false)}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
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
                <th className="px-5 py-3.5 text-right">Category</th>
                <th className="pl-5 pr-2 py-3.5 text-right">Gender</th>
                <th className="pl-2 pr-6 py-3.5 text-right">Size</th>
                <th className="pl-6 pr-16 py-3.5 text-right">Colour</th>
                <th className="px-5 py-3.5 text-right">Available Qty</th>
                <th className="px-5 py-3.5 text-right">Blocked Qty</th>
                <th className="px-5 py-3.5 text-right">Unit Price</th>
                <th className="px-5 py-3.5 text-right">Total Price</th>
                <th className="px-5 py-3.5 text-right">More</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredGarments.map((item) => {
                const totalPrice = item.availableQty * item.unitPrice;
                const status = getStatus(item);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/60 transition-colors"
                  >
                    <td className="px-5 py-4 text-sm text-foreground text-right">
                      {item.category}
                    </td>
                    <td className="pl-5 pr-2 py-4 text-sm text-muted-foreground text-right">
                      {item.gender}
                    </td>
                    <td className="pl-2 pr-6 py-4 text-sm font-medium text-foreground text-right">
                      {item.size}
                    </td>
                    <td className="pl-6 pr-16 py-4 text-sm text-muted-foreground text-right">
                      {item.colour}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
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
                    <td className="px-5 py-4 text-sm text-muted-foreground text-right">
                      {item.blockedQty || 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground text-right">
                      ₹{item.unitPrice}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-primary text-right">
                      ₹{totalPrice.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end">
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
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setFormData({
                              skuNo: item.skuNo,
                              hsnCode: item.hsnCode,
                              description: item.description,
                              pattern: item.pattern,
                              category: item.category,
                              gender: item.gender,
                              size: item.size,
                              colour: item.colour,
                              availableQty: item.availableQty.toString(),
                              blockedQty: item.blockedQty?.toString() || "",
                              unitPrice: item.unitPrice.toString(),
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
                          onClick={() =>
                            setGarments(
                              garments.filter((g) => g.id !== item.id),
                            )
                          }
                          className="p-1.5 bg-transparent text-red-600 dark:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation/Edit Setup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Image
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
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
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {formData.image && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border border-neutral-200 dark:border-slate-700"
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

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-slate-800 text-sm transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-neutral-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6 border-b border-neutral-100 dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
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
                    className="w-full aspect-[3/4] object-cover rounded-xl border border-neutral-200 dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-neutral-100 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-neutral-400 font-medium text-sm">
                    No Image Provided
                  </div>
                )}
              </div>

              <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-300 flex-1">
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      SKU No
                    </span>
                    <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {selectedGarment.skuNo}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      HSN Code
                    </span>
                    <span className="text-base text-neutral-900 dark:text-neutral-100 font-medium">
                      {selectedGarment.hsnCode}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Description
                    </span>
                    <span className="text-base text-neutral-900 dark:text-neutral-100 font-medium">
                      {selectedGarment.description}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Pattern
                    </span>
                    <span className="text-base text-neutral-900 dark:text-neutral-100 font-medium">
                      {selectedGarment.pattern || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-4 border-t border-neutral-100 dark:border-slate-800">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-200 dark:hover:bg-slate-700 transition-colors"
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