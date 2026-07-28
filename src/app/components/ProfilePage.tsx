import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

export function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-12 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">User Profile</h1>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-3xl mx-auto px-6 mt-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-4xl font-bold mb-6 border-4 border-white dark:border-slate-800 shadow-sm">
                A
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Admin User</h3>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-1.5">admin@garmentstore.com</p>
              <span className="mt-4 px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold rounded-full border border-green-200 dark:border-green-800">
                Active Administrator
              </span>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-700 max-w-sm mx-auto">
              <button 
                onClick={() => {
                  alert("Account deletion requested. This action requires super-admin approval.");
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold rounded-xl border border-red-200 dark:border-red-800/50 transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
