import React from 'react';
import { Scissors, PenTool, CheckSquare, Package } from 'lucide-react';

interface StageProps {
  label: string;
  icon: React.ReactNode;
  color: string;
}

const stages: StageProps[] = [
  { label: 'Cutting', icon: <Scissors className="h-4 w-4" />, color: 'bg-blue-500' },
  { label: 'Stitching', icon: <PenTool className="h-4 w-4" />, color: 'bg-indigo-500' },
  { label: 'Checking', icon: <CheckSquare className="h-4 w-4" />, color: 'bg-orange-500' },
  { label: 'Packing', icon: <Package className="h-4 w-4" />, color: 'bg-emerald-500' },
];

export default function ProductionStatus() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 w-full overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800">
        <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
          Production Status
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {stages.map((stage, index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-sm font-medium">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                <span className="text-neutral-400 dark:text-neutral-500">{stage.icon}</span>
                <span>{stage.label}</span>
              </div>
              <div className="text-neutral-400 dark:text-neutral-500 text-xs font-semibold">
                0 / 0 units
              </div>
            </div>
            
            <div className="h-2 w-full bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                style={{ width: '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
