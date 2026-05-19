"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/contexts/language-context';
import LanguageSwitcher from '@/components/language-switcher';
import {
  LayoutDashboard,
  ShoppingCart,
  Calculator,
  Box,
  Truck,
  Factory,
  PieChart,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  ShieldCheck,
  Map,
  User,
  LogOut
} from 'lucide-react';

const navItems = [
  { tKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { tKey: 'orderInitiation', href: '/orders', icon: ShoppingCart },
  { tKey: 'bomCalculation', href: '/bom-calculation', icon: Calculator },
  { tKey: 'inventoryCheck', href: '/inventory', icon: Box },
  { tKey: 'procurement', href: '/procurement', icon: Truck },
  { tKey: 'production', href: '/production', icon: Factory },
  { tKey: 'qualityPacking', href: '/quality-packing', icon: ShieldCheck },
  { tKey: 'logistics', href: '/logistics', icon: Map },
  { tKey: 'accounts', href: '/accounts', icon: PieChart },
  { tKey: 'settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // Handle active state matching (e.g., if pathname is '/orders', Orders is active)
  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 font-sans">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] text-neutral-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-[#0f172a]">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="text-xl font-bold text-white flex items-center gap-2">
            <Factory className="h-6 w-6 text-blue-500" />
            {t('appName') || 'Sasons ERP'}
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="h-[calc(100vh-4rem)] overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('sidebar.mainMenu')}</div>
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              const itemName = t(`sidebar.${item.tKey}`);
              return (
                <Link
                  key={item.tKey}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                    }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  {itemName}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden sm:flex items-center bg-neutral-100 rounded-lg px-3 py-2 w-72">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t('actions.search') || 'Search...'}
                className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full text-neutral-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button className="p-2 text-neutral-400 hover:text-neutral-600 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-neutral-200 hidden sm:block"></div>
            
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 hover:bg-neutral-50 p-1.5 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-neutral-700 leading-tight">{user?.name || "User"}</p>
                  <p className="text-xs text-neutral-500">{user?.role || "Role"}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-400 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-neutral-200 z-50 overflow-hidden">
                  <Link 
                    href="/profile" 
                    onClick={() => setProfileDropdownOpen(false)} 
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-neutral-400" />
                    {t('actions.viewProfile')}
                  </Link>
                  <div className="border-t border-neutral-100 my-1"></div>
                  <button 
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }} 
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    {t('actions.logout') || 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 sm:p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
