"use client";

import React from 'react';
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

  // Mock data for the tables
  const orderProducts = [
    { id: 'PRD-001', poNumber: 'PO-2026-892A', type: 'Mens Casual Shirt', sku: 'SH-CAS-NVY-M', size: 'M', quantity: 500 },
    { id: 'PRD-002', poNumber: 'PO-2026-892B', type: 'Mens Casual Shirt', sku: 'SH-CAS-NVY-L', size: 'L', quantity: 600 },
    { id: 'PRD-003', poNumber: 'PO-2026-892C', type: 'Mens Casual Shirt', sku: 'SH-CAS-NVY-XL', size: 'XL', quantity: 400 },
  ];


  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8 pt-6">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm mb-2"
      >
        <ArrowLeft size={16} />
        Back to Outsource Options
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Summary: Complete Outsourcing</h1>
          <p className="text-slate-500 text-sm">Review the assigned outsource vendor details, product quantities, and allocated materials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tables */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Product & Quantity Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <ShoppingCart className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-slate-800">Product & Quantity Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
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
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-medium">{item.poNumber}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{item.type}</td>
                      <td className="px-6 py-4 text-slate-500">{item.sku}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{item.size}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">{item.quantity}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={4} className="px-6 py-4 text-right font-semibold text-slate-600">Total Order Units:</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-700 text-base">
                      {orderProducts.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>


        </div>

        {/* Right Column: Vendor Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Building2 className="text-blue-600" size={20} />
              Vendor Summary
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
                  TA
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">TechApparel Inc.</h3>
                  <p className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">Verified Partner</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <span className="text-slate-600">124 Industrial Park Rd.<br/>Garment District, NY 10001</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-slate-600">+1 (555) 019-2834</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-slate-400" />
                  <span className="text-slate-600">contact@techapparel.co</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-bold text-slate-800">ORD-2026-892</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Units:</span>
                  <span className="font-bold text-slate-800">1,500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Est. Delivery:</span>
                  <span className="font-bold text-slate-800">Nov 02, 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

