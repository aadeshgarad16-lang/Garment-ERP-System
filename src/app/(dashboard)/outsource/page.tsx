"use client";

import React from 'react';

export default function OutsourcePage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 font-sans pb-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outsource Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage external contractors, offsite manufacturing, and outsourcing status.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full mb-4">
          <svg className="h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Outsource Module Initialization</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The outsource management module is currently being set up. This dashboard will track all active external production lines and transit details.
        </p>
      </div>
    </div>
  );
}
