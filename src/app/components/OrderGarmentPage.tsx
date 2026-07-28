import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Package, CheckCircle2, Truck, AlertTriangle } from 'lucide-react';
import { useGarments } from '../context/GarmentsContext';

export function OrderGarmentPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { garments, addPurchaseOrders } = useGarments();
  
  const product = garments.find((g) => String(g.id) === id);

  const [orderQty, setOrderQty] = useState(50);
  const [supplierNote, setSupplierNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-sans transition-colors">
        <div className="text-center">
          <Package className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">Product not found</p>
          <button
            onClick={() => navigate('/ready-made')}
            className="mt-4 px-5 py-2 bg-[#1766e6] dark:bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  const submitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      addPurchaseOrders([
        {
          garmentName: `${product.name} (${product.sku})`,
          quantity: orderQty,
          status: 'Pending',
        },
      ]);
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-sans p-6 transition-colors">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-10 max-w-md w-full text-center transition-colors">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Restock Order Confirmed!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Order for <strong className="dark:text-slate-200">{orderQty} units</strong> of <br/>
            <span className="font-semibold dark:text-slate-200">{product.name} ({product.sku})</span> has been placed.
          </p>
          {supplierNote && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">"{supplierNote}"</p>
          )}
          <div className="mt-8">
            <button
              onClick={() => navigate('/ready-made')}
              className="w-full py-2.5 bg-[#1766e6] dark:bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/ready-made')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Package className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <span
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
            onClick={() => navigate('/ready-made')}
          >
            Ready-Made Store
          </span>
          <span className="text-slate-300 dark:text-slate-600 text-sm">/</span>
          <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200">Order Product</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 mt-10">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Restock Product</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Place a supply order to restock this ready-made garment.
          </p>
        </div>

        {product.status === 'Out of Stock' && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-400">Urgent Restock Needed</p>
              <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">
                This item is completely out of stock. Prioritize this order.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6 transition-colors">
          <div className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-slate-800">
            <div className="w-full sm:w-1/3 aspect-[4/3] sm:aspect-auto">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 flex flex-col justify-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{product.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">SKU: {product.sku}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700">
                  {product.category}
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                  product.status === 'Out of Stock' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' :
                  product.status === 'Low Stock' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' :
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                }`}>
                  {product.status}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={submitOrder} className="p-6 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Order Quantity (Units)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 dark:text-slate-500 text-sm">pcs</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Supplier / Vendor Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={supplierNote}
                  onChange={(e) => setSupplierNote(e.target.value)}
                  placeholder="e.g. Please expedite shipping..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/ready-made')}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-[#1766e6] dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Truck className="w-4 h-4" /> Place Restock Order
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
