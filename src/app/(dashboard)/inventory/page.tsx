"use client";

import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Truck, 
  DollarSign,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Box,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';

const mockInventory = [
  { id: 'MAT-001', name: 'Cotton Fabric (White)', category: 'Fabric', available: 1250, required: 1000, unit: 'meters' },
  { id: 'MAT-002', name: 'Polyester Thread (Navy)', category: 'Thread', available: 120, required: 200, unit: 'spools' },
  { id: 'MAT-003', name: 'Metal Zippers 15cm', category: 'Zippers', available: 45, required: 0, unit: 'units' },
  { id: 'MAT-004', name: 'Plastic Buttons (Black)', category: 'Buttons', available: 5000, required: 5000, unit: 'pieces' },
  { id: 'MAT-005', name: 'Denim Fabric (Blue)', category: 'Fabric', available: 0, required: 800, unit: 'meters' },
  { id: 'MAT-006', name: 'Standard Collar (White)', category: 'Collar/Cuff', available: 800, required: 600, unit: 'pieces' },
  { id: 'MAT-007', name: 'Metal Hooks (Silver)', category: 'Hooks', available: 150, required: 300, unit: 'pieces' },
  { id: 'MAT-008', name: 'Linen Fabric (Beige)', category: 'Fabric', available: 320, required: 0, unit: 'meters' },
];

const categories = ['All Categories', 'Fabric', 'Thread', 'Buttons', 'Zippers', 'Collar/Cuff', 'Hooks'];

export default function InventoryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  // BOM-driven validation logic
  const validationData = mockInventory.map(item => {
    const shortage = Math.max(0, item.required - item.available);
    let status = 'Sufficient';
    if (shortage > 0) {
      status = item.available === 0 ? 'Critical' : 'Low Stock';
    }
    return { ...item, shortage, status };
  });

  const requiredItems = validationData.filter(item => item.required > 0);
  const fullyAvailableCount = requiredItems.filter(item => item.status === 'Sufficient').length;
  const partiallyAvailableCount = requiredItems.filter(item => item.status === 'Low Stock').length;
  const criticalCount = requiredItems.filter(item => item.status === 'Critical').length;
  
  const hasShortage = partiallyAvailableCount > 0 || criticalCount > 0;
  const readinessStatus = hasShortage ? 'Procurement Required' : 'Ready for Allocation';

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Sufficient': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Low Stock': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const filteredInventory = validationData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Inventory Check" />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Box className="h-6 w-6 text-blue-600" />
            Inventory Validation
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Validate BOM requirements against available stock</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            onClick={() => router.push('/material-allocation')}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              hasShortage 
                ? 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <ListChecks className="h-4 w-4" />
            Allocate Materials {hasShortage && '(Partial)'}
          </button>
          <button 
            onClick={() => router.push('/procurement')}
            disabled={!hasShortage}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              !hasShortage 
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Truck className="h-4 w-4" />
            Create Purchase Request
          </button>
        </div>
      </div>

      {/* Allocation Preview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Fully Available</p>
            <p className="text-2xl font-bold text-neutral-900">{fullyAvailableCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Partially Available</p>
            <p className="text-2xl font-bold text-neutral-900">{partiallyAvailableCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Critical Shortages</p>
            <p className="text-2xl font-bold text-neutral-900">{criticalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${hasShortage ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
            <Layers className={`h-6 w-6 ${hasShortage ? 'text-indigo-600' : 'text-emerald-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">Readiness Status</p>
            <p className={`text-sm font-bold mt-1 ${hasShortage ? 'text-indigo-600' : 'text-emerald-600'}`}>{readinessStatus}</p>
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        
        {/* Table Header & Controls */}
        <div className="border-b border-neutral-200 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-neutral-800">Materials Inventory</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-neutral-900"
                />
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-neutral-400" />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-neutral-900 appearance-none bg-white cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                <th className="px-6 py-4">Material Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Required Qty</th>
                <th className="px-6 py-4 text-right">Available Qty</th>
                <th className="px-6 py-4 text-right">Shortage Qty</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-neutral-900">{item.name}</span>
                          <span className="text-xs text-neutral-500">{item.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{item.category}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">{item.required.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-sm text-neutral-600">{item.available.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-red-600">{item.shortage > 0 ? item.shortage.toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{item.unit}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Material Details">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-neutral-300 mb-2" />
                      <p>No materials found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing <span className="font-medium text-neutral-900">1</span> to <span className="font-medium text-neutral-900">{filteredInventory.length}</span> of <span className="font-medium text-neutral-900">{mockInventory.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-neutral-300 rounded-md bg-white text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="p-2 border border-neutral-300 rounded-md bg-white text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
      </div>

    </div>
  );
}
