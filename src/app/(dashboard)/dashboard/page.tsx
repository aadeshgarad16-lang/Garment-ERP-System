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
  Pencil,
  Check,
  X as XIcon
} from 'lucide-react';

// Unified interfaces for stricter static typing
interface StatItem {
  tKey: string;
  subtitleKey?: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  href: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  statusKey: 'delivered' | 'pending' | 'inProduction' | 'cutting';
  poDate: string;
  date: string;
  amount: number;
}

interface ProductionStage {
  tKey: 'cutting' | 'stitching' | 'checking' | 'packing';
  count: number;
  capacity: number;
  icon: LucideIcon;
  color: string;
}

// Immutable configuration data declared outside component to prevent garbage-collection recalculations on re-render
const STATS_DATA: StatItem[] = [
  { tKey: 'totalOrders', value: '1,495', change: '+12%', icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', href: '/reports/total-orders' },
  { tKey: 'activeProduction', subtitleKey: 'units', value: '8,430', icon: Factory, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', href: '/reports/active-production' },
  { tKey: 'pendingProcurement', subtitleKey: 'purchaseOrders', value: '12', icon: Truck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', href: '/reports/pending-procurement' },
  { tKey: 'inventoryAlerts', subtitleKey: 'lowStockItems', value: '5', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', href: '/reports/inventory-alerts' },
];

const RECENT_ORDERS_DATA: RecentOrder[] = [
  { id: 'PO-2026-081', customer: 'Acme Retail', statusKey: 'inProduction', poDate: '2026-05-01', date: '2026-05-20', amount: 15400.00 },
  { id: 'PO-2026-082', customer: 'Global Fashion', statusKey: 'pending', poDate: '2026-05-05', date: '2026-05-25', amount: 8250.00 },
  { id: 'PO-2026-083', customer: 'Urban Styles', statusKey: 'delivered', poDate: '2026-04-20', date: '2026-05-10', amount: 22100.00 },
  { id: 'PO-2026-084', customer: 'Boutique XYZ', statusKey: 'cutting', poDate: '2026-05-15', date: '2026-06-01', amount: 45000.00 },
  { id: 'PO-2026-085', customer: 'Mega Mart', statusKey: 'inProduction', poDate: '2026-05-02', date: '2026-05-18', amount: 12800.00 },
];

const PRODUCTION_STAGES_DATA: ProductionStage[] = [
  { tKey: 'cutting', count: 1250, capacity: 2000, icon: Scissors, color: 'bg-blue-500 dark:bg-blue-600' },
  { tKey: 'stitching', count: 3400, capacity: 5000, icon: Factory, color: 'bg-indigo-500 dark:bg-indigo-600' },
  { tKey: 'checking', count: 850, capacity: 1500, icon: CheckSquare, color: 'bg-amber-500 dark:bg-amber-600' },
  { tKey: 'packing', count: 420, capacity: 1000, icon: Package, color: 'bg-emerald-500 dark:bg-emerald-600' },
];

// Re-usable status styling map replacing slow switch-cases
const STATUS_THEME_MAP: Record<string, string> = {
  delivered: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
  pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
  inProduction: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
  cutting: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
};

// Global memoized currency formatter utilizing standard 'en-IN' locale structure
const indianCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2
});

export default function DashboardHomePage() {
  const { t } = useLanguage();

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

  // Optimizing table rendering via structural memoization
  const renderedOrderRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return RECENT_ORDERS_DATA.map((order) => {
      const deliveryDate = new Date(order.date);
      deliveryDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - deliveryDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const delayDays = diffDays > 0 ? diffDays : null;

      const reason = delayReasons[order.id] || '';

      return (
        <tr key={order.id} className="hover:bg-neutral-50/30 dark:hover:bg-slate-800/20 transition-colors">
          <td className="px-6 py-[18px] text-sm font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{order.id}</td>
          <td className="px-4 py-[18px] text-sm text-neutral-600 dark:text-neutral-400 truncate max-w-[150px]">{order.customer}</td>
          <td className="px-4 py-[18px] whitespace-nowrap">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_THEME_MAP[order.statusKey] || STATUS_THEME_MAP.pending}`}>
              {t(`dashboard.recentOrders.status.${order.statusKey}`)}
            </span>
          </td>
          <td className="px-4 py-[18px] whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
              <span>{order.poDate}</span>
            </div>
          </td>
          <td className="px-4 py-[18px] whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
              <span>{order.date}</span>
            </div>
          </td>
          <td className="px-4 py-[18px] text-sm font-medium whitespace-nowrap">
            {delayDays ? (
              <span className="text-red-600 bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400 px-2.5 py-1 rounded-md">
                {delayDays}
              </span>
            ) : (
              <span className="text-neutral-400">-</span>
            )}
          </td>
          <td className="px-4 py-[18px] text-sm text-neutral-600 dark:text-neutral-400">
            {editingReasonId === order.id ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={tempReason}
                  onChange={(e) => setTempReason(e.target.value)}
                  placeholder="Type custom reason..."
                  className="w-full px-3 py-1.5 text-sm border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm text-neutral-800 dark:text-neutral-200"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Save this address for later?
                  </label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSaveReason(order.id)} className="p-1 text-green-600 hover:bg-green-100 rounded-md"><Check className="h-4 w-4" /></button>
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
                className="w-full truncate px-3 py-1.5 text-sm border border-neutral-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-slate-600 transition-colors bg-white cursor-pointer"
              >
                <option value="">None</option>
                <option value="Fabric Sourcing Delay">Fabric Sourcing Delay</option>
                <option value="Logistics Breakdown">Logistics Breakdown</option>
                <option value="Sample Approval Pending">Sample Approval Pending</option>
                <option value="Production Overload">Production Overload</option>
                {reason && !["", "Fabric Sourcing Delay", "Logistics Breakdown", "Sample Approval Pending", "Production Overload"].includes(reason) && (
                  <option value={reason}>{reason}</option>
                )}
                <option value="Other...">Other...</option>
              </select>
            )}
          </td>
          <td className="px-6 py-[18px] text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right whitespace-nowrap">
            {indianCurrencyFormatter.format(order.amount)}
          </td>
        </tr>
      );
    });
  }, [t, delayReasons, editingReasonId, tempReason]);

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
        {STATS_DATA.map((stat) => {
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold bg-neutral-50/30 dark:bg-slate-900">
                  <th scope="col" className="w-[12%] px-6 py-4">{t('dashboard.recentOrders.headers.poNumber')}</th>
                  <th scope="col" className="w-[16%] px-4 py-4">{t('dashboard.recentOrders.headers.customer')}</th>
                  <th scope="col" className="w-[12%] px-4 py-4">{t('dashboard.recentOrders.headers.status')}</th>
                  <th scope="col" className="w-[10%] px-4 py-4">PO Date</th>
                  <th scope="col" className="w-[10%] px-4 py-4">{t('dashboard.recentOrders.headers.deliveryDate')}</th>
                  <th scope="col" className="w-[8%] px-4 py-4">Delay Days</th>
                  <th scope="col" className="w-[22%] px-4 py-4">Delay Reason</th>
                  <th scope="col" className="w-[10%] px-6 py-4 text-right">{t('dashboard.recentOrders.headers.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/60">
                {renderedOrderRows}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manufacturing Execution System (MES) Progress Trackers */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-800 overflow-hidden">
          <div className="border-b border-neutral-200 dark:border-slate-800 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/30">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('dashboard.productionStatus.title')}</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {PRODUCTION_STAGES_DATA.map((stage) => {
                const StageIcon = stage.icon;
                const percentage = stage.capacity > 0 ? Math.round((stage.count / stage.capacity) * 100) : 0;

                return (
                  <div key={stage.tKey}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <StageIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t(`dashboard.productionStatus.steps.${stage.tKey}`)}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{stage.count.toLocaleString()}</span> / {stage.capacity.toLocaleString()} {t('dashboard.metrics.units').toLowerCase()}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${stage.color} transition-all duration-500 ease-out`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}