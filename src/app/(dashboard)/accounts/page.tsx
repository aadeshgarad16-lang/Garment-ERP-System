'use client';

import React, { useState } from 'react';
import { DEMO_SALES_POS } from '@/data/accountsDemoData';
import { MASTER_PROCUREMENT_POS } from '@/data/centralProcurementStore';

export default function AccountsPage() {
  const [mainTab, setMainTab] = useState('sales_pos');
  const [subTab, setSubTab] = useState('unpaid');
  const [searchQuery, setSearchQuery] = useState('');
  const [openTxDropdownId, setOpenTxDropdownId] = useState(null);

  // Modals state
  const [transactionModalData, setTransactionModalData] = useState(null);
  const [docModalData, setDocModalData] = useState(null);
  const [contactModalData, setContactModalData] = useState(null);

  // Form Inputs
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [customTxId, setCustomTxId] = useState('');

  // Master PO Lists
  const ENABLE_DEMO_DATA = true;
  const [salesPOs, setSalesPOs] = useState<any[]>(ENABLE_DEMO_DATA ? DEMO_SALES_POS : []);
  const [procurementPOs, setProcurementPOs] = useState<any[]>(ENABLE_DEMO_DATA ? MASTER_PROCUREMENT_POS : []);

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
                        {!isPaid && (
                          <button onClick={() => setTransactionModalData({ ...po, remainingBalance: dynamicBalanceDue })} className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-all text-xs font-bold" title="Add Payment">
                            💳+
                          </button>
                        )}
                        <button className="w-7 h-7 rounded-lg bg-[#0D1322] border border-gray-800 hover:border-blue-500/50 hover:bg-[#1A233A] text-indigo-400 flex items-center justify-center transition-all text-xs" title="Send Email">
                          ✉
                        </button>
                        <button className="w-7 h-7 rounded-lg bg-[#0D1322] border border-gray-800 hover:border-rose-500/50 hover:bg-[#1A233A] text-rose-400 flex items-center justify-center transition-all text-xs" title="Close PO">
                          🔒
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

    </div>
  );
}
