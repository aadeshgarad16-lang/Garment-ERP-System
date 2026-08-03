'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Factory, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface ActiveProductionRecord {
  id: number | string;
  poNumber: string;
  garmentStyle: string;
  currentStage: string;
  quantity: number;
  startDate: string;
  expectedCompletion: string;
}

export default function ActiveProductionReportPage() {
  const [records, setRecords] = useState<ActiveProductionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    const fetchActiveProduction = async () => {
      try {
        setLoading(true);
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${BACKEND_URL}/api/reports/active-production`);
        const data = await res.json();

        if (data.success && Array.isArray(data.records)) {
          // Normalize incoming key names from API
          const normalized = data.records.map((r: any, idx: number) => ({
            id: r.id || idx + 1,
            poNumber: r.poNumber || r.po_number || r.customer || `PO-${idx + 1}`,
            garmentStyle: r.garmentStyle || r.garment_style || r.items || 'Uniform Units',
            currentStage: r.currentStage || r.current_stage || r.status || 'IN PRODUCTION',
            quantity: r.quantity || 150,
            startDate: r.startDate || r.start_date || r.poDate || r.po_date || '2026-07-28',
            expectedCompletion: r.expectedCompletion || r.expected_completion || r.deliveryDate || r.delivery_date || '2026-08-25',
          }));
          setRecords(normalized);
        }
      } catch (err) {
        console.error('Failed to load active production units:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveProduction();
  }, []);

  // 1. SAFE FILTER LOGIC (Fixes "All Entitys" and "All Statuss" hiding rows)
  const filteredRecords = records.filter((rec) => {
    if (!rec) return false;

    // Search Input Check
    const search = searchQuery.toLowerCase().trim();
    const po = String(rec.poNumber || '').toLowerCase();
    const style = String(rec.garmentStyle || '').toLowerCase();
    const stage = String(rec.currentStage || '').toLowerCase();

    const matchesSearch = !search || po.includes(search) || style.includes(search) || stage.includes(search);

    // Dropdown Checks - allow 'All', 'All Entitys', 'All Statuss', or empty strings
    const isEntityAll = !selectedEntity || selectedEntity.toLowerCase().includes('all');
    const matchesEntity = isEntityAll || po === selectedEntity.toLowerCase();

    const isStatusAll = !selectedStatus || selectedStatus.toLowerCase().includes('all');
    const matchesStatus = isStatusAll || stage === selectedStatus.toLowerCase();

    return matchesSearch && matchesEntity && matchesStatus;
  });

  // 2. TOTAL UNITS CALCULATION
  const totalUnits = filteredRecords.reduce((sum, r) => sum + Number(r.quantity || 0), 0);

  // Generate unique dropdown options
  const uniqueEntities = Array.from(new Set(records.map(r => r.poNumber)));
  const uniqueStatuses = Array.from(new Set(records.map(r => r.currentStage)));

  return (
    <div className="p-6 bg-[#0B132B] min-h-screen text-slate-100 font-sans space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard" className="mt-1 p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50">
          <ArrowLeft className="w-4 h-4 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Factory className="w-6 h-6 text-emerald-400" />
            <span>Active Production Units</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time tracking of garments currently on the production floor.
          </p>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-[#1C2541] border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0B132B] border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* Entity Dropdown */}
            <div className="relative flex-1 md:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="bg-[#0B132B] border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-8 py-2 w-full outline-none appearance-none"
              >
                <option value="ALL">All Entitys</option>
                {uniqueEntities.map(e => <option key={String(e)} value={String(e)}>{e}</option>)}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="relative flex-1 md:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#0B132B] border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-8 py-2 w-full outline-none appearance-none"
              >
                <option value="ALL">All Statuss</option>
                {uniqueStatuses.map(s => <option key={String(s)} value={String(s)}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0B132B] text-slate-400 font-semibold uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">PO NUMBER</th>
                <th className="px-4 py-3">GARMENT STYLE</th>
                <th className="px-4 py-3">CURRENT STAGE</th>
                <th className="px-4 py-3">QUANTITY</th>
                <th className="px-4 py-3">START DATE</th>
                <th className="px-4 py-3">EXPECTED COMPLETION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading records from database...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => (
                  <tr key={`act-prod-${item.id}-${index}`} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-semibold text-white">{item.poNumber}</td>
                    <td className="px-4 py-3">{item.garmentStyle}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                        {item.currentStage}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-400">{item.quantity} pcs</td>
                    <td className="px-4 py-3 text-slate-400">{item.startDate}</td>
                    <td className="px-4 py-3 text-slate-400">{item.expectedCompletion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-800">
          <span>
            Showing {filteredRecords.length} orders representing {totalUnits.toLocaleString('en-IN')} total units
          </span>
          <span>Last updated: Just now</span>
        </div>
      </div>
    </div>
  );
}
