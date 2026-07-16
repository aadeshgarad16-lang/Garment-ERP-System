"use client";

import React, { useState } from 'react';
import { Layers, ChevronDown, CheckCircle2, Box, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProductionMaterialAllocation() {
  const router = useRouter();
  const [selectedVendor, setSelectedVendor] = useState('');
  
  // Mock BOM data
  const [materials, setMaterials] = useState([
    { id: 'MAT-001', name: 'Cotton Fabric (White)', category: 'Fabric', stock: 1250, required: 1000, allocated: 0, unit: 'meters' },
    { id: 'MAT-002', name: 'Polyester Thread (Navy)', category: 'Thread', stock: 120, required: 100, allocated: 0, unit: 'spools' },
    { id: 'MAT-003', name: 'Standard Collar (White)', category: 'Components', stock: 800, required: 600, allocated: 0, unit: 'pieces' },
  ]);

  const vendors: any[] = [];

  const handleAllocationChange = (id: string, value: string) => {
    const qty = parseInt(value, 10) || 0;
    setMaterials(materials.map(mat => 
      mat.id === id ? { ...mat, allocated: Math.min(qty, mat.stock) } : mat
    ));
  };

  const totalAllocated = materials.reduce((sum, mat) => sum + mat.allocated, 0);
  const totalRequired = materials.reduce((sum, mat) => sum + mat.required, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8 pt-6">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 transition-colors font-medium text-sm mb-2"
      >
        <ArrowLeft size={16} />
        Back to Outsource Options
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Layers className="text-emerald-600" />
          Production Material Allocation
        </h1>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm">Assign and dispatch raw warehouse materials to specific production vendors for assembly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Vendor Selection */}
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">1. Select Vendor</h2>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all cursor-pointer font-medium"
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
              >
                <option value="" disabled>Choose a production vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
            </div>
          </div>

          {/* BOM Allocation Table */}
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50 dark:bg-[#18181b]/50 dark:bg-[#1a1a1a]">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">2. Material Dispatch List (BOM)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-[#18181b] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4">Material Item</th>
                    <th className="px-6 py-4 text-center">Required</th>
                    <th className="px-6 py-4 text-center">In Stock</th>
                    <th className="px-6 py-4 text-center">Allocate Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map(mat => (
                    <tr key={mat.id} className="hover:bg-slate-50 dark:bg-[#18181b]/50 dark:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{mat.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{mat.id} &bull; {mat.category}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{mat.required}</span> <span className="text-xs">{mat.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${mat.stock >= mat.required ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded' : 'text-amber-600 bg-amber-50 px-2 py-1 rounded'}`}>
                          {mat.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number"
                            min="0"
                            max={mat.stock}
                            value={mat.allocated || ''}
                            onChange={(e) => handleAllocationChange(mat.id, e.target.value)}
                            placeholder="0"
                            className="w-24 border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-center text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-medium"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Box className="text-emerald-600" size={20} />
              Dispatch Summary
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">Selected Vendor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                  {selectedVendor ? vendors.find(v => v.id === selectedVendor)?.name : <span className="text-slate-400 dark:text-slate-500 italic">None selected</span>}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">Total Required Units:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{totalRequired}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-100 dark:border-neutral-800">
                <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">Total Allocated Units:</span>
                <span className={`font-bold ${totalAllocated > 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'}`}>{totalAllocated}</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  <span>Fulfillment Progress</span>
                  <span>{Math.round((totalAllocated / totalRequired) * 100) || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#202020] rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((totalAllocated / totalRequired) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  disabled={!selectedVendor || totalAllocated === 0}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    selectedVendor && totalAllocated > 0
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                      : 'bg-slate-100 dark:bg-[#202020] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 size={18} />
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

