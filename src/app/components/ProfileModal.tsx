import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileModal({ isOpen, onClose, onLogout }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">User Profile</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-3xl font-bold mb-4 border-4 border-white dark:border-slate-800 shadow-sm">
              A
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Admin User</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">admin@garmentstore.com</p>
            <span className="mt-3 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800">
              Active Administrator
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => {
                alert("Account deletion requested. This action requires super-admin approval.");
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold rounded-xl border border-red-200 dark:border-red-800/50 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
