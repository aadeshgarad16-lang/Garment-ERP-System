import React, { useEffect, useState } from 'react';
import { X, FileText, Download, Building2, Calendar, IndianRupee } from 'lucide-react';

export default function PODetailsModal({ poNumber, onClose }: { poNumber: string, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/procurement/po-details?po_number=${poNumber}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [poNumber]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/10">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Purchase Order Details
          </h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-muted-foreground">Failed to load PO details.</div>
          ) : (
            <div className="space-y-8">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg border border-border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PO Number</p>
                  <p className="font-bold text-foreground mt-1">{data.po_number}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier</p>
                  <p className="font-bold text-foreground mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-indigo-500" />
                    {data.supplier_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Date</p>
                  <p className="font-bold text-foreground mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    {new Date(data.po_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                  <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {data.status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-lg font-bold mb-4 border-b border-border pb-2">Line Items</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-y border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/10">
                        <td className="px-4 py-3 font-medium">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.qty}</td>
                        <td className="px-4 py-3 text-right">₹{Number(item.unit_price || item.rate || item.unitPrice || (item.total_price ? item.total_price / (item.qty || item.quantity) : 0) || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold">₹{Number(item.total_price || item.subtotal || ((item.unit_price || item.rate || item.unitPrice) * (item.qty || item.quantity)) || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {data.items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">No line items found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3 p-4 bg-muted/10 rounded-lg border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">₹{data.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST ({data.gstPercentage}%)</span>
                    <span className="font-semibold">₹{data.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between">
                    <span className="font-bold text-lg">Grand Total</span>
                    <span className="font-bold text-lg text-indigo-700">₹{data.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors font-medium text-sm">
            Close
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
