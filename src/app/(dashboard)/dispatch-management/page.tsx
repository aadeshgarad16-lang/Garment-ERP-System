"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, CheckCircle2, FileText, ArrowRight, Package, Edit, MoreVertical, Archive, CheckSquare, AlertCircle, Download, UserPlus } from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import LogisticsWorkflowHeader from '@/components/logistics/LogisticsWorkflowHeader';
import PackingVerification from '@/components/logistics/PackingVerification';
import ApprovalSection from '@/components/logistics/ApprovalSection';
import ComplianceDocs from '@/components/logistics/ComplianceDocs';
import DispatchSection from '@/components/logistics/DispatchSection';
import ProofOfDelivery from '@/components/logistics/ProofOfDelivery';
import FinancialClosure from '@/components/logistics/FinancialClosure';
import DispatchSetupModal from '@/components/logistics/DispatchSetupModal';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';

// 1. Removable / Toggleable Data Architecture
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || true;

// 2. Mock/Dummy Data for Testing
const MOCK_DISPATCH_ORDERS = [
  { poNumber: 'PO-2026-001', customerName: 'Zara Apparel Ltd', stage: 'Pending', logisticsStep: 1 },
  { poNumber: 'PO-2026-002', customerName: 'H&M Global', stage: 'Quality & Packing', logisticsStep: 2 },
  { poNumber: 'PO-2026-003', customerName: 'Levis Co', stage: 'In Transit', logisticsStep: 4 },
  { poNumber: 'PO-2026-004', customerName: 'Uniqlo Essentials', stage: 'Delivered', logisticsStep: 6 },
  { poNumber: 'PO-2026-005', customerName: 'Nike Sportswear', stage: 'Delayed', logisticsStep: 3 },
];

