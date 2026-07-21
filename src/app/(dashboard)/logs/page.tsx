"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/language-context';
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  Hash,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Eye
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateDisplay } from '@/utils/dateUtils';

// --- TypeScript Interfaces ---
export interface SystemLog {
  id: string;
  orderNo: string;
  person: string;
  actionType: 'Updated' | 'Multiple Actions' | 'Approved' | 'Rejected' | 'Deleted';
  changeDetails: string | string[]; // Accepts a direct string description or an array of nested changes
  timestamp: string;
}

// --- Mock Service (Simulating @/lib/logger getLogs) ---
import { getLogs as getRealLogs } from "@/lib/logger";
const getLogs = (): SystemLog[] => { return getRealLogs() as any[]; };

// --- Helper for Parsing Change Text ---
const parseChange = (text: string) => {
  const changedFromMatch = text.match(/^(.*?) changed from (.*?) to (.*)$/i);
  if (changedFromMatch) return { oldData: `${changedFromMatch[1].trim()}: ${changedFromMatch[2].trim()}`, newData: `${changedFromMatch[1].trim()}: ${changedFromMatch[3].trim()}` };
  
  const updatedToMatch = text.match(/^(.*?) (?:updated|switched|changed) to (.*)$/i);
  if (updatedToMatch) return { oldData: "-", newData: `${updatedToMatch[1].trim()}: ${updatedToMatch[2].trim()}` };

  const markedAsMatch = text.match(/^(.*?) marked as (.*)$/i);
  if (markedAsMatch) return { oldData: "-", newData: `${markedAsMatch[1].trim()}: ${markedAsMatch[2].trim()}` };

  const addedMatch = text.match(/^(.*?):\s*Added (.*)$/i);
  if (addedMatch) return { oldData: "-", newData: `${addedMatch[1].trim()}: Added ${addedMatch[2].trim()}` };

  return { oldData: "-", newData: text };
};

