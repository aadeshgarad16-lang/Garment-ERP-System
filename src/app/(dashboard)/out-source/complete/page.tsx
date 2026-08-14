"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  ArrowLeft,
  ShoppingCart
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CompleteOutsourcedTracking() {
  const router = useRouter();

  const availableSuppliers = [
    { id: 'v1', name: 'TechApparel Inc.', initials: 'TA', status: 'Verified Partner', address: '124 Industrial Park Rd.\nGarment District, NY 10001', phone: '+1 (555) 019-2834', email: 'contact@techapparel.co' },
    { id: 'v2', name: 'Global Stitches Ltd.', initials: 'GS', status: 'Premium Supplier', address: '45 Fabric Way', phone: '+1 (555) 123-4567', email: 'hello@globalstitches.com' },
    { id: 'v3', name: 'Metro Garments', initials: 'MG', status: 'Standard Partner', address: '89 Fashion Ave', phone: '+1 (555) 987-6543', email: 'info@metrogarments.com' },
  ];

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(['v1']);
  const [supplierAllocations, setSupplierAllocations] = useState<Record<string, number>>({
    'v1': 1500
  });

  const toggleSupplier = (vid: string) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(vid)) {
        return prev.filter(v => v !== vid);
      }
      return [...prev, vid];
    });
  };

  const updateAllocation = (vid: string, qty: number) => {
    setSupplierAllocations(prev => ({ ...prev, [vid]: qty }));
  };

  // Order products from active orders state
  const [orderProducts, setOrderProducts] = useState<any[]>([]);


  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8 pt-6">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 transition-colors font-medium text-sm mb-2"
      >
        <ArrowLeft size={16} />
        Back to Outsource Options
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Order Summary: Complete Outsourcing</h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm">Review the assigned outsource supplier details, product quantities, and allocated materials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tables */}
        <div className="space-y-6 lg:col-span-8">
          
          {/* Product & Quantity Breakdown Table */}
          <div className="bg-white dark:bg-background rounded-2xl border border-slate-200 dark:border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-border flex items-center gap-2 bg-slate-50 dark:bg-card/50 dark:bg-[#1a1a1a]">
              <ShoppingCart className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Product & Quantity Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-card text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-200 dark:border-border">
                  <tr>
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">Product Type</th>
                    <th className="px-6 py-4">SKU Code</th>
                    <th className="px-6 py-4 text-center">Size</th>
                    <th className="px-6 py-4 text-center">Order Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderProducts.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:bg-card/50 dark:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">{item.poNumber}</td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{item.type}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 dark:text-slate-500">{item.sku}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 dark:bg-[#202020] text-slate-700 dark:text-slate-200 px-2 py-1 rounded text-xs font-bold">{item.size}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100">{item.quantity}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 dark:bg-card border-t-2 border-slate-200 dark:border-border">
                    <td colSpan={4} className="px-6 py-4 text-right font-semibold text-slate-600 dark:text-slate-300">Total Order Units:</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700 text-base">
                      {orderProducts.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>


        </div>

        {/* Right Column: Supplier Details */}
        <div className="space-y-6 lg:col-span-4">
          <div className="bg-white dark:bg-background rounded-2xl border border-slate-200 dark:border-border p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Building2 className="text-blue-600" size={20} />
              Supplier Allocation
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Select Suppliers:</p>
                <div className="flex flex-col gap-2">
                  {availableSuppliers.map(supplier => (
                    <label key={supplier.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a1a1a] cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-neutral-800">
                      <input 
                        type="checkbox" 
                        checked={selectedSuppliers.includes(supplier.id)}
                        onChange={() => toggleSupplier(supplier.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:border-border dark:bg-[#202020]"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{supplier.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedSuppliers.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-border">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Assigned Capacities:</p>
                  {selectedSuppliers.map(vid => {
                    const supplier = availableSuppliers.find(v => v.id === vid);
                    if (!supplier) return null;
                    return (
                      <div key={vid} className="bg-slate-50 dark:bg-card rounded-xl p-4 border border-slate-100 dark:border-border space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                            {supplier.initials}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{supplier.name}</h4>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{supplier.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Units Assigned:</span>
                          <input 
                            type="number"
                            min="0"
                            value={supplierAllocations[vid] || ''}
                            onChange={(e) => updateAllocation(vid, parseInt(e.target.value) || 0)}
                            className="w-24 text-right bg-white dark:bg-background border border-slate-200 dark:border-border rounded px-2 py-1 text-sm font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

