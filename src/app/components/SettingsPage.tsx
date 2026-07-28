import React from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router';
import { LayoutDashboard, Shirt, Scissors, Database } from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-[#F9FAFB] dark:bg-slate-900 font-sans overflow-hidden transition-colors">
      
      {/* Sidebar */}
      <aside className="w-72 bg-[#111827] text-white flex flex-col shrink-0 transition-colors">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white tracking-wide">Garment Store</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Dashboard Item */}
          <div
            onClick={() => navigate('/store')}
            className="text-gray-400 hover:text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium text-sm">Dashboard</span>
          </div>

          {/* Ready-Made Clothes Item */}
          <div
            onClick={() => navigate('/ready-made')}
            className="text-gray-400 hover:text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
          >
            <Shirt className="w-5 h-5" />
            <span className="font-medium text-sm">Ready-Made Clothes</span>
          </div>

          {/* Custom Materials Item */}
          <div
            onClick={() => navigate('/materials')}
            className="text-gray-400 hover:text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
          >
            <Scissors className="w-5 h-5" />
            <span className="font-medium text-sm">Custom Materials</span>
          </div>

          {/* Sasons Item */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
          >
            <Database className="w-5 h-5" />
            <span className="font-medium text-sm">Sasons</span>
          </a>

          {/* Settings Item - ACTIVE */}
          <div className="bg-blue-600 text-white flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg shadow-blue-900/20 cursor-pointer">
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-900 transition-colors">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Settings className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6" strokeWidth={2.5} />
          <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-3 tracking-tight">Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">This module is currently under development.</p>
        </div>
      </div>
    </div>
  );
}
