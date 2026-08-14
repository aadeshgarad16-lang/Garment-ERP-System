'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  PackageCheck, 
  ClipboardCheck, 
  Package, 
  CheckSquare, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

export default function QualityPackingPage() {
  const [activeStage, setActiveStage] = useState('finished_goods');

  const stages = [
    {
      id: 'finished_goods',
      title: 'Finished Goods Received for QC',
      subtitle: 'PO transferred from Production',
      badge: 'RECEIVED FOR QC',
      icon: PackageCheck,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'quality_check',
      title: 'Quality Check',
      subtitle: 'Inspect for defects & standards',
      badge: 'PENDING',
      icon: ClipboardCheck,
      badgeColor: 'bg-gray-800 text-gray-400 border-transparent'
    },
    {
      id: 'packing',
      title: 'Packing',
      subtitle: 'Pack finished products',
      badge: 'PENDING',
      icon: Package,
      badgeColor: 'bg-gray-800 text-gray-400 border-transparent'
    },
    {
      id: 'packing_verification',
      title: 'Packing & Verification',
      subtitle: 'Verify packed quantities against shipping manifest',
      badge: 'PENDING',
      icon: CheckSquare,
      badgeColor: 'bg-gray-800 text-gray-400 border-transparent'
    },
    {
      id: 'approval',
      title: 'Approval',
      subtitle: 'Authorized sign-off required',
      badge: 'PENDING',
      icon: CheckCircle2,
      badgeColor: 'bg-gray-800 text-gray-400 border-transparent'
    }
  ];

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-[#0B0F17] text-white font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-[#131B2E] p-6 rounded-2xl border border-gray-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-500"/> Quality & Packing
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Post-production validation, quality inspection, and dispatch preparation
          </p>
        </div>
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
          Pending Validation
        </span>
      </div>

      {/* OVERALL PROGRESS BANNER */}
      <div className="bg-[#131B2E] border border-gray-800 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="text-gray-400 uppercase text-[10px] font-semibold tracking-wider">Overall Progress</span>
            <p className="text-2xl font-bold text-white mt-0.5">0%</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="bg-[#0B0F17] text-blue-400 px-3 py-1 rounded-lg border border-blue-500/20 text-xs font-semibold">
              0 / 5 Stages Completed
            </span>
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-gray-400 uppercase text-[10px] font-semibold">PIECES:</span>
                <span className="font-bold text-white ml-1.5">1000</span>
              </div>
              <div>
                <span className="text-emerald-400 uppercase text-[10px] font-semibold">QC PASSED:</span>
                <span className="font-bold text-emerald-400 ml-1.5">0</span>
              </div>
              <div>
                <span className="text-rose-400 uppercase text-[10px] font-semibold">QC FAILED:</span>
                <span className="font-bold text-rose-400 ml-1.5">0</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-800/80 h-2 rounded-full overflow-hidden">
          <div className="bg-blue-500 h-full w-[0%]"></div>
        </div>
      </div>

      {/* 5-CARD STAGES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const IconComponent = stage.icon;
          const isActive = activeStage === stage.id;

          return (
            <div
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`bg-[#131B2E] border rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-blue-400"/>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase border ${stage.badgeColor}`}>
                    {stage.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white">{stage.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{stage.subtitle}</p>
                </div>
              </div>

              {stage.id === 'finished_goods' && (
                <div className="grid grid-cols-2 gap-2 mt-4 text-center text-[10px]">
                  <div className="bg-[#0B0F17] p-2 rounded-lg border border-gray-800">
                    <span className="text-gray-400 block text-[8px] font-semibold uppercase">ORDERED</span>
                    <span className="font-bold text-white">1000 pcs</span>
                  </div>
                  <div className="bg-[#0B0F17] p-2 rounded-lg border border-gray-800">
                    <span className="text-emerald-400 block text-[8px] font-semibold uppercase">RECEIVED</span>
                    <span className="font-bold text-emerald-400">1000 pcs</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DETAILED GARMENT BREAKDOWN TABLE WHEN CARD #1 IS ACTIVE */}
      {activeStage === 'finished_goods' && (
        <div className="bg-[#131B2E] border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                📋 Finished Goods Received Details
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                PO Ref: <span className="text-blue-400 font-semibold">{typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('poNumber') || 'No PO Selected') : 'No PO Selected'}</span> • Customer: <span className="text-white font-medium">Customer</span>
              </p>
            </div>
            <button 
              onClick={() => setActiveStage('quality_check')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              Proceed to Quality Check <ArrowRight className="w-4 h-4"/>
            </button>
          </div>

          {/* GARMENT TYPE & SIZE BREAKDOWN TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3 px-4">Garment Type</th>
                  <th className="py-3 px-4">Article Description</th>
                  <th className="py-3 px-4">Size Breakdown & Qty</th>
                  <th className="py-3 px-4 text-right">Total Qty Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr className="hover:bg-gray-800/30">
                  <td className="py-3.5 px-4 font-bold text-blue-400">Shirt</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white">Men's Formal Cotton Shirt</div>
                    <div className="text-[10px] text-gray-400">SKU: SHIRT-M-001</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex gap-2 text-[11px]">
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">S:</b> 50</span>
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">M:</b> 150</span>
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">L:</b> 150</span>
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">XL:</b> 50</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">400 Pcs</td>
                </tr>

                <tr className="hover:bg-gray-800/30">
                  <td className="py-3.5 px-4 font-bold text-blue-400">Pant</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white">Men's Chino Trousers</div>
                    <div className="text-[10px] text-gray-400">SKU: PANT-M-002</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex gap-2 text-[11px]">
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">30:</b> 100</span>
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">32:</b> 100</span>
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">34:</b> 100</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">300 Pcs</td>
                </tr>

                <tr className="hover:bg-gray-800/30">
                  <td className="py-3.5 px-4 font-bold text-blue-400">Blazer / Jacket</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white">Formal Slim-Fit Blazer</div>
                    <div className="text-[10px] text-gray-400">SKU: BLZ-M-003</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex gap-2 text-[11px]">
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">38:</b> 100</span>
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">40:</b> 120</span>
                      <span className="bg-[#0B0F17] px-2 py-0.5 rounded border border-gray-800"><b className="text-gray-400">42:</b> 80</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">300 Pcs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}