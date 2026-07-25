"use client";

import React, { useState } from 'react';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  IndianRupee,
  ChevronRight,
  MoreVertical,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Dummy Data for Charts
const salesData = [
  { date: '01 May', revenue: 12000 },
  { date: '05 May', revenue: 19000 },
  { date: '10 May', revenue: 15000 },
  { date: '15 May', revenue: 28000 },
  { date: '20 May', revenue: 22000 },
  { date: '25 May', revenue: 35000 },
  { date: '30 May', revenue: 31000 },
];

const categoryData = [
  { name: 'Apparel', value: 40 },
  { name: 'Electronics', value: 35 },
  { name: 'Accessories', value: 25 },
];
const COLORS = ['#2563EB', '#3B82F6', '#60A5FA'];

// Dummy Data for Tables
const recentOrders = [
  { id: '#ORD-8821', customer: 'Rahul Sharma', status: 'Completed', date: '2026-07-24', total: 4500 },
  { id: '#ORD-8822', customer: 'Priya Singh', status: 'Processing', date: '2026-07-24', total: 1250 },
  { id: '#ORD-8823', customer: 'Amit Kumar', status: 'Shipped', date: '2026-07-23', total: 8900 },
  { id: '#ORD-8824', customer: 'Sneha Patel', status: 'Completed', date: '2026-07-23', total: 3200 },
  { id: '#ORD-8825', customer: 'Vikram Das', status: 'Processing', date: '2026-07-22', total: 2150 },
];

const lowStockItems = [
  { name: 'Cotton T-Shirt (M)', current: 12, max: 100 },
  { name: 'Wireless Earbuds', current: 5, max: 50 },
  { name: 'Denim Jacket (L)', current: 8, max: 40 },
  { name: 'Running Sneakers', current: 3, max: 30 },
];

export default function StoreDashboardPage() {
  const [dateRange, setDateRange] = useState("Last 30 Days");

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      case 'Processing': return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
      case 'Shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-white p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Store Dashboard</h1>
            <p className="text-[#94A3B8] mt-1">Overview of your store's performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2 hover:bg-[#1E293B]/80 transition-colors">
                <Calendar size={18} className="text-[#94A3B8]" />
                <span className="text-sm font-medium">{dateRange}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-[#131C31] border border-[#334155] rounded-xl p-5 hover:border-[#2563EB]/50 transition-colors shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#94A3B8] text-sm font-medium">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1 text-white flex items-center">
                  ₹8,45,200
                </h3>
              </div>
              <div className="p-2 bg-[#2563EB]/10 rounded-lg">
                <IndianRupee size={20} className="text-[#2563EB]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight size={16} className="text-emerald-400 mr-1" />
              <span className="text-emerald-400 font-medium">+12.5%</span>
              <span className="text-[#94A3B8] ml-2">vs last month</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#131C31] border border-[#334155] rounded-xl p-5 hover:border-[#2563EB]/50 transition-colors shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#94A3B8] text-sm font-medium">Total Orders</p>
                <h3 className="text-2xl font-bold mt-1 text-white">1,248</h3>
              </div>
              <div className="p-2 bg-[#2563EB]/10 rounded-lg">
                <ShoppingBag size={20} className="text-[#2563EB]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight size={16} className="text-emerald-400 mr-1" />
              <span className="text-emerald-400 font-medium">+5.2%</span>
              <span className="text-[#94A3B8] ml-2">growth</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#131C31] border border-[#334155] rounded-xl p-5 hover:border-[#2563EB]/50 transition-colors shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#94A3B8] text-sm font-medium">Active Products</p>
                <h3 className="text-2xl font-bold mt-1 text-white">432 <span className="text-sm font-normal text-[#94A3B8]">items</span></h3>
              </div>
              <div className="p-2 bg-[#2563EB]/10 rounded-lg">
                <Package size={20} className="text-[#2563EB]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <AlertTriangle size={16} className="text-amber-500 mr-1" />
              <span className="text-amber-500 font-medium">8 low stock</span>
              <span className="text-[#94A3B8] ml-2">warnings</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-[#131C31] border border-[#334155] rounded-xl p-5 hover:border-[#2563EB]/50 transition-colors shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#94A3B8] text-sm font-medium">Avg. Order Value</p>
                <h3 className="text-2xl font-bold mt-1 text-white">₹1,650</h3>
              </div>
              <div className="p-2 bg-[#2563EB]/10 rounded-lg">
                <TrendingUp size={20} className="text-[#2563EB]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight size={16} className="text-emerald-400 mr-1" />
              <span className="text-emerald-400 font-medium">+2.1%</span>
              <span className="text-[#94A3B8] ml-2">growth</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chart (65%) */}
          <div className="lg:col-span-8 bg-[#131C31] border border-[#334155] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">Sales Performance</h2>
              <button className="text-[#94A3B8] hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value/1000}k`}
                  />
                  <CartesianGrid vertical={false} stroke="#334155" strokeDasharray="4 4" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#60A5FA' }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563EB" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart (35%) */}
          <div className="lg:col-span-4 bg-[#131C31] border border-[#334155] rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white mb-6">Sales by Category</h2>
            <div className="h-[240px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider">Top Category</span>
                <span className="text-xl font-bold text-white mt-1">Apparel</span>
              </div>
            </div>
            <div className="mt-2 space-y-3">
              {categoryData.map((category, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-sm text-[#94A3B8]">{category.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{category.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
          {/* Recent Orders Table (60%) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#131C31] border border-[#334155] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#334155] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <button className="text-sm text-[#2563EB] hover:text-[#60A5FA] font-medium transition-colors">
                View All
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1E293B]/50 text-[#94A3B8] text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {recentOrders.map((order, idx) => (
                    <tr key={idx} className="hover:bg-[#1E293B]/30 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-[#60A5FA]">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-white">{order.customer}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{order.date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white text-right">₹{order.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#334155] flex justify-between items-center bg-[#131C31]">
              <span className="text-xs text-[#94A3B8]">Showing 1 to 5 of 1,248 orders</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 rounded text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E293B] disabled:opacity-50 transition-colors" disabled>Prev</button>
                <button className="px-3 py-1 rounded text-sm bg-[#2563EB] text-white">1</button>
                <button className="px-3 py-1 rounded text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors">2</button>
                <button className="px-3 py-1 rounded text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors">3</button>
                <button className="px-3 py-1 rounded text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors">Next</button>
              </div>
            </div>
          </div>

          {/* Low Stock Widget (40%) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#131C31] border border-[#334155] rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Low Stock Warnings
              </h2>
            </div>
            <div className="space-y-5 flex-1">
              {lowStockItems.map((item, idx) => {
                const percentage = Math.round((item.current / item.max) * 100);
                const isCritical = percentage < 15;
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-white">{item.name}</h4>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{item.current} / {item.max} remaining</p>
                      </div>
                      <button className="text-xs px-3 py-1.5 rounded-md bg-[#1E293B] text-white hover:bg-[#334155] border border-[#334155] transition-colors opacity-0 group-hover:opacity-100">
                        Restock
                      </button>
                    </div>
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-6 py-2.5 rounded-lg border border-[#334155] text-sm text-white hover:bg-[#1E293B] transition-colors flex items-center justify-center gap-1">
              View Inventory <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
