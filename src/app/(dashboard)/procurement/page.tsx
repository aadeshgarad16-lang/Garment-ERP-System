"use client";


import React, { useState } from 'react';
import {
  Truck,
  Clock,
  FileCheck,
  AlertTriangle,
  DollarSign,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  ListChecks,
  Star,
  ArrowRight,
  Download,
  Upload,
  FileUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkflowIndicator from '@/components/WorkflowIndicator';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';
import { useOrders } from '@/contexts/order-context';
import { isStageMatch } from '@/utils/orderUtils';
import { formatDateDisplay } from '@/utils/dateUtils';
import { generateProcurementPDF } from '@/utils/pdfGenerator';

const initialMockShortages = [
  { id: 'PR-2026-101', material: 'Denim Fabric (Blue)', category: 'Fabric', required: 800, available: 0, shortage: 800, unit: 'meters', supplier: 'TexMill Global', cost: 4000, priority: 'Critical', status: 'Pending Procurement' },
  { id: 'PR-2026-102', material: 'Polyester Thread (Navy)', category: 'Thread', required: 200, available: 120, shortage: 80, unit: 'spools', supplier: 'StitchCo', cost: 160, priority: 'Medium', status: 'Supplier Assigned' },
  { id: 'PR-2026-103', material: 'Metal Hooks (Silver)', category: 'Hooks', required: 300, available: 150, shortage: 150, unit: 'pieces', supplier: 'ZipCorp', cost: 45, priority: 'High', status: 'Ordered' },
];

const MOCK_SUPPLIERS = [
  { id: "v1", name: "Apex Textiles Ltd" },
  { id: "v2", name: "Global Threads & Yarns" },
  { id: "v3", name: "Supreme Trims Co." },
  { id: "v4", name: "Vardhman Yarns" },
  { id: "v5", name: "Reliable Buttons & Zippers" }
];


const timelineSteps = [
  { label: 'Request Created', date: 'May 10, 10:30 AM', completed: true },
  { label: 'Approved', date: 'May 11, 09:15 AM', completed: true },
  { label: 'Ordered', date: 'May 11, 02:45 PM', completed: true },
  { label: 'In Transit', date: 'May 13, 08:00 AM', completed: true },
  { label: 'Delivered', date: 'Expected May 14', completed: false },
];

const STORE_ARTICLES = "Store's Article";

export default function ProcurementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useOrders();

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
          // Log legacy UI helper
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

  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState<string[]>([]);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [suppliersList, setSuppliersList] = useState(MOCK_SUPPLIERS);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Record<string, string>>({});

  const [mockShortages, setMockShortages] = useState<any[]>([]);
  const [poInput, setPoInput] = useState('');
  const [archivedRequests, setArchivedRequests] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Multi-Supplier Selection State
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number | string>>({});
  const [articleSplits, setArticleSplits] = useState<{ id: string, parentId: string }[]>([]);


  // Interactive Navigator State
  const [activeTab, setActiveTab] = useState<'pending' | 'in_process' | 'completed' | 'history'>('pending');

  const [inProcessPOs, setInProcessPOs] = useState<any[]>([]);
  const [completedPOs, setCompletedPOs] = useState<any[]>([]);
  const [historyPOs, setHistoryPOs] = useState<any[]>([]);

  React.useEffect(() => {
    const loadSharedOrders = () => {
      const stored = localStorage.getItem('sharedPurchaseOrders');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setInProcessPOs(parsed.filter((o: any) => o.status === 'In Process' || o.status === 'Partially Received'));
          setCompletedPOs(parsed.filter((o: any) => o.status === 'Completed / Received'));
          setHistoryPOs(parsed);
        } catch (e) {}
      }
    };
    loadSharedOrders();
    const handleStorage = () => loadSharedOrders();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('orders-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('orders-updated', handleStorage);
    };
  }, []);

  const [showGrnModal, setShowGrnModal] = useState(false);
  const [selectedGrnPo, setSelectedGrnPo] = useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (Array.isArray(orders)) {
          const autoGen = localStorage.getItem('autoGeneratedProcurementRequests');
          let reqs = autoGen ? JSON.parse(autoGen) : [];
          if (!Array.isArray(reqs)) reqs = [];
          let updated = false;

          const targetKeywords = ['procurement', 'purchase requested', 'pending assignment'];

          orders.forEach((order: any) => {
            if (isStageMatch(order.stage, targetKeywords) ||
              isStageMatch(order.workflow_status, targetKeywords) ||
              isStageMatch(order.currentStage, targetKeywords) ||
              isStageMatch(order.workflowStage, targetKeywords)) {
              if (order.specs && Array.isArray(order.specs)) {
                order.specs.forEach((spec: any) => {
                  const available = spec.stockAvailable ?? 0;
                  if (spec.quantity > available) {
                    const shortageQty = spec.quantity - available;
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
                        available: available,
                        shortage: shortageQty,
                        unit: 'units',
                        supplier: 'Pending Assignment',
                        cost: shortageQty * (spec.unitPrice || 350),
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
            } // Close isStageMatch if
          });

          if (updated) {
            localStorage.setItem('autoGeneratedProcurementRequests', JSON.stringify(reqs));
          }
        }
      } catch (e) {
        console.error("Error in automated out-of-stock routing:", e);
      }
    }

    const autoGen = localStorage.getItem('autoGeneratedProcurementRequests');
    let loadedRequests: any[] = [];
    if (autoGen) {
      try {
        const parsed = JSON.parse(autoGen);
        if (Array.isArray(parsed)) {
          loadedRequests = parsed;
        }
      } catch (e) { }
    }

    const archivedStr = localStorage.getItem('archivedProcurementRequests');
    if (archivedStr) {
      try { setArchivedRequests(JSON.parse(archivedStr)); } catch (e) { }
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const currentPO = params.get('poNumber');
      if (currentPO) {
        setPoInput(currentPO);
      }
    }
  }, [orders]);

  const fetchStoreArticleShortages = async () => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
      const res = await fetch(`${BACKEND_URL}/store_materials/view?limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'sasons_read_only_key_2026_abc'
        }
      });
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        const activeData = data.data.filter((item: any) =>
          item.is_archived !== true &&
          item.is_archived !== 1 &&
          String(item.is_archived).toLowerCase() !== 'true'
        );
        return activeData
          .filter((item: any) => {
            const isArticle = !item.type || item.type === 'Material' || item.type === 'Article';
            const available = Number(item.available_qty ?? item.availableQty ?? item.available ?? 0);
            const minRequired = Number(item.min_required_qty ?? item.min_required ?? item.minimumRequired ?? 0);
            const status = String(item.status || item.original_status || '');

            const hasShortage = available < minRequired || status.toLowerCase() === 'low stock' || status.toLowerCase() === 'out of stock';
            return isArticle && hasShortage;
          })
          .map((item: any) => {
            const available = Number(item.available_qty ?? item.availableQty ?? item.available ?? 0);
            const minRequired = Number(item.min_required_qty ?? item.min_required ?? item.minimumRequired ?? 0);
            const shortageQty = Math.max(0, minRequired - available);
            const materialName = item.material_name || item.materialName || item.name || 'Unknown Material';
            const hsn = item.hsn_code || item.hsnCode;
            const materialStr = hsn ? `${materialName} (HSN: ${hsn})` : materialName;

            const supplierMappingRaw = item.supplier_ids || item.available_suppliers || item.suppliers || item.preferred_supplier_ids || item.supplier_mapping || item.supplier_name || item.supplier || item.supplier_id;
            let supplierArray = [];

            if (Array.isArray(supplierMappingRaw)) {
              supplierArray = supplierMappingRaw.map(v => String(v));
            } else if (typeof supplierMappingRaw === 'string') {
              try {
                const parsed = JSON.parse(supplierMappingRaw);
                if (Array.isArray(parsed)) supplierArray = parsed.map(v => String(v));
                else supplierArray = [supplierMappingRaw];
              } catch {
                supplierArray = [supplierMappingRaw];
              }
            } else if (supplierMappingRaw != null) {
              supplierArray = [String(supplierMappingRaw)];
            } else {
              supplierArray = ['Store Restock'];
            }

            const supplierNames = supplierArray.map(supp => {
              const strSupp = String(supp).trim();
              const matchedSupplier = MOCK_SUPPLIERS.find(v => String(v.id) === strSupp || v.name.toLowerCase() === strSupp.toLowerCase());
              return matchedSupplier ? matchedSupplier.name : strSupp;
            });

            return {
              id: `PR-STORE-${item.id || item.material_id}`,
              material: materialStr,
              category: item.category || 'General',
              required: minRequired,
              available: available,
              shortage: shortageQty,
              unit: item.unit || 'units',
              supplier: supplierNames[0] || 'Store Restock',
              allSuppliers: supplierNames,
              cost: shortageQty * (Number(item.unit_price ?? item.unitPrice) || 0),
              priority: available === 0 ? 'Critical' : 'High',
              status: 'Pending Procurement',
              linkedPO: null
            };
          });
      }
    } catch (err) {
      console.error('Failed to fetch store materials:', err);
    }
    return [];
  };

  React.useEffect(() => {
    let loadedRequests: any[] = [];
    const autoGen = localStorage.getItem('autoGeneratedProcurementRequests');
    if (autoGen) {
      try {
        const parsed = JSON.parse(autoGen);
        if (Array.isArray(parsed)) loadedRequests = parsed;
      } catch (e) { }
    }

    const fetchPOShortages = (selectedPoNumber: string) => {
      const related = loadedRequests.filter(p => p.linkedPO === selectedPoNumber);
      setMockShortages(related);

      const unrelated = loadedRequests.filter(p => p.linkedPO !== selectedPoNumber);
      if (unrelated.length > 0) {
        const archivedStr = localStorage.getItem('archivedProcurementRequests');
        const newArchived = unrelated.map(u => ({ ...u, archiveReason: 'Not Related To Current Order', archivedDate: new Date().toISOString() }));
        const allArchived = [...(archivedStr ? JSON.parse(archivedStr) : []), ...newArchived];
        localStorage.setItem('archivedProcurementRequests', JSON.stringify(allArchived));
        localStorage.setItem('autoGeneratedProcurementRequests', JSON.stringify(related));
        setArchivedRequests(allArchived);
      }
    };

    if (poInput === STORE_ARTICLES || !poInput || poInput.trim() === '') {
      // CALL STORE SHORTAGES FUNCTION
      fetchStoreArticleShortages().then(storeShortages => {
        let localRequests: any[] = [];
        try {
          const stored = localStorage.getItem('procurement_requests');
          if (stored) localRequests = JSON.parse(stored);
        } catch (e) { }

        const merged = [...storeShortages];
        localRequests.forEach(req => {
          if (!merged.find(m => m.id === req.id || m.id === `PR-STORE-${req.itemId}`)) {
            merged.push({
              id: req.id,
              material: req.itemName + (req.itemCode ? ` (HSN: ${req.itemCode})` : ''),
              category: 'General',
              required: req.requiredQty,
              available: req.availableQty,
              shortage: req.shortageQty,
              unit: 'units',
              supplier: 'Store Restock',
              cost: 0, // Will be updated when unit price is available
              priority: 'High',
              status: req.status || 'Pending Procurement',
              linkedPO: null
            });
          }
        });
        setMockShortages(merged);
      });
    } else {
      // CALL REGULAR PO FUNCTION
      fetchPOShortages(poInput);
    }
  }, [poInput]);

  const totalShortages = mockShortages.length;
  const criticalItems = mockShortages.filter(i => i.available === 0).length;
  const estimatedCost = mockShortages.reduce((acc, curr) => acc + curr.cost, 0);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-muted text-card-foreground border-border';
      case 'Medium': return 'bg-blue-100 text-blue-800 dark:text-blue-200 border-blue-200';
      case 'High': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-card-foreground border-border';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending Procurement': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Supplier Assigned': return 'bg-blue-100 text-blue-800 dark:text-blue-200 border-blue-200';
      case 'Ordered': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Awaiting Delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-muted text-card-foreground border-border';
    }
  };



  const deduplicatedShortages = React.useMemo(() => {
    const grouped = new Map<string, any>();
    mockShortages.forEach(item => {
      const key = item.material; // Grouping by material name string (includes HSN)

      if (grouped.has(key)) {
        const existing = grouped.get(key);
        existing.required += item.required;
        existing.shortage += item.shortage;
        existing.cost += item.cost;

        if (!existing.originalIds) {
          existing.originalIds = [existing.id];
        }
        if (!existing.originalIds.includes(item.id)) {
          existing.originalIds.push(item.id);
        }
        existing.id = existing.originalIds.join(', ');
      } else {
        grouped.set(key, { ...item, originalIds: [item.id] });
      }
    });
    return Array.from(grouped.values());
  }, [mockShortages]);

  const filteredShortages = deduplicatedShortages.filter(item => {
    const matchesSearch = item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const displayRows = React.useMemo(() => {
    const rows: any[] = [];
    filteredShortages.forEach(item => {
      rows.push({ ...item, rowId: item.id, isSplit: false });
      articleSplits.filter(s => s.parentId === item.id).forEach(split => {
        rows.push({ ...item, rowId: split.id, isSplit: true });
      });
    });
    return rows;
  }, [filteredShortages, articleSplits]);

  // Smart Auto-Selection Logic for Supplier Assignments
  React.useEffect(() => {
    if (supplierFilter.length === 1) {
      const singleSupplier = supplierFilter[0];
      setSelectedSuppliers(prev => {
        const next = { ...prev };
        let updated = false;
        displayRows.forEach(row => {
          if (next[row.rowId] !== singleSupplier) {
            next[row.rowId] = singleSupplier;
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    } else if (supplierFilter.length === 0) {
      setSelectedSuppliers(prev => {
        if (Object.keys(prev).length === 0) return prev;
        return {};
      });
    } else {
      setSelectedSuppliers(prev => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach(key => {
          if (next[key] && !supplierFilter.includes(next[key])) {
            delete next[key];
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }
  }, [supplierFilter, displayRows]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      <WorkflowIndicator currentStep="Procurement" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            Procurement
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('procurement.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0 items-center">

          <button
            onClick={() => router.push('/procurement/create')}
            className="w-full sm:w-auto px-4 py-2 bg-card border border-border text-neutral-700 dark:text-neutral-300 rounded-lg shadow-sm hover:bg-muted transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('procurement.createRequest')}
          </button>
          <button
            onClick={() => router.push('/procurement/suppliers')}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-sm hover:bg-indigo-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Supplier Info
          </button>
          <button
            onClick={() => advanceStage('/material-allocation', 'Material Allocation')}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <ListChecks className="h-4 w-4" />
            {t('procurement.continueAllocation')}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {/* Overview Cards (Now Tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => setActiveTab('pending')}
          className={`rounded-xl shadow-sm border p-4 sm:p-5 lg:p-6 flex items-center gap-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-0.5 ${activeTab === 'pending' ? 'bg-card border-indigo-500 ring-1 ring-indigo-500' : 'bg-card border-border hover:border-indigo-400 hover:shadow-md'}`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pending</p>
            <p className="text-2xl font-bold text-foreground">{totalShortages}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('in_process')}
          className={`rounded-xl shadow-sm border p-4 sm:p-5 lg:p-6 flex items-center gap-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-0.5 ${activeTab === 'in_process' ? 'bg-card border-indigo-500 ring-1 ring-indigo-500' : 'bg-card border-border hover:border-indigo-400 hover:shadow-md'}`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">In Process</p>
            <p className="text-2xl font-bold text-foreground">{inProcessPOs.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`rounded-xl shadow-sm border p-4 sm:p-5 lg:p-6 flex items-center gap-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-0.5 ${activeTab === 'completed' ? 'bg-card border-indigo-500 ring-1 ring-indigo-500' : 'bg-card border-border hover:border-indigo-400 hover:shadow-md'}`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Completed / Received</p>
            <p className="text-2xl font-bold text-foreground">{completedPOs.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('history')}
          className={`rounded-xl shadow-sm border p-6 flex items-center gap-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-0.5 ${activeTab === 'history' ? 'bg-card border-indigo-500 ring-1 ring-indigo-500' : 'bg-card border-border hover:border-indigo-400 hover:shadow-md'}`}
        >
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-100">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Purchase History</p>
            <p className="text-lg font-bold text-foreground mt-1">{historyPOs.length} Orders</p>
          </div>
        </div>
      </div>

      {/* Procurement Requests Table */}
      {activeTab === 'pending' && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-6 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-card-foreground">{t('procurement.requestsHeader')}</h2>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative w-full sm:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-foreground bg-card"
                  />
                </div>

                {/* Multi-Select Supplier Filter */}
                <div className="relative w-full sm:w-auto">
                  <div
                    className="block w-full sm:w-56 pl-3 pr-10 py-2 border border-border rounded-lg bg-card cursor-pointer text-sm flex items-center justify-between"
                    onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                  >
                    <span className="truncate text-foreground font-medium">
                      {supplierFilter.length === 0 ? 'All Suppliers' : `${supplierFilter.length} Supplier(s) Selected`}
                    </span>
                    <ChevronRight className={`h-4 w-4 text-neutral-400 transition-transform ${isSupplierDropdownOpen ? 'rotate-90' : ''}`} />
                  </div>

                  {isSupplierDropdownOpen && (
                    <div className="absolute z-10 mt-1 right-0 w-full sm:w-56 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {suppliersList.map((supplier) => (
                          <label key={supplier.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              className="rounded border-border text-indigo-600 focus:ring-indigo-500 bg-card cursor-pointer h-4 w-4"
                              checked={supplierFilter.includes(supplier.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSupplierFilter(prev => [...prev, supplier.name]);
                                } else {
                                  setSupplierFilter(prev => prev.filter(v => v !== supplier.name));
                                }
                              }}
                            />
                            <span className="text-sm text-foreground">{supplier.name}</span>
                          </label>
                        ))}
                        {supplierFilter.length > 0 && (
                          <button
                            onClick={() => setSupplierFilter([])}
                            className="w-full text-center text-xs text-indigo-600 font-semibold p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md mt-2 transition-colors"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse ">
              <thead>
                <tr className="bg-neutral-50 dark:bg-card border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  <th className="px-4 py-3 text-left w-[26%]">{t('inventoryVal.materialsHeader') || 'ARTICLES INVENTORY'}</th>
                  <th className="px-4 py-3 text-center w-[14%]">Required Qty</th>
                  <th className="px-4 py-3 text-center w-[22%]">Supplier</th>
                  <th className="px-4 py-3 text-center w-[14%]">Order Qty</th>
                  <th className="px-4 py-3 text-center w-[14%]">Priority & Status</th>
                  <th className="px-4 py-3 text-center w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {filteredShortages.length > 0 ? (
                  filteredShortages.map((item) => {
                    const splits = articleSplits.filter(s => s.parentId === item.id);
                    const totalRows = splits.length > 0 ? splits.length + 2 : 1; 

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ease-in-out">
                          <td className="px-4 py-3 align-top border-r border-border/50" rowSpan={totalRows}>
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${item.shortage > 0 ? 'bg-red-50 text-red-700 px-2 py-1 rounded-lg inline-block font-semibold border border-red-100' : 'text-foreground'}`}>{item.material}</span>
                              <span className="text-xs text-muted-foreground mt-1">{item.category} • {item.id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-foreground align-top">{item.required} <span className="text-xs text-muted-foreground">{item.unit === 'meters' ? (t('dashboard.stockAlerts.footer.metersRemaining') || 'meters') : item.unit === 'spools' ? (t('dashboard.stockAlerts.footer.spoolsRemaining') || 'spools') : (t('dashboard.stockAlerts.footer.unitsRemaining') || 'units')}</span></td>
                          
                          <td className="px-4 py-3 align-top">
                            <select 
                              className="block w-full py-1.5 pl-3 pr-8 border border-border rounded-lg sm:text-sm text-foreground appearance-none bg-card cursor-pointer"
                              value={selectedSuppliers[item.id] || (item.supplier === 'Store Restock' || item.supplier === 'Pending Assignment' ? '' : item.supplier)}
                              onChange={(e) => setSelectedSuppliers(prev => ({ ...prev, [item.id]: e.target.value }))}
                            >
                              {supplierFilter.length === 0 ? (
                                <option value="" disabled>Select Suppliers above first</option>
                              ) : (
                                <>
                                  <option value="" disabled>Select Supplier</option>
                                  {suppliersList.filter(v => supplierFilter.includes(v.name)).map((supplier) => (
                                    <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                                  ))}
                                </>
                              )}
                            </select>
                          </td>

                          <td className="px-4 py-3 text-center align-top">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                className="w-20 px-2 py-1 text-sm border border-border rounded focus:ring-indigo-500 focus:border-indigo-500 bg-card"
                                value={orderQuantities[item.id] !== undefined ? orderQuantities[item.id] : ''}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setOrderQuantities(prev => ({ ...prev, [item.id]: val === '' ? '' : parseFloat(val) }));
                                }}
                              />
                              <span className="text-xs font-bold text-red-600">Shortage: {item.shortage}</span>
                            </div>
                          </td>
                          
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyle(item.priority)}`}>
                                {item.priority === 'Critical' && <ShieldAlert className="h-3 w-3 mr-1" />}
                                {item.priority === 'Critical' ? (t('procurement.critical') || 'Critical') : item.priority === 'High' ? (t('procurement.high') || 'High') : item.priority === 'Medium' ? (t('procurement.medium') || 'Medium') : (t('procurement.low') || 'Low')}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                                {item.status === 'Pending Procurement' ? (t('procurement.pending') || 'Pending') : item.status === 'Supplier Assigned' ? (t('procurement.supplierAssigned') || 'Supplier Assigned') : (t('procurement.ordered') || 'Ordered')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center align-top">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  const newId = `${item.id}-split-${Date.now()}`;
                                  setArticleSplits(prev => [...prev, { id: newId, parentId: item.id }]);
                                  setOrderQuantities(prev => ({ ...prev, [newId]: 0 }));
                                }}
                                className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                title="Split Allocation"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7l-4 4m4-4l4 4m0 6l4-4m-4 4l-4-4" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {splits.map(split => (
                          <tr key={split.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ease-in-out">
                            <td className="px-4 py-3 text-center text-sm text-muted-foreground align-top">-</td>
                            
                            <td className="px-4 py-3 align-top">
                              <select 
                                className="block w-full py-1.5 pl-3 pr-8 border border-border rounded-lg sm:text-sm text-foreground appearance-none bg-card cursor-pointer"
                                value={selectedSuppliers[split.id] || ''}
                                onChange={(e) => setSelectedSuppliers(prev => ({ ...prev, [split.id]: e.target.value }))}
                              >
                                {supplierFilter.length === 0 ? (
                                  <option value="" disabled>Select Suppliers above first</option>
                                ) : (
                                  <>
                                    <option value="" disabled>Select Supplier</option>
                                    {suppliersList.filter(v => supplierFilter.includes(v.name)).map((supplier) => (
                                      <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                                    ))}
                                  </>
                                )}
                              </select>
                            </td>

                            <td className="px-4 py-3 text-center align-top">
                              <div className="flex flex-col items-center justify-center">
                                <input
                                type="number"
                                min="0"
                                className="w-20 px-2 py-1 text-sm border border-border rounded focus:ring-indigo-500 focus:border-indigo-500 bg-card"
                                value={orderQuantities[split.id] !== undefined ? orderQuantities[split.id] : ''}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setOrderQuantities(prev => ({ ...prev, [split.id]: val === '' ? '' : parseFloat(val) }));
                                }}
                              />
                              </div>
                            </td>
                            
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyle(item.priority)}`}>
                                  {item.priority === 'Critical' ? (t('procurement.critical') || 'Critical') : item.priority === 'High' ? (t('procurement.high') || 'High') : item.priority === 'Medium' ? (t('procurement.medium') || 'Medium') : (t('procurement.low') || 'Low')}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center align-top">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setArticleSplits(prev => prev.filter(s => s.id !== split.id));
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Remove Split"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {splits.length > 0 && (
                          <tr className="bg-indigo-50/50 dark:bg-indigo-900/10 font-medium">
                            <td className="px-4 py-2 border-t border-border"></td>
                            <td className="px-4 py-2 text-right text-xs uppercase text-indigo-600/80 dark:text-indigo-400 border-t border-border">Total Combined Qty:</td>
                            <td className="px-4 py-2 text-center font-bold text-indigo-700 dark:text-indigo-300 border-t border-border">
                              { (Number(orderQuantities[item.id]) || 0) + 
                                splits.reduce((sum, s) => sum + (Number(orderQuantities[s.id]) || 0), 0) }
                            </td>
                            <td colSpan={2} className="px-4 py-2 border-t border-border"></td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-8 w-8 text-neutral-300 mb-2" />
                        <p>
                          {supplierFilter.length > 0
                            ? 'No active shortages found for the selected supplier(s).'
                            : poInput === STORE_ARTICLES
                              ? 'No store article shortages found.'
                              : (t('dashboard.recentOrders.headers.poNumber') || 'No procurement requests found.')}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-neutral-50 dark:bg-card px-4 py-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {t('inventoryVal.showing') || 'Showing'} <span className="font-medium text-foreground">1</span> {t('inventoryVal.to') || 'to'} <span className="font-medium text-foreground">{filteredShortages.length}</span> {t('inventoryVal.of') || 'of'} <span className="font-medium text-foreground">{mockShortages.length}</span>
              </p>
              <button
                onClick={() => {
                  const selectedItems = displayRows.filter(item => {
                    const supplierName = selectedSuppliers[item.rowId] || (item.supplier !== 'Store Restock' && item.supplier !== 'Pending Assignment' ? item.supplier : null);
                    const qty = Number(orderQuantities[item.rowId]) || 0;
                    return supplierName && qty > 0;
                  });

                  if (selectedItems.length === 0) {
                    alert("Please assign a supplier and ensure quantity is greater than 0 for at least one item to generate a Purchase Order.");
                    return;
                  }
                  const groupedBySupplier = new Map<string, any[]>();
                  selectedItems.forEach(item => {
                    const supplierName = selectedSuppliers[item.rowId] || item.supplier;
                    const qty = Number(orderQuantities[item.rowId]) || 0;
                    const unitPrice = item.cost ? (item.cost / (item.shortage || 1)) : 0;
                    const cost = unitPrice * qty;

                    if (!groupedBySupplier.has(supplierName)) {
                      groupedBySupplier.set(supplierName, []);
                    }

                    const supplierItems = groupedBySupplier.get(supplierName)!;

                    // Deduplication Logic (group by original item.id)
                    const existingItem = supplierItems.find(i => i.id === item.id);
                    if (existingItem) {
                      existingItem.orderQty += qty;
                      existingItem.orderCost += cost;
                    } else {
                      supplierItems.push({ ...item, orderQty: qty, orderCost: cost });
                    }
                  });

                  const serializedGroups = Array.from(groupedBySupplier.entries()).map(([supplierName, items]) => ({
                    supplierName,
                    items
                  }));
                  
                  localStorage.setItem('review_po_session', JSON.stringify(serializedGroups));
                  router.push('/procurement/review-po');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Create Purchase Orders
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 border border-border rounded-md bg-card text-neutral-400 hover:text-neutral-700 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="p-2 border border-border rounded-md bg-card text-neutral-400 hover:text-neutral-700 hover:bg-muted transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In Process Tab */}
      {activeTab === 'in_process' && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold text-card-foreground">Active Purchase Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-muted/50 border-y border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Order Date</th>
                  <th className="px-6 py-4">Est. Delivery</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inProcessPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{po.id}</td>
                    <td className="px-6 py-4">{po.supplier}</td>
                    <td className="px-6 py-4">{po.date}</td>
                    <td className="px-6 py-4">{po.expectedDelivery}</td>
                    <td className="px-6 py-4">₹{po.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${po.status === 'Partially Received' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Export PDF">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === 'completed' && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold text-card-foreground">Awaiting Goods Receipt Note (GRN)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-muted/50 border-y border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">GRN Number</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Receiving Date</th>
                  <th className="px-6 py-4">Quantity Received</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {completedPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{po.id}</td>
                    <td className="px-6 py-4 text-xs font-mono">{po.grnNumbers?.join(', ') || 'N/A'}</td>
                    <td className="px-6 py-4">{po.supplier}</td>
                    <td className="px-6 py-4">{po.receivingDates?.join(', ') || po.deliveredOn || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium">{po.receivedQty} / {po.items}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                       <button onClick={() => generateProcurementPDF(po)} className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Download PDF">
                          <Download className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-card-foreground">Purchase History Archive</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input type="text" placeholder="Search PO or Supplier..." className="pl-9 pr-3 py-1.5 rounded-lg border border-border text-sm w-full sm:w-48 bg-card" />
              </div>
              <input type="date" className="px-3 py-1.5 rounded-lg border border-border text-sm bg-card" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-muted/50 border-y border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Delivered On</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{po.id}</td>
                    <td className="px-6 py-4">{po.supplier}</td>
                    <td className="px-6 py-4">{po.deliveredOn}</td>
                    <td className="px-6 py-4">{po.items}</td>
                    <td className="px-6 py-4">₹{po.total.toLocaleString()}</td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Export PDF">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lower Section: Grid layout for Suppliers & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Supplier Summary */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-6 py-5 bg-neutral-50/50 dark:bg-card/30">
            <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              {t('procurement.supplierSummary') || 'Supplier Directory Summary'}
            </h2>
          </div>
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-card border-b border-neutral-100 dark:border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  <th className="px-2 py-3 w-[22%] break-words">{t('bom.customer') || 'Supplier Name'}</th>
                  <th className="px-2 py-3 w-[25%] break-words">{t('inventoryVal.materialsHeader') || 'Materials Supplied'}</th>
                  <th className="px-2 py-3 w-[15%] break-words">{t('leadTime') || 'Lead Time'}</th>
                  <th className="px-2 py-3 w-[18%] break-words">{t('performance') || 'Rating'}</th>
                  <th className="px-2 py-3 w-[20%] break-words">{t('dashboard.recentOrders.headers.status') || 'Status & Contact'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {suppliers.length > 0 ? (
                  suppliers.map((supplier, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-2 py-3 break-words">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground flex items-center gap-1 flex-wrap">
                            {supplier.name}
                            {supplier.preferred && <span title={t('procurement.preferredSupplier') || 'Preferred Supplier'}><Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" /></span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-[13px] text-muted-foreground break-words">{supplier.materials}</td>
                      <td className="px-2 py-3 text-[13px] text-muted-foreground break-words">{supplier.leadTime}</td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
                          <div className="w-full max-w-[40px] xl:max-w-[60px] bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${supplier.performance >= 95 ? 'bg-emerald-500' : supplier.performance >= 90 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${supplier.performance}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{supplier.performance}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2 text-sm">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-normal text-center ${supplier.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {supplier.status === 'Active' ? (t('dashboard.stockAlerts.severity.low') || 'Active') : (t('dashboard.stockAlerts.severity.low') || 'Under Review')}
                          </span>
                          <div className="flex gap-1.5 text-neutral-400 mt-1 xl:mt-0">
                            <button className="hover:text-blue-600 transition-colors" title={`Email ${supplier.contact}`}><Mail className="h-3.5 w-3.5" /></button>
                            <button className="hover:text-blue-600 transition-colors" title="Call Supplier"><Phone className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="h-8 w-8 text-neutral-300 mb-2" />
                        <p>No suppliers linked to selected materials.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workflow Progression */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-900/30 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/50 overflow-hidden flex flex-col">
          <div className="border-b border-indigo-100 dark:border-indigo-800/50 px-6 py-5 bg-white/50 dark:bg-card/50 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              {t('procurement.procCompletion') || 'Procurement Completion'}
            </h2>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1">{t('procurement.nextSteps') || 'Next steps after shortage resolution'}</p>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-indigo-200">
              <div className="relative flex items-center group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-card flex-shrink-0 z-10 border-indigo-600 text-indigo-600">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                </div>
                <div className="ml-4">
                  <span className="text-sm font-semibold text-foreground">{t('orderInitiation.tracker.procurement') || 'Procurement'}</span>
                  <p className="text-xs text-muted-foreground">{t('procurement.shortageItems') || 'Shortage resolution'}</p>
                </div>
              </div>
              <div className="relative flex items-center group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-card flex-shrink-0 z-10 border-indigo-400 text-indigo-400" />
                <div className="ml-4">
                  <span className="text-sm font-semibold text-muted-foreground">{t('orderInitiation.tracker.materialAllocation') || 'Material Allocation'}</span>
                  <p className="text-xs text-neutral-400">{t('Allocate Warehouse') || 'Allocate from warehouse'}</p>
                </div>
              </div>
              <div className="relative flex items-center group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-card flex-shrink-0 z-10 border-border text-transparent" />
                <div className="ml-4">
                  <span className="text-sm font-semibold text-neutral-400">{t('Freeze Materials') || 'Freeze Materials'}</span>
                  <p className="text-xs text-neutral-400">{t('Lock Stock') || 'Lock stock for PO'}</p>
                </div>
              </div>
              <div className="relative flex items-center group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-card flex-shrink-0 z-10 border-border text-transparent" />
                <div className="ml-4">
                  <span className="text-sm font-semibold text-neutral-400">{t('orderInitiation.tracker.production') || 'Production'}</span>
                  <p className="text-xs text-neutral-400">{t('Begin Manufacturing') || 'Begin manufacturing'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => advanceStage('/material-allocation', 'Material Allocation')}
              className="mt-8 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 group"
            >
              {t('procurement.continueAllocation')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/procurement/create')}
              className="mt-3 w-full px-4 py-3 bg-card border border-border text-neutral-700 dark:text-neutral-300 rounded-lg shadow-sm hover:bg-muted transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('procurement.createRequest')}
            </button>
          </div>
        </div>
      </div>

      {/* Archive Box */}
      {archivedRequests.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mt-8">
          <div className="border-b border-border px-6 py-5 bg-neutral-50/50 dark:bg-card/30">
            <h2 className="text-lg font-semibold text-card-foreground">Archive Box</h2>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-card/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  <th className="px-6 py-3">Material Name</th>
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Archived Date</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {archivedRequests.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-foreground">{item.material}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.linkedPO}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateDisplay(item.archivedDate)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500 italic">{item.archiveReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* GRN Upload Modal */}
      {showGrnModal && selectedGrnPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Upload Goods Receipt Note</h3>
              <button onClick={() => setShowGrnModal(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Purchase Order</p>
                <p className="text-sm text-muted-foreground">{selectedGrnPo.id} ({selectedGrnPo.supplier})</p>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-3">
                <FileUp className="h-8 w-8 text-neutral-400" />
                <p className="text-sm text-center text-muted-foreground">Drag and drop your GRN document here, or click to browse</p>
                <input type="file" className="hidden" id="grn-upload" />
                <label htmlFor="grn-upload" className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-sm font-medium rounded-md cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  Select File
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowGrnModal(false)}
                className="px-4 py-2 bg-transparent text-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCompletedPOs(prev => prev.map(po =>
                    po.id === selectedGrnPo.id ? { ...po, status: 'Received & Completed' } : po
                  ));
                  setShowGrnModal(false);
                  alert("GRN Uploaded Successfully!");
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Submit GRN
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
