"use client";


import React, { useState, useEffect } from 'react';
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
  Package,
  X,
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
import ProcurementStepper from '@/components/ProcurementStepper';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { updateOrderAndLog } from '@/lib/logger';
import { useOrders } from '@/contexts/order-context';
import { isStageMatch } from '@/utils/orderUtils';
import { formatIndianDate } from '@/utils/dateUtils';
import { generateProcurementPDF, generateOfficialPurchaseOrderPDF } from '@/utils/pdfGenerator';

const initialProcurementRequests: any[] = [];




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
  const [selectedHeaderSuppliers, setSelectedHeaderSuppliers] = useState<string[]>([]);

  // Aliases for legacy references to prevent ReferenceError crashes
  const supplierFilter = selectedHeaderSuppliers;
  const setSupplierFilter = setSelectedHeaderSuppliers;

  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<any>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<Record<string, string>>({});

  const [procurementRequests, setProcurementRequests] = useState<any[]>([]);
  const [poInput, setPoInput] = useState('');
  const [archivedRequests, setArchivedRequests] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Multi-Supplier Selection State
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number | string>>({});
  const [articleSplits, setArticleSplits] = useState<{ id: string, parentId: string }[]>([]);


  // Interactive Navigator State
  const [activeTab, setActiveTab] = useState<'pending' | 'in_process' | 'completed' | 'history'>('pending');
  const [workflowTab, setWorkflowTab] = useState('dashboard'); // 'dashboard' | 'review_po' | 'create_po'

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [activePOs, setActivePOs] = useState<any[]>([]);
  const [completedPOs, setCompletedPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const ENABLE_DEMO_DATA = true;

  React.useEffect(() => {
    async function fetchLiveProcurementData() {
      try {
        setLoading(true);

        if (ENABLE_DEMO_DATA) {
           const { MASTER_PROCUREMENT_POS } = await import('@/data/centralProcurementStore');
           const data = MASTER_PROCUREMENT_POS;
           setPurchaseOrders(data);
           setActivePOs(data.filter((po: any) => po.status === 'IN_TRANSIT' || po.status === 'ACTIVE' || po.status?.toLowerCase().includes('process') || po.status?.toLowerCase().includes('transit')));
           setCompletedPOs(data.filter((po: any) => po.status === 'COMPLETED' || po.status?.toLowerCase().includes('completed') || po.status === 'PAID' || po.status === 'UNPAID' || po.status === 'PARTIALLY PAID'));
           return;
        }

        const resOrders = await fetch('/api/procurement/orders');
        if (resOrders.ok) {
          const ordersData = await resOrders.json();
          if (ordersData.success && Array.isArray(ordersData.data)) {
            const data = ordersData.data;
            setPurchaseOrders(data);
            setActivePOs(data.filter((po: any) => po.status === 'IN_TRANSIT' || po.status === 'ACTIVE' || po.status?.toLowerCase().includes('process') || po.status?.toLowerCase().includes('transit')));
            setCompletedPOs(data.filter((po: any) => po.status === 'COMPLETED' || po.status?.toLowerCase().includes('completed')));
          }
        }
      } catch (error) {
        console.error('Failed to load live procurement data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProcurementData();
  }, []);

  // Aliases to preserve existing table rendering compatibility
  const activePOsList = activePOs;
  const activePOCount = activePOsList.length;
  const historyPOs = purchaseOrders;
  
  const [allocatedItems, setAllocatedItems] = useState<any[]>([]);
  const [editModeSupplier, setEditModeSupplier] = useState<string | null>(null);
  const [showAllocatedModal, setShowAllocatedModal] = useState(false);

  React.useEffect(() => {
    localStorage.removeItem('procurement_requests');
    localStorage.removeItem('purchase_orders');
    localStorage.removeItem('sharedPurchaseOrders');
    localStorage.removeItem('procurement_draft_pos');
    localStorage.removeItem('review_po_session');
    localStorage.removeItem('autoGeneratedProcurementRequests');
    // Clear stale browser cache keys holding the old mock arrays
    localStorage.removeItem('procurement_orders');
    localStorage.removeItem('store_procurement_orders');
    localStorage.removeItem('procurement_history');
  }, []);

  React.useEffect(() => {
    const loadAllocated = () => {
      const storedAllocated = localStorage.getItem('allocatedProcurementItems');
      if (storedAllocated) {
        try {
          setAllocatedItems(JSON.parse(storedAllocated));
        } catch (e) { }
      }
    };
    loadAllocated();
    window.addEventListener('storage', loadAllocated);
    return () => window.removeEventListener('storage', loadAllocated);
  }, []);

  const [showGrnModal, setShowGrnModal] = useState(false);
  const [selectedGrnPo, setSelectedGrnPo] = useState<any>(null);
  const [viewPoDetails, setViewPoDetails] = useState<any>(null);
  const [viewPoModalData, setViewPoModalData] = useState<any>(null);

  const getPaymentStatus = (poNumber: string, totalAmount: number, poData?: any) => {
    let paymentData: any = null;
    let localTxs: any[] = [];
    
    try {
      const txStr = localStorage.getItem('accounts_transactions');
      if (txStr) {
        const allTx = JSON.parse(txStr);
        if (allTx[poNumber]) {
          localTxs = allTx[poNumber];
        }
      }
    } catch(e) {}

    try {
      const accountsStore = localStorage.getItem('accountsStore');
      if (accountsStore) {
         const store = JSON.parse(accountsStore);
         paymentData = store.salesPOs?.find((p: any) => p.id === poNumber || p.poNumber === poNumber);
      } else {
         const salesPOsStr = localStorage.getItem('salesPOs');
         if (salesPOsStr) {
           const salesPOs = JSON.parse(salesPOsStr);
           paymentData = salesPOs?.find((p: any) => p.id === poNumber || p.poNumber === poNumber);
         }
      }
    } catch(e) {}
    
    // Combine explicit tx array or from paymentData
    const txs = localTxs.length > 0 ? localTxs : (poData?.transactions || paymentData?.transactions || []);
    const txCount = txs.length;

    if (paymentData || localTxs.length > 0) {
       const status = paymentData?.status || poData?.paymentStatus || 'UNPAID';
       const paid = (paymentData?.initialAdvance || poData?.advancePaid || 0) + txs.reduce((sum: any, tx: any) => sum + Number(tx.amount || 0), 0);
       const due = Math.max(0, totalAmount - paid);
       
       if (status === 'PAID' || due <= 0) return { status: 'PAID', paid, due: 0, txCount, transactions: txs };
       if (paid > 0) return { status: 'PARTIALLY PAID', paid, due, txCount, transactions: txs };
       return { status: 'UNPAID', paid: 0, due: totalAmount, txCount, transactions: txs };
    }

    if (poData && poData.paymentStatus) {
      const status = poData.paymentStatus === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : poData.paymentStatus;
      const paid = poData.advancePaid || 0;
      const due = poData.balanceDue || 0;
      return { status, paid, due, txCount, transactions: txs };
    }

    const poNumStr = String(poNumber);
    if (poNumStr.includes('1') || poNumStr.includes('8') || poNumStr.includes('3')) {
      return { status: 'PAID', paid: totalAmount, due: 0, txCount, transactions: txs };
    } else if (poNumStr.includes('9') || poNumStr.includes('0')) {
      return { status: 'UNPAID', paid: 0, due: totalAmount, txCount, transactions: txs };
    } else {
      return { status: 'PARTIALLY PAID', paid: totalAmount * 0.4, due: totalAmount * 0.6, txCount, transactions: txs };
    }
  };

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
  }, [orders]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const currentPO = params.get('poNumber');
      if (currentPO) {
        setPoInput(currentPO);
      }

      const editSupplier = params.get('supplier');
      try {
        const session = localStorage.getItem('review_po_session');
        if (session) {
          const parsedSession = JSON.parse(session);

          const newOrderQuantities: Record<string, number | string> = {};
          const newSelectedSuppliers: Record<string, string> = {};
          const newArticleSplits: { id: string, parentId: string }[] = [];
          const allSuppliers = new Set<string>();

          const seenParents = new Set<string>();

          parsedSession.forEach((group: any) => {
            allSuppliers.add(group.supplierName);

            // In edit mode: only restore row state (orderQty / selected supplier / splits)
            // for the supplier being edited. Other suppliers' allocations are already
            // accounted for by the stagedQtyMap deduction on item.required, so loading
            // them here too causes totalAllocated to double-count and the dropdown to
            // have no selectable options.
            const shouldRestoreRows = !editSupplier || group.supplierName === editSupplier;

            if (shouldRestoreRows && group.items) {
              group.items.forEach((item: any) => {
                let targetId = item.id;

                if (seenParents.has(item.id)) {
                  targetId = `${item.id}-split-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                  newArticleSplits.push({ id: targetId, parentId: item.id });
                } else {
                  seenParents.add(item.id);
                }

                newOrderQuantities[targetId] = item.orderQty;
                newSelectedSuppliers[targetId] = group.supplierName;
              });
            }
          });

          if (allSuppliers.size > 0) {
            // In edit mode: only filter to the edit supplier so the dropdown
            // shows just that vendor. Other suppliers' quantities are already
            // reflected via stagedQtyMap on item.required.
            setSupplierFilter(editSupplier ? [editSupplier] : Array.from(allSuppliers));
          }
          setOrderQuantities(prev => ({ ...prev, ...newOrderQuantities }));
          setSelectedSuppliers(prev => ({ ...prev, ...newSelectedSuppliers }));
          setArticleSplits(prev => [...prev, ...newArticleSplits]);
        }
      } catch (e) { }

      if (editSupplier) {
        setEditModeSupplier(editSupplier);
      }
    }
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        console.log("Fetching suppliers from API...");
        const res = await fetch('/api/suppliers');

        if (!res.ok) {
          console.error(`Failed to fetch suppliers: ${res.status}`);
          setSuppliersList([]);
          setSuppliers([]);
          return;
        }

        const data = await res.json();
        console.log("RAW SUPPLIERS DATA FROM BACKEND:", data);

        let rawArray: any[] = [];
        // Safely extract array regardless of top-level key format
        if (Array.isArray(data)) {
          rawArray = data;
        } else if (data && Array.isArray(data.suppliers)) {
          rawArray = data.suppliers;
        } else if (data && Array.isArray(data.data)) {
          rawArray = data.data;
        } else {
          console.error("Unrecognized data format:", data);
          setSuppliersList([]);
          setSuppliers([]);
          return;
        }

        // Map to ensure 'name' exists for the lower table and other components
        const mappedData = rawArray.map((s: any) => ({
          ...s,
          name: s.name || s.companyName || s.supplier_name || s.company_name || 'Unnamed Supplier'
        }));

        setSuppliersList(mappedData);
        setSuppliers(mappedData);
      } catch (err) {
        console.error("Failed to connect to supplier endpoint:", err);
        setSuppliersList([]);
        setSuppliers([]);
      }
    };

    fetchSuppliers();
  }, []);
  const fetchStoreArticleShortages = async () => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
      const targetUrl = `${BACKEND_URL}/api/store-articles/shortages`;

      const res = await fetch(targetUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'sasons_read_only_key_2026_abc'
        }
      });

      if (!res.ok) {
        console.error(`Store materials fetch failed with status: ${res.status}`);
        return [];
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Store materials endpoint returned non-JSON response from ${targetUrl}`);
        return [];
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse store materials JSON. Raw HTML Snippet:", text.substring(0, 150));
        return [];
      }

      if (data && Array.isArray(data.data)) {
        if (data.suppliers) {
          setSuppliersList(data.suppliers);
        }
        const activeData = data.data;
        return activeData
          .filter((item: any) => {
            const itemName = String(item.item_name || item.name || '').toLowerCase();
            const hsn = item.sku_code || item.hsn_code || '';
            if (itemName.includes('metal button') || hsn === '960621') {
              return false;
            }
            return true;
          })
          .map((item: any, index: number) => {
            const materialStr = item.sku_code ? `${item.item_name} (HSN/SKU: ${item.sku_code})` : item.item_name;
            const uniqueKey = item.unique_key || `PR-${item.item_type || 'ITEM'}-${item.id || index}`;

            return {
              id: uniqueKey,
              unique_key: uniqueKey,
              pr_id: item.source_id,
              storeId: item.source_id,
              itemType: item.item_type,
              item_type: item.item_type,
              material: materialStr,
              category: item.category || 'General',
              description: item.item_description || '',
              required: Number(item.min_required ?? 0),
              available: Number(item.available_qty ?? 0),
              shortage: Number(item.deficit_qty ?? 0),
              unit: item.unit || 'units',
              supplier: item.supplier_name || 'Store Restock',
              allSuppliers: item.supplier_name ? [item.supplier_name] : ['Store Restock'],
              cost: Number(item.deficit_qty ?? 0) * (Number(item.unit_price) || 0),
              priority: Number(item.available_qty) === 0 ? 'Critical' : 'High',
              status: item.stock_status || 'Pending Procurement',
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
      let related = loadedRequests.filter(p => p.linkedPO === selectedPoNumber);

      // Deduct already-staged quantities; only hide fully-allocated items
      try {
        const session = localStorage.getItem('review_po_session');
        if (session) {
          const parsedSession = JSON.parse(session);
          // Build a map of itemId -> total staged orderQty (across all suppliers)
          const stagedQtyMap = new Map<string, number>();
          parsedSession.forEach((group: any) => {
            if (group.supplierName !== editModeSupplier) {
              group.items.forEach((item: any) => {
                const originalId = (item.id || '').split('-split-')[0];
                stagedQtyMap.set(originalId, (stagedQtyMap.get(originalId) || 0) + (Number(item.orderQty) || 0));
              });
            }
          });
          related = related
            .map(req => {
              const staged = stagedQtyMap.get(req.id) || 0;
              if (staged <= 0) return req;
              const newRequired = Math.max(0, req.required - staged);
              return { ...req, required: newRequired, shortage: Math.max(0, newRequired - (req.available || 0)) };
            })
            .filter(req => req.required > 0); // hide only fully allocated
        }
      } catch (e) { }

      setProcurementRequests(related);

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
      fetchStoreArticleShortages().then(async (storeShortages) => {
        let localRequests: any[] = [];
        try {
          const res = await fetch('/api/procurement-requests?status=PENDING');
          if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
              localRequests = result.data;
            }
          }
        } catch (e) {
          console.error("Failed to fetch API procurement requests", e);
        }

        const merged = [...storeShortages];
        localRequests.forEach(req => {
          if (!merged.find(m => m.id === req.id)) {
            merged.push({
              id: req.id,
              material: req.name + (req.sku ? ` (HSN: ${req.sku})` : ''),
              category: req.category || 'General',
              required: req.shortageQty || req.minRequired || 0,
              available: req.currentStock || 0,
              shortage: req.shortageQty || 0,
              unit: 'units',
              supplier: 'Store Restock',
              cost: 0,
              priority: 'High',
              status: req.status || 'Pending Procurement',
              linkedPO: null
            });
          }
        });

        let finalMerged = merged;
        // Deduct already-staged quantities; only hide fully-allocated items
        try {
          const session = localStorage.getItem('review_po_session');
          if (session) {
            const parsedSession = JSON.parse(session);
            // Build a map of itemId -> total staged orderQty (across all suppliers)
            const stagedQtyMap = new Map<string, number>();
            parsedSession.forEach((group: any) => {
              if (group.supplierName !== editModeSupplier) {
                group.items.forEach((item: any) => {
                  const originalId = (item.id || '').split('-split-')[0];
                  stagedQtyMap.set(originalId, (stagedQtyMap.get(originalId) || 0) + (Number(item.orderQty) || 0));
                });
              }
            });
            finalMerged = merged
              .map(req => {
                const staged = stagedQtyMap.get(req.id) || 0;
                if (staged <= 0) return req;
                const newShortage = Math.max(0, (req.shortage ?? req.required) - staged);
                return { ...req, shortage: newShortage, status: newShortage === 0 ? 'COMPLETED' : req.status };
              })
              .filter(req => (req.shortage ?? req.required) > 0 && req.status !== 'COMPLETED'); // hide only fully allocated
          }
        } catch (e) { }

        const strictlyFiltered = finalMerged.filter(req => (req.shortage ?? req.required) > 0 && String(req.status).toUpperCase() !== 'FULFILLED');

        setOrderQuantities(prev => {
          const updated = { ...prev };
          strictlyFiltered.forEach(item => {
            if (updated[item.id] === undefined) {
              updated[item.id] = 0;
            }
          });
          return updated;
        });
        setProcurementRequests(strictlyFiltered);
      });
    } else {
      // CALL REGULAR PO FUNCTION
      fetchPOShortages(poInput);
    }
  }, [poInput, editModeSupplier]);
  const activeRequests = React.useMemo(() => {
    return procurementRequests.filter(item => {
      const isMetalButtons = String(item.material).toLowerCase().includes('metal button') || String(item.material).includes('960621');
      if (isMetalButtons) return false;

      const remaining = item.shortage ?? item.required ?? item.deficit ?? 0;
      const isFulfilled = String(item.status).toUpperCase() === 'FULFILLED' || String(item.status).toUpperCase() === 'COMPLETED' || item.isFulfilled === true;
      return remaining > 0 && !isFulfilled;
    });
  }, [procurementRequests]);

  const totalShortages = activeRequests.length;
  const criticalItems = procurementRequests.filter(i => i.available === 0).length;
  const estimatedCost = procurementRequests.reduce((acc, curr) => acc + curr.cost, 0);

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
    activeRequests.forEach(item => {
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
  }, [activeRequests]);

  const filteredShortages = React.useMemo(() => {
    return Array.from(deduplicatedShortages.values()).filter(item => {
      const isMetalButtons = String(item.material).toLowerCase().includes('metal button') || String(item.material).includes('960621');
      if (isMetalButtons) return false;

      const matchesSearch = item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [deduplicatedShortages, searchTerm, statusFilter, priorityFilter]);

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

  // Helper: build the current draft session groups from selections
  const buildDraftSessionGroups = React.useCallback(() => {
    const selectedItems = displayRows.filter(item => {
      const supplierName = selectedSuppliers[item.rowId] || (item.supplier !== 'Store Restock' && item.supplier !== 'Pending Assignment' ? item.supplier : null);
      const qty = Number(orderQuantities[item.rowId]) || 0;
      return supplierName && qty > 0;
    });

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
      const existingItem = supplierItems.find(i => i.id === item.id);
      if (existingItem) {
        existingItem.orderQty += qty;
        existingItem.orderCost += cost;
      } else {
        supplierItems.push({ ...item, orderQty: qty, orderCost: cost });
      }
    });

    return Array.from(groupedBySupplier.entries()).map(([supplierName, items]) => {
      const supplierObj = suppliersList.find(s => s.name === supplierName) || null;
      return {
        supplierName,
        supplierObj,
        items
      };
    });
  }, [displayRows, orderQuantities, selectedSuppliers, suppliersList]);

  const downloadPurchaseOrderPdf = (po: any) => {
    const rawMaterials = po.rawMaterials || [];
    const finishedGoods = po.finishedGoods || [];
    
    const materials = [
      ...rawMaterials.map((m: any) => ({
        name: m.material || m.name || 'Raw Material',
        qty: m.quantity || 0,
        unitCost: m.unitPrice || 0,
        unit: m.unit || 'Units'
      })),
      ...finishedGoods.map((g: any) => ({
        name: g.name || 'Finished Good',
        qty: g.totalQty || g.quantity || 0,
        unitCost: g.unitPrice || 0,
        unit: 'Pcs'
      }))
    ];
    
    if (materials.length === 0 && po.items) {
      materials.push({
        name: po.item_name || 'Procurement Order Items Batch',
        qty: po.total_items || po.items || 1,
        unitCost: (po.totalAmount || po.total || 0) / (po.total_items || po.items || 1),
        unit: 'Batch'
      });
    }
    
    const subtotal = materials.reduce((sum, m) => sum + (m.qty * m.unitCost), 0) || po.totalAmount || po.total || 0;
    
    const mappedPo = {
      poNumber: po.po_number || po.id,
      poDate: po.created_at || po.order_date || po.date,
      deliveryDate: po.est_delivery || po.expectedDelivery || po.deliveryDate || po.deliveredOn,
      supplier: po.supplier_name || po.supplier,
      supplierAddress: po.supplier_address || po.supplierAddress || '',
      materials,
      subtotal,
      paymentTerms: po.paymentTerms || po.payment_terms || 'NET 30',
      transportMode: po.shipping_method || po.transportMode || 'By Road',
      branch: po.branch || 'Main Warehouse',
      invoiceTo: 'SASONS WORKS WEAR PRIVATE LIMITED\n1st Floor, Nana Chamber,\nAbove Bank of Maharashtra,\nKasarwadi, Pune - 34.\nGSTIN: 27AABCS1234F1Z5\nState: Maharashtra',
      consignee: 'SASONS WORKS WEAR PRIVATE LIMITED\nFactory: 1st Floor, Nana Chamber,\nKasarwadi, Pune - 34.\nGSTIN: 27AABCS1234F1Z5\nState: Maharashtra'
    };
  
    const doc = generateOfficialPurchaseOrderPDF(mappedPo);
    doc.save(`Purchase_Order_${mappedPo.poNumber}.pdf`);
  };

  console.log("Suppliers array in component:", suppliers);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8 relative">
      {viewPoModalData && (() => {
        const rawMaterials = viewPoModalData.rawMaterials || [];
        const finishedGoods = viewPoModalData.finishedGoods || [];
        const rawMaterialsTotal = rawMaterials.reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
        const finishedGoodsTotal = finishedGoods.reduce((acc: number, item: any) => acc + ((item.totalQty || item.quantity || 0) * (item.unitPrice || 0)), 0);
        const calculatedSubtotal = rawMaterialsTotal + finishedGoodsTotal;
        const calculatedTax = Math.round(calculatedSubtotal * 0.12);
        const fallbackTotal = Number(viewPoModalData.total_price) || Number(viewPoModalData.total_amount) || 109200;
        const calculatedGrandTotal = calculatedSubtotal > 0 ? calculatedSubtotal + calculatedTax : fallbackTotal;

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card w-full max-w-4xl rounded-xl shadow-xl overflow-hidden flex flex-col my-auto border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-neutral-50/50 dark:bg-card/30">
              <div>
                <h3 className="text-lg font-bold text-foreground">Purchase Order Summary</h3>
                <p className="text-sm text-muted-foreground">{viewPoModalData.po_number || viewPoModalData.id} • {viewPoModalData.supplier_name || viewPoModalData.supplier}</p>
              </div>
              <button onClick={() => setViewPoModalData(null)} className="text-neutral-400 hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PO Number</p>
                  <p className="text-sm font-semibold">{viewPoModalData.po_number || viewPoModalData.id}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-semibold text-emerald-600">{viewPoModalData.status || 'Active'}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm font-semibold">{viewPoModalData.created_at ? formatIndianDate(viewPoModalData.created_at) : viewPoModalData.order_date || viewPoModalData.date || 'N/A'}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expected Delivery</p>
                  <p className="text-sm font-semibold">{viewPoModalData.est_delivery || viewPoModalData.expectedDelivery || viewPoModalData.deliveredOn || 'N/A'}</p>
                </div>
              </div>

              {/* Vendor Card */}
              <div className="p-4 border border-border rounded-lg bg-neutral-50/30 dark:bg-card/30">
                <h4 className="text-sm font-bold mb-3 uppercase text-muted-foreground">Vendor Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{viewPoModalData.supplier_name || viewPoModalData.supplier}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="w-3 h-3"/> +91 9876543210</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Mail className="w-3 h-3"/> vendor@example.com</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Billing / Shipping Address:</p>
                    <p className="text-xs text-muted-foreground">123 Industrial Area, Phase 1</p>
                    <p className="text-xs text-muted-foreground">Mumbai, Maharashtra 400001, India</p>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <h4 className="text-sm font-bold mb-3 uppercase text-muted-foreground">Items Breakdown</h4>
                
                {/* Articles */}
                {rawMaterials.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-xs font-semibold mb-2 text-indigo-400">Articles / Raw Materials</h5>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="px-4 py-2 font-medium">Article Name</th>
                            <th className="px-4 py-2 font-medium">Material Type</th>
                            <th className="px-4 py-2 font-medium">Color</th>
                            <th className="px-4 py-2 font-medium text-right">Quantity</th>
                            <th className="px-4 py-2 font-medium text-right">Unit Price (₹)</th>
                            <th className="px-4 py-2 font-medium text-right">Total Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {rawMaterials.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-2">{item.name || "Material"}</td>
                              <td className="px-4 py-2">{item.type || "Fabric"}</td>
                              <td className="px-4 py-2">{item.color || "-"}</td>
                              <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                              <td className="px-4 py-2 text-right">₹{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2 text-right">₹{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Finished Goods */}
                {finishedGoods.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold mb-2 text-purple-400">Finished Goods</h5>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="px-4 py-2 font-medium">Style Name</th>
                            <th className="px-4 py-2 font-medium">Size Breakdown</th>
                            <th className="px-4 py-2 font-medium">Color</th>
                            <th className="px-4 py-2 font-medium text-right">Total Qty</th>
                            <th className="px-4 py-2 font-medium text-right">Single Unit Price (₹)</th>
                            <th className="px-4 py-2 font-medium text-right">Line Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {finishedGoods.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-2">{item.name || "Garment"}</td>
                              <td className="px-4 py-2 text-xs text-muted-foreground">{item.sizes || "-"}</td>
                              <td className="px-4 py-2">{item.color || "-"}</td>
                              <td className="px-4 py-2 text-right">{item.totalQty || item.quantity} Pcs</td>
                              <td className="px-4 py-2 text-right">₹{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2 text-right">₹{((item.totalQty || item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Payment Transactions Breakdown */}
            <div className="px-6 pb-4 border-t border-border mt-6 pt-4">
              {(() => {
                const total = Number(viewPoModalData.grandTotal) || Number(viewPoModalData.total_price) || viewPoModalData.total_amount || 59000;
                const paymentInfo = getPaymentStatus(viewPoModalData.po_number || viewPoModalData.id, total, viewPoModalData);
                const txns = paymentInfo.transactions || [];
                return (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-indigo-400">Payment & Installment Transactions ({txns.length} {txns.length === 1 ? 'Transaction' : 'Transactions'})</h4>
                    {txns.length > 0 ? (
                      <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="px-4 py-2 font-medium">Transaction ID</th>
                              <th className="px-4 py-2 font-medium">Date & Time</th>
                              <th className="px-4 py-2 font-medium">Payment Mode</th>
                              <th className="px-4 py-2 font-medium text-right">Amount Paid</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {txns.map((tx: any, idx: number) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                <td className="px-4 py-2 font-mono text-xs">{tx.txId}</td>
                                <td className="px-4 py-2 text-muted-foreground">{tx.date}</td>
                                <td className="px-4 py-2">{tx.mode}</td>
                                <td className="px-4 py-2 text-right font-semibold text-emerald-500">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">No payment transactions recorded yet.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-neutral-50/50 dark:bg-card/30">
              <div className="flex flex-col items-end gap-1 mb-4">
                <div className="flex justify-between w-64 text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">₹{calculatedSubtotal > 0 ? calculatedSubtotal.toLocaleString('en-IN') : '97,500'}</span>
                </div>
                <div className="flex justify-between w-64 text-sm">
                  <span className="text-muted-foreground">GST/Tax (12%):</span>
                  <span className="font-semibold">₹{calculatedSubtotal > 0 ? calculatedTax.toLocaleString('en-IN') : '11,700'}</span>
                </div>
                <div className="flex justify-between w-64 text-base mt-2 pt-2 border-t border-border">
                  <span className="font-bold">Grand Total Amount:</span>
                  <span className="font-bold text-indigo-500">₹{calculatedGrandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setViewPoModalData(null)} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
      {/* Edit Mode Banner */}
      {editModeSupplier && (
        <div className="bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-full dark:bg-indigo-900/40">
              <Package className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                Editing Purchase Order for {editModeSupplier}
              </h3>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">
                Save or Update Allocation when done.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditModeSupplier(null);
              setSelectedHeaderSuppliers([]);
              window.history.replaceState({}, '', '/procurement');
            }}
            className="text-xs font-medium bg-white dark:bg-card px-3 py-1.5 rounded shadow-sm border border-indigo-100 dark:border-indigo-800 text-indigo-600 hover:bg-neutral-50 transition-colors"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* 1. TOP HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            🚚 Procurement
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Resolve material shortages identified during inventory check
          </p>
        </div>

        {/* RETAINED TOP BUTTONS ONLY */}
        <div className="flex items-center gap-3">
          {/* Existing View Purchase Orders Button */}
          <button
            onClick={() => router.push('/procurement/review-po')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1C1635] text-purple-300 border border-purple-800/40 hover:bg-purple-900/40 transition-all shadow-sm"
          >
            <span>📋</span> View Purchase Orders
          </button>

          {/* RESTORED: Supplier Info Button */}
          <button
            onClick={() => router.push('/procurement/suppliers')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#12233B] text-blue-300 border border-blue-800/40 hover:bg-blue-900/40 transition-all shadow-sm"
          >
            <span>🏢</span> Supplier Info
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
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Procurement Requests</p>
            <p className="text-2xl font-bold text-foreground">{procurementRequests.filter(i => String(i.status).toUpperCase() === 'PENDING').length}</p>
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
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Active PO's</p>
            <p className="text-2xl font-bold text-foreground">{activePOCount}</p>
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
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Completed PO's</p>
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

      {/* 2. SHARED 3-TAB NAVIGATION HEADER */}
      {activeTab === 'pending' && (
        <div className="flex gap-3 bg-[#131B2E] p-2 rounded-2xl border border-gray-800 w-fit mb-6 mt-6">
          <button
            onClick={() => router.push('/procurement')}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20"
          >
            📱 Procurement Requests <span className="bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full text-[10px]">{procurementRequests.filter(i => String(i.status).toUpperCase() === 'PENDING').length} Pending</span>
          </button>

          <button
            onClick={() => router.push('/procurement/review-po')}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all bg-[#0D1322] text-gray-400 hover:text-white border border-gray-800"
          >
            📋 Review PO <span className="bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full text-[10px]">0 Pending</span>
          </button>

          <button
            onClick={() => router.push('/procurement/create-po')}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all bg-[#0D1322] text-gray-400 hover:text-white border border-gray-800"
          >
            + Create PO <span className="bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full text-[10px]">0 Pending</span>
          </button>
        </div>
      )}

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
                      {selectedHeaderSuppliers.length === 0
                        ? 'Select Suppliers'
                        : selectedHeaderSuppliers.length === 1
                          ? selectedHeaderSuppliers[0]
                          : `${selectedHeaderSuppliers.length} Suppliers Selected`}
                    </span>
                    <ChevronRight className={`h-4 w-4 text-neutral-400 transition-transform ${isSupplierDropdownOpen ? 'rotate-90' : ''}`} />
                  </div>

                  {isSupplierDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#0f172a] border border-slate-700 rounded-lg shadow-2xl z-50 p-2 flex flex-col gap-2">

                      {/* Search Input */}
                      <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />

                      {/* Explicit Scrollable Supplier List */}
                      <div className="max-h-48 overflow-y-auto flex flex-col gap-1 pr-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHeaderSuppliers([]);
                            setIsSupplierDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded transition-colors"
                        >
                          Clear Selection
                        </button>

                        {suppliersList && suppliersList.length > 0 ? (
                          suppliersList
                            .filter((s) => {
                              const sName = s.name || s.supplier_name || s.company_name || '';
                              return sName.toLowerCase().includes((supplierSearchTerm || '').toLowerCase());
                            })
                            .map((sup) => {
                              const displayName = sup.name || sup.supplier_name || sup.company_name || 'Unnamed';
                              const isSelected = selectedHeaderSuppliers.includes(displayName);
                              return (
                                <div
                                  key={sup.id || displayName}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedHeaderSuppliers(prev =>
                                      prev.includes(displayName)
                                        ? prev.filter(name => name !== displayName)
                                        : [...prev, displayName]
                                    );
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 pointer-events-none"
                                  />
                                  <span>{displayName}</span>
                                </div>
                              );
                            })
                        ) : (
                          <div className="px-3 py-2 text-xs text-slate-400 italic">
                            {suppliersList ? 'No suppliers match search' : 'Loading suppliers...'}
                          </div>
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
                  <th className="px-4 py-3 text-left w-[24%]">Item Details</th>
                  <th className="px-4 py-3 text-center w-[14%]">Stock Status</th>
                  <th className="px-4 py-3 text-center w-[14%]">Deficit (Req Qty)</th>
                  <th className="px-4 py-3 text-center w-[24%]">Supplier</th>
                  <th className="px-4 py-3 text-center w-[14%]">Order Qty</th>
                  <th className="px-4 py-3 text-center w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {filteredShortages.length > 0 ? (
                  filteredShortages.map((item, index) => {
                    const uniqueKey = `PR-${item.item_type || item.itemType || 'ITEM'}-${item.id || item.sku_code || 'no-id'}-${index}`;
                    const splits = articleSplits.filter(s => s.parentId === item.id);
                    const totalRows = splits.length > 0 ? splits.length + 2 : 1;

                    const allRowIds = [item.id, ...splits.map(s => s.id)];

                    const getAvailableSuppliers = (currentRowId: string) => {
                      const selectedSupplierNames = allRowIds
                        .filter(id => id !== currentRowId)
                        .map(id => {
                          const val = selectedSuppliers[id];
                          if (val !== undefined) return val;
                          if (id === item.id) return (item.supplier === 'Store Restock' || item.supplier === 'Pending Assignment') ? '' : item.supplier;
                          return '';
                        })
                        .filter(Boolean);

                      return suppliersList.filter(
                        v => selectedHeaderSuppliers.includes(v.name) && !selectedSupplierNames.includes(v.name)
                      );
                    };

                    const isMaxSplitsReached = selectedHeaderSuppliers.length > 0 && getAvailableSuppliers('new-split-check').length === 0;

                    const totalAllocated = allRowIds.reduce((sum, id) => sum + (Number(orderQuantities[id]) || 0), 0);
                    const dynamicShortage = Math.max(0, (item.shortage ?? item.required) - totalAllocated);

                    return (
                      <React.Fragment key={uniqueKey}>
                        <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ease-in-out ${editModeSupplier && Object.values(selectedSuppliers).includes(editModeSupplier) ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}>
                          <td className="px-4 py-3 align-top border-r border-border/50" rowSpan={totalRows}>
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${dynamicShortage > 0 ? 'bg-red-50 text-red-700 px-2 py-1 rounded-lg inline-block font-semibold border border-red-100' : 'text-foreground'}`}>{item.material}</span>
                              <span className="text-xs text-muted-foreground mt-1">
                                {item.itemType === 'FINISHED_GOODS' ? (
                                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 mr-2 uppercase tracking-wider">
                                    FINISHED GOODS
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mr-2 uppercase tracking-wider">
                                    ARTICLE
                                  </span>
                                )}
                                {item.category} • {item.description || 'General'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center align-top border-r border-border/50" rowSpan={totalRows}>
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="text-sm font-semibold">{item.available} {item.unit}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">Available</div>
                              <div className="w-8 border-b border-border my-1"></div>
                              <div className="text-sm font-medium">{item.required} {item.unit}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">Min Required</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center align-top">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className={`text-sm font-bold ${totalAllocated > 0 ? (dynamicShortage === 0 ? 'text-emerald-600' : 'text-amber-600') : 'text-red-600'}`}>
                                {dynamicShortage}
                              </span>
                              {totalAllocated > 0 && dynamicShortage < item.shortage && (
                                <span className="text-xs text-muted-foreground line-through">{item.shortage}</span>
                              )}
                              <span className="text-xs text-muted-foreground">{item.unit === 'meters' ? (t('dashboard.stockAlerts.footer.metersRemaining') || 'meters') : item.unit === 'spools' ? (t('dashboard.stockAlerts.footer.spoolsRemaining') || 'spools') : (t('dashboard.stockAlerts.footer.unitsRemaining') || 'units')}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <select
                              className="block w-full py-1.5 pl-3 pr-8 border border-border rounded-lg sm:text-sm text-foreground appearance-none bg-card cursor-pointer"
                              value={selectedSuppliers[item.id] || (item.supplier === 'Store Restock' || item.supplier === 'Pending Assignment' ? '' : item.supplier)}
                              onChange={(e) => setSelectedSuppliers(prev => ({ ...prev, [item.id]: e.target.value }))}
                            >
                              {selectedHeaderSuppliers.length === 0 ? (
                                <option value="" disabled>Select Suppliers above first</option>
                              ) : (
                                <>
                                  <option value="" disabled>Select Supplier</option>
                                  {/* Always render the currently-selected option even if not in suppliersList */}
                                  {selectedSuppliers[item.id] && !getAvailableSuppliers(item.id).find(s => s.name === selectedSuppliers[item.id]) && (
                                    <option value={selectedSuppliers[item.id]}>{selectedSuppliers[item.id]}</option>
                                  )}
                                  {getAvailableSuppliers(item.id).map((supplier) => (
                                    <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                                  ))}
                                  {getAvailableSuppliers(item.id).length === 0 && !selectedSuppliers[item.id] && (
                                    <option value="" disabled>All selected suppliers allocated</option>
                                  )}
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
                              {totalAllocated > 0 && (
                                <span className={`text-xs font-bold ${totalAllocated > item.required
                                  ? 'text-red-600'
                                  : dynamicShortage === 0
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                                  }`}>
                                  {totalAllocated > item.required
                                    ? `Over by ${totalAllocated - item.required}`
                                    : dynamicShortage === 0
                                      ? 'Fulfilled ✓'
                                      : `Remaining: ${dynamicShortage}`}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center align-top">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  if (isMaxSplitsReached) return;
                                  const newId = `${item.id}-split-${Date.now()}`;
                                  setArticleSplits(prev => [...prev, { id: newId, parentId: item.id }]);
                                  setOrderQuantities(prev => ({ ...prev, [newId]: 0 }));
                                }}
                                disabled={isMaxSplitsReached}
                                className={`p-1.5 rounded-md transition-colors ${isMaxSplitsReached ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                title={isMaxSplitsReached ? "All selected suppliers allocated" : "Split Allocation"}
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
                                {selectedHeaderSuppliers.length === 0 ? (
                                  <option value="" disabled>Select Suppliers above first</option>
                                ) : (
                                  <>
                                    <option value="" disabled>Select Supplier</option>
                                    {/* Always render the currently-selected option even if not in suppliersList */}
                                    {selectedSuppliers[split.id] && !getAvailableSuppliers(split.id).find(s => s.name === selectedSuppliers[split.id]) && (
                                      <option value={selectedSuppliers[split.id]}>{selectedSuppliers[split.id]}</option>
                                    )}
                                    {getAvailableSuppliers(split.id).map((supplier) => (
                                      <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                                    ))}
                                    {getAvailableSuppliers(split.id).length === 0 && !selectedSuppliers[split.id] && (
                                      <option value="" disabled>All selected suppliers allocated</option>
                                    )}
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
                            <td className="px-4 py-2 border-t border-border"></td>
                            <td className="px-4 py-2 text-right text-xs uppercase text-indigo-600/80 dark:text-indigo-400 border-t border-border">Total Combined Qty:</td>
                            <td className="px-4 py-2 text-center font-bold text-indigo-700 dark:text-indigo-300 border-t border-border">
                              {(Number(orderQuantities[item.id]) || 0) +
                                splits.reduce((sum, s) => sum + (Number(orderQuantities[s.id]) || 0), 0)}
                            </td>
                            <td colSpan={1} className="px-4 py-2 border-t border-border"></td>
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
                              ? 'No active material shortages found in Store.'
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
                {t('inventoryVal.showing') || 'Showing'} <span className="font-medium text-foreground">1</span> {t('inventoryVal.to') || 'to'} <span className="font-medium text-foreground">{filteredShortages.length}</span> {t('inventoryVal.of') || 'of'} <span className="font-medium text-foreground">{totalShortages}</span>
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

                  // --- Deduct quantities from local state so the table updates live ---
                  const updatedMockShortages = procurementRequests.map(req => {
                    const ordered = selectedItems.filter(i => {
                      if (i.originalIds) return i.originalIds.includes(req.id);
                      return i.id === req.id || i.id.startsWith(`${req.id}-split-`);
                    });
                    if (ordered.length > 0) {
                      const totalOrderedQty = ordered.reduce((sum, item) => sum + (Number(orderQuantities[item.rowId]) || 0), 0);
                      const currentAmount = req.shortage ?? req.required;
                      const newAmount = Math.max(0, currentAmount - totalOrderedQty);
                      return {
                        ...req,
                        shortage: newAmount,
                        status: newAmount === 0 ? 'COMPLETED' : 'IN_PROCESS'
                      };
                    }
                    return req;
                  });
                  // Filter out fully fulfilled items from the pending table
                  setProcurementRequests(updatedMockShortages.filter(r => r.status !== 'COMPLETED'));

                  // --- Persist deductions to localStorage (autoGeneratedProcurementRequests) ---
                  try {
                    const autoGenStr = localStorage.getItem('autoGeneratedProcurementRequests');
                    if (autoGenStr) {
                      const autoGen = JSON.parse(autoGenStr);
                      const updated = autoGen.map((req: any) => {
                        const ordered = selectedItems.filter(i => {
                          if (i.originalIds) return i.originalIds.includes(req.id);
                          return i.id === req.id || i.id.startsWith(`${req.id}-split-`);
                        });
                        if (ordered.length > 0) {
                          const totalOrderedQty = ordered.reduce((sum, item) => sum + (Number(orderQuantities[item.rowId]) || 0), 0);
                          const currentAmount = req.shortage ?? req.required;
                          const newAmount = Math.max(0, currentAmount - totalOrderedQty);
                          return {
                            ...req,
                            shortage: newAmount,
                            status: newAmount === 0 ? 'COMPLETED' : 'IN_PROCESS'
                          };
                        }
                        return req;
                      });
                      localStorage.setItem('autoGeneratedProcurementRequests', JSON.stringify(updated));
                    }
                  } catch (e) {
                    console.error("Failed to update autoGeneratedProcurementRequests", e);
                  }

                  // --- Persist deductions to localStorage (procurement_requests) ---
                  try {
                    const procReqStr = localStorage.getItem('procurement_requests');
                    if (procReqStr) {
                      const procReq = JSON.parse(procReqStr);
                      const updated = procReq.map((req: any) => {
                        const reqIdStr = `PR-STORE-${req.itemId}`;
                        const ordered = selectedItems.filter(i => {
                          if (i.originalIds) return i.originalIds.includes(req.id) || i.originalIds.includes(reqIdStr);
                          return i.id === req.id || i.id === reqIdStr || i.id.startsWith(`${req.id}-split-`) || i.id.startsWith(`${reqIdStr}-split-`);
                        });
                        if (ordered.length > 0) {
                          const totalOrderedQty = ordered.reduce((sum, item) => sum + (Number(orderQuantities[item.rowId]) || 0), 0);
                          const currentAmount = req.shortageQty ?? req.requiredQty ?? req.required;
                          const newAmount = Math.max(0, currentAmount - totalOrderedQty);
                          return {
                            ...req,
                            shortageQty: newAmount,
                            status: newAmount === 0 ? 'COMPLETED' : 'IN_PROCESS'
                          };
                        }
                        return req;
                      });
                      localStorage.setItem('procurement_requests', JSON.stringify(updated));
                    }
                  } catch (e) {
                    console.error("Failed to update procurement_requests", e);
                  }

                  // --- Build & PERSIST draft PO session to localStorage NOW (only on explicit click) ---
                  const newGroups = buildDraftSessionGroups();
                  let existingSession: any[] = [];
                  try {
                    const session = localStorage.getItem('review_po_session');
                    if (session) existingSession = JSON.parse(session);
                  } catch (e) { }
                  // Only overwrite suppliers currently being allocated
                  const suppliersBeingManaged = new Set(supplierFilter);
                  existingSession = existingSession.filter((g: any) => !suppliersBeingManaged.has(g.supplierName));
                  newGroups.forEach(newGroup => existingSession.push(newGroup));
                  localStorage.setItem('review_po_session', JSON.stringify(existingSession));
                  window.dispatchEvent(new Event('storage'));

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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                      Loading live orders...
                    </td>
                  </tr>
                ) : activePOsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                      No active purchase orders found.
                    </td>
                  </tr>
                ) : (
                  activePOsList.map((po) => (
                    <tr key={po.po_number || po.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{po.po_number || po.id}</td>
                      <td className="px-6 py-4">{po.supplier_name || po.supplier}</td>
                      <td className="px-6 py-4">{po.orderDate || (po.created_at ? formatIndianDate(po.created_at) : po.order_date || po.date)}</td>
                      <td className="px-6 py-4">{po.deliveryDate || po.est_delivery || po.expectedDelivery || 'TBD'}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-medium">
                        {po.grandTotal ? `₹${Number(po.grandTotal).toLocaleString('en-IN')}` : po.total_price ? `₹${Number(po.total_price).toLocaleString('en-IN')}` : po.total_amount || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${po.status === 'Partially Received' || po.status?.toLowerCase().includes('process') ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <button onClick={() => setViewPoModalData(po)} className="p-1.5 rounded-lg bg-[#0D1322] hover:bg-[#1A233A] text-gray-300 hover:text-white" title="View PO Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadPurchaseOrderPdf(po)} className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Download PO PDF">
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                      Loading live orders...
                    </td>
                  </tr>
                ) : completedPOs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                      No completed purchase orders found.
                    </td>
                  </tr>
                ) : (
                  completedPOs.map((po) => (
                    <tr key={po.po_number || po.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{po.po_number || po.id}</td>
                      <td className="px-6 py-4 text-xs font-mono">{po.grnNumbers?.join(', ') || 'N/A'}</td>
                      <td className="px-6 py-4">{po.supplier_name || po.supplier}</td>
                      <td className="px-6 py-4">{po.orderDate || po.deliveryDate || (po.created_at ? formatIndianDate(po.created_at) : po.deliveredOn || 'N/A')}</td>
                      <td className="px-6 py-4 font-medium">{po.receivedQty || po.totalItems || po.total_items} / {po.totalItems || po.total_items || po.items}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <button onClick={() => setViewPoModalData(po)} className="p-1.5 rounded-lg bg-[#0D1322] hover:bg-[#1A233A] text-gray-300 hover:text-white" title="View PO Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadPurchaseOrderPdf(po)} className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
                  <th className="px-6 py-4">PAYMENT STATUS</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                      Loading live orders...
                    </td>
                  </tr>
                ) : historyPOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                      No purchase history found.
                    </td>
                  </tr>
                ) : (
                  historyPOs.map((po) => (
                    <tr key={po.po_number || po.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{po.po_number || po.id}</td>
                      <td className="px-6 py-4">{po.supplier_name || po.supplier}</td>
                      <td className="px-6 py-4 text-muted-foreground">{po.deliveryDate || (po.created_at ? formatIndianDate(po.created_at) : po.deliveredOn || po.date || '-')}</td>
                      <td className="px-6 py-4">{po.totalItems || po.total_items || po.items || '-'}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-medium">
                        {po.grandTotal ? `₹${Number(po.grandTotal).toLocaleString('en-IN')}` : po.total_price ? `₹${Number(po.total_price).toLocaleString('en-IN')}` : po.totalAmount ? `₹${Number(po.totalAmount).toLocaleString('en-IN')}` : po.total_amount || '-'}
                      </td>
                      {(() => {
                        const total = Number(po.grandTotal) || Number(po.total_price) || po.total_amount || 59000;
                        const payment = getPaymentStatus(po.po_number || po.id, total, po);
                        const txCountStr = payment.txCount === 0 ? '0 Txns' : payment.txCount === 1 ? '1 Txn' : `${payment.txCount} Txns`;
                        
                        if (payment.status === 'UNPAID') {
                          return (
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    UNPAID
                                  </span>
                                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">{txCountStr}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 block font-mono">Due: ₹{payment.due.toLocaleString('en-IN')}</span>
                              </div>
                            </td>
                          );
                        } else if (payment.status === 'PARTIALLY PAID') {
                          return (
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    PARTIALLY PAID
                                  </span>
                                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">{txCountStr}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 block font-mono">Paid: ₹{payment.paid.toLocaleString('en-IN')} | Due: ₹{payment.due.toLocaleString('en-IN')}</span>
                              </div>
                            </td>
                          );
                        } else {
                          return (
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    PAID
                                  </span>
                                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">{txCountStr}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 block font-mono">Paid: ₹{payment.paid.toLocaleString('en-IN')}</span>
                              </div>
                            </td>
                          );
                        }
                      })()}
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 rounded-lg bg-[#0D1322] hover:bg-[#1A233A] text-gray-300 hover:text-white"
                          title="View PO Details"
                          onClick={() => setViewPoModalData(po)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => downloadPurchaseOrderPdf(po)} className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Export PDF">
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



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
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatIndianDate(item.archivedDate)}</td>
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