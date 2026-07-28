import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check, X, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useTranslation } from 'react-i18next';

export function OrdersDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { orders, updateOrderStatus, deleteOrder } = useOrders();

  const activeOrders = orders.filter(o => o.status === 'Pending');
  const issueOrders = orders.filter(o => o.status === 'Issue');
  const completedOrders = orders.filter(o => o.status === 'Completed');
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('Awaiting Delivery');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(
      i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'mr' ? 'mr-IN' : 'en-US',
      { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
    );
  };

  const renderTable = (tableOrders: typeof orders, title: string, type: 'active' | 'issue' | 'completed') => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-2">
        {type === 'active' && <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        {type === 'issue' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
        {type === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <span className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-0.5 px-2.5 rounded-full text-xs font-semibold">
          {tableOrders.length}
        </span>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-4 px-6">{t('Order Number')}</th>
                <th className="py-4 px-6">{t('Total Items')}</th>
                <th className="py-4 px-6">{t('Date of Order')}</th>
                <th className="py-4 px-6">{t('Date of Receiving Order')}</th>
                <th className="py-4 px-6">{t('Status of Delivery')}</th>
                <th className="py-4 px-6 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tableOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {t('No orders in this category.')}
                  </td>
                </tr>
              ) : (
                tableOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-4 px-6">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline focus:outline-none"
                      >
                        {order.id}
                      </button>
                    </td>
                    <td className="py-4 px-6">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td className="py-4 px-6">{formatDate(order.dateOfOrder)}</td>
                    <td className="py-4 px-6">{formatDate(order.orderReceivedDate)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : order.status === 'Issue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {type === 'active' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Completed')}
                              className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors"
                              title="Mark as Completed"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Issue')}
                              className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                              title="Mark as Issue"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {type === 'issue' && (
                          <span className="text-xs text-slate-400 italic">Click Order # to Resolve</span>
                        )}
                        {type === 'completed' && (
                          <span className="text-xs text-slate-400 italic">Resolved</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/store')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {t('Orders Dashboard')}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {renderTable(activeOrders, t("Table 1: Active / Delivered Orders"), "active")}
        {renderTable(issueOrders, t("Table 2: Issue / Action Required Box"), "issue")}
        {renderTable(completedOrders, t("Completed Orders"), "completed")}
      </main>
    </div>
  );
}
