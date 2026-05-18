import React from 'react';
import { ChevronRight } from 'lucide-react';

// Full workflow sequence used to determine if a step is in the past
const allSteps = [
  'Order Initiation',
  'BOM Calculation',
  'Inventory Check',
  'Procurement',
  'Material Allocation',
  'Material Release',
  'Production',
  'Quality & Packing',
  'Logistics',
  'Completed'
];

// Steps to actually display in the indicator
const displaySteps = [
  'Order Initiation',
  'BOM Calculation',
  'Inventory Check',
  'Procurement',
  'Material Allocation',
  'Material Release',
  'Production'
];

export default function WorkflowIndicator({ currentStep }: { currentStep: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 text-sm bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
      {displaySteps.map((step, index) => {
        const isActive = step === currentStep;
        // If current step is not found, fallback to original logic (though it should be in allSteps)
        const currentIndex = allSteps.indexOf(currentStep) !== -1 ? allSteps.indexOf(currentStep) : displaySteps.indexOf(currentStep);
        const stepIndex = allSteps.indexOf(step);
        const isPast = stepIndex < currentIndex;
        
        return (
          <React.Fragment key={step}>
            <span 
              className={`font-medium px-2 py-1 rounded-md transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : isPast 
                    ? 'text-neutral-600' 
                    : 'text-neutral-400'
              }`}
            >
              {step}
            </span>
            {index < displaySteps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-neutral-300 flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
