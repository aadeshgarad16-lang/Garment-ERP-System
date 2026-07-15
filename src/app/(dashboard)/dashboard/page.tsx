"use client";
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import {
  ShoppingCart,
  Factory,
  Truck,
  AlertTriangle,
  PlusCircle,
  Calculator,
  Box,
  Scissors,
  CheckSquare,
  Clock,
  Calendar,
  Package,
  LucideIcon,
  Check,
  X as XIcon
} from 'lucide-react';

// Unified interfaces for stricter static typing
export interface StatItem {
  tKey: string;
  subtitleKey?: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  href: string;
}

export interface RecentOrder {
  id: string;
  customer: string;
  statusKey: 'delivered' | 'pending' | 'inProduction' | 'cutting';
  poDate: string;
  date: string;
  amount: number;
}

export interface ProductionStage {
  tKey: 'cutting' | 'stitching' | 'checking' | 'packing';
  count: number;
  capacity: number;
  icon: LucideIcon;
  color: string;
}

// Re-usable status styling map replacing slow switch-cases
const STATUS_THEME_MAP: Record<string, string> = {
  delivered: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
  pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
  inProduction: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
  cutting: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
};

const STAGE_DISPLAY_MAP: Record<string, string> = {
  "Order Specifications": "Specifications",
  "Stock Calculation": "Stock Check",
  "BOM Calculation": "BOM Calculation",
  "Inventory Check": "Inventory Check",
  "Material Allocation": "Material Allocation",
  "Procurement": "Procurement",
  "Material Release": "Material Release",
  "Production": "Production",
};

// Global memoized currency formatter utilizing standard 'en-IN' locale structure
const indianCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2
});

interface DashboardHomePageProps {
  statsData?: {
    totalOrders: string | number;
    activeProduction: string | number;
    pendingProcurement: string | number;
    inventoryAlerts: string | number;
    totalOrdersChange?: string;
  };
  recentOrders?: RecentOrder[];
  productionStages?: Record<'cutting' | 'stitching' | 'checking' | 'packing', { count: number; capacity: number }>;
}

