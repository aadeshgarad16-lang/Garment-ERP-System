"use client";

import { useState } from "react";
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
            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
            : "bg-white dark:bg-slate-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800"
            }`}
        >
          Pre-Stitched
        </button>
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
    const matchesHsn = rawColumnFilters.hsnCode === "all" || item.hsnCode === rawColumnFilters.hsnCode;
    const matchesMaterial = rawColumnFilters.materialName === "all" || item.materialName === rawColumnFilters.materialName;

    return matchesSearch && matchesFilter && matchesCard && matchesHsn && matchesMaterial;
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
    });
  };

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedCard("all")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 transition-colors ${selectedCard === "all"
            ? "border-blue-500 dark:border-blue-500 ring-1 ring-blue-500"
            : "border-neutral-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
            }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Total Materials
            </p>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {materials.length}
          </h2>
        </div>

        <div
          onClick={() => setSelectedCard("available")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 transition-colors ${selectedCard === "available"
            ? "border-emerald-500 dark:border-emerald-500 ring-1 ring-emerald-500"
            : "border-neutral-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700"
            }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Available
            </p>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {materials.filter((m) => getStatus(m) === "available").length}
          </h2>
        </div>

        <div
          onClick={() => setSelectedCard("low")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 transition-colors ${selectedCard === "low"
            ? "border-amber-500 dark:border-amber-500 ring-1 ring-amber-500"
            : "border-neutral-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700"
            }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Low Stock
            </p>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {materials.filter((m) => getStatus(m) === "low").length}
          </h2>
        </div>

        <div
          onClick={() => setSelectedCard("out")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 transition-colors ${selectedCard === "out"
            ? "border-red-500 dark:border-red-500 ring-1 ring-red-500"
            : "border-neutral-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700"
            }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Out Of Stock
            </p>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {materials.filter((m) => getStatus(m) === "out").length}
          </h2>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search raw materials..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative min-w-[150px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-lg text-neutral-900 dark:text-neutral-100 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
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
                hsnCode: "",
                materialName: "",
                description: "",
                unit: "",
                rate: "",
                availableQty: "",
                blockedQty: "",
                unitPrice: "",
                minimumRequired: "",
              });
              setShowModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
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
                <th className="px-2 py-3">
                  <div className="relative flex items-center justify-between min-w-[90px] xl:min-w-[100px] px-2 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-slate-700 dark:bg-slate-900 transition-colors">
                    <select
                      value={rawColumnFilters.hsnCode}
                      onChange={(e) => setRawColumnFilters({ ...rawColumnFilters, hsnCode: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      <option value="all">HSN Code</option>
                      {Array.from(new Set(materials.map(m => m.hsnCode))).map(c => (
                        <option key={String(c)} value={String(c)}>{String(c)}</option>
                      ))}
                    </select>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 normal-case">
                        HSN Code:
                      </span>
                      <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 normal-case leading-tight mt-0.5">
                        {rawColumnFilters.hsnCode === "all" ? "All" : rawColumnFilters.hsnCode}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </div>
                </th>
                <th className="px-2 py-3">
                  <div className="relative flex items-center justify-between min-w-[90px] xl:min-w-[100px] px-2 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-slate-700 dark:bg-slate-900 transition-colors">
                    <select
                      value={rawColumnFilters.materialName}
                      onChange={(e) => setRawColumnFilters({ ...rawColumnFilters, materialName: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      <option value="all">Material Name</option>
                      {Array.from(new Set(materials.map(m => m.materialName))).map(c => (
                        <option key={String(c)} value={String(c)}>{String(c)}</option>
                      ))}
                    </select>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 normal-case">
                        Material Name:
                      </span>
                      <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 normal-case leading-tight mt-0.5">
                        {rawColumnFilters.materialName === "all" ? "All" : rawColumnFilters.materialName}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </div>
                </th>
                <th className="px-2 py-3">Description</th>
                <th className="px-2 py-3">Unit</th>
                <th className="px-2 py-3">Available Qty</th>
                <th className="px-2 py-3">Blocked Qty</th>
                <th className="px-2 py-3">Unit Price</th>
                <th className="px-2 py-3">Total Price</th>
                <th className="px-2 py-3">Minimum Required</th>
                <th className="px-2 py-3 text-center">Action</th>
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
                    <td className="px-2 py-3 font-bold text-foreground">
                      {item.hsnCode}
                    </td>
                    <td className="px-2 py-3 text-sm text-foreground">
                      {item.materialName}
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground truncate max-w-[250px]">
                      {item.description}
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">
                      {item.unit || "Nos"}
                    </td>
                    <td className="px-2 py-3">
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
                    <td className="px-2 py-3 text-sm text-muted-foreground">
                      {item.blockedQty || 0}
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">
                      ₹{item.unitPrice}
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-primary">
                      ₹{totalPrice.toLocaleString()}
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">
                      {item.minimumRequired}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-center gap-1">
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

    const matchesCategory = columnFilters.category === "all" || item.category === columnFilters.category;
    const matchesGender = columnFilters.gender === "all" || item.gender === columnFilters.gender;
    const matchesSize = columnFilters.size === "all" || item.size === columnFilters.size;
    const matchesColour = columnFilters.colour === "all" || item.colour === columnFilters.colour;

    return matchesSearch && matchesFilter && matchesCard && matchesCategory && matchesGender && matchesSize && matchesColour;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedCard("all")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 transition-colors ${selectedCard === "all"
            ? "border-purple-500 dark:border-purple-500 ring-1 ring-purple-500"
            : "border-neutral-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700"
            }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Total Garments
            </p>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {garments.length}
          </h2>
        </div>

        <div
          onClick={() => setSelectedCard("available")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 transition-colors ${selectedCard === "available"
            ? "border-emerald-500 dark:border-emerald-500 ring-1 ring-emerald-500"
            : "border-neutral-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700"
            }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Available
            </p>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {garments.filter((g) => getStatus(g) === "available").length}
          </h2>
        </div>

        <div
          onClick={() => setSelectedCard("low")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 transition-colors ${selectedCard === "low"
            ? "border-amber-500 dark:border-amber-500 ring-1 ring-amber-500"
            : "border-neutral-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700"
            }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Low Stock
            </p>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {garments.filter((g) => getStatus(g) === "low").length}
          </h2>
        </div>

        <div
          onClick={() => setSelectedCard("out")}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 transition-colors ${selectedCard === "out"
            ? "border-red-500 dark:border-red-500 ring-1 ring-red-500"
            : "border-neutral-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700"
            }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Out Of Stock
            </p>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {garments.filter((g) => getStatus(g) === "out").length}
          </h2>
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
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
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
                <th className="px-2 py-3">
                  <div className="relative flex items-center justify-between min-w-[90px] xl:min-w-[100px] px-2 py-1.5 rounded-xl border border-purple-300 bg-purple-50/50 hover:bg-purple-100/50 dark:border-purple-800/50 dark:bg-purple-900/10 transition-colors">
                    <select
                      value={columnFilters.category}
                      onChange={(e) => setColumnFilters({ ...columnFilters, category: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      <option value="all">Category</option>
                      {Array.from(new Set(garments.map(g => g.category))).map(c => (
                        <option key={String(c)} value={String(c)}>{String(c)}</option>
                      ))}
                    </select>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 normal-case">
                        Category:
                      </span>
                      <span className="text-[13px] font-semibold text-purple-700 dark:text-purple-400 normal-case leading-tight mt-0.5">
                        {columnFilters.category === "all" ? "All" : columnFilters.category}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-purple-500" />
                  </div>
                </th>
                <th className="px-2 py-3">
                  <div className="relative flex items-center justify-between min-w-[90px] xl:min-w-[100px] px-2 py-1.5 rounded-xl border border-purple-300 bg-purple-50/50 hover:bg-purple-100/50 dark:border-purple-800/50 dark:bg-purple-900/10 transition-colors">
                    <select
                      value={columnFilters.gender}
                      onChange={(e) => setColumnFilters({ ...columnFilters, gender: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      <option value="all">Gender</option>
                      {Array.from(new Set(garments.map(g => g.gender))).map(c => (
                        <option key={String(c)} value={String(c)}>{String(c)}</option>
                      ))}
                    </select>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 normal-case">
                        Gender:
                      </span>
                      <span className="text-[13px] font-semibold text-purple-700 dark:text-purple-400 normal-case leading-tight mt-0.5">
                        {columnFilters.gender === "all" ? "All" : columnFilters.gender}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-purple-500" />
                  </div>
                </th>
                <th className="px-2 py-3">
                  <div className="relative flex items-center justify-between min-w-[90px] xl:min-w-[100px] px-2 py-1.5 rounded-xl border border-purple-300 bg-purple-50/50 hover:bg-purple-100/50 dark:border-purple-800/50 dark:bg-purple-900/10 transition-colors">
                    <select
                      value={columnFilters.size}
                      onChange={(e) => setColumnFilters({ ...columnFilters, size: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      <option value="all">Size</option>
                      {Array.from(new Set(garments.map(g => g.size))).map(c => (
                        <option key={String(c)} value={String(c)}>{String(c)}</option>
                      ))}
                    </select>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 normal-case">
                        Size:
                      </span>
                      <span className="text-[13px] font-semibold text-purple-700 dark:text-purple-400 normal-case leading-tight mt-0.5">
                        {columnFilters.size === "all" ? "All" : columnFilters.size}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-purple-500" />
                  </div>
                </th>
                <th className="px-2 py-3">
                  <div className="relative flex items-center justify-between min-w-[90px] xl:min-w-[100px] px-2 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 dark:border-slate-700 dark:bg-slate-900 transition-colors">
                    <select
                      value={columnFilters.colour}
                      onChange={(e) => setColumnFilters({ ...columnFilters, colour: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      <option value="all">Colour</option>
                      {Array.from(new Set(garments.map(g => g.colour))).map(c => (
                        <option key={String(c)} value={String(c)}>{String(c)}</option>
                      ))}
                    </select>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 normal-case">
                        Colour:
                      </span>
                      <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 normal-case leading-tight mt-0.5">
                        {columnFilters.colour === "all" ? "All" : columnFilters.colour}
                      </span>
                    </div>
                  </div>
                </th>
                <th className="px-2 py-3">Available Qty</th>
                <th className="px-2 py-3">Blocked Qty</th>
                <th className="px-2 py-3">Unit Price</th>
                <th className="px-2 py-3">Total Price</th>
                <th className="px-2 py-3 text-center">More</th>
                <th className="px-2 py-3 text-center">Action</th>
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
                    <td className="px-2 py-3 text-sm text-foreground">
                      {item.category}
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">
                      {item.gender}
                    </td>
                    <td className="px-2 py-3 text-sm font-medium text-foreground">
                      {item.size}
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">
                      {item.colour}
                    </td>
                    <td className="px-2 py-3">
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
                    <td className="px-2 py-3 text-sm text-muted-foreground">
                      {item.blockedQty || 0}
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">
                      ₹{item.unitPrice}
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-primary">
                      ₹{totalPrice.toLocaleString()}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedGarment(item);
                          setShowViewModal(true);
                        }}
                        className="p-1.5 bg-transparent text-blue-600 dark:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex justify-center gap-1">
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
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-neutral-200 dark:border-slate-700"
                    />
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
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      SKU No
                    </span>
                    <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {selectedGarment.skuNo}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Description
                    </span>
                    <span className="text-base">
                      {selectedGarment.description}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      HSN Code
                    </span>
                    <span>{selectedGarment.hsnCode}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Pattern
                    </span>
                    <span>{selectedGarment.pattern || "N/A"}</span>
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