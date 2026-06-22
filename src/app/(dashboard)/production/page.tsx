"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  PackageCheck,
  ShieldAlert,
  ClipboardCheck,
  AlignEndHorizontal
} from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';

type StageName = 'Cutting' | 'Stitching' | 'Fusing' | 'Kaj Button' | 'Finishing';
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
}

export default function ProductionPage() {
  const { t } = useTranslation();
  const [stages, setStages] = useState<StageData[]>([
    { id: 'cutting', name: 'Cutting', description: 'Fabric cutting as per pattern', icon: Scissors, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '' },
    { id: 'stitching', name: 'Stitching', description: 'Sewing and assembling pieces', icon: Layers, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '' },
    { id: 'fusing', name: 'Fusing', description: 'Apply fusible interlining', icon: Activity, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '' },
    { id: 'kaj-button', name: 'Kaj Button', description: 'Button hole & button attachment', icon: AlignEndHorizontal, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '' },
    { id: 'finishing', name: 'Finishing', description: 'Final touches & pressing', icon: PackageCheck, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '' },
  ]);

  const router = useRouter();
  const { user } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<any>(null);

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
              if (found.productionStages && found.productionStages.length > 0) {
                const remapped = found.productionStages.map((stage: any) => {
                  let icon = Scissors;
                  if (stage.id === 'stitching') icon = Layers;
                  if (stage.id === 'fusing') icon = Activity;
                  if (stage.id === 'kaj-button') icon = AlignEndHorizontal;
                  if (stage.id === 'finishing') icon = PackageCheck;
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

  const saveProductionStages = (updatedStages: StageData[]) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      const strippedStages = updatedStages.map(({ icon, ...rest }) => rest);
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? { ...o, productionStages: strippedStages } : o);
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

  const overallProductionStatus = stages.some(s => s.status === 'Rework Required')
    ? 'Rework Required'
    : stages.every(s => s.status === 'Completed')
      ? 'Completed'
      : stages.some(s => s.status === 'In Progress' || s.status === 'Completed')
        ? 'Production Started'
        : 'Awaiting Production';

  const handleStageUpdate = (idx: number, field: keyof StageData, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setStages(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      saveProductionStages(next);
      return next;
    });
  };

  const handleStartStage = (idx: number) => {
    setStages(prev => {
      const next = [...prev];
      next[idx].status = 'In Progress';
      saveProductionStages(next);
      return next;
    });
  };

  const handleCompleteStage = (idx: number) => {
    setStages(prev => {
      const next = [...prev];
      const stage = next[idx];
      stage.status = 'Completed';
      saveProductionStages(next);
      return next;
    });
    setActiveStageIdx(null); // close form on complete
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
    if (isActive) return 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10';
    switch (status) {
      case 'Completed': return 'border-emerald-200 bg-emerald-50/30';
      case 'In Progress': return 'border-blue-200 bg-blue-50/30';
      case 'Rework Required':
      case 'Failed': return 'border-red-200 bg-red-50/30';
      default: return 'border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-neutral-50 dark:hover:bg-slate-800 cursor-pointer';
    }
  };

  const getIconColor = (status: StageStatus, isActive: boolean) => {
    if (isActive) return 'text-blue-600 bg-blue-100';
    switch (status) {
      case 'Completed': return 'text-emerald-600 bg-emerald-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Rework Required':
      case 'Failed': return 'text-red-600 bg-red-100';
      default: return 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-slate-800';
    }
  };

  const ActiveIcon = activeStageIdx !== null ? stages[activeStageIdx].icon : null;

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Production" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600" />
            {t('production.title')}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">{t('production.subtitle')}</p>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${overallProductionStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
            overallProductionStatus === 'Rework Required' ? 'bg-red-100 text-red-800 border-red-200' :
              overallProductionStatus === 'Production Started' ? 'bg-blue-100 text-blue-800 dark:text-blue-200 border-blue-200' :
                'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-slate-700'
            }`}>
            {overallProductionStatus === 'Completed' ? t('orderInitiation.header.saveOrder') : overallProductionStatus === 'Rework Required' ? t('dashboard.stockAlerts.severity.critical') : overallProductionStatus === 'Production Started' ? t('dashboard.recentOrders.headers.poNumber') : t('dashboard.recentOrders.status.pending')}
          </span>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('production.overallProgress') || 'Overall Progress'}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{progressPercentage}%</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {completedStagesCount} / {stages.length} {t('production.stagesCompleted') || 'Stages Completed'}
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold">{t('production.total') || 'Total Pieces'}</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{totalOrderQty}</p>
            </div>

            {overallProductionStatus === 'Completed' && (
              <button
                onClick={() => advanceStage('/quality-packing', 'Quality & Packing')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center gap-2 group"
              >
                {t('production.proceedQuality') || 'Proceed to Quality & Packing'}
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Production Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{t(`production.${stage.id}`) || stage.name}</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5 mb-1.5">{t(`production.stages.${stage.id}.desc`) || stage.description}</p>
                  <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {stage.completedQty > 0 ? `${stage.completedQty} ${t('production.unitsProcessed') || 'units processed'}` : (t('dashboard.recentOrders.status.pending') || 'Not started')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeStageIdx !== null && ActiveIcon && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden mt-6 animate-in fade-in slide-in-from-top-4">
          <div className="border-b border-neutral-200 dark:border-slate-700 px-4 py-3 bg-neutral-50/50 dark:bg-slate-800/30 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <ActiveIcon className="h-5 w-5 text-indigo-500" />
              {t(`production.${stages[activeStageIdx].id}`) || stages[activeStageIdx].name} {t('production.update') || 'Update'}
            </h2>
            <button onClick={() => setActiveStageIdx(null)} className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700">
              {t('back') || 'Close'}
            </button>
          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('production.supervisor') || 'Supervisor Name'}</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={t('production.supervisorPlaceholder') || "Enter supervisor name"}
                  value={stages[activeStageIdx].supervisor}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'supervisor', e.target.value)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('production.completedQty') || 'Completed Quantity'}</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`Max: ${totalOrderQty}`}
                  max={totalOrderQty}
                  value={stages[activeStageIdx].completedQty || ''}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'completedQty', parseInt(e.target.value) || 0)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('production.startTime') || 'Start Time'}</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                  value={stages[activeStageIdx].startTime}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'startTime', e.target.value)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('production.endTime') || 'End Time'}</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                  value={stages[activeStageIdx].endTime}
                  onChange={(e) => handleStageUpdate(activeStageIdx, 'endTime', e.target.value)}
                  disabled={stages[activeStageIdx].status === 'Completed' || stages[activeStageIdx].status === 'Rework Required'}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mb-1">{t('orderInitiation.orderForm.uploadPO') || 'General Remarks'}</label>
                <textarea
                  className="w-full px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 border rounded-lg border-neutral-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
                  placeholder={t('production.remarksPlaceholder') || "Any stage-specific notes"}
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
                    stages[activeStageIdx].completedQty > totalOrderQty
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
