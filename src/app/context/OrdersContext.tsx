import React, { createContext, useContext, useState, useEffect } from 'react';

export type OrderStatus = 'Pending' | 'Completed' | 'Cancelled' | 'Issue';

export interface OrderItem {
  materialName: string;
  quantity: number;
}

export interface PurchaseOrder {
  id: string; // e.g., 'ORD-1001'
  dateOfOrder: string;
  orderReceivedDate: string | null;
  status: OrderStatus;
  items: OrderItem[];
}

interface OrdersContextType {
  orders: PurchaseOrder[];
  addOrder: (items: OrderItem[]) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('erp-purchase-orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    // Default initial mock data if empty
    return [
      {
        id: 'ORD-1001',
        dateOfOrder: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
        orderReceivedDate: null,
        status: 'Pending',
        items: [
          { materialName: 'Cotton Fabric', quantity: 50 },
          { materialName: 'Polyester Thread', quantity: 20 },
        ],
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('erp-purchase-orders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (items: OrderItem[]) => {
    const newId = `ORD-${1000 + orders.length + 1}`;
    const newOrder: PurchaseOrder = {
      id: newId,
      dateOfOrder: new Date().toISOString().split('T')[0],
      orderReceivedDate: null,
      status: 'Pending',
      items,
    };
    setOrders((prev) => [newOrder, ...prev]);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === id) {
          return {
            ...order,
            status,
            orderReceivedDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : null,
          };
        }
        return order;
      })
    );
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus, deleteOrder }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
