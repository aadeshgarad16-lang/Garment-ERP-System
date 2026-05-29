"use client";


import React, { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingCart,
  Factory,
  Truck,
  AlertTriangle,
  Clock,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Scissors,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

// --- MOCK DATA GENERATION ---
const totalOrdersData = [
  { id: 'PO-2026-0001', customer: 'Acme Retail', poDate: '2026-05-23', deliveryDate: '2026-06-10', status: 'In Production', amount: '₹15,400.00', items: 150 },
  { id: 'PO-2026-0002', customer: 'Global Fashion', poDate: '2026-05-24', deliveryDate: '2026-06-11', status: 'Pending', amount: '₹19,200.00', items: 124 },
  { id: 'PO-2026-0003', customer: 'Urban Styles', poDate: '2026-05-25', deliveryDate: '2026-06-12', status: 'Delivered', amount: '₹23,700.00', items: 174 },
  { id: 'PO-2026-0004', customer: 'Boutique XYZ', poDate: '2026-05-26', deliveryDate: '2026-06-13', status: 'Cutting', amount: '₹18,100.00', items: 150 },
  { id: 'PO-2026-0005', customer: 'Mega Mart', poDate: '2026-05-23', deliveryDate: '2026-06-14', status: 'In Production', amount: '₹16,100.00', items: 124 },
  { id: 'PO-2026-0006', customer: 'Acme Retail', poDate: '2026-05-24', deliveryDate: '2026-06-15', status: 'Pending', amount: '₹9,140.00', items: 150 },
  { id: 'PO-2026-0007', customer: 'Global Fashion', poDate: '2026-05-25', deliveryDate: '2026-06-16', status: 'Delivered', amount: '₹13,980.00', items: 100 },
  { id: 'PO-2026-0008', customer: 'Urban Styles', poDate: '2026-05-26', deliveryDate: '2026-06-17', status: 'Cutting', amount: '₹21,160.00', items: 100 },
  { id: 'PO-2026-0009', customer: 'Boutique XYZ', poDate: '2026-05-23', deliveryDate: '2026-06-18', status: 'In Production', amount: '₹12,400.00', items: 100 },
  { id: 'PO-2026-0010', customer: 'Mega Mart', poDate: '2026-05-24', deliveryDate: '2026-06-19', status: 'Pending', amount: '₹9,640.00', items: 100 },
  { id: 'PO-2026-0011', customer: 'Acme Retail', poDate: '2026-05-25', deliveryDate: '2026-06-20', status: 'Delivered', amount: '₹11,750.00', items: 100 },
  { id: 'PO-2026-0012', customer: 'Global Fashion', poDate: '2026-05-26', deliveryDate: '2026-06-21', status: 'Cutting', amount: '₹15,300.00', items: 123 },
];

const activeProductionData = [
  { poNumber: 'PO-2026-0001', style: 'Denim Jacket (DJ-001)', stage: 'Stitching', startDate: '2026-05-05', expectedCompletion: '2026-05-18', qty: 1200 },
  { poNumber: 'PO-2026-0002', style: 'Winter Coat (WC-001)', stage: 'Cutting', startDate: '2026-05-05', expectedCompletion: '2026-05-20', qty: 800 },
  { poNumber: 'PO-2026-0003', style: 'Cotton T-Shirt (CT-005)', stage: 'Checking', startDate: '2026-05-03', expectedCompletion: '2026-05-15', qty: 1500 },
  { poNumber: 'PO-2026-0004', style: 'Denim Jacket (DJ-001)', stage: 'Packing', startDate: '2026-05-01', expectedCompletion: '2026-05-12', qty: 900 },
  { poNumber: 'PO-2026-0005', style: 'Winter Coat (WC-001)', stage: 'Stitching', startDate: '2026-05-07', expectedCompletion: '2026-05-22', qty: 400 },
  { poNumber: 'PO-2026-0006', style: 'Cotton T-Shirt (CT-005)', stage: 'Cutting', startDate: '2026-05-08', expectedCompletion: '2026-05-18', qty: 1100 },
  { poNumber: 'PO-2026-0007', style: 'Denim Jacket (DJ-001)', stage: 'Checking', startDate: '2026-05-04', expectedCompletion: '2026-05-16', qty: 730 },
  { poNumber: 'PO-2026-0008', style: 'Winter Coat (WC-001)', stage: 'Packing', startDate: '2026-05-02', expectedCompletion: '2026-05-13', qty: 1800 },
];

const procurementMaterialsList = [
  { m: 'Denim Fabric (12oz)', u: 'meters' },
  { m: 'Heavy Duty Zippers', u: 'units' },
  { m: 'Wool Blend Fabric', u: 'meters' },
  { m: 'Cotton Thread', u: 'spools' },
  { m: 'Metal Buttons (Silver)', u: 'units' },
  { m: 'Leather Patches', u: 'units' },
  { m: 'Elastic Band (2 inch)', u: 'meters' },
  { m: 'Brand Labels', u: 'units' },
  { m: 'Collar Interlining', u: 'meters' },
  { m: 'Pocket Lining Cotton', u: 'meters' },
  { m: 'Packing Boxes', u: 'units' },
  { m: 'Polythene Bags', u: 'units' },
];

const pendingProcurementData = procurementMaterialsList.map((item, i) => ({
  poNumber: `PO-2026-${String((i * 10) + 1).padStart(4, '0')}`,
  material: item.m,
  requiredQty: Math.floor(Math.random() * 5000 + 500).toString(),
  unit: item.u,
  supplier: ['TexCorp Mills', 'ZipFast Inc.', 'Global Textiles', 'Trim & Tag Solutions', 'PackMaster Pro'][i % 5],
  status: ['Pending Approval', 'Ordered', 'Delayed', 'In Transit'][i % 4]
}));

const inventoryAlertsData = [
  { materialId: 'MAT-001', name: 'Cotton Thread (White)', currentStock: '50', threshold: '200', status: 'Critical', unit: 'spools' },
  { materialId: 'MAT-045', name: 'Metal Buttons (Silver)', currentStock: '120', threshold: '500', status: 'Low', unit: 'units' },
  { materialId: 'MAT-088', name: 'Elastic Band (2 inch)', currentStock: '45', threshold: '100', status: 'Critical', unit: 'meters' },
  { materialId: 'MAT-102', name: 'Brand Labels', currentStock: '800', threshold: '1000', status: 'Low', unit: 'units' },
  { materialId: 'MAT-115', name: 'Polyester Fabric (Black)', currentStock: '150', threshold: '400', status: 'Low', unit: 'meters' },
];

export default function ReportPage({ params }: { params: Promise<{ type: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const type = resolvedParams.type;

  let title = '';
  let description = '';
  let icon = null;
  let dataToRender = null;
  let tableHeaders: string[] = [];

  switch (type) {
    case 'total-orders':
      title = 'Total Orders Report';
      description = 'Detailed view of all recent and historical orders.';
      icon = <ShoppingCart className="h-6 w-6 text-blue-600" />;
      dataToRender = totalOrdersData;
      tableHeaders = ['PO Number', 'Customer', 'Items', 'PO Date', 'Delivery Date', 'Status', 'Total Value'];
      break;
    case 'active-production':
      title = 'Active Production Units';
      description = 'Real-time tracking of garments currently on the production floor.';
      icon = <Factory className="h-6 w-6 text-emerald-600" />;
      dataToRender = activeProductionData;
      tableHeaders = ['PO Number', 'Garment Style', 'Current Stage', 'Quantity', 'Start Date', 'Expected Completion'];
      break;
    case 'pending-procurement':
      title = 'Pending Procurement';
      description = 'Materials that are currently short and awaiting procurement.';
      icon = <Truck className="h-6 w-6 text-amber-600" />;
      dataToRender = pendingProcurementData;
      tableHeaders = ['PO Number', 'Material Needed', 'Required Qty', 'Supplier', 'Status'];
      break;
    case 'inventory-alerts':
      title = 'Inventory Alerts';
      description = 'Materials that have dropped below their minimum stock threshold.';
      icon = <AlertTriangle className="h-6 w-6 text-red-600" />;
      dataToRender = inventoryAlertsData;
      tableHeaders = ['Material ID', 'Material Name', 'Current Stock', 'Min. Threshold', 'Alert Level'];
      break;
    default:
      title = 'Report Not Found';
      description = 'The requested report does not exist.';
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { filteredData, uniqueEntities, uniqueStatuses, entityLabel, statusLabel } = useMemo(() => {
    if (!dataToRender) return { filteredData: [], uniqueEntities: [], uniqueStatuses: [], entityLabel: '', statusLabel: '' };

    const uEntities = new Set<string>();
    const uStatuses = new Set<string>();
    let eLabel = 'Entity';
    let sLabel = 'Status';

    const processed = dataToRender.filter((item: any) => {
      let entity = '';
      let status = '';
      let searchable = '';

      if (type === 'total-orders') {
        entity = item.customer;
        status = item.status;
        searchable = `${item.id} ${item.customer}`.toLowerCase();
        eLabel = 'Customer';
        sLabel = 'Status';
      } else if (type === 'active-production') {
        entity = item.style;
        status = item.stage;
        searchable = `${item.poNumber} ${item.style}`.toLowerCase();
        eLabel = 'Style';
        sLabel = 'Stage';
      } else if (type === 'pending-procurement') {
        entity = item.supplier;
        status = item.status;
        searchable = `${item.poNumber} ${item.material} ${item.supplier}`.toLowerCase();
        eLabel = 'Supplier';
        sLabel = 'Status';
      } else if (type === 'inventory-alerts') {
        entity = item.name;
        status = item.status;
        searchable = `${item.materialId} ${item.name}`.toLowerCase();
        eLabel = 'Material';
        sLabel = 'Alert Level';
      }

      uEntities.add(entity);
      uStatuses.add(status);

      const matchesSearch = searchTerm === '' || searchable.includes(searchTerm.toLowerCase());
      const matchesEntity = entityFilter === 'All' || entity === entityFilter;
      const matchesStatus = statusFilter === 'All' || status === statusFilter;

      return matchesSearch && matchesEntity && matchesStatus;
    });

    let finalData = processed;
    if (type === 'total-orders' && statusFilter === 'All' && entityFilter === 'All' && searchTerm === '') {
      finalData = processed.slice(0, 12); // Show only the data of last 3 or 4 days by default
    }

    return {
      filteredData: finalData,
      uniqueEntities: Array.from(uEntities).sort(),
      uniqueStatuses: Array.from(uStatuses).sort(),
      entityLabel: eLabel,
      statusLabel: sLabel
    };
  }, [dataToRender, searchTerm, entityFilter, statusFilter, type]);

  const renderTableRow = (item: any, idx: number) => {
    if (type === 'total-orders') {
      return (
        <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td className="px-4 py-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
            <Link href={`/orders/${item.id}`} className="text-blue-600 hover:underline">{item.id}</Link>
          </td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.customer}</td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.items} units</td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.poDate}</td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.deliveryDate}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800`}>
              {item.status}
            </span>
          </td>
          <td className="px-4 py-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100 text-right">{item.amount}</td>
        </tr>
      );
    }

    if (type === 'active-production') {
      return (
        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td className="px-4 py-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{item.poNumber}</td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.style}</td>
          <td className="px-4 py-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {item.stage}
            </span>
          </td>
          <td className="px-4 py-3 text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{item.qty} pcs</td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.startDate}</td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            {item.expectedCompletion}
          </td>
        </tr>
      );
    }

    if (type === 'pending-procurement') {
      return (
        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td className="px-4 py-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{item.poNumber}</td>
          <td className="px-4 py-3 text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">{item.material}</td>
          <td className="px-4 py-3 text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{item.requiredQty} <span className="font-normal text-xs text-neutral-500">{item.unit}</span></td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.supplier}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Delayed' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                item.status === 'Ordered' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
              {item.status}
            </span>
          </td>
        </tr>
      );
    }

    if (type === 'inventory-alerts') {
      return (
        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td className="px-4 py-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{item.materialId}</td>
          <td className="px-4 py-3 text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">{item.name}</td>
          <td className="px-4 py-3 text-[13px] font-bold text-red-600">{item.currentStock} <span className="font-normal text-xs text-neutral-500">{item.unit}</span></td>
          <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.threshold} <span className="text-xs">{item.unit}</span></td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
              {item.status === 'Critical' && <AlertCircle className="h-3 w-3" />}
              {item.status}
            </span>
          </td>
        </tr>
      );
    }

    return null;
  };

  if (!dataToRender) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-neutral-400" />
        <h1 className="text-2xl font-bold text-neutral-700">Report Not Found</h1>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              {icon}
              {title}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
          </div>
        </div>

        {type === 'total-orders' && (
          <Link href="/reports/all-orders" className="hidden sm:flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm items-center gap-2">
            View All Historical Data
          </Link>
        )}
      </div>

      {/* 4 Summary Boxes for Total Orders */}
      {type === 'total-orders' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            {
              id: 'Pending', label: 'Pending', icon: Clock, count: dataToRender?.filter((x: any) => x.status === 'Pending').reduce((acc: number, curr: any) => acc + curr.items, 0) || 0,
              bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', active: 'ring-1 ring-amber-500 border-amber-500 shadow-md', hover: 'hover:border-amber-300 dark:hover:border-amber-700'
            },
            {
              id: 'In Production', label: 'In Production', icon: Factory, count: dataToRender?.filter((x: any) => x.status === 'In Production').reduce((acc: number, curr: any) => acc + curr.items, 0) || 0,
              bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', active: 'ring-1 ring-blue-500 border-blue-500 shadow-md', hover: 'hover:border-blue-300 dark:hover:border-blue-700'
            },
            {
              id: 'Cutting', label: 'Cutting', icon: Scissors, count: dataToRender?.filter((x: any) => x.status === 'Cutting').reduce((acc: number, curr: any) => acc + curr.items, 0) || 0,
              bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', active: 'ring-1 ring-purple-500 border-purple-500 shadow-md', hover: 'hover:border-purple-300 dark:hover:border-purple-700'
            },
            {
              id: 'Delivered', label: 'Delivered', icon: CheckCircle2, count: dataToRender?.filter((x: any) => x.status === 'Delivered').reduce((acc: number, curr: any) => acc + curr.items, 0) || 0,
              bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', active: 'ring-1 ring-emerald-500 border-emerald-500 shadow-md', hover: 'hover:border-emerald-300 dark:hover:border-emerald-700'
            }
          ].map(box => {
            const isActive = statusFilter === box.id;
            const Icon = box.icon;

            return (
              <div
                key={box.id}
                onClick={() => setStatusFilter(isActive ? 'All' : box.id)}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-5 flex items-center gap-4 cursor-pointer transition-all ${isActive ? box.active : `border-neutral-200 dark:border-slate-700 ${box.hover} hover:shadow-sm`
                  }`}
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${box.bg}`}>
                  <Icon className={`h-6 w-6 ${box.text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{box.label}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{box.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">

        {/* Filters */}
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 appearance-none outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All {entityLabel}s</option>
                {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 appearance-none outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All {statusLabel}s</option>
                {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 dark:bg-slate-800/50 border-b border-neutral-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
                {tableHeaders.map((header, i) => (
                  <th key={i} className={`px-4 py-3 ${i === tableHeaders.length - 1 && type === 'total-orders' ? 'text-right' : ''}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {filteredData.length > 0 ? (
                filteredData.map((item: any, idx: number) => renderTableRow(item, idx))
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-neutral-50 dark:bg-slate-900 px-6 py-4 border-t border-neutral-200 dark:border-slate-700 text-xs text-neutral-500 dark:text-neutral-400 flex justify-between">
          <p>
            {type === 'active-production'
              ? `Showing ${filteredData.length} orders representing ${filteredData.reduce((sum: any, item: any) => sum + (item.qty || 0), 0).toLocaleString()} total units`
              : type === 'total-orders'
                ? `Showing ${filteredData.length} orders representing ${filteredData.reduce((sum: any, item: any) => sum + (item.items || 0), 0).toLocaleString()} total products`
                : `Showing ${filteredData.length.toLocaleString()} records`}
          </p>
          <p>Last updated: Just now</p>
        </div>
      </div>

    </div>
  );
}
