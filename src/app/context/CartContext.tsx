import React, { createContext, useContext, useState, useEffect } from 'react';
import { defaultPrestitchedGarments } from '../components/garmentsData';
export interface CartItem {
  id: string;
  productId: number;
  name: string;
  sku: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  status: 'Processing' | 'Cancelled' | 'Delivered';
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  placeOrder: () => void;
  cancelOrder: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('erp-cart-items');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed)) {
          return parsed.map((item: CartItem) => {
            if (item.price === undefined) {
              const defaultGarment = defaultPrestitchedGarments.find((g: any) => g.id === item.productId || g.id === item.id);
              return { ...item, price: defaultGarment?.price || 499 };
            }
            return item;
          });
        }
      } catch (e) { /* ignore */ }
    }
    return [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('erp-orders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('erp-cart-items', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('erp-orders', JSON.stringify(orders));
  }, [orders]);

  const addToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.productId === newItem.productId && item.size === newItem.size && item.color === newItem.color);
      if (existingItem) {
        return prev.map(item => 
          item.id === existingItem.id 
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + ((item.price || 0) * item.quantity), 0);

  const placeOrder = () => {
    if (cartItems.length === 0) return;
    
    const gst = cartTotal * 0.05; // 5% GST
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: [...cartItems],
      subtotal: cartTotal,
      gst,
      total: cartTotal + gst,
      status: 'Processing',
    };
    
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
  };

  const cancelOrder = (id: string) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status: 'Cancelled' } : order));
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      orders,
      placeOrder,
      cancelOrder
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
