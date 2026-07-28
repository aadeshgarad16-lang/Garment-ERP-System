import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Check, X, ClipboardList, Calendar, Truck, AlertCircle } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';

export function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateOrderStatus, deleteOrder } = useOrders();

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-slate-500 dark:text-slate-400 mb-4">Order not found.</div>
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
      </div>
    );
  }

  const handleCancel = () => {
    deleteOrder(order.id);
    navigate('/orders');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Order Details: {order.id}
            </h1>
          </div>
        </div>
        <div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'Completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        {/* Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-0.5">Date of Order</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{order.dateOfOrder}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-0.5">Order Received Date</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {order.orderReceivedDate || 'Awaiting Delivery'}
              </p>
            </div>
          </div>
        </div>

        {/* Materials Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Materials Breakdown</h2>
            {order.status === 'Issue' && (
              <button
                onClick={() => {
                  updateOrderStatus(order.id, 'Completed');
                  navigate('/orders');
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                Resolve Issue
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-6">Material Name</th>
                  <th className="py-3 px-6 text-right">Quantity Ordered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-700 dark:text-slate-200">
                      {item.materialName}
                    </td>
                    <td className="py-3 px-6 text-right font-medium">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <td className="py-3 px-6 text-right">Total Items:</td>
                  <td className="py-3 px-6 text-right">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => navigate('/orders')}
            className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg shadow-sm transition-colors"
          >
            Back to Orders
          </button>

          {order.status !== 'Pending' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'Pending')}
              className="w-full sm:w-auto px-6 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Issue with this order
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
