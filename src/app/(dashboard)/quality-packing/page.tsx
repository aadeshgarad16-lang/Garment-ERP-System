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
  ShieldAlert
} from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';

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
  // Specific fields
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
  const { user } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const [stages, setStages] = useState<StageData[]>([
    { id: 'qc', name: 'Quality Check', description: 'Inspect for defects & standards', icon: ClipboardCheck, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', qcStatus: null, qcRemarks: '' },
    { id: 'packing', name: 'Packing', description: 'Pack finished products', icon: Package, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', packedQty: 0 },
    { id: 'verification', name: 'Packing & Verification', description: 'Verify packed items & quantities', icon: ListChecks, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', verifiedQty: 0 },
    { id: 'approval', name: 'Approval', description: 'Final approval for dispatch', icon: CheckCircle2, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', approvedBy: '', dispatchNotes: '' },
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const po = params.get('poNumber');
      if (po) {
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
      case 'Pending': return <span className="bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('dashboard.recentOrders.status.pending') || 'Pending'}</span>;
      case 'In Progress': return <span className="bg-blue-100 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('dashboard.recentOrders.headers.poNumber') || 'In Progress'}</span>;
      case 'Completed': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('orderInitiation.header.saveOrder') || 'Completed'}</span>;
      case 'Failed':
      case 'Rework Required': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{t('dashboard.stockAlerts.severity.critical') || 'Rework Required'}</span>;
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

  const ActiveIcon = activeStageIdx !== null ? stages[activeStageIdx].icon : null;

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Quality & Packing" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            {t('quality.title')}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">{t('quality.subtitle')}</p>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${overallStatus === 'Ready for Dispatch' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
            overallStatus === 'Rework Required' ? 'bg-red-100 text-red-800 border-red-200' :
              overallStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:text-blue-200 border-blue-200' :
                'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-slate-700'
            }`}>
            {overallStatus === 'Ready for Dispatch' ? (t('quality.readyDispatch') || 'Ready for Dispatch') : overallStatus === 'Rework Required' ? t('dashboard.stockAlerts.severity.critical') : overallStatus === 'In Progress' ? t('dashboard.recentOrders.headers.poNumber') : t('dashboard.recentOrders.status.pending')}
          </span>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('quality.progress') || 'Overall Progress'}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{progressPercentage}%</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {completedStagesCount} / {stages.length} {t('quality.stagesCompleted') || 'Stages Completed'}
                </span>
              </div>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex gap-4 md:gap-8 flex-shrink-0 items-center">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold">{t('pieces') || 'Total Pieces'}</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{totalOrderQty}</p>
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
              className={`rounded-xl border p-4 transition-all cursor-pointer ${getStageCardColor(stage.status, isActive)}`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${getIconColor(stage.status, isActive)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {getStatusBadge(stage.status)}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{t(`quality.${stage.id}`) || stage.name}</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5 mb-1.5">{t(`quality.stages.${stage.id}.desc`) || stage.description}</p>
                  <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
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
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden mt-6 animate-in fade-in slide-in-from-top-4">
          <div className="border-b border-neutral-200 dark:border-slate-700 px-4 py-3 bg-neutral-50/50 dark:bg-slate-800/30 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <ActiveIcon className="h-5 w-5 text-indigo-500" />
              {t(`orderInitiation.tracker.${stages[activeStageIdx].id}`) || stages[activeStageIdx].name} {t('quality.dataEntry') || 'Data Entry'}
            </h2>
            <button onClick={() => setActiveStageIdx(null)} className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700">
              {t('orderInitiation.buttons.back') || 'Close'}
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Supervisor Field (Shared except for Approval) */}
              {stages[activeStageIdx].id !== 'approval' && (
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">
                    {stages[activeStageIdx].id === 'verification' ? (t('quality.verificationSupervisor') || 'Verification Supervisor') : (t('production.supervisor') || 'Supervisor Name')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={t('production.supervisorPlaceholder') || "Enter name"}
                    value={stages[activeStageIdx].supervisor}
                    onChange={(e) => handleStageUpdate(activeStageIdx, 'supervisor', e.target.value)}
                    disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                  />
                </div>
              )}

              {/* Quantity Fields */}
              {stages[activeStageIdx].id === 'qc' && (
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('quality.itemsChecked') || 'Items Checked'}</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                    value={stages[activeStageIdx].completedQty || ''}
                    onChange={(e) => handleStageUpdate(activeStageIdx, 'completedQty', parseInt(e.target.value) || 0)}
                    disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                  />
                </div>
              )}

              {stages[activeStageIdx].id === 'packing' && (
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('quality.packedQty') || 'Packed Quantity'}</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                    value={stages[activeStageIdx].packedQty || ''}
                    onChange={(e) => handleStageUpdate(activeStageIdx, 'packedQty', parseInt(e.target.value) || 0)}
                    disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                  />
                </div>
              )}

              {stages[activeStageIdx].id === 'verification' && (
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('quality.verifiedQty') || 'Verified Quantity'}</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                    value={stages[activeStageIdx].verifiedQty || ''}
                    onChange={(e) => handleStageUpdate(activeStageIdx, 'verifiedQty', parseInt(e.target.value) || 0)}
                    disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                  />
                </div>
              )}

              {/* Approval Fields */}
              {stages[activeStageIdx].id === 'approval' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('quality.approvedBy') || 'Approved By'}</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('production.supervisorPlaceholder') || "Authorized Person Name"}
                      value={stages[activeStageIdx].approvedBy || ''}
                      onChange={(e) => handleStageUpdate(activeStageIdx, 'approvedBy', e.target.value)}
                      disabled={stages[activeStageIdx].status === 'Completed'}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('quality.dispatchNotes') || 'Dispatch Notes'}</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('quality.dispatchNotesPlaceholder') || "Final instructions for shipping"}
                      value={stages[activeStageIdx].dispatchNotes || ''}
                      onChange={(e) => handleStageUpdate(activeStageIdx, 'dispatchNotes', e.target.value)}
                      disabled={stages[activeStageIdx].status === 'Completed'}
                    />
                  </div>
                </>
              )}

              {/* QC Specific Block */}
              {stages[activeStageIdx].id === 'qc' && (
                <div className="md:col-span-2 bg-neutral-50 dark:bg-slate-900 p-4 rounded-lg border border-neutral-200 dark:border-slate-700 mt-2">
                  <div className="flex items-start gap-3 mb-4">
                    <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-800">{t('quality.qcRequired') || 'Quality Check Required'}</h4>
                      <p className="text-sm text-amber-700 mt-1">{t('quality.qcDesc') || 'Please inspect garments against quality standards. Failed items will be flagged for rework.'}</p>
                    </div>
                  </div>
                  <label className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3 block">{t('quality.qcStatus') || 'QC Status'}</label>
                  <div className="flex gap-4">
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
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('quality.pass') || 'Pass (Meets standards)'}</span>
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
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('quality.fail') || 'Fail (Requires rework)'}</span>
                    </label>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('quality.defectNotes') || 'Defect Notes'}</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('quality.defectNotesPlaceholder') || "Specific defect details if any"}
                      value={stages[activeStageIdx].qcRemarks || ''}
                      onChange={(e) => handleStageUpdate(activeStageIdx, 'qcRemarks', e.target.value)}
                      disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                    />
                  </div>
                </div>
              )}

              {/* General Remarks */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('orderInitiation.orderForm.uploadPO') || 'Remarks'}</label>
                <textarea
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
                  placeholder={t('production.remarksPlaceholder') || "Any additional notes"}
                  value={stages[activeStageIdx].remarks}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'remarks', e.target.value)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-neutral-100 dark:border-slate-800">
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
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center">
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
