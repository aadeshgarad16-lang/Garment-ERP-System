"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthHeaders } from '@/lib/api';

export type User = {
  id?: number;
  fullName?: string; // from backend full_name
  contactNo?: string; // from backend contact_no
  email: string;
  role: string;
  designation?: string;
  modules_access?: string[];
  status?: string;
  password?: string;
  name?: string; // fallback for legacy code
};

type AuthContextType = {
  user: User | null;
  login: (credentials: { contactNo?: string; email?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthorized: (moduleName: string) => boolean;
  hasWriteAccess: (moduleName: string) => boolean;
  updateUser: (user: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage on mount for active session
    const storedUser = localStorage.getItem('sason_active_session');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  const login = async (credentials: { contactNo?: string; email?: string; password?: string }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      const backendUser = data.user;
      const safeUser: User = {
        id: backendUser.id,
        fullName: backendUser.full_name,
        name: backendUser.full_name, // Map for legacy components
        contactNo: backendUser.contact_no,
        email: backendUser.email,
        role: backendUser.role,
        designation: backendUser.designation,
        modules_access: backendUser.modules_access,
        status: backendUser.status
      };

      setUser(safeUser);
      localStorage.setItem('sason_active_session', JSON.stringify(safeUser));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sason_active_session');
    window.location.href = '/login';
  };

  const isAuthorized = (moduleName: string): boolean => {
    if (!user) return false;
    if (!user.modules_access) return false;
    return user.modules_access.includes(moduleName);
  };

  const hasWriteAccess = (moduleName: string): boolean => {
    if (!user) return false;
    if (!user.modules_access) return false;
    return user.modules_access.includes(moduleName);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('sason_active_session', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthorized, hasWriteAccess, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
