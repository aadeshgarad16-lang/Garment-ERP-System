import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Truck, Plus, Trash2, AlertTriangle, AlertCircle, CheckCircle2, Package, RotateCw, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
import { useMaterials, RawMaterial } from '../context/MaterialsContext';
import { useOrders } from '../context/OrdersContext';

interface OrderLineItem {
  id: string;
  materialId: number | null;
  materialName: string;
  supplier: string;
  currentQty: string;
  orderQty: number;
  unit: string;
  isManual: boolean;
  status: string;
}

// Extract unit string from "85 meters" → "meters"
function parseUnit(qtyStr: string): string {
  const parts = qtyStr.trim().split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : 'units';
}

// Build default order line from a raw material
function buildLine(mat: RawMaterial, isManual = false): OrderLineItem {
  return {
    id: `line-${mat.id}-${Date.now()}-${Math.random()}`,
    materialId: mat.id,
    materialName: mat.material,
    supplier: mat.supplier,
    currentQty: mat.quantity,
    orderQty: 100,
    unit: parseUnit(mat.quantity),
    isManual,
    status: mat.status,
  };
}

// Build a blank manual line
function blankLine(): OrderLineItem {
  return {
    id: `manual-${Date.now()}-${Math.random()}`,
    materialId: null,
    materialName: '',
    supplier: '',
    currentQty: '—',
    orderQty: 1,
    unit: 'units',
    isManual: true,
    status: 'Manual',
  };
}

