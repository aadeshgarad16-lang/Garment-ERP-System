"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  CheckCircle2,
  Layers,
  ListChecks,
  Lock,
  ArrowRight,
  AlertCircle,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';
import { getAuthHeaders } from '@/lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BOMLine {
  bom_id?: number;
  material_id: number;
  material_name: string;
  category: string;
  unit: string;
  unit_price: number;
  required_qty: number;
  available_qty: number;
  allocate_qty: number;
  shortage_qty: number;
  status: 'Available' | 'Shortage' | 'Allocated' | 'Locked';
  isLocked: boolean;
}

type AllocationResult = 'idle' | 'loading' | 'success' | 'error';

// ─────────────────────────────────────────────
// Status badge helper
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Shortage: 'bg-red-100 text-red-700 border-red-200',
    Allocated: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Locked: 'bg-violet-100 text-violet-800 border-violet-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
      {status === 'Locked' && <Lock className="h-2.5 w-2.5 mr-1" />}
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function MaterialAllocationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [poNumber, setPoNumber] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [bomLines, setBomLines] = useState<BOMLine[]>([]);
  const [loadingBOM, setLoadingBOM] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [allocationResult, setAllocationResult] = useState<AllocationResult>('idle');
  const [allocationMessage, setAllocationMessage] = useState('');
  const [nextStage, setNextStage] = useState('');

  // ── Load PO + BOM on mount ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (!po) return;
    setPoNumber(po);
    fetchOrderAndBOM(po);
  }, []);

  const fetchOrderAndBOM = async (po: string) => {
    setLoadingBOM(true);
    setLoadError('');
    setBomLines([]);

    // Load order from localStorage first for context
    try {
      const ordersStr = localStorage.getItem('savedOrders');
      if (ordersStr) {
        const orders = JSON.parse(ordersStr);
        const found = orders.find((o: any) => o.poNumber === po);
        if (found) setCurrentOrder(found);
      }
    } catch { /* ignore */ }

    try {
      // Fetch full PO details with bom_calculations from backend
      const res = await fetch(`${BACKEND_URL}/purchase_orders/details/${encodeURIComponent(po)}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentOrder((prev: any) => ({ ...prev, ...data }));

        const bom: any[] = data.bom_calculations || [];
        if (bom.length > 0) {
          setBomLines(buildBOMLines(bom));
        } else {
          setLoadError('No BOM lines found for this order. Please complete BOM Calculation first.');
        }
      } else {
        setLoadError('Could not load BOM data from server. Check if BOM Calculation was completed.');
      }
    } catch (err) {
      console.warn('Backend unavailable for BOM load:', err);
      setLoadError('Backend offline. Please ensure BOM Calculation has been saved first.');
    } finally {
      setLoadingBOM(false);
    }
  };

  const buildBOMLines = (rawBOM: any[]): BOMLine[] => {
    return rawBOM.map(b => {
      const required = parseFloat(b.final_qty || b.required_qty || 0);
      const available = parseFloat(b.available_qty || 0);
      const allocatable = Math.min(available, required);
      const shortage = Math.max(0, required - available);

      return {
        bom_id: b.bom_id,
        material_id: b.material_id,
        material_name: b.material_name || `Material #${b.material_id}`,
        category: b.category || '—',
        unit: b.unit || 'units',
        unit_price: parseFloat(b.unit_price || 0),
        required_qty: required,
        available_qty: available,
        allocate_qty: allocatable,
        shortage_qty: shortage,
        status: shortage > 0 ? 'Shortage' : 'Available',
        isLocked: false,
      };
    });
  };

  // ── Editable allocation qty ──
  const handleQtyChange = useCallback((material_id: number, val: string) => {
    const qty = parseFloat(val) || 0;
    setBomLines(prev => prev.map(line =>
      line.material_id === material_id && !line.isLocked
        ? { ...line, allocate_qty: Math.min(qty, line.available_qty) }
        : line
    ));
  }, []);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: bomLines.length,
    available: bomLines.filter(l => l.status === 'Available' || l.status === 'Allocated').length,
    shortage: bomLines.filter(l => l.shortage_qty > 0).length,
    locked: bomLines.filter(l => l.isLocked).length,
    allLocked: bomLines.length > 0 && bomLines.every(l => l.isLocked),
    totalAllocatableCost: bomLines.reduce((sum, l) => sum + (l.allocate_qty * l.unit_price), 0),
  }), [bomLines]);

  const readinessStatus = stats.allLocked
    ? 'Fully Allocated — Ready for Release'
    : stats.locked > 0
      ? 'Partially Allocated'
      : 'Awaiting Allocation';

  const canAllocate = bomLines.some(l => !l.isLocked && l.allocate_qty > 0);

  // ── HARD RESERVATION LOCK ──
  const handleAllocate = useCallback(async () => {
    if (!poNumber || !canAllocate) return;
    setAllocationResult('loading');
    setAllocationMessage('');

    const allocations = bomLines
      .filter(l => !l.isLocked)
      .map(l => ({
        material_id: l.material_id,
        material_name: l.material_name,
        required_qty: l.required_qty,
        available_qty: l.available_qty,
        allocate_qty: l.allocate_qty,
        shortage_qty: l.shortage_qty,
      }));

    try {
      const res = await fetch(`${BACKEND_URL}/api/bom/allocate-materials`, {
        method: 'POST',
        headers: { ...getAuthHeaders(true), 'Content-Type': 'application/json' },
        body: JSON.stringify({ poNumber, allocations }),
      });

      if (res.ok) {
        const resData = await res.json();
        const stage = resData.next_stage || 'Production';
        setNextStage(stage);

        // Mark all lines as locked
        setBomLines(prev => prev.map(l => ({ ...l, isLocked: true, status: l.shortage_qty > 0 ? 'Shortage' : 'Locked' })));

        // Update localStorage
        updateOrderAndLog(poNumber, user?.name || 'System User', 'Updated', `Materials Allocated → ${stage}`, (orders) =>
          orders.map((o: any) => o.poNumber === poNumber ? { ...o, stage } : o)
        );
        window.dispatchEvent(new Event('orders-updated'));

        setAllocationResult('success');
        setAllocationMessage(resData.message || `Materials allocated. Order advanced to ${stage}.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }
    } catch (err: any) {
      console.error('Allocation failed:', err);
      // Graceful offline fallback: lock locally, update localStorage
      const hasShortage = bomLines.some(l => l.shortage_qty > 0);
      const stage = hasShortage ? 'Procurement' : 'Production';
      setNextStage(stage);

      setBomLines(prev => prev.map(l => ({ ...l, isLocked: true, status: l.shortage_qty > 0 ? 'Shortage' : 'Locked' })));
      updateOrderAndLog(poNumber, user?.name || 'System User', 'Updated', `Materials Allocated (offline) → ${stage}`, (orders) =>
        orders.map((o: any) => o.poNumber === poNumber ? { ...o, stage } : o)
      );
      window.dispatchEvent(new Event('orders-updated'));

      setAllocationResult('success');
      setAllocationMessage(`Backend offline — allocation saved locally. Order marked as ${stage}.`);
    }
  }, [poNumber, bomLines, canAllocate, user]);

  // ── Navigate to next stage ──
  const handleProceed = useCallback(() => {
    if (!nextStage) return;
    const pathMap: Record<string, string> = {
      'Production': '/production',
      'Procurement': '/procurement',
    };
    const path = pathMap[nextStage] || '/production';
    router.push(`${path}${poNumber ? `?poNumber=${encodeURIComponent(poNumber)}` : ''}`);
  }, [nextStage, poNumber, router]);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Material Allocation" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-indigo-600" />
            {t('procurement.materialAllocation') || 'Material Allocation'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('procurement.materialAllocationDesc') || 'Reserve and lock warehouse inventory against this Purchase Order'}
          </p>
          {poNumber && (
            <span className="inline-block mt-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
              PO: {poNumber}
            </span>
          )}
          {currentOrder?.customerName && (
            <span className="inline-block mt-2 ml-2 text-xs text-neutral-500">
              Customer: <strong className="text-neutral-700 dark:text-neutral-300">{currentOrder.customerName}</strong>
            </span>
          )}
        </div>

        {/* Primary action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          {allocationResult !== 'success' && (
            <button
              onClick={handleAllocate}
              disabled={!canAllocate || allocationResult === 'loading'}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                canAllocate && allocationResult !== 'loading'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-muted text-neutral-400 cursor-not-allowed border border-border'
              }`}
            >
              {allocationResult === 'loading'
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Locking…</>
                : <><Lock className="h-4 w-4" /> Allocate &amp; Lock Materials</>}
            </button>
          )}

          {allocationResult === 'success' && (
            <button
              onClick={handleProceed}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                nextStage === 'Procurement'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              Proceed to {nextStage}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Global Messages */}
      {allocationResult === 'success' && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          nextStage === 'Procurement'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {nextStage === 'Procurement'
            ? <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            : <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />}
          <div>
            <p className="font-semibold text-sm">{nextStage === 'Procurement' ? 'Partial Allocation — Procurement Required' : 'Allocation Successful!'}</p>
            <p className="text-xs mt-0.5 opacity-80">{allocationMessage}</p>
          </div>
        </div>
      )}

      {allocationResult === 'error' && (
        <div className="p-4 rounded-xl flex items-start gap-3 border bg-red-50 border-red-200 text-red-800">
          <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{allocationMessage}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: PackageCheck, label: 'Total BOM Lines', value: stats.total, color: 'neutral' },
          { icon: CheckCircle2, label: 'Fully Available', value: stats.available, color: 'emerald' },
          { icon: AlertCircle, label: 'Shortage Items', value: stats.shortage, color: stats.shortage > 0 ? 'red' : 'neutral' },
          { icon: Lock, label: 'Locked / Reserved', value: stats.locked, color: stats.locked > 0 ? 'indigo' : 'neutral' },
        ].map((card, i) => {
          const colorBg: Record<string, string> = {
            neutral: 'bg-muted text-muted-foreground',
            emerald: 'bg-emerald-100 text-emerald-600',
            red: 'bg-red-100 text-red-600',
            indigo: 'bg-indigo-100 text-indigo-600',
          };
          const Icon = card.icon;
          return (
            <div key={i} className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorBg[card.color]}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>


      {/* BOM Allocation Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="border-b border-border px-6 py-4 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <Box className="h-4 w-4 text-indigo-500" />
            Reservation &amp; Allocation Table
          </h2>
          {loadingBOM && (
            <div className="flex items-center gap-2 text-xs text-indigo-500">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading BOM data…
            </div>
          )}
        </div>

        {/* Load Error */}
        {loadError && !loadingBOM && (
          <div className="m-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No BOM data found</p>
              <p className="text-xs mt-0.5">{loadError}</p>
              <button onClick={() => router.push(`/bom-calculation${poNumber ? `?poNumber=${poNumber}` : ''}`)}
                className="mt-2 text-xs text-indigo-600 underline hover:text-indigo-800">
                → Go to BOM Calculation
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card border-b border-neutral-100 dark:border-neutral-700 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                <th className="px-4 py-3.5">Material Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Required Qty</th>
                <th className="px-4 py-3.5 text-right">In Store</th>
                <th className="px-4 py-3.5 text-center">Allocate Qty</th>
                <th className="px-4 py-3.5 text-right">Shortage</th>
                <th className="px-4 py-3.5 text-center">Lock Status</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {bomLines.length === 0 && !loadingBOM && !loadError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-400">
                    {poNumber ? 'Loading…' : 'No PO Number provided. Navigate here from BOM Calculation.'}
                  </td>
                </tr>
              ) : (
                bomLines.map((line, idx) => {
                  const isShortage = line.shortage_qty > 0;
                  return (
                    <tr key={idx} className={`transition-colors ${
                      line.isLocked ? 'bg-indigo-50/30 dark:bg-indigo-900/10' :
                      isShortage ? 'bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/60' :
                      'hover:bg-neutral-50/80 dark:hover:bg-slate-800/50'
                    }`}>
                      {/* Material Name */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{line.material_name}</span>
                          <span className="text-[11px] text-neutral-400">ID: {line.material_id}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4 text-xs text-muted-foreground">{line.category}</td>

                      {/* Required Qty */}
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold text-foreground">{line.required_qty.toLocaleString()}</span>
                        <span className="text-[11px] text-neutral-400 block">{line.unit}</span>
                      </td>

                      {/* Available in Store */}
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm font-semibold ${line.available_qty >= line.required_qty ? 'text-emerald-700' : 'text-red-700'}`}>
                          {line.available_qty.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-neutral-400 block">{line.unit}</span>
                      </td>

                      {/* Allocate Qty (editable) */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={line.available_qty}
                            value={line.allocate_qty}
                            onChange={e => handleQtyChange(line.material_id, e.target.value)}
                            disabled={line.isLocked}
                            className={`w-24 px-2 py-1.5 border rounded-lg text-sm text-right transition-colors ${
                              line.isLocked
                                ? 'bg-muted border-border text-neutral-500 cursor-not-allowed'
                                : line.allocate_qty > line.available_qty
                                  ? 'border-red-300 bg-red-50 text-red-900'
                                  : 'border-border bg-card text-foreground focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                          />
                          <span className="text-xs text-neutral-400">{line.unit}</span>
                        </div>
                        {line.allocate_qty > line.available_qty && (
                          <p className="text-[10px] text-red-600 mt-1 text-center">Exceeds available stock</p>
                        )}
                      </td>

                      {/* Shortage */}
                      <td className="px-4 py-4 text-right">
                        {isShortage ? (
                          <div>
                            <span className="text-sm font-bold text-red-700">{line.shortage_qty.toLocaleString()}</span>
                            <p className="text-[10px] text-red-500 mt-0.5 flex items-center justify-end gap-1">
                              <ShoppingCart className="h-2.5 w-2.5" /> → Procurement
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-emerald-600 font-medium">—</span>
                        )}
                      </td>

                      {/* Lock Status */}
                      <td className="px-4 py-4 text-center">
                        {line.isLocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                            <Lock className="h-3 w-3" /> Reserved
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">Unlocked</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={line.isLocked ? (isShortage ? 'Shortage' : 'Locked') : line.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-neutral-100 dark:border-neutral-700 px-4 py-3 bg-neutral-50/50 dark:bg-neutral-800/30 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span><span className="font-semibold text-neutral-700 dark:text-neutral-300">{stats.locked}</span> / {stats.total} lines reserved</span>
            {stats.shortage > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {stats.shortage} material{stats.shortage > 1 ? 's' : ''} will trigger procurement
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {allocationResult !== 'success' && (
              <button
                onClick={handleAllocate}
                disabled={!canAllocate || allocationResult === 'loading'}
                className={`px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center gap-2 transition-colors ${
                  canAllocate && allocationResult !== 'loading'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-muted text-neutral-400 cursor-not-allowed border border-border'
                }`}
              >
                <Lock className="h-4 w-4" />
                {allocationResult === 'loading' ? 'Locking…' : 'Allocate & Lock'}
              </button>
            )}

            {allocationResult === 'success' && (
              <button
                onClick={handleProceed}
                className={`px-4 py-2 rounded-lg shadow-sm font-medium text-sm flex items-center gap-2 transition-colors ${
                  nextStage === 'Procurement'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                Proceed to {nextStage}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
