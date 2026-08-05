"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface StageHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromStage: string;
  toStage: string;
  sourceWorker: {
    id: string;
    name: string;
    initials: string;
    material: string;
    totalQty: number;
    startTime: string;
    status: string;
  };
  availableWorkers: { id: string; name: string; initials: string }[];
  onConfirm: (payload: any) => void;
}

interface Allocation {
  id: string;
  targetWorkerId: string;
  quantity: number | '';
  activeTasks?: any[]; // To simulate workload view
}

export default function StageHandoverModal({
  isOpen,
  onClose,
  fromStage,
  toStage,
  sourceWorker,
  availableWorkers,
  onConfirm
}: StageHandoverModalProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([
    { id: '1', targetWorkerId: '', quantity: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddAllocation = () => {
    setAllocations([...allocations, { id: Math.random().toString(), targetWorkerId: '', quantity: '' }]);
  };

  const handleRemoveAllocation = (id: string) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  const handleUpdateAllocation = (id: string, field: keyof Allocation, value: any) => {
    setAllocations(allocations.map(a => {
      if (a.id === id) {
        const updated = { ...a, [field]: value };
        // Simulate fetching active tasks when a worker is selected
        if (field === 'targetWorkerId' && value) {
          updated.activeTasks = [
            { material: sourceWorker.material, qty: 1000, status: 'Pending' }
          ];
        } else if (field === 'targetWorkerId' && !value) {
          updated.activeTasks = undefined;
        }
        return updated;
      }
      return a;
    }));
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
  const remainingQty = sourceWorker.totalQty - totalAllocated;
  const isNegative = remainingQty < 0;

  const handleSubmit = async () => {
    if (isNegative || totalAllocated === 0) return;
    setIsSubmitting(true);
    try {
      const payload = {
        fromStage,
        toStage,
        sourceWorkerId: sourceWorker.id,
        materialId: sourceWorker.material,
        allocations: allocations.filter(a => a.targetWorkerId && a.quantity).map(a => ({
          targetWorkerId: a.targetWorkerId,
          quantity: Number(a.quantity)
        }))
      };
      await onConfirm(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previousHistory = [
    { person: 'Christie', qty: 100, status: 'Approved' },
    { person: 'Jamal', qty: 150, status: 'Pending' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-start bg-[#0d1117]">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Stage Transition Handover</h2>
            <div className="flex items-center text-sm font-medium">
              <span className="text-indigo-400">{fromStage}</span>
              <span className="mx-2 text-slate-500">→</span>
              <span className="text-emerald-400">{toStage}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6 bg-[#0B0F19]">
          
          {/* FROM SECTION */}
          <div className="bg-[#1e293b] rounded-xl border border-indigo-900/50 p-5 relative overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                  {sourceWorker.initials}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-indigo-400 tracking-wider mb-1 uppercase flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">F</span>
                    FROM — CURRENT TASK BEING HANDED OVER
                  </div>
                  <h3 className="text-lg font-bold text-white leading-none mb-1.5">{sourceWorker.name}</h3>
                  <p className="text-sm text-slate-300 mb-3">
                    Currently working on: <span className="font-semibold text-white">{sourceWorker.material}</span>
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-[11px] font-medium border border-indigo-700/50">
                      Stage: {fromStage}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-[11px] font-medium border border-indigo-700/50">
                      Total Qty: {sourceWorker.totalQty} pcs
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-[11px] font-medium border border-indigo-700/50">
                      Started: {sourceWorker.startTime}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white text-slate-900 text-[11px] font-bold shadow-sm">
                      {sourceWorker.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isNegative ? 'text-red-400' : 'text-indigo-400'}`}>REMAINING</div>
                <div className={`text-4xl font-black leading-none ${isNegative ? 'text-red-500' : 'text-white'}`}>
                  {remainingQty}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">/ {sourceWorker.totalQty} pcs</div>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="flex items-center justify-center relative my-2">
            <div className="absolute w-full h-[1px] bg-slate-800"></div>
            <div className="relative bg-[#334155] px-4 py-1 rounded-full text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              HANDING OVER TO
            </div>
          </div>

          {/* TO SECTION */}
          <div>
            <div className="text-xs font-bold text-emerald-400 tracking-wider mb-4 uppercase flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px]">T</div>
              TO — TARGET WORKERS & QUANTITIES
            </div>

            <div className="space-y-4">
              {allocations.map((alloc, idx) => {
                const selectedWorker = availableWorkers.find(w => w.id === alloc.targetWorkerId);

                return (
                  <div key={alloc.id} className="bg-[#111827] rounded-xl border border-slate-700/60 p-4 transition-colors hover:border-emerald-900/80">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-emerald-900 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0 border border-emerald-800/50">
                        {selectedWorker?.initials || ''}
                      </div>
                      
                      {/* Dropdown */}
                      <div className="flex-1">
                        <select
                          value={alloc.targetWorkerId}
                          onChange={(e) => handleUpdateAllocation(alloc.id, 'targetWorkerId', e.target.value)}
                          className="w-full h-10 bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">Select worker to hand over to...</option>
                          {availableWorkers.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Qty */}
                      <div className="w-24 relative">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={alloc.quantity}
                          onChange={(e) => handleUpdateAllocation(alloc.id, 'quantity', e.target.value)}
                          className="w-full h-10 bg-[#1e293b] border border-slate-700 text-white rounded-lg px-3 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center font-medium"
                        />
                      </div>

                      {/* Status */}
                      <div className="px-2.5 py-1 bg-amber-900/30 border border-amber-700/50 text-amber-500 text-[10px] font-bold rounded uppercase tracking-wider">
                        PENDING
                      </div>

                      {/* Remove */}
                      <button onClick={() => handleRemoveAllocation(alloc.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors ml-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Active Tasks Preview */}
                    {alloc.targetWorkerId && (
                      <div className="mt-4 pt-3 border-t border-slate-800 pl-12 pr-10">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">CURRENT TASKS IN {toStage.toUpperCase()}:</div>
                        {alloc.activeTasks && alloc.activeTasks.length > 0 ? (
                          <div className="space-y-2">
                            {alloc.activeTasks.map((task, i) => (
                              <div key={i} className="flex justify-between items-center bg-[#1e293b] px-3 py-1.5 rounded-md border border-slate-800">
                                <div className="text-xs text-slate-300">
                                  <span className="text-amber-500 mr-2">•</span> 
                                  <span className="font-medium text-white">{task.material}</span> — {task.qty} pcs
                                </div>
                                <span className="text-[10px] bg-white text-slate-900 font-bold px-2 py-0.5 rounded shadow-sm">{task.status}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-900/20 px-3 py-2 rounded border border-emerald-900/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            No active tasks in {toStage} — Available to receive work
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button 
              onClick={handleAddAllocation}
              className="mt-4 text-emerald-400 text-sm font-bold flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Another Worker
            </button>
          </div>

          {/* HISTORY SECTION */}
          <div className="pt-6 border-t border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">PREVIOUS HANDOVER HISTORY</h4>
            <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#1e293b]/50">
                    <th className="py-2.5 px-4 font-bold text-slate-400 text-[10px] tracking-wider uppercase">Person</th>
                    <th className="py-2.5 px-4 font-bold text-slate-400 text-[10px] tracking-wider uppercase">Qty</th>
                    <th className="py-2.5 px-4 font-bold text-slate-400 text-[10px] tracking-wider uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {previousHistory.map((hist, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{hist.person}</td>
                      <td className="py-3 px-4 text-slate-300">{hist.qty}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          hist.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {hist.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-800 bg-[#0d1117] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={isNegative || totalAllocated === 0 || isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-slate-700 disabled:text-slate-400 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Handover'}
          </button>
        </div>

      </div>
    </div>
  );
}
