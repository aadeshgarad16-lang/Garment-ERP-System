import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, RotateCw, ShoppingBag, Truck, Check, X, Archive, LayoutDashboard, Shirt, Scissors, Settings, Search, Database } from 'lucide-react';
import { TopHeader } from './TopHeader';
import { useState } from 'react';
import { useMaterials } from '../context/MaterialsContext';
import { useOrders } from '../context/OrdersContext';
import { useTranslation } from 'react-i18next';

export function CustomMaterial() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Context state
  const { materials: materialsList, addMaterial, softDeleteMaterial } = useMaterials();
  const { orders, deleteOrder } = useOrders();
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Row selection handler
  const handleRowClick = (id: number) => {
    setSelectedRowId(selectedRowId === id ? null : id);
  };

  // Remove action handler
  const handleRemoveSelected = () => {
    if (selectedRowId !== null) {
      const removedItem = materialsList.find(item => item.id === selectedRowId);
      if (removedItem) {
        softDeleteMaterial(selectedRowId);
        setSelectedRowId(null);
        showTemporaryToast(`Moved "${removedItem.material}" to Archive.`);
      }
    } else {
      alert('Please click on a row to select it before clicking Remove.');
    }
  };

  // Inline "Order" button → navigate to purchase order page with this item preselected
  const handleInlineOrderClick = (itemId: number) => {
    navigate('/purchase-order/create', { state: { materialId: itemId } });
  };

  // Global "Order" toolbar button → navigate to purchase order page
  const handleToolbarOrderClick = () => {
    navigate('/purchase-order/create');
  };

  // Toast utility (still used for remove actions)
  const showTemporaryToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-900 font-sans pb-12 transition-colors relative">

      {/* Visual Success Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-800 flex items-start gap-3 transition-all duration-300 animate-slide-in">
          <div className="bg-[#48bb78] text-white rounded-full p-1.5 mt-0.5 shadow">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-[#48bb78]">Purchase Requisition Logged</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{successToast}</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <TopHeader>
        {/* Back Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/store')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Scissors className="w-6 h-6 text-slate-700 dark:text-slate-300 stroke-[2.25]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight hidden sm:block">{t('Materials')}</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-sm ml-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          </div>
          <input 
            type="text" 
            placeholder={t("Search materials...")} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 text-gray-700 dark:text-slate-200 transition-shadow"
          />
        </div>
      </TopHeader>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-12">
        <main className="max-w-7xl mx-auto px-6 mt-8">

        {/* Section Title with Divider */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight relative -bottom-[10px] inline-block border-b-2 border-slate-800 dark:border-slate-100 pb-2.5">
            {t('Raw Materials')}
          </h2>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Action Operations */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Blue Button */}
            <button
              onClick={() => navigate('/custom-material/add')}
              className="flex items-center gap-1.5 bg-[#1766e6] hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-sm text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('Add Material')}</span>
            </button>

            {/* Danger Red Button */}
            <button
              onClick={handleRemoveSelected}
              className="flex items-center gap-1.5 bg-[#e53e3e] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded shadow-sm text-sm transition-colors border border-transparent"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('Remove')}</span>
            </button>

            {/* View Archive Button */}
            <button
              onClick={() => navigate('/custom-material/archive')}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-200 dark:border-slate-700 rounded shadow-sm text-sm transition-all"
            >
              <Archive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Archive</span>
            </button>

            <button
              onClick={handleToolbarOrderClick}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-200 dark:border-slate-700 rounded shadow-sm text-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{t('Order')}</span>
            </button>
          </div>

          {/* Selected Row Meta Tag helper */}
          {selectedRowId !== null && (
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded px-2.5 py-1 font-semibold">
              Selected Item ID: #{selectedRowId}
            </div>
          )}
        </div>

        {/* Structured Data Table Container */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 text-sm sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">{t('Material')}</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">{t('Type')}</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">{t('Quantity')}</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">{t('Unit Price')}</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">{t('Total Value')}</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">{t('Supplier')}</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">{t('Status')}</th>
                  <th className="px-6 py-4 font-bold bg-slate-50 dark:bg-slate-900/90">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80 text-sm">
                {materialsList.length > 0 ? (
                  materialsList.map((item, index) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className={`cursor-pointer transition-colors duration-150 ${selectedRowId === item.id
                          ? 'bg-blue-50/70 dark:bg-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/60'
                          : index % 2 === 1
                            ? 'bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-700/40'
                        }`}
                    >
                      <td className={`px-6 py-3.5 font-semibold border-r border-slate-200/60 dark:border-slate-700 ${item.status === 'Low Stock' || item.status === 'Reorder Soon'
                          ? 'text-[#e53e3e]'
                          : 'text-slate-800 dark:text-slate-200'
                        }`}>
                        {item.material}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-700">
                        {t(item.type)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium border-r border-slate-200/60 dark:border-slate-700">
                        {item.quantity.replace('meters', t('meters')).replace('spools', t('spools')).replace('pcs', t('pcs'))}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium border-r border-slate-200/60 dark:border-slate-700">
                        ${item.unitPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium border-r border-slate-200/60 dark:border-slate-700">
                        ${(parseFloat(item.quantity || '0') * (item.unitPrice || 0)).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-700">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-3.5 border-r border-slate-200/60 dark:border-slate-700">
                        {item.status === 'In Stock' && (
                          <div className="flex items-center text-[#48bb78] font-bold text-xs">
                            <span className="w-2.5 h-2.5 bg-[#48bb78] rounded-full mr-2 shadow-sm"></span>
                            {t('In Stock')}
                          </div>
                        )}
                        {item.status === 'Low Stock' && (
                          <div className="inline-flex items-center gap-1.5 bg-[#ed8936] text-white px-2.5 py-0.5 rounded text-xs font-bold shadow-sm">
                            <span className="w-2 h-2 bg-white rounded-sm"></span>
                            {t('Low Stock')}
                          </div>
                        )}
                        {item.status === 'Reorder Soon' && (
                          <div className="inline-flex items-center gap-1.5 bg-[#e53e3e] text-white px-2.5 py-0.5 rounded text-xs font-bold shadow-sm">
                            <span className="w-2 h-2 bg-white rounded-sm"></span>
                            {t('Reorder Soon')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* Standard compact Delete actions in gray containers */}
                          <div className="inline-flex gap-1 border border-slate-200 dark:border-slate-700 rounded p-0.5 bg-slate-50/50 dark:bg-slate-700/50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                softDeleteMaterial(item.id);
                                showTemporaryToast(`Moved "${item.material}" to Archive.`);
                              }}
                              className="hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-slate-500 dark:text-slate-400 font-semibold p-1.5 text-xs rounded transition-all flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Contextual Order Button rendered for Low Stock or Reorder Soon states */}
                          {(item.status === 'Low Stock' || item.status === 'Reorder Soon') ? (
                            <button
                              onClick={() => handleInlineOrderClick(item.id)}
                              className="bg-[#1766e6] hover:bg-blue-700 text-white font-semibold px-2.5 py-1 text-xs rounded shadow-sm hover:shadow transition-all flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>{t('Order')}</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold px-2.5 py-1 text-xs rounded flex items-center gap-1 cursor-not-allowed opacity-60"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>{t('Order')}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">
                      No materials available in stock. Click "Add Material" to create some.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="mt-12">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-2 mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight relative -bottom-[10px] inline-block border-b-2 border-slate-800 dark:border-slate-100 pb-2.5">
              {t('Recent Orders')}
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 text-sm sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90 w-1/4">{t('Material')}</th>
                    <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90 w-1/4">{t('Quantity')}</th>
                    <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90 w-1/4">{t('Status')}</th>
                    <th className="px-6 py-4 font-bold bg-slate-50 dark:bg-slate-900/90 w-1/4 text-center">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80 text-sm">
                  {orders.length > 0 ? (
                    orders.flatMap((order, orderIndex) => 
                      order.items.map((item, itemIndex) => (
                        <tr
                          key={`${order.id}-${itemIndex}`}
                          className={`transition-colors duration-150 ${(orderIndex + itemIndex) % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-800'}`}
                        >
                          <td className="px-6 py-3.5 font-semibold border-r border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                            {item.materialName}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium border-r border-slate-200/60 dark:border-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-3.5 border-r border-slate-200/60 dark:border-slate-700">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold shadow-sm ${
                              order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              order.status === 'Shipped' ? 'bg-[#1766e6] text-white border border-blue-200' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {t(order.status)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button
                              onClick={() => {
                                if(window.confirm("Are you sure you want to cancel this entire order?")) {
                                  deleteOrder(order.id);
                                }
                              }}
                              className="inline-flex items-center justify-center px-3 py-1 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800/50 rounded text-xs font-semibold transition-colors shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              {t('Cancel')}
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">
                        {t('No recent orders.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        </main>
      </div>
    </div>
  );
}
