"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, getAllOrdersAPI } from '@/lib/api';

type OrderContextType = {
  orders: Order[];
  reloadOrders: () => Promise<void>;
  updateOrderState: (poNumber: string, updates: Partial<Order>) => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const reloadOrders = async () => {
    const fetched = await getAllOrdersAPI();
    setOrders(fetched);
  };

  useEffect(() => {
    reloadOrders();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedOrders') {
        reloadOrders();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen to window storage events dispatched programmatically
    window.addEventListener('storage', reloadOrders);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage', reloadOrders);
    };
  }, []);

  const updateOrderState = (poNumber: string, updates: Partial<Order>) => {
    setOrders(prev => {
      const updated = prev.map(o => o.poNumber === poNumber ? { ...o, ...updates } : o);
      localStorage.setItem('savedOrders', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return updated;
    });
  };

  return (
    <OrderContext.Provider value={{ orders, reloadOrders, updateOrderState }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
