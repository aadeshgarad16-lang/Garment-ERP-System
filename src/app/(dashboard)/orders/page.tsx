"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  FileText, 
  MapPin, 
  Package, 
  Plus, 
  Save, 
  Trash2, 
  Upload, 
  User,
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Box,
  Calculator,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';

interface GarmentSpec {
  id: string;
  sku: string;
  size: string;
  design: string;
  quantity: number;
  stockAvailable: number;
  useExistingStock: number;
}

const mockOrders = [
  { id: 'PO-2026-001', customer: 'Acme Corp', orderDate: '2026-05-01', deliveryDate: '2026-05-20', status: 'In Production', amount: '$15,000.00' },
  { id: 'PO-2026-002', customer: 'Global Tech', orderDate: '2026-05-05', deliveryDate: '2026-05-25', status: 'Pending', amount: '$8,500.00' },
  { id: 'PO-2026-003', customer: 'Retail Group', orderDate: '2026-04-15', deliveryDate: '2026-05-10', status: 'Delivered', amount: '$22,000.00' },
  { id: 'PO-2026-004', customer: 'Fashion Inc', orderDate: '2026-05-10', deliveryDate: '2026-06-01', status: 'Cutting', amount: '$45,000.00' },
  { id: 'PO-2026-005', customer: 'Boutique Styles', orderDate: '2026-05-11', deliveryDate: '2026-05-30', status: 'Pending', amount: '$12,400.00' },
  { id: 'PO-2026-006', customer: 'Mega Mart', orderDate: '2026-04-01', deliveryDate: '2026-04-20', status: 'Cancelled', amount: '$5,000.00' },
  { id: 'PO-2026-007', customer: 'Urban Outfitters', orderDate: '2026-05-12', deliveryDate: '2026-06-15', status: 'In Production', amount: '$34,200.00' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [specs, setSpecs] = useState<GarmentSpec[]>([
    { id: '1', sku: '', size: '', design: '', quantity: 0, stockAvailable: 0, useExistingStock: 0 }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const isValidRow = (spec: GarmentSpec) => {
    return spec.useExistingStock <= spec.stockAvailable && spec.useExistingStock <= spec.quantity;
  };
  
  const isFormValid = specs.every(isValidRow);
  const totalQuantity = specs.reduce((sum, spec) => sum + (spec.quantity || 0), 0);
  const totalStockUsed = specs.reduce((sum, spec) => sum + (spec.useExistingStock || 0), 0);
  const totalProductionRequired = specs.reduce((sum, spec) => sum + Math.max(0, (spec.quantity || 0) - (spec.useExistingStock || 0)), 0);
  const partialFulfillmentPercentage = totalQuantity > 0 ? Math.round((totalStockUsed / totalQuantity) * 100) : 0;

  const addRow = () => {
    setSpecs([
      ...specs,
      { id: Math.random().toString(36).substring(7), sku: '', size: '', design: '', quantity: 0, stockAvailable: 0, useExistingStock: 0 }
    ]);
  };

  const removeRow = (id: string) => {
    if (specs.length > 1) {
      setSpecs(specs.filter(spec => spec.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof GarmentSpec, value: string | number) => {
    setSpecs(specs.map(spec => spec.id === id ? { ...spec, [field]: value } : spec));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Production': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cutting': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 font-sans pb-8">
      <WorkflowIndicator currentStep="Order Initiation" />
      
      {/* ----------------- ORDER INITIATION SECTION ----------------- */}
      <section className="space-y-6">
        {/* Form Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
              Order Initiation
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Create a new purchase order and garment specification</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button className="w-full sm:w-auto px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors font-medium text-sm">
              Cancel
            </button>
            <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              Save Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Purchase Order Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50">
                <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neutral-500" />
                  Purchase Order Information
                </h2>
              </div>
              
              <div className="p-4 sm:p-5 lg:p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-neutral-400" />
                      PO Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="e.g. PO-2023-001"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-neutral-400" />
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="Enter customer name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-neutral-400" />
                      Office Address
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow min-h-[80px]"
                      placeholder="Headquarters or billing address"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow min-h-[80px]"
                      placeholder="Where should the garments be delivered?"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                      PO Date <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-sm font-medium text-neutral-700 block mb-2">Upload PO File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer group">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto h-12 w-12 text-neutral-400 group-hover:text-blue-500 transition-colors flex items-center justify-center bg-white rounded-full shadow-sm border border-neutral-200">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div className="flex text-sm text-neutral-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-neutral-500">PDF, DOCX, JPG up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Sidebar Form Column */}
          <div className="space-y-6">
            
            {/* Payment Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden sticky top-6">
              <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50">
                <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-neutral-500" />
                  Payment Details
                </h2>
              </div>
              
              <div className="p-4 sm:p-5 lg:p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 block">Payment Term</label>
                  <select className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none">
                    <option value="">Select term...</option>
                    <option value="net30">Net 30 Days</option>
                    <option value="net60">Net 60 Days</option>
                    <option value="upon_receipt">Due Upon Receipt</option>
                    <option value="advance">50% Advance, 50% on Delivery</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-neutral-400" />
                    PO Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 sm:text-sm">$</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-neutral-400" />
                    Advance Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 sm:text-sm">$</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-neutral-300 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-neutral-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">Subtotal</span>
                    <span className="font-medium text-neutral-900">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500">Tax (0%)</span>
                    <span className="font-medium text-neutral-900">$0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold mt-4 pt-4 border-t border-neutral-100">
                    <span className="text-neutral-900">Total Amount</span>
                    <span className="text-blue-600">$0.00</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Garment Specifications Card - Full Width Below */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mt-6">
          <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Package className="h-5 w-5 text-neutral-500" />
              Garment Specifications
            </h2>
            <button 
              onClick={addRow}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                  <th className="px-4 py-3 min-w-[120px]">SKU</th>
                  <th className="px-4 py-3 min-w-[100px]">Size</th>
                  <th className="px-4 py-3 min-w-[150px]">Design</th>
                  <th className="px-4 py-3 min-w-[120px]">Quantity</th>
                  <th className="px-4 py-3 min-w-[120px]">Stock Avail.</th>
                  <th className="px-4 py-3 min-w-[120px]">Use Stock</th>
                  <th className="px-4 py-3 min-w-[120px]">Prod. Req.</th>
                  <th className="px-4 py-3 w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {specs.map((spec) => (
                  <tr key={spec.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        value={spec.sku}
                        onChange={(e) => updateRow(spec.id, 'sku', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. TS-001"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        value={spec.size}
                        onChange={(e) => updateRow(spec.id, 'size', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. M, L, XL"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        value={spec.design}
                        onChange={(e) => updateRow(spec.id, 'design', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. V-Neck Logo"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min="0"
                        value={spec.quantity || ''}
                        onChange={(e) => updateRow(spec.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min="0"
                        value={spec.stockAvailable || ''}
                        onChange={(e) => updateRow(spec.id, 'stockAvailable', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <input 
                          type="number" 
                          min="0"
                          value={spec.useExistingStock || ''}
                          onChange={(e) => updateRow(spec.id, 'useExistingStock', parseInt(e.target.value) || 0)}
                          className={`w-full px-3 py-1.5 bg-white border ${!isValidRow(spec) ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-blue-500 focus:border-blue-500'} text-neutral-900 rounded-md focus:outline-none focus:ring-2 text-sm transition-colors`}
                          placeholder="0"
                        />
                        {!isValidRow(spec) && (
                          <span className="text-[10px] text-red-500 font-medium leading-tight max-w-[120px]">Invalid allocation</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-neutral-900">{Math.max(0, (spec.quantity || 0) - (spec.useExistingStock || 0))}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => removeRow(spec.id)}
                        disabled={specs.length === 1}
                        className={`p-1.5 rounded-md transition-colors ${specs.length === 1 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-400 hover:text-red-600 hover:bg-red-50'}`}
                        title="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-between items-center text-sm">
            <span className="text-neutral-500">Total Items: <span className="font-medium text-neutral-900">{specs.length}</span></span>
            <span className="text-neutral-500 hidden sm:inline-block italic text-xs">Production Qty = Order Qty - Existing Stock Used</span>
            <span className="text-neutral-500">Total Quantity: <span className="font-medium text-neutral-900">{totalQuantity}</span></span>
          </div>
        </div>

        {/* Stock Calculation Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mt-6">
          <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Box className="h-5 w-5 text-neutral-500" />
              Stock Calculation
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-800 mb-1">Total Garment Requirement</p>
                <p className="text-2xl font-bold text-blue-900">{totalQuantity}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-sm font-medium text-emerald-800 mb-1">Stock Allocated</p>
                <p className="text-2xl font-bold text-emerald-900">{totalStockUsed}</p>
                <p className="text-xs text-emerald-700 mt-1">Partial fulfillment: {partialFulfillmentPercentage}%</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-amber-800 mb-1">New Production Requirement</p>
                <p className="text-2xl font-bold text-amber-900">{totalProductionRequired}</p>
                <p className="text-xs text-amber-700 mt-1">Units to be manufactured</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                {!isFormValid && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Please resolve stock allocation errors before proceeding.</p>
                )}
                {isFormValid && totalProductionRequired === 0 && totalQuantity > 0 && (
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Order can be fulfilled entirely using existing stock.</p>
                )}
              </div>
              <button 
                onClick={() => router.push('/bom-calculation')}
                disabled={!isFormValid || totalProductionRequired === 0 || totalQuantity === 0}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                  !isFormValid || totalProductionRequired === 0 || totalQuantity === 0 
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Proceed to Generate BOM
                <Calculator className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- ORDERS HISTORY SECTION ----------------- */}
      <section className="pt-6 border-t border-neutral-200">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          
          {/* Header & Controls */}
          <div className="border-b border-neutral-200 px-6 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-neutral-500" />
                Orders History
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search PO or Customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-neutral-900"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-neutral-400" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-neutral-900 appearance-none bg-white cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Cutting">Cutting</option>
                    <option value="In Production">In Production</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Order Date</th>
                  <th className="px-6 py-4">Delivery Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-neutral-700">{order.customer}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{order.orderDate}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{order.deliveryDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900 text-right">{order.amount}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Edit Order">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Order">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-8 w-8 text-neutral-300 mb-2" />
                        <p>No orders found matching your criteria.</p>
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
              Showing <span className="font-medium text-neutral-900">1</span> to <span className="font-medium text-neutral-900">{filteredOrders.length}</span> of <span className="font-medium text-neutral-900">{mockOrders.length}</span> results
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
      </section>

    </div>
  );
}