export default function DispatchManagementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [poNumber, setPoNumber] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [orderArchived, setOrderArchived] = useState(false);
  
  // Dashboard state
  const [orders, setOrders] = useState<any[]>([]);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [dispatchFilter, setDispatchFilter] = useState('AWAITING');

  const kpiCards = [
    { id: 'AWAITING', label: 'Awaiting Dispatch', count: '24 POs', color: 'blue' },
    { id: 'IN_TRANSIT', label: 'In Transit', count: '56 Shipments', color: 'amber' },
    { id: 'DELAYED', label: 'Delayed Shipments', count: '03 Shipments', color: 'rose' },
    { id: 'COMPLETED', label: "Completed PO's", count: '142 Orders', color: 'emerald' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const po = params.get('poNumber');
      
      const ordersStr = localStorage.getItem('savedOrders');
      let loadedOrders: any[] = [];
      if (USE_MOCK_DATA) {
        loadedOrders = MOCK_DISPATCH_ORDERS;
        setOrders(loadedOrders);
      } else if (ordersStr) {
        try {
          loadedOrders = JSON.parse(ordersStr);
          // Filter out archived or non-logistics orders if needed for the table, but we'll show all for now or active logistics
          setOrders(loadedOrders.filter((o: any) => o.stage === 'Logistics' || o.stage === 'Quality & Packing' || o.logisticsStep));
        } catch (e) {
          console.error(e);
        }
      }

      if (po) {
        setPoNumber(po);
        const found = loadedOrders.find((o: any) => o.poNumber === po);
        if (found) {
          setCurrentOrder(found);
          if (found.logisticsStep) {
            setCurrentStep(found.logisticsStep);
          }
          if (found.logisticsCompletedSteps) {
            setCompletedSteps(found.logisticsCompletedSteps);
          }
          if (found.orderArchived !== undefined) {
            setOrderArchived(found.orderArchived);
          }
        }
      }
    }
  }, []);

  const saveLogisticsProgress = async (step: number, completed: number[], archived: boolean) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      if (archived) {
        try {
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
          await fetch(`${BACKEND_URL}/purchase_orders/update_stage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ poNumber: po, stage: "Archived" })
          });
          window.dispatchEvent(new Event("orders-updated"));
        } catch (e) {
          console.error("Failed to archive logistics order:", e);
        }
      }
      
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (ordersList) => {
        return ordersList.map((o: any) => o.poNumber === po ? {
          ...o,
          logisticsStep: step,
          logisticsCompletedSteps: completed,
          orderArchived: archived,
          stage: archived ? "Archived" : "Logistics"
        } : o);
      });
    }
  };

  const handleStepComplete = useCallback((stepId: number) => {
    setCompletedSteps(prev => {
      const nextCompleted = prev.includes(stepId) ? prev : [...prev, stepId];
      let nextStep = currentStep;
      let nextArchived = orderArchived;

      if (stepId < 6) {
        nextStep = stepId + 1;
      } else {
        nextArchived = true;
      }

      setCurrentStep(nextStep);
      setOrderArchived(nextArchived);
      saveLogisticsProgress(nextStep, nextCompleted, nextArchived);

      return nextCompleted;
    });
  }, [currentStep, orderArchived, user?.name]);

  const handleDispatchSetupSubmit = (data: any) => {
    console.log("Dispatch setup data:", data);
    // Logic to apply dispatch setup to selected rows could go here
    setIsSetupModalOpen(false);
  };

  const toggleRowSelection = (poId: string) => {
    setSelectedRows(prev => 
      prev.includes(poId) ? prev.filter(id => id !== poId) : [...prev, poId]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === orders.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(orders.map(o => o.poNumber));
    }
  };

  const renderActiveSection = () => {
    switch (currentStep) {
      case 1:
        return <PackingVerification order={currentOrder} onComplete={() => handleStepComplete(1)} />;
      case 2:
        return <ApprovalSection onComplete={() => handleStepComplete(2)} />;
      case 3:
        return <ComplianceDocs order={currentOrder} onComplete={() => handleStepComplete(3)} />;
      case 4:
        return <DispatchSection onComplete={() => handleStepComplete(4)} />;
      case 5:
        return <ProofOfDelivery onComplete={() => handleStepComplete(5)} />;
      case 6:
        return <FinancialClosure onComplete={() => handleStepComplete(6)} />;
      default:
        return null;
    }
  };

  const renderDashboardTable = () => (
    <div className="space-y-6 mt-6">
      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Awaiting Dispatch */}
        <div onClick={() => setDispatchFilter('AWAITING')} className="cursor-pointer bg-white dark:bg-slate-900 rounded-xl p-5 border border-blue-500/30 shadow-sm flex items-center gap-4 transition-all hover:border-blue-500">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Awaiting Dispatch</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">24</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">POs</span>
            </div>
          </div>
        </div>

        {/* Card 2: In Transit */}
        <div onClick={() => setDispatchFilter('IN_TRANSIT')} className="cursor-pointer bg-white dark:bg-slate-900 rounded-xl p-5 border border-amber-500/30 shadow-sm flex items-center gap-4 transition-all hover:border-amber-500">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-amber-600 dark:text-amber-400">In Transit</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">56</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Shipments</span>
            </div>
          </div>
        </div>

        {/* Card 3: Delayed Shipments */}
        <div onClick={() => setDispatchFilter('DELAYED')} className="cursor-pointer bg-white dark:bg-slate-900 rounded-xl p-5 border border-rose-500/30 shadow-sm flex items-center gap-4 transition-all hover:border-rose-500">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-rose-600 dark:text-rose-400">Delayed Shipments</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">03</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Shipments</span>
            </div>
          </div>
        </div>

        {/* Card 4: Completed PO's */}
        <div onClick={() => setDispatchFilter('COMPLETED')} className="cursor-pointer bg-white dark:bg-slate-900 rounded-xl p-5 border border-emerald-500/30 shadow-sm flex items-center gap-4 transition-all hover:border-emerald-500">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Completed PO's</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">142</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Orders</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dispatch Orders Table */}
      <div className="bg-[#131B2E] rounded-xl border border-gray-800 p-6 space-y-4">
        {/* SECTION HEADER WITH MOVED & STYLED BUTTONS */}
        <div className="flex justify-between items-center pb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            📦 Active Dispatch Orders
          </h2>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert("Generate Delivery Challan functionality placeholder.")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow"
            >
              📄 Generate Delivery Challan
            </button>
            <button 
              onClick={() => {
                if (selectedRows.length === 1) {
                  router.push(`/dispatch-goods?poNumber=${selectedRows[0]}`);
                } else if (selectedRows.length > 1) {
                  alert("Please select only one PO for dispatch.");
                } else {
                  alert("Please select a PO first to dispatch goods.");
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow"
            >
              🚚 Dispatch Goods
            </button>
            {selectedRows.length > 0 && (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium text-sm rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                <CheckSquare className="w-4 h-4" />
                Process Selected ({selectedRows.length})
              </button>
            )}
          </div>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-slate-800/30 uppercase border-b border-neutral-200 dark:border-border">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedRows.length === orders.length && orders.length > 0} 
                  onChange={toggleAllRows}
                  className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-4 py-3 font-semibold">PO Number</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Logistics Step</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No active dispatch orders found.
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => (
                <tr key={idx} className="border-b border-neutral-100 dark:border-border/50 hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedRows.includes(order.poNumber)}
                      onChange={() => toggleRowSelection(order.poNumber)}
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{order.poNumber}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{order.customerName || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800">
                      {order.stage || 'Logistics'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    Step {order.logisticsStep || 1} of 6
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = `/api/dispatch/download-invoice/${order.poNumber}`;
                          a.download = `Invoice_${order.poNumber}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => router.push(`/dispatch-management?poNumber=${order.poNumber}`)}
                        className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                        title="Process Order"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header Actions (only shown if not in a specific workflow, or shown always for general access) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-card p-4 rounded-xl border border-neutral-200 dark:border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            Dispatch Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and monitor all outbound goods and logistics workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/vendors')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            👥 Manage Vendors
          </button>
        </div>
      </div>

      {poNumber ? (
        <>
          <WorkflowIndicator currentStep="Logistics" />

          {/* Specific Order Details */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-sm font-bold border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-1.5">
              <Archive className="w-4 h-4" />
              PO: {poNumber}
            </span>
            {currentOrder?.customerName && (
              <span className="text-neutral-500 dark:text-neutral-400 text-sm flex items-center gap-1.5">
                <span>•</span>
                <span>Customer: <strong className="text-neutral-800 dark:text-neutral-200">{currentOrder.customerName}</strong></span>
              </span>
            )}
            <button 
              onClick={() => router.push('/dispatch-management')}
              className="ml-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              Back to Dashboard
            </button>
          </div>

          <LogisticsWorkflowHeader
            currentStep={currentStep}
            completedSteps={completedSteps}
          />

          {orderArchived ? (
            <div className="bg-card rounded-xl shadow-sm border border-emerald-200 overflow-hidden mt-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="border-b border-emerald-100 px-6 py-8 bg-emerald-50/50 flex flex-col items-center text-center">
                <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-800">{t('logistics.fulfilled') || 'Order Fulfilled & Archived'}</h2>
                <p className="text-emerald-600 mt-2 max-w-md">
                  {(currentOrder?.poNumber || 'Order') + " " + (t('logistics.fulfilledDesc') || 'has been successfully delivered and closed.')}
                </p>
                <button 
                  onClick={() => router.push('/dispatch-management')}
                  className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Return to Active Orders
                </button>
              </div>
            </div>
          ) : (
            renderActiveSection()
          )}
        </>
      ) : (
        renderDashboardTable()
      )}

      {/* Dispatch Setup Modal */}
      {isSetupModalOpen && (
        <DispatchSetupModal 
          onClose={() => setIsSetupModalOpen(false)} 
          onSubmit={handleDispatchSetupSubmit} 
        />
      )}

    </div>
  );
}
