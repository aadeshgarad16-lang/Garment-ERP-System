"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, FileText, CheckCircle2, Trash2, Download, X, ChevronDown, Building2, Calculator, Info, Package, List } from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Mock Data
const MOCK_EXISTING_POS = ['PO-2023-001', 'PO-2023-002', 'PO-2023-003', 'PO-2023-004'];
const MOCK_SUPPLIERS = ['Acme Corp', 'Global Textiles', 'Fast Delivery Logistics', 'Premium Threads Co.', 'Apex Manufacturers'];

export default function CreateProcurementPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'PO' | 'STORE'>('PO');

  // --- Form State ---
  const [existingPoNumber, setExistingPoNumber] = useState('');
  const [procurementPoNumber, setProcurementPoNumber] = useState(`PR-${Date.now().toString().slice(-6)}`);
  
  // Supplier State
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [supplierInput, setSupplierInput] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  
  // Metadata State
  const [branch, setBranch] = useState('Main Plant');
  const [transportMode, setTransportMode] = useState('Road Transport');
  
  // Specifications State (Dynamic Rows)
  const [specifications, setSpecifications] = useState([
    { id: '1', articleId: '', totalQty: 0, supplier: '', orderQty: 0 }
  ]);

  // Table State
  const [materials, setMaterials] = useState([
    { id: '1', name: 'Cotton Fabric 180 GSM', qty: 500, supplier: '', supplierQty: 500, unit: 'Meters', unitCost: 45 },
    { id: '2', name: 'Polyester Thread (White)', qty: 100, supplier: '', supplierQty: 100, unit: 'Cones', unitCost: 120 }
  ]);
  
  // Financial State
  const [paymentTerms, setPaymentTerms] = useState('Within 30 Days');
  const [gst, setGst] = useState<number>(18);
  const [igst, setIgst] = useState<number>(0);

  // Workflow State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      const payloadStr = localStorage.getItem('pending_po_payload');
      if (payloadStr) {
        const payload = JSON.parse(payloadStr);
        if (payload.isBulkOrder) {
          const uniqueSuppliers = Array.from(new Set<string>(payload.items.map((i: any) => i.selectedSupplierName)));
          setSuppliers(prev => {
            const newSuppliers = [...prev];
            uniqueSuppliers.forEach(uv => {
              if (uv && !newSuppliers.includes(uv)) newSuppliers.push(uv);
            });
            return newSuppliers;
          });
          
          if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
            setMaterials(payload.items.map((item: any, index: number) => ({
              id: item.articleId || `bulk-${Date.now()}-${index}`,
              name: item.articleName || '',
              qty: item.requiredQty || 1,
              supplier: item.selectedSupplierName || '',
              supplierQty: item.requiredQty || 1,
              unit: 'Pieces',
              unitCost: item.unitPrice || 0
            })));
          }
        } else {
          if (payload.supplierName) {
            setSuppliers(prev => prev.includes(payload.supplierName) ? prev : [...prev, payload.supplierName]);
          }
          if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
            setMaterials(payload.items.map((item: any, index: number) => ({
              id: item.articleId || `${Date.now()}-${index}`,
              name: item.articleName || '',
              qty: item.requiredQty || 1,
              supplier: payload.supplierName || '',
              supplierQty: item.requiredQty || 1,
              unit: 'Pieces',
              unitCost: item.unitPrice || 0
            })));
          }
        }
        localStorage.removeItem('pending_po_payload');
      }
    } catch (err) {
      console.error("Failed to parse pending PO payload:", err);
    }
  }, []);

  // Computed Financials
  const subtotal = materials.reduce((acc, item) => acc + ((Number(item.supplierQty) || 0) * (Number(item.unitCost) || 0)), 0);
  const gstAmount = (subtotal * (Number(gst) || 0)) / 100;
  const igstAmount = (subtotal * (Number(igst) || 0)) / 100;
  const grandTotal = subtotal + gstAmount + igstAmount;

  // Handlers
  const handleAddSupplier = (name: string) => {
    if (name.trim() && !suppliers.includes(name.trim())) {
      setSuppliers([...suppliers, name.trim()]);
    }
    setSupplierInput('');
    setShowSupplierDropdown(false);
  };

  const handleRemoveSupplier = (name: string) => {
    setSuppliers(suppliers.filter(v => v !== name));
  };

  const handleMaterialChange = (id: string, field: string, value: string) => {
    let finalValue: string | number = value;
    if (['qty', 'supplierQty', 'unitCost'].includes(field)) {
      finalValue = value === '' ? 0 : Number(value);
    }
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: finalValue } : m));
  };

  const handleAddArticle = () => {
    setMaterials([
      ...materials,
      {
        id: Date.now().toString(),
        name: '',
        qty: 1,
        supplier: '',
        supplierQty: 1,
        unit: 'Pieces',
        unitCost: 0
      }
    ]);
  };

  const handleRemoveArticle = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleAddSpecification = () => {
    setSpecifications([
      ...specifications,
      { id: Date.now().toString(), articleId: '', totalQty: 0, supplier: '', orderQty: 0 }
    ]);
  };

  const handleRemoveSpecification = (id: string) => {
    setSpecifications(specifications.filter(s => s.id !== id));
  };

  const handleSpecChange = (id: string, field: string, value: string) => {
    let finalValue: string | number = value;
    if (['totalQty', 'orderQty'].includes(field)) {
      finalValue = value === '' ? 0 : Number(value);
    }
    setSpecifications(specifications.map(s => s.id === id ? { ...s, [field]: finalValue } : s));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text('PURCHASE ORDER', 14, 22);
    
    // Metadata Left
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Procurement PO: ${procurementPoNumber}`, 14, 32);
    doc.text(`Linked Sales PO: ${existingPoNumber || 'N/A'}`, 14, 38);
    doc.text(`Branch: ${branch}`, 14, 44);
    doc.text(`Transport: ${transportMode}`, 14, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 56);
    
    // Metadata Right
    doc.text(`Suppliers:`, 120, 32);
    doc.setFont(undefined, 'normal');
    const supplierText = suppliers.length > 0 ? suppliers.join(', ') : 'None specified';
    const splitSuppliers = doc.splitTextToSize(supplierText, 70);
    doc.text(splitSuppliers, 120, 38);
    
    doc.text(`Payment Terms: ${paymentTerms}`, 120, 38 + (splitSuppliers.length * 5) + 5);

    // Table
    const tableData = materials.map((m, i) => [
      i + 1,
      m.name,
      m.qty.toString(),
      m.supplier || 'N/A',
      m.supplierQty.toString(),
      `${m.unitCost.toFixed(2)}`,
      `${(m.supplierQty * m.unitCost).toFixed(2)}`
    ]);

    const startY = 70 + (splitSuppliers.length > 2 ? (splitSuppliers.length - 2) * 5 : 0);

    (doc as any).autoTable({
      startY: startY,
      head: [['#', 'Article / Material', 'Req Qty', 'Supplier', 'Order Qty', 'Cost / Unit (Rs.)', 'Total (Rs.)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || startY;
    
    // Financials
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY + 10);
    doc.text(`Rs. ${subtotal.toFixed(2)}`, 185, finalY + 10, { align: 'right' });
    
    doc.text(`GST (${gst}%):`, 140, finalY + 16);
    doc.text(`Rs. ${gstAmount.toFixed(2)}`, 185, finalY + 16, { align: 'right' });
    
    let currentY = finalY + 22;
    if (igst > 0) {
      doc.text(`IGST (${igst}%):`, 140, currentY);
      doc.text(`Rs. ${igstAmount.toFixed(2)}`, 185, currentY, { align: 'right' });
      currentY += 6;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Grand Total:`, 140, currentY + 2);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, 185, currentY + 2, { align: 'right' });

    // Specs
    if (specifications.length > 0 && specifications.some(s => s.articleId)) {
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      let specY = currentY + 15;
      doc.text('Specifications Allocations:', 14, specY);
      specY += 6;
      
      specifications.forEach(s => {
        if (!s.articleId) return;
        const articleName = materials.find(m => m.id === s.articleId)?.name || 'Unknown Article';
        doc.text(`- ${articleName}: Total ${s.totalQty} -> Order ${s.orderQty} from ${s.supplier || 'N/A'}`, 14, specY);
        specY += 6;
      });
    }

    doc.save(`PO_${procurementPoNumber}.pdf`);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    setIsSuccess(true);
    // In a real app, send data to backend here.
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 font-sans pb-8 relative">
      <WorkflowIndicator currentStep="Procurement" />

      {/* Header Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/procurement')}
          className="p-2 bg-card border border-border text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted shadow-sm transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Plus className="h-6 w-6 text-indigo-600" />
            Create Purchase Order
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate and manage formal purchase orders for production and store inventory
          </p>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex p-1 bg-muted/50 rounded-lg w-fit border border-border shadow-sm">
        <button
          onClick={() => { setActiveTab('PO'); setIsSuccess(false); }}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'PO'
              ? 'bg-background text-foreground shadow shadow-black/5 dark:shadow-white/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>📦 PO Order</span>
        </button>
        <button
          onClick={() => { setActiveTab('STORE'); setIsSuccess(false); }}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'STORE'
              ? 'bg-background text-foreground shadow shadow-black/5 dark:shadow-white/5'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <span>🏬 Store PO</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isSuccess ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Purchase Order Created!</h2>
          <p className="text-emerald-600/80 dark:text-emerald-400/80 max-w-md">
            Purchase Order <span className="font-bold">{procurementPoNumber}</span> has been successfully generated and recorded in the system.
          </p>
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50 w-full justify-center">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Invoice PDF
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setProcurementPoNumber(`PR-${Date.now().toString().slice(-6)}`);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Create Another PO
            </button>
          </div>
        </div>
      ) : activeTab === 'PO' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* PO IDENTIFICATION & METADATA CARD */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
              <FileText className="w-5 h-5 text-indigo-500" />
              Order Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Existing PO Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Existing PO Number</label>
                <div className="relative">
                  <select 
                    value={existingPoNumber} 
                    onChange={e => setExistingPoNumber(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Select a PO...</option>
                    {MOCK_EXISTING_POS.map(po => (
                      <option key={po} value={po}>{po}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Procurement PO Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Procurement PO Number</label>
                <input 
                  type="text" 
                  value={procurementPoNumber}
                  onChange={e => setProcurementPoNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. PR-123456"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Multi-Select Supplier */}
              <div className="space-y-2 md:col-span-1" ref={supplierDropdownRef}>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Suppliers</label>
                <div className="relative">
                  <input
                    type="text"
                    value={supplierInput}
                    onChange={(e) => {
                      setSupplierInput(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && supplierInput.trim()) {
                        e.preventDefault();
                        handleAddSupplier(supplierInput);
                      }
                    }}
                    placeholder="Search or add supplier..."
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {showSupplierDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {MOCK_SUPPLIERS.filter(v => v.toLowerCase().includes(supplierInput.toLowerCase()) && !suppliers.includes(v)).map(supplier => (
                        <button
                          key={supplier}
                          type="button"
                          onClick={() => handleAddSupplier(supplier)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-foreground transition-colors"
                        >
                          {supplier}
                        </button>
                      ))}
                      {supplierInput.trim() && !MOCK_SUPPLIERS.some(v => v.toLowerCase() === supplierInput.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => handleAddSupplier(supplierInput)}
                          className="w-full text-left px-3 py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 transition-colors border-t border-border"
                        >
                          Add "{supplierInput}" as new supplier
                        </button>
                      )}
                      {MOCK_SUPPLIERS.filter(v => v.toLowerCase().includes(supplierInput.toLowerCase()) && !suppliers.includes(v)).length === 0 && !supplierInput.trim() && (
                        <div className="px-3 py-2 text-sm text-muted-foreground italic">No more suppliers found</div>
                      )}
                    </div>
                  )}
                </div>
                {/* Selected Supplier Pills */}
                {suppliers.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {suppliers.map(v => (
                      <span key={v} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-medium rounded-full">
                        <Building2 className="w-3 h-3" />
                        {v}
                        <button onClick={() => handleRemoveSupplier(v)} className="hover:text-indigo-950 dark:hover:text-indigo-100 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Branch</label>
                <div className="relative">
                  <select 
                    value={branch} 
                    onChange={e => setBranch(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    <option value="Main Plant">Main Plant</option>
                    <option value="Unit 1">Unit 1</option>
                    <option value="Unit 2">Unit 2</option>
                    <option value="Central Warehouse">Central Warehouse</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Transport Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Mode of Transport</label>
                <div className="relative">
                  <select 
                    value={transportMode} 
                    onChange={e => setTransportMode(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    <option value="Road Transport">Road Transport</option>
                    <option value="Air Freight">Air Freight</option>
                    <option value="Sea Freight">Sea Freight</option>
                    <option value="Rail Transport">Rail Transport</option>
                    <option value="Self Pickup">Self Pickup</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

          </div>

          {/* DYNAMIC SPECIFICATIONS CARD */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <List className="w-5 h-5 text-indigo-500" />
                Specifications / Allocations
              </h3>
            </div>
            
            <div className="space-y-3">
              {specifications.map((spec, index) => (
                <div key={spec.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/20 p-3 rounded-xl border border-border/50">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Select Article</label>
                    <select
                      value={spec.articleId}
                      onChange={e => handleSpecChange(spec.id, 'articleId', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Article --</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name || `Article #${m.id}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Quantity</label>
                    <input 
                      type="number"
                      value={spec.totalQty}
                      onChange={e => handleSpecChange(spec.id, 'totalQty', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Select Supplier</label>
                    <select
                      value={spec.supplier}
                      onChange={e => handleSpecChange(spec.id, 'supplier', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Supplier --</option>
                      {suppliers.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Qty to Order</label>
                    <input 
                      type="number"
                      value={spec.orderQty}
                      onChange={e => handleSpecChange(spec.id, 'orderQty', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button 
                      onClick={() => handleRemoveSpecification(spec.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddSpecification}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Specification Row
            </button>
          </div>

          {/* MAIN TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Left Col: Table */}
            <div className="xl:col-span-3 space-y-6">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    Article Procurement Table
                  </h3>
                  <button
                    onClick={handleAddArticle}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Article
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-muted/10 border-b border-border">
                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[25%]">Article Name</th>
                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[12%]">Required Qty</th>
                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[20%]">Selected Supplier</th>
                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[12%]">Order Qty (Supplier)</th>
                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[13%]">Cost / Unit (₹)</th>
                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[13%] text-right">Total Price (₹)</th>
                        <th className="px-2 py-3 w-[5%]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {materials.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              value={item.name}
                              onChange={(e) => handleMaterialChange(item.id, 'name', e.target.value)}
                              placeholder="Article Name..."
                              className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              min={0}
                              value={item.qty}
                              onChange={(e) => handleMaterialChange(item.id, 'qty', e.target.value)}
                              className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={item.supplier}
                              onChange={(e) => handleMaterialChange(item.id, 'supplier', e.target.value)}
                              className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select...</option>
                              {suppliers.map(v => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              min={0}
                              value={item.supplierQty}
                              onChange={(e) => handleMaterialChange(item.id, 'supplierQty', e.target.value)}
                              className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground font-medium">₹</span>
                              <input 
                                type="number" 
                                min={0}
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => handleMaterialChange(item.id, 'unitCost', e.target.value)}
                                className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                            ₹{(item.supplierQty * item.unitCost).toFixed(2)}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <button 
                              onClick={() => handleRemoveArticle(item.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {materials.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic text-sm">
                            No articles added. Click "+ Add Article" to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Col: Financials & Submit */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Financials & Terms Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 sticky top-6">
                <h3 className="font-bold flex items-center gap-2 border-b border-border pb-3">
                  <Calculator className="w-4 h-4 text-indigo-500" />
                  Financial Summary
                </h3>

                <div className="space-y-4">
                  {/* Payment Terms */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Payment Terms</label>
                    <div className="relative">
                      <select 
                        value={paymentTerms} 
                        onChange={e => setPaymentTerms(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="Within 30 Days">Within 30 Days</option>
                        <option value="Within 45 Days">Within 45 Days</option>
                        <option value="Within 60 Days">Within 60 Days</option>
                        <option value="Within 90 Days">Within 90 Days</option>
                        <option value="50% Advance / 50% Delivery">50% Advance / 50% Delivery</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* GST */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">GST (%)</label>
                      <input 
                        type="number" 
                        min={0}
                        value={gst}
                        onChange={e => setGst(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {/* IGST */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">IGST (%)</label>
                      <input 
                        type="number" 
                        min={0}
                        value={igst}
                        onChange={e => setIgst(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted/40 rounded-xl p-4 space-y-3 mt-4 border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {gst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST ({gst}%)</span>
                      <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {igst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IGST ({igst}%)</span>
                      <span className="font-medium">₹{igstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="font-bold">Grand Total</span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={materials.length === 0}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-sm transition-colors mt-2"
                >
                  Create Purchase Order
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center bg-card/30 animate-in fade-in zoom-in duration-300">
          <p className="text-muted-foreground font-medium">Store PO Configuration (Under Construction)</p>
          <p className="text-xs text-muted-foreground mt-2">The layout for direct store inventory purchasing will be built here.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full">
                <Info className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Confirm Purchase Order</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Are you sure you want to create this Purchase Order (<span className="font-semibold text-foreground">{procurementPoNumber}</span>) for <strong>₹{grandTotal.toFixed(2)}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}