// --- Order Details Sub-component ---
function OrderDetailsView({ 
  orderNo, 
  logs, 
  onBack 
}: { 
  orderNo: string; 
  logs: SystemLog[]; 
  onBack: () => void; 
}) {
  const orderLogs = logs.filter(l => l.orderNo === orderNo).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  if (orderLogs.length === 0) return null;

  const oldestLog = orderLogs[orderLogs.length - 1];
  const creationDate = new Date(oldestLog.timestamp).toLocaleString();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="border-b border-border px-6 py-4 bg-neutral-50/50 dark:bg-card/30 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-card border border-border rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-700 transition shadow-sm text-neutral-600 dark:text-neutral-300 flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Logs
          </button>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Order History: <span className="text-indigo-600 dark:text-indigo-400">{orderNo}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              First Activity: {creationDate}
            </p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 dark:bg-card border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <th className="px-6 py-4"><div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date & Time</div></th>
              <th className="px-6 py-4"><div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Person</div></th>
              <th className="px-6 py-4 w-1/4">Old Data</th>
              <th className="px-6 py-4 w-1/4">New Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
            {orderLogs.map(log => {
              const changes = Array.isArray(log.changeDetails) ? log.changeDetails : [log.changeDetails];
              return (
              <tr key={log.id} className="hover:bg-neutral-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {formatDateDisplay(log.timestamp)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <span className="text-sm font-medium text-foreground">
                    {log.person}
                  </span>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="space-y-1.5">
                    {changes.map((change, i) => {
                      const parsed = parseChange(change);
                      return (
                        <div key={i} className="text-sm text-muted-foreground font-medium bg-muted px-2.5 py-1.5 rounded">
                          {parsed.oldData}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="space-y-1.5">
                    {changes.map((change, i) => {
                      const parsed = parseChange(change);
                      return (
                        <div key={i} className="text-sm text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded">
                          {parsed.newData}
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function LogsPage() {
  const { t } = useLanguage();

  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderNoFilter, setOrderNoFilter] = useState<string>('All');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [personFilter, setPersonFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const loadLogs = () => {
    const fetchedLogs = getLogs();
    setLogs(fetchedLogs);
  };

  useEffect(() => {
    loadLogs();

    const handleLogsUpdate = () => {
      loadLogs();
    };

    window.addEventListener('systemLogsUpdated', handleLogsUpdate);
    return () => {
      window.removeEventListener('systemLogsUpdated', handleLogsUpdate);
    };
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Created': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'Updated': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-background/40 dark:text-blue-400 dark:border-blue-900/50';
      case 'Multiple Actions': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50';
      case 'Deleted': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
      case 'Approved': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50';
      case 'Rejected': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-background dark:text-neutral-400 dark:border-border';
    }
  };

  const uniquePersons = Array.from(new Set(logs.map(log => log.person))).filter(Boolean);
  const uniqueOrderNos = Array.from(new Set(logs.map(log => log.orderNo))).filter(Boolean);

  // Filtering
  const filteredLogs = logs.filter(log => {
    const detailsString = Array.isArray(log.changeDetails)
      ? log.changeDetails.join(' ')
      : log.changeDetails;

    const matchesSearch =
      detailsString.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.orderNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOrderNo = orderNoFilter === 'All' || log.orderNo === orderNoFilter;
    const matchesAction = actionFilter === 'All' || log.actionType === actionFilter;
    const matchesPerson = personFilter === 'All' || log.person === personFilter;

    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(log.timestamp) >= new Date(dateFrom);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      matchesDate = matchesDate && new Date(log.timestamp) < toDate;
    }

    return matchesSearch && matchesOrderNo && matchesAction && matchesPerson && matchesDate;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orderNoFilter, actionFilter, personFilter, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearchTerm('');
    setOrderNoFilter('All');
    setActionFilter('All');
    setPersonFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8 text-foreground">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            System Change Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track all changes, updates, and actions performed within the system.
          </p>
        </div>
        <div>
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-muted transition-colors shadow-sm text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {!selectedOrderNo && (
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Search Details
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search order number, details..."
                className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full lg:w-auto">
            {/* Order No Filter */}
            <div className="w-full sm:w-40">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Order Number
              </label>
              <select
                value={orderNoFilter}
                onChange={(e) => setOrderNoFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All">All Orders</option>
                {uniqueOrderNos.map((po, idx) => (
                  <option key={idx} value={po}>{po}</option>
                ))}
              </select>
            </div>

            {/* Person Filter */}
            <div className="w-full sm:w-40">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Person
              </label>
              <select
                value={personFilter}
                onChange={(e) => setPersonFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All">All Users</option>
                {uniquePersons.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div className="w-full sm:w-40">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Action Type
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All">All Actions</option>
                <option value="Updated">Updated</option>
                <option value="Multiple Actions">Multiple Actions</option>
                <option value="Deleted">Deleted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="w-full sm:w-72 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  lang="en-GB"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  lang="en-GB"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="w-full sm:w-auto flex items-end sm:ml-4">
              <button
                onClick={resetFilters}
                className="w-full h-[38px] px-6 bg-muted hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-600 dark:text-neutral-300 border border-border rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Data Table */}
      {selectedOrderNo ? (
        <OrderDetailsView 
          orderNo={selectedOrderNo} 
          logs={logs} 
          onBack={() => setSelectedOrderNo(null)} 
        />
      ) : (
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-card border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                <th className="px-6 py-4"><div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Order No</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Person</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Action Type</div></th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">
                        {log.orderNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-foreground">
                        {log.person}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getActionColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedOrderNo(log.orderNo)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-colors border border-indigo-100 dark:border-indigo-800"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <History className="h-10 w-10 mb-3 opacity-20" />
                      <p className="text-sm font-medium">No log records found for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-neutral-50 dark:bg-card border-t border-border px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="font-medium">{filteredLogs.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-border rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-sm font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-border rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
