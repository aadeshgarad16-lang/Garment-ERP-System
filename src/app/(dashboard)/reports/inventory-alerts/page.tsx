'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface InventoryAlertRecord {
  materialId: string;
  materialName: string;
  currentStock: number;
  minThreshold: number;
  alertLevel: string;
}

export default function InventoryAlertsPage() {
  const [records, setRecords] = useState<InventoryAlertRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('All Entitys');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuss');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${BACKEND_URL}/api/reports/inventory-alerts`);
        const data = await res.json();

        if (data.success && Array.isArray(data.records)) {
          const normalized = data.records.map((r: any, idx: number) => ({
            materialId: r.materialId || r.material_id || `MAT-00${idx + 1}`,
            materialName: r.materialName || r.material_name || r.name || 'Raw Material Item',
            currentStock: Number(r.currentStock ?? r.current_stock ?? 0),
            minThreshold: Number(r.minThreshold ?? r.min_threshold ?? 100),
            alertLevel: r.alertLevel || r.alert_level || (Number(r.currentStock) === 0 ? 'CRITICAL' : 'LOW STOCK'),
          }));
          setRecords(normalized);
        }
      } catch (err) {
        console.error('Failed to load inventory alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Safe Filter Logic (Prevents 'All Entitys' and 'All Statuss' from blocking data)
  const filteredRecords = records.filter((rec) => {
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      rec.materialId.toLowerCase().includes(searchLower) ||
      rec.materialName.toLowerCase().includes(searchLower) ||
      rec.alertLevel.toLowerCase().includes(searchLower);

    const matchesEntity =
      !selectedEntity ||
      selectedEntity.toLowerCase().includes('all') ||
      rec.materialId.toLowerCase() === selectedEntity.toLowerCase();

    const matchesStatus =
      !selectedStatus ||
      selectedStatus.toLowerCase().includes('all') ||
      rec.alertLevel.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesEntity && matchesStatus;
  });

  return (
    <div className="p-8 bg-[#0B132B] min-h-screen text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg bg-[#1C2541] hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-bold text-white">Inventory Alerts</h1>
        </div>
      </div>
      <p className="text-sm text-slate-400 ml-12 mb-6">
        Materials that have dropped below their minimum stock threshold.
      </p>

      {/* Table Container */}
      <div className="bg-[#1C2541]/80 border border-slate-800/80 rounded-xl p-4 shadow-xl">
        {/* Controls Row */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B132B]/60 border border-slate-700/60 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="bg-[#0B132B]/60 border border-slate-700/60 text-slate-200 text-xs rounded-lg px-3 py-2"
            >
              <option value="All Entitys">All Entitys</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B132B]/60 border border-slate-700/60 text-slate-200 text-xs rounded-lg px-3 py-2"
            >
              <option value="All Statuss">All Statuss</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B132B]/40 text-slate-400 font-semibold uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">MATERIAL ID</th>
                <th className="px-4 py-3">MATERIAL NAME</th>
                <th className="px-4 py-3">CURRENT STOCK</th>
                <th className="px-4 py-3">MIN. THRESHOLD</th>
                <th className="px-4 py-3">ALERT LEVEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Loading inventory alerts...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => (
                  <tr key={`alert-${item.materialId}-${index}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-white">{item.materialId}</td>
                    <td className="px-4 py-3.5 text-slate-200">{item.materialName}</td>
                    <td className="px-4 py-3.5 font-bold text-red-400">{item.currentStock} units</td>
                    <td className="px-4 py-3.5 text-slate-400">{item.minThreshold} units</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 text-[11px] rounded-full font-bold uppercase border ${
                          item.alertLevel === 'CRITICAL'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {item.alertLevel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-4 mt-2 border-t border-slate-800/80">
          <span>Showing {filteredRecords.length} records</span>
          <span>Last updated: Just now</span>
        </div>
      </div>
    </div>
  );
}
