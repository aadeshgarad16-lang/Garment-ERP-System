"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ClipboardCheck, FilePlus, ChevronRight } from 'lucide-react';

interface Step {
  name: string;
  icon: React.ReactElement;
  color: string; // Tailwind text color class
  href: string;
  count: number;
}

interface ProcurementStepperProps {
  dashboardCount?: number;
  reviewCount?: number;
  createCount?: number;
}

const ProcurementStepper: React.FC<ProcurementStepperProps> = ({ dashboardCount, reviewCount, createCount }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState({ dashboard: 0, review: 0, create: 0 });

  useEffect(() => {
    const fetchGlobalCounts = async () => {
      try {
        const res = await fetch('/api/procurement/stage-counts');
        const data = await res.json();
        if (data.success) {
          let rCount = data.reviewCount;
          let cCount = data.createCount;

          const sessionStr = sessionStorage.getItem('procurement_po_drafts');
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            rCount = session.length;
          }
          
          if (window.location.pathname.includes('/create-po')) {
            cCount = 1;
          }

          setCounts({
            dashboard: data.pendingCount,
            review: rCount,
            create: cCount
          });
        }
      } catch (e) {
        console.error('Failed to fetch global stage counts', e);
      }
    };

    fetchGlobalCounts();
    
    // Listen for storage changes to refresh counts
    const handleStorageChange = () => {
      fetchGlobalCounts();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]);

  const steps: Step[] = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />, 
      color: 'text-cyan-400',
      href: '/procurement',
      count: dashboardCount !== undefined ? dashboardCount : counts.dashboard,
    },
    {
      name: 'Review PO',
      icon: <ClipboardCheck className="w-5 h-5" />, 
      color: 'text-amber-400',
      href: '/procurement/review-po',
      count: reviewCount !== undefined ? reviewCount : counts.review,
    },
    {
      name: 'Create PO',
      icon: <FilePlus className="w-5 h-5" />, 
      color: 'text-purple-400',
      href: '/procurement/create-po',
      count: createCount !== undefined ? createCount : counts.create,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/procurement') return pathname === '/procurement';
    return pathname?.startsWith(href);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm rounded-xl p-4 mb-8">
      <div className="flex items-center justify-around w-full max-w-3xl mx-auto gap-8">
        {steps.map((step, idx) => {
          const active = isActive(step.href);
          return (
            <React.Fragment key={step.name}>
              <div
                className="flex flex-col items-center gap-2 cursor-pointer group transition-all"
                onClick={() => router.push(step.href)}
              >
                <div className={`transition-all duration-300 ${active ? `${step.color} scale-110 drop-shadow-[0_0_8px_currentColor]` : 'text-slate-500 group-hover:text-slate-400'}`}>
                  {step.icon}
                </div>
                <div className={`text-sm transition-colors ${active ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 font-medium'}`}>
                  {step.name}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${active ? 'bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-100 dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border border-transparent group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                  {step.count} Pending
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex items-center justify-center">
                  <ChevronRight className="text-slate-600 text-lg w-6 h-6" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProcurementStepper;
