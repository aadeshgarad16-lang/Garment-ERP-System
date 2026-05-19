"use client";

import React, { useState } from 'react';
import { 
  Truck, 
  Clock, 
  FileCheck, 
  AlertTriangle, 
  DollarSign,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  ListChecks,
  X,
  Star,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';

// Mock Data representing Shortages from Inventory
const mockShortages = [
  { id: 'PR-2026-101', material: 'Denim Fabric (Blue)', category: 'Fabric', required: 800, available: 0, shortage: 800, unit: 'meters', supplier: 'TexMill Global', cost: 4000, priority: 'Critical', status: 'Pending Procurement' },
  { id: 'PR-2026-102', material: 'Polyester Thread (Navy)', category: 'Thread', required: 200, available: 120, shortage: 80, unit: 'spools', supplier: 'StitchCo', cost: 160, priority: 'Medium', status: 'Vendor Assigned' },
  { id: 'PR-2026-103', material: 'Metal Hooks (Silver)', category: 'Hooks', required: 300, available: 150, shortage: 150, unit: 'pieces', supplier: 'ZipCorp', cost: 45, priority: 'High', status: 'Ordered' },
];

const mockSuppliers = [
  { name: 'TexMill Global', materials: 'Fabric, Denim', performance: 98, status: 'Active', contact: 'sales@texmill.com', leadTime: '5-7 Days', preferred: true },
  { name: 'ZipCorp', materials: 'Zippers, Hooks', performance: 92, status: 'Active', contact: 'orders@zipcorp.com', leadTime: '2-3 Days', preferred: true },
  { name: 'StitchCo', materials: 'Thread, Needles', performance: 85, status: 'Under Review', contact: 'supply@stitchco.com', leadTime: '4-6 Days', preferred: false },
  { name: 'ButtonWorks', materials: 'Buttons, Fasteners', performance: 99, status: 'Active', contact: 'hello@buttonworks.com', leadTime: '2-5 Days', preferred: true },
];

const timelineSteps = [
  { label: 'Request Created', date: 'May 10, 10:30 AM', completed: true },
  { label: 'Approved', date: 'May 11, 09:15 AM', completed: true },
  { label: 'Ordered', date: 'May 11, 02:45 PM', completed: true },
  { label: 'In Transit', date: 'May 13, 08:00 AM', completed: true },
  { label: 'Delivered', date: 'Expected May 14', completed: false },
];

export default function ProcurementPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showPRModal, setShowPRModal] = useState(false);

  const totalShortages = mockShortages.length;
  const criticalItems = mockShortages.filter(i => i.priority === 'Critical').length;
  const estimatedCost = mockShortages.reduce((acc, curr) => acc + curr.cost, 0);

  const getPriorityStyle = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'High': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Pending Procurement': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Vendor Assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Ordered': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Awaiting Delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const filteredShortages = mockShortages.filter(item => {
    const matchesSearch = item.material.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Procurement" />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            {t('procurement.title')}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">{t('procurement.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <button 
            onClick={() => setShowPRModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('procurement.createRequest')}
          </button>
          <button 
            onClick={() => router.push('/material-allocation')}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <ListChecks className="h-4 w-4" />
            {t('procurement.continueAllocation')}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">{t('procurement.shortageItems')}</p>
            <p className="text-2xl font-bold text-neutral-900">{totalShortages}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">{t('procurement.estCost')}</p>
            <p className="text-2xl font-bold text-neutral-900">₹{estimatedCost.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">{t('procurement.criticalItems')}</p>
            <p className="text-2xl font-bold text-neutral-900">{criticalItems}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100">
            <Clock className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500">{t('procurement.fulfillment')}</p>
            <p className="text-lg font-bold text-neutral-900 mt-1">{t('dashboard.recentOrders.status.pending')}</p>
          </div>
        </div>
      </div>

      {/* Procurement Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-neutral-800">{t('procurement.requestsHeader')}</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('inventoryVal.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-neutral-900"
                />
              </div>
              
              {/* Priority Filter */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-neutral-900 appearance-none bg-white cursor-pointer"
                >
                  <option value="All">{t('dashboard.recentOrders.headers.poNumber') || 'All Priorities'}</option>
                  <option value="Low">{t('dashboard.stockAlerts.severity.low') || 'Low'}</option>
                  <option value="Medium">{t('dashboard.recentOrders.headers.amount') || 'Medium'}</option>
                  <option value="High">{t('dashboard.recentOrders.headers.deliveryDate') || 'High'}</option>
                  <option value="Critical">{t('dashboard.stockAlerts.severity.critical') || 'Critical'}</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-neutral-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-neutral-900 appearance-none bg-white cursor-pointer"
                >
                  <option value="All">{t('dashboard.recentOrders.headers.poNumber') || 'All Statuses'}</option>
                  <option value="Pending Procurement">{t('dashboard.recentOrders.status.pending')}</option>
                  <option value="Vendor Assigned">{t('dashboard.recentOrders.headers.poNumber') || 'Vendor Assigned'}</option>
                  <option value="Ordered">{t('orderInitiation.header.saveOrder') || 'Ordered'}</option>
                  <option value="Awaiting Delivery">{t('dashboard.recentOrders.headers.deliveryDate') || 'Awaiting Delivery'}</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                <th className="px-6 py-4">{t('inventoryVal.materialsHeader')}</th>
                <th className="px-6 py-4 text-right">{t('orderInitiation.garmentSpecifications.table.quantity') || 'Required'}</th>
                <th className="px-6 py-4 text-right">{t('orderInitiation.garmentSpecifications.table.stockAvail') || 'Available'}</th>
                <th className="px-6 py-4 text-right">{t('bom.shortages') || 'Shortage'}</th>
                <th className="px-6 py-4 text-right">{t('bom.cost') || 'Est. Cost'}</th>
                <th className="px-6 py-4">{t('bom.customer') || 'Supplier'}</th>
                <th className="px-6 py-4">Priority & Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredShortages.length > 0 ? (
                filteredShortages.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-900">{t(`dashboard.stockAlerts.items.${item.material.replace(/\s+/g, '').replace(/[()]/g, '')}`) || item.material}</span>
                        <span className="text-xs text-neutral-500">{t(`orderInitiation.tracker.${item.category.toLowerCase()}`) || item.category} • {item.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-neutral-900">{item.required} <span className="text-xs text-neutral-500">{item.unit === 'meters' ? (t('dashboard.stockAlerts.footer.metersRemaining') || 'meters') : item.unit === 'spools' ? (t('dashboard.stockAlerts.footer.spoolsRemaining') || 'spools') : (t('dashboard.stockAlerts.footer.unitsRemaining') || 'units')}</span></td>
                    <td className="px-6 py-4 text-right text-sm text-neutral-600">{item.available}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-red-600">{item.shortage}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">₹{item.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                        {item.supplier}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyle(item.priority)}`}>
                          {item.priority === 'Critical' && <ShieldAlert className="h-3 w-3 mr-1" />}
                          {item.priority === 'Critical' ? (t('dashboard.stockAlerts.severity.critical') || 'Critical') : item.priority === 'High' ? (t('dashboard.recentOrders.headers.deliveryDate') || 'High') : item.priority === 'Medium' ? (t('dashboard.recentOrders.headers.amount') || 'Medium') : (t('dashboard.stockAlerts.severity.low') || 'Low')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                          {item.status === 'Pending Procurement' ? (t('dashboard.recentOrders.status.pending') || 'Pending') : item.status === 'Vendor Assigned' ? (t('dashboard.recentOrders.headers.poNumber') || 'Vendor Assigned') : (t('orderInitiation.header.saveOrder') || 'Ordered')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title={t('procurement.createRequest')}>
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-neutral-300 mb-2" />
                      <p>{t('dashboard.recentOrders.headers.poNumber') || 'No procurement requests found.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {t('dashboard.recentOrders.viewAll') || 'Showing'} <span className="font-medium text-neutral-900">1</span> {t('dashboard.recentOrders.headers.deliveryDate') || 'to'} <span className="font-medium text-neutral-900">{filteredShortages.length}</span> {t('dashboard.recentOrders.headers.customer') || 'of'} <span className="font-medium text-neutral-900">{mockShortages.length}</span>
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

      {/* Lower Section: Grid layout for Suppliers & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Supplier Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="border-b border-neutral-200 px-6 py-5 bg-neutral-50/50">
            <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-neutral-500" />
              {t('procurement.supplierDir') || 'Supplier Directory Summary'}
            </h2>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
              <thead>
                <tr className="bg-white border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                  <th className="px-6 py-4">{t('bom.customer') || 'Supplier Name'}</th>
                  <th className="px-6 py-4">{t('inventoryVal.materialsHeader') || 'Materials Supplied'}</th>
                  <th className="px-6 py-4">{t('procurement.leadTime') || 'Lead Time'}</th>
                  <th className="px-6 py-4">{t('procurement.performance') || 'Rating'}</th>
                  <th className="px-6 py-4">{t('dashboard.recentOrders.headers.status') || 'Status & Contact'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {mockSuppliers.map((supplier, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                          {supplier.name}
                          {supplier.preferred && <span title={t('procurement.preferredVendor') || 'Preferred Vendor'}><Star className="h-3 w-3 text-amber-500 fill-amber-500" /></span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{supplier.materials}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{supplier.leadTime}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[60px] bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${supplier.performance >= 95 ? 'bg-emerald-500' : supplier.performance >= 90 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${supplier.performance}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-neutral-700">{supplier.performance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${supplier.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {supplier.status === 'Active' ? (t('dashboard.stockAlerts.severity.low') || 'Active') : (t('dashboard.stockAlerts.severity.low') || 'Under Review')}
                        </span>
                        <div className="flex gap-2 text-neutral-400">
                          <button className="hover:text-blue-600 transition-colors" title={`Email ${supplier.contact}`}><Mail className="h-4 w-4" /></button>
                          <button className="hover:text-blue-600 transition-colors" title="Call Supplier"><Phone className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workflow Progression */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col">
          <div className="border-b border-indigo-100 px-6 py-5 bg-white/50 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              {t('procurement.procCompletion') || 'Procurement Completion'}
            </h2>
            <p className="text-xs text-indigo-600/80 mt-1">{t('procurement.nextSteps') || 'Next steps after shortage resolution'}</p>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-indigo-200">
              <div className="relative flex items-center group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white flex-shrink-0 z-10 border-indigo-600 text-indigo-600">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                </div>
                <div className="ml-4">
                  <span className="text-sm font-semibold text-neutral-900">{t('orderInitiation.tracker.procurement') || 'Procurement'}</span>
                  <p className="text-xs text-neutral-500">{t('procurement.shortageItems') || 'Shortage resolution'}</p>
                </div>
              </div>
              <div className="relative flex items-center group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white flex-shrink-0 z-10 border-indigo-400 text-indigo-400" />
                <div className="ml-4">
                  <span className="text-sm font-semibold text-neutral-600">{t('orderInitiation.tracker.materialAllocation') || 'Material Allocation'}</span>
                  <p className="text-xs text-neutral-400">{t('procurement.allocateWarehouse') || 'Allocate from warehouse'}</p>
                </div>
              </div>
              <div className="relative flex items-center group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white flex-shrink-0 z-10 border-neutral-300 text-transparent" />
                <div className="ml-4">
                  <span className="text-sm font-semibold text-neutral-400">{t('procurement.freezeMaterials') || 'Freeze Materials'}</span>
                  <p className="text-xs text-neutral-400">{t('procurement.lockStock') || 'Lock stock for PO'}</p>
                </div>
              </div>
              <div className="relative flex items-center group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white flex-shrink-0 z-10 border-neutral-300 text-transparent" />
                <div className="ml-4">
                  <span className="text-sm font-semibold text-neutral-400">{t('orderInitiation.tracker.production') || 'Production'}</span>
                  <p className="text-xs text-neutral-400">{t('procurement.beginMfg') || 'Begin manufacturing'}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => router.push('/material-allocation')}
              className="mt-8 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 group"
            >
              {t('procurement.continueAllocation')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* PR Creation Modal */}
      {showPRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                {t('procurement.createRequest')}
              </h3>
              <button onClick={() => setShowPRModal(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('dashboard.recentOrders.headers.poNumber') || 'Request ID'}</label>
                  <input type="text" value="PR-2026-104" disabled className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('dashboard.recentOrders.headers.deliveryDate') || 'Request Date'}</label>
                  <input type="text" value={new Date().toISOString().split('T')[0]} disabled className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('dashboard.recentOrders.headers.customer') || 'Requested By'}</label>
                  <input type="text" defaultValue="Current User" className="w-full px-3 py-2 border border-neutral-300 text-neutral-900 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('profile.role') || 'Department'}</label>
                  <select className="w-full px-3 py-2 border border-neutral-300 text-neutral-900 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white">
                    <option>{t('orderInitiation.tracker.production') || 'Production'}</option>
                    <option>{t('orderInitiation.tracker.inventory') || 'Inventory'}</option>
                    <option>{t('orderInitiation.tracker.quality') || 'Quality Control'}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">{t('inventoryVal.materialsHeader') || 'Material Needed'}</label>
                <select className="w-full px-3 py-2 border border-neutral-300 text-neutral-900 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white">
                  <option>Denim Fabric (Blue) - 800 meters</option>
                  <option>Polyester Thread (Navy) - 80 spools</option>
                  <option>Metal Hooks (Silver) - 150 pieces</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('bom.customer') || 'Preferred Supplier'}</label>
                  <select className="w-full px-3 py-2 border border-neutral-300 text-neutral-900 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white">
                    <option>TexMill Global</option>
                    <option>StitchCo</option>
                    <option>ZipCorp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('dashboard.recentOrders.headers.deliveryDate') || 'Required By Date'}</label>
                  <input type="date" className="w-full px-3 py-2 border border-neutral-300 text-neutral-900 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">{t('orderInitiation.orderForm.uploadPO') || 'Additional Notes'}</label>
                <textarea rows={3} className="w-full px-3 py-2 border border-neutral-300 text-neutral-900 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none" placeholder="Enter any specific requirements..."></textarea>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
              <button onClick={() => setShowPRModal(false)} className="px-4 py-2 text-neutral-600 bg-white border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors">
                {t('orderInitiation.buttons.back') || 'Cancel'}
              </button>
              <button onClick={() => setShowPRModal(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
                {t('procurement.createRequest') || 'Submit Purchase Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
