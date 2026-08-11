'use client';

import React, { useState } from 'react';

export default function AccountsPage() {
  // Tier 1 Main Tab: 'sales_pos' | 'procurement_pos'
  const [mainTab, setMainTab] = useState('sales_pos');

  // Tier 2 Sub-Tab (for Sales POs): 'paid' | 'unpaid' | 'overdue'
  const [subTab, setSubTab] = useState('unpaid');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // State for View PO Modal
  const [viewModalData, setViewModalData] = useState<any>(null);

  // State for Contact Info Modal
  const [contactModalData, setContactModalData] = useState<any>(null);

  // Handler to trigger Send Mail alert/action
  const handleSendMail = (poNumber: string, recipient: string) => {
    alert(`Email notification sent successfully to ${recipient} for ${poNumber}!`);
  };

  // Handler to view Customer/Supplier Info
  const handleOpenContactInfo = (row: any) => {
    setContactModalData({
      type: mainTab === 'sales_pos' ? 'Customer' : 'Supplier',
      companyName: row.customer || row.supplier || row.company,
      contactPerson: row.contactPerson || 'Rajesh Sharma',
      phone: row.phone || '+91 98765 43210',
      email: row.email || 'accounts@clientcompany.com'
    });
  };

  // State for Upload Modal
  const [uploadModalData, setUploadModalData] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Invoice');
  const [uploadNotes, setUploadNotes] = useState('');

  // Handler for uploading document
  const handleUploadSubmit = () => {
    if (!selectedFile) return;
    
    const newDoc = {
      id: `DOC-${Date.now()}`,
      fileName: selectedFile.name,
      fileType: selectedCategory,
      notes: uploadNotes,
      uploadedBy: 'Accounts Department',
      uploadedAt: new Date().toISOString(),
      statement: 'This document was uploaded by the Accounts Department',
      fileUrl: '#'
    };

    if (uploadModalData.tab === 'sales_pos') {
      setSalesPOs(prev => {
        const updated = prev.map(po => {
          if (po.id === uploadModalData.po.id) {
            return { ...po, documents: [...(po.documents || []), newDoc] };
          }
          return po;
        });
        
        // Persist to localStorage so Dispatch Management sees the documents
        if (typeof window !== 'undefined') {
          localStorage.setItem('initiated_orders', JSON.stringify(updated));
          
          // Also sync to savedOrders if they exist there
          const savedStr = localStorage.getItem('savedOrders');
          if (savedStr) {
            let savedOrders = JSON.parse(savedStr);
            savedOrders = savedOrders.map((o: any) => o.poNumber === uploadModalData.po.id ? { ...o, documents: [...(o.documents || []), newDoc] } : o);
            localStorage.setItem('savedOrders', JSON.stringify(savedOrders));
          }
        }
        
        return updated;
      });
    } else {
      setProcurementPOs(prev => prev.map(po => {
        if (po.id === uploadModalData.po.id) {
          return { ...po, documents: [...(po.documents || []), newDoc] };
        }
        return po;
      }));
    }

    setUploadModalData(null);
    setSelectedFile(null);
    setSelectedCategory('Invoice');
    setUploadNotes('');
    alert(`Document successfully uploaded to ${uploadModalData.po.id}`);
  };

  // Master Sales PO List (Sourced from Order Initiation)
  const [salesPOs, setSalesPOs] = useState(() => {
    const savedOrders = typeof window !== 'undefined' ? localStorage.getItem('initiated_orders') : null;
    return savedOrders ? JSON.parse(savedOrders) : [
      {
        id: 'PO-2026-0801',
        customer: 'Reliance Retail Ltd',
        invDate: '2026-07-15',
        dueDate: '2026-08-05',
        paymentTerm: 'NET 30',
        amount: '₹4,50,000.00',
        advanceAmount: '₹1,50,000.00',
        balanceAmount: '₹3,00,000.00',
        status: 'PAID',
        contactPerson: 'Anil Ambani',
        phone: '+91 98200 12345',
        email: 'billing@relianceretail.com',
        documents: []
      },
      {
        id: 'PO-2026-0802',
        customer: 'Aditya Birla Fashion',
        invDate: '2026-07-18',
        dueDate: '2026-08-08',
        paymentTerm: 'NET 15',
        amount: '₹3,20,000.00',
        advanceAmount: '₹0.00',
        balanceAmount: '₹3,20,000.00',
        status: 'UNPAID',
        contactPerson: 'Kumar Birla',
        phone: '+91 98190 54321',
        email: 'accounts@abfrl.com',
        documents: []
      },
      {
        id: 'PO-2026-0803',
        customer: 'Raymond Apparel',
        invDate: '2026-07-20',
        dueDate: '2026-08-01',
        paymentTerm: 'NET 45',
        amount: '₹5,80,000.00',
        advanceAmount: '₹2,00,000.00',
        balanceAmount: '₹3,80,000.00',
        status: 'OVERDUE',
        contactPerson: 'Gautam Singhania',
        phone: '+91 98211 99887',
        email: 'finance@raymond.in',
        documents: []
      }
    ];
  });

  // 2. PROCUREMENT POS MOCK DATA (Supplier Purchase Orders)
  const [procurementPOs, setProcurementPOs] = useState<any[]>([
    {
      id: 'PO-PROC-2026-01',
      supplier: 'Vardhman Yarns & Fabrics',
      invDate: '2026-08-02',
      dueDate: '2026-08-15',
      paymentTerm: 'NET 15',
      status: 'PAID',
      amount: '₹1,85,000.00'
    },
    {
      id: 'PO-PROC-2026-02',
      supplier: 'Coats India Threads',
      invDate: '2026-08-05',
      dueDate: '2026-08-20',
      paymentTerm: 'NET 30',
      status: 'UNPAID',
      amount: '₹42,500.00'
    },
    {
      id: 'PO-FG-2026-03',
      supplier: 'Apex Garment Manufacturers',
      invDate: '2026-08-06',
      dueDate: '2026-08-18',
      paymentTerm: 'NET 30',
      status: 'UNPAID',
      amount: '₹3,60,000.00'
    }
  ]);

  // FILTER LOGIC FOR SALES POS
  const filteredSalesPOs = salesPOs.filter((po) => {
    const matchesSearch = po.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          po.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = po.status.toLowerCase() === subTab.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // FILTER LOGIC FOR PROCUREMENT POS
  const filteredProcurementPOs = procurementPOs.filter((po) => {
    const matchesSearch = po.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          po.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = po.status.toLowerCase() === subTab.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-[#0B0F17] text-white">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-[#131B2E] p-6 rounded-xl border border-gray-800">
        <div>
          <h1 className="text-2xl font-bold">Accounts Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage billing, monitor PO payments, and configure automated reminders.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2">
          ⚙ Email Settings
        </button>
      </div>

      {/* TIER 1 MAIN TABS */}
      <div className="flex border-b border-gray-800 gap-6">
        <button
          onClick={() => setMainTab('sales_pos')}
          className={`pb-3 text-lg font-semibold transition-colors relative ${
            mainTab === 'sales_pos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Sales POs (Customer Orders)
        </button>
        <button
          onClick={() => setMainTab('procurement_pos')}
          className={`pb-3 text-lg font-semibold transition-colors relative ${
            mainTab === 'procurement_pos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Procurement POs (Supplier Orders)
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-[#131B2E] rounded-xl border border-gray-800 p-6 space-y-4">
        <div className="flex justify-between items-center">
          {/* TIER 2 SUB-TABS (VISIBLE FOR BOTH PO TYPES) */}
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab('paid')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                subTab === 'paid' ? 'bg-emerald-600 text-white' : 'bg-[#1E293B] text-gray-400 hover:text-white'
              }`}
            >
              Paid POs
            </button>
            <button
              onClick={() => setSubTab('unpaid')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                subTab === 'unpaid' ? 'bg-amber-600 text-white' : 'bg-[#1E293B] text-gray-400 hover:text-white'
              }`}
            >
              Unpaid POs
            </button>
            <button
              onClick={() => setSubTab('overdue')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                subTab === 'overdue' ? 'bg-rose-600 text-white' : 'bg-[#1E293B] text-gray-400 hover:text-white'
              }`}
            >
              Overdue POs
            </button>
          </div>

          {/* SEARCH INPUT */}
          <input
            type="text"
            placeholder="Search POs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1E293B] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-64"
          />
        </div>

        {/* PO TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">{mainTab === 'sales_pos' ? 'PO & Customer' : 'PO & Supplier'}</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Payment Term</th>
                <th className="py-3 px-4">Total Amount</th>
                {mainTab === 'sales_pos' && (
                  <>
                    <th className="py-3 px-4">Advance Paid</th>
                    <th className="py-3 px-4">Balance Due</th>
                  </>
                )}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {(mainTab === 'sales_pos' ? filteredSalesPOs : filteredProcurementPOs).length > 0 ? (
                (mainTab === 'sales_pos' ? filteredSalesPOs : filteredProcurementPOs).map((po) => (
                  <tr key={po.id} className="hover:bg-[#1E293B]/50">
                    <td className="py-4 px-4 font-medium">
                      <div>{po.id}</div>
                      <div className="text-xs text-gray-400">{po.customer || po.supplier}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs">Inv: {po.invDate}</div>
                      <div className="text-xs text-gray-400">Due: {po.dueDate}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">{po.paymentTerm}</td>
                    <td className="py-4 px-4 font-medium">{po.amount}</td>
                    {mainTab === 'sales_pos' && (
                      <>
                        <td className="py-4 px-4 text-emerald-400 font-medium">{po.advanceAmount || '₹0.00'}</td>
                        <td className="py-4 px-4 text-amber-400 font-medium">{po.balanceAmount || po.amount}</td>
                      </>
                    )}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        po.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        po.status === 'UNPAID' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 1. VIEW BUTTON */}
                        <button 
                          onClick={() => setViewModalData(po)}
                          className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1"
                          title="View PO Details"
                        >
                          👁 View
                        </button>

                        {/* 2. CUSTOMER / SUPPLIER INFO BUTTON */}
                        <button 
                          onClick={() => handleOpenContactInfo(po)}
                          className="p-2 bg-gray-800 hover:bg-gray-700 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-medium flex items-center gap-1"
                          title={mainTab === 'sales_pos' ? "Customer Info" : "Supplier Info"}
                        >
                          👤 Info
                        </button>

                        {/* UPLOAD DOCUMENT BUTTON */}
                        <button 
                          onClick={() => setUploadModalData({ po, tab: mainTab })}
                          className="p-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1"
                          title="Upload Document"
                        >
                          📄+
                        </button>

                        {/* 3. RENAMED SEND MAIL BUTTON */}
                        <button 
                          onClick={() => handleSendMail(po.id, po.customer || po.supplier)}
                          className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1 border border-indigo-500/30"
                        >
                          ✉ Send Mail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={mainTab === 'sales_pos' ? 8 : 6} className="py-8 text-center text-gray-500">
                    No orders found for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* CONTACT INFO POPUP MODAL COMPONENT */}
      {contactModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2E] border border-gray-800 rounded-xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-blue-400">
                👤 {contactModalData.type} Information
              </h3>
              <button 
                onClick={() => setContactModalData(null)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold">Company Name</label>
                <p className="text-base font-medium text-white">{contactModalData.companyName}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold">Contact Person</label>
                <p className="text-white font-medium">{contactModalData.contactPerson}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold">Phone Number</label>
                <p className="text-white font-mono">{contactModalData.phone}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold">Email Address</label>
                <p className="text-white font-mono">{contactModalData.email}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setContactModalData(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT UPLOAD MODAL COMPONENT */}
      {uploadModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2E] border border-gray-800 rounded-xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-emerald-400">
                📄 Upload Document
              </h3>
              <button 
                onClick={() => setUploadModalData(null)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">PO Number & Entity</p>
                <p className="font-medium text-white">{uploadModalData.po.id} - {uploadModalData.po.customer || uploadModalData.po.supplier}</p>
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase font-semibold block mb-1">Select File (.pdf, .png, .jpg, .docx)</label>
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase font-semibold block mb-1">Document Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#1E293B] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Invoice">Invoice</option>
                  <option value="Tax Receipt">Tax Receipt</option>
                  <option value="E-Way Bill">E-Way Bill</option>
                  <option value="Payment Guarantee">Payment Guarantee</option>
                  <option value="Custom Note">Custom Note</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase font-semibold block mb-1">Remarks / Notes</label>
                <textarea 
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Add any remarks..."
                  className="w-full bg-[#1E293B] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
              <button 
                onClick={() => setUploadModalData(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadSubmit}
                disabled={!selectedFile}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
              >
                Save Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PO MODAL COMPONENT */}
      {viewModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2E] border border-gray-800 rounded-xl p-6 max-w-3xl w-full text-white shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  👁 PO Details: <span className="text-blue-400">{viewModalData.id}</span>
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Entity: <span className="font-semibold text-gray-200">{viewModalData.customer || viewModalData.supplier}</span>
                </p>
              </div>
              <button 
                onClick={() => setViewModalData(null)}
                className="text-gray-400 hover:text-white text-2xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info & Billing */}
              <div className="space-y-6">
                <div className="bg-[#1E293B] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm uppercase font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">Complete Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Invoice Date</span>
                      <span className="font-medium">{viewModalData.invDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Due Date</span>
                      <span className="font-medium">{viewModalData.dueDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Payment Term</span>
                      <span className="font-mono text-blue-400">{viewModalData.paymentTerm}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Status</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        viewModalData.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        viewModalData.status === 'UNPAID' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {viewModalData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1E293B] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm uppercase font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">Billing Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Amount:</span>
                      <span className="font-medium">{viewModalData.amount}</span>
                    </div>
                    {viewModalData.advanceAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Advance Paid:</span>
                        <span className="text-emerald-400 font-medium">{viewModalData.advanceAmount}</span>
                      </div>
                    )}
                    {viewModalData.balanceAmount && (
                      <div className="flex justify-between pt-2 border-t border-gray-700 mt-2">
                        <span className="text-gray-300 font-semibold">Balance Due:</span>
                        <span className="text-amber-400 font-bold">{viewModalData.balanceAmount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Items & Documents */}
              <div className="space-y-6">
                <div className="bg-[#1E293B] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm uppercase font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">Items List</h4>
                  {viewModalData.items && viewModalData.items.length > 0 ? (
                    <ul className="space-y-3">
                      {viewModalData.items.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between text-sm bg-[#131B2E] p-2 rounded">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-gray-300">{item.price}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-[#131B2E] rounded text-center">
                      Detailed items list not available in this summary.
                    </div>
                  )}
                </div>

                <div className="bg-[#1E293B] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm uppercase font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">Attached Documents</h4>
                  {viewModalData.documents && viewModalData.documents.length > 0 ? (
                    <ul className="space-y-2">
                      {viewModalData.documents.map((doc: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center text-sm bg-[#131B2E] p-2 rounded border border-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400">📄</span>
                            <div>
                              <p className="font-medium text-xs">{doc.fileName}</p>
                              <p className="text-[10px] text-gray-500">{doc.fileType}</p>
                            </div>
                          </div>
                          <a href={doc.fileUrl || '#'} className="text-blue-400 hover:text-blue-300 text-xs underline">Download</a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-[#131B2E] rounded text-center">
                      No documents attached to this PO.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewModalData(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
