"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ArrowLeft, FileText, CheckCircle2, Trash2, Download, X, ChevronDown, Building2, Calculator, Info, Package, List } from 'lucide-react';
import ProcurementStepper from '@/components/ProcurementStepper';
import { useTranslation } from '@/hooks/useTranslation';
import jsPDF from 'jspdf';
import { generateOfficialPurchaseOrderPDF } from '@/utils/pdfGenerator';
import 'jspdf-autotable';

// Mock Data
const MOCK_EXISTING_POS = ['PO-2023-001', 'PO-2023-002', 'PO-2023-003', 'PO-2023-004'];
const MOCK_SUPPLIERS = ['Acme Corp', 'Global Textiles', 'Fast Delivery Logistics', 'Premium Threads Co.', 'Apex Manufacturers'];

export default function CreateProcurementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // New PO Configuration State
  // New PO Configuration State
  const defaultCompanyAddress = `SASONS WORKS WEAR PRIVATE LIMITED
AN ISO 9001 : 2015 Certified Co.
Mfg. : Industrial Garments
Factory : 1st Floor, Nana Chamber, Above Bank of Maharashtra, Kasarwadi, Pune - 34.
GSTIN: 27XXXXX0000X1ZX
Email: sasons@sumeetdelta.com
Phone: +91 98765 43210
PAN: ABCDE1234F`;

  const [invoiceTo, setInvoiceTo] = useState(defaultCompanyAddress);
  const [consignee, setConsignee] = useState(defaultCompanyAddress);
  const [supplierAddress, setSupplierAddress] = useState("");
  const [activeAddressModal, setActiveAddressModal] = useState<'consignee' | 'supplier' | null>(null);

  const [fetchedAddresses, setFetchedAddresses] = useState<any[]>([]);
  const [modalAddresses, setModalAddresses] = useState<any[]>([]);

  const handleOpenSupplierAddressModal = async () => {
    let savedAddresses: any[] = [];

    if (suppliers.length > 0) {
      const primarySupplierName = suppliers[0];
      const matchedSupplier = dbSuppliers.find((s: any) => s.companyName === primarySupplierName || s.name === primarySupplierName);
      if (matchedSupplier && matchedSupplier.id) {
        try {
          const res = await fetch(`/api/suppliers/${matchedSupplier.id}/addresses`);
          if (res.ok) {
            savedAddresses = await res.json();
          }
        } catch (err) {
          console.error("Failed to fetch supplier addresses", err);
        }
      }
    }

    const parts = supplierAddress ? supplierAddress.split('\\n') : ['New Supplier Address'];
    const currentCard = {
      id: 'current-supplier',
      name: parts[0],
      line1: parts.slice(1).join('\\n'),
      line2: '',
      city: '',
      country: '',
      contact: '',
      isDefault: true,
      type: 'billing',
      fullString: supplierAddress
    };

    setModalAddresses([currentCard, ...savedAddresses]);
    setActiveAddressModal('supplier');
  };

  const handleOpenConsigneeAddressModal = async () => {
    let savedAddresses: any[] = [];
    try {
      const res = await fetch('/api/company-addresses');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          savedAddresses = result.data.map((a: any) => ({
            id: a.id,
            name: a.entityName,
            line1: a.fullAddress,
            line2: '',
            city: '',
            country: '',
            contact: `GSTIN: ${a.gstin || ''} | Email: ${a.email || ''} | Phone: ${a.phone || ''}`,
            isDefault: false,
            type: a.type
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch company addresses", err);
    }

    const parts = consignee ? consignee.split('\\n') : ['New Consignee Address'];
    const currentCard = {
      id: 'current-consignee',
      name: parts[0],
      line1: parts.slice(1).join('\\n'),
      line2: '',
      city: '',
      country: '',
      contact: '',
      isDefault: true,
      type: 'consignee',
      fullString: consignee
    };

    setModalAddresses([currentCard, ...savedAddresses]);
    setActiveAddressModal('consignee');
  };

  const handleSelectAddress = (addr: any) => {
    let formatted = '';
    if (addr.fullString) {
      formatted = addr.fullString;
    } else {
      formatted = [addr.name, addr.line1, addr.line2, addr.city, addr.country, addr.contact]
        .filter(Boolean)
        .join('\\n');
    }

    if (activeAddressModal === 'consignee') {
      setConsignee(formatted);
    } else if (activeAddressModal === 'supplier') {
      setSupplierAddress(formatted);
    }
    setActiveAddressModal(null);
  };
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [termsOfDelivery, setTermsOfDelivery] = useState("");

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

  const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);

  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch('/api/suppliers');
        if (res.ok) {
          const data = await res.json();
          setDbSuppliers(data);
        }
      } catch (err) {
        console.error("Failed to fetch suppliers", err);
      }
    };
    fetchSuppliers();
  }, []);

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
    const fetchCompanyAddresses = async () => {
      try {
        const res = await fetch('/api/company-addresses');
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            const data = result.data;
            const invoiceDefault = data.find((a: any) => a.isDefaultInvoice);
            const consigneeDefault = data.find((a: any) => a.isDefaultConsignee);

            if (invoiceDefault) {
              setInvoiceTo(`${invoiceDefault.entityName}\n${invoiceDefault.fullAddress}${invoiceDefault.gstin ? '\\nGSTIN: ' + invoiceDefault.gstin : ''}${invoiceDefault.email ? '\\nEmail: ' + invoiceDefault.email : ''}${invoiceDefault.phone ? '\\nPhone: ' + invoiceDefault.phone : ''}${invoiceDefault.panUn ? '\\nPAN/UN: ' + invoiceDefault.panUn : ''}`);
            }
            if (consigneeDefault) {
              setConsignee(`${consigneeDefault.entityName}\n${consigneeDefault.fullAddress}${consigneeDefault.gstin ? '\\nGSTIN: ' + consigneeDefault.gstin : ''}${consigneeDefault.email ? '\\nEmail: ' + consigneeDefault.email : ''}${consigneeDefault.phone ? '\\nPhone: ' + consigneeDefault.phone : ''}${consigneeDefault.panUn ? '\\nPAN/UN: ' + consigneeDefault.panUn : ''}`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch company addresses", err);
      }
    };
    fetchCompanyAddresses();
  }, []);

  useEffect(() => {
    const fetchSupplierAddresses = async () => {
      if (suppliers.length === 0 || dbSuppliers.length === 0) return;
      const primarySupplierName = suppliers[0];
      const matchedSupplier = dbSuppliers.find((s: any) => s.companyName === primarySupplierName || s.name === primarySupplierName);

      if (matchedSupplier && matchedSupplier.id) {
        try {
          const res = await fetch(`/api/suppliers/${matchedSupplier.id}/addresses`);
          if (res.ok) {
            const data = await res.json();
            setFetchedAddresses(data);

            // Auto-populate based on fetched defaults
            const supplierDefault = data.find((a: any) => a.isDefault && (a.type === 'billing' || a.type === 'warehouse')) || data[0];

            if (supplierDefault) {
              setSupplierAddress(`${supplierDefault.name}\n${supplierDefault.line1}${supplierDefault.line2 ? '\\n' + supplierDefault.line2 : ''}\n${supplierDefault.city}\n${supplierDefault.country}${supplierDefault.contact ? '\\n' + supplierDefault.contact : ''}`);
            } else {
              setSupplierAddress(`${matchedSupplier.companyName || matchedSupplier.name}\n${matchedSupplier.registeredAddress || ''}\nGSTIN: ${matchedSupplier.gstId || ''}\nPhone: ${matchedSupplier.phone || ''}\nEmail: ${matchedSupplier.emailAddress || ''}`);
            }
          }
        } catch (error) {
          console.error("Failed to fetch supplier addresses", error);
        }
      }
    };
    fetchSupplierAddresses();
  }, [suppliers, dbSuppliers]);

  useEffect(() => {
    try {
      // 1. Try to load from "Edit / Review PO" workflow via query param
      const targetSupplier = searchParams.get('supplier');
      if (targetSupplier) {
        const sessionStr = localStorage.getItem('review_po_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const supplierGroup = session.find((g: any) => g.supplierName === targetSupplier);

          if (supplierGroup) {
            setSuppliers([supplierGroup.supplierName]);

            if (supplierGroup.items && Array.isArray(supplierGroup.items)) {
              setMaterials(supplierGroup.items.map((item: any, index: number) => ({
                id: item.materialId || `restored-${Date.now()}-${index}`,
                name: item.material || '',
                qty: item.orderQty || 1,
                supplier: supplierGroup.supplierName,
                supplierQty: item.orderQty || 1,
                unit: item.unit || 'Pieces',
                unitCost: item.cost || (item.orderQty > 0 ? (item.orderCost / item.orderQty) : 0) || 0
              })));
            }
            return; // We loaded from session, stop here
          }
        }
      }

      // 2. Fallback to old pending_po_payload if used elsewhere
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
  }, [searchParams]);

  // Computed Financials
  // Computed Financials
  const grossTotal = materials.reduce((acc, item) => acc + ((Number(item.supplierQty) || 0) * (Number(item.unitCost) || 0)), 0);
  const discountAmount = 0; // Discount removed from UI
  const subtotal = grossTotal - discountAmount;

  const gstRate = Number(gst) || 0;
  const cgstAmount = (subtotal * (gstRate / 2)) / 100;
  const sgstAmount = (subtotal * (gstRate / 2)) / 100;
  const gstAmount = cgstAmount + sgstAmount;

  const igstRate = Number(igst) || 0;
  const igstAmount = (subtotal * igstRate) / 100;

  const rawTotal = subtotal + gstAmount + igstAmount;
  const grandTotal = Math.round(rawTotal);
  const roundOff = grandTotal - rawTotal;

  // Handlers
  const handleAddSupplier = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !suppliers.includes(trimmed)) {
      setSuppliers([...suppliers, trimmed]);
    }
    setSupplierInput('');
    setShowSupplierDropdown(false);
  };

  useEffect(() => {
    const fetchSupplierAddress = async () => {
      const activeSupplier = suppliers.length > 0 ? suppliers[0] : null;
      if (!activeSupplier) {
        setSupplierAddress('');
        return;
      }

      try {
        const res = await fetch(`/api/suppliers?name=${encodeURIComponent(activeSupplier)}`);
        const result = await res.json();

        let supplierObj = null;
        if (Array.isArray(result)) {
          supplierObj = result.find((s: any) => s.companyName === activeSupplier || s.name === activeSupplier) || result[0];
        } else {
          supplierObj = result?.data || result;
        }

        if (supplierObj) {
          const fetchedAddress = supplierObj.regestired_address || supplierObj.registeredAddress || supplierObj.address || supplierObj.addressLine1 || supplierObj.streetAddress || '';

          const formattedAddress = [
            supplierObj.companyName || supplierObj.name || activeSupplier,
            fetchedAddress,
            `${supplierObj.city || ''} ${supplierObj.state || ''} ${supplierObj.pincode ? `- ${supplierObj.pincode}` : ''}`.trim(),
            supplierObj.gstin || supplierObj.gstId ? `GSTIN: ${supplierObj.gstin || supplierObj.gstId}` : '',
            supplierObj.email || supplierObj.emailAddress ? `Email: ${supplierObj.email || supplierObj.emailAddress}` : '',
            supplierObj.phone || supplierObj.phone_mobile ? `Phone: ${supplierObj.phone || supplierObj.phone_mobile}` : ''
          ].filter(Boolean).join('\n');

          setSupplierAddress(formattedAddress);
        }
      } catch (err) {
        console.error('Failed to auto-fetch supplier address:', err);
      }
    };

    fetchSupplierAddress();
  }, [suppliers]);

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
    const poData = {
      poNumber: procurementPoNumber,
      branch,
      supplier: suppliers.join(', '),
      transportMode,
      paymentTerms,
      subtotal,
      grandTotal,
      materials,
      invoiceTo,
      consignee,
      supplierAddress,
      poDate,
      deliveryDate
    };
    generateOfficialPurchaseOrderPDF(poData);
  };

  const handleConfirmSubmit = async () => {
    // a) Validation
    if (!procurementPoNumber.trim()) {
      alert("Procurement PO Number is required.");
      return;
    }
    if (suppliers.length === 0) {
      alert("Please select at least one supplier.");
      return;
    }
    if (!branch) {
      alert("Please select a branch.");
      return;
    }
    if (materials.length === 0 || materials.some(m => !m.name || m.qty <= 0)) {
      alert("Please add valid articles with quantity greater than 0.");
      return;
    }

    // b) Update Dashboard State & Allocated Items
    const autoGenStr = localStorage.getItem('autoGeneratedProcurementRequests');
    let autoGenReqs = autoGenStr ? JSON.parse(autoGenStr) : [];

    const allocatedStr = localStorage.getItem('allocatedProcurementItems');
    let allocatedItems = allocatedStr ? JSON.parse(allocatedStr) : [];

    // For each material ordered, find the matching shortage request
    materials.forEach(material => {
      const assignedQty = material.supplierQty || material.qty;
      const targetReqId = material.id;

      const reqIndex = autoGenReqs.findIndex((req: any) => req.id === targetReqId);
      if (reqIndex !== -1) {
        const req = autoGenReqs[reqIndex];
        // Update status to allocated
        req.status = 'PO Created / Allocated';

        // Add to allocated items log (or archive)
        allocatedItems.push({
          id: `ALLOC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          originalReqId: req.id,
          articleName: req.material,
          hsnCode: req.hsnCode || 'N/A',
          supplier: suppliers.join(', '),
          allocatedQty: assignedQty,
          targetDate: paymentTerms,
          poId: procurementPoNumber,
          status: 'PO Created / Allocated',
          timestamp: new Date().toISOString()
        });

        // Completely remove from dashboard active queue as per requirement
        autoGenReqs.splice(reqIndex, 1);
      } else {
        // Fallback for custom items not in autoGeneratedProcurementRequests
        allocatedItems.push({
          id: `ALLOC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          originalReqId: material.id,
          articleName: material.name,
          hsnCode: 'N/A',
          supplier: suppliers.join(', '),
          allocatedQty: assignedQty,
          targetDate: paymentTerms,
          poId: procurementPoNumber,
          status: 'PO Created',
          timestamp: new Date().toISOString()
        });
      }
    });

    localStorage.setItem('autoGeneratedProcurementRequests', JSON.stringify(autoGenReqs));
    localStorage.setItem('allocatedProcurementItems', JSON.stringify(allocatedItems));

    // A. SAVE PO TO DATABASE
    const poPayload = {
      po_number: procurementPoNumber,
      supplier_name: suppliers.join(', '),
      expected_delivery_date: deliveryDate || poDate || new Date().toISOString().split('T')[0],
      items: materials.map(m => ({
        material_id: (m.id || '').split('-split-')[0].replace('PR-STORE-', ''),
        required_qty: m.supplierQty || m.qty,
        status: 'IN PROCESS'
      }))
    };

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
      await fetch(`${BACKEND_URL}/api/procurement/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poPayload)
      });
    } catch (err) {
      console.error("Failed to save PO to database", err);
    }

    window.dispatchEvent(new Event('po-created-success'));
    window.dispatchEvent(new Event('storage')); // Force dashboard re-fetch
    window.dispatchEvent(new Event('orders-updated')); // Sync with Store Order Status table

    // c) Trigger PDF Generation
    const poData = {
      poNumber: procurementPoNumber,
      branch,
      supplier: suppliers.join(', '),
      transportMode,
      paymentTerms,
      subtotal,
      grandTotal,
      materials,
      invoiceTo,
      consignee,
      supplierAddress,
      poDate,
      deliveryDate,
      referenceNo,
      termsOfDelivery
    };

    // B. AUTO-DOWNLOAD PDF
    const doc = generateOfficialPurchaseOrderPDF(poData);
    doc.save(`${poData.poNumber || 'Purchase_Order'}.pdf`);

    // d) Redirect
    setShowConfirmModal(false);
    setIsSuccess(true);
    alert('Purchase Order successfully created!'); // Basic toast replacement
    router.push('/procurement?tab=history');
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 font-sans pb-8 relative">
      <ProcurementStepper />

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

            {/* SECTION A: TOP METADATA (3 ROWS, 4 COLS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-border">
              {/* Row 1 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Procurement PO Number</label>
                <input
                  type="text"
                  value={procurementPoNumber}
                  readOnly
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                  placeholder="e.g. PR-123456"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Suppliers</label>
                <input
                  type="text"
                  value={suppliers.join(', ')}
                  readOnly
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                  placeholder="No supplier selected"
                />
              </div>

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

              {/* Row 2 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">PO Date</label>
                <input
                  type="date"
                  value={poDate}
                  onChange={e => setPoDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Delivery Date (Due On)</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Reference No. & Date</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Ref-123 (Date)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Terms of Delivery</label>
                <input
                  type="text"
                  value={termsOfDelivery}
                  onChange={e => setTermsOfDelivery(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. FOB, Ex-Works"
                />
              </div>
            </div>

            {/* SECTION B: BOTTOM ADDRESS CARDS (EQUAL HEIGHTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full min-h-[220px]">

              {/* Column 1: Invoice To */}
              <div className="flex flex-col h-full bg-slate-900 border border-slate-700 p-4 rounded-lg">
                <label className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Invoice To</label>
                <textarea
                  value={invoiceTo}
                  onChange={e => setInvoiceTo(e.target.value)}
                  className="flex-1 resize-none bg-slate-800 p-3 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Invoice to address..."
                />
              </div>

              {/* Column 2: Consignee */}
              <div className="flex flex-col h-full bg-slate-900 border border-slate-700 p-4 rounded-lg">
                <label className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Consignee (Ship To)</label>
                <textarea
                  value={consignee}
                  onChange={e => setConsignee(e.target.value)}
                  className="flex-1 resize-none bg-slate-800 p-3 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Main Plant"
                />
                <button
                  onClick={handleOpenConsigneeAddressModal}
                  className="mt-4 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg text-sm transition-colors w-full flex items-center justify-center gap-2"
                >
                  Edit / Switch Address
                </button>
              </div>

              {/* Column 3: Supplier Address */}
              <div className="flex flex-col h-full bg-slate-900 border border-slate-700 p-4 rounded-lg">
                <label className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Supplier Address (Bill From)</label>
                <textarea
                  value={supplierAddress}
                  onChange={e => setSupplierAddress(e.target.value)}
                  className="flex-1 resize-none bg-slate-800 p-3 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Enter supplier address..."
                />
                <button
                  onClick={handleOpenSupplierAddressModal}
                  className="mt-4 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg text-sm transition-colors w-full flex items-center justify-center gap-2"
                >
                  Edit / Switch Address
                </button>
              </div>
            </div>

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
                              readOnly
                              className="w-full px-2 py-1.5 bg-muted/30 border border-border rounded text-sm text-muted-foreground cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.qty}
                              readOnly
                              className="w-full px-2 py-1.5 bg-muted/30 border border-border rounded text-sm text-muted-foreground cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={suppliers.join(', ')}
                              readOnly
                              className="w-full px-2 py-1.5 bg-muted/30 border border-border rounded text-sm text-muted-foreground cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.supplierQty}
                              readOnly
                              className="w-full px-2 py-1.5 bg-muted/30 border border-border rounded text-sm text-muted-foreground cursor-not-allowed"
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
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            ₹{((Number(item.supplierQty) || 0) * (Number(item.unitCost) || 0)).toFixed(2)}
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

      {/* Document Preview Modal */}
      {showConfirmModal && (() => {
        const splitAddr = (text: string) => {
          if (!text) return { comp: '', addr: '', gstin: '', email: '', state: '', stateCode: '' };
          const lines = text.split('\n');
          const comp = lines[0] || '';
          let gstin = '';
          let email = '';
          let state = '';
          let stateCode = '';

          const addrLines = lines.slice(1).filter(line => {
            const l = line.toLowerCase();
            if (l.includes('gstin')) { gstin = line.split(':')[1]?.trim() || ''; return false; }
            if (l.includes('e-mail') || l.includes('email')) { email = line.split(':')[1]?.trim() || ''; return false; }
            if (l.includes('state name')) {
              const parts = line.split(',');
              state = parts[0]?.split(':')[1]?.trim() || '';
              stateCode = parts[1]?.split(':')[1]?.trim() || '';
              return false;
            }
            return true;
          });
          return { comp, addr: addrLines.join('\n'), gstin, email, state, stateCode };
        };
        const inv = splitAddr(invoiceTo);
        const con = splitAddr(consignee);
        const supText = supplierAddress ? `${suppliers.join(', ')}\n${supplierAddress}` : suppliers.join(', ');
        const sup = splitAddr(supText);

        const numberToWords = (num: number): string => {
          if (num === 0) return 'Zero';
          const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
          const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
          const convert = (n: number): string => {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
            if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
          };
          return convert(Math.floor(num)).trim();
        };
        const amountInWords = `INR ${numberToWords(grandTotal)}`;

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/90 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
            <div className="bg-muted border border-border rounded-xl shadow-2xl w-full max-w-5xl flex flex-col my-auto max-h-full overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-foreground">Purchase Order Preview</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 bg-background border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back / Edit
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Create PO
                  </button>
                </div>
              </div>

              {/* A4 Document Render container */}
              <div className="p-6 sm:p-10 overflow-y-auto bg-muted/30 custom-scrollbar">
                <div className="bg-white text-black mx-auto w-full max-w-[800px] shadow-sm border border-gray-300 relative font-sans p-0 m-0 box-border flex flex-col" style={{ minHeight: '1122px' }}>

                  {/* Header */}
                  <div className="text-center pt-8 pb-4 px-6">
                    <h2 className="text-lg font-bold tracking-wider text-black m-0">PURCHASE ORDER</h2>
                  </div>

                  {/* Main Grid Outline */}
                  <div className="border border-neutral-700 mx-6 mb-6 mt-2 flex flex-col flex-1 text-[11px] leading-tight">

                    {/* Top Meta Split */}
                    <div className="flex border-b border-neutral-700">

                      {/* Left Column (Addresses) */}
                      <div className="w-[50%] border-r border-neutral-700 flex flex-col text-[10px]">
                        <div className="p-1.5 border-b border-neutral-700 flex-1 min-h-[85px] overflow-hidden">
                          <div className="mb-0.5">Invoice To</div>
                          <div className="font-bold text-[11px]">{inv.comp}</div>
                          <div className="whitespace-pre-wrap leading-tight text-[9px] mb-0.5">{inv.addr}</div>
                          {inv.gstin && <div>GSTIN/UIN : {inv.gstin}</div>}
                          {inv.state && <div>State Name : {inv.state}{inv.stateCode ? `, Code : ${inv.stateCode}` : ''}</div>}
                          {inv.email && <div>E-Mail : {inv.email}</div>}
                        </div>
                        <div className="p-1.5 border-b border-neutral-700 flex-1 min-h-[85px] overflow-hidden">
                          <div className="mb-0.5">Consignee (Ship to)</div>
                          <div className="font-bold text-[11px]">{con.comp}</div>
                          <div className="whitespace-pre-wrap leading-tight text-[9px] mb-0.5">{con.addr}</div>
                          {con.gstin && <div>GSTIN/UIN : {con.gstin}</div>}
                          {con.state && <div>State Name : {con.state}{con.stateCode ? `, Code : ${con.stateCode}` : ''}</div>}
                          {con.email && <div>E-Mail : {con.email}</div>}
                        </div>
                        <div className="p-1.5 flex-1 min-h-[85px] overflow-hidden">
                          <div className="mb-0.5">Supplier (Bill from)</div>
                          <div className="font-bold text-[11px]">{sup.comp}</div>
                          <div className="whitespace-pre-wrap leading-tight text-[9px] mb-0.5">{sup.addr}</div>
                          {sup.gstin && <div>GSTIN/UIN : {sup.gstin}</div>}
                          {sup.state && <div>State Name : {sup.state}{sup.stateCode ? `, Code : ${sup.stateCode}` : ''}</div>}
                          {sup.email && <div>E-Mail : {sup.email}</div>}
                        </div>
                      </div>

                      {/* Right Column (Meta Details) */}
                      <div className="w-[50%] flex flex-col text-[10px]">
                        <div className="flex border-b border-neutral-700 h-[45px]">
                          <div className="w-1/2 border-r border-neutral-700 p-1.5">
                            <div className="text-[10px]">Voucher No.</div>
                            <div className="font-bold mt-0.5 text-[11px]">{procurementPoNumber}</div>
                          </div>
                          <div className="w-1/2 p-1.5">
                            <div className="text-[10px]">Dated</div>
                            <div className="font-bold mt-0.5 text-[11px]">
                              {poDate ? new Date(poDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-') : new Date().toLocaleDateString('en-US')}
                            </div>
                          </div>
                        </div>
                        <div className="flex border-b border-neutral-700 h-[45px]">
                          <div className="w-1/2 border-r border-neutral-700 p-1.5">
                            <div className="text-[10px]">Mode/Terms of Payment</div>
                            <div className="font-bold mt-0.5 text-[11px]">{paymentTerms}</div>
                          </div>
                          <div className="w-1/2 p-1.5">
                            <div className="text-[10px]">Other References</div>
                          </div>
                        </div>
                        <div className="flex border-b border-neutral-700 h-[45px]">
                          <div className="w-1/2 border-r border-neutral-700 p-1.5">
                            <div className="text-[10px]">Reference No. & Date.</div>
                            <div className="font-bold mt-0.5 text-[11px]">{referenceNo}</div>
                          </div>
                          <div className="w-1/2 p-1.5">
                            <div className="text-[10px]">Destination</div>
                            <div className="font-bold mt-0.5 text-[11px]">{branch}</div>
                          </div>
                        </div>
                        <div className="flex border-b border-neutral-700 h-[45px]">
                          <div className="w-1/2 border-r border-neutral-700 p-1.5">
                            <div className="text-[10px]">Dispatched through</div>
                            <div className="font-bold mt-0.5 text-[11px]">{transportMode}</div>
                          </div>
                          <div className="w-1/2 p-1.5">
                          </div>
                        </div>
                        <div className="p-1.5 flex-1 min-h-[60px]">
                          <div className="text-[10px]">Terms of Delivery</div>
                          <div className="font-medium mt-0.5 text-[11px]">{termsOfDelivery}</div>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="w-full flex-1 flex flex-col bg-white text-black">
                      <table className="w-full text-center border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-700 !bg-white !text-black">
                            <th className="border-r border-neutral-700 py-1 w-[5%] font-normal text-[10px] !bg-white !text-black">Sl No.</th>
                            <th className="border-r border-neutral-700 py-1 w-[32%] text-left pl-2 font-normal text-[10px] !bg-white !text-black">Description of Goods</th>
                            <th className="border-r border-neutral-700 py-1 w-[11%] font-normal text-[10px] !bg-white !text-black">Due on</th>
                            <th className="border-r border-neutral-700 py-1 w-[12%] font-normal text-[10px] !bg-white !text-black">Quantity</th>
                            <th className="border-r border-neutral-700 py-1 w-[10%] font-normal text-[10px] !bg-white !text-black">Rate</th>
                            <th className="border-r border-neutral-700 py-1 w-[7%] font-normal text-[10px] !bg-white !text-black">per</th>
                            <th className="border-r border-neutral-700 py-1 w-[8%] font-normal text-[10px] !bg-white !text-black">Disc. %</th>
                            <th className="py-1 w-[15%] text-right pr-2 font-normal text-[10px] !bg-white !text-black">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((m, i) => (
                            <tr key={m.id} className="align-top !bg-white !text-black border-none">
                              <td className="border-r border-neutral-700 py-1 px-1">{i + 1}</td>
                              <td className="border-r border-neutral-700 py-1 px-2 text-left font-bold">{m.name}</td>
                              <td className="border-r border-neutral-700 py-1 px-1">{deliveryDate ? new Date(deliveryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-') : ''}</td>
                              <td className="border-r border-neutral-700 py-1 px-1 font-bold">{(m.supplierQty || m.qty).toString()} {m.unit}</td>
                              <td className="border-r border-neutral-700 py-1 px-1 text-right pr-2">{(m.unitCost).toFixed(2)}</td>
                              <td className="border-r border-neutral-700 py-1 px-1">{m.unit}</td>
                              <td className="border-r border-neutral-700 py-1 px-1"></td>
                              <td className="py-1 px-1 text-right pr-2 font-bold">
                                {((m.supplierQty || m.qty) * m.unitCost).toFixed(2)}
                              </td>
                            </tr>
                          ))}

                          {/* Empty row before subtotal */}
                          <tr className="align-top !bg-white !text-black border-none h-4">
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td></td>
                          </tr>

                          <tr className="align-top !bg-white !text-black border-none">
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="py-1 text-right pr-2 font-bold border-t border-neutral-700 border-b">{subtotal.toFixed(2)}</td>
                          </tr>

                          <tr className="align-top !bg-white !text-black border-none mt-1">
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700 text-right pr-8 font-bold italic text-[11px] py-1 pt-2">INPUT CGST</td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="text-right pr-2 font-bold py-1 pt-2">{cgstAmount.toFixed(2)}</td>
                          </tr>

                          <tr className="align-top !bg-white !text-black border-none">
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700 text-right pr-8 font-bold italic text-[11px] py-1">INPUT SGST</td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="text-right pr-2 font-bold py-1">{sgstAmount.toFixed(2)}</td>
                          </tr>

                          <tr className="align-top !bg-white !text-black border-none">
                            <td className="border-r border-neutral-700 text-left pl-1 italic py-1 pb-4">Less :</td>
                            <td className="border-r border-neutral-700 text-right pr-8 font-bold italic text-[11px] py-1 pb-4">Round Off</td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="border-r border-neutral-700"></td>
                            <td className="text-right pr-2 font-bold py-1 pb-4">{roundOff >= 0 ? roundOff.toFixed(2) : `(-)${Math.abs(roundOff).toFixed(2)}`}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Filler row to explicitly draw vertical lines down to the total */}
                      <div className="flex-1 flex w-full border-t border-neutral-700 border-b-0 min-h-[100px]">
                        <div className="border-r border-neutral-700 w-[5%]"></div>
                        <div className="border-r border-neutral-700 w-[32%]"></div>
                        <div className="border-r border-neutral-700 w-[11%]"></div>
                        <div className="border-r border-neutral-700 w-[12%]"></div>
                        <div className="border-r border-neutral-700 w-[10%]"></div>
                        <div className="border-r border-neutral-700 w-[7%]"></div>
                        <div className="border-r border-neutral-700 w-[8%]"></div>
                        <div className="w-[15%]"></div>
                      </div>
                    </div>

                    {/* Financial Footer & Signatory Block */}
                    <div className="flex flex-col border-t border-neutral-700 relative h-[140px]">
                      {/* Top Total Row */}
                      <div className="flex border-b border-neutral-700 h-[28px] items-center">
                        <div className="w-[85%] text-right pr-4 text-[11px]">Total</div>
                        <div className="w-[15%] text-right pr-2 font-bold text-[12px]">₹ {grandTotal.toFixed(2)}</div>
                      </div>
                      {/* Words & Sign */}
                      <div className="p-1 w-full flex justify-between items-start h-full relative">
                        <div className="w-[60%] text-[10px] pl-1 pt-1">
                          <div className="mb-0.5">Amount Chargeable (in words)</div>
                          <div className="font-bold">{amountInWords} Only</div>
                          <div className="text-[10px] font-bold italic mt-1 pt-1 border-t border-transparent w-[40%]">E. & O.E</div>
                        </div>
                      </div>

                      {/* Signatory Box (Bottom Right Absolute) */}
                      <div className="absolute bottom-0 right-0 w-[50%] h-[112px] border-l border-t border-neutral-700 flex flex-col justify-between p-2 pb-1.5">
                        <div className="font-bold text-[10px] text-right pr-1">for {inv.comp}</div>
                        <div className="text-right text-[10px] pr-1">Authorised Signatory</div>
                      </div>
                    </div>

                  </div>
                  {/* Bottom Tag */}
                  <div className="text-center text-[10px] pb-4">
                    This is a Computer Generated Document
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Address Selection Modal */}
      {activeAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {activeAddressModal === 'consignee' ? 'Select Consignee Address' : 'Select Supplier Address'}
              </h2>
              <button
                onClick={() => setActiveAddressModal(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Add New Address Card (Dashed) */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center p-8 min-h-[200px] hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer group text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <Plus className="w-10 h-10 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="font-semibold text-lg">Add address</span>
                </div>

                {/* Saved Address Cards */}
                {modalAddresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr)}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col min-h-[200px] hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all bg-white dark:bg-slate-800/80 group relative"
                  >
                    <div className="flex-1 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <p className="font-bold text-base text-slate-900 dark:text-white">{addr.name}</p>
                      <p>{addr.line1}</p>
                      <p>{addr.line2}</p>
                      <p>{addr.city}</p>
                      <p>{addr.country}</p>
                      <p className="pt-2 font-medium">{addr.contact}</p>
                      <p className="text-indigo-600 dark:text-indigo-400 mt-1 hover:underline text-xs inline-block">Add delivery instructions</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {addr.isDefault ? (
                        <span className="text-emerald-600 dark:text-emerald-500 font-bold uppercase text-[10px]">Primary {addr.type.replace('_', ' ')} Address</span>
                      ) : (
                        <span className="text-slate-400 font-bold uppercase text-[10px]">{addr.type.replace('_', ' ')} Address</span>
                      )}
                    </div>
                  </div>
                ))}
                {modalAddresses.length === 0 && (
                  <div className="md:col-span-2 p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-muted-foreground flex flex-col items-center justify-center">
                    <p className="font-medium text-slate-500">No saved addresses found.</p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}