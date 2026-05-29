"use client";


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Factory, Mail, Lock, UserCog, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';

const roles = [
  "Super Admin",
  "Director",
  "Production Head",
  "Production Coordinator",
  "Production Supervisor",
  "Store Manager",
  "Cutting Master",
  "Accounts Manager"
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(roles[0]);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const savedRole = localStorage.getItem('rememberedRole');

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      if (savedPassword) setPassword(savedPassword);
      if (savedRole) setRole(savedRole);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
      localStorage.setItem('rememberedRole', role);
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
      localStorage.removeItem('rememberedRole');
    }

    const result = login({ name: "", email, role, password });

    if (!result.success) {
      setError(result.error || "Login failed");
      return;
    }

    setError('');
    router.push('/language');
  };

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300 ${isDark ? 'bg-neutral-900' : 'bg-neutral-100 dark:bg-slate-800'}`}>

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className={`p-2 rounded-full shadow-sm transition-colors ${isDark
              ? 'bg-neutral-800 text-yellow-400 hover:bg-neutral-700'
              : 'bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-slate-800'
            }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Factory className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className={`mt-6 text-center text-3xl font-extrabold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>
          Sason ERP
        </h2>
        <p className={`mt-2 text-center text-sm transition-colors ${isDark ? 'text-neutral-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border transition-colors duration-300 ${isDark
            ? 'bg-neutral-800 border-neutral-700 shadow-black/50'
            : 'bg-white dark:bg-slate-900 border-neutral-100 dark:border-slate-800 shadow-neutral-200/50'
          }`}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>

            {/* Email Field */}
            <div>
              <label className={`block text-sm font-medium transition-colors ${isDark ? 'text-neutral-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                Email address
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 transition-colors ${isDark ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-400'}`} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${isDark
                      ? 'bg-neutral-900 border-neutral-600 text-white placeholder-neutral-500'
                      : 'bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400'
                    }`}
                  placeholder="admin@sason.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-sm font-medium transition-colors ${isDark ? 'text-neutral-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors ${isDark ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-400'}`} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${isDark
                      ? 'bg-neutral-900 border-neutral-600 text-white placeholder-neutral-500'
                      : 'bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400'
                    }`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className={`block text-sm font-medium transition-colors ${isDark ? 'text-neutral-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                Sign in as
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCog className={`h-5 w-5 transition-colors ${isDark ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-400'}`} />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors appearance-none cursor-pointer ${isDark
                      ? 'bg-neutral-900 border-neutral-600 text-white'
                      : 'bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-600 text-neutral-900 dark:text-neutral-100'
                    }`}
                >
                  {roles.map((r) => (
                    <option key={r} value={r} className={isDark ? 'bg-neutral-900 text-white' : 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100'}>{r}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className={`h-5 w-5 transition-colors ${isDark ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded cursor-pointer transition-colors ${isDark ? 'bg-neutral-900 border-neutral-600' : 'border-neutral-300 dark:border-slate-600'}`}
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm cursor-pointer transition-colors ${isDark ? 'text-neutral-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign in to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          <div className={`mt-6 text-center text-sm transition-colors ${isDark ? 'text-neutral-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400">
              Sign up
            </Link>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t transition-colors ${isDark ? 'border-neutral-700' : 'border-neutral-200 dark:border-slate-700'}`} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 transition-colors ${isDark ? 'bg-neutral-800 text-neutral-500 dark:text-neutral-400' : 'bg-white dark:bg-slate-900 text-neutral-500 dark:text-neutral-400'}`}>
                  Secure Enterprise Authentication
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
