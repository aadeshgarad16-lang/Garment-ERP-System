"use client";

import React, { useState, useEffect } from 'react';
import { Package, Lock, Unlock, AlertCircle, Loader2 } from 'lucide-react';

interface AllocatedMaterial {
  id: string | number;
  po_number: string;
  material_name: string;
  category: string;
  allocated_qty: number;
  lock_status: string;
  status: string;
}

interface ProductionMaterialCardProps {
  selectedPo: string;
}

export default function ProductionMaterialCard({ selectedPo }: ProductionMaterialCardProps) {
  const [materials, setMaterials] = useState<AllocatedMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPo) {
      setMaterials([]);
      return;
    }

    const fetchMaterials = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/production/material-card?po_number=${encodeURIComponent(selectedPo)}`);
        const data = await res.json();
        if (data.success) {
          setMaterials(data.data || []);
        } else {
          setError(data.error || 'Failed to load allocated materials');
          setMaterials([]);
        }
      } catch (err) {
        setError('Network error loading allocated materials');
        setMaterials([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, [selectedPo]);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col w-full h-full">
      <div className="p-5 border-b border-slate-800 bg-[#0d1117] flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-400" />
          Allocated Materials
        </h3>
        {selectedPo && (
          <span className="px-3 py-1 bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-wider">
            PO: {selectedPo}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-[#0B0F19] p-4">
        {!selectedPo ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 py-10">
            <Package className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">Select a Purchase Order to view materials</p>
          </div>
        ) : isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-indigo-400 space-y-3 py-10">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium animate-pulse">Loading allocations...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-red-400 space-y-3 py-10">
            <AlertCircle className="w-10 h-10 opacity-80" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-10 border border-dashed border-slate-700 rounded-xl m-2">
            <p className="text-sm font-medium">No allocated materials found for this PO</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-800 bg-[#1e293b]/70 text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3 font-semibold">Material</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Allocated Qty</th>
                  <th className="px-4 py-3 font-semibold text-center">Lock Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {materials.map((mat) => {
                  const isLocked = mat.lock_status?.toLowerCase() === 'locked';
                  return (
                    <tr key={mat.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{mat.material_name}</td>
                      <td className="px-4 py-3 text-slate-400">{mat.category}</td>
                      <td className="px-4 py-3 text-indigo-300 font-bold text-right">{mat.allocated_qty}</td>
                      <td className="px-4 py-3 text-center">
                        {isLocked ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-900/30 text-red-400 text-[10px] font-bold uppercase border border-red-800/50">
                            <Lock className="w-3 h-3" /> Locked
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-900/30 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-800/50">
                            <Unlock className="w-3 h-3" /> Unlocked
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider">
                          {mat.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
