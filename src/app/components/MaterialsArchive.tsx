import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, RotateCw, Trash2, CheckCircle } from 'lucide-react';
import { useMaterials } from '../context/MaterialsContext';
import { TopHeader } from './TopHeader';

export function MaterialsArchive() {
  const navigate = useNavigate();
  const { archivedMaterials, restoreMaterial, permanentDeleteMaterial } = useMaterials();
  const [deleteToast, setDeleteToast] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (deleteToast) {
      const timer = setTimeout(() => setDeleteToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteToast]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans pb-12 relative transition-colors">
      {/* Top Notification Popup */}
      {deleteToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">Delete Success! Item permanently removed.</span>
        </div>
      )}

      {/* Header Bar */}
      <TopHeader>
        <button
          onClick={() => navigate('/custom-material')}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mr-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 hidden sm:block">Garment Store</h1>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:block">|</span>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Materials Archive</span>
        </div>
      </TopHeader>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight relative -bottom-[10px] inline-block border-b-2 border-slate-800 dark:border-slate-100 pb-2.5">
            Archived Materials
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden mb-8 transition-colors">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 text-sm sticky top-0 z-10 shadow-sm transition-colors">
                <tr>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">Material</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">Type</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">Quantity</th>
                  <th className="px-6 py-4 border-r border-slate-200/80 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-900/90">Supplier</th>
                  <th className="px-6 py-4 font-bold bg-slate-50 dark:bg-slate-900/90 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80 text-sm">
                {archivedMaterials.length > 0 ? (
                  archivedMaterials.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-150 ${index % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-700/60' : 'bg-white dark:bg-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-700/40'}`}
                    >
                      <td className="px-6 py-3.5 font-semibold border-r border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        {item.material}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-700">
                        {item.type}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium border-r border-slate-200/60 dark:border-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-700">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => restoreMaterial(item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#1766e6] dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete "${item.material}"? This action cannot be undone.`)) {
                                permanentDeleteMaterial(item.id);
                                setDeleteToast(true);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e53e3e] text-white hover:bg-red-700 rounded-lg text-xs font-bold transition-all shadow-sm border border-transparent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Permanent Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">
                      No archived materials.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
