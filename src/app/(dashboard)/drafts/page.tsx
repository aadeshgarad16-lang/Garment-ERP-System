"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileEdit, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface DraftOrder {
  id: string;
  poNumber: string;
  customerName: string;
  poDate: string;
  date: string;
  [key: string]: any;
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);

  useEffect(() => {
    const savedDrafts = localStorage.getItem('draftOrders');
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (e) { }
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      setDrafts(prevDrafts => {
        const newDrafts = prevDrafts.filter(draft => draft.id !== id);
        localStorage.setItem('draftOrders', JSON.stringify(newDrafts));
        return newDrafts;
      });
    }
  }, []);

  const handleResume = useCallback((draft: DraftOrder) => {
    // Populate the draft to order initiation draft so it loads when opening orders page
    localStorage.setItem('orderInitiationDraft', JSON.stringify(draft));
    router.push('/orders');
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8">
      <button
        onClick={() => router.push('/orders')}
        className="mb-2 flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Order Initiation
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileEdit className="h-6 w-6 text-amber-500" />
            Draft Orders
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Manage and resume your saved draft orders.</p>
        </div>
        <button
          onClick={() => router.push('/orders')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
        >
          New Order <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-slate-800/50 border-b border-neutral-200 dark:border-slate-700">
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">PO Number</th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">PO Date</th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Saved On</th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-700">
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No draft orders found.
                  </td>
                </tr>
              ) : (
                drafts.map((draft) => (
                  <tr key={draft.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{draft.poNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-700 dark:text-neutral-300">{draft.customerName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">{draft.poDate || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">{draft.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleResume(draft)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Resume
                        </button>
                        <button
                          onClick={() => handleDelete(draft.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Draft"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
}
