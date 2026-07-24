"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Package,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  ChevronRight,
  ShieldAlert,
  User,
  Activity
} from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';

type StageName = 'Quality Check' | 'Packing' | 'Packing & Verification' | 'Approval';
type StageStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Rework Required';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface TaskAssignment {
  id: string;
  assignee: string;
  taskName: string;
  targetQty: number;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  sizes?: Record<string, number>;
  passedQty?: number;
  failedQty?: number;
}

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
  // Specific fields
  qcStatus?: 'Pass' | 'Fail' | null;
  qcRemarks?: string;
  packedQty?: number;
  verifiedQty?: number;
  approvedBy?: string;
  dispatchNotes?: string;
  tasks?: TaskAssignment[];
}

export default function QualityPackingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [poNumber, setPoNumber] = useState<string>('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const [stages, setStages] = useState<StageData[]>([
    { 
      id: 'qc', name: 'Quality Check', description: 'Inspect for defects & standards', icon: ClipboardCheck, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', qcStatus: null, qcRemarks: '',
      tasks: [
        { id: 't1', assignee: 'Jamal', taskName: 'Quality Inspection', targetQty: 500, startTime: '09:00', endTime: '', status: 'In Progress', sizes: { '34': 250, '36': 250 }, passedQty: 240, failedQty: 10 },
        { id: 't2', assignee: 'Christie', taskName: 'Final Defect Check', targetQty: 200, startTime: '', endTime: '', status: 'Pending', sizes: { '38': 200 } }
      ]
    },
    { 
      id: 'packing', name: 'Packing', description: 'Pack finished products', icon: Package, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', packedQty: 0,
      tasks: [
        { id: 't3', assignee: 'Alex', taskName: 'Polybag Packing', targetQty: 1000, startTime: '08:00', endTime: '12:00', status: 'Completed', sizes: { '34': 300, '36': 300, '38': 400 }, passedQty: 1000, failedQty: 0 }
      ] 
    },
    { id: 'verification', name: 'Packing & Verification', description: 'Verify packed items & quantities', icon: ListChecks, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', verifiedQty: 0, tasks: [] },
    { id: 'approval', name: 'Approval', description: 'Final approval for dispatch', icon: CheckCircle2, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', approvedBy: '', dispatchNotes: '', tasks: [] },
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const po = params.get('poNumber');
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
    }
  }, []);

  const saveQualityStages = (updatedStages: StageData[]) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      const strippedStages = updatedStages.map(({ icon, ...rest }) => rest);
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? { ...o, qualityStages: strippedStages } : o);
      });
    }
  };

  const totalOrderQty = currentOrder?.specs?.reduce((sum: number, spec: any) => sum + (Number(spec.quantity) || 0), 0) || 1000;

  const advanceStage = (nextPath: string, nextStage: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? { ...o, stage: nextStage } : o);
      });
      router.push(`${nextPath}?poNumber=${encodeURIComponent(po)}`);
    } else {
      router.push(nextPath);
    }
  };

  const [activeStageIdx, setActiveStageIdx] = useState<number | null>(null);

  const completedStagesCount = stages.filter(s => s.status === 'Completed').length;
  const progressPercentage = Math.round((completedStagesCount / stages.length) * 100);

  const qcStage = stages.find(s => s.id === 'qc');
  const qcPassedCount = qcStage && qcStage.status === 'Completed' && qcStage.qcStatus === 'Pass' ? (qcStage.completedQty || totalOrderQty) : 0;
  const qcFailedCount = qcStage && qcStage.status === 'Rework Required' && qcStage.qcStatus === 'Fail' ? (qcStage.completedQty || totalOrderQty) : 0;

  const overallStatus = stages.some(s => s.status === 'Rework Required')
    ? 'Rework Required'
    : stages.every(s => s.status === 'Completed')
      ? 'Ready for Dispatch'
      : stages.some(s => s.status === 'In Progress' || s.status === 'Completed')
        ? 'In Progress'
        : 'Awaiting Validation';

  const handleStageUpdate = (idx: number, field: keyof StageData, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
      case 'Pending': return <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('dashboard.recentOrders.status.pending') || 'Pending'}</span>;
      case 'In Progress': return <span className="bg-blue-100 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('dashboard.recentOrders.status.inProduction') || 'In Progress'}</span>;
      case 'Completed': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('quality.stageComplete') || 'Completed'}</span>;
      case 'Failed':
      case 'Rework Required': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('dashboard.stockAlerts.severity.critical') || 'Rework Required'}</span>;
      default: return null;
    }
  };

  const getStageCardColor = (status: StageStatus, isActive: boolean, stageId: string) => {
    if (isActive) {
      switch(stageId) {
        case 'qc': return 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10 dark:bg-blue-900/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]';
        case 'packing': return 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/10 dark:bg-purple-900/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]';
        case 'verification': return 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/10 dark:bg-amber-900/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
        case 'approval': return 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/10 dark:bg-rose-900/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
        default: return 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10 dark:bg-card/20';
      }
    }
    switch (status) {
      case 'Completed': return 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/20';
      case 'In Progress': return 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-card/20';
      case 'Rework Required':
      case 'Failed': return 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/20';
      default: return 'border-border bg-card hover:bg-muted cursor-pointer';
    }
  };

  const getIconColor = (status: StageStatus, isActive: boolean, stageId: string) => {
    if (isActive) {
      switch(stageId) {
         case 'qc': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40';
         case 'packing': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40';
         case 'verification': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40';
         case 'approval': return 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40';
      }
    }
    switch(stageId) {
       case 'qc': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
       case 'packing': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
       case 'verification': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20';
       case 'approval': return 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/20';
       default: return 'text-muted-foreground bg-muted';
    }
  };

  const ActiveIcon = activeStageIdx !== null ? stages[activeStageIdx].icon : null;

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Quality & Packing" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            {t('quality.title')}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">
              {t('quality.subtitle')}
            </p>
            {poNumber && (
              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
                {poNumber}
              </span>
            )}
            {currentOrder?.customerName && (
              <span className="text-neutral-400 dark:text-neutral-500 text-xs flex items-center gap-1">
                <span>•</span>
                <span>Customer: <strong className="text-neutral-700 dark:text-neutral-300">{currentOrder.customerName}</strong></span>
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setPopoverOpen(!popoverOpen)}
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border transition-colors shadow-sm cursor-pointer ${
              overallStatus === 'Ready for Dispatch' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200' :
              overallStatus === 'Rework Required' ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' :
              overallStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:text-blue-200 border-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/40' :
              'bg-muted text-card-foreground border-border hover:bg-neutral-200 dark:hover:bg-slate-700'
            }`}
          >
            {overallStatus === 'Ready for Dispatch' ? (t('quality.readyDispatch') || 'Ready for Dispatch') :
              overallStatus === 'Rework Required' ? (t('dashboard.stockAlerts.severity.critical') || 'Rework Required') :
                overallStatus === 'In Progress' ? (t('dashboard.recentOrders.status.inProduction') || 'In Progress') :
                  (t('dashboard.recentOrders.status.pending') || 'Pending')}
          </button>
          
          {popoverOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-neutral-50 dark:bg-card/80 px-4 py-3 border-b border-border">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending at Quality & Packing</h3>
              </div>
              <div className="p-2 space-y-1">
                {['PO-2026-002', 'PO-2026-005', 'PO-2026-008'].map(po => (
                  <div key={po} className="flex justify-between items-center px-3 py-2.5 hover:bg-muted rounded-xl transition-colors group">
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{po}</span>
                    <button
                      onClick={() => {
                        setPoNumber(po);
                        setPopoverOpen(false);
                      }}
                      className="px-5 py-1.5 bg-[#0070F3] hover:bg-[#005AE0] text-white text-xs font-bold rounded-full transition-colors shadow-sm"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('quality.progress') || 'Overall Progress'}</p>
                <p className="text-2xl font-bold text-foreground">{progressPercentage}%</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {completedStagesCount} / {stages.length} {t('quality.stagesCompleted') || 'Stages Completed'}
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex gap-4 md:gap-8 flex-shrink-0 items-center">
            {poNumber && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">PO Number</p>
                <p className="text-xl font-bold text-foreground">{poNumber}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">{t('pieces') || 'Total Pieces'}</p>
              <p className="text-xl font-bold text-foreground">{totalOrderQty}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 uppercase font-semibold">{t('quality.passed') || 'QC Passed'}</p>
              <p className="text-xl font-bold text-emerald-700">{qcPassedCount}</p>
            </div>
            <div>
              <p className="text-xs text-red-600 uppercase font-semibold">{t('quality.failed') || 'QC Failed'}</p>
              <p className="text-xl font-bold text-red-700">{qcFailedCount}</p>
            </div>

            {overallStatus === 'Ready for Dispatch' && (
              <button
                onClick={() => advanceStage('/logistics', 'Logistics')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center gap-2 group"
              >
                {t('quality.proceedLogistics') || 'Proceed to Logistics'}
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = activeStageIdx === idx;
          return (
            <div
              key={stage.name}
              onClick={() => setActiveStageIdx(idx)}
              className={`rounded-xl border p-4 transition-all cursor-pointer ${getStageCardColor(stage.status, isActive, stage.id)}`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${getIconColor(stage.status, isActive, stage.id)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {getStatusBadge(stage.status)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{t(`quality.${stage.id}`) || stage.name}</h3>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 mb-1.5">{t(`quality.stages.${stage.id}.desc`) || stage.description}</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stage.status === 'Completed' ? (t('quality.stageComplete') || 'Stage complete') : stage.status === 'In Progress' ? (t('quality.actionRequired') || 'Action required') : (t('quality.pendingValidation') || 'Pending validation')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tracking Form */}
      {activeStageIdx !== null && ActiveIcon && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mt-6 animate-in fade-in slide-in-from-top-4">
          <div className="border-b border-border px-4 py-3 bg-neutral-50/50 dark:bg-card/30 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <ActiveIcon className="h-5 w-5 text-indigo-500" />
              {t(`orderInitiation.tracker.${stages[activeStageIdx].id}`) || stages[activeStageIdx].name} Update
            </h2>
            <div className="flex items-center gap-2">
              <button className="text-xs font-semibold px-3 py-1.5 h-8 border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors flex items-center gap-1.5">
                + Add Person
              </button>
              <button onClick={() => setActiveStageIdx(null)} className="text-xs font-semibold px-3 py-1.5 h-8 border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors flex items-center gap-1.5">
                {t('orderInitiation.buttons.back') || 'Return'}
              </button>
            </div>
          </div>

          <div className="p-0">
            {/* Kanban Columns Header */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_1fr_1fr] border-b border-border bg-neutral-50/50 dark:bg-[#0f1523]">
              <div className="p-4 hidden md:flex items-center gap-2 border-r border-border">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Worker / Assigned</span>
              </div>
              <div className="p-4 flex items-center gap-2 border-r md:border-r border-border border-b md:border-b-0">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">PENDING</span>
              </div>
              <div className="p-4 flex items-center gap-2 border-r md:border-r border-border border-b md:border-b-0">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">IN PROGRESS</span>
              </div>
              <div className="p-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">COMPLETED</span>
              </div>
            </div>

            {/* Tasks Grouped by Worker */}
            <div className="divide-y divide-border">
              {(!stages[activeStageIdx].tasks || stages[activeStageIdx].tasks!.length === 0) ? (
                 <div className="p-8 text-center text-muted-foreground text-sm">No tasks assigned for this stage yet. Click "+ Add Person" to begin.</div>
              ) : Object.entries(stages[activeStageIdx].tasks!.reduce((acc, task) => {
                if (!acc[task.assignee]) acc[task.assignee] = [];
                acc[task.assignee].push(task);
                return acc;
              }, {} as Record<string, TaskAssignment[]>)).map(([assignee, assigneeTasks]) => (
                <div key={assignee} className="grid grid-cols-1 md:grid-cols-[300px_1fr_1fr_1fr] hover:bg-neutral-50/30 dark:hover:bg-neutral-800/10 transition-colors">
                  {/* Column 1: Row Indicator */}
                  <div className="px-6 py-5 flex flex-col justify-start bg-neutral-50/30 dark:bg-[#151c2c]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <User className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">{assignee}</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-muted text-neutral-500 px-2 py-0.5 rounded-full self-start inline-flex">{assigneeTasks.length} Tasks</span>
                  </div>

                  {/* Column 2: Pending */}
                  <div className="p-4 border-t md:border-t-0 md:border-l border-border flex flex-col gap-3">
                    {assigneeTasks.filter(t => t.status === 'Pending').map(task => (
                      <div key={task.id} className="bg-card dark:bg-[#1e293b] rounded-xl shadow-md border border-border p-4 border-l-4 border-l-red-500 hover:border-red-500/50 hover:shadow-lg transition-all">
                        <p className="text-xs font-bold text-card-foreground mb-2">{task.taskName}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 mb-2">
                          <div>
                            <span className="block uppercase tracking-wider text-neutral-500">Target Qty</span>
                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.targetQty} Pcs</span>
                          </div>
                          <div>
                            <span className="block uppercase tracking-wider text-neutral-500">Start Time</span>
                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.startTime || '--:--'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1 bg-neutral-100 dark:bg-slate-800/60 rounded-md border border-neutral-200/60 dark:border-slate-700/50 text-[9px]">
                          <span className="font-bold text-neutral-600 dark:text-neutral-300">Sizes: <span className="text-indigo-600 dark:text-indigo-400">{task.sizes ? Object.keys(task.sizes).join(', ') : 'All'}</span></span>
                          <span className="text-neutral-300 dark:text-slate-600">|</span>
                          <span className="font-medium text-neutral-500">Pcs: {task.targetQty}</span>
                        </div>
                      </div>
                    ))}
                    {assigneeTasks.filter(t => t.status === 'Pending').length === 0 && (
                      <div className="border border-neutral-200/50 dark:border-[#26334d] border-dashed rounded-xl h-[92px] w-full bg-neutral-50/30 dark:bg-[#131b2e]"></div>
                    )}
                  </div>

                  {/* Column 3: In Progress */}
                  <div className="p-4 border-t md:border-t-0 md:border-l border-border flex flex-col gap-3">
                    {assigneeTasks.filter(t => t.status === 'In Progress').map(task => (
                      <div key={task.id} className="bg-card dark:bg-[#1e293b] rounded-xl shadow-md border border-border p-4 border-l-4 border-l-amber-400 hover:border-amber-400/50 hover:shadow-lg transition-all">
                        <p className="text-xs font-bold text-card-foreground mb-2">{task.taskName}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 mb-2">
                          <div>
                            <span className="block uppercase tracking-wider text-neutral-500">Target Qty</span>
                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.targetQty} Pcs</span>
                          </div>
                          <div>
                            <span className="block uppercase tracking-wider text-neutral-500">Start Time</span>
                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.startTime || '--:--'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1 bg-neutral-100 dark:bg-slate-800/60 rounded-md border border-neutral-200/60 dark:border-slate-700/50 text-[9px]">
                          <span className="font-bold text-neutral-600 dark:text-neutral-300">Sizes: <span className="text-indigo-600 dark:text-indigo-400">{task.sizes ? Object.keys(task.sizes).join(', ') : 'All'}</span></span>
                          <span className="text-neutral-300 dark:text-slate-600">|</span>
                          <span className="font-medium text-neutral-500">Pcs: {task.targetQty}</span>
                        </div>
                      </div>
                    ))}
                    {assigneeTasks.filter(t => t.status === 'In Progress').length === 0 && (
                      <div className="border border-neutral-200/50 dark:border-[#26334d] border-dashed rounded-xl h-[92px] w-full bg-neutral-50/30 dark:bg-[#131b2e]"></div>
                    )}
                  </div>

                  {/* Column 4: Completed */}
                  <div className="p-4 border-t md:border-t-0 md:border-l border-border flex flex-col gap-3">
                    {assigneeTasks.filter(t => t.status === 'Completed').map(task => (
                      <div key={task.id} className="relative bg-card dark:bg-[#1e293b] rounded-xl shadow-md border border-border p-4 border-l-4 border-l-emerald-500 hover:border-emerald-500/50 hover:shadow-lg transition-all">
                        <p className="text-xs font-bold text-card-foreground mb-2">{task.taskName}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 mb-2">
                          <div>
                            <span className="block uppercase tracking-wider text-neutral-500">Target Qty</span>
                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.targetQty} Pcs</span>
                          </div>
                          <div>
                            <span className="block uppercase tracking-wider text-neutral-500">End Time</span>
                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.endTime || '--:--'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-neutral-100 dark:bg-slate-800/60 rounded-md border border-neutral-200/60 dark:border-slate-700/50 text-[9px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-600 dark:text-neutral-300">Sizes: <span className="text-indigo-600 dark:text-indigo-400">{task.sizes ? Object.keys(task.sizes).join(', ') : 'All'}</span></span>
                            <span className="text-neutral-300 dark:text-slate-600">|</span>
                            <span className="font-medium text-neutral-500">Pcs: {task.targetQty}</span>
                          </div>
                          {stages[activeStageIdx].id === 'qc' && task.passedQty !== undefined && task.failedQty !== undefined && (
                            <div className="flex items-center gap-3 pt-1 border-t border-border mt-0.5">
                              <span className="text-emerald-600 font-bold">Passed: {task.passedQty}</span>
                              <span className="text-red-600 font-bold">Failed: {task.failedQty}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {assigneeTasks.filter(t => t.status === 'Completed').length === 0 && (
                      <div className="border border-neutral-200/50 dark:border-[#26334d] border-dashed rounded-xl h-[92px] w-full bg-neutral-50/30 dark:bg-[#131b2e]"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-card">

            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-neutral-100 dark:border-border">
              {stages[activeStageIdx].status === 'Pending' && (
                <button
                  onClick={() => handleStartStage(activeStageIdx)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  {t('production.startStage') || 'Start Stage'}
                </button>
              )}

              {stages[activeStageIdx].status === 'In Progress' && (
                <button
                  onClick={() => handleCompleteStage(activeStageIdx)}
                  disabled={
                    (stages[activeStageIdx].id === 'qc' && !stages[activeStageIdx].qcStatus) ||
                    (stages[activeStageIdx].id === 'approval' && !stages[activeStageIdx].approvedBy)
                  }
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('production.completeStage') || 'Complete Stage'}
                </button>
              )}

              {(stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required') && (
                <span className="text-sm font-medium text-muted-foreground flex items-center">
                  {t('production.stageLocked') || 'Stage locked (Action completed)'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}