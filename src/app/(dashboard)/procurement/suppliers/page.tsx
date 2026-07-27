"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Receipt, Search, FileDown, TrendingUp, AlertTriangle, Plus, X, CheckCircle2 } from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';

// Initial list of suppliers for the sidebar
const INITIAL_SUPPLIERS = [
  { id: "v1", name: "Apex Textiles Ltd" },
  { id: "v2", name: "Global Threads & Yarns" },
  { id: "v3", name: "Supreme Trims Co." },
  { id: "v4", name: "Vardhman Yarns" },
  { id: "v5", name: "Reliable Buttons & Zippers" }
];

interface SupplierHistoryData {
  generalInfo: {
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    gstId: string;
    paymentTerms: string;
  };
  history: {
    id: string;
    articleName: string;
    hsnCode: string;
    totalQty: number;
    unitPrice: number;
    returnedQty: number;
    returnReason: string | null;
    returnDate: string | null;
    netQty: number;
    netSpend: number;
  }[];
}

interface CreatableMultiSelectProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}

const CreatableMultiSelect: React.FC<CreatableMultiSelectProps> = ({ label, placeholder, values, onChange }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !values.includes(val)) {
        onChange([...values, val]);
      }
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(values.filter(v => v !== tagToRemove));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg bg-background focus-within:ring-2 focus-within:ring-indigo-500">
        {values.map(val => (
          <span key={val} className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-md text-xs font-medium">
            {val}
            <button type="button" onClick={() => removeTag(val)} className="text-indigo-500 hover:text-indigo-800 focus:outline-none">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">Press Enter or comma to add a tag.</p>
    </div>
  );
};

export default function SupplierHistoryPage() {
  const router = useRouter();
  
  const [suppliersList, setSuppliersList] = useState(INITIAL_SUPPLIERS);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(INITIAL_SUPPLIERS[0].id);
  const [supplierData, setSupplierData] = useState<SupplierHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add Supplier Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    paymentTerms: "Net 30 Days"
  });

  const [rawMaterials, setRawMaterials] = useState<string[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<string[]>([]);

  const filteredSuppliers = suppliersList.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        rawMaterials,
        finishedGoods
      };
      
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (result.success) {
        const newSupplier = { id: result.data.id, name: result.data.name };
        setSuppliersList(prev => [...prev, newSupplier]);
        setSelectedSupplierId(newSupplier.id);
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          companyName: "", contactPerson: "", phone: "", email: "", address: "", gstin: "",
          paymentTerms: "Net 30 Days"
        });
        setRawMaterials([]);
        setFinishedGoods([]);
      }
    } catch (error) {
      console.error("Failed to add supplier", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchSupplierData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/suppliers/${selectedSupplierId}/history`);
        const result = await res.json();
        if (result.success) {
          setSupplierData(result.data);
        } else {
          setSupplierData(null);
        }
      } catch (error) {
        console.error("Failed to fetch supplier history", error);
        setSupplierData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplierData();
  }, [selectedSupplierId]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 font-sans pb-12 pt-4">
      <WorkflowIndicator currentStep="Procurement" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <button 
            onClick={() => router.push('/procurement')}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Procurement
          </button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Supplier Directory & Purchase History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your suppliers, view their general information, and track complete purchase and return histories.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar for Supplier Selection */}
        <div className="w-full lg:w-72 flex-shrink-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-border bg-muted/10">
            <h2 className="text-sm font-bold text-foreground mb-3">Suppliers Directory</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search suppliers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSuppliers.map(supplier => (
              <button
                key={supplier.id}
                onClick={() => setSelectedSupplierId(supplier.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedSupplierId === supplier.id 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' 
                    : 'text-foreground hover:bg-muted border border-transparent'
                }`}
              >
                {supplier.name}
              </button>
            ))}
            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No suppliers found.
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full space-y-6">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center bg-card border border-border rounded-xl shadow-sm">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-indigo-200 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </div>
            </div>
          ) : supplierData ? (
            <>
              {/* General Info Card */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Building2 className="w-48 h-48" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-6 relative z-10">{supplierData.generalInfo.businessName}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Person</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-xs">
                        {supplierData.generalInfo.contactPerson.charAt(0)}
                      </span>
                      {supplierData.generalInfo.contactPerson}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      {supplierData.generalInfo.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      {supplierData.generalInfo.phone}
                    </p>
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered Address</p>
                    <p className="text-sm font-medium text-foreground flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
                      {supplierData.generalInfo.address}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST / Tax ID</p>
                      <p className="text-sm font-mono font-medium text-foreground px-2 py-1 bg-muted rounded-md inline-block">
                        {supplierData.generalInfo.gstId}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Terms</p>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-500" />
                        {supplierData.generalInfo.paymentTerms}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase & Returns History Table */}
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Article Purchase & Returns History
                  </h3>
                  <button className="px-4 py-2 bg-background border border-border hover:bg-muted text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <FileDown className="w-4 h-4" />
                    Export Ledger
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        <th className="px-6 py-4">Article Details</th>
                        <th className="px-4 py-4 text-right">Total Purchased</th>
                        <th className="px-4 py-4 text-right">Unit / Total Price</th>
                        <th className="px-4 py-4">Returns / Defects</th>
                        <th className="px-6 py-4 text-right bg-indigo-50/50 dark:bg-indigo-900/10">Net Retained & Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {supplierData.history.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-foreground">{row.articleName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">ID: {row.id} • HSN: {row.hsnCode}</p>
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-foreground font-medium">
                            {row.totalQty.toLocaleString()} units
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="text-sm font-medium text-foreground">₹{(row.unitPrice * row.totalQty).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">@ ₹{row.unitPrice} / unit</p>
                          </td>
                          <td className="px-4 py-4">
                            {row.returnedQty > 0 ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-[11px] font-bold text-red-700 bg-red-100 border border-red-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  {row.returnedQty.toLocaleString()} Returned
                                </span>
                                <span className="text-xs text-muted-foreground italic truncate max-w-[150px]" title={row.returnReason || ""}>
                                  {row.returnReason} ({row.returnDate})
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No returns</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right bg-indigo-50/30 dark:bg-indigo-900/5">
                            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
                              {row.netQty.toLocaleString()} units
                            </p>
                            <p className="text-sm font-bold text-foreground mt-0.5">
                              ₹{row.netSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </td>
                        </tr>
                      ))}
                      {supplierData.history.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                            No purchase history found for this supplier.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center bg-card border border-border rounded-xl shadow-sm text-center p-6">
              <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-bold text-foreground">Failed to load supplier data</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2">
                We couldn't retrieve the information for the selected supplier. Please try again or select another supplier from the directory.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/10">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Add New Supplier
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="add-supplier-form" onSubmit={handleAddSupplier} className="space-y-8">
                
                {/* A. Basic Info */}
                <section>
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">A. Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Company / Supplier Name *</label>
                      <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Apex Textiles" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Contact Person</label>
                      <input type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500" placeholder="e.g. John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Phone / Mobile *</label>
                      <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500" placeholder="+91..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500" placeholder="contact@company.com" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Registered Address</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500" placeholder="123 Industrial Area..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">GSTIN / Tax ID</label>
                      <input type="text" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500" placeholder="27AA..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Payment Terms</label>
                      <select value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500">
                        <option value="Advance">Advance</option>
                        <option value="COD">COD (Cash on Delivery)</option>
                        <option value="Net 30 Days">Net 30 Days</option>
                        <option value="Net 60 Days">Net 60 Days</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* B. Capabilities */}
                <section>
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">B. Supply Capability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border border-border">
                    <div className="flex flex-col gap-4">
                      <CreatableMultiSelect
                        label="Raw Materials / Articles"
                        placeholder="Search or add custom articles..."
                        values={rawMaterials}
                        onChange={setRawMaterials}
                      />
                      <div className="space-y-2">
                        {['Fabric (Cotton, Polyester)', 'Allied Materials (Trims, Buttons)', 'Both Fabric & Allied'].map(cap => (
                          <label key={cap} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={rawMaterials.includes(cap)} 
                              onChange={() => {
                                setRawMaterials(prev => prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]);
                              }} 
                              className="rounded border-border text-indigo-600 focus:ring-indigo-500 bg-background" 
                            />
                            <span className="text-sm text-foreground">{cap}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <CreatableMultiSelect
                        label="Finished Goods"
                        placeholder="Search or add finished goods..."
                        values={finishedGoods}
                        onChange={setFinishedGoods}
                      />
                      <div className="space-y-2">
                        {['Shirt', 'Pant', 'T-Shirt', 'Jacket', 'Kurta', 'Salwar'].map(cap => (
                          <label key={cap} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={finishedGoods.includes(cap)} 
                              onChange={() => {
                                setFinishedGoods(prev => prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]);
                              }} 
                              className="rounded border-border text-indigo-600 focus:ring-indigo-500 bg-background" 
                            />
                            <span className="text-sm text-foreground">{cap}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                form="add-supplier-form"
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Supplier'}
                {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
