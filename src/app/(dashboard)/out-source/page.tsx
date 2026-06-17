"use client";

import React from 'react';
import { Layers, PackageCheck } from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useRouter } from 'next/navigation';

export default function OutSourcePage() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Material Allocation" />

      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Outsource Management</h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
            Choose the preferred outsourcing model for your upcoming orders. Select whether you want complete end-to-end processing or specific production stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Complete Outsourced */}
          <div
            onClick={() => router.push('/out-source/complete')}
            className="cursor-pointer rounded-2xl p-6 border-2 border-slate-200 transition-all duration-200 group bg-white hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl transition-colors bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                <PackageCheck size={28} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 transition-colors group-hover:text-blue-900">
                Complete Outsourced
              </h2>
            </div>
            <p className="text-slate-500 leading-relaxed text-sm">
              Delegate the full garment creation lifecycle, from materials to finishing.
            </p>
          </div>

          {/* Option 2: Outsource Service */}
          <div
            onClick={() => router.push('/out-source/Outsource-Service')}
            className="cursor-pointer rounded-2xl p-6 border-2 border-slate-200 transition-all duration-200 group bg-white hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl transition-colors bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200">
                <Layers size={28} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 transition-colors group-hover:text-emerald-900">
                Outsource Service
              </h2>
            </div>
            <p className="text-slate-500 leading-relaxed text-sm">
              Manage materials internally and outsource specific assembly steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
