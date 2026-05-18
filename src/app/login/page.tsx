"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Factory, Mail, Lock, UserCog, ArrowRight } from 'lucide-react';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(roles[0]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication logic
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Factory className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 tracking-tight">
          Sason ERP
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-neutral-200/50 sm:rounded-2xl sm:px-10 border border-neutral-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-neutral-900"
                  placeholder="admin@sason.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-neutral-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Sign in as
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCog className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-neutral-900 appearance-none bg-white cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
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
          
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">
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
