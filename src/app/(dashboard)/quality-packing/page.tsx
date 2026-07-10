"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Package,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  ChevronRight,
  ShieldAlert,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';
import { getAuthHeaders } from '@/lib/api';
import { useOrders } from '@/contexts/order-context';
import { isStageMatch } from '@/utils/orderUtils';

type StageName = 'Quality Check' | 'Packing' | 'Packing & Verification' | 'Approval';
type StageStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Rework Required';

interface StageData {
  id: string;
  name: StageName;
  description: string;
  icon: React.ElementType;
  status: StageStatus;
  supervisor: string;
  completedQty: number;
  startTime: string;
  endTime: string;
  remarks: string;
  qcStatus?: 'Pass' | 'Fail' | null;
  qcRemarks?: string;
  packedQty?: number;
  verifiedQty?: number;
  approvedBy?: string;
  dispatchNotes?: string;
}

export default function QualityPackingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { orders } = useOrders();

  // --- States ---
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [poNumber, setPoNumber] = useState<string>('');
  const [activeStageIdx, setActiveStageIdx] = useState<number | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);

  const [stages, setStages] = useState<StageData[]>([
    { id: 'qc', name: 'Quality Check', description: 'Inspect for defects & standards', icon: ClipboardCheck, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', qcStatus: null, qcRemarks: '' },
    { id: 'packing', name: 'Packing', description: 'Pack finished products', icon: Package, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', packedQty: 0 },
    { id: 'verification', name: 'Packing & Verification', description: 'Verify packed items & quantities', icon: ListChecks, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', verifiedQty: 0 },
    { id: 'approval', name: 'Approval', description: 'Final approval for dispatch', icon: CheckCircle2, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', approvedBy: '', dispatchNotes: '' },
  ]);

  // --- Logic Unified & Deduplicated ---
  const loadPendingOrders = useCallback(() => {
    try {
      const targetKeywords = ['quality', 'packing', 'quality control'];
      const qpOrders = orders.filter((o: any) =>
        (isStageMatch(o.stage, targetKeywords) ||
        isStageMatch(o.workflow_status, targetKeywords) ||
        isStageMatch(o.currentStage, targetKeywords) ||
        isStageMatch(o.workflowStage, targetKeywords)) &&
        (o.status === 'Pending' || !o.status)
      );
      setPendingOrders(qpOrders);
      setUiError(null);
    } catch (err) {
      console.error("Failed to load pending orders:", err);
      setUiError("Error filtering pending orders.");
    }
  }, [orders]);

  const handleProcessOrder = async (po: string) => {
    try {
      setIsProcessing(true);
      setUiError(null);
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${BACKEND_URL}/purchase_orders/update_status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(true) },
        body: JSON.stringify({ poNumber: po, status: 'In Progress' })
      });
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      setShowPendingPanel(false);
      router.push(`/quality-packing?poNumber=${encodeURIComponent(po)}`);
    } catch (err) {
      console.error("Failed to process order:", err);
      setUiError("Unable to connect to the server. Working in offline mode.");
      
      // Fallback: manually update the local storage mock order
      const ordersStr = localStorage.getItem('savedOrders');
      if (ordersStr) {
        let orders = JSON.parse(ordersStr);
        orders = orders.map((o: any) => o.poNumber === po ? { ...o, status: 'In Progress' } : o);
        localStorage.setItem('savedOrders', JSON.stringify(orders));
        setShowPendingPanel(false);
        router.push(`/quality-packing?poNumber=${encodeURIComponent(po)}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadPendingOrders();
    const po = searchParams.get('poNumber');
    if (po) {
      setPoNumber(po);
      const ordersStr = localStorage.getItem('savedOrders');
      if (ordersStr) {
        try {
          const orders = JSON.parse(ordersStr);
          const found = orders.find((o: any) => o.poNumber === po);
          if (found) {
            setCurrentOrder(found);
            if (found.qualityStages && found.qualityStages.length > 0) {
              const remapped = found.qualityStages.map((stage: any) => {
                let icon = ClipboardCheck;
                if (stage.id === 'packing') icon = Package;
                if (stage.id === 'verification') icon = ListChecks;
                if (stage.id === 'approval') icon = CheckCircle2;
                return { ...stage, icon };
              });
              setStages(remapped);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [searchParams, loadPendingOrders]);

  useEffect(() => {
    const handleUpdate = () => loadPendingOrders();
    window.addEventListener("orders-updated", handleUpdate);
    return () => window.removeEventListener("orders-updated", handleUpdate);
  }, [loadPendingOrders]);

  const saveQualityStages = (updatedStages: StageData[]) => {
    if (typeof window === 'undefined') return;
    const po = searchParams.get('poNumber');
    if (po) {
      const strippedStages = updatedStages.map(({ icon, ...rest }) => rest);
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? { ...o, qualityStages: strippedStages } : o);
      });
    }
  };

  const totalOrderQty = useMemo(() => {
    return currentOrder?.specs?.reduce((sum: number, spec: any) => sum + (Number(spec.quantity) || 0), 0) || 1000;
  }, [currentOrder]);

  const advanceStage = (nextPath: string, nextStage: string) => {
    if (typeof window === 'undefined') return;
    const po = searchParams.get('poNumber');
    if (po) {
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? { ...o, stage: nextStage } : o);
      });
      router.push(`${nextPath}?poNumber=${encodeURIComponent(po)}`);
    } else {
      router.push(nextPath);
    }
  };

  const completedStagesCount = stages.filter(s => s.status === 'Completed').length;
  const progressPercentage = Math.round((completedStagesCount / stages.length) * 100);

  const overallStatus = useMemo(() => {
    if (stages.some(s => s.status === 'Rework Required')) return 'Rework Required';
    if (stages.every(s => s.status === 'Completed')) return 'Ready for Dispatch';
    if (stages.some(s => s.status === 'In Progress' || s.status === 'Completed')) return 'In Progress';
    return 'Awaiting Validation';
  }, [stages]);

  const handleStageUpdate = (idx: number, field: keyof StageData, value: any) => {
    setStages(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      saveQualityStages(next);
      return next;
    });
  };

  const handleStartStage = (idx: number) => {
    setStages(prev => {
      const next = [...prev];
      next[idx].status = 'In Progress';
      saveQualityStages(next);
      return next;
    });
  };

  const handleCompleteStage = (idx: number) => {
    setStages(prev => {
      const next = [...prev];
      const stage = next[idx];

      if (stage.id === 'qc') {
        if (stage.qcStatus === 'Pass') {
          stage.status = 'Completed';
        } else if (stage.qcStatus === 'Fail') {
          stage.status = 'Rework Required';
        }
      } else {
        stage.status = 'Completed';
      }
      saveQualityStages(next);
      return next;
    });
    setActiveStageIdx(null);
  };

  const getStatusBadge = (status: StageStatus) => {
    switch (status) {
      case 'Pending': return <span className="bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('dashboard.recentOrders.status.pending') || 'Pending'}</span>;
      case 'In Progress': return <span className="bg-blue-100 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">In Progress</span>;
      case 'Completed': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">Completed</span>;
      case 'Failed':
      case 'Rework Required': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">Rework Required</span>;
      default: return null;
    }
  };

  const getStageCardColor = (status: StageStatus, isActive: boolean) => {
    if (isActive) return 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10 dark:bg-blue-900/20';
    switch (status) {
      case 'Completed': return 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/20';
      case 'In Progress': return 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/20';
      case 'Rework Required':
      case 'Failed': return 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/20';
      default: return 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-neutral-50 dark:hover:bg-slate-800 cursor-pointer';
    }
  };

  const getIconColor = (status: StageStatus, isActive: boolean) => {
    if (isActive) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40';
    switch (status) {
      case 'Completed': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40';
      case 'In Progress': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40';
      case 'Rework Required':
      case 'Failed': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40';
      default: return 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-slate-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      <WorkflowIndicator currentStep="Quality & Packing" />

      {uiError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{uiError}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            {t('quality.title') || 'Quality & Packing'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {t('quality.subtitle') || 'Inspect, pack, and verify orders for dispatch'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadPendingOrders(); setShowPendingPanel(true); }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer shadow-sm"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
            {pendingOrders.length > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${overallStatus === 'Ready for Dispatch' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
              overallStatus === 'Rework Required' ? 'bg-red-100 text-red-800 border-red-200' :
                overallStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:text-blue-200 border-blue-200' :
                  'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-slate-700'
            }`}>
            {overallStatus}
          </span>
        </div>
      </div>

      {/* Grid of Work Processing Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage, idx) => {
          const StageIcon = stage.icon;
          return (
            <div
              key={stage.id}
              onClick={() => setActiveStageIdx(idx)}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-4 shadow-sm ${getStageCardColor(stage.status, activeStageIdx === idx)}`}
            >
              <div className="flex justify-between items-start w-full">
                <div className={`p-3 rounded-xl transition-all ${getIconColor(stage.status, activeStageIdx === idx)}`}>
                  <StageIcon className="h-5 w-5" />
                </div>
                {getStatusBadge(stage.status)}
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{stage.name}</h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Processing Panel for Selected Stage */}
      {activeStageIdx !== null && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center mb-6 border-b border-neutral-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                {React.createElement(stages[activeStageIdx].icon, { className: "h-5 w-5" })}
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Processing: {stages[activeStageIdx].name}
                </h3>
                <p className="text-xs text-neutral-400">Po Number Reference: {poNumber || 'None Loaded'}</p>
              </div>
            </div>
            <button onClick={() => setActiveStageIdx(null)} className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-400">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Supervisor Field */}
            {stages[activeStageIdx].id !== 'approval' && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">
                  {stages[activeStageIdx].id === 'verification' ? 'Verification Supervisor' : 'Supervisor Name'}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                  placeholder="Enter name"
                  value={stages[activeStageIdx].supervisor}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'supervisor', e.target.value)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>
            )}

            {/* Qty Field logic based on stage identity */}
            {stages[activeStageIdx].id === 'qc' && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">Items Checked</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                  value={stages[activeStageIdx].completedQty || ''}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'completedQty', parseInt(e.target.value) || 0)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>
            )}

            {stages[activeStageIdx].id === 'packing' && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">Packed Quantity</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                  value={stages[activeStageIdx].packedQty || ''}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'packedQty', parseInt(e.target.value) || 0)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>
            )}

            {stages[activeStageIdx].id === 'verification' && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">Verified Quantity</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                  value={stages[activeStageIdx].verifiedQty || ''}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'verifiedQty', parseInt(e.target.value) || 0)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>
            )}

            {/* Approval block */}
            {stages[activeStageIdx].id === 'approval' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">Approved By</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                    placeholder="Authorized Person Name"
                    value={stages[activeStageIdx].approvedBy || ''}
                    onChange={(e) => handleStageUpdate(activeStageIdx, 'approvedBy', e.target.value)}
                    disabled={stages[activeStageIdx].status === 'Completed'}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">Dispatch Notes</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                    placeholder="Final instructions for shipping"
                    value={stages[activeStageIdx].dispatchNotes || ''}
                    onChange={(e) => handleStageUpdate(activeStageIdx, 'dispatchNotes', e.target.value)}
                    disabled={stages[activeStageIdx].status === 'Completed'}
                  />
                </div>
              </>
            )}

            {/* QC Configuration Interface Block */}
            {stages[activeStageIdx].id === 'qc' && (
              <div className="md:col-span-2 bg-neutral-50 dark:bg-slate-900/50 p-4 rounded-xl border border-neutral-200 dark:border-slate-700 mt-2">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Quality Check Required</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">Please inspect garments against quality standards. Failed items will be flagged for rework.</p>
                  </div>
                </div>
                <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3 block">QC Status</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="qcStatus"
                      value="Pass"
                      checked={stages[activeStageIdx].qcStatus === 'Pass'}
                      onChange={() => handleStageUpdate(activeStageIdx, 'qcStatus', 'Pass')}
                      disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Pass (Meets standards)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="qcStatus"
                      value="Fail"
                      checked={stages[activeStageIdx].qcStatus === 'Fail'}
                      onChange={() => handleStageUpdate(activeStageIdx, 'qcStatus', 'Fail')}
                      disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Fail (Requires rework)</span>
                  </label>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">Defect Notes</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent"
                    placeholder="Specific defect details if any"
                    value={stages[activeStageIdx].qcRemarks || ''}
                    onChange={(e) => handleStageUpdate(activeStageIdx, 'qcRemarks', e.target.value)}
                    disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                  />
                </div>
              </div>
            )}

            {/* General Remarks input */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">Remarks</label>
              <textarea
                className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-transparent min-h-[80px]"
                placeholder="Any additional notes"
                value={stages[activeStageIdx].remarks}
                onChange={(e) => handleStageUpdate(activeStageIdx, 'remarks', e.target.value)}
                disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-neutral-100 dark:border-slate-800">
            {stages[activeStageIdx].status === 'Pending' && (
              <button
                onClick={() => handleStartStage(activeStageIdx)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2 cursor-pointer"
              >
                Start Stage
              </button>
            )}

            {stages[activeStageIdx].status === 'In Progress' && (
              <button
                onClick={() => handleCompleteStage(activeStageIdx)}
                disabled={
                  (stages[activeStageIdx].id === 'qc' && !stages[activeStageIdx].qcStatus) ||
                  (stages[activeStageIdx].id === 'approval' && !stages[activeStageIdx].approvedBy)
                }
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Complete Stage
              </button>
            )}

            {(stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required') && (
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center">
                Stage locked (Action completed)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pending Orders Slide-Over Panel */}
      {showPendingPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowPendingPanel(false)}
          />
          {/* Panel Container */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-neutral-200 dark:border-slate-700 animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Pending Orders</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Quality &amp; Packing Queue</p>
                </div>
              </div>
              <button
                onClick={() => setShowPendingPanel(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pendingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="p-4 bg-neutral-100 dark:bg-slate-800 rounded-full mb-4">
                    <ShieldCheck className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No Pending Orders</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">All Quality &amp; Packing orders are up to date.</p>
                </div>
              ) : (
                pendingOrders.map((order: any, i: number) => (
                  <div
                    key={order.po_number || order.poNumber || i}
                    className="w-full text-left p-4 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all group flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{order.po_number || order.poNumber}</span>
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Pending</span>
                        </div>
                        {order.customer_name && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{order.customer_name}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {order.delivery_date && (
                            <span className="text-xs text-neutral-400">
                              Due: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{order.delivery_date}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleProcessOrder(order.po_number || order.poNumber)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 mt-1 cursor-pointer"
                      >
                        {isProcessing ? 'Processing...' : 'Process'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/50">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
                {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} awaiting Quality &amp; Packing
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}