"use client";


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Factory, Mail, Lock, UserCog, ArrowRight, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(roles[0]);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');

  const validateName = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return "Required";
    if (!/^[a-zA-Z\s'.]{2,100}$/.test(trimmed) || /^(abcd|aaaa|xyz|12345|test|asdf|qwer)$/i.test(trimmed) || /^(.)\1{2,}$/.test(trimmed)) {
      return "Please enter a valid name. Placeholder text like 'ABCD' or numbers are not allowed.";
    }
    return "";
  };

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (trimmed !== name) setName(trimmed);
    setNameError(validateName(trimmed));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nError = validateName(name);
    if (nError) {
      setNameError(nError);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const result = register({ name, email, role, password });

    if (!result.success) {
      setError(result.error || "Registration failed");
      return;
    }

    // Auto-login after registration
    login({ name: "", email, role, password });

    setError('');
    router.push('/language');
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Factory className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground tracking-tight">
          Sason ERP
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Create a new account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl shadow-neutral-200/50 sm:rounded-2xl sm:px-10 border border-neutral-100 dark:border-border">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleRegister}>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Full Name
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${nameError ? 'text-red-400' : 'text-neutral-400'}`} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onBlur={handleNameBlur}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg sm:text-sm transition-colors text-foreground focus:outline-none focus:ring-2 ${
                    nameError 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-border focus:ring-ring focus:border-blue-500'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-ring focus:border-blue-500 sm:text-sm transition-colors text-foreground"
                  placeholder="admin@sason.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-ring focus:border-blue-500 sm:text-sm transition-colors text-foreground"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Confirm Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-ring focus:border-blue-500 sm:text-sm transition-colors text-foreground"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Register as
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCog className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:ring-ring focus:border-blue-500 sm:text-sm transition-colors text-foreground appearance-none bg-card cursor-pointer"
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
              >
                Sign up
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Log in
            </Link>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
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
