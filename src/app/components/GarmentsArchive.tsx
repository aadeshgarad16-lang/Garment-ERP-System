import { useNavigate } from 'react-router';
import { ArrowLeft, RotateCw, Trash2, Archive, CheckCircle } from 'lucide-react';
import { useGarments } from '../context/GarmentsContext';
import { useState, useEffect } from 'react';
import { TopHeader } from './TopHeader';

export function GarmentsArchive() {
  const navigate = useNavigate();
  const { archivedGarments, restoreGarment, permanentDeleteGarment } = useGarments();
  
  const [deleteToast, setDeleteToast] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (deleteToast) {
      const timer = setTimeout(() => setDeleteToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteToast]);

  const handlePermanentDelete = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) {
      permanentDeleteGarment(id);
      setDeleteToast(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-16 relative transition-colors">
      
      {/* Top Notification Popup for Deletion */}
      {deleteToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">Delete Success! Product permanently removed.</span>
        </div>
      )}

      {/* Header */}
      <TopHeader>
        <button
          onClick={() => navigate('/ready-made')}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Archive className="w-5 h-5 text-slate-500 dark:text-slate-400 hidden sm:block" />
        <span
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors hidden sm:block"
          onClick={() => navigate('/ready-made')}
        >
          Store
        </span>
        <span className="text-slate-300 dark:text-slate-600 text-sm hidden sm:block">/</span>
        <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Archive Box</h1>
      </TopHeader>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Garment Archive</h2>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-transparent dark:border-slate-700">
            {archivedGarments.length} Items
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
          These products have been removed from the main store. You can restore them to active status or permanently delete them from the database.
        </p>

        {archivedGarments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {archivedGarments.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col opacity-80 hover:opacity-100 transition-all duration-300"
              >
                <div className="relative bg-slate-100 dark:bg-slate-900/50 aspect-[4/3] overflow-hidden border-b border-slate-100 dark:border-slate-700">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover grayscale"
                  />
                  <div className="absolute inset-0 bg-slate-900/20 dark:bg-slate-900/40 flex items-center justify-center">
                    <span className="bg-slate-800/80 dark:bg-slate-950/80 text-white backdrop-blur-sm px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border border-white/20 dark:border-slate-600">
                      Archived
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug line-through decoration-slate-300 dark:decoration-slate-600">
                      {item.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 mb-3">{item.sku}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50 rounded-lg px-2.5 py-2 mb-4">
                      <span>Size: <strong className="text-slate-700 dark:text-slate-300">{item.size}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => {
                        restoreGarment(item.id);
                        navigate('/ready-made');
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-[#1766e6] dark:hover:bg-[#1766e6] hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-[#1766e6] dark:hover:border-[#1766e6] rounded-lg text-sm font-semibold transition-colors"
                    >
                      <RotateCw className="w-4 h-4" /> Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-[#e53e3e] dark:hover:bg-[#e53e3e] hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-[#e53e3e] dark:hover:border-[#e53e3e] rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-16 text-center text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mt-12 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
              <Archive className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-lg">Archive is Empty</p>
            <p className="text-sm mt-2 max-w-md text-slate-500 dark:text-slate-400">There are no archived products. Deleted items from the main store will appear here for recovery.</p>
          </div>
        )}
      </main>
    </div>
  );
}
