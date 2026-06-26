import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

// Safe BigInt helper that works in all envs
function toBigInt(val) {
  try { return BigInt(val.toString()); } catch { return BigInt(0); }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('blockshop_cart') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('blockshop_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty > product.stock) { toast.error('Not enough stock'); return prev; }
        toast.success('Cart updated');
        return prev.map(i => i.id === product.id ? { ...i, qty: newQty } : i);
      }
      toast.success('Added to cart');
      return [...prev, {
        id: product.id,
        name: product.name,
        priceWei: product.priceWei ? product.priceWei.toString() : '0',
        priceEth: product.priceEth || '0',
        imageURI: product.imageURI,
        category: product.category,
        seller: product.seller,
        stock: product.stock,
        qty,
      }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Removed from cart');
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  // Calculate total in wei using string arithmetic to avoid BigInt ESLint issues
  const getTotalWei = () => {
    try {
      return items.reduce((s, i) => {
        const itemTotal = toBigInt(i.priceWei) * toBigInt(i.qty);
        return s + itemTotal;
      }, toBigInt(0));
    } catch { return toBigInt(0); }
  };

  const getTotalEth = () => {
    try {
      const { ethers } = require('ethers');
      return ethers.formatEther(getTotalWei().toString());
    } catch { return '0'; }
  };

  const inCart = (id) => items.some(i => i.id === id);

  return (
    <CartContext.Provider value={{
      items, addItem, updateQty, removeItem, clearCart,
      totalItems, getTotalWei, getTotalEth, inCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
