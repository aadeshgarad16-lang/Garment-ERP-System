"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Package, Truck, Building2, ExternalLink } from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';

interface ReviewItem {
  id: string;
  material: string;
  shortage: number;
  cost: number;
  unit: string;
  orderQty: number;
  orderCost: number;
}

interface SupplierGroup {
  supplierName: string;
  items: ReviewItem[];
}

export default function ReviewPurchaseOrdersPage() {
  const router = useRouter();
  
  const [sessionData, setSessionData] = useState<SupplierGroup[]>([]);
  const [supplierStatus, setSupplierStatus] = useState<Record<string, { status: 'pending' | 'success', poNumber?: string }>>({});
  
  const [branch, setBranch] = useState('Main Plant');
  const [transportMode, setTransportMode] = useState('Road Transport');

  useEffect(() => {
    const data = localStorage.getItem('review_po_session');
    if (data) {
      try {
        const parsed: SupplierGroup[] = JSON.parse(data);
        setSessionData(parsed);
        const initialStatus: Record<string, { status: 'pending' | 'success' }> = {};
        parsed.forEach(group => {
          initialStatus[group.supplierName] = { status: 'pending' };
        });
        setSupplierStatus(initialStatus);
      } catch (e) {
        console.error("Failed to parse review_po_session", e);
      }
    }
  }, []);

  const handleCreatePO = (supplierName: string) => {
    // Simulate backend submission
    const fakePoNumber = `PO-${supplierName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    setSupplierStatus(prev => ({
      ...prev,
      [supplierName]: { status: 'success', poNumber: fakePoNumber }
    }));
  };

  const handleCreateAll = () => {
    const newStatus = { ...supplierStatus };
    sessionData.forEach(group => {
      if (newStatus[group.supplierName]?.status === 'pending') {
        const fakePoNumber = `PO-${group.supplierName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        newStatus[group.supplierName] = { status: 'success', poNumber: fakePoNumber };
      }
    });
    setSupplierStatus(newStatus);
  };

  const allSuccess = sessionData.length > 0 && sessionData.every(group => supplierStatus[group.supplierName]?.status === 'success');

  return (
    <div className="max-w-[1200px] mx-auto space-y-4 sm:space-y-6 font-sans pb-12 pt-6">
      <WorkflowIndicator currentStep="Procurement" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <button 
            onClick={() => router.push('/procurement')}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Procurement Requests
          </button>
          <h1 className="text-2xl font-bold text-foreground">Review Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Batch process your pending purchase orders across {sessionData.length} suppliers.
          </p>
        </div>
        
        {sessionData.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/procurement')}
              className="px-6 py-2.5 bg-card border border-border text-foreground font-medium rounded-lg shadow-sm hover:bg-muted transition-colors"
            >
              Edit All
            </button>
            <button
              onClick={handleCreateAll}
              disabled={allSuccess}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {allSuccess ? 'All POs Created' : 'Create All POs at Once'}
            </button>
          </div>
        )}
      </div>

      {/* Global Settings */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Global Delivery Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">Delivery Branch</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-neutral-400" />
              </div>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-background text-foreground"
              >
                <option value="Main Plant">Main Plant</option>
                <option value="Warehouse B">Warehouse B</option>
                <option value="Store Location">Store Location</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">Transport Mode</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Truck className="h-4 w-4 text-neutral-400" />
              </div>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-background text-foreground"
              >
                <option value="Road Transport">Road Transport</option>
                <option value="Air Freight">Air Freight</option>
                <option value="Sea Freight">Sea Freight</option>
                <option value="Hand Carry">Hand Carry</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="space-y-6">
        {sessionData.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pending purchase orders found in this session.</p>
          </div>
        ) : (
          sessionData.map((group, index) => {
            const statusInfo = supplierStatus[group.supplierName];
            const isSuccess = statusInfo?.status === 'success';
            
            // Calculate totals
            const totalItems = group.items.reduce((sum, item) => sum + item.orderQty, 0);
            const totalCost = group.items.reduce((sum, item) => sum + item.orderCost, 0);
            
            return (
              <div key={index} className={`bg-card border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${isSuccess ? 'border-emerald-200' : 'border-border'}`}>
                <div className={`px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isSuccess ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100' : 'bg-neutral-50 dark:bg-card/30'}`}>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{group.supplierName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.items.length} materials • {totalItems} total items • Estimated: Rs. {totalCost.toFixed(2)}
                    </p>
                  </div>
                  
                  {isSuccess ? (
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        PO Created
                      </span>
                      {statusInfo.poNumber && (
                        <button className="flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          View {statusInfo.poNumber}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push('/procurement')}
                        className="px-4 py-2 bg-background border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors text-sm"
                      >
                        Edit PO
                      </button>
                      <button
                        onClick={() => handleCreatePO(group.supplierName)}
                        className="px-5 py-2 bg-foreground text-background font-medium rounded-lg shadow hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm"
                      >
                        Create PO
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium bg-muted/30">
                        <th className="px-6 py-3">Material</th>
                        <th className="px-6 py-3 text-right">Order Qty</th>
                        <th className="px-6 py-3 text-right">Est. Cost (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {group.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-3 text-sm text-foreground">
                            {item.material}
                            <div className="text-xs text-muted-foreground mt-0.5">Shortage: {item.shortage}</div>
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-foreground text-right">
                            {item.orderQty} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                          </td>
                          <td className="px-6 py-3 text-sm text-foreground text-right">
                            {item.orderCost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
