import React from 'react';
import { useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
  Shirt, 
  Scissors, 
  Settings, 
  Search, 
  Layers,
  AlertTriangle,
  PlusCircle,
  Activity,
  Info,
  Database
} from 'lucide-react';
import { TopHeader } from './TopHeader';

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-[#F9FAFB] dark:bg-slate-900 font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-72 bg-[#111827] text-white flex flex-col shrink-0 transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white tracking-wide">Garment Store</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Active Item */}
          <div className="bg-blue-600 rounded-full text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors shadow-md">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-semibold text-sm">Dashboard</span>
          </div>
          
          {/* Inactive Items */}
          <div 
            onClick={() => navigate('/ready-made')}
            className="text-gray-400 hover:text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
          >
            <Shirt className="w-5 h-5" />
            <span className="font-medium text-sm">Ready-Made Clothes</span>
          </div>
          
          <div 
            onClick={() => navigate('/custom-material')}
            className="text-gray-400 hover:text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
          >
            <Scissors className="w-5 h-5" />
            <span className="font-medium text-sm">Custom Materials</span>
          </div>
          
          {/* Sasons ERP Item */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors mt-auto"
          >
            <Database className="w-5 h-5" />
            <span className="font-medium text-sm">Sasons</span>
          </a>
          
          <div 
            onClick={() => navigate('/settings')}
            className="text-gray-400 hover:text-white flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation */}
        <TopHeader>
          {/* Search */}
          <div className="relative w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-gray-50 dark:bg-slate-900/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 transition-shadow"
            />
          </div>
        </TopHeader>

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h2>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between h-36 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Active Garment Styles</span>
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Shirt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">8 Styles</h3>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between h-36 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Fabric Types Stocked</span>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">12 Types</h3>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between h-36 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Inventory Items</span>
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">3,450 Units</h3>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between h-36 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Sales Orders (Today)</span>
                  <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                    <PlusCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">15 Orders</h3>
                </div>
              </div>
            </div>

            {/* Split Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Data Table */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col transition-colors duration-300">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Facility Logs</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold transition-colors duration-300">
                        <th className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">Operation Info</th>
                        <th className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">Target Department</th>
                        <th className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">Status Badge</th>
                        <th className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700 dark:text-slate-300 divide-y divide-gray-100 dark:divide-slate-700/80">
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">Cotton Restock Arrival</td>
                        <td className="px-6 py-4">Raw Materials</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-transparent dark:border-green-800">
                            Completed
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400">10 mins ago</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">Pattern Cut - Style A</td>
                        <td className="px-6 py-4">Production Floor</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-transparent dark:border-blue-800">
                            In Progress
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400">1 hr ago</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">Quality Check Failed</td>
                        <td className="px-6 py-4">QA Department</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-transparent dark:border-red-800">
                            Attention
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400">2 hrs ago</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">New Order Sync</td>
                        <td className="px-6 py-4">Sales & Dispatch</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-transparent dark:border-green-800">
                            Completed
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400">3 hrs ago</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Insights */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col transition-colors duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Store Configuration Insights</h3>
                <div className="space-y-4">
                  {/* Insight Card 1 */}
                  <div className="p-4 rounded-xl border border-blue-50 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10 flex items-start gap-4 transition-colors">
                    <div className="mt-0.5 bg-blue-100 dark:bg-blue-900/40 rounded-full p-2 shrink-0">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">High Demand Alert</h4>
                      <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                        Summer linen fabrics are moving 30% faster this week. Consider increasing the upcoming reorder volume.
                      </p>
                    </div>
                  </div>
                  {/* Insight Card 2 */}
                  <div className="p-4 rounded-xl border border-amber-50 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10 flex items-start gap-4 transition-colors">
                    <div className="mt-0.5 bg-amber-100 dark:bg-amber-900/40 rounded-full p-2 shrink-0">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">System Update Scheduled</h4>
                      <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                        Inventory sync maintenance is planned for 02:00 AM tonight. Expect 15 minutes of read-only mode.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
