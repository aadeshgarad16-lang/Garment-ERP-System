"use client";
import React, { useState } from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import LogisticsWorkflowHeader from '@/components/logistics/LogisticsWorkflowHeader';
import PackingVerification from '@/components/logistics/PackingVerification';
import ApprovalSection from '@/components/logistics/ApprovalSection';
import ComplianceDocs from '@/components/logistics/ComplianceDocs';
import DispatchSection from '@/components/logistics/DispatchSection';
import ProofOfDelivery from '@/components/logistics/ProofOfDelivery';
import FinancialClosure from '@/components/logistics/FinancialClosure';

export default function LogisticsPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [orderArchived, setOrderArchived] = useState(false);

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
    // Auto advance to next step if not the last one
    if (stepId < 6) {
      setCurrentStep(stepId + 1);
    } else {
      setOrderArchived(true);
    }
  };

  const renderActiveSection = () => {
    switch (currentStep) {
      case 1:
        return <PackingVerification onComplete={() => handleStepComplete(1)} />;
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
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            Logistics Management
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Manage dispatch, documentation, and final delivery fulfillment.</p>
        </div>
      </div>

      <LogisticsWorkflowHeader
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {orderArchived ? (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden mt-6">
          <div className="border-b border-emerald-100 px-6 py-5 bg-emerald-50/50 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-800">Order Fulfilled & Archived</h2>
            <p className="text-emerald-600 text-sm mt-1">PO-2026-004 has been successfully delivered and closed.</p>
          </div>
        </div>
      ) : (
        renderActiveSection()
      )}

    </div>
  );
}
