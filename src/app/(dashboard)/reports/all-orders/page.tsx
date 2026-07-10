"use client";


import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingCart,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

// --- MOCK DATA GENERATION ---

const totalOrdersData: any[] = [];

export default function AllOrdersPage() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { filteredData, uniqueCustomers, uniqueStatuses } = useMemo(() => {
    const uCustomers = new Set<string>();
    const uStatuses = new Set<string>();

    const processed = totalOrdersData.filter((item) => {
      uCustomers.add(item.customer);
      uStatuses.add(item.status);

      const searchable = `${item.id} ${item.customer}`.toLowerCase();
      const matchesSearch = searchTerm === '' || searchable.includes(searchTerm.toLowerCase());
      const matchesCustomer = customerFilter === 'All' || item.customer === customerFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesCustomer && matchesStatus;
    });

    return {
      filteredData: processed,
      uniqueCustomers: Array.from(uCustomers).sort(),
      uniqueStatuses: Array.from(uStatuses).sort(),
    };
  }, [searchTerm, customerFilter, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            All Historical Orders
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Complete database of all 1,495 orders with full search and filtering capabilities.</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">

        {/* Filters */}
        <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 appearance-none outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Customers</option>
                {uniqueCustomers.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-neutral-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 appearance-none outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 dark:bg-slate-800/50 border-b border-neutral-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">PO Date</th>
                <th className="px-4 py-3">Delivery Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      <Link href={`/orders/${item.id}`} className="text-blue-600 hover:underline">{item.id}</Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.customer}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.items}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.poDate}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">{item.deliveryDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100 text-right">{item.amount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-neutral-50 dark:bg-slate-900 px-6 py-4 border-t border-neutral-200 dark:border-slate-700 text-xs text-neutral-500 dark:text-neutral-400 flex justify-between">
          <p>Showing {filteredData.length.toLocaleString()} records</p>
          <p>Last updated: Just now</p>
        </div>
      </div>
    </div>
  );
}

