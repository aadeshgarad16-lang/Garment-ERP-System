"use client";

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Archive, RefreshCw } from 'lucide-react';
import AddVendorModal from '@/components/logistics/AddVendorModal';

export default function VendorsManagementPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [isArchivedView, setIsArchivedView] = useState(false);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      } else {
        const cached = JSON.parse(localStorage.getItem('cachedVendors') || '[]');
        setVendors(cached);
      }
    } catch (e) {
      const cached = JSON.parse(localStorage.getItem('cachedVendors') || '[]');
      setVendors(cached);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setEditingVendor(null);
    fetchVendors();
  };

  const handleArchiveToggle = async (vendor: any, archiveStatus: boolean) => {
    try {
      // Simulate API call
      // await fetch(`/api/vendors/${vendor.id}/archive`, { method: 'PATCH', body: JSON.stringify({ is_archived: archiveStatus }) });
      const existing = JSON.parse(localStorage.getItem('cachedVendors') || '[]');
      const index = existing.findIndex((v: any) => v.id === vendor.id || v.name === vendor.name);
      if (index > -1) {
        existing[index].is_archived = archiveStatus;
        localStorage.setItem('cachedVendors', JSON.stringify(existing));
        fetchVendors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const displayedVendors = vendors.filter(v => isArchivedView ? v.is_archived : !v.is_archived);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-card p-4 rounded-xl border border-neutral-200 dark:border-border shadow-sm mt-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Vendor Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your registered logistics vendors and transport partners.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsArchivedView(!isArchivedView)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              isArchivedView 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-slate-800 dark:text-neutral-300'
            }`}
          >
            <Archive className="w-4 h-4" />
            {isArchivedView ? 'View Active Vendors' : 'Archived Vendors'}
          </button>
          {!isArchivedView && (
            <button 
              onClick={() => {
                setEditingVendor(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-neutral-200 dark:border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-slate-800/30 uppercase border-b border-neutral-200 dark:border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Vendor Name</th>
                <th className="px-4 py-3 font-semibold">Mobile Number</th>
                <th className="px-4 py-3 font-semibold">Email ID</th>
                <th className="px-4 py-3 font-semibold">Transport Company</th>
                <th className="px-4 py-3 font-semibold">Vehicle Type</th>
                <th className="px-4 py-3 font-semibold">Vehicle Number</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    {isArchivedView ? 'No archived vendors.' : 'No vendors found. Click "+ Add Vendor" to create one.'}
                  </td>
                </tr>
              ) : (
                displayedVendors.map((vendor, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 dark:border-border/50 hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {vendor.name || vendor.vendorName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {vendor.mobileNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {vendor.emailId || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {vendor.transportCompany || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800">
                        {vendor.vehicleType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {vendor.vehicleNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isArchivedView ? (
                          <button 
                            onClick={() => handleArchiveToggle(vendor, false)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded transition-colors"
                            title="Restore Vendor"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Restore
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setEditingVendor(vendor);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if(confirm('Are you sure you want to archive this vendor?')) {
                                  handleArchiveToggle(vendor, true);
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Add/Edit Vendor Modal */}
      {isAddModalOpen && (
        <AddVendorModal
          initialData={editingVendor}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingVendor(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
