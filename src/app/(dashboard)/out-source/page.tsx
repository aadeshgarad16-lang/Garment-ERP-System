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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Outsource Management</h1>
          <p className="text-slate-500 dark:text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            Choose the preferred outsourcing model for your upcoming orders. Select whether you want complete end-to-end processing or specific production stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Complete Outsourced */}
          <div
            onClick={() => router.push('/out-source/complete')}
            className="cursor-pointer rounded-2xl p-6 border border-slate-200 dark:border-border transition-all duration-200 group bg-white dark:bg-card hover:border-blue-500 hover:shadow-md"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl transition-colors bg-blue-100/10 text-blue-500 group-hover:bg-blue-500/20">
                <PackageCheck size={28} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors">
                Complete Outsourced
              </h2>
            </div>
            <p className="text-slate-600 dark:text-zinc-300 leading-relaxed text-sm">
              Delegate the full garment creation lifecycle, from materials to finishing.
            </p>
          </div>

          {/* Option 2: Outsource Service */}
          <div
            onClick={() => router.push('/out-source/Outsource-Service')}
            className="cursor-pointer rounded-2xl p-6 border border-slate-200 dark:border-border transition-all duration-200 group bg-white dark:bg-card hover:border-emerald-500 hover:shadow-md"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl transition-colors bg-emerald-100/10 text-emerald-500 group-hover:bg-emerald-500/20">
                <Layers size={28} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors">
                Outsource Service
              </h2>
            </div>
            <p className="text-slate-600 dark:text-zinc-300 leading-relaxed text-sm">
              Manage materials internally and outsource specific assembly steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
