"use client";
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/contexts/order-context';
import {
  Factory,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  ChevronRight,
  ClipboardList,
  Scissors,
  Package,
  User
} from 'lucide-react';

export default function ProductionDashboardPage() {
  const { orders } = useOrders();
  const router = useRouter();
  
  // State for interactive process filtering
  const [activeFilterStage, setActiveFilterStage] = useState<string | null>(null);
  
  // State for popover visibility
  const [activePopoverStage, setActivePopoverStage] = useState<string | null>(null);

  // 1. Global Data Binding & Filter
  const activeProductionOrders = useMemo(() => {
    return orders.filter(o => o.stage === 'Production' || o.stage === 'production' || o.currentStage === 8 || o.current_stage === 'Production');
  }, [orders]);

  // Helper to compute Active Stage dynamically for accurate stage-gate progression
  const getActiveStageData = (order: any) => {
    let activeStage = 'Cutting';
    let activeStatus = 'Pending';
    
    if (order.productionStages && order.productionStages.length > 0) {
      const inProgress = order.productionStages.find((s: any) => s.status === 'In Progress');
      const failed = order.productionStages.find((s: any) => s.status === 'Failed' || s.status === 'Rework Required');
      
      if (failed) {
        activeStage = failed.name;
        activeStatus = failed.status;
      } else if (inProgress) {
        activeStage = inProgress.name;
        activeStatus = inProgress.status;
      } else {
        const lastCompleted = [...order.productionStages].reverse().find((s: any) => s.status === 'Completed');
        if (lastCompleted) {
          const allSteps = ['Cutting', 'Stitching', 'Fusing', 'Kaj Button', 'Finishing'];
          const idx = allSteps.findIndex(step => step.toLowerCase() === lastCompleted.name?.toLowerCase());
          
          if (idx >= 0 && idx < allSteps.length - 1) {
            // Drop into the next queue if completed
            activeStage = allSteps[idx + 1];
            activeStatus = 'Pending';
          } else if (idx === allSteps.length - 1) {
            activeStage = lastCompleted.name;
            activeStatus = 'Completed';
          }
        }
      }
    }
    return { activeStage, activeStatus };
  };

  const processedOrders = useMemo(() => {
    return activeProductionOrders.map(order => {
      const { activeStage, activeStatus } = getActiveStageData(order);
      const totalPiecesOrder = order.specs?.reduce((sum: number, spec: any) => sum + (Number(spec.quantity) || 0), 0) || 0;
      return { ...order, computedActiveStage: activeStage, computedActiveStatus: activeStatus, computedTotalPieces: totalPiecesOrder };
    });
  }, [activeProductionOrders]);

  const displayedOrders = useMemo(() => {
    if (!activeFilterStage) return processedOrders;
    return processedOrders.filter(o => o.computedActiveStage.toLowerCase() === activeFilterStage.toLowerCase());
  }, [processedOrders, activeFilterStage]);

  // KPIs
  const totalPieces = useMemo(() => {
    return activeProductionOrders.reduce((acc, order) => {
      const orderQty = order.specs?.reduce((sum, spec) => sum + (Number(spec.quantity) || 0), 0) || 0;
      return acc + orderQty;
    }, 0);
  }, [activeProductionOrders]);

  const productionAlerts = useMemo(() => {
    return activeProductionOrders.filter(o => {
       return (o as any).delayDays > 0 || o.status === 'Failed' || (o.productionStages?.some(s => s.status === 'Failed' || s.status === 'Rework Required'));
    }).length;
  }, [activeProductionOrders]);

  // Aggregated Production Stages Progress
  const aggregatedStages = useMemo(() => {
    const stages = [
      { id: 'cutting', name: 'Cutting', icon: Scissors, completed: 0, target: 0, color: 'bg-blue-500' },
      { id: 'stitching', name: 'Stitching', icon: Layers, completed: 0, target: 0, color: 'bg-indigo-500' },
      { id: 'checking', name: 'Checking', icon: CheckCircle2, completed: 0, target: 0, color: 'bg-amber-500' },
      { id: 'packing', name: 'Packing', icon: Package, completed: 0, target: 0, color: 'bg-emerald-500' },
    ];

    activeProductionOrders.forEach(order => {
      const targetQty = order.specs?.reduce((sum, spec) => sum + (Number(spec.quantity) || 0), 0) || 0;
      
      stages.forEach(stg => {
        stg.target += targetQty;
        const matchingStage = order.productionStages?.find((s: any) => s.id === stg.id || s.name?.toLowerCase() === stg.id);
        if (matchingStage) {
          stg.completed += (matchingStage.completedQty || 0);
        }
      });
    });

    return stages;
  }, [activeProductionOrders]);

  const completedStagesToday = useMemo(() => {
    return activeProductionOrders.reduce((acc, order) => {
      const completed = order.productionStages?.filter(s => s.status === 'Completed').length || 0;
      return acc + completed;
    }, 0);
  }, [activeProductionOrders]);

  const metrics = [
    { title: 'Active Production POs', value: activeProductionOrders.length.toString(), icon: Factory, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { title: 'Total Pieces In Progress', value: totalPieces.toLocaleString(), icon: Layers, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
    { title: 'Completed Stages Today', value: completedStagesToday.toString(), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    { title: 'Production Alerts', value: productionAlerts.toString(), icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
  ];

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
      case 'Delayed': 
      case 'Failed':
      case 'Rework Required': return 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'In Progress': return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  // Custom workflow tracker mapping
  const productionSteps = [
    { id: 'cutting', name: 'Cutting' },
    { id: 'stitching', name: 'Stitching' },
    { id: 'fusing', name: 'Fusing' },
    { id: 'kaj-button', name: 'Kaj Button' },
    { id: 'finishing', name: 'Finishing' }
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Production Dashboard</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Overview of all active production lines and tracking.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/production/personnel')}
            className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <User className="h-4 w-4" />
            <span>View Personnel Overview</span>
          </button>
          <Link
            href="/production"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Manage Production</span>
          </Link>
        </div>
      </div>

      {/* Analytics Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.title} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                <IconComponent className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{stat.title}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stat.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Production Navigation Tracker */}
      <div className="w-full">
        <div className="flex justify-end mb-3">
          <button 
            onClick={() => setActiveFilterStage(null)}
            className="px-4 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 rounded text-sm font-medium transition-colors">
            Reset Workflow Data
          </button>
        </div>
        {/* Evenly distributed full width flex row container */}
        <div className="flex items-center justify-between overflow-visible p-5 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm w-full">
          {productionSteps.map((step, idx) => {
            const count = processedOrders.filter(o => o.computedActiveStage.toLowerCase() === step.name.toLowerCase()).length;
            const isActive = activeFilterStage?.toLowerCase() === step.name.toLowerCase();

            return (
              <React.Fragment key={step.id}>
                <div className="relative flex flex-col items-center justify-center space-y-1.5 group outline-none rounded-lg p-2">
                  <button 
                    onClick={() => setActiveFilterStage(isActive ? null : step.name)}
                    className={`text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded ${isActive ? 'text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-100 dark:ring-blue-900/40' : 'text-neutral-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                  >
                    {step.name}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopoverStage(activePopoverStage === step.name ? null : step.name);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 ${count > 0 || isActive || activePopoverStage === step.name ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-slate-700'}`}
                  >
                    {count} Pending
                  </button>
                  
                  {/* Floating Popover Menu */}
                  {activePopoverStage === step.name && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-neutral-200 dark:border-slate-700 z-50 p-3">
                      <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2 border-b border-neutral-100 dark:border-slate-800 pb-2">
                        Pending at {step.name}
                      </div>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {processedOrders.filter(o => o.computedActiveStage.toLowerCase() === step.name.toLowerCase()).length === 0 ? (
                          <div className="text-xs text-neutral-500 text-center py-2">No pending orders.</div>
                        ) : (
                          processedOrders
                            .filter(o => o.computedActiveStage.toLowerCase() === step.name.toLowerCase())
                            .map(po => (
                              <div key={po.poNumber} className="flex justify-between items-center text-sm">
                                <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate pr-2">{po.poNumber}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/production?poNumber=${po.poNumber}`);
                                  }}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-medium transition-colors flex-shrink-0">
                                  Process
                                </button>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {idx < productionSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col w-full space-y-6">
        {/* Production Datatable */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden w-full">
            <div className="border-b border-neutral-200 dark:border-slate-800 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                {activeFilterStage ? `${activeFilterStage} Pipelines` : 'Active Production Pipelines'}
              </h2>
              {activeFilterStage && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                  Filtered View
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-center border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold bg-neutral-50/30 dark:bg-slate-900">
                    <th scope="col" className="w-[15%] px-2 py-4 align-middle whitespace-nowrap text-left pl-6">PO NUMBER</th>
                    <th scope="col" className="w-[15%] px-2 py-4 align-middle whitespace-nowrap text-left">CUSTOMER</th>
                    <th scope="col" className="w-[15%] px-2 py-4 align-middle whitespace-nowrap text-center">ACTIVE STAGE</th>
                    <th scope="col" className="w-[15%] px-2 py-4 align-middle whitespace-nowrap text-center">STATUS</th>
                    <th scope="col" className="w-[15%] px-2 py-4 align-middle whitespace-nowrap text-center">TOTAL PIECES</th>
                    <th scope="col" className="w-[15%] px-2 py-4 align-middle whitespace-nowrap text-center">EST. COMPLETION</th>
                    <th scope="col" className="w-[10%] px-2 py-4 align-middle whitespace-nowrap text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/60">
                  {displayedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-neutral-500">
                        {activeFilterStage 
                          ? `No orders currently pending in ${activeFilterStage}.` 
                          : 'No active production orders found.'}
                      </td>
                    </tr>
                  ) : (
                    displayedOrders.map((order) => {
                      return (
                        <tr key={order.poNumber} className="hover:bg-neutral-50/30 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-[18px] text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap align-middle">
                            {order.poNumber}
                          </td>
                          <td className="px-2 py-[18px] text-left text-sm text-neutral-600 dark:text-neutral-400 truncate align-middle">
                            {order.customerName}
                          </td>
                          <td className="px-2 py-[18px] align-middle text-center">
                            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                              {order.computedActiveStage}
                            </span>
                          </td>
                          <td className="px-2 py-[18px] align-middle text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(order.computedActiveStatus)}`}>
                              {order.computedActiveStatus}
                            </span>
                          </td>
                          <td className="px-2 py-[18px] text-center text-sm font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap align-middle">
                            {order.computedTotalPieces.toLocaleString()}
                          </td>
                          <td className="px-2 py-[18px] whitespace-nowrap align-middle text-center">
                            <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                              <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                              <span>{order.deliveryDate ? order.deliveryDate.split('T')[0] : 'TBD'}</span>
                            </div>
                          </td>
                          <td className="px-2 py-[18px] text-center align-middle">
                            <button 
                              onClick={() => router.push(`/production?poNumber=${order.poNumber}`)}
                              className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors inline-flex items-center justify-center">
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        {/* Production Status Progress Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden w-full p-6">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">Production Status</h2>
            </div>
            <div>
              <div className="space-y-6">
                {aggregatedStages.map((stage) => {
                  const StageIcon = stage.icon;
                  const percentage = stage.target > 0 ? Math.round((stage.completed / stage.target) * 100) : 0;
                  return (
                    <div key={stage.id}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <StageIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {stage.name}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{stage.completed.toLocaleString()}</span> / {stage.target.toLocaleString()} units
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full ${stage.color} transition-all duration-500 ease-out`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
