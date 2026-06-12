"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Package,
  Layers,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ArrowLeft
} from 'lucide-react';

const KPIData = [
  {
    title: 'Total Orders',
    value: '1,245',
    change: '+12.5%',
    trend: 'up',
    icon: Package,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Active Allocations',
    value: '843',
    change: '+5.2%',
    trend: 'up',
    icon: Layers,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    title: 'Pending Actions',
    value: '28',
    change: '-2.4%',
    trend: 'down',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
];

const stageTrackingData = [
  { stage: 'Order Initiation', count: 120, total: 500, color: 'bg-blue-500' },
  { stage: 'Material Allocation', count: 350, total: 500, color: 'bg-indigo-500' },
  { stage: 'Quality Check', count: 85, total: 500, color: 'bg-amber-500' },
  { stage: 'Completed', count: 400, total: 500, color: 'bg-emerald-500' },
];

const recentReportsData = [
  { id: 'REP-001', name: 'Monthly Order Summary', type: 'Order Summary', date: '2026-06-10', status: 'Generated' },
  { id: 'REP-002', name: 'Weekly Material Allocation', type: 'Allocation', date: '2026-06-08', status: 'Generated' },
  { id: 'REP-003', name: 'Q2 Stage Breakdown', type: 'Stage Tracking', date: '2026-06-01', status: 'Processing' },
  { id: 'REP-004', name: 'Inventory Shortage Alert', type: 'Alerts', date: '2026-05-28', status: 'Generated' },
];

export default function ReportsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Analytics & Reports
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Comprehensive business insights and granular data breakdowns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Custom Range</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {KPIData.map((kpi, index) => {
          const IconComponent = kpi.icon;
          const isUp = kpi.trend === 'up';
          return (
            <div key={index} className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <IconComponent className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'}`}>
                  {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {kpi.change}
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{kpi.value}</h3>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">{kpi.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Tracking Bar Chart (CSS Simulated) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neutral-500" />
              Stage Breakdown
            </h2>
          </div>
          <div className="space-y-6 mt-2">
            {stageTrackingData.map((item, idx) => {
              const percentage = Math.round((item.count / item.total) * 100);
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-medium mb-1.5">
                    <span className="text-neutral-700 dark:text-neutral-300">{item.stage}</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{item.count} / {item.total}</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${item.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary Doughnut / Stats (CSS Simulated) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Package className="h-5 w-5 text-neutral-500" />
              Order Summary Overview
            </h2>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Total Received</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">1,245</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Completed</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">890</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Pending / Open</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">325</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Delayed / Issues</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">30</p>
              </div>
            </div>
            
            {/* Visual ratio bar */}
            <div className="mt-2">
               <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Order Completion Ratio</p>
               <div className="w-full flex h-3 rounded-full overflow-hidden border border-neutral-100 dark:border-slate-700">
                 <div className="bg-emerald-500" style={{ width: '71%' }} title="Completed (71%)"></div>
                 <div className="bg-amber-400" style={{ width: '26%' }} title="Pending (26%)"></div>
                 <div className="bg-red-500" style={{ width: '3%' }} title="Delayed (3%)"></div>
               </div>
               <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-bold uppercase tracking-wider">
                 <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Completed</span>
                 <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></span> Pending</span>
                 <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span> Delayed</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/30 flex justify-between items-center">
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <FileText className="h-5 w-5 text-neutral-500" />
            Recent Generated Reports
          </h2>
          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold bg-neutral-50/30 dark:bg-slate-900">
                <th className="px-6 py-4">Report ID</th>
                <th className="px-6 py-4">Report Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date Generated</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/60">
              {recentReportsData.map((report) => (
                <tr key={report.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-neutral-100">{report.id}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300 font-semibold">{report.name}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">{report.type}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">{report.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      report.status === 'Generated' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {report.status === 'Generated' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
