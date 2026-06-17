"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
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
  ShieldCheck,
  Map,
  User,
  LogOut,
  Sun,
  Moon,
  Calendar,
  ClipboardList
} from 'lucide-react';

const navItems = [
  { tKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { tKey: 'orderInitiation', href: '/orders', icon: ShoppingCart },
  { tKey: 'orderSpecifications', href: '/order-specifications', icon: ClipboardList },
  { tKey: 'stockCalculation', href: '/stock-calculation', icon: Package },
  { tKey: 'bomCalculation', href: '/bom-calculation', icon: Calculator },
  { tKey: 'inventoryCheck', href: '/inventory', icon: Box },
  { tKey: 'materialallocation', href: '/material-allocation', icon: Layers },
  { tKey: 'outSource', href: '/out-source', icon: PackageCheck },
  { tKey: 'procurement', href: '/procurement', icon: Truck },
  { tKey: 'production', href: '/production', icon: Factory },
  { tKey: 'qualityPacking', href: '/quality-packing', icon: ShieldCheck },
  { tKey: 'logistics', href: '/logistics', icon: Map },
  { tKey: 'accounts', href: '/accounts', icon: PieChart },
  { tKey: 'store', href: 'http://localhost:5173', icon: ShoppingCart },
  { tKey: 'logs', href: '/logs', icon: ClipboardList },
  { tKey: 'settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);
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
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] text-neutral-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 w-full">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="text-xl font-bold text-white flex items-center gap-2">
            <Factory className="h-6 w-6 text-blue-500" />
            {t('appName') || 'Sasons ERP'}
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
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
                ref={dateInputRef}
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
              />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-slate-800 rounded-lg text-sm font-medium border border-neutral-200 dark:border-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-700 transition-colors pointer-events-none">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  {mounted ? new Date(currentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
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
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-tight">{user?.name || "User"}</p>
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
