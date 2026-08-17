'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  PackageCheck, 
  ClipboardCheck, 
  Package, 
  CheckSquare, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function QualityPackingPage() {
  const [activeStage, setActiveStage] = useState('finished_goods');

  // Interfaces & State for Multi-Column Matrix Grid
  interface OperatorTask {
    id: string;
    operatorName: string;
    avatarInitials: string;
    garmentType: string;
    article: string;
    sku: string;
    targetQty: number;
    passedQty: number;
    defectQty: number;
    size: string;
    subRole: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }

  // Load initial tasks from localStorage or use default
  const [operatorTasks, setOperatorTasks] = useState<Record<string, OperatorTask[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quality_packing_operator_tasks');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      finished_goods: [
        {
          id: 'fg-1',
          operatorName: 'Amit Kumar',
          avatarInitials: 'AK',
          garmentType: 'Shirt',
          article: "Men's Formal Cotton Shirt",
          sku: 'SHIRT-M-001',
          targetQty: 400,
          passedQty: 0,
          defectQty: 0,
          size: 'M',
          subRole: 'Receiving Clerk',
          status: 'PENDING'
        },
        {
          id: 'fg-2',
          operatorName: 'Rahul Singh',
          avatarInitials: 'RS',
          garmentType: 'Pant',
          article: "Men's Chino Trousers",
          sku: 'PANT-M-002',
          targetQty: 300,
          passedQty: 0,
          defectQty: 0,
          size: 'L',
          subRole: 'Receiving Clerk',
          status: 'PENDING'
        }
      ],
      quality_check: [],
      packing: [],
      packing_verification: [],
      approval: []
    };
  });

  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [newOpName, setNewOpName] = useState('Sunita More');
  const [newOpGarmentType, setNewOpGarmentType] = useState('Shirt');
  const [newOpArticle, setNewOpArticle] = useState("Men's Formal Cotton Shirt");
  const [newOpSku, setNewOpSku] = useState('SHIRT-M-001');
  const [newOpSize, setNewOpSize] = useState('M');
  const [newOpTargetQty, setNewOpTargetQty] = useState(100);

  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [selectedTaskForRepair, setSelectedTaskForRepair] = useState<OperatorTask | null>(null);
  const [isRepairable, setIsRepairable] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState('Sunita More');
  const [repairNotes, setRepairNotes] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [qcBadgeText, setQcBadgeText] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quality_packing_qc_badge_text');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {};
  });

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quality_packing_operator_tasks', JSON.stringify(operatorTasks));
    }
  }, [operatorTasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quality_packing_qc_badge_text', JSON.stringify(qcBadgeText));
    }
  }, [qcBadgeText]);

  // Sync state reactively across pages/tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTasks = localStorage.getItem('quality_packing_operator_tasks');
      if (savedTasks) {
        try {
          setOperatorTasks(JSON.parse(savedTasks));
        } catch (e) {}
      }
      const savedBadges = localStorage.getItem('quality_packing_qc_badge_text');
      if (savedBadges) {
        try {
          setQcBadgeText(JSON.parse(savedBadges));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const updateTaskStatus = (taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    setOperatorTasks(prev => {
      const stageTasks = prev[activeStage] || [];
      const updatedTasks = stageTasks.map(t => {
        if (t.id === taskId) {
          let passed = t.passedQty;
          if (newStatus === 'COMPLETED' && passed === 0) {
            passed = t.targetQty;
          }
          return { ...t, status: newStatus, passedQty: passed };
        }
        return t;
      });

      let nextStageState = { ...prev, [activeStage]: updatedTasks };

      // If completing finished_goods, push directly to quality_check
      if (activeStage === 'finished_goods' && newStatus === 'COMPLETED') {
        const completedTask = stageTasks.find(t => t.id === taskId);
        if (completedTask) {
          const alreadyExists = (prev.quality_check || []).some(t => t.id === `qc-${completedTask.id}`);
          if (!alreadyExists) {
            const qcTask: OperatorTask = {
              id: `qc-${completedTask.id}`,
              operatorName: completedTask.operatorName,
              avatarInitials: completedTask.avatarInitials,
              garmentType: completedTask.garmentType,
              article: completedTask.article,
              sku: completedTask.sku,
              targetQty: completedTask.targetQty,
              passedQty: 0,
              defectQty: 0,
              size: completedTask.size,
              subRole: 'QC Inspector',
              status: 'PENDING'
            };
            nextStageState.quality_check = [...(nextStageState.quality_check || []), qcTask];
          }
        }
      }

      return nextStageState;
    });
  };

  const updateTaskQty = (taskId: string, field: 'passedQty' | 'defectQty', value: number) => {
    setOperatorTasks(prev => {
      const stageTasks = prev[activeStage] || [];
      const updatedTasks = stageTasks.map(t => {
        if (t.id === taskId) {
          return { ...t, [field]: value };
        }
        return t;
      });
      return { ...prev, [activeStage]: updatedTasks };
    });
  };

  const handleAddPerson = () => {
    const initials = newOpName.split(' ').map(n => n[0]).join('').toUpperCase();
    let subRole = 'Operator';
    if (activeStage === 'finished_goods') subRole = 'Receiving Clerk';
    else if (activeStage === 'quality_check') subRole = 'QC Inspector';
    else if (activeStage === 'packing') subRole = 'Packer';
    else if (activeStage === 'packing_verification') subRole = 'QC Verifier';
    else if (activeStage === 'approval') subRole = 'Manager';

    const newTask: OperatorTask = {
      id: `task-${Date.now()}`,
      operatorName: newOpName,
      avatarInitials: initials,
      garmentType: newOpGarmentType,
      article: newOpArticle,
      sku: newOpSku,
      targetQty: Number(newOpTargetQty),
      passedQty: 0,
      defectQty: 0,
      size: newOpSize,
      subRole: subRole,
      status: 'PENDING'
    };

    setOperatorTasks(prev => ({
      ...prev,
      [activeStage]: [...(prev[activeStage] || []), newTask]
    }));

    setAllocationModalOpen(false);
  };

  const handleStartRepairing = () => {
    if (!selectedTaskForRepair) return;
    
    if (isRepairable) {
      const stored = localStorage.getItem('shared_repair_tasks');
      const repairTasks = stored ? JSON.parse(stored) : [];
      
      const newPayload = {
        stage: 'repairing',
        poId: 'PO-UDF-0011',
        workerName: selectedWorker,
        defectQty: selectedTaskForRepair.defectQty,
        reason: repairNotes || 'Defect Repair',
        status: 'PENDING'
      };
      
      repairTasks.push(newPayload);
      localStorage.setItem('shared_repair_tasks', JSON.stringify(repairTasks));
      
      setQcBadgeText(prev => ({
        ...prev,
        [selectedTaskForRepair.id]: 'Sent for Repair'
      }));
      
      setToastMessage(`${selectedTaskForRepair.defectQty} defective pieces sent to Production for repair.`);
      setTimeout(() => setToastMessage(''), 5000);
    }
    
    setRepairModalOpen(false);
    setSelectedTaskForRepair(null);
    setRepairNotes('');
  };

  const handleProceedNext = () => {
    if (activeStage === 'finished_goods') {
      setActiveStage('quality_check');
    } else if (activeStage === 'quality_check') {
      const qcTasks = operatorTasks.quality_check || [];
      const packingTasks: OperatorTask[] = qcTasks.map(t => ({
        id: `pack-${t.id}`,
        operatorName: t.operatorName,
        avatarInitials: t.avatarInitials,
        garmentType: t.garmentType,
        article: t.article,
        sku: t.sku,
        targetQty: t.passedQty,
        passedQty: 0,
        defectQty: 0,
        size: t.size,
        subRole: 'Packer',
        status: 'PENDING'
      }));
      setOperatorTasks(prev => ({
        ...prev,
        packing: packingTasks
      }));
      setActiveStage('packing');
    } else if (activeStage === 'packing') {
      const packingTasks = operatorTasks.packing || [];
      const verificationTasks: OperatorTask[] = packingTasks.map(t => ({
        id: `verify-${t.id}`,
        operatorName: t.operatorName,
        avatarInitials: t.avatarInitials,
        garmentType: t.garmentType,
        article: t.article,
        sku: t.sku,
        targetQty: t.passedQty || t.targetQty,
        passedQty: 0,
        defectQty: 0,
        size: t.size,
        subRole: 'QC Verifier',
        status: 'PENDING'
      }));
      setOperatorTasks(prev => ({
        ...prev,
        packing_verification: verificationTasks
      }));
      setActiveStage('packing_verification');
    } else if (activeStage === 'packing_verification') {
      const verificationTasks = operatorTasks.packing_verification || [];
      const approvalTasks: OperatorTask[] = verificationTasks.map(t => ({
        id: `app-${t.id}`,
        operatorName: t.operatorName,
        avatarInitials: t.avatarInitials,
        garmentType: t.garmentType,
        article: t.article,
        sku: t.sku,
        targetQty: t.passedQty || t.targetQty,
        passedQty: 0,
        defectQty: 0,
        size: t.size,
        subRole: 'Manager',
        status: 'PENDING'
      }));
      setOperatorTasks(prev => ({
        ...prev,
        approval: approvalTasks
      }));
      setActiveStage('approval');
    } else if (activeStage === 'approval') {
      window.location.href = '/dispatch-management';
    }
  };

  const getStageCompletion = (stageId: string) => {
    if (stageId === 'finished_goods') return 100;
    const tasks = operatorTasks[stageId] || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    return (completed / tasks.length) * 100;
  };

  const completedStagesCount = Object.keys(operatorTasks).reduce((count, stageId) => {
    const tasks = operatorTasks[stageId] || [];
    if (tasks.length > 0 && tasks.every(t => t.status === 'COMPLETED')) {
      return count + 1;
    }
    return count;
  }, 1);

  const overallProgress = Math.round(
    (getStageCompletion('finished_goods') +
     getStageCompletion('quality_check') +
     getStageCompletion('packing') +
     getStageCompletion('packing_verification') +
     getStageCompletion('approval')) / 5
  );

  const qcPassed = operatorTasks.quality_check.reduce((sum, t) => sum + t.passedQty, 0);
  const qcFailed = operatorTasks.quality_check.reduce((sum, t) => sum + t.defectQty, 0);

  const stages = [
    {
      id: 'finished_goods',
      title: 'Finished Goods Received for QC',
      subtitle: 'PO transferred from Production',
      badge: 'RECEIVED FOR QC',
      icon: PackageCheck,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'quality_check',
      title: 'Quality Check',
      subtitle: 'Inspect for defects & standards',
      badge: 'PENDING',
      icon: ClipboardCheck,
      badgeColor: 'bg-gray-800 text-gray-400 border-transparent'
    },
    {
      id: 'packing',
      title: 'Packing',
      subtitle: 'Pack finished products',
      badge: 'PENDING',
      icon: Package,
      badgeColor: 'bg-gray-800 text-gray-400 border-transparent'
    },
    {
      id: 'packing_verification',
      title: 'Packing & Verification',
      subtitle: 'Verify packed quantities against shipping manifest',
      badge: 'PENDING',
      icon: CheckSquare,
      badgeColor: 'bg-gray-800 text-gray-400 border-transparent'
    },
    {
      id: 'approval',
      title: 'Approval',
      subtitle: 'Authorized sign-off required',
      badge: 'PENDING',
      icon: CheckCircle2,
      badgeColor: 'bg-gray-800 text-gray-400 border-transparent'
    }
  ];

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-[#0B101B] text-white font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-[#131B2E] p-6 rounded-2xl border border-gray-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-500"/> Quality & Packing
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Post-production validation, quality inspection, and dispatch preparation
          </p>
        </div>
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
          Pending Validation
        </span>
      </div>

      {/* OVERALL PROGRESS BANNER */}
      <div className="bg-[#131B2E] border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="text-gray-400 uppercase text-[10px] font-semibold tracking-wider">Overall Progress</span>
            <p className="text-2xl font-bold text-white mt-0.5">{overallProgress}%</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="bg-[#0B101B] text-blue-400 px-3 py-1 rounded-lg border border-blue-500/20 text-xs font-semibold">
              {completedStagesCount} / 5 Stages Completed
            </span>
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-gray-400 uppercase text-[10px] font-semibold">PIECES:</span>
                <span className="font-bold text-white ml-1.5">1000</span>
              </div>
              <div>
                <span className="text-emerald-400 uppercase text-[10px] font-semibold">QC PASSED:</span>
                <span className="font-bold text-emerald-400 ml-1.5">{qcPassed}</span>
              </div>
              <div>
                <span className="text-rose-400 uppercase text-[10px] font-semibold">QC FAILED:</span>
                <span className="font-bold text-rose-400 ml-1.5">{qcFailed}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-800/80 h-2 rounded-full overflow-hidden">
          <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
        </div>
      </div>

      {/* 5-CARD STAGES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const IconComponent = stage.icon;
          const isActive = activeStage === stage.id;

          return (
            <div
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`bg-[#131B2E] border rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-blue-400"/>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase border ${stage.badgeColor}`}>
                    {stage.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white">{stage.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{stage.subtitle}</p>
                </div>
              </div>

              {stage.id === 'finished_goods' && (
                <div className="grid grid-cols-2 gap-2 mt-4 text-center text-[10px]">
                  <div className="bg-[#0B101B] p-2 rounded-lg border border-gray-800">
                    <span className="text-gray-400 block text-[8px] font-semibold uppercase">ORDERED</span>
                    <span className="font-bold text-white">1000 pcs</span>
                  </div>
                  <div className="bg-[#0B101B] p-2 rounded-lg border border-gray-800">
                    <span className="text-emerald-400 block text-[8px] font-semibold uppercase">RECEIVED</span>
                    <span className="font-bold text-emerald-400">1000 pcs</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* INTERACTIVE SUB-TABLE DRAWER */}
      {activeStage && (() => {
        const stageInfo = stages.find(s => s.id === activeStage);
        if (!stageInfo) return null;

        const nextStageMap: Record<string, { id: string, label: string }> = {
          'finished_goods': { id: 'quality_check', label: 'Proceed to Quality Check' },
          'quality_check': { id: 'packing', label: 'Proceed to Packing' },
          'packing': { id: 'packing_verification', label: 'Proceed to Verification' },
          'packing_verification': { id: 'approval', label: 'Proceed to Approval' },
          'approval': { id: 'dispatch', label: 'Send to Dispatch' },
        };

        const nextAction = nextStageMap[activeStage];

        return (
          <div className="bg-[#131B2E] border border-gray-800 rounded-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* EXACT 4-COLUMN SEGMENTED HEADER BAR */}
            <div className="flex flex-col md:flex-row items-stretch border-b border-gray-800 min-h-[64px]">
              
              {/* COLUMN 1: 30% Width */}
              <div className="flex-1 md:w-[30%] md:border-r border-b md:border-b-0 border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveStage('')}
                    className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <stageInfo.icon className="w-5 h-5 text-blue-400" />
                    <div className="flex flex-col">
                      <h2 className="text-sm font-bold text-white leading-tight">
                        {stageInfo.title}
                      </h2>
                      <span className="text-xs text-gray-400 leading-tight">Update</span>
                    </div>
                  </div>
                </div>
                <span className="bg-blue-600/30 text-blue-400 border border-blue-500/40 text-[10px] px-3 py-1 rounded-full font-semibold flex items-center gap-1 ml-2 whitespace-nowrap">
                  Garment Status <span className="w-3 h-3 rounded-full border border-blue-400 flex items-center justify-center text-[8px] ml-0.5">i</span>
                </span>
              </div>

              {/* COLUMN 2: 23.33% Width */}
              <div className="flex-1 md:w-[23.33%] md:border-r border-b md:border-b-0 border-gray-800 px-6 py-4 flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-rose-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div> PENDING
                </span>
              </div>

              {/* COLUMN 3: 23.33% Width */}
              <div className="flex-1 md:w-[23.33%] md:border-r border-b md:border-b-0 border-gray-800 px-6 py-4 flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-amber-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> IN PROGRESS
                </span>
              </div>

              {/* COLUMN 4: 23.34% Width */}
              <div className="flex-1 md:w-[23.34%] px-6 py-4 flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold tracking-wider text-emerald-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> COMPLETED
                </span>
                <button className="bg-[#0D1322] hover:bg-[#1A233A] border border-gray-700 text-gray-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap">
                  + Add Person
                </button>
              </div>

            </div>

            {/* OPERATOR TASK MATRIX GRID */}
            <div className="flex flex-col">
              {(operatorTasks[activeStage] || []).map((task) => (
                <div key={task.id} className="flex flex-col md:flex-row items-stretch border-b border-gray-800/60 hover:bg-[#1A233A]/10 transition-colors">
                  
                  {/* CELL 1: Operator Profile (30% Width) */}
                  <div className="flex-1 md:w-[30%] md:border-r border-b md:border-b-0 border-gray-800 px-6 py-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {task.avatarInitials}
                      </div>
                      <span className="text-sm font-semibold text-gray-200">{task.operatorName}</span>
                    </div>
                    <div className="mt-2.5">
                      <span className="bg-[#1A233A] text-gray-400 text-[10px] px-2.5 py-1 rounded-full border border-gray-800">
                        1 Tasks
                      </span>
                    </div>
                  </div>

                  {/* CELL 2: PENDING (23.33% Width) */}
                  <div className="flex-1 md:w-[23.33%] md:border-r border-b md:border-b-0 border-gray-800 px-6 py-6 flex flex-col justify-center bg-[#131B2E]/20">
                    {task.status === 'PENDING' ? (
                      <div className="bg-[#0E1526] border border-gray-800 rounded-xl p-4 border-l-4 border-l-red-500 shadow-lg relative group transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">{task.subRole}</h4>
                          <span className="text-[9px] font-semibold text-rose-400 uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Pending</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-400 font-semibold tracking-tight uppercase">
                          <span>TARGET QTY: {task.targetQty} Pcs</span>
                          <span className="text-gray-600">|</span>
                          <span>START TIME: --:--</span>
                        </div>
                        <div className="mt-4 bg-[#131B2E] border border-gray-800/80 rounded-lg p-2.5 text-[10px] text-gray-300 flex flex-col gap-1.5 font-medium">
                          <div className="flex justify-between">
                            <span>Size: <span className="font-bold text-blue-400">{task.size}</span></span>
                            <span>Type: <span className="font-bold text-gray-400">{task.garmentType}</span></span>
                          </div>
                          <div className="border-t border-gray-800/50 my-1"></div>
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="text-gray-400 font-medium">Checked: <span className="text-emerald-400 font-bold">{task.passedQty}</span></span>
                            <span className="text-gray-400 font-medium">Defect: <span className="text-rose-400 font-bold">{task.defectQty}</span></span>
                          </div>
                        </div>
                        <div className="mt-3.5 flex justify-end">
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            Start Task <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0E1526]/20 border border-gray-800/30 border-dashed rounded-xl min-h-[120px] flex items-center justify-center text-[10px] text-gray-500 font-medium">
                        Empty Slot
                      </div>
                    )}
                  </div>

                  {/* CELL 3: IN PROGRESS (23.33% Width) */}
                  <div className="flex-1 md:w-[23.33%] md:border-r border-b md:border-b-0 border-gray-800 px-6 py-6 flex flex-col justify-center bg-[#131B2E]/20">
                    {task.status === 'IN_PROGRESS' ? (
                      <div className="bg-[#0E1526] border border-gray-800 rounded-xl p-4 border-l-4 border-l-amber-500 shadow-lg relative group transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">{task.subRole}</h4>
                          <span className="text-[9px] font-semibold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {qcBadgeText[task.id] || 'In Progress'}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-400 font-semibold tracking-tight uppercase">
                          <span>TARGET QTY: {task.targetQty} Pcs</span>
                          <span className="text-gray-600">|</span>
                          <span>START TIME: 10:30 AM</span>
                        </div>
                        
                        <div className="mt-4 bg-[#131B2E] border border-gray-800/80 rounded-lg p-2.5 text-[10px] text-gray-300 flex flex-col gap-1.5 font-medium">
                          <div className="flex justify-between">
                            <span>Size: <span className="font-bold text-blue-400">{task.size}</span></span>
                            <span>Type: <span className="font-bold text-gray-400">{task.garmentType}</span></span>
                          </div>
                          <div className="border-t border-gray-800/50 my-1"></div>
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">Passed:</span>
                              <input 
                                type="number" 
                                value={task.passedQty}
                                onChange={(e) => updateTaskQty(task.id, 'passedQty', Number(e.target.value))}
                                className="bg-[#0E1526] border border-gray-800 rounded w-12 text-center text-xs font-bold text-emerald-400 py-0.5 focus:outline-none focus:border-emerald-500" 
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">Defect:</span>
                              <input 
                                type="number" 
                                value={task.defectQty}
                                onChange={(e) => updateTaskQty(task.id, 'defectQty', Number(e.target.value))}
                                className="bg-[#0E1526] border border-gray-800 rounded w-12 text-center text-xs font-bold text-rose-400 py-0.5 focus:outline-none focus:border-rose-500" 
                              />
                            </div>
                          </div>
                        </div>

                        {activeStage === 'quality_check' && task.defectQty > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                setSelectedTaskForRepair(task);
                                setRepairNotes('');
                                setRepairModalOpen(true);
                              }}
                              className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 font-bold text-[10px] px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              🔁 Send to Production for Repair
                            </button>
                          </div>
                        )}

                        <div className="mt-3.5 flex justify-between gap-2">
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'PENDING')}
                            className="text-gray-400 hover:text-white hover:bg-gray-800 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Revert
                          </button>
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            Complete <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0E1526]/20 border border-gray-800/30 border-dashed rounded-xl min-h-[120px] flex items-center justify-center text-[10px] text-gray-500 font-medium">
                        Empty Slot
                      </div>
                    )}
                  </div>

                  {/* CELL 4: COMPLETED (23.34% Width) */}
                  <div className="flex-1 md:w-[23.34%] border-b md:border-b-0 border-gray-800 px-6 py-6 flex flex-col justify-center bg-[#131B2E]/20">
                    {task.status === 'COMPLETED' ? (
                      <div className="bg-[#0E1526] border border-gray-800 rounded-xl p-4 border-l-4 border-l-emerald-500 shadow-lg relative group transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">{task.subRole}</h4>
                          <span className="text-[9px] font-semibold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {qcBadgeText[task.id] || 'Completed'}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-400 font-semibold tracking-tight uppercase">
                          <span>TARGET QTY: {task.targetQty} Pcs</span>
                          <span className="text-gray-600">|</span>
                          <span>START TIME: 10:30 AM</span>
                        </div>
                        <div className="mt-4 bg-[#131B2E] border border-gray-800/80 rounded-lg p-2.5 text-[10px] text-gray-300 flex flex-col gap-1.5 font-medium">
                          <div className="flex justify-between">
                            <span>Size: <span className="font-bold text-blue-400">{task.size}</span></span>
                            <span>Type: <span className="font-bold text-gray-400">{task.garmentType}</span></span>
                          </div>
                          <div className="border-t border-gray-800/50 my-1"></div>
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">PASSED: {task.passedQty}</span>
                            <span className="text-rose-400 font-bold">DEFECTS: {task.defectQty}</span>
                          </div>
                        </div>

                        {activeStage === 'quality_check' && task.defectQty > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                setSelectedTaskForRepair(task);
                                setRepairNotes('');
                                setRepairModalOpen(true);
                              }}
                              className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 font-bold text-[10px] px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              🔁 Send to Production for Repair
                            </button>
                          </div>
                        )}

                        <div className="mt-3.5 flex justify-start">
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="text-gray-400 hover:text-white hover:bg-gray-800 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Re-open Task
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0E1526]/20 border border-gray-800/30 border-dashed rounded-xl min-h-[120px] flex items-center justify-center text-[10px] text-gray-500 font-medium">
                        Empty Slot
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* BOTTOM FOOTER ACTION */}
            {nextAction && (
              <div className="bg-[#131B2E] p-4 flex justify-end">
                <button 
                  onClick={handleProceedNext}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2"
                >
                  {nextAction.label} <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#131B2E] border-2 border-emerald-500/30 rounded-xl p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">✓</div>
          <span className="text-xs text-gray-200 font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-gray-400 hover:text-white text-xs ml-4">✕</button>
        </div>
      )}

      {/* ALLOCATION / + ADD PERSON MODAL */}
      {allocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#131B2E] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-base font-bold text-white">Allocate Portion & Assign Inspector</h3>
              <p className="text-xs text-gray-400 mt-1">Assign a batch portion to an inspector or operator for {activeStage.replace('_', ' ')}.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Assignee / Inspector *</label>
                <select 
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  className="w-full bg-[#0E1526] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Amit Kumar">Amit Kumar</option>
                  <option value="Rahul Singh">Rahul Singh</option>
                  <option value="Sunita More">Sunita More</option>
                  <option value="Pooja Jadhav">Pooja Jadhav</option>
                  <option value="Suresh Patil">Suresh Patil</option>
                  <option value="Anil Shinde">Anil Shinde</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Garment Type *</label>
                  <select 
                    value={newOpGarmentType}
                    onChange={(e) => {
                      setNewOpGarmentType(e.target.value);
                      if (e.target.value === 'Shirt') {
                        setNewOpArticle("Men's Formal Cotton Shirt");
                        setNewOpSku("SHIRT-M-001");
                      } else {
                        setNewOpArticle("Men's Chino Trousers");
                        setNewOpSku("PANT-M-002");
                      }
                    }}
                    className="w-full bg-[#0E1526] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Shirt">Shirt</option>
                    <option value="Pant">Pant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Size *</label>
                  <select 
                    value={newOpSize}
                    onChange={(e) => setNewOpSize(e.target.value)}
                    className="w-full bg-[#0E1526] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="34">34</option>
                    <option value="36">36</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Quantity (Pcs) *</label>
                <input 
                  type="number" 
                  value={newOpTargetQty}
                  onChange={(e) => setNewOpTargetQty(Number(e.target.value))}
                  placeholder="e.g. 100"
                  className="w-full bg-[#0E1526] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-6 bg-[#0E1526] border-t border-gray-800/80 flex justify-end gap-3">
              <button 
                onClick={() => setAllocationModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddPerson}
                className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-500/10 transition-colors"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPAIR / REWORK ASSIGNMENT MODAL */}
      {repairModalOpen && selectedTaskForRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#131B2E] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-base font-bold text-white">🔧 Send to Production for Repair</h3>
              <p className="text-xs text-gray-400 mt-1">Route identified defects back to a production worker for repair.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
                  {selectedTaskForRepair.defectQty}
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Defective Quantity</span>
                  <span className="text-[10px] text-gray-300">For {selectedTaskForRepair.article} (Size {selectedTaskForRepair.size})</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Is this batch repairable?</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input 
                      type="radio" 
                      name="repairable" 
                      checked={isRepairable === true} 
                      onChange={() => setIsRepairable(true)} 
                      className="accent-blue-500"
                    />
                    Yes, repairable
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input 
                      type="radio" 
                      name="repairable" 
                      checked={isRepairable === false} 
                      onChange={() => setIsRepairable(false)}
                      className="accent-blue-500" 
                    />
                    No, discard / scrap
                  </label>
                </div>
              </div>

              {isRepairable && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Assign to Operator for Rework *</label>
                    <select 
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      className="w-full bg-[#0E1526] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Sunita More">Sunita More</option>
                      <option value="Pooja Jadhav">Pooja Jadhav</option>
                      <option value="Amit Kumar">Amit Kumar</option>
                      <option value="Rahul Singh">Rahul Singh</option>
                      <option value="Suresh Patil">Suresh Patil</option>
                      <option value="Anil Shinde">Anil Shinde</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Defect Reason / Notes *</label>
                    <textarea 
                      value={repairNotes}
                      onChange={(e) => setRepairNotes(e.target.value)}
                      placeholder="e.g. Stitching uneven on collar, Stain on sleeve..."
                      rows={3}
                      className="w-full bg-[#0E1526] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-[#0E1526] border-t border-gray-800/80 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setRepairModalOpen(false);
                  setSelectedTaskForRepair(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleStartRepairing}
                className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-500/10 transition-colors"
              >
                Start Repairing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}