import React, { useState } from 'react';
import { Calendar, Sun, Moon, Globe, ChevronDown, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function TopHeader({ children }: { children?: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const { t, i18n } = useTranslation();
  
  const currentDate = new Date().toLocaleDateString(
    i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'mr' ? 'mr-IN' : 'en-US', 
  { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between px-6 sm:px-8 shrink-0 transition-colors duration-300 sticky top-0 z-40">
      {/* Left Content (Title, Breadcrumbs, Search, etc.) */}
      <div className="flex items-center gap-4 flex-1">
        {children}
      </div>
      
      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-5 ml-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-gray-500 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">{currentDate}</span>
        </div>
        
        <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 hidden md:block"></div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:block">
                {i18n.language === 'mr' ? 'मराठी' : i18n.language === 'hi' ? 'हिंदी' : 'English'}
              </span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => i18n.changeLanguage('en')} className="cursor-pointer">
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => i18n.changeLanguage('hi')} className="cursor-pointer">
              हिंदी
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => i18n.changeLanguage('mr')} className="cursor-pointer">
              मराठी
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="h-5 w-px bg-gray-200 dark:bg-slate-700"></div>
        
        {/* Admin Profile */}
        <div className="relative ml-1 pl-2">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden lg:block">{t('admin_user')}</span>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => navigate('/profile')}
                className="w-full text-left px-4 py-2 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-white">{t('admin_user')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">admin@garmentstore.com</p>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