// ── StatusIcon helper ──────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  if (status === 'Low Stock')
    return (
      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
        <AlertTriangle className="w-3 h-3" /> Low Stock
      </span>
    );
  if (status === 'Reorder Soon')
    return (
      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
        <AlertCircle className="w-3 h-3" /> Reorder Soon
      </span>
    );
  if (status === 'Manual')
    return (
      <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-200">
        <Plus className="w-3 h-3" /> Manual
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> In Stock
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { materials, recentOrders, addRecentOrders } = useMaterials();
  const { addOrder } = useOrders();

  // If navigated from a specific material row, pre-select that material's ID
  const preselectedId: number | null = (location.state as { materialId?: number })?.materialId ?? null;

  const pendingMaterialNames = new Set(
    recentOrders.filter(o => o.status === 'Pending').map(o => o.materialName)
  );

  // Auto-populate lines for Low Stock and Reorder Soon materials, EXCLUDING those already pending
  const urgentMaterials = materials.filter(
    (m) => (m.status === 'Low Stock' || m.status === 'Reorder Soon') && !pendingMaterialNames.has(m.material)
  );

  // Available materials for manual selection (excluding pending)
  const availableMaterials = materials.filter(m => !pendingMaterialNames.has(m.material));

  const [orderLines, setOrderLines] = useState<OrderLineItem[]>(() => {
    // If a specific material was passed via navigation state, only include that one
    if (preselectedId !== null) {
      const mat = materials.find((m) => m.id === preselectedId);
      return mat ? [buildLine(mat)] : urgentMaterials.map((m) => buildLine(m));
    }
    return urgentMaterials.map((m) => buildLine(m));
  });

  const [submitted, setSubmitted] = useState(false);
  const [supplierNote, setSupplierNote] = useState('');

  const [archivedItems, setArchivedItems] = useState<OrderLineItem[]>([]);
  const [deleteToast, setDeleteToast] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (deleteToast) {
      const timer = setTimeout(() => setDeleteToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteToast]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const updateLine = (id: string, patch: Partial<OrderLineItem>) => {
    setOrderLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: string) => {
    const itemToRemove = orderLines.find((l) => l.id === id);
    if (itemToRemove) {
      setArchivedItems((prev) => [...prev, itemToRemove]);
    }
    setOrderLines((prev) => prev.filter((l) => l.id !== id));
  };

  const restoreLine = (id: string) => {
    const itemToRestore = archivedItems.find((l) => l.id === id);
    if (itemToRestore) {
      setOrderLines((prev) => [...prev, itemToRestore]);
    }
    setArchivedItems((prev) => prev.filter((l) => l.id !== id));
  };

  const permanentDeleteLine = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) {
      setArchivedItems((prev) => prev.filter((l) => l.id !== id));
      setDeleteToast(true);
    }
  };

  const addManualLine = () => {
    setOrderLines((prev) => [...prev, blankLine()]);
  };

  // When user picks a known material in a manual line's dropdown
  const assignMaterial = (lineId: string, matId: number | '') => {
    if (matId === '') {
      updateLine(lineId, { materialId: null, materialName: '', supplier: '', currentQty: '—', unit: 'units', status: 'Manual' });
      return;
    }
    const mat = materials.find((m) => m.id === Number(matId));
    if (mat) {
      updateLine(lineId, {
        materialId: mat.id,
        materialName: mat.material,
        supplier: mat.supplier,
        currentQty: mat.quantity,
        unit: parseUnit(mat.quantity),
        status: mat.status,
      });
    }
  };

  const submitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderLines.length === 0) {
      alert('Please add at least one line item before submitting.');
      return;
    }
    
    // Add individual recent orders for the Materials page
    const newOrders = orderLines.map(line => ({
      materialName: line.materialName || 'Custom Material',
      quantity: `${line.orderQty} ${line.unit}`,
      status: 'Pending'
    }));
    
    addRecentOrders(newOrders);

    // Create a unified Purchase Order for the Orders Dashboard
    const purchaseOrderItems = orderLines.map(line => ({
      materialName: line.materialName || 'Custom Material',
      quantity: line.orderQty
    }));
    
    addOrder(purchaseOrderItems);
    
    alert('Purchase Order submitted successfully!');
    navigate('/custom-material');
  };

  // ── Submitted success screen ─────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Order Confirmed!</h2>
          <p className="text-sm text-slate-500 mb-1">
            Purchase order for <strong>{orderLines.length}</strong> material{orderLines.length !== 1 ? 's' : ''} has been submitted to the respective suppliers.
          </p>
          {supplierNote && (
            <p className="text-xs text-slate-400 mt-2 italic">"{supplierNote}"</p>
          )}
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => navigate('/custom-material')}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Back to Materials
            </button>
            <button
              onClick={() => { setSubmitted(false); setOrderLines(urgentMaterials.map((m) => buildLine(m))); }}
              className="flex-1 py-2.5 bg-[#1766e6] hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16 relative">
      
      {/* Top Notification Popup for Deletion */}
      {deleteToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">Delete Success! Item permanently removed.</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/custom-material')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Truck className="w-5 h-5 text-slate-500" />
          <span
            className="text-sm text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
            onClick={() => navigate('/custom-material')}
          >
            Materials
          </span>
          <span className="text-slate-300 text-sm">/</span>
          <h1 className="text-sm font-bold text-slate-800">Create Purchase Order</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-8">

        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">Create Purchase Order</h2>
          <p className="text-sm text-slate-500 mt-1">
            Materials low in stock or marked for reorder have been added automatically. You can adjust quantities or add more items below.
          </p>
        </div>

        {/* Alert banner for auto-populated items */}
        {urgentMaterials.length > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">
                {urgentMaterials.length} material{urgentMaterials.length !== 1 ? 's' : ''} flagged for reorder
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {urgentMaterials.map((m) => m.material).join(', ')} — added automatically.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={submitOrder}>
          {/* ── Order Lines Table ─────────────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">

            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-0 bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Material</span>
              <span>Supplier</span>
              <span>Current Qty</span>
              <span>Order Qty</span>
              <span>Status</span>
              <span />
            </div>

            {/* Lines */}
            <div className="divide-y divide-slate-100">
              {orderLines.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">
                  <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No items added. Click "+ Add Material" below to add one.
                </div>
              )}

              {orderLines.map((line) => (
                <div
                  key={line.id}
                  className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-0 items-center px-5 py-3.5 transition-colors ${
                    line.isManual ? 'bg-violet-50/30' : ''
                  }`}
                >
                  {/* Material Name */}
                  <div className="pr-3">
                    {line.isManual ? (
                      <select
                        value={line.materialId ?? ''}
                        onChange={(e) => assignMaterial(line.id, e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                      >
                        <option value="">— Select material —</option>
                        {availableMaterials.map((m) => (
                          <option key={m.id} value={m.id}>{m.material}</option>
                        ))}
                        <option value="" disabled>── or type below ──</option>
                      </select>
                    ) : (
                      <span className="text-sm font-semibold text-slate-800">{line.materialName}</span>
                    )}
                    {line.isManual && !line.materialId && (
                      <input
                        type="text"
                        placeholder="Or type custom material name..."
                        value={line.materialName}
                        onChange={(e) => updateLine(line.id, { materialName: e.target.value })}
                        className="mt-1.5 w-full text-sm border border-dashed border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-violet-400 text-slate-700 placeholder:text-slate-400"
                      />
                    )}
                  </div>

                  {/* Supplier */}
                  <div className="pr-3">
                    {line.isManual ? (
                      <input
                        type="text"
                        placeholder="Supplier name..."
                        value={line.supplier}
                        onChange={(e) => updateLine(line.id, { supplier: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-500 text-slate-700 placeholder:text-slate-400"
                      />
                    ) : (
                      <span className="text-sm text-slate-600">{line.supplier}</span>
                    )}
                  </div>

                  {/* Current Stock */}
                  <div className="text-sm text-slate-500 pr-3">{line.currentQty}</div>

                  {/* Order Quantity */}
                  <div className="pr-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        required
                        value={line.orderQty}
                        onChange={(e) => updateLine(line.id, { orderQty: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-center font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      {line.isManual && (
                        <input
                          type="text"
                          placeholder="unit"
                          value={line.unit}
                          onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                          className="w-16 text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-500 focus:outline-none focus:border-blue-500 text-center"
                        />
                      )}
                      {!line.isManual && (
                        <span className="text-xs text-slate-400">{line.unit}</span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div><StatusChip status={line.status} /></div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="ml-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Material Row */}
            <div className="border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={addManualLine}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Material
              </button>
            </div>
          </div>

          {/* ── Order Summary Card ────────────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium mb-1">Total Items</p>
              <p className="text-2xl font-extrabold text-slate-900">{orderLines.length}</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-600 font-medium mb-1">Auto-flagged</p>
              <p className="text-2xl font-extrabold text-amber-700">{orderLines.filter((l) => !l.isManual).length}</p>
            </div>
            <div className="text-center p-3 bg-violet-50 rounded-xl border border-violet-100">
              <p className="text-xs text-violet-600 font-medium mb-1">Manually Added</p>
              <p className="text-2xl font-extrabold text-violet-700">{orderLines.filter((l) => l.isManual).length}</p>
            </div>
          </div>

          {/* ── Archive Box ─────────────────────────────────────────────────── */}
          <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Archive Box
            </label>
            {archivedItems.length === 0 ? (
              <p className="text-sm text-slate-500">
                No archived items. Deleted materials will appear here for recovery.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {archivedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{item.materialName || 'Unnamed Material'}</span>
                      <span className="text-xs text-slate-500">
                        {item.supplier || 'No supplier'} • Qty: {item.orderQty} {item.unit}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => restoreLine(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-[#1766e6] hover:border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => permanentDeleteLine(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e53e3e] text-white hover:bg-red-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Supplier Note ────────────────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Supplier Note / Special Instructions (optional)
            </label>
            <textarea
              rows={3}
              value={supplierNote}
              onChange={(e) => setSupplierNote(e.target.value)}
              placeholder="e.g. Urgent delivery required before 30th. Please confirm via email..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:border-blue-500 resize-none text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* ── Action Buttons ────────────────────────────────────────────────── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/custom-material')}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={orderLines.length === 0}
              className="flex-[2] py-3 bg-[#1766e6] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Confirm Purchase Order ({orderLines.length} item{orderLines.length !== 1 ? 's' : ''})
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
