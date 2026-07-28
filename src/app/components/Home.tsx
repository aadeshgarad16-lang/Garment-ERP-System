import { useNavigate } from 'react-router';
import { Shirt, Scissors, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 transition-colors flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full space-y-12">
        {/* Title Section */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-[#1e293b] dark:text-white tracking-tight mb-3">
            {t('Garment Store')}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            {t('manage_inventory')}
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1: Ready-Made Clothes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col items-center justify-between text-center min-h-[380px]">
            <div className="flex flex-col items-center">
              {/* Icon Container */}
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <Shirt className="w-9 h-9 text-[#2563eb]" />
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                {t('Ready-Made Clothes')}
              </h2>
              
              {/* Description */}
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
                {t('ready_made_desc')}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/ready-made')}
              className="bg-[#1766e6] hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm hover:shadow transition-all duration-200"
            >
              {t('Browse Collection')}
            </button>
          </div>

          {/* Card 2: Custom Material Selection */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col items-center justify-between text-center min-h-[380px]">
            <div className="flex flex-col items-center">
              {/* Icon Container */}
              <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
                <Scissors className="w-9 h-9 text-[#a855f7]" />
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                {t('Custom Material Selection')}
              </h2>
              
              {/* Description */}
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
                {t('custom_material_desc')}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/custom-material')}
              className="bg-[#9333ea] hover:bg-purple-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm hover:shadow transition-all duration-200"
            >
              {t('Select Materials')}
            </button>
          </div>

          {/* Card 3: Orders */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col items-center justify-between text-center min-h-[380px]">
            <div className="flex flex-col items-center">
              {/* Icon Container */}
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                <ClipboardList className="w-9 h-9 text-[#4f46e5]" />
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                {t('Orders')}
              </h2>
              
              {/* Description */}
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
                {t('orders_desc')}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/orders')}
              className="bg-[#4f46e5] hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm hover:shadow transition-all duration-200"
            >
              {t('View Orders')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
