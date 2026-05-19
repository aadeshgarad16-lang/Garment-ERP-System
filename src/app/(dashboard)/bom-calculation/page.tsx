"use client";

import React, { useState } from 'react';
import { 
  Calculator, 
  FileText, 
  Settings, 
  Download, 
  Truck, 
  DollarSign, 
  Scissors, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Box
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';

// Mock Data
const orders = [
  { 
    id: 'PO-2026-004', 
    customer: 'Fashion Inc', 
    items: [
      { id: '1', sku: 'DJ-001', size: 'M', design: 'Denim Jacket', quantity: 600, useExistingStock: 100 },
      { id: '2', sku: 'DJ-002', size: 'L', design: 'Denim Jacket', quantity: 400, useExistingStock: 300 }
    ]
  },
  { 
    id: 'PO-2026-001', 
    customer: 'Acme Corp', 
    items: [
      { id: '3', sku: 'WT-001', size: 'S', design: 'White T-Shirt', quantity: 2500, useExistingStock: 2500 }
    ]
  },
  { 
    id: 'PO-2026-007', 
    customer: 'Urban Outfitters', 
    items: [
      { id: '4', sku: 'WC-001', size: 'XL', design: 'Winter Coat', quantity: 500, useExistingStock: 0 }
    ]
  },
];

const mockMaterials = [
  { id: 'denimFabric12oz', name: 'Denim Fabric (12oz)', category: 'Fabric', perPiece: 1.5, unit: 'meters', available: 800 },
  { id: 'heavyDutyThreadNavy', name: 'Heavy Duty Thread (Navy)', category: 'Thread', perPiece: 0.1, unit: 'spools', available: 120 },
  { id: 'metalZippers15cm', name: 'Metal Zippers 15cm', category: 'Zippers', perPiece: 1, unit: 'units', available: 45 },
  { id: 'metalButtonsSilver', name: 'Metal Buttons (Silver)', category: 'Buttons', perPiece: 6, unit: 'units', available: 5000 },
  { id: 'brandTagsWoven', name: 'Brand Tags (Woven)', category: 'Collar/Cuff', perPiece: 1, unit: 'units', available: 5000 },
  { id: 'collarHooks', name: 'Collar Hooks', category: 'Hooks', perPiece: 2, unit: 'units', available: 3000 },
];

export default function BOMCalculationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPO, setSelectedPO] = useState('PO-2026-004');
  const [wastage, setWastage] = useState(5);

  const currentOrder = orders.find(o => o.id === selectedPO) || orders[0];
  const totalProductionRequired = currentOrder.items.reduce((sum, item) => sum + Math.max(0, item.quantity - item.useExistingStock), 0);

  // Calculate BOM data dynamically
  const calculatedMaterials = mockMaterials.map(mat => {
    const baseRequired = mat.perPiece * totalProductionRequired;
    const wastageAmount = baseRequired * (wastage / 100);
    const finalQuantity = Math.ceil(baseRequired + wastageAmount);
    
    const missing = Math.max(0, finalQuantity - mat.available);
    
    let status = 'Available';
    if (missing > 0) status = 'Procurement Required';
    else if (mat.available - finalQuantity < (finalQuantity * 0.2)) status = 'Low Stock'; // less than 20% buffer left

    const stockRatio = finalQuantity > 0 ? Math.min(100, Math.round((mat.available / finalQuantity) * 100)) : 100;

    return {
      ...mat,
      baseRequired,
      wastageAmount,
      finalQuantity,
      missing,
      status,
      stockRatio
    };
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Available': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Low Stock': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Procurement Required': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch(status) {
      case 'Available': return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'Low Stock': return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'Procurement Required': return <AlertCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  // Aggregates
  const totalFabric = calculatedMaterials.filter(m => m.category === 'Fabric').reduce((acc, curr) => acc + curr.finalQuantity, 0);
  const totalAllied = calculatedMaterials.filter(m => m.category !== 'Fabric').reduce((acc, curr) => acc + curr.finalQuantity, 0);
  const itemsToProcure = totalProductionRequired > 0 ? calculatedMaterials.filter(m => m.missing > 0).length : 0;
  // Mock estimation: $5 per meter of fabric, $0.5 per allied material
  const estimatedCost = (totalFabric * 5) + (totalAllied * 0.5);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="BOM Calculation" />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-indigo-600" />
            {t('bom.title')}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">{t('bom.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Order Selection Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-5 py-4 bg-neutral-50/50">
              <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-neutral-500" />
                {t('bom.config')}
              </h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider">{t('bom.po')}</label>
                <select 
                  value={selectedPO}
                  onChange={(e) => setSelectedPO(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                >
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>{order.id} - {order.customer}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">{t('bom.customer')}</p>
                <p className="text-sm font-medium text-neutral-900">{currentOrder.customer}</p>
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-neutral-700 uppercase tracking-wider">{t('bom.details')}</p>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                    {t('bom.totalProd')}: {totalProductionRequired} pcs
                  </span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {currentOrder.items.map(item => (
                    <div key={item.id} className="bg-neutral-50 p-2 rounded border border-neutral-100 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{item.sku} - {item.design}</p>
                        <p className="text-xs text-neutral-500">Size: {item.size} | Ord Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">{t('orderInitiation.garmentSpecifications.table.prodReq') || 'Prod Req.'}</p>
                        <p className="text-sm font-bold text-indigo-700">{Math.max(0, item.quantity - item.useExistingStock)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-neutral-100">
                <label className="text-xs font-medium text-neutral-700 uppercase tracking-wider flex justify-between">
                  <span>{t('bom.wastage')}</span>
                  <span className="text-indigo-600 font-bold">{wastage}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="15" 
                  value={wastage}
                  onChange={(e) => setWastage(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-xs text-neutral-500 mt-2 text-right">{t('orderInitiation.garmentSpecifications.table.prodReq') || 'Production Qty'}: <strong>{totalProductionRequired}</strong> pcs</p>
              </div>
            </div>
          </div>

          {/* Procurement Trigger Panel */}
          {itemsToProcure > 0 && (
            <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg border border-red-200 flex-shrink-0">
                    <ShoppingCart className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-800">{t('procurement.requestsHeader') || 'Procurement Needed'}</h3>
                    <p className="text-xs text-red-600 mt-1">{itemsToProcure} {t('bom.shortages') || 'materials are short for this order.'}</p>
                  </div>
                </div>
                <button onClick={() => router.push('/procurement')} className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                  <Truck className="h-4 w-4" />
                  {t('procurement.createRequest') || 'Trigger Procurement'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main BOM Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* BOM Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Scissors className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-neutral-500 uppercase">{t('bom.fabric')}</p>
              </div>
              <p className="text-xl font-bold text-neutral-900">{totalFabric.toLocaleString()} <span className="text-sm font-normal text-neutral-500">{t('orderInitiation.garmentSpecifications.table.meters') || 'meters'}</span></p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-xs font-medium text-neutral-500 uppercase">{t('bom.allied')}</p>
              </div>
              <p className="text-xl font-bold text-neutral-900">{totalAllied.toLocaleString()} <span className="text-sm font-normal text-neutral-500">{t('orderInitiation.garmentSpecifications.table.pieces') || 'units'}</span></p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xs font-medium text-neutral-500 uppercase">{t('bom.cost')}</p>
              </div>
              <p className="text-xl font-bold text-neutral-900">₹{estimatedCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Box className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-xs font-medium text-neutral-500 uppercase">{t('bom.shortages')}</p>
              </div>
              <p className="text-xl font-bold text-neutral-900">{itemsToProcure} <span className="text-sm font-normal text-neutral-500">{t('procurement.requestsHeader') || 'materials'}</span></p>
            </div>
          </div>

          {/* Materials Calculation Table */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-5 flex justify-between items-center bg-neutral-50/50">
              <h2 className="text-lg font-semibold text-neutral-800">{t('bom.materials')}</h2>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="bg-white border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    <th className="px-6 py-4">{t('inventoryVal.materialsHeader') || 'Material'}</th>
                    <th className="px-6 py-4">{t('orderInitiation.garmentSpecifications.table.unit') || 'Unit'}</th>
                    <th className="px-6 py-4 text-right">{t('orderInitiation.garmentSpecifications.table.perPiece') || 'Per Piece'}</th>
                    <th className="px-6 py-4 text-right">{t('orderInitiation.garmentSpecifications.table.baseQty') || 'Base Qty'}</th>
                    <th className="px-6 py-4 text-right">{t('bom.wastage') || 'Wastage %'}</th>
                    <th className="px-6 py-4 text-right">{t('orderInitiation.garmentSpecifications.table.finalQty') || 'Final Qty'}</th>
                    <th className="px-6 py-4">{t('orderInitiation.garmentSpecifications.table.stockUtil') || 'Stock Util.'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {calculatedMaterials.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-neutral-900">{t(`dashboard.stockAlerts.items.${item.id}`) || item.name}</span>
                          <span className="text-xs text-neutral-500">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-600">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-neutral-600">{item.perPiece}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-neutral-900">{item.baseRequired.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-neutral-600">{wastage}% <span className="text-xs text-neutral-400">(+{Math.ceil(item.wastageAmount)})</span></span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-indigo-700">{item.finalQuantity.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full min-w-[100px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={`${item.stockRatio < 100 ? 'text-red-600' : 'text-emerald-600'} font-medium`}>{item.stockRatio}%</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden flex">
                            <div 
                              className={`h-1.5 ${item.stockRatio < 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${item.stockRatio}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 text-xs text-neutral-500 flex justify-between">
              <p>{t('bom.wastage') || 'Calculations include wastage margin.'}</p>
              <p>{t('dashboard.recentOrders.headers.amount') || 'Last recalculated: Just now'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mt-6">
            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                {totalProductionRequired === 0 && (
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> 
                    {t('orderInitiation.garmentSpecifications.summary.formula') || 'No BOM required. Order fulfilled using existing stock.'}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 py-2.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  {t('bom.export')}
                </button>
                <button 
                  onClick={() => router.push('/inventory')}
                  disabled={totalProductionRequired === 0}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                    totalProductionRequired === 0 
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {t('bom.checkInventory')}
                  <Box className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
