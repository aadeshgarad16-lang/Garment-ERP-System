"use client";


import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Building2,
  Calendar,
  FileText,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Layers,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Package,
  Archive,
  RefreshCw,
  Trash2
} from 'lucide-react';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';

// Shared Mock Data representing Shortages from Inventory
const mockShortages = [
  { id: 'PR-2026-101', material: 'Denim Fabric (Blue)', category: 'Fabric', required: 800, available: 0, shortage: 800, unit: 'meters', supplier: 'TexMill Global', cost: 4000, priority: 'Critical', status: 'Pending Procurement' },
  { id: 'PR-2026-102', material: 'Polyester Thread (Navy)', category: 'Thread', required: 200, available: 120, shortage: 80, unit: 'spools', supplier: 'StitchCo', cost: 160, priority: 'Medium', status: 'Vendor Assigned' },
  { id: 'PR-2026-103', material: 'Metal Hooks (Silver)', category: 'Hooks', required: 300, available: 150, shortage: 150, unit: 'pieces', supplier: 'ZipCorp', cost: 45, priority: 'High', status: 'Ordered' },
];

const mockSuppliers = [
  { name: 'TexMill Global', materials: 'Fabric, Denim', performance: 98, status: 'Active', contact: 'sales@texmill.com', leadTime: '5-7 Days', preferred: true },
  { name: 'ZipCorp', materials: 'Zippers, Hooks', performance: 92, status: 'Active', contact: 'orders@zipcorp.com', leadTime: '2-3 Days', preferred: true },
  { name: 'StitchCo', materials: 'Thread, Needles', performance: 85, status: 'Under Review', contact: 'supply@stitchco.com', leadTime: '4-6 Days', preferred: false },
  { name: 'ButtonWorks', materials: 'Buttons, Fasteners', performance: 99, status: 'Active', contact: 'hello@buttonworks.com', leadTime: '2-5 Days', preferred: true },
];

const inventoryMaterials = [
  { id: 'MAT-005', name: 'Denim Fabric (Blue)', category: 'Fabric', unit: 'meters', supplier: 'TexMill Global', costPerUnit: 5, priority: 'Critical', available: 0, required: 800 },
  { id: 'MAT-002', name: 'Polyester Thread (Navy)', category: 'Thread', unit: 'spools', supplier: 'StitchCo', costPerUnit: 2, priority: 'Medium', available: 120, required: 200 },
  { id: 'MAT-007', name: 'Metal Hooks (Silver)', category: 'Hooks', unit: 'pieces', supplier: 'ZipCorp', costPerUnit: 0.3, priority: 'High', available: 150, required: 300 },
  { id: 'MAT-001', name: 'Cotton Fabric (White)', category: 'Fabric', unit: 'meters', supplier: 'TexMill Global', costPerUnit: 5, priority: 'Low', available: 1250, required: 1000 },
  { id: 'MAT-003', name: 'Metal Zippers 15cm', category: 'Zippers', unit: 'pieces', supplier: 'ZipCorp', costPerUnit: 1.5, priority: 'Low', available: 45, required: 0 },
  { id: 'MAT-004', name: 'Plastic Buttons (Black)', category: 'Buttons', unit: 'pieces', supplier: 'ButtonWorks', costPerUnit: 0.5, priority: 'Low', available: 5000, required: 5000 },
  { id: 'MAT-006', name: 'Standard Collar (White)', category: 'Collar/Cuff', unit: 'pieces', supplier: 'TexMill Global', costPerUnit: 3, priority: 'Low', available: 800, required: 600 },
  { id: 'MAT-008', name: 'Linen Fabric (Beige)', category: 'Fabric', unit: 'meters', supplier: 'TexMill Global', costPerUnit: 6, priority: 'Low', available: 320, required: 0 }
];

