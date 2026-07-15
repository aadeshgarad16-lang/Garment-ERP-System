"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/contexts/language-context';
import LanguageSwitcher from '@/components/language-switcher';
import { formatDateDisplay } from '@/utils/dateUtils';
import {
  LayoutDashboard,
  ShoppingCart,
  Calculator,
  Box,
  Layers,
  Package,
  PackageCheck,
  Truck,
  Factory,
  PieChart,
  Settings,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Map,
  User,
  LogOut,
  Sun,
  Moon,
  Calendar,
  ClipboardList,
  UserPlus,
  PackageSearch,
  Store,
  BarChart3
} from 'lucide-react';

const navItems = [
  { tKey: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'Dashboard' },
  { 
    tKey: 'initiateOrder', 
    label: 'Initiate Order', 
    icon: ShoppingCart,
    module: 'Order Initiation',
    children: [
      { tKey: 'orderInitiation', label: 'Order Initiation', href: '/orders', module: 'Order Initiation' },
      { tKey: 'orderSpecifications', label: 'Specifications', href: '/order-specifications', module: 'Specifications' },
      { tKey: 'initiateOrderReports', label: 'Reports', href: '/reports/initiate-order', icon: BarChart3, module: 'Order Initiation' }
    ]
  },
  { 
    tKey: 'materialCheck', 
    label: 'Material Check', 
    icon: PackageSearch,
    module: 'Inventory Check',
    children: [
      { tKey: 'stockCheck', label: 'Stock Check', href: '/stock-calculation', module: 'Stock Check' },
      { tKey: 'bomCalc', label: 'BOM Calculation', href: '/bom-calculation', module: 'BOM Calculation' },
      { tKey: 'inventory', label: 'Inventory Check', href: '/inventory', module: 'Inventory Check' },
      { tKey: 'allocation', label: 'Material Allocation', href: '/material-allocation', module: 'Material Allocation' },
      { tKey: 'materialCheckReports', label: 'Reports', href: '/reports/material-check', icon: BarChart3, module: 'Inventory Check' }
    ]
  },
  { 
    tKey: 'storeGroup', 
    label: 'Store', 
    icon: Store,
    module: 'Store',
    children: [
      { tKey: 'storeDashboard', label: 'Store Dashboard', href: '/store-dashboard', module: 'Store' },
      { tKey: 'rawMaterial', label: 'Raw Material', href: '/store?tab=raw', module: 'Store' },
      { tKey: 'preStitched', label: 'Pre-stitched Material', href: '/store?tab=pre', module: 'Store' },
      { tKey: 'storeReports', label: 'Reports', href: '/reports/store', icon: BarChart3, module: 'Store' }
    ]
  },
  { tKey: 'production', label: 'Production', href: '/production-dashboard', icon: Factory, module: 'Production' },
  { tKey: 'qualityPacking', label: 'Quality & Packing', href: '/quality-packing', icon: ShieldCheck, module: 'Quality & Packing' },
  { tKey: 'logistics', label: 'Logistics', href: '/logistics', icon: Map, module: 'Logistics' },
  { tKey: 'accounts', label: 'Accounts', href: '/accounts', icon: PieChart, module: 'Accounts' },
  { tKey: 'settings', label: 'Settings', href: '/settings', icon: Settings, module: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date().toISOString().split('T')[0]);
    const storedCollapseState = localStorage.getItem('sason_sidebar_collapsed');
    if (storedCollapseState) {
      setSidebarCollapsed(storedCollapseState === 'true');
    }
  }, []);

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sason_sidebar_collapsed', String(newState));
  };

  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    // Route protection logic (ensure user is logged in)
    const storedSession = localStorage.getItem('sason_active_session');
    if (!storedSession) {
      if (pathname !== '/login') router.push('/login');
    }
  }, [pathname, router]);

  // Handle active state matching (e.g., if pathname is '/orders', Orders is active)
  const isItemActive = (href: string) => {
    if (!href) return false;
    if (href === '/') {
      return pathname === '/';
    }
    
    // Exact match for isolated dashboard route to prevent bleeding
    if (href === '/production-dashboard') {
      return pathname === '/production-dashboard';
    }
    
    // Alternate split match to catch nested /production links without highlighting on dashboard
    if (href === '/production') {
      return pathname === '/production' || (pathname?.startsWith('/production/') && !pathname.startsWith('/production-dashboard'));
    }
    
    return pathname?.startsWith(href);
  };

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Auto-open parent menus if a child is active
  useEffect(() => {
    if (!mounted) return;
    const activeParents = navItems
      .filter(item => item.children?.some((child: any) => isItemActive(child.href)))
      .map(item => item.tKey);
      
    if (activeParents.length > 0) {
      setOpenMenus(prev => {
        const newOpens = activeParents.filter(p => !prev.includes(p));
        return newOpens.length > 0 ? [...prev, ...newOpens] : prev;
      });
    }
  }, [pathname, mounted]);

  return (
    <div className="fixed inset-0 flex bg-neutral-100 dark:bg-slate-950 font-sans">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-[#1e293b] text-neutral-300 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
      `}>
        <div className={`flex-shrink-0 flex items-center h-16 w-full transition-all duration-300 justify-between ${sidebarCollapsed ? 'px-3' : 'px-4'}`}>
          <Link href="/" onClick={() => setSidebarOpen(false)} className={`text-xl font-bold text-white flex items-center gap-2 overflow-hidden transition-all duration-300 shrink-0`}>
            <Factory className="h-6 w-6 text-blue-500 shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>{t('appName') || 'Sasons ERP'}</span>
          </Link>
          <div className="flex items-center shrink-0">
            <button
              onClick={toggleSidebarCollapse}
              className={`hidden lg:flex items-center justify-center h-8 w-8 text-neutral-400 hover:text-white hover:bg-slate-700/80 transition-all rounded-md ${sidebarCollapsed ? 'bg-slate-800/80' : 'bg-transparent'}`}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-400 hover:text-white ml-2">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className={`mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'px-0 h-0 opacity-0' : 'px-4 h-auto opacity-100'}`}>
            {!sidebarCollapsed && (t('sidebar.mainMenu') || 'MAIN MENU')}
          </div>
          <nav className={`space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'} transition-all duration-300 pb-20`}>
            {mounted ? navItems.filter(item => user?.role === 'Super Admin' || user?.modules_access?.includes(item.module) || (item.children && item.children.some((c:any) => user?.modules_access?.includes(c.module)))).map((item: any) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isParentActive = hasChildren ? item.children.some((c:any) => isItemActive(c.href)) : isItemActive(item.href);
              const itemName = item.label || t(`sidebar.${item.tKey}`);
              const isOpen = openMenus.includes(item.tKey);

              return (
                <div key={item.tKey} className="relative group">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleMenu(item.tKey)}
                      className={`w-full flex items-center justify-between rounded-lg text-sm font-medium transition-colors ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2'} ${isParentActive
                        ? 'bg-blue-600/10 text-blue-400'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                        }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Icon className={`h-5 w-5 shrink-0 transition-all duration-300 ${isParentActive ? 'text-blue-500' : 'text-neutral-400'}`} />
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                          {itemName}
                        </span>
                      </div>
                      {!sidebarCollapsed && (
                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2'} ${isItemActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                        }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 transition-all duration-300 ${isItemActive(item.href) ? 'text-white' : 'text-neutral-400'}`} />
                      <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                        {itemName}
                      </span>
                    </Link>
                  )}

                  {hasChildren && isOpen && !sidebarCollapsed && (
                    <div className="mt-1 space-y-1 pl-10 relative">
                      <div className="absolute left-[22px] top-0 bottom-2 border-l border-neutral-700/50"></div>
                      {item.children.filter((child: any) => user?.role === 'Super Admin' || user?.modules_access?.includes(child.module)).map((child: any) => {
                        const childActive = isItemActive(child.href);
                        return (
                          <Link
                            key={child.tKey}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block relative rounded-lg text-sm font-medium px-3 py-2 transition-colors ${childActive 
                              ? 'text-white bg-blue-600' 
                              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'}`}
                          >
                            {childActive && (
                               <div className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#1e293b]"></div>
                            )}
                            <span className="flex items-center gap-2">
                              {child.icon && <child.icon className="w-4 h-4 shrink-0" />}
                              {child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Tooltip for Collapsed State */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-800 text-white text-xs font-medium px-2 py-1.5 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[60]">
                      {itemName}
                      {/* Tooltip arrow */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-800"></div>
                    </div>
                  )}
                </div>
              );
            }) : null}
          </nav>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top Navbar */}
        <header className="flex-shrink-0 h-16 bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden sm:flex items-center bg-neutral-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-72">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t('actions.search') || 'Search...'}
                className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full text-neutral-700 dark:text-neutral-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="relative flex items-center hidden md:flex mr-2 cursor-pointer"
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch (e) {
                  dateInputRef.current?.focus();
                }
              }}
            >
              <input
                type="date"
                lang="en-GB"
                ref={dateInputRef}
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
              />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-slate-800 rounded-lg text-sm font-medium border border-neutral-200 dark:border-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-700 transition-colors pointer-events-none">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  {mounted && currentDate ? formatDateDisplay(currentDate) : ''}
                </span>
              </div>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <LanguageSwitcher />
            <div className="h-8 w-px bg-neutral-200 dark:bg-slate-700 hidden sm:block"></div>

            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  {(user as any)?.fullName ? (user as any).fullName.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-tight">{(user as any)?.fullName || user?.name || "User"}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.role || "Role"}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-400 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg py-1 border border-neutral-200 dark:border-slate-700 z-50 overflow-hidden">
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="h-4 w-4 text-neutral-400" />
                    {t('actions.viewProfile')}
                  </Link>
                  <div className="border-t border-neutral-100 dark:border-slate-800 my-1"></div>
                  <button
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-500 dark:text-red-400" />
                    {t('actions.logout') || 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-slate-950 p-4 sm:p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
