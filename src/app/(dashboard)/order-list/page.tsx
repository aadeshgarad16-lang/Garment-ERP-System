"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateDisplay } from '@/utils/dateUtils';
import { Edit, Eye, List, X, ExternalLink, Calendar, DollarSign, Package, ArrowLeft } from 'lucide-react';
import { getAllOrdersAPI, Order } from '@/lib/api';

const allSteps = [
  'Order Initiation',
  'Order Specifications',
  'Stock Check',
  'BOM Calculation',
  'Inventory Check',
  'Material Allocation',
  'Procurement',
  'Material Release',
  'Production',
  'Quality & Packing',
  'Logistics',
  'Completed'
];

const displaySteps = [
  'Order Initiation',
  'Order Specifications',
  'Stock Check',
  'BOM Calculation',
  'Inventory Check',
  'Material Allocation',
  'Procurement',
  'Material Release',
  'Production'
];

const stepToUrlMap: { [key: string]: string } = {
  'Order Initiation': '/orders',
  'Order Specifications': '/order-specifications',
  'Stock Check': '/stock-calculation',
  'BOM Calculation': '/bom-calculation',
  'Inventory Check': '/inventory',
  'Material Allocation': '/material-allocation',
  'Procurement': '/procurement',
  'Material Release': '/material-release',
  'Production': '/production',
  'Quality & Packing': '/quality-packing',
  'Logistics': '/logistics',
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800 dark:bg-neutral-800/30 dark:text-blue-300';
    case 'DRAFT': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300';
  }
};

export default function OrderListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const fetchedOrders = await getAllOrdersAPI();
        // Sort by date descending (newest first)
        const sorted = fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(sorted);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleStageClick = (step: string) => {
    if (!selectedOrder) return;
    const urlPath = stepToUrlMap[step];
    if (!urlPath) return;

    // Depending on the stage, we pass either poNumber or resumeId
    if (step === 'Order Initiation') {
      router.push(`${urlPath}?resumeId=${selectedOrder.id}`);
    } else {
      router.push(`${urlPath}?poNumber=${encodeURIComponent(selectedOrder.poNumber || '')}&customerName=${encodeURIComponent(selectedOrder.customerName || '')}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <List className="h-6 w-6 text-indigo-600" />
            Order List
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all purchase orders</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-medium">
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date Created</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status / Stage</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                      {order.poNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                      {order.customerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                      {formatDateDisplay(order.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                      ₹{order.poAmount?.toLocaleString() || order.totalAmount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${getStatusColor(order.status)}`}>
                          {order.status || 'UNKNOWN'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.stage || 'Order Initiation'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(order)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors tooltip-trigger"
                          title="Edit Order"
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Edit Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  Edit Order: {selectedOrder.poNumber || 'Draft'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Current Stage: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{selectedOrder.stage || 'Order Initiation'}</span>
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-neutral-50/50 dark:bg-neutral-800/50">
              <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-300 bg-blue-50 dark:bg-neutral-800/20 border border-blue-100 dark:border-blue-800/50 p-3 rounded-lg flex gap-2 items-start">
                <ExternalLink className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p>Select a stage below to make edits. You can only edit information for stages up to the order's current stage. Future stages are locked until you progress the workflow.</p>
              </div>

              <div className="space-y-3">
                {displaySteps.map((step, index) => {
                  // Determine if step is enabled based on order stage
                  const currentStageIndex = Math.max(0, allSteps.indexOf(selectedOrder.stage || 'Order Initiation'));
                  const stepIndex = allSteps.indexOf(step);
                  
                  // If order is DRAFT, only Order Initiation is enabled
                  // Otherwise, enabled if stepIndex <= currentStageIndex
                  const isDraft = selectedOrder.status === 'DRAFT';
                  const isEnabled = isDraft ? stepIndex === 0 : stepIndex <= currentStageIndex;

                  return (
                    <button
                      key={step}
                      onClick={() => isEnabled && handleStageClick(step)}
                      disabled={!isEnabled}
                      className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${
                        isEnabled 
                          ? 'bg-card border-border shadow-sm hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md cursor-pointer group'
                          : 'bg-muted/50 border-border/50 text-neutral-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
                          isEnabled 
                            ? 'bg-blue-100 text-blue-700 dark:bg-neutral-800/30 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors'
                            : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className={`font-semibold ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step}
                          </p>
                          {isEnabled && step === (selectedOrder.stage || 'Order Initiation') && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Current active stage</p>
                          )}
                        </div>
                      </div>
                      
                      {isEnabled && (
                        <div className="text-neutral-400 group-hover:text-blue-500 transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
