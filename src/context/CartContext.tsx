import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (productId: string, quantity: number, maxStock: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'floristique_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Gagal menyimpan keranjang belanja:', e);
    }
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1): { success: boolean; message: string } => {
    if (product.stock <= 0) {
      return { success: false, message: 'Maaf, stok bunga ini sedang habis.' };
    }

    let success = true;
    let message = `Berhasil menambahkan ${product.name} ke keranjang!`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > product.stock) {
          success = false;
          message = `Maksimal pembelian untuk ${product.name} adalah ${product.stock} tangkai/rangkaian (stok terbatas).`;
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          product, // refresh product details & latest stock
        };
        return updated;
      } else {
        if (quantity > product.stock) {
          success = false;
          message = `Stok tersisa hanya ${product.stock}.`;
          return prevItems;
        }
        return [...prevItems, { product, quantity }];
      }
    });

    if (success) {
      setIsCartOpen(true);
    }

    return { success, message };
  };

  const updateQuantity = (productId: string, quantity: number, maxStock: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const validQty = Math.min(quantity, maxStock);
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: validQty } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
