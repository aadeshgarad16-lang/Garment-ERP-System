"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, CheckCircle2 } from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import LogisticsWorkflowHeader from '@/components/logistics/LogisticsWorkflowHeader';
import PackingVerification from '@/components/logistics/PackingVerification';
import ApprovalSection from '@/components/logistics/ApprovalSection';
import ComplianceDocs from '@/components/logistics/ComplianceDocs';
import DispatchSection from '@/components/logistics/DispatchSection';
import ProofOfDelivery from '@/components/logistics/ProofOfDelivery';
import FinancialClosure from '@/components/logistics/FinancialClosure';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';

export default function LogisticsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [poNumber, setPoNumber] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [orderArchived, setOrderArchived] = useState(false);

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
              if (found.logisticsStep) {
                setCurrentStep(found.logisticsStep);
              }
              if (found.logisticsCompletedSteps) {
                setCompletedSteps(found.logisticsCompletedSteps);
              }
              if (found.orderArchived !== undefined) {
                setOrderArchived(found.orderArchived);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, []);

  const saveLogisticsProgress = async (step: number, completed: number[], archived: boolean) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      if (archived) {
        try {
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
          await fetch(`${BACKEND_URL}/purchase_orders/update_stage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ poNumber: po, stage: "Archived" })
          });
          window.dispatchEvent(new Event("orders-updated"));
        } catch (e) {
          console.error("Failed to archive logistics order:", e);
        }
      }
      
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? {
          ...o,
          logisticsStep: step,
          logisticsCompletedSteps: completed,
          orderArchived: archived,
          stage: archived ? "Archived" : "Logistics"
        } : o);
      });
    }
  };

  const handleStepComplete = useCallback((stepId: number) => {
    setCompletedSteps(prev => {
      const nextCompleted = prev.includes(stepId) ? prev : [...prev, stepId];
      let nextStep = currentStep;
      let nextArchived = orderArchived;

      if (stepId < 6) {
        nextStep = stepId + 1;
      } else {
        nextArchived = true;
      }

      setCurrentStep(nextStep);
      setOrderArchived(nextArchived);
      saveLogisticsProgress(nextStep, nextCompleted, nextArchived);

      return nextCompleted;
    });
  }, [currentStep, orderArchived, user?.name]);

  const renderActiveSection = () => {
    switch (currentStep) {
      case 1:
        return <PackingVerification order={currentOrder} onComplete={() => handleStepComplete(1)} />;
      case 2:
        return <ApprovalSection onComplete={() => handleStepComplete(2)} />;
      case 3:
        return <ComplianceDocs onComplete={() => handleStepComplete(3)} />;
      case 4:
        return <DispatchSection onComplete={() => handleStepComplete(4)} />;
      case 5:
        return <ProofOfDelivery onComplete={() => handleStepComplete(5)} />;
      case 6:
        return <FinancialClosure onComplete={() => handleStepComplete(6)} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Logistics" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            {t('logistics.title') || 'Logistics Management'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              {t('logistics.subtitle') || 'Manage dispatch, documentation, and final delivery fulfillment.'}
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
      </div>

      <LogisticsWorkflowHeader
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {orderArchived ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-emerald-200 overflow-hidden mt-6">
          <div className="border-b border-emerald-100 px-6 py-5 bg-emerald-50/50 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-800">{t('logistics.fulfilled') || 'Order Fulfilled & Archived'}</h2>
            <p className="text-emerald-600 text-sm mt-1">
              {(currentOrder?.poNumber || 'Order') + " " + (t('logistics.fulfilledDesc') || 'has been successfully delivered and closed.')}
            </p>
          </div>
        </div>
      ) : (
        renderActiveSection()
      )}

    </div>
  );
}
