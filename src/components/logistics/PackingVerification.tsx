"use client";
import React, { useState } from 'react';
import { Package, Search, CheckCircle2 } from 'lucide-react';

interface PackingVerificationProps {
  onComplete: () => void;
}

export default function PackingVerification({ onComplete }: PackingVerificationProps) {
  const [manifestId, setManifestId] = useState('MNF-2026-089');
  const [verifiedQty, setVerifiedQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onComplete();
    }, 800);
  };

  const isFormValid = verifiedQty.trim() !== '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-neutral-200 px-6 py-5 bg-neutral-50/50 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Packing & Verification</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Verify packed quantities against shipping manifest before final approval.</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2 mb-1.5">
                Shipping Manifest ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input 
                  type="text" 
                  value={manifestId}
                  onChange={(e) => setManifestId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-600 focus:outline-none"
                  readOnly
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">Manifest generated automatically from Quality & Packing module.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2 mb-1.5">
                Verified Quantity <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                placeholder="Enter physical count"
                value={verifiedQty}
                onChange={(e) => setVerifiedQty(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2 mb-1.5">
                Verification Remarks
              </label>
              <textarea 
                placeholder="Any discrepancies or notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[100px]"
              />
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 flex flex-col">
            <h3 className="text-sm font-bold text-neutral-800 mb-4 uppercase tracking-wider">Manifest Summary</h3>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <span className="text-sm text-neutral-500">Order ID</span>
                <span className="text-sm font-semibold text-neutral-900">PO-2026-004</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <span className="text-sm text-neutral-500">Target Quantity</span>
                <span className="text-sm font-semibold text-neutral-900">1000 pcs</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <span className="text-sm text-neutral-500">Carton Count</span>
                <span className="text-sm font-semibold text-neutral-900">25 Cartons</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <span className="text-sm text-neutral-500">Destination</span>
                <span className="text-sm font-semibold text-neutral-900">Warehouse B, Dubai</span>
              </div>
            </div>
            
            <button
              onClick={handleVerify}
              disabled={!isFormValid || isVerifying}
              className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Verify Packing
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
