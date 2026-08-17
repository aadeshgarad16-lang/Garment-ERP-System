'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DEMO_SALES_POS } from '@/data/accountsDemoData';
import { MASTER_PROCUREMENT_POS } from '@/data/centralProcurementStore';
import { formatIndianDate } from '@/utils/dateUtils';

export default function AccountsPage() {
  const [mainTab, setMainTab] = useState('sales_pos');
  const [subTab, setSubTab] = useState('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [openTxDropdownId, setOpenTxDropdownId] = useState(null);

  // Modals state
  const [transactionModalData, setTransactionModalData] = useState<any>(null);
  const [docModalData, setDocModalData] = useState<any>(null);
  const [contactModalData, setContactModalData] = useState<any>(null);
  const [reminderModalData, setReminderModalData] = useState<any>(null);
  const [closeWarningModalData, setCloseWarningModalData] = useState<any>(null);
  const [closureReason, setClosureReason] = useState('');

  const [sharedDocs, setSharedDocs] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('Invoice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form Inputs
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [customTxId, setCustomTxId] = useState('');

  // Master PO Lists
  const ENABLE_DEMO_DATA = true;
  const [salesPOs, setSalesPOs] = useState<any[]>(ENABLE_DEMO_DATA ? DEMO_SALES_POS : []);
  const [procurementPOs, setProcurementPOs] = useState<any[]>(ENABLE_DEMO_DATA ? MASTER_PROCUREMENT_POS : []);

  useEffect(() => {
    const txStr = localStorage.getItem('accounts_transactions');
    if (txStr) {
      try {
        const txMap = JSON.parse(txStr);
        setSalesPOs(prev => prev.map(po => txMap[po.id] ? { ...po, transactions: txMap[po.id] } : po));
        setProcurementPOs(prev => prev.map(po => txMap[po.id] ? { ...po, transactions: txMap[po.id] } : po));
      } catch (e) {}
    }
  }, []);

  // SAVE PAYMENT INSTALLMENT HANDLER
  const handleSavePayment = () => {
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const todayStr = '18-08-2026';
    const txRef = customTxId.trim() || `TXN-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatePOs = (prevPOs: any[]) =>
      prevPOs.map((po) => {
        if (po.id === transactionModalData.id) {
          const updatedTxList = [
            ...(po.transactions || []),
            { txId: txRef, amount: amt, date: todayStr, mode: paymentMode }
          ];

          const allTxStr = localStorage.getItem('accounts_transactions');
          let allTx: any = {};
          if (allTxStr) {
            try { allTx = JSON.parse(allTxStr); } catch (e) {}
          }
          allTx[po.id] = updatedTxList;
          localStorage.setItem('accounts_transactions', JSON.stringify(allTx));

          // Calculate total transactions paid
          const totalTxPaid = updatedTxList.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
          const totalPaidOverall = (po.initialAdvance || po.advancePaid || 0) + totalTxPaid;
          const poTotal = po.grandTotal || po.totalAmount || 0;
          const newRemainingBalance = Math.max(0, poTotal - totalPaidOverall);
          const newStatus = newRemainingBalance === 0 ? 'PAID' : (po.paymentStatus || po.status);

          return {
            ...po,
            transactions: updatedTxList,
            paymentStatus: newStatus,
            status: newStatus
          };
        }
        return po;
      });

    if (mainTab === 'sales_pos') {
      setSalesPOs(updatePOs);
    } else {
      setProcurementPOs(updatePOs);
    }

    setTransactionModalData(null);
    setPaymentAmount('');
    setCustomTxId('');
    alert(`Payment of ₹${amt.toLocaleString('en-IN')} recorded successfully!`);
  };

  const handleForceClosePO = (po: any) => {
    if (!closureReason.trim()) {
      alert('Please enter a reason for closing the PO.');
      return;
    }
    const updatePOs = (prevPOs: any[]) =>
      prevPOs.map((p) => (p.id === po.id ? { 
        ...p, 
        status: 'CLOSED', 
        paymentStatus: 'CLOSED',
        closureReason: closureReason.trim(),
        closedAt: new Date().toISOString(),
        closedBy: 'Current User'
      } : p));

    if (mainTab === 'sales_pos') {
      setSalesPOs(updatePOs);
    } else {
      setProcurementPOs(updatePOs);
    }
    setCloseWarningModalData(null);
    setClosureReason('');
    alert(`PO #${po.id} has been closed and locked.`);
  };

  const handleToggleClosePO = (po: any, balance: number) => {
    setClosureReason('');
    setCloseWarningModalData({ po, balance });
  };

  const handleSendReminder = (po: any) => {
    setReminderModalData(po);
  };

  const confirmSendReminder = () => {
    setReminderModalData(null);
    alert('Payment reminder email sent successfully!');
  };

  useEffect(() => {
    if (docModalData) {
      const allDocsStr = localStorage.getItem('accounts_shared_docs');
      if (allDocsStr) {
        try {
          const allDocs = JSON.parse(allDocsStr);
          setSharedDocs(allDocs[docModalData.id] || []);
        } catch (e) {
          setSharedDocs([]);
        }
      } else {
        setSharedDocs([]);
      }
    }
  }, [docModalData]);

  const confirmUpload = () => {
    if (!selectedFile || !uploadDocType || !docModalData) return;
    
    const newDoc = {
      id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: selectedFile.name,
      type: uploadDocType,
      date: formatIndianDate(new Date()),
      source: 'Accounts',
      url: '#'
    };

    const allDocsStr = localStorage.getItem('accounts_shared_docs');
    let allDocs: any = {};
    if (allDocsStr) {
      try {
        allDocs = JSON.parse(allDocsStr);
      } catch (e) {}
    }

    if (!allDocs[docModalData.id]) allDocs[docModalData.id] = [];
    allDocs[docModalData.id].push(newDoc);
    localStorage.setItem('accounts_shared_docs', JSON.stringify(allDocs));

    setSharedDocs(prev => [...prev, newDoc]);
    alert('Document uploaded successfully and shared with Dispatch.');
    
    setShowUploadForm(false);
    setSelectedFile(null);
    setUploadDocType('Invoice');
  };

  const handleViewDocument = (fileName: string) => {
    const previewHtml = `
      <html>
        <head><title>Preview: ${fileName}</title></head>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#525659;color:white;font-family:sans-serif;">
          <div style="background:white;color:black;padding:40px;box-shadow:0 0 10px rgba(0,0,0,0.5);width:80%;max-width:800px;min-height:80vh;">
            <h2>${fileName}</h2>
            <hr/>
            <p><strong>PO Reference:</strong> ${docModalData?.id}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin-top:40px;color:#666;">(This is a simulated preview of the uploaded document.)</p>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadDocument = (fileName: string) => {
    const a = document.createElement('a');
    a.href = '#';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemoveDocument = (docId: string) => {
    if (!docModalData) return;
    if (confirm("Are you sure you want to remove this document?")) {
      const updatedDocs = sharedDocs.filter(d => d.id !== docId);
      setSharedDocs(updatedDocs);
      
      const allDocsStr = localStorage.getItem('accounts_shared_docs');
      if (allDocsStr) {
        try {
          const allDocs = JSON.parse(allDocsStr);
          allDocs[docModalData.id] = updatedDocs;
          localStorage.setItem('accounts_shared_docs', JSON.stringify(allDocs));
        } catch (e) {}
      }
    }
  };

  const activeDataList = mainTab === 'sales_pos' ? salesPOs : procurementPOs;

  const filteredSales = activeDataList.filter((po) => {
    const customerOrSupplier = po.customer || po.supplier || '';
    const matchSearch = po.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        customerOrSupplier.toLowerCase().includes(searchQuery.toLowerCase());
    const poStatus = po.paymentStatus || po.status;
    const matchStatus = subTab === 'paid' ? poStatus === 'PAID' : poStatus.toLowerCase() === subTab.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-[#0D1322] text-white font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#131B2E] p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold">Accounts Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Manage billing, monitor PO payments, record installments, and close POs.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
          ⚙ Email Settings
        </button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-800 gap-6">
        <button
          onClick={() => setMainTab('sales_pos')}
          className={`pb-3 text-base font-semibold transition-colors ${
            mainTab === 'sales_pos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Sales POs (Customer Orders)
        </button>
        <button
          onClick={() => setMainTab('procurement_pos')}
          className={`pb-3 text-base font-semibold transition-colors ${
            mainTab === 'procurement_pos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Procurement POs (Supplier Orders)
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-[#131B2E] border border-gray-800/80 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab('paid')}
              className={subTab === 'paid' 
                ? 'bg-emerald-600/20 text-emerald-400 border-2 border-emerald-500 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-emerald-500/10' 
                : 'bg-[#0D1322] text-gray-300 border border-gray-700/80 hover:bg-[#1A233A] hover:border-gray-500 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer'}
            >
              Paid POs
            </button>
            <button
              onClick={() => setSubTab('unpaid')}
              className={subTab === 'unpaid' 
                ? 'bg-amber-600/20 text-amber-400 border-2 border-amber-500 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/10' 
                : 'bg-[#0D1322] text-gray-300 border border-gray-700/80 hover:bg-[#1A233A] hover:border-gray-500 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer'}
            >
              Unpaid POs
            </button>
            <button
              onClick={() => setSubTab('overdue')}
              className={subTab === 'overdue' 
                ? 'bg-rose-600/20 text-rose-400 border-2 border-rose-500 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-rose-500/10' 
                : 'bg-[#0D1322] text-gray-300 border border-gray-700/80 hover:bg-[#1A233A] hover:border-gray-500 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer'}
            >
              Overdue POs
            </button>
          </div>

          <input
            type="text"
            placeholder="Search POs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0D1322] border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-64"
          />
        </div>

        {/* TABLE WRAPPER (OVERFLOW-Y VISIBLE PREVENTS SCROLLBARS) */}
        <div className="w-full overflow-x-auto overflow-y-visible pb-44">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 text-left w-[15%]">PO & Customer</th>
                <th className="py-3.5 px-3 text-left w-[13%]">Payment Term</th>
                <th className="py-3.5 px-3 text-left w-[11%]">Total Amount</th>
                <th className="py-3.5 px-3 text-left w-[11%] text-emerald-400">Advance Paid</th>
                <th className="py-3.5 px-3 text-left w-[11%] text-amber-400">Balance Due</th>
                <th className="py-3.5 px-3 text-left w-[11%] text-blue-400">Transactions</th>
                <th className="py-3.5 px-3 text-left w-[8%]">Status</th>
                <th className="py-3.5 px-3 text-left w-[20%]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800 text-xs">
              {filteredSales.map((po) => {
                const txList = po.transactions || [];
                
                // 1. DYNAMIC BALANCE DUE CALCULATION: Total Amount - (Initial Advance + Sum of all Transactions)
                const txSum = txList.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
                const totalPaidSoFar = (po.initialAdvance || po.advancePaid || 0) + txSum;
                const grandTotalVal = po.grandTotal || po.totalAmount || 0;
                const poStatus = po.paymentStatus || po.status;
                const dynamicBalanceDue = poStatus === 'PAID' ? 0 : Math.max(0, grandTotalVal - totalPaidSoFar);
                const isPaid = dynamicBalanceDue === 0 || poStatus === 'PAID';
                const isTxOpen = openTxDropdownId === po.id;

                return (
                  <tr key={po.id} className="hover:bg-[#0D1322]/60 transition-colors">
                    
                    {/* COLUMN 1: PO & CUSTOMER (TIGHT FIT) */}
                    <td className="py-3.5 px-3 align-middle text-left w-[15%]">
                      <div className="font-bold text-white text-xs">{po.id}</div>
                      <div className="text-[11px] text-gray-300 font-medium truncate mt-0.5">{po.customer || po.supplier}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                        Invoice Date: <span className="text-gray-200 font-medium">{po.invoiceDate || po.invDate || '-'}</span>
                      </div>
                    </td>

                    {/* COLUMN 2: PAYMENT TERM (PULLED CLOSE TO COL 1) */}
                    <td className="py-3.5 px-3 align-middle text-left w-[13%] whitespace-nowrap">
                      <div className="font-bold text-white text-xs">{po.paymentTerm}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                        Due Date: <span className="text-gray-200 font-medium">{po.dueDate}</span>
                      </div>
                    </td>

                    {/* FINANCIALS */}
                    <td className="py-[18px] px-4 align-middle text-left font-bold text-white w-[11%]">
                      ₹{(po.grandTotal || po.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-[18px] px-4 align-middle text-left font-bold text-emerald-400 w-[11%]">
                      ₹{totalPaidSoFar.toLocaleString('en-IN')}
                    </td>
                    <td className="py-[18px] px-4 align-middle text-left font-bold text-amber-400 w-[11%]">
                      ₹{dynamicBalanceDue.toLocaleString('en-IN')}
                    </td>

              {/* TRANSACTIONS CELL WITH DOWNWARD FLOATING POPUP */}
              <td className="py-3.5 px-3 align-middle text-left relative w-[11%]">
                <button
                  onClick={() => setOpenTxDropdownId(isTxOpen ? null : po.id)}
                  className="bg-[#0D1322] hover:bg-[#1A233A] border border-blue-500/40 text-blue-400 px-2.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  💳 {txList.length} Txn{txList.length !== 1 ? 's' : ''} ▼
                </button>

                {/* DOWNWARD POPUP FLOATING OVER THE BOTTOM PADDING WITH HIGH Z-INDEX */}
                {isTxOpen && (
                  <div className="absolute top-12 left-0 z-50 bg-[#0D1322] border border-gray-700/80 rounded-xl p-3.5 shadow-2xl w-72 space-y-2 backdrop-blur-md">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Transaction History</span>
                      <span className="text-[10px] text-blue-400 font-mono">{po.id}</span>
                    </div>

                    {txList.length > 0 ? (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {txList.map((tx, idx) => (
                          <div key={idx} className="bg-[#131B2E] p-2 rounded-lg border border-gray-800/80 flex justify-between items-center text-[10px]">
                            <div>
                              <p className="font-mono text-white font-bold">{tx.txId}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">{tx.date} • {tx.mode}</p>
                            </div>
                            <span className="font-bold text-emerald-400 font-mono">₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-500 italic py-2 text-center">No transaction records found.</p>
                    )}
                  </div>
                )}
              </td>

                    {/* STATUS */}
                    <td className="py-[18px] px-3 align-middle text-left w-[8%]">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${
                        isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        (po.paymentStatus === 'PARTIALLY_PAID' || po.status === 'PARTIALLY_PAID') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isPaid ? 'PAID' : (po.paymentStatus === 'PARTIALLY_PAID' || po.status === 'PARTIALLY_PAID' ? 'PARTIAL' : (po.paymentStatus || po.status))}
                      </span>
                    </td>

                    {/* COLUMN 8: ACTIONS (LEFT-ALIGNED UNDER THE HEADER) */}
                    <td className="py-3.5 px-3 align-middle text-left w-[18%]">
                      <div className="flex items-center justify-start gap-1.5">
                        <button onClick={() => setDocModalData(po)} className="w-7 h-7 rounded-lg bg-[#0D1322] border border-gray-800 hover:border-blue-500/50 hover:bg-[#1A233A] text-gray-300 flex items-center justify-center transition-all text-xs" title="View Docs">
                          📁
                        </button>
                        <button onClick={() => setContactModalData(po)} className="w-7 h-7 rounded-lg bg-[#0D1322] border border-gray-800 hover:border-blue-500/50 hover:bg-[#1A233A] text-blue-400 flex items-center justify-center transition-all text-xs" title="Customer Info">
                          👤
                        </button>
                        {!isPaid && poStatus !== 'CLOSED' && (
                          <button onClick={() => setTransactionModalData({ ...po, remainingBalance: dynamicBalanceDue })} className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-all text-xs font-bold" title="Add Payment">
                            💳+
                          </button>
                        )}
                        <button onClick={() => handleSendReminder(po)} className="w-7 h-7 rounded-lg bg-[#0D1322] border border-gray-800 hover:border-blue-500/50 hover:bg-[#1A233A] text-indigo-400 flex items-center justify-center transition-all text-xs" title="Send Email">
                          ✉
                        </button>
                        {poStatus !== 'CLOSED' && (
                          <button onClick={() => handleToggleClosePO(po, dynamicBalanceDue)} className="w-7 h-7 rounded-lg bg-[#0D1322] border border-gray-800 hover:border-rose-500/50 hover:bg-[#1A233A] text-rose-400 flex items-center justify-center transition-all text-xs" title="Close PO">
                            🔒
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {transactionModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2E] border border-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-emerald-400">💳 Record Payment Entry ({transactionModalData.id})</h3>
              <button onClick={() => setTransactionModalData(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <span className="text-gray-400 font-semibold">Balance Due:</span>
                <span className="font-bold text-amber-400 text-sm">₹{transactionModalData.remainingBalance.toLocaleString('en-IN')}</span>
              </div>
              
              {/* PAYMENT AMOUNT INPUT WITH AUTOMATIC COMMA FORMATTING */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-300 font-semibold uppercase text-[10px]">
                    Payment Amount (₹)
                  </label>
                  {paymentAmount > 0 && (
                    <span className="text-emerald-400 font-bold text-xs">
                      ₹ {Number(paymentAmount).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">₹</span>
                  <input
                    type="text"
                    placeholder="e.g. 1,40,000"
                    value={
                      paymentAmount 
                        ? Number(paymentAmount.toString().replace(/,/g, '')).toLocaleString('en-IN') 
                        : ''
                    }
                    onChange={(e) => {
                      // Strip out non-digit characters for state calculation
                      const rawValue = e.target.value.replace(/\D/g, '');
                      setPaymentAmount(rawValue);
                    }}
                    className="w-full bg-[#0D1322] text-white pl-7 pr-3 py-2.5 rounded-xl border border-gray-700 text-xs font-bold focus:outline-none focus:border-blue-500 font-mono tracking-wide"
                  />
                </div>

                {/* HELPER READOUT */}
                {paymentAmount > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    Formatted: <span className="text-emerald-400 font-bold">₹ {Number(paymentAmount).toLocaleString('en-IN')}</span>
                  </p>
                )}
              </div>

              {/* 2. PAYMENT MODE */}
              <div>
                <label className="text-gray-300 font-semibold uppercase text-[10px] block mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-[#0D1322] text-white p-2.5 rounded-xl border border-gray-700 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option>Bank Transfer (NEFT/RTGS)</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                  <option>Cash</option>
                </select>
              </div>

              {/* 3. TRANSACTION ID / REFERENCE NUMBER */}
              <div>
                <label className="text-gray-300 font-semibold uppercase text-[10px] block mb-1">Transaction ID / Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-998822 / UPI-1029384"
                  value={customTxId}
                  onChange={(e) => setCustomTxId(e.target.value)}
                  className="w-full bg-[#0D1322] text-white p-2.5 rounded-xl border border-gray-700 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <button onClick={() => setTransactionModalData(null)} className="px-4 py-2 bg-gray-800 text-xs rounded-xl">Cancel</button>
              <button onClick={handleSavePayment} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs rounded-xl font-bold text-white">Save Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* 📁 VIEW ATTACHMENTS / INVOICE MODAL */}
      {docModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2E] border border-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-200">📁 Attached Documents</h3>
              <button onClick={() => setDocModalData(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-200 font-bold">Invoice_{docModalData.id}.pdf</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Uploaded {docModalData.invoiceDate || docModalData.invDate || 'Recently'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleViewDocument(`Invoice_${docModalData.id}.pdf`)} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">View</button>
                  <button onClick={() => handleDownloadDocument(`Invoice_${docModalData.id}.pdf`)} className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-600/40 transition-colors">Download</button>
                </div>
              </div>
              <div className="bg-[#0D1322] p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-200 font-bold">Receipt_Advance.pdf</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Uploaded Automatically</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleViewDocument(`Receipt_Advance.pdf`)} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">View</button>
                  <button onClick={() => handleDownloadDocument(`Receipt_Advance.pdf`)} className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-600/40 transition-colors">Download</button>
                </div>
              </div>

              {sharedDocs.map((doc: any) => (
                <div key={doc.id} className="bg-[#0D1322] p-3 rounded-xl border border-blue-500/30 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                    Uploaded by {doc.source}
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 font-bold">{doc.fileName}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5"><span className="text-blue-400">{doc.type}</span> • Uploaded {doc.date}</p>
                  </div>
                  <div className="flex gap-2 z-10 items-center">
                    <button onClick={() => handleViewDocument(doc.fileName)} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">View</button>
                    <button onClick={() => handleDownloadDocument(doc.fileName)} className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-600/40 transition-colors">Download</button>
                    <button onClick={() => handleRemoveDocument(doc.id)} className="text-rose-400 hover:text-rose-500 ml-1" title="Remove Document">✖</button>
                  </div>
                </div>
              ))}
            </div>

            {showUploadForm ? (
              <div className="pt-3 border-t border-gray-800 space-y-3">
                <div className="flex gap-2">
                  <select 
                    value={uploadDocType} 
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="bg-[#0D1322] border border-gray-700 text-gray-300 text-xs rounded-xl px-3 py-2 outline-none flex-1"
                  >
                    <option value="Invoice">Invoice</option>
                    <option value="Delivery Challan">Delivery Challan</option>
                    <option value="LR Copy">LR Copy</option>
                    <option value="Gate Pass (Sasons)">Gate Pass (Sasons)</option>
                    <option value="Goods Receipt Note (GRN)">Goods Receipt Note (GRN)</option>
                    <option value="Other Supporting Document">Other Supporting Document</option>
                  </select>
                  <div className="relative flex-1">
                    <input 
                      type="file" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="block w-full text-xs text-gray-400
                        file:mr-2 file:py-2 file:px-3
                        file:rounded-xl file:border-0
                        file:text-xs file:font-semibold
                        file:bg-indigo-600/20 file:text-indigo-400
                        hover:file:bg-indigo-600/30 cursor-pointer
                        border border-gray-700 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowUploadForm(false); setSelectedFile(null); }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs rounded-xl font-semibold transition-colors">Cancel</button>
                  <button onClick={confirmUpload} disabled={!selectedFile} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-bold transition-colors disabled:opacity-50">Confirm Upload</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                <button onClick={() => setShowUploadForm(true)} className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs rounded-xl font-semibold transition-colors flex items-center gap-2">
                  + Upload Document
                </button>
                <button onClick={() => setDocModalData(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs rounded-xl font-semibold transition-colors">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 👤 CUSTOMER / VENDOR INFO MODAL */}
      {contactModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2E] border border-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-blue-400">👤 Profile Details</h3>
              <button onClick={() => setContactModalData(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Company / Entity</p>
                <p className="text-gray-200 font-bold">{contactModalData.customer || contactModalData.supplier || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Contact Person</p>
                  <p className="text-gray-300">{contactModalData.contactPerson || 'Sasons Representative'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">GSTIN</p>
                  <p className="text-gray-300 font-mono text-xs">{contactModalData.gstin || '27AADCS5467F1Z9'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Email Address</p>
                  <p className="text-gray-300 text-xs">{contactModalData.email || 'billing@example.com'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Phone Number</p>
                  <p className="text-gray-300 text-xs">{contactModalData.phone || '+91 98765 43210'}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Billing Address</p>
                <p className="text-gray-300 text-xs leading-relaxed bg-[#0D1322] p-2.5 rounded-xl border border-gray-800">
                  {contactModalData.address || 'Factory: 1st Floor, Nana Chamber, Above Bank of Maharashtra, Kasarwadi, Pune - 34.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-800">
              <button onClick={() => setContactModalData(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs rounded-xl font-semibold transition-colors">Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* ✉️ SEND EMAIL / PAYMENT REMINDER MODAL */}
      {reminderModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2E] border border-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-indigo-400">✉️ Send Email Reminder</h3>
              <button onClick={() => setReminderModalData(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">To</label>
                <input type="text" readOnly value={reminderModalData.email || 'billing@example.com'} className="w-full bg-[#0D1322] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Subject</label>
                <input type="text" readOnly value={`Payment Due Reminder for PO #${reminderModalData.id}`} className="w-full bg-[#0D1322] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 font-semibold cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Message Preview</label>
                <textarea readOnly rows={4} className="w-full bg-[#0D1322] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 cursor-not-allowed" value={`Dear ${reminderModalData.customer || reminderModalData.supplier || 'Partner'},\n\nThis is a friendly reminder that an outstanding balance is due for Purchase Order ${reminderModalData.id}.\n\nPlease arrange for payment at your earliest convenience to avoid any delays.\n\nRegards,\nAccounts Team`}></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <button onClick={() => setReminderModalData(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs rounded-xl font-semibold transition-colors">Cancel</button>
              <button onClick={confirmSendReminder} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/20">Send Reminder</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 CLOSE WARNING MODAL */}
      {closeWarningModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131B2E] border border-rose-900/50 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-center mb-2">
              <div className="bg-rose-500/10 p-4 rounded-full border border-rose-500/30">
                <span className="text-rose-500 text-2xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-white text-center">Close PO?</h3>
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              This PO (<span className="font-bold text-gray-200">{closeWarningModalData.po.id}</span>) has an outstanding balance of <span className="font-bold text-amber-400 text-sm">₹{closeWarningModalData.balance.toLocaleString('en-IN')}</span>.<br/>
              Are you sure you want to close and lock this PO?
            </p>

            <div className="space-y-2 mt-4 text-left">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Reason for Closing PO <span className="text-rose-500">*</span></label>
              <textarea 
                rows={3} 
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder="e.g., Order fulfilled offline, Client cancelled remaining units..."
                className="w-full bg-[#0D1322] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button onClick={() => setCloseWarningModalData(null)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-xs rounded-xl font-semibold transition-colors">Cancel</button>
              <button onClick={() => handleForceClosePO(closeWarningModalData.po)} disabled={!closureReason.trim()} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-xl font-bold transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed">Confirm Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
