import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../data/products';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from '../lib/firebase';

export interface CartItem {
  product: Product;
  size: string;
  color?: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string, quantity: number, color?: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number, color?: string) => void;
  removeFromCart: (productId: string, size: string, color?: string) => void;
  clearCart: () => void;
  buyNow: (product: Product, size: string, quantity: number, color?: string) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('agv_god_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Load from Firebase when user logs in
  useEffect(() => {
    const loadFirebaseCart = async () => {
      if (user) {
        try {
          const snapshot = await supabase.from('cart_items').select('*').eq('user_id', user.id);
          if (snapshot.data && snapshot.data.length > 0) {
            setCart(snapshot.data as CartItem[]);
          }
        } catch (err) {
           console.error("Error loading cart from Supabase", err);
        }
      }
    };
    loadFirebaseCart();
  }, [user]);

  // Handle guest user (e.g., save to LocalStorage instead)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('agv_god_cart', JSON.stringify(cart));
    }
  }, [cart, user]);

  const getDocId = (productId: string, size: string, color?: string) => {
    return `${productId}_${size}${color ? `_${color}` : ''}`;
  };

  const addToCart = async (product: Product, size: string, quantity: number, color?: string) => {
    const newQty = Math.min(5, quantity);
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size === size && item.color === color);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id && item.size === size && item.color === color
            ? { ...item, quantity: Math.min(5, item.quantity + quantity) } 
            : item
        );
      }
      return [...prev, { product, size, color, quantity: newQty }];
    });

    if (user) {
      try {
        const itemDocId = getDocId(product.id, size, color);
        const existing = cart.find(item => item.product.id === product.id && item.size === size && item.color === color);
        const finalQty = existing ? Math.min(5, existing.quantity + quantity) : newQty;
        
        await supabase.from('cart_items').upsert({
          id: itemDocId,
          user_id: user.id,
          product,
          size,
          color: color || null,
          quantity: finalQty
        });
      } catch (err) {
        console.error("Error adding to Supabase cart", err);
      }
    }
  };

  const buyNow = (product: Product, size: string, quantity: number, color?: string) => {
    setCart([{ product, size, color, quantity: Math.min(5, quantity) }]);
  };

  const updateQuantity = async (productId: string, size: string, quantity: number, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    const newQty = Math.min(5, quantity);
    setCart(prev => prev.map(item => 
      item.product.id === productId && item.size === size && item.color === color
        ? { ...item, quantity: newQty } 
        : item
    ));

    if (user) {
      try {
        const itemDocId = getDocId(productId, size, color);
        const item = cart.find(i => i.product.id === productId && i.size === size && i.color === color);
        if (item) {
          await supabase.from('cart_items').upsert({
            id: itemDocId,
            user_id: user.id,
            ...item,
            quantity: newQty
          });
        }
      } catch (err) {
        console.error("Error updating Supabase cart", err);
      }
    }
  };

  const removeFromCart = async (productId: string, size: string, color?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.size === size && item.color === color)));

    if (user) {
      try {
        const itemDocId = getDocId(productId, size, color);
        await supabase.from('cart_items').delete().eq('id', itemDocId);
      } catch (err) {
        console.error("Error removing from Supabase cart", err);
      }
    }
  };

  const clearCart = async () => {
    const currentCart = [...cart];
    setCart([]);
    
    if (user) {
      try {
        // Just delete all the user's cart items
        await supabase.from('cart_items').delete().eq('user_id', user.id);
      } catch (err) {
        console.error("Error clearing Supabase cart", err);
      }
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, buyNow, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
