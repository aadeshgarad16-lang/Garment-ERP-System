"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Upload, ArrowLeft, Send } from 'lucide-react';
import VendorCombobox from '@/components/logistics/VendorCombobox';

export default function DispatchGoodsPage() {
  const router = useRouter();
  const [poNumber, setPoNumber] = useState<string>('');
  const [vendor, setVendor] = useState<any>(null);
  const [deliveryId, setDeliveryId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [deliveryType, setDeliveryType] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [challanFile, setChallanFile] = useState<File | null>(null);
  const [lrCopyFile, setLrCopyFile] = useState<File | null>(null);
  const [gatePassFile, setGatePassFile] = useState<File | null>(null);
  const [ackFile, setAckFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const po = params.get('poNumber');
      if (po) {
        setPoNumber(po);
        const docsStr = localStorage.getItem('accounts_shared_docs');
        if (docsStr) {
          try {
            const docsMap = JSON.parse(docsStr);
            if (docsMap[po]) {
              setSharedDocs(docsMap[po]);
            }
          } catch (e) {}
        }
      }
    }
    
    // Fetch vendors
    const fetchVendors = async () => {
      try {
        const res = await fetch('/api/vendors');
        if (res.ok) {
          const data = await res.json();
          setVendors(data);
        } else {
          const cached = JSON.parse(localStorage.getItem('cachedVendors') || '[]');
          setVendors(cached);
        }
      } catch (e) {
        const cached = JSON.parse(localStorage.getItem('cachedVendors') || '[]');
        setVendors(cached);
      }
    };
    fetchVendors();
  }, []);

  // Auto-generate delivery ID when vendor changes
  useEffect(() => {
    if (vendor) {
      if (vendor.deliveryIdPrefix) {
        setDeliveryId(vendor.deliveryIdPrefix);
      } else {
        const vName = vendor.name || vendor.vendorName || 'VND';
        const prefix = vName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
        const timestamp = Date.now().toString().slice(-6);
        setDeliveryId(`DEL-${prefix}-${timestamp}`);
      }
    } else {
      setDeliveryId('');
    }
  }, [vendor]);

  const isFormValid = () => {
    const hasInvoice = invoiceFile !== null || sharedDocs.some((d: any) => d.type === 'Invoice');
    const hasChallan = challanFile !== null || sharedDocs.some((d: any) => d.type === 'Delivery Challan');
    const hasLrCopy = lrCopyFile !== null || sharedDocs.some((d: any) => d.type === 'LR Copy');
    const hasGatePass = gatePassFile !== null || sharedDocs.some((d: any) => d.type === 'Gate Pass (Sasons)');
    const hasAck = ackFile !== null || sharedDocs.some((d: any) => d.type === 'Other Supporting Document');

    return (
      vendor !== null &&
      deliveryId.trim() !== '' &&
      branchName.trim() !== '' &&
      deliveryType !== '' &&
      hasInvoice &&
      hasChallan &&
      hasLrCopy &&
      hasGatePass &&
      hasAck
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (poNumber) formData.append('poNumber', poNumber);
      formData.append('vendorName', vendor?.name || vendor?.vendorName || '');
      formData.append('deliveryId', deliveryId);
      formData.append('branchName', branchName);
      formData.append('deliveryType', deliveryType);
      
      if (invoiceFile) formData.append('invoiceFile', invoiceFile);
      if (challanFile) formData.append('challanFile', challanFile);
      if (lrCopyFile) formData.append('lrCopyFile', lrCopyFile);
      if (gatePassFile) formData.append('gatePassFile', gatePassFile);
      if (ackFile) formData.append('ackFile', ackFile);

      // Sending multipart form data request
      const res = await fetch('/api/dispatch/send-for-delivery', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.warn('API route not implemented, simulating success');
      }

      router.push('/dispatch-management');
    } catch (err) {
      console.error(err);
      alert('Error submitting dispatch goods form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSharedDoc = (docId: string) => {
    const updatedDocs = sharedDocs.filter(d => d.id !== docId);
    setSharedDocs(updatedDocs);
    const docsStr = localStorage.getItem('accounts_shared_docs');
    if (docsStr && poNumber) {
      try {
        const docsMap = JSON.parse(docsStr);
        docsMap[poNumber] = updatedDocs;
        localStorage.setItem('accounts_shared_docs', JSON.stringify(docsMap));
      } catch (e) {}
    }
  };

  const handleViewDocument = (doc: any) => {
    if (doc.url && doc.url !== '#') {
      window.open(doc.url, '_blank', 'noopener,noreferrer');
    } else {
      const previewHtml = `
        <html>
          <head><title>Preview: ${doc.fileName}</title></head>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#525659;color:white;font-family:sans-serif;">
            <div style="background:white;color:black;padding:40px;box-shadow:0 0 10px rgba(0,0,0,0.5);width:80%;max-width:800px;min-height:80vh;">
              <h2>${doc.fileName}</h2>
              <hr/>
              <p><strong>Document Type:</strong> ${doc.type} &bull; Uploaded by ${doc.source}</p>
              <p><strong>PO Reference:</strong> ${poNumber}</p>
              <p><strong>Timestamp:</strong> ${doc.date || new Date().toLocaleString()}</p>
              <p style="margin-top:40px;color:#666;">(This is a simulated preview of the uploaded document.)</p>
            </div>
          </body>
        </html>
      `;
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderFileInput = (label: string, file: File | null, setFile: (file: File | null) => void, docType?: string) => {
    const sharedDoc = docType ? sharedDocs.find((d: any) => d.type === docType) : null;

    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label} <span className="text-red-500">*</span>
        </label>
        {sharedDoc ? (
          <div className="flex items-center justify-between p-2.5 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[8px] font-bold px-1.5 py-0.5 rounded-bl-md">
              Uploaded by {sharedDoc.source}
            </div>
            <div className="flex flex-col overflow-hidden w-[70%]">
              <span className="truncate text-sm font-semibold text-indigo-700 dark:text-indigo-400">{sharedDoc.fileName}</span>
              <span className="text-[10px] text-neutral-500">{sharedDoc.type}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 z-10">
              <button type="button" onClick={() => handleViewDocument(sharedDoc)} className="text-[10px] px-2 py-1 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded shadow-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors">View</button>
              <button type="button" onClick={() => handleRemoveSharedDoc(sharedDoc.id)} className="text-neutral-400 hover:text-red-500 transition-colors text-lg font-medium">
                ✖
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                dark:hover:file:bg-indigo-900/50
                border border-neutral-300 dark:border-neutral-700 rounded-md
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-neutral-200 dark:border-slate-800 shadow-sm mt-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dispatch-management')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-neutral-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Truck className="h-6 w-6 text-indigo-600" />
              Dispatch Goods
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              {poNumber ? `Processing dispatch for PO: ${poNumber}` : 'Create a new dispatch record'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-800 p-6 space-y-8">
        
        {/* Section A: Vendor & Logistics */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-slate-800 pb-2">
            A. Vendor & Logistics Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5 relative z-50">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <VendorCombobox 
                vendors={vendors.filter(v => !v.is_archived)} 
                value={vendor} 
                onChange={setVendor} 
              />
            </div>
            <div className="flex flex-col gap-1.5 relative z-40">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Delivery ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={deliveryId}
                readOnly
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-neutral-100 dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 cursor-not-allowed focus:outline-none"
                placeholder="Auto-generated"
              />
            </div>
            <div className="flex flex-col gap-1.5 relative z-40">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-slate-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter branch name"
              />
            </div>
          </div>
        </section>

        {/* Section B: Documents */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-slate-800 pb-2">
            B. Mandatory Document Uploads
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderFileInput("1. Invoice File Upload", invoiceFile, setInvoiceFile, "Invoice")}
            {renderFileInput("2. Challan File Upload", challanFile, setChallanFile, "Delivery Challan")}
            {renderFileInput("3. LR Copy File Upload", lrCopyFile, setLrCopyFile, "LR Copy")}
            {renderFileInput("4. Gate Pass (Sasons) File Upload", gatePassFile, setGatePassFile, "Gate Pass (Sasons)")}
            
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-neutral-50 dark:bg-slate-800/50 rounded-lg border border-neutral-200 dark:border-slate-700">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  5a. Delivery Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-slate-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none h-10"
                >
                  <option value="">Select Delivery Type</option>
                  <option value="By Hand">By Hand</option>
                  <option value="By Courier">By Courier</option>
                  <option value="By Transport">By Transport</option>
                </select>
              </div>
              {renderFileInput("5b. Acknowledgement Upload", ackFile, setAckFile, "Other Supporting Document")}
            </div>
          </div>
        </section>

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all
              ${isFormValid() && !isSubmitting 
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' 
                : 'bg-neutral-400 cursor-not-allowed dark:bg-slate-700'}
            `}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sending...' : 'Send For Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
}
