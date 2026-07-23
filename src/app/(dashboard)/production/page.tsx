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
  ChevronDown,
  ChevronUp,
  User,
  PackageCheck,
  ShieldAlert,
  ClipboardCheck,
  AlignEndHorizontal,
  Table,
  PackageSearch,
  ArrowLeft
} from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';
import { getAllOrdersAPI } from '@/lib/api';

type StageName = 'Material' | 'Cutting' | 'Stitching' | 'Fusing' | 'Kaj Button' | 'Finishing';
type StageStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Rework Required';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface TaskAssignment {
  id: string;
  assignee: string;
  materialAllocatedName: string;
  targetQty: number;
  startTime: string;
  endTime: string;
  status: TaskStatus;

  // Two-way handshake fields
  handshakeStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  transitingWorkerId?: string;
  targetWorkerId?: string;
  transferQuantity?: number;
  originalTaskId?: string;
}

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
  tasks?: TaskAssignment[];
}

export default function ProductionPage() {
  const { t } = useTranslation();
  const [stages, setStages] = useState<StageData[]>([
    { id: 'material', name: 'Material', description: 'Material inspection & allocation', icon: PackageSearch, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '' },
    {
      id: 'cutting', name: 'Cutting', description: 'Fabric cutting as per pattern', icon: Scissors, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '',
      tasks: [
        { id: 't1', assignee: 'Jamal', materialAllocatedName: 'Sky Blue Fabric', targetQty: 500, startTime: '09:00', endTime: '', status: 'In Progress' },
        { id: 't2', assignee: 'Jamal', materialAllocatedName: 'Navy Buttons', targetQty: 200, startTime: '', endTime: '', status: 'Pending' },
        { id: 't3', assignee: 'Christie', materialAllocatedName: 'Sky Blue Fabric', targetQty: 500, startTime: '08:00', endTime: '12:00', status: 'Completed' }
      ]
    },
    {
      id: 'stitching', name: 'Stitching', description: 'Sewing and assembling pieces', icon: Layers, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '',
      tasks: [
        { id: 't4', assignee: 'Christie', materialAllocatedName: 'Sky Blue Fabric', targetQty: 1000, startTime: '', endTime: '', status: 'Pending' }
      ]
    },
    { id: 'fusing', name: 'Fusing', description: 'Apply fusible interlining', icon: Activity, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', tasks: [] },
    { id: 'kaj-button', name: 'Kaj Button', description: 'Button hole & button attachment', icon: AlignEndHorizontal, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', tasks: [] },
    { id: 'finishing', name: 'Finishing', description: 'Final touches & pressing', icon: PackageCheck, status: 'Pending', supervisor: '', completedQty: 0, startTime: '', endTime: '', remarks: '', tasks: [] },
  ]);

  const router = useRouter();
  const { user } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [poNumber, setPoNumber] = useState<string>('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activePOs, setActivePOs] = useState<string[]>([]);
  const [pendingPOs, setPendingPOs] = useState<string[]>([]);

  useEffect(() => {
    getAllOrdersAPI().then((orders) => {
      const active = orders
        .filter(o => o.status !== "DRAFT" && o.stage === "Production")
        .map(o => o.poNumber)
        .filter(Boolean);
      const pending = orders
        .filter(o => o.status !== "DRAFT" && ['Order Initiation', 'Order Specifications', 'Stock Check', 'BOM Calculation', 'Inventory Check', 'Material Allocation', 'Procurement', 'Material Release'].includes(o.stage || ''))
        .map(o => o.poNumber)
        .filter(Boolean);
      setActivePOs(active);
      setPendingPOs(pending);
    }).catch(console.error);
  }, []);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [isOutsourceModalOpen, setIsOutsourceModalOpen] = useState(false);

  // Handover Engine State
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverSplits, setHandoverSplits] = useState<{ id?: string; worker: string; quantity: number; handshakeStatus?: string }[]>([{ id: crypto.randomUUID(), worker: '', quantity: 0, handshakeStatus: 'PENDING' }]);
  const [pendingHandoverTask, setPendingHandoverTask] = useState<TaskAssignment | null>(null);

  const [expandedGarmentIdx, setExpandedGarmentIdx] = useState<number | null>(null);
  const [expandedSwimlanes, setExpandedSwimlanes] = useState<Record<string, boolean>>({});
  const toggleSwimlane = (assignee: string) => {
    setExpandedSwimlanes(prev => ({ ...prev, [assignee]: !prev[assignee] }));
  };

  const handleInitiateHandover = (task: TaskAssignment) => {
    setPendingHandoverTask(task);
    setHandoverSplits([{ id: crypto.randomUUID(), worker: '', quantity: 0, handshakeStatus: 'PENDING' }]); // Start with 0 allocated as requested
    setIsHandoverModalOpen(true);
  };

  const addHandoverSplitRow = () => {
    setHandoverSplits([...handoverSplits, { id: crypto.randomUUID(), worker: '', quantity: 0, handshakeStatus: 'PENDING' }]);
  };

  const updateHandoverSplit = (index: number, field: 'worker' | 'quantity', value: any) => {
    const newSplits = [...handoverSplits];
    newSplits[index] = { ...newSplits[index], [field]: field === 'quantity' ? Number(value) : value };
    setHandoverSplits(newSplits);
  };

  const removeHandoverSplitRow = (index: number) => {
    const newSplits = [...handoverSplits];
    newSplits.splice(index, 1);
    setHandoverSplits(newSplits);
  };

  const submitHandover = () => {
    if (!pendingHandoverTask || activeStageIdx === null) return;

    // Validate total split quantity does not exceed available
    const totalSplitQuantity = handoverSplits.reduce((sum, split) => sum + split.quantity, 0);
    if (totalSplitQuantity > pendingHandoverTask.targetQty || totalSplitQuantity <= 0) return;
    if (handoverSplits.some(split => !split.worker || split.quantity <= 0)) return;

    const nextStageIdx = activeStageIdx + 1;
    if (nextStageIdx >= stages.length) return;

    const newStages = [...stages];
    const nextStage = newStages[nextStageIdx];
    if (!nextStage.tasks) nextStage.tasks = [];

    handoverSplits.forEach(split => {
      nextStage.tasks!.push({
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        assignee: split.worker,
        materialAllocatedName: pendingHandoverTask.materialAllocatedName,
        targetQty: split.quantity,
        startTime: '',
        endTime: '',
        status: 'Pending',
        handshakeStatus: 'PENDING',
        transitingWorkerId: pendingHandoverTask.assignee,
        targetWorkerId: split.worker,
        transferQuantity: split.quantity,
        originalTaskId: pendingHandoverTask.id
      });
    });

    setStages(newStages);
    setIsHandoverModalOpen(false);
    setPendingHandoverTask(null);
    setHandoverSplits([{ worker: '', quantity: 0 }]);
  };

  const acceptHandover = (stageIdx: number, taskId: string) => {
    const newStages = [...stages];
    const targetTask = newStages[stageIdx].tasks?.find(t => t.id === taskId);
    if (!targetTask || !targetTask.originalTaskId) return;

    // Locate the previous stage and the original task to deduct balance
    if (stageIdx > 0) {
      const prevStage = newStages[stageIdx - 1];
      const originalTaskIndex = prevStage.tasks?.findIndex(t => t.id === targetTask.originalTaskId) ?? -1;

      if (originalTaskIndex !== -1 && prevStage.tasks) {
        const originalTask = prevStage.tasks[originalTaskIndex];
        const deductAmount = targetTask.transferQuantity || targetTask.targetQty;
        originalTask.targetQty -= deductAmount;

        // If completely handed over, remove the original task from the sender's board
        if (originalTask.targetQty <= 0) {
          prevStage.tasks.splice(originalTaskIndex, 1);
        }
      }
    }

    // Update accepted target task state
    targetTask.handshakeStatus = 'ACCEPTED';
    targetTask.startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStages(newStages);
  };

  const rejectHandover = (stageIdx: number, taskId: string) => {
    const newStages = [...stages];
    const nextStage = newStages[stageIdx];
    if (nextStage.tasks) {
      nextStage.tasks = nextStage.tasks.filter(t => t.id !== taskId);
    }
    setStages(newStages);
  };

  const handleAdvanceToNextStage = async (currentStageId: string) => {
    if (currentStageId === 'cutting') {
      // Convert raw supply units (e.g., fabric tracking in meters) into finished product block inventory counts
      updateOrderAndLog(poNumber, user?.name || 'System', 'Updated', `Cutting Stage finalized. Article inventory converted into product blocks (e.g., 20 Shirts). Handing off to Stitching.`, (orders) => orders);
    }
    
    if (currentStageId === 'material') {
      // Create initial tasks for the next stage (Cutting) based on partial allocations
      const nextStageIdx = currentIndex + 1;
      if (nextStageIdx < stages.length) {
        const nextStage = stages[nextStageIdx];
        if (!nextStage.tasks) nextStage.tasks = [];
        
        allocatedMaterials.forEach(mat => {
          const sizeData = allocationMap[mat.id] || {};
          const personAllocations: Record<string, number> = {};
          
          Object.values(sizeData).forEach((sd: any) => {
            const qty = Number(sd.allocatedQty || 0);
            if (qty > 0 && sd.personId) {
              personAllocations[sd.personId] = (personAllocations[sd.personId] || 0) + qty;
            }
          });

          Object.entries(personAllocations).forEach(([personId, qty]) => {
            nextStage.tasks!.push({
              id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              assignee: personId,
              materialAllocatedName: mat.materials_inventory || mat.name,
              targetQty: qty,
              startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              endTime: '',
              status: 'In Progress',
              handshakeStatus: 'ACCEPTED',
              unit: mat.unit,
              per_piece_qty: mat.per_piece_qty,
              garmentType: materialGarmentTypes[mat.id] || "Shirt"
            });
          });
        });
      }

      updateOrderAndLog(poNumber, user?.name || 'System', 'Updated', `Materials allocated to cutting stage. Handing off to Cutting.`, (orders) => orders.map(o => o.poNumber === poNumber ? { ...o, stage: 'Cutting' } : o));
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      try {
        await fetch(`${BACKEND_URL}/purchase_orders/update_stage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ poNumber, stage: "Cutting" })
        });
        
        // Also save material allocations
        await fetch(`${BACKEND_URL}/api/production/allocate-material`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ poNumber, stage: "Cutting", allocations: allocatedMaterials })
        });
      } catch (e) {}
    }

    const currentIndex = stages.findIndex(s => s.id === currentStageId);
    if (currentIndex !== -1 && currentIndex + 1 < stages.length) {
      if (currentStageId === 'material') handleCompleteStage(currentIndex);
      setActiveStageIdx(currentIndex + 1);
    }
  };

  const mockPOs = [
    {
      poNumber: "PO-2026-002",
      garments: [
        {
          type: "Shirt", targetQty: 1000, cutting: 1000, stitching: 200, fusing: 25, kajButton: 100, finishing: 500,
          specs: "Color: Sky Blue, Collar: Navy Blue Tipping, Fabric Type: Cotton-Poly Blend",
          sizeGrid: "S: 200, M: 400, L: 300, XL: 100 | Total: 1000",
          materials: ["Sky Blue Fabric: 1800m Issued", "Navy Buttons: 8400pcs Issued", "Thread: 15 Cones Issued"]
        },
        {
          type: "Pant", targetQty: 1000, cutting: 0, stitching: 0, fusing: 0, kajButton: 0, finishing: 0,
          specs: "Color: Navy Blue, Style: Flat Front, Fabric Type: Poly-Viscose",
          sizeGrid: "W30: 200, W32: 400, W34: 300, W36: 100 | Total: 1000",
          materials: ["Navy Fabric: 1500m Issued", "Zippers: 1000pcs Issued", "Hook & Eye: 1000pcs Issued"]
        }
      ]
    },
    {
      poNumber: "PO-2026-003",
      garments: [
        {
          type: "Blazer", targetQty: 50, cutting: 50, stitching: 20, fusing: 50, kajButton: 0, finishing: 0,
          specs: "Color: Charcoal Grey, Lining: Maroon Silk, Fabric: Wool Blend",
          sizeGrid: "38R: 10, 40R: 20, 42R: 15, 44R: 5 | Total: 50",
          materials: ["Charcoal Wool: 100m Issued", "Maroon Silk: 60m Issued", "Shoulder Pads: 50 Pairs"]
        },
        {
          type: "Coat", targetQty: 10, cutting: 10, stitching: 0, fusing: 0, kajButton: 0, finishing: 0,
          specs: "Color: Camel, Style: Double Breasted, Fabric: Cashmere",
          sizeGrid: "M: 5, L: 5 | Total: 10",
          materials: ["Camel Cashmere: 35m Issued", "Horn Buttons: 60pcs Issued"]
        }
      ]
    },
    {
      poNumber: "PO-2026-005",
      garments: [
        {
          type: "Uniform Shirt", targetQty: 1200, cutting: 1200, stitching: 850, fusing: 850, kajButton: 600, finishing: 400,
          specs: "Color: White, Sleeve: Short, Fabric: Poplin",
          sizeGrid: "S: 300, M: 500, L: 300, XL: 100 | Total: 1200",
          materials: ["White Poplin: 2200m Issued", "Buttons: 8400pcs Issued"]
        },
        {
          type: "Uniform Pant", targetQty: 1200, cutting: 1200, stitching: 1100, fusing: 1100, kajButton: 1050, finishing: 900,
          specs: "Color: Black, Fit: Regular, Fabric: Twill",
          sizeGrid: "W30: 300, W32: 500, W34: 300, W36: 100 | Total: 1200",
          materials: ["Black Twill: 1800m Issued", "Zippers: 1200pcs Issued"]
        }
      ]
    },
    {
      poNumber: "PO-2026-008",
      garments: [
        {
          type: "Premium Suit", targetQty: 30, cutting: 0, stitching: 0, fusing: 0, kajButton: 0, finishing: 0,
          specs: "Color: Midnight Blue, Lapel: Peak, Fabric: Italian Wool",
          sizeGrid: "38R: 5, 40R: 15, 42R: 10 | Total: 30",
          materials: ["Italian Wool: 120m Issued", "Bemberg Lining: 80m Issued"]
        },
        {
          type: "Vest", targetQty: 30, cutting: 0, stitching: 0, fusing: 0, kajButton: 0, finishing: 0,
          specs: "Color: Midnight Blue, Back: Silk, Fabric: Italian Wool",
          sizeGrid: "S: 5, M: 15, L: 10 | Total: 30",
          materials: ["Italian Wool: 30m Issued", "Silk Backing: 30m Issued"]
        }
      ]
    }
  ];

  const currentPoGarments = mockPOs.find(m => m.poNumber === poNumber)?.garments || [];

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
              if (found.productionStages && found.productionStages.length > 0) {
                const remapped = found.productionStages.map((stage: any) => {
                  let icon = Scissors;
                  if (stage.id === 'material') icon = PackageSearch;
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

  const advanceStage = async (nextPath: string, nextStage: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const res = await fetch(`${BACKEND_URL}/purchase_orders/update_stage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ poNumber: po, stage: nextStage })
        });

        if (res.ok) {
          updateOrderAndLog(po, user?.name || 'System User', 'Updated', `Advanced to ${nextStage}`, (orders) => {
            return orders.map((o: any) => o.poNumber === po ? { ...o, stage: nextStage } : o);
          });
          window.dispatchEvent(new Event("orders-updated"));
          router.push(`${nextPath}?poNumber=${encodeURIComponent(po)}`);
        } else {
          alert("Failed to advance stage on the server.");
        }
      } catch (err) {
        console.error("Failed to advance stage:", err);
        alert("Failed to reach server.");
      }
    } else {
      router.push(nextPath);
    }
  };

  const [activeStageIdx, setActiveStageIdx] = useState<number | null>(null);
  const [consumedMaterials, setConsumedMaterials] = useState<Record<string, number>>({});

  const mockMaterials = [
    {
      id: 1,
      materials_inventory: "Cotton Fabric [FAB-001]",
      category: "Fabric",
      required_qty: 1000,
      available_qty: 1000,
      shortage_qty: 0,
      unit: "Meters",
      status: "Allocated"
    },
    {
      id: 2,
      materials_inventory: "Buttons [BT-002]",
      category: "Alid",
      required_qty: 5000,
      available_qty: 5000,
      shortage_qty: 0,
      unit: "Pcs",
      status: "Allocated"
    }
  ];

  const [allocatedMaterials, setAllocatedMaterials] = useState<any[]>(mockMaterials);
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<Record<string, boolean>>({});
  const [allocationMap, setAllocationMap] = useState<Record<string, Record<string, any>>>({});
  const [materialGarmentTypes, setMaterialGarmentTypes] = useState<Record<string, string>>({});
  const [productionPersonnel, setProductionPersonnel] = useState<{name: string}[]>([
    { name: 'John Doe' },
    { name: 'Jane Smith' },
    { name: 'Jamal' },
    { name: 'Christie' },
    { name: 'Aadesh' },
    { name: 'Sam' }
  ]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/personnel`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProductionPersonnel(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      fetch(`${BACKEND_URL}/api/inventory/allocated?poNumber=${po}`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setAllocatedMaterials(data);
          } else if (data && data.allocatedMaterials) {
            setAllocatedMaterials(data.allocatedMaterials);
          }
        })
        .catch(err => console.error("Failed to fetch allocated materials:", err));
    }
  }, [poNumber]);

  useEffect(() => {
    if (allocatedMaterials.length > 0) {
      const defaultGarment = currentPoGarments.length > 0 ? currentPoGarments[0].type : "Shirt";
      
      const newMap: Record<string, Record<string, any>> = {};
      const newGarmentTypes = { ...materialGarmentTypes };
      let hasChanges = false;
      
      allocatedMaterials.forEach(mat => {
        if (!newGarmentTypes[mat.id]) {
           let foundType = defaultGarment;
           if (currentPoGarments.length > 0) {
             const matNameLower = (mat.materials_inventory || mat.name || "").toLowerCase();
             const match = currentPoGarments.find(g => 
               g.materials && g.materials.some((mStr: string) => mStr.toLowerCase().includes(matNameLower.split(' ')[0]))
             );
             if (match) foundType = match.type;
           }
           newGarmentTypes[mat.id] = foundType;
           hasChanges = true;
        }

        const selectedType = newGarmentTypes[mat.id];
        const allSizes = new Set<string>();
        const targetGarment = currentPoGarments.find(g => g.type === selectedType);
        
        if (targetGarment && targetGarment.sizeGrid) {
          const parts = targetGarment.sizeGrid.split('|')[0].split(',');
          parts.forEach((p: string) => {
            const sizeLabel = p.split(':')[0].trim();
            if (sizeLabel && sizeLabel.toLowerCase() !== 'total') allSizes.add(sizeLabel);
          });
        }
        
        if (allSizes.size === 0 && currentOrder?.specs) {
          currentOrder.specs.forEach((s: any) => {
            if (s.size) allSizes.add(String(s.size));
          });
        }

        const sizesArray = Array.from(allSizes);
        if (sizesArray.length === 0) {
          ['32', '34', '36', '38', '40'].forEach(s => sizesArray.push(s));
        }

        if (!allocationMap[mat.id] || Object.keys(allocationMap[mat.id]).join(',') !== sizesArray.join(',')) {
          hasChanges = true;
          newMap[mat.id] = {};
          const reqQty = mat.required_qty || mat.requiredQty || 0;
          const perSizeQty = Math.floor(reqQty / sizesArray.length);
          const remainder = reqQty % sizesArray.length;
          
          sizesArray.forEach((size, index) => {
            newMap[mat.id][size] = {
              requiredQty: perSizeQty + (index === 0 ? remainder : 0),
              allocatedQty: 0,
              personId: ""
            };
          });
        } else {
          newMap[mat.id] = allocationMap[mat.id];
        }
      });
      
      if (hasChanges) {
        setMaterialGarmentTypes(newGarmentTypes);
        setAllocationMap(newMap);
      }
    }
  }, [allocatedMaterials, currentPoGarments, allocationMap, currentOrder, materialGarmentTypes]);

  const handleReturnSurplus = async (materialId: string, returnQuantity: number) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (!po) return;

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${BACKEND_URL}/api/inventory/return-surplus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poNumber: po, materialId, returnQuantity })
      });
      if (res.ok) {
        // Optimistic Update
        setAllocatedMaterials(prev => prev.map(mat => {
          if (mat.id === materialId) {
            return { ...mat, availableQty: mat.availableQty - returnQuantity };
          }
          return mat;
        }));
      } else {
        alert("Failed to return surplus on the server.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to reach server.");
    }
  };

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
      case 'Pending': return <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{'Pending'}</span>;
      case 'In Progress': return <span className="bg-blue-100 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{'In Progress'}</span>;
      case 'Completed': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{'Completed'}</span>;
      case 'Failed':
      case 'Rework Required': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{'Rework Required'}</span>;
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
      default: return 'border-border bg-card hover:bg-muted cursor-pointer';
    }
  };

  const getIconColor = (stageId: string, status: StageStatus, isActive: boolean) => {
    if (isActive) return 'text-blue-600 bg-blue-100 ring-2 ring-blue-500/30 dark:bg-blue-900/50 dark:text-blue-300';
    switch (stageId) {
      case 'material': return 'text-cyan-600 bg-cyan-100/80 dark:bg-cyan-900/40 dark:text-cyan-400';
      case 'cutting': return 'text-indigo-600 bg-indigo-100/80 dark:bg-indigo-900/40 dark:text-indigo-400';
      case 'stitching': return 'text-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'fusing': return 'text-amber-600 bg-amber-100/80 dark:bg-amber-900/40 dark:text-amber-400';
      case 'kaj-button': return 'text-purple-600 bg-purple-100/80 dark:bg-purple-900/40 dark:text-purple-400';
      case 'finishing': return 'text-rose-600 bg-rose-100/80 dark:bg-rose-900/40 dark:text-rose-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const ActiveIcon = activeStageIdx !== null ? stages[activeStageIdx].icon : null;
  const activeStageObj = activeStageIdx !== null ? stages[activeStageIdx] : null;
  const stageKey = activeStageObj?.id === 'kaj-button' ? 'kajButton' : (activeStageObj?.id || 'cutting');
  const stageName = activeStageObj?.name || 'Cutting';

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">


      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600" />
            {t('production.title')}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">
              {t('production.subtitle')}
            </p>
            {poNumber && (
              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
                {poNumber}
              </span>
            )}
            {(currentOrder?.customerName || currentOrder?.clientName) && (
              <span className="text-muted-foreground text-sm font-medium">
                - {currentOrder.customerName || currentOrder.clientName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setPopoverOpen(!popoverOpen)}
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border transition-colors shadow-sm cursor-pointer ${overallProductionStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200' :
                overallProductionStatus === 'Rework Required' ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' :
                  'bg-muted text-card-foreground border-border hover:bg-neutral-200 dark:hover:bg-slate-700'
                }`}
            >
              {overallProductionStatus === 'Completed' ? (t('quality.stageComplete') || 'Completed') :
                overallProductionStatus === 'Rework Required' ? (t('dashboard.stockAlerts.severity.critical') || 'Rework Required') :
                  'Active and Pending'}
            </button>

            {popoverOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-neutral-50 dark:bg-card/80 px-4 py-3 border-b border-border">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active POs</h3>
                </div>
                <div className="p-2 space-y-1 border-b border-border">
                  {activePOs.length > 0 ? activePOs.map(po => (
                    <div key={po} className="flex justify-between items-center px-3 py-2.5 hover:bg-muted rounded-xl transition-colors group">
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{po}</span>
                      <button
                        onClick={() => {
                          setPoNumber(po);
                          setPopoverOpen(false);
                        }}
                        className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm"
                      >
                        View
                      </button>
                    </div>
                  )) : (
                    <div className="px-3 py-2.5 text-xs text-muted-foreground text-center">No active POs</div>
                  )}
                </div>
                <div className="bg-neutral-50 dark:bg-card/80 px-4 py-3 border-b border-border">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending POs</h3>
                </div>
                <div className="p-2 space-y-1">
                  {pendingPOs.length > 0 ? pendingPOs.map(po => (
                    <div key={po} className="flex justify-between items-center px-3 py-2.5 hover:bg-muted rounded-xl transition-colors group">
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{po}</span>
                      <button
                        onClick={() => {
                          setPoNumber(po);
                          setPopoverOpen(false);
                        }}
                        className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm"
                      >
                        View
                      </button>
                    </div>
                  )) : (
                    <div className="px-3 py-2.5 text-xs text-muted-foreground text-center">No pending POs</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('production.overallProgress') || 'Overall Progress'}</p>
                <p className="text-2xl font-bold text-foreground">{progressPercentage}%</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {completedStagesCount} / {stages.length} {t('production.stagesCompleted') || 'Stages Completed'}
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex gap-4 md:gap-8 flex-shrink-0 items-center">
            {poNumber && (
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">PO Number</p>
                <p className="text-xl font-bold text-foreground">{poNumber}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">{t('production.total') || 'Total Pieces'}</p>
              <p className="text-xl font-bold text-foreground">{totalOrderQty}</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
                  <div className={`p-2 rounded-lg ${getIconColor(stage.id, stage.status, isActive)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {getStatusBadge(stage.status)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{stage.id === 'material' ? 'Material' : (t(`production.${stage.id}`) !== `production.${stage.id}` ? t(`production.${stage.id}`) : stage.name)}</h3>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 mb-1.5">{stage.id === 'material' ? 'Inspect and verify allocated articles and fabrics.' : (t(`production.stages.${stage.id}.desc`) !== `production.stages.${stage.id}.desc` ? t(`production.stages.${stage.id}.desc`) : stage.description)}</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stage.completedQty > 0 ? `${stage.completedQty} ${t('production.unitsProcessed') || 'units processed'}` : (t('dashboard.recentOrders.status.pending') || 'Not started')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {/* Outsource Custom Card */}
        <div
          onClick={() => setIsOutsourceModalOpen(true)}
          className="rounded-xl border border-border bg-card p-4 transition-all cursor-pointer hover:bg-muted"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg text-teal-600 bg-teal-100/80 dark:bg-teal-900/40 dark:text-teal-400">
                <PackageSearch className="h-5 w-5" />
              </div>
              <span className="bg-blue-100 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">Active</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Outsource</h3>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 mb-1.5">Manage external vendor allocations and transit tracking.</p>
              <p className="text-xs font-medium text-muted-foreground">
                500 units processing
              </p>
            </div>
          </div>
        </div>
      </div>

      {activeStageIdx !== null && ActiveIcon && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mt-6 animate-in fade-in slide-in-from-top-4">
          <div className="border-b border-border bg-neutral-50/50 dark:bg-card/30 grid grid-cols-1 md:grid-cols-[300px_1fr_1fr_1fr] items-center">
            {/* Column 1: Title */}
            <div className="px-6 py-4 flex items-center gap-3">
              <button onClick={() => setActiveStageIdx(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 -ml-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0" aria-label="Go Back">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <ActiveIcon className="h-5 w-5 text-indigo-500" />
                {stages[activeStageIdx].id === 'material' ? 'Material Stage Update' : `${t(`production.${stages[activeStageIdx].id}`) || stages[activeStageIdx].name} ${t('production.update') || 'Update'}`}
              </h2>
              {stages[activeStageIdx].id !== 'material' && (
                <button
                  onClick={() => setIsStatusModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1 shrink-0 ml-1"
                >
                  Garment Status <span className="text-[10px]">ⓘ</span>
                </button>
              )}
            </div>

            {/* Column 2: PENDING Header */}
            <div className={`px-4 py-4 h-full flex items-center border-t md:border-t-0 border-border ${stages[activeStageIdx].id !== 'material' ? 'md:border-l' : ''}`}>
              {stages[activeStageIdx].id !== 'material' && (
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>Pending</span>
              )}
            </div>

            {/* Column 3: IN PROGRESS Header */}
            <div className={`px-4 py-4 h-full flex items-center border-t md:border-t-0 border-border ${stages[activeStageIdx].id !== 'material' ? 'md:border-l' : ''}`}>
              {stages[activeStageIdx].id !== 'material' && (
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span>In Progress</span>
              )}
            </div>

            {/* Column 4: COMPLETED Header + Actions */}
            <div className={`px-4 py-4 h-full flex items-center justify-between gap-4 border-t md:border-t-0 border-border ${stages[activeStageIdx].id !== 'material' ? 'md:border-l' : ''}`}>
              {stages[activeStageIdx].id !== 'material' ? (
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Completed</span>
              ) : (
                <div className="flex-1"></div>
              )}

              <div className="flex items-center">
                <button
                  className="border border-neutral-300 dark:border-border bg-card hover:bg-neutral-50 text-neutral-700 dark:text-neutral-200 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                >
                  + Add Person
                </button>
                {stages[activeStageIdx].id === 'material' && (
                  <button
                    disabled
                    onClick={() => { /* Functionality to be added later */ }}
                    className="bg-indigo-600/50 text-white/80 cursor-not-allowed opacity-75 rounded-lg px-3 py-1.5 text-sm font-medium border border-indigo-200/20 shrink-0 ml-2"
                  >
                    Return to store
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            {stages[activeStageIdx].id === 'material' ? (
              <div className="space-y-6 p-6">
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="w-full overflow-x-auto border border-border rounded-lg">
                    <table className="w-full table-auto min-w-[800px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-50 dark:bg-card text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="px-4 py-3 whitespace-nowrap">Size</th>
                          <th className="px-4 py-3 whitespace-nowrap text-right">Required Qty</th>
                          <th className="px-4 py-3 whitespace-nowrap text-right">Allocated Qty</th>
                          <th className="px-4 py-3 whitespace-nowrap text-right">Shortage Qty</th>
                          <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
                          <th className="px-4 py-3 whitespace-nowrap text-right">Allocate to Person</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-slate-700/50">
                        {allocatedMaterials.length > 0 ? allocatedMaterials.map((mat) => {
                          const sizeData = allocationMap[mat.id] || {};

                          return (
                            <React.Fragment key={mat.id}>
                              {/* Material Header Row */}
                              <tr className="bg-neutral-100/50 dark:bg-neutral-800/30">
                                <td colSpan={6} className="px-4 py-2 font-bold text-foreground text-sm border-l-4 border-indigo-500">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {mat.materials_inventory || mat.name} <span className="text-muted-foreground font-normal ml-2 text-xs">({mat.category || 'Article'} • {mat.unit})</span>
                                    </div>
                                    <div className="flex items-center gap-2 pr-4">
                                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Garment Type:</span>
                                      <select
                                        className="px-2 py-1 text-xs bg-white dark:bg-[#1e293b] border border-indigo-200 dark:border-indigo-800 rounded-md focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700 dark:text-indigo-300 shadow-sm"
                                        value={materialGarmentTypes[mat.id] || "Shirt"}
                                        onChange={(e) => {
                                          setMaterialGarmentTypes(prev => ({ ...prev, [mat.id]: e.target.value }));
                                          // Note: changing type triggers useEffect that recreates allocationMap[mat.id] for the new sizes
                                        }}
                                      >
                                        {currentPoGarments.length > 0 ? currentPoGarments.map(g => (
                                          <option key={g.type} value={g.type}>{g.type}</option>
                                        )) : (
                                          <>
                                            <option value="Shirt">Shirt</option>
                                            <option value="Pant">Pant</option>
                                          </>
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              
                              {Object.entries(sizeData).map(([size, sd]: [string, any]) => {
                                const sReq = sd.requiredQty || 0;
                                const sAlloc = Number(sd.allocatedQty || 0);
                                const sShortage = Math.max(0, sReq - sAlloc);
                                
                                let sBadge = 'PENDING';
                                let sBadgeCls = 'bg-neutral-100 text-neutral-500';
                                if (sAlloc >= sReq && sReq > 0) {
                                  sBadge = 'ALLOCATED';
                                  sBadgeCls = 'bg-emerald-100 text-emerald-700';
                                } else if (sAlloc > 0) {
                                  sBadge = 'PARTIAL';
                                  sBadgeCls = 'bg-amber-100 text-amber-700';
                                }

                                return (
                                  <tr key={`${mat.id}-${size}`} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 border-2 border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold">
                                        {size}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-neutral-700 dark:text-neutral-300">{sReq}</td>
                                    <td className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">{sAlloc}</td>
                                    <td className="px-4 py-3 text-right text-red-500">{sShortage > 0 ? sShortage : '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sBadgeCls}`}>{sBadge}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center gap-2 justify-end min-w-[180px]">
                                        <select 
                                          className="px-2 py-1.5 text-xs bg-card border border-border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-32 text-neutral-700 dark:text-neutral-300"
                                          value={sd.personId || ""}
                                          onChange={(e) => {
                                            setAllocationMap(prev => ({
                                              ...prev,
                                              [mat.id]: {
                                                ...prev[mat.id],
                                                [size]: { ...prev[mat.id][size], personId: e.target.value }
                                              }
                                            }));
                                          }}
                                        >
                                          <option value="">Select Worker</option>
                                          {productionPersonnel.map(p => (
                                            <option key={p.name} value={p.name}>{p.name}</option>
                                          ))}
                                        </select>
                                        <input
                                          type="number"
                                          placeholder="Qty"
                                          value={sd.allocatedQty || ""}
                                          onChange={(e) => {
                                            setAllocationMap(prev => ({
                                              ...prev,
                                              [mat.id]: {
                                                ...prev[mat.id],
                                                [size]: { ...prev[mat.id][size], allocatedQty: e.target.value }
                                              }
                                            }));
                                          }}
                                          className="px-2 py-1.5 text-xs bg-card border border-border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-20 text-neutral-700 dark:text-neutral-300"
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        }) : (
                          <tr>
                            <td colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center text-neutral-400">
                                <span className="text-4xl mb-2 font-light">⌕</span>
                                <p>No materials allocated for this order batch yet.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => handleAdvanceToNextStage('material')}
                    disabled={allocatedMaterials.length === 0}
                    className={`rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm inline-flex items-center transition-colors ${allocatedMaterials.length === 0 ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    Allocate to Cutting Stage
                  </button>
                </div>
              </div>
            ) : (
              <>
                {(() => {
                  const tasks = stages[activeStageIdx].tasks || [];
                  const incomingTransits = tasks.filter(t => t.handshakeStatus === 'PENDING');
                  const activeTasks = tasks.filter(t => t.handshakeStatus !== 'PENDING');

                  // Seed default swimlanes to enforce UI structure even when empty
                  const defaultPersonnel = ['Jamal', 'Christie', 'Alex', 'Maria'];
                  const initialGrouped = defaultPersonnel.reduce((acc, person) => {
                    acc[person] = [];
                    return acc;
                  }, {} as Record<string, TaskAssignment[]>);

                  const grouped = activeTasks.reduce((acc, task) => {
                    if (!acc[task.assignee]) acc[task.assignee] = [];
                    acc[task.assignee].push(task);
                    return acc;
                  }, initialGrouped);

                  return (
                    <>
                      {incomingTransits.length > 0 && (
                        <div className="m-6 mb-0 bg-card border border-blue-200 dark:border-blue-900/50 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-blue-50 dark:bg-card/20 px-4 py-3 border-b border-blue-200 dark:border-blue-900/50 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Incoming Material Transits (Pending Verification)</h3>
                          </div>
                          <div className="divide-y divide-neutral-100 dark:divide-slate-800">
                            {incomingTransits.map(task => (
                              <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-muted rounded-lg text-neutral-500">
                                    <Layers className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-card-foreground">
                                      {task.transitingWorkerId || 'Origin Worker'} <span className="text-neutral-400 mx-1">→</span> {task.materialAllocatedName}
                                    </div>
                                    <div className="text-xs text-neutral-500 mt-0.5">
                                      {stages[activeStageIdx].id === 'stitching' && task.per_piece_qty ? (
                                        <>
                                          Quantity Received: <strong className="text-neutral-700 dark:text-neutral-300">{Math.floor((task.transferQuantity || task.targetQty) / task.per_piece_qty)} Pcs</strong> 
                                          <span className="ml-1 text-neutral-400">(Converted from {task.transferQuantity || task.targetQty} {task.unit || 'units'} at {task.per_piece_qty} {task.unit}/pc)</span>
                                        </>
                                      ) : (
                                        <>Quantity Sent: <strong className="text-neutral-700 dark:text-neutral-300">{task.transferQuantity || task.targetQty} {task.unit || 'units'}</strong></>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => rejectHandover(activeStageIdx, task.id)}
                                    className="border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                                  >
                                    Reject Handover
                                  </button>
                                  <button
                                    onClick={() => acceptHandover(activeStageIdx, task.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
                                  >
                                    Accept Allocation
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="divide-y divide-border">
                          {Object.entries(grouped).map(([assignee, assigneeTasks]) => (
                            <div key={assignee} className="grid grid-cols-1 md:grid-cols-[300px_1fr_1fr_1fr] hover:bg-neutral-50/30 dark:hover:bg-neutral-800/10 transition-colors">
                              {/* Column 1: Row Indicator */}
                              <div className="px-6 py-5 flex flex-col justify-start bg-neutral-50/30 dark:bg-[#151c2c]">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <h3 className="font-bold text-sm text-foreground">{assignee}</h3>
                                </div>
                                <span className="text-[10px] font-bold bg-muted text-neutral-500 px-2 py-0.5 rounded-full self-start inline-flex">{assigneeTasks.length} Tasks</span>
                              </div>

                              {/* Column 2: Pending */}
                              <div className="p-4 border-t md:border-t-0 md:border-l border-border flex flex-col gap-3">
                                {assigneeTasks.filter(t => t.status === 'Pending').length > 0 ? (
                                  assigneeTasks.filter(t => t.status === 'Pending').map(task => (
                                    <div key={task.id} className="bg-card dark:bg-[#1e293b] rounded-xl shadow-md border border-border hover:border-red-500/50 hover:shadow-lg transition-all p-4 border-l-4 border-l-red-500">
                                      <p className="text-xs font-bold text-card-foreground mb-2">{task.materialAllocatedName}</p>
                                      <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500">
                                        <div>
                                          <span className="block uppercase tracking-wider text-neutral-500 dark:text-slate-400 font-medium">Target Qty</span>
                                          {stages[activeStageIdx].id === 'stitching' && task.per_piece_qty ? (
                                            <span className="font-bold text-neutral-700 dark:text-slate-200">{Math.floor(task.targetQty / task.per_piece_qty)} Pcs</span>
                                          ) : (
                                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.targetQty} {task.unit || 'units'}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="block uppercase tracking-wider text-neutral-500 dark:text-slate-400 font-medium">Start Time</span>
                                          <span className="font-bold text-neutral-700 dark:text-slate-200">{task.startTime || '--:--'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="border border-neutral-200/50 dark:border-[#26334d] border-dashed rounded-xl h-[92px] w-full bg-neutral-50/30 dark:bg-[#131b2e]"></div>
                                )}
                              </div>

                              {/* Column 3: In Progress */}
                              <div className="p-4 border-t md:border-t-0 md:border-l border-border flex flex-col gap-3">
                                {assigneeTasks.filter(t => t.status === 'In Progress').length > 0 ? (
                                  assigneeTasks.filter(t => t.status === 'In Progress').map(task => (
                                    <div key={task.id} className="bg-card dark:bg-[#1e293b] rounded-xl shadow-md border border-border hover:border-amber-400/50 hover:shadow-lg transition-all p-4 border-l-4 border-l-amber-400">
                                      <p className="text-xs font-bold text-card-foreground mb-2">{task.materialAllocatedName}</p>
                                      <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500">
                                        <div>
                                          <span className="block uppercase tracking-wider text-neutral-500 dark:text-slate-400 font-medium">Target Qty</span>
                                          {stages[activeStageIdx].id === 'stitching' && task.per_piece_qty ? (
                                            <span className="font-bold text-neutral-700 dark:text-slate-200">{Math.floor(task.targetQty / task.per_piece_qty)} Pcs</span>
                                          ) : (
                                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.targetQty} {task.unit || 'units'}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="block uppercase tracking-wider text-neutral-500 dark:text-slate-400 font-medium">Start Time</span>
                                          <span className="font-bold text-neutral-700 dark:text-slate-200">{task.startTime || '--:--'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="border border-neutral-200/50 dark:border-[#26334d] border-dashed rounded-xl h-[92px] w-full bg-neutral-50/30 dark:bg-[#131b2e]"></div>
                                )}
                              </div>

                              {/* Column 4: Completed */}
                              <div className="p-4 border-t md:border-t-0 md:border-l border-border flex flex-col gap-3">
                                {assigneeTasks.filter(t => t.status === 'Completed').length > 0 ? (
                                  assigneeTasks.filter(t => t.status === 'Completed').map(task => (
                                    <div key={task.id} className="relative bg-card dark:bg-[#1e293b] rounded-xl shadow-md border border-border hover:border-emerald-500/50 hover:shadow-lg transition-all p-4 border-l-4 border-l-emerald-500">
                                      <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs font-bold text-card-foreground pr-6">{task.materialAllocatedName}</p>
                                        {!task.handshakeStatus && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleInitiateHandover(task);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors shadow-sm"
                                            title="Send to Next Stage"
                                          >
                                            <ChevronRight className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500">
                                        <div>
                                          <span className="block uppercase tracking-wider text-neutral-500 dark:text-slate-400 font-medium">Target Qty</span>
                                          {stages[activeStageIdx].id === 'stitching' && task.per_piece_qty ? (
                                            <span className="font-bold text-neutral-700 dark:text-slate-200">{Math.floor(task.targetQty / task.per_piece_qty)} Pcs</span>
                                          ) : (
                                            <span className="font-bold text-neutral-700 dark:text-slate-200">{task.targetQty} {task.unit || 'units'}</span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="block uppercase tracking-wider text-neutral-500 dark:text-slate-400 font-medium">End Time</span>
                                          <span className="font-bold text-neutral-700 dark:text-slate-200">{task.endTime || '--:--'}</span>
                                        </div>
                                      </div>
                                      {task.handshakeStatus === 'PENDING' && (
                                        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-border">
                                          <span className="block w-full text-center text-[10px] font-bold py-1 bg-amber-50 text-amber-600 rounded">
                                            Transit Pending...
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="border border-neutral-200/50 dark:border-[#26334d] border-dashed rounded-xl h-[92px] w-full bg-neutral-50/30 dark:bg-[#131b2e]"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stage Advancement Flow */}
                      <div className="mt-8 flex justify-end pt-4 border-t border-border">
                        <button
                          onClick={() => handleAdvanceToNextStage(stages[activeStageIdx].id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm inline-flex items-center transition-colors"
                        >
                          {`Proceed to ${stages.findIndex(s => s.id === stages[activeStageIdx].id) + 1 < stages.length ? stages[stages.findIndex(s => s.id === stages[activeStageIdx].id) + 1].name : 'Next Stage'}`}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {isHandoverModalOpen && (() => {
        // Reactive Capacity Variables
        const totalBatchVolume = pendingHandoverTask?.targetQty || 0;
        const totalAssignedInRows = handoverSplits.reduce((acc, split) => acc + (split.quantity || 0), 0);
        const remainingCapacity = totalBatchVolume - totalAssignedInRows;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsHandoverModalOpen(false)} />
            <div className="relative w-full max-w-lg mx-auto bg-card rounded-2xl shadow-2xl overflow-hidden border border-border z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-border bg-neutral-50 dark:bg-card/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-card-foreground">Stage Transition Handover Selection</h3>
                <button onClick={() => setIsHandoverModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">✕</button>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-blue-50 dark:bg-card/20 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-1">Transfer Block</p>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{pendingHandoverTask?.materialAllocatedName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-1">Available Capacity</p>
                    <p className="text-lg font-black text-blue-900 dark:text-blue-100">
                      {remainingCapacity}
                      <span className="text-sm font-medium ml-1">/ {totalBatchVolume}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">Target Operators & Split Quantities</label>
                  {handoverSplits.map((split, idx) => {
                    const currentStatus = split.handshakeStatus || 'PENDING';
                    return (
                      <div key={split.id || idx} className="flex items-center gap-3">
                        <select
                          value={split.worker}
                          onChange={(e) => updateHandoverSplit(idx, 'worker', e.target.value)}
                          className="flex-1 px-3 py-2 border border-neutral-300 dark:border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-card text-neutral-700 dark:text-neutral-200 text-sm"
                        >
                          <option value="">Select worker...</option>
                          <option value="Christie">Christie</option>
                          <option value="Alex">Alex</option>
                          <option value="Maria">Maria</option>
                          <option value="Jamal">Jamal</option>
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={split.quantity || ''}
                          onChange={(e) => updateHandoverSplit(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-24 px-3 py-2 border border-neutral-300 dark:border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-card text-neutral-700 dark:text-neutral-200 text-sm text-center"
                        />
                        <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1.5 rounded uppercase whitespace-nowrap">
                          {currentStatus}
                        </span>
                        {handoverSplits.length > 1 && (
                          <button
                            onClick={() => removeHandoverSplitRow(idx)}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}
                  <button
                    onClick={addHandoverSplitRow}
                    className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5"
                  >
                    + Add Operator Row
                  </button>
                </div>

                {/* Handover Status History Table */}
                <div className="border-t border-neutral-100 dark:border-border my-4 pt-4">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Handover Status History</h4>
                  <div className="max-h-[160px] overflow-y-auto pr-1">
                    <table className="table-auto w-full text-sm text-left">
                      <thead className="bg-neutral-50 dark:bg-card/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Allocated Person</th>
                          <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Quantity</th>
                          <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                        {(() => {
                          const liveHistory = activeStageIdx !== null && activeStageIdx + 1 < stages.length
                            ? (stages[activeStageIdx + 1].tasks || []).filter(t => t.originalTaskId === pendingHandoverTask?.id)
                            : [];

                          const demoHistory = [
                            { id: 'm1', assignee: "Christie", targetQty: 100, handshakeStatus: "ACCEPTED" },
                            { id: 'm2', assignee: "Jamal", targetQty: 150, handshakeStatus: "PENDING" },
                            { id: 'm3', assignee: "Alex M.", targetQty: 150, handshakeStatus: "REJECTED" }
                          ];

                          const renderList = poNumber ? liveHistory : demoHistory;

                          if (renderList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={3} className="px-3 py-4 text-center text-xs text-neutral-500 italic">No historical records found for this block.</td>
                              </tr>
                            );
                          }

                          return renderList.map(task => (
                            <tr key={task.id} className="hover:bg-muted/30">
                              <td className="px-3 py-2 font-medium text-card-foreground">{task.assignee}</td>
                              <td className="px-3 py-2 text-muted-foreground">{task.targetQty}</td>
                              <td className="px-3 py-2">
                                {task.handshakeStatus === 'PENDING' ? (
                                  <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-semibold">Pending</span>
                                ) : task.handshakeStatus === 'ACCEPTED' ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-semibold">Approved</span>
                                ) : task.handshakeStatus === 'REJECTED' ? (
                                  <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-xs font-semibold">Rejected</span>
                                ) : (
                                  <span className="text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md text-xs font-semibold">Unknown</span>
                                )}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-neutral-50 dark:bg-card/50">
                <button onClick={() => setIsHandoverModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                <button
                  onClick={submitHandover}
                  disabled={
                    remainingCapacity < 0 ||
                    handoverSplits.length === 0 ||
                    handoverSplits.some(split => !split.worker || split.quantity <= 0)
                  }
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-colors"
                >
                  Confirm Handover
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Outsource Vendor Modal */}
      {isOutsourceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOutsourceModalOpen(false)} />
          <div className="relative w-full max-w-sm mx-auto bg-card rounded-2xl shadow-2xl overflow-hidden border border-border z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border bg-neutral-50 dark:bg-card/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-card-foreground">Outsource Assignment</h3>
              <button onClick={() => setIsOutsourceModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Vendor Assigned</p>
                <p className="text-sm font-semibold text-foreground">Global Trims & Co.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Item Details</p>
                  <p className="text-sm font-semibold text-foreground">Collars (Navy)</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Quantity</p>
                  <p className="text-sm font-semibold text-foreground">500 units</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Expected Return</p>
                <p className="text-sm font-semibold text-foreground">August 12, 2026</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <button
                  onClick={() => setIsOutsourceModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => { setIsStatusModalOpen(false); setExpandedGarmentIdx(null); }} />
          <div className="relative w-full max-w-4xl mx-auto bg-card rounded-2xl shadow-2xl overflow-hidden border border-border max-h-[90vh] flex flex-col z-10">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-neutral-50 dark:bg-card/50">
              <h2 className="text-lg font-bold text-card-foreground">
                {stageName} Stage Breakdown <span className="text-sm font-medium text-neutral-500 ml-2">({poNumber || 'No PO Selected'})</span>
              </h2>
              <button onClick={() => { setIsStatusModalOpen(false); setExpandedGarmentIdx(null); }} className="text-neutral-500 hover:text-foreground transition-colors">
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {currentPoGarments.length > 0 ? (
                <div className="w-full text-left border-collapse border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-muted text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                    <div className="px-4 py-3">Garment</div>
                    <div className="px-4 py-3 text-right">Target Qty</div>
                    <div className="px-4 py-3 text-right">{stageName} Status</div>
                  </div>
                  <div className="divide-y divide-neutral-200 dark:divide-slate-700/50">
                    {currentPoGarments.map((g: any, i) => {
                      const quantity = g[stageKey] as number;
                      return (
                        <React.Fragment key={i}>
                          <div
                            onClick={() => setExpandedGarmentIdx(expandedGarmentIdx === i ? null : i)}
                            className="grid grid-cols-3 hover:bg-muted/30 transition-colors cursor-pointer group items-center"
                          >
                            <div className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-2">
                              <span className={`transition-transform ${expandedGarmentIdx === i ? 'rotate-90' : ''}`}>▶</span>
                              {g.type}
                            </div>
                            <div className="px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 text-right">{g.targetQty}</div>
                            <div className="px-4 py-3 text-sm font-medium text-right flex items-center justify-end gap-2">
                              <span className={quantity === 0 ? "text-neutral-400" : ""}>{quantity}</span>
                              {quantity === 0 && <span className="text-neutral-500 text-[10px] bg-muted px-1.5 py-0.5 rounded">(Not Started)</span>}
                              {quantity > 0 && quantity < g.targetQty && <span className="text-blue-600 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded">(In Progress)</span>}
                              {quantity >= g.targetQty && <span className="text-emerald-600 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">(Completed)</span>}
                            </div>
                          </div>

                          {/* Expandable Sub-Panel */}
                          {expandedGarmentIdx === i && (
                            <div className="bg-slate-50 dark:bg-card/40 p-5 border-t border-border shadow-inner">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Garment Blueprints
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Column A */}
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col gap-3">
                                  <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-border pb-2 mb-1">Design & Style Specs</h5>
                                  <div className="space-y-3">
                                    {g.specs.split(', ').map((specStr: string, idx: number) => {
                                      const [label, val] = specStr.split(': ');
                                      return (
                                        <div key={idx}>
                                          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-0.5">{label}</span>
                                          <span className="text-sm font-medium text-foreground">{val}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* Column B */}
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col gap-3">
                                  <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-border pb-2 mb-1">Size & Color Matrix</h5>
                                  {(() => {
                                    const parts = g.sizeGrid.split(' | ');
                                    const sizesStr = parts[0];
                                    const totalStr = parts[1] || '';
                                    const sizes = sizesStr.split(', ').map((s: string) => {
                                      const [size, qty] = s.split(': ');
                                      return { size, qty };
                                    });
                                    const total = totalStr.includes(':') ? totalStr.split(': ')[1] : totalStr;

                                    return (
                                      <div className="w-full text-left border border-border rounded-lg overflow-hidden">
                                        <div className="grid grid-cols-2 bg-muted text-xs font-semibold text-muted-foreground border-b border-border">
                                          <div className="px-3 py-2 border-r border-border">Size</div>
                                          <div className="px-3 py-2 text-right">Quantity</div>
                                        </div>
                                        {sizes.map((s: any, idx: number) => (
                                          <div key={idx} className="grid grid-cols-2 text-sm text-card-foreground border-b border-neutral-100 dark:border-border last:border-b-0">
                                            <div className="px-3 py-2 border-r border-neutral-100 dark:border-border font-medium">{s.size}</div>
                                            <div className="px-3 py-2 text-right">{s.qty}</div>
                                          </div>
                                        ))}
                                        {total && (
                                          <div className="grid grid-cols-2 bg-indigo-50 dark:bg-indigo-900/20 text-sm font-bold text-indigo-900 dark:text-indigo-200 border-t border-border">
                                            <div className="px-3 py-2 border-r border-indigo-100 dark:border-indigo-800/50 uppercase tracking-wide text-[10px] flex items-center">Total</div>
                                            <div className="px-3 py-2 text-right">{total}</div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                                {/* Column C */}
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col gap-3">
                                  <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-border pb-2 mb-1">Articles Allocated</h5>
                                  <ul className="divide-y divide-neutral-100 dark:divide-slate-700/50">
                                    {g.materials.map((mat: string, idx: number) => (
                                      <li key={idx} className="py-2.5 text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2.5 first:pt-1 last:pb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-[6px] flex-shrink-0" />
                                        <span className="leading-tight font-medium">{mat}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No garment breakdown data available for this PO.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overview Matrix Modal */}
      {isOverviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOverviewModalOpen(false)} />
          <div className="relative w-full max-w-4xl mx-auto bg-card rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col z-10 max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-neutral-50 dark:bg-card/50">
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-500" />
                Global Status Matrix <span className="text-sm font-medium text-neutral-500 ml-1">({poNumber || 'No PO Selected'})</span>
              </h2>
              <button onClick={() => setIsOverviewModalOpen(false)} className="text-neutral-500 hover:text-foreground transition-colors">
                Close
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              {currentPoGarments.length > 0 ? (
                <div className="w-full border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-semibold border-b border-r border-border">Garment</th>
                        <th className="px-4 py-3 font-semibold text-center border-b border-r border-border">Cutting</th>
                        <th className="px-4 py-3 font-semibold text-center border-b border-r border-border">Stitching</th>
                        <th className="px-4 py-3 font-semibold text-center border-b border-r border-border">Fusing</th>
                        <th className="px-4 py-3 font-semibold text-center border-b border-r border-border">Kaj Button</th>
                        <th className="px-4 py-3 font-semibold text-center border-b border-border">Finishing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-slate-700/50">
                      {currentPoGarments.map((g: any, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-foreground border-r border-border">{g.type}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 text-center border-r border-border font-medium">{g.cutting || 0}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 text-center border-r border-border font-medium">{g.stitching || 0}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 text-center border-r border-border font-medium">{g.fusing || 0}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 text-center border-r border-border font-medium">{g.kajButton || 0}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 text-center font-medium">{g.finishing || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No data available for this PO.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
