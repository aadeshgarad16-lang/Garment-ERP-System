"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type User = {
  name: string;
  email: string;
  role: string;
  password?: string;
};

type AuthContextType = {
  user: User | null;
  login: (credentials: User) => { success: boolean; error?: string };
  register: (userData: User) => { success: boolean; error?: string };
  logout: () => void;
  deleteAccount: (email: string) => void;
  updateUser: (user: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage on mount for active session
    const storedUser = localStorage.getItem('sason_active_session');
    if (storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const register = (userData: User) => {
    const existingUsers = JSON.parse(localStorage.getItem('sason_users') || '[]');
    if (existingUsers.find((u: User) => u.email === userData.email)) {
      return { success: false, error: 'User with this email already exists' };
    }
    // "Hash" password (for demo purposes we just encode it, in reality use bcrypt or similar on backend)
    const newUser = { ...userData, password: btoa(userData.password || '') };
    existingUsers.push(newUser);
    localStorage.setItem('sason_users', JSON.stringify(existingUsers));
    return { success: true };
  };

  const login = (credentials: User) => {
    const existingUsers = JSON.parse(localStorage.getItem('sason_users') || '[]');
    const matchedUser = existingUsers.find((u: User) =>
      u.email === credentials.email &&
      u.password === btoa(credentials.password || '')
    );

    if (!matchedUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = matchedUser;
    setUser(safeUser);
    localStorage.setItem('sason_active_session', JSON.stringify(safeUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sason_active_session');
  };

  const deleteAccount = (email: string) => {
    const existingUsers = JSON.parse(localStorage.getItem('sason_users') || '[]');
    const updatedUsers = existingUsers.filter((u: User) => u.email !== email);
    localStorage.setItem('sason_users', JSON.stringify(updatedUsers));
    logout();
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
    <AuthContext.Provider value={{ user, login, register, logout, deleteAccount, updateUser }}>
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
