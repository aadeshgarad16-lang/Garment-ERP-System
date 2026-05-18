import React from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Factory, 
  Truck, 
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Calculator,
  Box,
  Scissors,
  CheckSquare,
  Package,
  Clock
} from 'lucide-react';

// Mock Data
const stats = [
  { title: 'Total Orders', value: '1,248', change: '+12%', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
  { title: 'Active Production', value: '8,430', subtitle: 'Units', icon: Factory, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { title: 'Pending Procurement', value: '12', subtitle: 'Purchase Orders', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-100' },
  { title: 'Inventory Alerts', value: '5', subtitle: 'Low stock items', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
];

const recentOrders = [
  { id: 'PO-2026-081', customer: 'Acme Retail', status: 'In Production', date: '2026-05-20', amount: '$15,400.00' },
  { id: 'PO-2026-082', customer: 'Global Fashion', status: 'Pending', date: '2026-05-25', amount: '$8,250.00' },
  { id: 'PO-2026-083', customer: 'Urban Styles', status: 'Delivered', date: '2026-05-10', amount: '$22,100.00' },
  { id: 'PO-2026-084', customer: 'Boutique XYZ', status: 'Cutting', date: '2026-06-01', amount: '$45,000.00' },
  { id: 'PO-2026-085', customer: 'Mega Mart', status: 'In Production', date: '2026-05-18', amount: '$12,800.00' },
];

const productionStages = [
  { name: 'Cutting', count: 1250, capacity: 2000, icon: Scissors, color: 'bg-blue-500' },
  { name: 'Stitching', count: 3400, capacity: 5000, icon: Factory, color: 'bg-indigo-500' },
  { name: 'Checking', count: 850, capacity: 1500, icon: CheckSquare, color: 'bg-amber-500' },
  { name: 'Packing', count: 420, capacity: 1000, icon: Package, color: 'bg-emerald-500' },
];

const inventoryAlerts = [
  { item: 'Cotton Fabric (White)', left: '45 meters', status: 'Critical' },
  { item: 'Polyester Thread (Navy)', left: '120 spools', status: 'Low' },
  { item: 'Metal Zippers 15cm', left: '350 units', status: 'Low' },
];

export default function DashboardHomePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans pb-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">Welcome back. Here's what's happening across the facility today.</p>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-5 lg:p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-neutral-900">{stat.value}</span>
                {stat.change && (
                  <span className="text-xs font-medium text-emerald-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    {stat.change}
                  </span>
                )}
                {stat.subtitle && (
                  <span className="text-xs font-medium text-neutral-500">{stat.subtitle}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column: Orders & Production */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Orders Table */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-5 flex justify-between items-center bg-neutral-50/50">
              <h2 className="text-lg font-semibold text-neutral-800">Recent Orders</h2>
              <Link href="/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                <thead>
                  <tr className="bg-white border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Delivery Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{order.customer}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 
                            order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                            'bg-blue-100 text-blue-800'}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {order.date}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900 text-right">{order.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Production Status */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-5 bg-neutral-50/50">
              <h2 className="text-lg font-semibold text-neutral-800">Production Status</h2>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="space-y-6">
                {productionStages.map((stage) => {
                  const percentage = Math.round((stage.count / stage.capacity) * 100);
                  return (
                    <div key={stage.name}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <stage.icon className="h-4 w-4 text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-700">{stage.name}</span>
                        </div>
                        <span className="text-sm text-neutral-500">
                          <span className="font-medium text-neutral-900">{stage.count}</span> / {stage.capacity} units
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full ${stage.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Column: Actions & Alerts */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-5 bg-neutral-50/50">
              <h2 className="text-lg font-semibold text-neutral-800">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              <Link 
                href="/orders" 
                className="w-full flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:border-blue-200 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-md shadow-sm border border-neutral-100 group-hover:border-blue-200">
                    <PlusCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm">Create Order</span>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-blue-500" />
              </Link>
              
              <Link 
                href="/bom-calculation" 
                className="w-full flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:border-indigo-200 hover:bg-indigo-50 text-neutral-700 hover:text-indigo-700 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-md shadow-sm border border-neutral-100 group-hover:border-indigo-200">
                    <Calculator className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="font-medium text-sm">Generate BOM</span>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-indigo-500" />
              </Link>

              <Link 
                href="/inventory" 
                className="w-full flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:border-emerald-200 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-700 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-md shadow-sm border border-neutral-100 group-hover:border-emerald-200">
                    <Box className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-sm">View Inventory</span>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-emerald-500" />
              </Link>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-5 flex justify-between items-center bg-neutral-50/50">
              <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Inventory Alerts
              </h2>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-neutral-100">
                {inventoryAlerts.map((alert, idx) => (
                  <li key={idx} className="p-4 hover:bg-neutral-50 transition-colors flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{alert.item}</p>
                      <p className="text-xs text-neutral-500 mt-1">{alert.left} remaining</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border
                      ${alert.status === 'Critical' 
                        ? 'bg-red-50 text-red-700 border-red-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'}`}
                    >
                      {alert.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-neutral-100 bg-neutral-50">
              <Link href="/procurement" className="text-sm font-medium text-blue-600 hover:text-blue-700 w-full flex justify-center items-center gap-1">
                Go to Procurement
              </Link>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
