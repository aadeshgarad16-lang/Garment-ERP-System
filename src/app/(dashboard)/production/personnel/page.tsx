'use client';

import React, { useState } from 'react';
import { User, X, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const initialPersonnel = [
  {
    name: 'Jamal',
    activeStage: 'CUTTING',
    poBatch: 'PO-2026-002',
    contact: '+1 (555) 019-2000',
    allocatedQty: 700
  },
  {
    name: 'Christie',
    activeStage: 'CUTTING',
    poBatch: 'PO-2026-002',
    contact: '+1 (555) 019-2001',
    allocatedQty: 1500
  }
];

export default function PersonnelOverviewPage() {
  const router = useRouter();
  const [personnelList, setPersonnelList] = useState(initialPersonnel);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [personName, setPersonName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [assignedStage, setAssignedStage] = useState('Cutting');

  const handleSavePersonnel = () => {
    if (!personName) return;
    
    setPersonnelList([...personnelList, {
      name: personName,
      contact: contactNumber || `+1 (555) 019-${2000 + personnelList.length}`,
      activeStage: assignedStage.toUpperCase(),
      poBatch: 'PO-2026-002',
      allocatedQty: 0
    }]);
    
    // Reset and close
    setPersonName('');
    setContactNumber('');
    setAssignedStage('Cutting');
    setIsOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8 pt-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="h-7 w-7 text-indigo-500" />
          Active Production Personnel Overview
        </h2>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition-colors"
          >
            + Add Person
          </button>
        </div>
      </div>
      
      {personnelList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {personnelList.map((person, i) => (
            <div key={i} className="bg-card border border-neutral-100 dark:border-neutral-700 rounded-2xl shadow-sm p-5 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-base shadow-inner">
                  {person.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-card-foreground">{person.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {person.contact}
                  </p>
                </div>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-3 border border-neutral-100 dark:border-neutral-700 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Assigned Stage</span>
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-neutral-800/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded uppercase tracking-wider">{person.activeStage}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Active PO Batch</span>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{person.poBatch}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-3 mt-3">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Total Allocated</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{person.allocatedQty.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="p-4 bg-card rounded-full shadow-sm mb-4 border border-neutral-100 dark:border-neutral-700">
            <User className="h-8 w-8 text-neutral-400" />
          </div>
          <p className="text-card-foreground font-bold text-lg mb-1">No personnel deployed on the floor</p>
          <p className="text-sm text-muted-foreground max-w-sm">Click '+ Add Person' to assign workers.</p>
        </div>
      )}

      {/* Personnel Creation Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Add New Personnel</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Person Name</label>
                <input 
                  type="text" 
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Enter employee name"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Contact Number</label>
                <input 
                  type="tel" 
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Assign Production Stage</label>
                <select 
                  value={assignedStage}
                  onChange={(e) => setAssignedStage(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-transparent text-neutral-700 dark:text-neutral-200"
                >
                  <option value="Cutting">Cutting</option>
                  <option value="Stitching">Stitching</option>
                  <option value="Fusing">Fusing</option>
                  <option value="Kaj Button">Kaj Button</option>
                  <option value="Finishing">Finishing</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-border bg-neutral-50 dark:bg-neutral-800/50">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-neutral-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePersonnel}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Save Personnel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
