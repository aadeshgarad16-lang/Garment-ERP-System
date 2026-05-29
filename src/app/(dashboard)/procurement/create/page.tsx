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

  const advanceStage = (nextPath, nextStage) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const po = params.get('poNumber');
    if (po) {
      const ordersStr = localStorage.getItem('savedOrders');
      if (ordersStr) {
        let orders = JSON.parse(ordersStr);
        orders = orders.map((o) => o.poNumber === po ? { ...o, stage: nextStage } : o);
        localStorage.setItem('savedOrders', JSON.stringify(orders));
        window.dispatchEvent(new Event('storage'));
      }
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
    quantity: number;
    supplier: string;
  }[]>([]);

  const [formData, setFormData] = useState({
    requestId: 'PR-2026-104',
    requestDate: new Date().toISOString().split('T')[0],
    requestedBy: '',
    department: 'Production',
    requiredDate: '',
    notes: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [archivedItems, setArchivedItems] = useState<{
    key: string;
    materialId: string;
    quantity: number;
    supplier: string;
  }[]>([]);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    const paramShortageId = searchParams.get('shortageId');
    const items = paramShortageId
      ? mockShortages.filter(s => s.id === paramShortageId).map((s, idx) => ({
        key: `init-${idx}`,
        materialId: s.id === 'PR-2026-101' ? 'MAT-005' : s.id === 'PR-2026-102' ? 'MAT-002' : 'MAT-007',
        quantity: s.shortage,
        supplier: s.supplier
      }))
      : mockShortages.map((s, idx) => ({
        key: `init-${idx}`,
        materialId: s.id === 'PR-2026-101' ? 'MAT-005' : s.id === 'PR-2026-102' ? 'MAT-002' : 'MAT-007',
        quantity: s.shortage,
        supplier: s.supplier
      }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRequestedMaterials(items);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
              {t('procurement.prSubmittedSuccess') || 'Purchase Request Submitted Successfully'}
            </h2>
            <p className="text-emerald-600 text-sm mt-1">
              {t('procurement.prSubmittedDesc') || `Request ID ${formData.requestId} has been sent for approval.`}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-slate-900 rounded-lg border border-neutral-100 dark:border-slate-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('dashboard.recentOrders.headers.poNumber') || 'Request ID'}</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formData.requestId}</p>
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
                {t('procurement.backToSummary') || 'Back to Procurement'}
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
                            <th className="px-4 py-3">Material Name / Code</th>
                            <th className="px-4 py-3">Quantity & Unit</th>
                            <th className="px-4 py-3">Supplier</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                          {archivedItems.map((item, idx) => {
                            const details = getMaterialDetails(item.materialId);
                            return (
                              <tr key={item.key} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{t(`inventory.materials.items.${details.id}`) || details.name}</div>
                                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{item.materialId}</div>
                                </td>
                                <td className="px-4 py-3 font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                                  {item.quantity} <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">{details.unit}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                                  {item.supplier}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-center items-center gap-3">
                                    <button
                                      onClick={() => handleRestoreItem(idx)}
                                      className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded transition-colors"
                                      title="Restore to active form"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handlePermanentlyDelete(idx)}
                                      className="p-1.5 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded transition-colors"
                                      title="Permanently Delete"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
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
                        {t('dashboard.recentOrders.headers.poNumber') || 'Request ID'}
                      </label>
                      <input
                        type="text"
                        value={formData.requestId}
                        disabled
                        className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 text-neutral-500 dark:text-neutral-400 rounded-lg text-sm font-medium focus:outline-none cursor-not-allowed"
                      />
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
                        {t('profile.role') || 'Department'}
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

                    <div className="overflow-x-auto border border-neutral-200 dark:border-slate-700 rounded-xl">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="bg-neutral-50 dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-700 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                            <th className="px-4 py-3">{t('inventoryVal.materialsHeader') || 'Material'}</th>
                            <th className="px-4 py-3 w-32">Quantity</th>
                            <th className="px-4 py-3">Unit</th>
                            <th className="px-4 py-3">{t('bom.customer') || 'Supplier'}</th>
                            <th className="px-4 py-3 text-right">Est. Cost</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                          {requestedMaterials.map((item, index) => {
                            const details = getMaterialDetails(item.materialId);
                            const unitTrans = details.unit === 'meters'
                              ? (t('dashboard.stockAlerts.footer.metersRemaining') || 'meters')
                              : details.unit === 'spools'
                                ? (t('dashboard.stockAlerts.footer.spoolsRemaining') || 'spools')
                                : (t('dashboard.stockAlerts.footer.unitsRemaining') || 'units');
                            return (
                              <tr key={item.key} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1 min-w-[200px]">
                                    <select
                                      value={item.materialId}
                                      onChange={(e) => handleMaterialUpdate(index, 'materialId', e.target.value)}
                                      className={`w-full px-2 py-1.5 border rounded-lg text-xs font-semibold focus:ring-1 outline-none bg-white dark:bg-slate-900 transition-colors ${details.available < details.required
                                          ? 'border-red-300 text-red-600 focus:ring-red-500'
                                          : 'border-neutral-300 dark:border-slate-600 text-neutral-800 dark:text-neutral-200 focus:ring-indigo-500'
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
                                            {t(`inventory.materials.items.${m.id}`) || m.name}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <span className={`text-[10px] px-1 font-semibold transition-colors ${details.available < details.required ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400'
                                      }`}>
                                      {details.id}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => handleMaterialUpdate(index, 'quantity', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 border border-neutral-300 dark:border-slate-600 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-neutral-800 dark:text-neutral-200"
                                  />
                                </td>
                                <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                                  {unitTrans}
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={item.supplier}
                                    onChange={(e) => handleMaterialUpdate(index, 'supplier', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-neutral-300 dark:border-slate-600 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 text-neutral-800 dark:text-neutral-200"
                                  >
                                    {mockSuppliers.map((sup, idx) => (
                                      <option key={idx} value={sup.name}>{sup.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-right text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                  ₹{(item.quantity * details.costPerUnit).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMaterialRow(index)}
                                    disabled={requestedMaterials.length <= 1}
                                    className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
                      Est. Deficit Cost
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
