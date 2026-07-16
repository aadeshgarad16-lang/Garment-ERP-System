"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default function InitiateOrderReportsPage() {
  const router = useRouter();
  
  return (
    <div className="max-w-7xl mx-auto p-6 font-sans">
      <div className="flex items-center gap-3 mb-12">
        <BarChart3 className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-foreground">Initiate Order Reports</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="bg-card border border-border rounded-xl px-12 py-8 text-center shadow-sm">
          <p className="text-lg text-neutral-500 font-medium font-sans">This page is coming soon</p>
        </div>
        <button 
          onClick={() => router.back()} 
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    </div>
  );
}
