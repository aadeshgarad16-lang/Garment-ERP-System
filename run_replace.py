import re

with open('temp_qp_page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix imports
text = re.sub(
    r'  ChevronRight,\n  ShieldAlert\n\} from \'lucide-react\';',
    r'  ChevronRight,\n  ShieldAlert,\n  X,\n  Clock,\n  ArrowRight\n} from \'lucide-react\';',
    text
)

text = re.sub(
    r'import \{ updateOrderAndLog \} from \'@/lib/logger\';',
    r'import { updateOrderAndLog } from \'@/lib/logger\';\nimport { getAuthHeaders } from \'@/lib/api\';',
    text
)

# Fix states
text = re.sub(
    r'const \[currentOrder, setCurrentOrder\] = useState<any>\(null\);\n',
    r'const [currentOrder, setCurrentOrder] = useState<any>(null);\n  const [showPendingPanel, setShowPendingPanel] = useState(false);\n  const [pendingOrders, setPendingOrders] = useState<any[]>([]);\n  const [isProcessing, setIsProcessing] = useState(false);\n',
    text
)

# Fix loadPendingOrders and useEffect
load_func = """  const loadPendingOrders = async () => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${BACKEND_URL}/api/orders?stage=Quality%20%26%20Packing`, {
        headers: getAuthHeaders(true)
      });
      if (res.ok) {
        const data = await res.json();
        const pending = data.filter((o: any) => o.status === 'Pending' || !o.status);
        setPendingOrders(pending);
      }
    } catch (err) {
      console.error("Failed to load pending orders:", err);
    }
  };

  const handleProcessOrder = async (po: string) => {
    try {
      setIsProcessing(true);
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${BACKEND_URL}/purchase_orders/update_status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(true) },
        body: JSON.stringify({ poNumber: po, status: 'In Progress' })
      });
      if (res.ok) {
        setShowPendingPanel(false);
        window.location.href = `/quality-packing?poNumber=${encodeURIComponent(po)}`;
      } else {
        alert("Failed to process order.");
      }
    } catch (err) {
      console.error("Failed to process order:", err);
      alert("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };"""

text = re.sub(
    r'  useEffect\(\(\) => \{',
    load_func + '\n\n  useEffect(() => {\n    loadPendingOrders();',
    text,
    flags=re.DOTALL
)

# Fix header section
header_replacement = """        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadPendingOrders(); setShowPendingPanel(true); }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer shadow-sm"
          >
            <Clock className="h-3.5 w-3.5" />
            Pending
            {pendingOrders.length > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${overallStatus === 'Ready for Dispatch' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
              overallStatus === 'Rework Required' ? 'bg-red-100 text-red-800 border-red-200' :
                overallStatus === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:text-blue-200 border-blue-200' :
                'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-slate-700'
            }`}>
            {overallStatus === 'Ready for Dispatch' ? (t('quality.readyDispatch') || 'Ready for Dispatch') : overallStatus === 'Rework Required' ? t('dashboard.stockAlerts.severity.critical') : overallStatus === 'In Progress' ? t('dashboard.recentOrders.headers.poNumber') : t('dashboard.recentOrders.status.pending')}
          </span>
        </div>"""

text = re.sub(
    r'        <div>\s*<span className=\{\`inline-flex items-center[^>]+\>\s*\{overallStatus === \'Ready for Dispatch\'.*?</span>\s*</div>',
    header_replacement,
    text,
    flags=re.DOTALL
)

# Add panel at the end
panel_str = """
      {/* Pending Orders Slide-Over Panel */}
      {showPendingPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowPendingPanel(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-neutral-200 dark:border-slate-700 animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Pending Orders</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Quality &amp; Packing Queue</p>
                </div>
              </div>
              <button
                onClick={() => setShowPendingPanel(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-500 dark:text-neutral-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pendingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="p-4 bg-neutral-100 dark:bg-slate-800 rounded-full mb-4">
                    <ShieldCheck className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No Pending Orders</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">All Quality &amp; Packing orders are up to date.</p>
                </div>
              ) : (
                pendingOrders.map((order: any, i: number) => (
                  <div
                    key={order.po_number || order.poNumber || i}
                    className="w-full text-left p-4 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all group flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{order.po_number || order.poNumber}</span>
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Pending</span>
                        </div>
                        {order.customer_name && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{order.customer_name}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {order.delivery_date && (
                            <span className="text-xs text-neutral-400">
                              Due: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{order.delivery_date}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleProcessOrder(order.po_number || order.poNumber)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 mt-1"
                      >
                        {isProcessing ? 'Processing...' : 'Process'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/50">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
                {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} awaiting Quality &amp; Packing
              </p>
            </div>
          </div>
        </>
      )}
"""

text = text.replace('    </div>\n  );\n}', panel_str + '    </div>\n  );\n}')

with open('c:/Users/USER/Pictures/Garment__WEB/Sasons_Clone1/clone1/Garment-ERP-System/src/app/(dashboard)/quality-packing/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
