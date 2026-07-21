"use client";


import React, { use, useState, useMemo, useEffect } from 'react';
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

export default function ReportPage({ params }: { params: Promise<{ type: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const type = resolvedParams.type;

  let title = '';
  let description = '';
  let icon = null;
  let tableHeaders: string[] = [];

  // --- 1. DATA MAPPING HOOKS & STATE ---
  const [reportStats, setReportStats] = useState({ pending: 0, inProduction: 0, cutting: 0, delivered: 0 });
  const [dataToRender, setDataToRender] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let endpoint = '';
        if (type === 'total-orders') endpoint = '/api/reports/orders';
        else if (type === 'active-production') endpoint = '/api/reports/active-production';
        else if (type === 'pending-procurement') endpoint = '/api/reports/procurement';
        else if (type === 'inventory-alerts') endpoint = '/api/reports/inventory-alerts';
        
        if (!endpoint) {
          if (isMounted) setDataToRender(null);
          return;
        }
        
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
        const readKey = process.env.NEXT_PUBLIC_ERP_READ_API_KEY || "sasons_read_only_key_2026_abc";
        
        const res = await fetch(`${baseUrl}${endpoint}`, {
          headers: {
            "X-API-Key": readKey,
            "Content-Type": "application/json"
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch data');
        const result = await res.json();
        
        if (isMounted && result) {
          if (type === 'total-orders') {
            setDataToRender(result.orders || []);
            setReportStats(result.stats || { pending: 0, inProduction: 0, cutting: 0, delivered: 0 });
          } else if (type === 'inventory-alerts') {
            setDataToRender(result.alerts || []);
          } else if (type === 'active-production') {
            setDataToRender(result.production || []);
          } else if (type === 'pending-procurement') {
            setDataToRender(result.procurement || []);
          } else {
            // Fallback handling if response is already an array list
            setDataToRender(Array.isArray(result) ? result : []);
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setDataToRender([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [type]);

  switch (type) {
    case 'total-orders':
      title = 'Total Orders Report';
      description = 'Detailed view of all recent and historical orders.';
      icon = <ShoppingCart className="h-6 w-6 text-blue-600" />;
      tableHeaders = ['PO Number', 'Customer', 'Items', 'PO Date', 'Delivery Date', 'Status', 'Total Value'];
      break;
    case 'active-production':
      title = 'Active Production Units';
      description = 'Real-time tracking of garments currently on the production floor.';
      icon = <Factory className="h-6 w-6 text-emerald-600" />;
      tableHeaders = ['PO Number', 'Garment Style', 'Current Stage', 'Quantity', 'Start Date', 'Expected Completion'];
      break;
    case 'pending-procurement':
      title = 'Pending Procurement';
      description = 'Materials that are currently short and awaiting procurement.';
      icon = <Truck className="h-6 w-6 text-amber-600" />;
      tableHeaders = ['PO Number', 'Material Needed', 'Required Qty', 'Supplier', 'Status'];
      break;
    case 'inventory-alerts':
      title = 'Inventory Alerts';
      description = 'Materials that have dropped below their minimum stock threshold.';
      icon = <AlertTriangle className="h-6 w-6 text-red-600" />;
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
          <td className="px-4 py-3 text-[13px] font-medium text-foreground">
            <Link href={`/orders/${item.id}`} className="text-blue-600 hover:underline">{item.id}</Link>
          </td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground">{item.customer}</td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground">{item.items} units</td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground">{item.poDate}</td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground">{item.deliveryDate}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800`}>
              {item.status}
            </span>
          </td>
          <td className="px-4 py-3 text-[13px] font-medium text-foreground text-right">{item.amount}</td>
        </tr>
      );
    }

    if (type === 'active-production') {
      return (
        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td className="px-4 py-3 text-[13px] font-medium text-foreground">{item.poNumber}</td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground">{item.style}</td>
          <td className="px-4 py-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {item.stage}
            </span>
          </td>
          <td className="px-4 py-3 text-[13px] font-bold text-foreground">{item.qty} pcs</td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground">{item.startDate}</td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            {item.expectedCompletion}
          </td>
        </tr>
      );
    }

    if (type === 'pending-procurement') {
      return (
        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td className="px-4 py-3 text-[13px] font-medium text-foreground">{item.poNumber}</td>
          <td className="px-4 py-3 text-[13px] font-semibold text-card-foreground">{item.material}</td>
          <td className="px-4 py-3 text-[13px] font-bold text-foreground">{item.requiredQty} <span className="font-normal text-xs text-neutral-500">{item.unit}</span></td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground">{item.supplier}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Delayed' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                item.status === 'Ordered' ? 'bg-blue-100 text-blue-800 dark:bg-card/40 dark:text-blue-300' :
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
          <td className="px-4 py-3 text-[13px] font-medium text-foreground">{item.materialId}</td>
          <td className="px-4 py-3 text-[13px] font-semibold text-card-foreground">{item.name}</td>
          <td className="px-4 py-3 text-[13px] font-bold text-red-600">{item.currentStock} <span className="font-normal text-xs text-neutral-500">{item.unit}</span></td>
          <td className="px-4 py-3 text-[13px] text-muted-foreground">{item.threshold} <span className="text-xs">{item.unit}</span></td>
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
            className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {icon}
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
              id: 'Pending', label: 'Pending', icon: Clock, count: reportStats.pending,
              bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', active: 'ring-1 ring-amber-500 border-amber-500 shadow-md', hover: 'hover:border-amber-300 dark:hover:border-amber-700'
            },
            {
              id: 'In Production', label: 'In Production', icon: Factory, count: reportStats.inProduction,
              bg: 'bg-blue-100 dark:bg-card/30', text: 'text-blue-600 dark:text-blue-400', active: 'ring-1 ring-blue-500 border-blue-500 shadow-md', hover: 'hover:border-blue-300 dark:hover:border-blue-700'
            },
            {
              id: 'Cutting', label: 'Cutting', icon: Scissors, count: reportStats.cutting,
              bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', active: 'ring-1 ring-purple-500 border-purple-500 shadow-md', hover: 'hover:border-purple-300 dark:hover:border-purple-700'
            },
            {
              id: 'Delivered', label: 'Delivered', icon: CheckCircle2, count: reportStats.delivered,
              bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', active: 'ring-1 ring-emerald-500 border-emerald-500 shadow-md', hover: 'hover:border-emerald-300 dark:hover:border-emerald-700'
            }
          ].map(box => {
            const isActive = statusFilter === box.id;
            const Icon = box.icon;

            return (
              <div
                key={box.id}
                onClick={() => setStatusFilter(isActive ? 'All' : box.id)}
                className={`bg-card rounded-xl border p-5 flex items-center gap-4 cursor-pointer transition-all ${isActive ? box.active : `border-border ${box.hover} hover:shadow-sm`
                  }`}
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${box.bg}`}>
                  <Icon className={`h-6 w-6 ${box.text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{box.label}</p>
                  <p className="text-2xl font-bold text-foreground">{box.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">

        {/* Filters */}
        <div className="border-b border-border px-6 py-4 bg-neutral-50/50 dark:bg-card/50 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-card focus:ring-2 focus:ring-ring outline-none transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-card appearance-none outline-none focus:ring-2 focus:ring-ring cursor-pointer"
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
                className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-card appearance-none outline-none focus:ring-2 focus:ring-ring cursor-pointer"
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
              <tr className="bg-neutral-50/50 dark:bg-card/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
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
                  <td colSpan={tableHeaders.length} className="px-4 py-8 text-center text-muted-foreground">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-neutral-50 dark:bg-card px-6 py-4 border-t border-border text-xs text-muted-foreground flex justify-between">
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