export default function CreateProcurementPage() {
  const router = useRouter();
  const { user } = useAuth();

  const advanceStage = (nextPath: string, nextStage: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      updateOrderAndLog(po, user?.name || 'System User', 'Updated', null, (orders) => {
        return orders.map((o: any) => o.poNumber === po ? { ...o, stage: nextStage } : o);
      });
      router.push(`${nextPath}?poNumber=${encodeURIComponent(po)}`);
    } else {
      router.push(nextPath);
    }
  };

  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [requestedMaterials, setRequestedMaterials] = useState<{
    key: string;
    materialId: string;
    customName?: string;
    quantity: number;
    supplier: string;
  }[]>([]);

  const [formData, setFormData] = useState({
    poNumber: '',
    requestDate: new Date().toISOString().split('T')[0],
    requestedBy: '',
    department: 'Production',
    requiredDate: '',
    notes: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [archivedItems, setArchivedItems] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const ordersStr = localStorage.getItem('savedOrders');
        if (ordersStr) {
          const orders = JSON.parse(ordersStr);
          if (Array.isArray(orders)) {
            const autoGen = localStorage.getItem('autoGeneratedProcurementRequests');
            let reqs = autoGen ? JSON.parse(autoGen) : [];
            if (!Array.isArray(reqs)) reqs = [];
            let updated = false;

            orders.forEach((order: any) => {
              if (order.specs && Array.isArray(order.specs)) {
                order.specs.forEach((spec: any) => {
                  const available = spec.stockAvailable ?? 0;
                  if (available === 0 && spec.quantity > 0) {
                    const reqId = `PR-${order.poNumber}-${spec.id || 'SPEC'}`;
                    const exists = reqs.some((r: any) => r.id === reqId || (r.linkedPO === order.poNumber && r.material.includes(spec.itemDescription)));
                    if (!exists) {
                      const hsnCodes: Record<string, string> = {
                        "School Shirt": "620520",
                        "Corporate Shirt": "620530",
                        "School Pant": "620342",
                        "Denim Fabric": "520942",
                        "Cotton Fabric": "520811",
                        "Buttons": "960621",
                        "Thread": "520411",
                        "Hooks": "830810",
                        "Zippers": "960711",
                        "Labels": "580710"
                      };
                      let hsnCode = "620500";
                      for (const key in hsnCodes) {
                        if (spec.itemDescription.toLowerCase().includes(key.toLowerCase())) {
                          hsnCode = hsnCodes[key];
                          break;
                        }
                      }
                      reqs.push({
                        id: reqId,
                        material: `${spec.itemDescription} (HSN: ${hsnCode}) - ${spec.pattern}`,
                        category: 'Fabric',
                        required: spec.quantity,
                        available: 0,
                        shortage: spec.quantity,
                        unit: 'units',
                        supplier: 'Pending Assignment',
                        cost: spec.quantity * (spec.unitPrice || 350),
                        priority: 'Critical',
                        status: 'Pending Procurement',
                        linkedPO: order.poNumber,
                        hsnCode,
                        description: `${spec.itemDescription} (${spec.size}) - ${spec.pattern}`
                      });
                      updated = true;
                    }
                  }
                });
              }
            });

            if (updated) {
              localStorage.setItem('autoGeneratedProcurementRequests', JSON.stringify(reqs));
            }
          }
        }
      } catch (e) {
        console.error("Error in automated out-of-stock routing:", e);
      }
    }

    let orders: any[] = [];
    const ordersStr = localStorage.getItem('savedOrders');
    if (ordersStr) {
      try { orders = JSON.parse(ordersStr); setAvailableOrders(orders); } catch (e) { }
    }

    const archivedStr = localStorage.getItem('archivedProcurementRequests');
    let currentArchived: any[] = [];
    if (archivedStr) {
      try { currentArchived = JSON.parse(archivedStr); } catch (e) { }
    }
    setArchivedItems(currentArchived);

    const po = searchParams.get('poNumber') || '';
    if (po) {
      setFormData(prev => ({ ...prev, poNumber: po }));

      const matchedOrder = orders.find(o => o.poNumber === po);
      if (matchedOrder) {
        setFormData(prev => ({
          ...prev,
          poNumber: po,
          requestedBy: matchedOrder.customerName || prev.requestedBy,
          requiredDate: matchedOrder.deliveryDate || prev.requiredDate
        }));

        const autoReqStr = localStorage.getItem('autoGeneratedProcurementRequests');
        let autoReqs = [];
        if (autoReqStr) {
          try { autoReqs = JSON.parse(autoReqStr); } catch (e) { }
        }
        const matchedAutoReqs = autoReqs.filter((r: any) => r.id.includes(`PR-${po}`));

        if (matchedAutoReqs.length > 0) {
          const mappedItems = matchedAutoReqs.map((req: any, idx: number) => {
            const match = inventoryMaterials.find(m => m.name.toLowerCase().includes(req.material.split(' ')[0].toLowerCase())) || inventoryMaterials[0];
            return {
              key: `bom-${idx}-${Date.now()}`,
              materialId: match.id,
              customName: req.material,
              quantity: req.shortage,
              supplier: match.supplier
            };
          });
          setRequestedMaterials(mappedItems);
        } else if (matchedOrder.specs && matchedOrder.specs.length > 0) {
          const mappedItems = matchedOrder.specs.map((spec: any, idx: number) => {
            const required = spec.quantity || 0;
            const available = spec.stockAvailable || 0;
            const shortage = Math.max(0, required - available);
            if (shortage > 0) {
              const match = inventoryMaterials.find(m => m.name.includes(spec.itemDescription || '')) || inventoryMaterials[0];
              return {
                key: `init-${idx}-${Date.now()}`,
                materialId: match.id,
                customName: `${spec.itemDescription} (${spec.size}) - ${spec.pattern}`,
                quantity: shortage,
                supplier: match.supplier
              };
            }
            return null;
          }).filter(Boolean);
          setRequestedMaterials(mappedItems as any);
        }
      }
    }
  }, [searchParams]);

  const getMaterialDetails = (id: string) => {
    return inventoryMaterials.find(m => m.id === id) || inventoryMaterials[0];
  };

  const handleAddMaterialRow = () => {
    setRequestedMaterials(prev => [
      ...prev,
      {
        key: `new-${Date.now()}-${Math.random()}`,
        materialId: 'MAT-001',
        quantity: 100,
        supplier: 'TexMill Global'
      }
    ]);
  };

  const handleRemoveMaterialRow = (index: number) => {
    const itemToArchive = requestedMaterials[index];
    setArchivedItems(prev => [...prev, itemToArchive]);
    setRequestedMaterials(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRestoreItem = (index: number) => {
    const itemToRestore = archivedItems[index];
    setRequestedMaterials(prev => [...prev, itemToRestore]);
    setArchivedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handlePermanentlyDelete = (index: number) => {
    if (window.confirm("Are you sure you want to permanently delete this material?")) {
      setArchivedItems(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleMaterialUpdate = (index: number, field: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setRequestedMaterials(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'materialId') {
        const details = inventoryMaterials.find(m => m.id === value);
        if (details) {
          next[index].supplier = details.supplier;
        }
      }
      return next;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'poNumber') {
      setFormData(prev => {
        const currentPo = prev.poNumber;

        if (currentPo && currentPo !== value && requestedMaterials.length > 0) {
          setArchivedItems(oldArchived => {
            const newArchived = [
              ...oldArchived,
              ...requestedMaterials.map(m => ({ ...m, archiveReason: 'Not Related To Current Order', archivedDate: new Date().toISOString(), linkedPO: currentPo, material: m.customName || m.materialId }))
            ];
            localStorage.setItem('archivedProcurementRequests', JSON.stringify(newArchived));
            return newArchived;
          });
          setRequestedMaterials([]);
        }
        return { ...prev, [name]: value };
      });

      const matchedOrder = availableOrders.find(o => o.poNumber === value);
      if (matchedOrder) {
        setFormData(prev => ({
          ...prev,
          poNumber: value,
          requestedBy: matchedOrder.customerName || prev.requestedBy,
          requiredDate: matchedOrder.deliveryDate || prev.requiredDate
        }));

        const autoReqStr = localStorage.getItem('autoGeneratedProcurementRequests');
        let autoReqs = [];
        if (autoReqStr) {
          try { autoReqs = JSON.parse(autoReqStr); } catch (e) { }
        }
        const matchedAutoReqs = autoReqs.filter((r: any) => r.id.includes(`PR-${value}`));

        if (matchedAutoReqs.length > 0) {
          const mappedItems = matchedAutoReqs.map((req: any, idx: number) => {
            const match = inventoryMaterials.find(m => m.name.toLowerCase().includes(req.material.split(' ')[0].toLowerCase())) || inventoryMaterials[0];
            return {
              key: `bom-${idx}-${Date.now()}`,
              materialId: match.id,
              customName: req.material,
              quantity: req.shortage,
              supplier: match.supplier
            };
          });
          setRequestedMaterials(mappedItems);
        } else if (matchedOrder.specs && matchedOrder.specs.length > 0) {
          const mappedItems = matchedOrder.specs.map((spec: any, idx: number) => {
            const required = spec.quantity || 0;
            const available = spec.stockAvailable || 0;
            const shortage = Math.max(0, required - available);
            if (shortage > 0) {
              const match = inventoryMaterials.find(m => m.name.includes(spec.itemDescription || '')) || inventoryMaterials[0];
              return {
                key: `dyn-${idx}-${Date.now()}`,
                materialId: match.id,
                customName: `${spec.itemDescription} (${spec.size}) - ${spec.pattern}`,
                quantity: shortage,
                supplier: match.supplier
              };
            }
            return null;
          }).filter(Boolean);
          setRequestedMaterials(mappedItems as any);
        } else {
          setRequestedMaterials([]);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const estimatedCost = requestedMaterials.reduce((acc, item) => {
    const details = getMaterialDetails(item.materialId);
    return acc + (item.quantity * details.costPerUnit);
  }, 0);

  const totalItemsCount = requestedMaterials.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Procurement" />

      {/* Header Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => advanceStage('/procurement', 'Procurement')}
          className="p-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Plus className="h-6 w-6 text-indigo-600" />
            {t('procurement.createRequest') || 'Create Purchase Request'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {t('procurement.createRequestDesc') || 'Submit a formal procurement proposal to resolve outstanding material shortages'}
          </p>
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 overflow-hidden shadow-sm max-w-3xl mx-auto mt-6">
          <div className="border-b border-emerald-100 px-6 py-8 bg-emerald-50/50 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-800">
              {t('SubmittedSuccess') || 'Purchase Request Submitted Successfully'}
            </h2>
            <p className="text-emerald-600 text-sm mt-1">
              {t('SubmittedDesc') || `PO Number ${formData.poNumber} has been sent for approval.`}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-slate-900 rounded-lg border border-neutral-100 dark:border-slate-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('dashboard.recentOrders.headers.poNumber') || 'PO Number'}</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formData.poNumber}</p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-slate-900 rounded-lg border border-neutral-100 dark:border-slate-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('dashboard.recentOrders.headers.customer') || 'Requested By'}</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formData.requestedBy} ({formData.department})</p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-slate-900 rounded-lg border border-neutral-100 dark:border-slate-800 md:col-span-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{t('inventoryVal.materialsHeader') || 'Materials Requested'}</p>
                <div className="divide-y divide-neutral-200 dark:divide-slate-700 border border-neutral-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                  {requestedMaterials.map((item, idx) => {
                    const details = getMaterialDetails(item.materialId);
                    return (
                      <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-sm">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{t(`inventory.materials.items.${details.id}`) || details.name}</span>
                        <span className="text-neutral-500 dark:text-neutral-400 font-semibold">{item.quantity} {details.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => advanceStage('/procurement', 'Procurement')}
                className="px-5 py-2.5 bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 rounded-lg font-medium text-sm transition-colors"
              >
                {t('Back To Summary') || 'Back to Procurement'}
              </button>
              <button
                onClick={() => advanceStage('/procurement', 'Procurement')}
                className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm font-medium text-sm flex items-center gap-2 group transition-colors"
              >
                {t('procurement.continueAllocation')}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">
            {showArchive ? (
              <div className="flex flex-col h-full">
                <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <Archive className="h-5 w-5 text-indigo-600" />
                    Archived Items Dashboard
                  </h2>
                  <button
                    onClick={() => setShowArchive(false)}
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-800 rounded-lg text-sm font-medium shadow-sm transition-colors"
                  >
                    Back to Procurement
                  </button>
                </div>
                <div className="p-6">
                  {archivedItems.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-slate-700 rounded-xl bg-neutral-50 dark:bg-slate-900/50">
                      <Archive className="h-10 w-10 text-neutral-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-neutral-500 dark:text-neutral-400 font-medium">No archived materials found.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-200 dark:border-slate-700 rounded-xl">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="bg-neutral-50 dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-700 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                            <th className="px-4 py-3">Material Name</th>
                            <th className="px-4 py-3">PO Number</th>
                            <th className="px-4 py-3">Archived Date</th>
                            <th className="px-4 py-3">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                          {archivedItems.map((item, idx) => {
                            return (
                              <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  {item.material}
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                                  {item.linkedPO}
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                                  {item.archivedDate ? new Date(item.archivedDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-500 italic">
                                  {item.archiveReason || 'Not Related To Current Order'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-5 bg-neutral-50/50 dark:bg-slate-800/30">
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                    {t('procurement.requestFormTitle') || 'Purchase Request Configuration'}
                  </h2>
                </div>


                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        {t('dashboard.recentOrders.headers.poNumber') || 'PO Number'}
                      </label>
                      <input
                        type="text"
                        name="poNumber"
                        list="poList"
                        placeholder="Search or enter PO"
                        value={formData.poNumber}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                      <datalist id="poList">
                        {availableOrders.map((order, idx) => (
                          <option key={idx} value={order.poNumber} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        {t('dashboard.recentOrders.headers.deliveryDate') || 'Request Date'}
                      </label>
                      <input
                        type="text"
                        value={formData.requestDate}
                        disabled
                        className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 text-neutral-500 dark:text-neutral-400 rounded-lg text-sm font-medium focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        {t('dashboard.recentOrders.headers.customer') || 'Requested By'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="requestedBy"
                        required
                        value={formData.requestedBy}
                        onChange={handleInputChange}
                        placeholder={t('procurement.enterYourName') || "Enter full name"}
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        {t('role') || 'Department'}
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-slate-900"
                      >
                        <option value="Production">{t('orderInitiation.tracker.production') || 'Production'}</option>
                        <option value="Inventory">{t('orderInitiation.tracker.inventory') || 'Inventory'}</option>
                        <option value="Quality Control">{t('orderInitiation.tracker.quality') || 'Quality Control'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Materials List Component */}
                  <div className="border-t border-neutral-100 dark:border-slate-800 pt-6 space-y-4">
                    <div className="flex justify-between items-center bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                      <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                        <FileCheck2 className="h-4 w-4" />
                        Material Procurement Form
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowArchive(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Archive Box ({archivedItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleAddMaterialRow}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Material
                        </button>
                      </div>
                    </div>

                    <div className="border border-neutral-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                      <div className="w-full">
                        {/* Header Row */}
                        <div className="grid grid-cols-[3fr_1fr_0.8fr_2.5fr_1.5fr_1.2fr] gap-6 items-center bg-neutral-50 dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-700 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider whitespace-nowrap px-6 py-3">
                          <div>{t('inventoryVal.materialsHeader') || 'Material'}</div>
                          <div>Quantity</div>
                          <div>Unit</div>
                          <div>{t('bom.customer') || 'Supplier'}</div>
                          <div className="text-right">Est. Cost</div>
                          <div className="text-center">Actions</div>
                        </div>

                        {/* Body Rows */}
                        <div className="divide-y divide-neutral-100 dark:divide-slate-800">
                          {requestedMaterials.map((item, index) => {
                            const details = getMaterialDetails(item.materialId);
                            const unitTrans = details.unit === 'meters'
                              ? (t('inventory.units.meters') || 'meters')
                              : details.unit === 'spools'
                                ? (t('inventory.units.spools') || 'spools')
                                : details.unit === 'pieces'
                                  ? (t('inventory.units.pieces') || 'pieces')
                                  : (t('inventory.units.units') || 'units');
                            return (
                              <div key={item.key} className="grid grid-cols-[3fr_1fr_0.8fr_2.5fr_1.5fr_1.2fr] gap-6 items-center hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors px-6 pt-3.5 pb-5">
                                {/* Column 1: Material */}
                                <div className="min-w-0">
                                  <div className="relative w-full h-9 flex items-center">
                                    <select
                                      value={item.materialId}
                                      onChange={(e) => handleMaterialUpdate(index, 'materialId', e.target.value)}
                                      className={`w-full h-9 px-3 py-1.5 border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 transition-colors shadow-sm ${details.available < details.required
                                        ? 'border-red-300 text-red-600 focus:ring-red-500'
                                        : 'border-neutral-200 dark:border-slate-700/80 text-neutral-800 dark:text-neutral-200 focus:ring-indigo-500'
                                        }`}
                                    >
                                      {inventoryMaterials.map(m => {
                                        const optionShort = m.available < m.required;
                                        return (
                                          <option
                                            key={m.id}
                                            value={m.id}
                                            className={optionShort ? 'text-red-600 font-semibold' : 'text-neutral-800 dark:text-neutral-200'}
                                          >
                                            {item.customName && m.id === item.materialId ? item.customName : (t(`inventory.materials.items.${m.id}`) || m.name)}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <span className={`absolute top-9.5 left-1 text-[10px] font-bold transition-colors leading-none ${details.available < details.required ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400'
                                      }`}>
                                      {details.id}
                                    </span>
                                  </div>
                                </div>

                                {/* Column 2: Quantity */}
                                <div className="min-w-0">
                                  <div className="h-9 flex items-center">
                                    <input
                                      type="number"
                                      min={1}
                                      value={item.quantity}
                                      onChange={(e) => handleMaterialUpdate(index, 'quantity', parseInt(e.target.value) || 0)}
                                      className="w-full h-9 px-3 py-1.5 border border-neutral-200 dark:border-slate-700/80 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-slate-900 shadow-sm"
                                    />
                                  </div>
                                </div>

                                {/* Column 3: Unit */}
                                <div className="min-w-0">
                                  <div className="h-9 flex items-center text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">
                                    {unitTrans}
                                  </div>
                                </div>

                                {/* Column 4: Supplier */}
                                <div className="min-w-0">
                                  <div className="h-9 flex items-center">
                                    <select
                                      value={item.supplier}
                                      onChange={(e) => handleMaterialUpdate(index, 'supplier', e.target.value)}
                                      className="w-full h-9 px-3 py-1.5 border border-neutral-200 dark:border-slate-700/80 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-neutral-800 dark:text-neutral-200 shadow-sm"
                                    >
                                      {mockSuppliers.map((sup, idx) => (
                                        <option key={idx} value={sup.name}>{sup.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Column 5: Est. Cost */}
                                <div className="min-w-0 text-right">
                                  <div className="h-9 flex items-center justify-end text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                    ₹{(item.quantity * details.costPerUnit).toLocaleString()}
                                  </div>
                                </div>

                                {/* Column 6: Actions */}
                                <div className="min-w-0 text-center">
                                  <div className="h-9 flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMaterialRow(index)}
                                      disabled={requestedMaterials.length <= 1}
                                      className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        {t('dashboard.recentOrders.headers.deliveryDate') || 'Required By Date'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="requiredDate"
                        required
                        value={formData.requiredDate}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                      Upload Purchase Order (PO)
                    </label>
                    <textarea
                      name="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                      placeholder="Enter any additional procurement notes here..."
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => advanceStage('/procurement', 'Procurement')}
                      className="px-5 py-2.5 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {t('back') || 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md transition-colors"
                    >
                      {t('procurement.createRequest') || 'Submit Purchase Request'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Sidebar Context Card */}
          <div className="space-y-6">
            {/* Consolidated Purchase Request Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">
              <div className="border-b border-neutral-200 dark:border-slate-700 px-5 py-4 bg-neutral-50/50 dark:bg-slate-800/30">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  {t('procurement.shortageProfile') || 'Purchase Proposal Summary'}
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Total Unique Items
                  </span>
                  <p className="text-2xl font-extrabold text-indigo-900">
                    {requestedMaterials.length}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-neutral-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                      Total Volume
                    </span>
                    <p className="text-md font-semibold text-neutral-700 dark:text-neutral-300">
                      {totalItemsCount.toLocaleString()} units
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                      Est. Cost
                    </span>
                    <p className="text-md font-bold text-red-600">
                      ₹{estimatedCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                {requestedMaterials.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Shortage Breakdown
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {requestedMaterials.map((item, idx) => {
                        const details = getMaterialDetails(item.materialId);
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-slate-900 p-2 rounded border border-neutral-100 dark:border-slate-800">
                            <span className="font-medium truncate max-w-[120px]">{t(`inventory.materials.items.${details.id}`) || details.name}</span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{item.quantity} {details.unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier Information Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">
              <div className="border-b border-neutral-200 dark:border-slate-700 px-5 py-4 bg-neutral-50/50 dark:bg-slate-800/30">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  {t('procurement.supplierProfile') || 'Active Suppliers'}
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {Array.from(new Set(requestedMaterials.map(m => m.supplier))).map((supplierName, idx) => {
                  const sup = mockSuppliers.find(s => s.name === supplierName) || mockSuppliers[0];
                  return (
                    <div key={idx} className="border-b border-neutral-100 dark:border-slate-800 last:border-b-0 pb-3 last:pb-0 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{sup.name}</h4>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{sup.materials}</p>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {sup.performance}% Rel.
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                        <span>Lead Time: {sup.leadTime}</span>
                        <span className="text-emerald-600 font-bold uppercase">{sup.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