export default function DashboardHomePage({
  statsData: initialStatsData,
  recentOrders: initialRecentOrders = [],
  productionStages
}: DashboardHomePageProps) {
  const { t } = useLanguage();
  
  const [statsData, setStatsData] = useState<any>(initialStatsData || {
    totalOrders: 0,
    activeProduction: 0,
    pendingProcurement: 0,
    inventoryAlerts: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>(initialRecentOrders);
  
  // Fetch live dashboard data from backend
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const res = await fetch(`${BACKEND_URL}/api/dashboard/summary`);
        if (!res.ok) throw new Error(`Server status ${res.status}`);
        
        const data = await res.json();
        if (data.success) {
          setStatsData(data.statsData);
          setRecentOrders(data.recentOrders);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };
    fetchDashboardData();
  }, []);
  const [delayReasons, setDelayReasons] = useState<Record<string, string>>({});
  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);
  const [tempReason, setTempReason] = useState<string>('');

  const handleEditReason = (id: string, currentReason: string) => {
    setEditingReasonId(id);
    setTempReason(currentReason || '');
  };

  const handleSaveReason = (id: string) => {
    setDelayReasons(prev => ({ ...prev, [id]: tempReason }));
    setEditingReasonId(null);
  };

  const handleCancelReason = () => {
    setEditingReasonId(null);
    setTempReason('');
  };

  // Dynamic evaluation of Metric blocks maps
  const metricsBlocks: StatItem[] = useMemo(() => [
    { tKey: 'totalOrders', value: statsData?.totalOrders ?? '0', change: statsData?.totalOrdersChange, icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', href: '/reports/total-orders' },
    { tKey: 'activeProduction', subtitleKey: 'units', value: statsData?.activeProduction ?? '0', icon: Factory, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', href: '/reports/active-production' },
    { tKey: 'pendingProcurement', subtitleKey: 'purchaseOrders', value: statsData?.pendingProcurement ?? '0', icon: Truck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', href: '/reports/pending-procurement' },
    { tKey: 'inventoryAlerts', subtitleKey: 'lowStockItems', value: statsData?.inventoryAlerts ?? '0', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', href: '/reports/inventory-alerts' },
  ], [statsData]);

  // Dynamic production line stage config values
  const normalizedProductionStages = useMemo(() => [
    { tKey: 'cutting' as const, count: productionStages?.cutting?.count ?? 0, capacity: productionStages?.cutting?.capacity ?? 0, icon: Scissors, color: 'bg-blue-500 dark:bg-blue-600' },
    { tKey: 'stitching' as const, count: productionStages?.stitching?.count ?? 0, capacity: productionStages?.stitching?.capacity ?? 0, icon: Factory, color: 'bg-indigo-500 dark:bg-indigo-600' },
    { tKey: 'checking' as const, count: productionStages?.checking?.count ?? 0, capacity: productionStages?.checking?.capacity ?? 0, icon: CheckSquare, color: 'bg-amber-500 dark:bg-amber-600' },
    { tKey: 'packing' as const, count: productionStages?.packing?.count ?? 0, capacity: productionStages?.packing?.capacity ?? 0, icon: Package, color: 'bg-emerald-500 dark:bg-emerald-600' },
  ], [productionStages]);

  // Optimizing table rendering via structural memoization
  const renderedOrderRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (recentOrders.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="text-center py-8 text-sm text-neutral-400 dark:text-neutral-500">
            No recent orders found
          </td>
        </tr>
      );
    }

    return recentOrders.map((order) => {
      const delayDays = order.delayDays || null;
      const reason = order.delayReason || delayReasons[order.poNumber] || '';

      return (
        <tr key={order.poNumber} className="hover:bg-neutral-50/30 dark:hover:bg-slate-800/20 transition-colors">
          <td className="px-3 py-[18px] text-center text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate align-middle" title={order.poNumber}>{order.poNumber}</td>
          <td className="px-3 py-[18px] text-center text-sm text-neutral-600 dark:text-neutral-400 truncate align-middle" title={order.customerName}>{order.customerName}</td>
          <td className="px-3 py-[18px] align-middle text-center">
            <span className={`inline-block max-w-full truncate px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_THEME_MAP[order.currentStage] || STATUS_THEME_MAP.pending}`}>
              {STAGE_DISPLAY_MAP[order.currentStage] || order.currentStage}
            </span>
          </td>
          <td className="px-2 py-[18px] whitespace-nowrap align-middle text-center">
            <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
              <span>{order.poDate ? order.poDate.split('T')[0] : '—'}</span>
            </div>
          </td>
          <td className="px-2 py-[18px] whitespace-nowrap align-middle text-center">
            <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
              <span>{order.deliveryDate ? order.deliveryDate.split(' ')[0].split('T')[0] : '—'}</span>
            </div>
          </td>
          <td className="px-2 py-[18px] text-center text-sm font-medium whitespace-nowrap align-middle">
            {delayDays ? (
              <span className="text-red-600 bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400 px-2.5 py-1 rounded-md">
                {delayDays}
              </span>
            ) : (
              <span className="text-neutral-400">-</span>
            )}
          </td>
          <td className="px-2 py-[18px] text-center text-sm text-neutral-600 dark:text-neutral-400 align-middle">
            {editingReasonId === order.poNumber ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={tempReason}
                  onChange={(e) => setTempReason(e.target.value)}
                  placeholder="Type custom reason..."
                  className="w-full text-center px-3 py-1.5 text-sm border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm text-neutral-800 dark:text-neutral-200"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Save this Reason for later?
                  </label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSaveReason(order.poNumber)} className="p-1 text-green-600 hover:bg-green-100 rounded-md"><Check className="h-4 w-4" /></button>
                    <button onClick={handleCancelReason} className="p-1 text-red-600 hover:bg-red-100 rounded-md"><XIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={reason || ""}
                onChange={(e) => {
                  if (e.target.value === "Other...") {
                    handleEditReason(order.id, "");
                  } else {
                    setDelayReasons(prev => ({ ...prev, [order.id]: e.target.value }));
                  }
                }}
                className="w-full truncate text-center px-3 py-1.5 text-sm border border-neutral-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-slate-600 transition-colors bg-white cursor-pointer"
              >
                <option value="">None</option>
                <option value="Fabric Sourcing Delay">Fabric Sourcing Delay</option>
                <option value="Logistics Breakdown">Logistics Breakdown</option>
                <option value="Sample Approval Pending">Sample Approval Pending</option>
                <option value="Production Overload">Production Overload</option>
                {reason && !["", "Fabric Sourcing Delay", "Logistics Breakdown", "Sample Approval Pending", "Production Overload"].includes(reason) && (
                  <option value="Machine Breakdown">Machine Breakdown</option>
                )}
                <option value="Other...">Other...</option>
              </select>
            )}
          </td>
          <td className="px-2 py-[18px] text-center font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap align-middle">
            {indianCurrencyFormatter.format(order.amount)}
          </td>
        </tr>
      );
    });
  }, [recentOrders, delayReasons, editingReasonId, tempReason, t]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('sidebar.dashboard')}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Order Initiation</span>
          </Link>
          {/* Orderlist Button */}
          <Link
            href="/order-list"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            <Calculator className="h-4 w-4" />
            <span>{t('Order List')}</span>
          </Link>
          {/* Reports Button */}
          <Link
            href="/reports"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            <Box className="h-4 w-4" />
            <span>{t('Reports')}</span>
          </Link>
        </div>
      </div>

      {/* Analytics Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metricsBlocks.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Link href={stat.href} key={stat.tKey} className="block group">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-5 flex items-center gap-4 transition-all duration-200 group-hover:shadow-md group-hover:border-blue-300 dark:group-hover:border-blue-800 h-full">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t(`dashboard.metrics.${stat.tKey}`)}</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stat.value}</span>
                    {stat.change && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {stat.change}
                      </span>
                    )}
                    {stat.subtitleKey && (
                      <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">{t(`dashboard.metrics.${stat.subtitleKey}`)}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Container Workflows */}
      <div className="space-y-6">
        <WorkflowIndicator currentStep="" />

        {/* Recent Orders Datatable */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-800 overflow-hidden">
          <div className="border-b border-neutral-200 dark:border-slate-800 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/30">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('dashboard.recentOrders.title')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-center border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold bg-neutral-50/30 dark:bg-slate-900">
                  <th scope="col" className="w-[13%] px-2 py-4 align-middle whitespace-nowrap text-center">{t('dashboard.recentOrders.headers.poNumber')}</th>
                  <th scope="col" className="w-[11%] px-2 py-4 align-middle whitespace-nowrap text-center">{t('dashboard.recentOrders.headers.customer')}</th>
                  <th scope="col" className="w-[16%] px-2 py-4 align-middle whitespace-nowrap text-center">{t('dashboard.recentOrders.headers.status')}</th>
                  <th scope="col" className="w-[11%] px-2 py-4 align-middle whitespace-nowrap text-center">PO Date</th>
                  <th scope="col" className="w-[11%] px-2 py-4 align-middle whitespace-nowrap text-center">{t('dashboard.recentOrders.headers.deliveryDate')}</th>
                  <th scope="col" className="w-[9%] px-2 py-4 align-middle whitespace-nowrap text-center">Delay Days</th>
                  <th scope="col" className="w-[17%] px-2 py-4 align-middle whitespace-nowrap text-center">Delay Reason</th>
                  <th scope="col" className="w-[12%] px-2 py-4 align-middle whitespace-nowrap text-center">{t('dashboard.recentOrders.headers.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/60">
                {renderedOrderRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Clean base of return - Recent Orders is now the last item */}
    </div>
  );
}