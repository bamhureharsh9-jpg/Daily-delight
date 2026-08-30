import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { cartApi, productApi, couponApi } from '../db/api';
import { realtime, Events } from '../db/realtime';
import { CartItem, Product, Coupon } from '../db/types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  items: CartItem[];
  products: Product[];
  add: (productId: string, qty?: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  clear: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  appliedCoupon: Coupon | null;
  discount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  isInCart: (productId: string) => boolean;
  getQty: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const refresh = useCallback(async () => {
    const ps = await productApi.list();
    setAllProducts(ps);
    if (user && user.role === 'customer') {
      const cart = await cartApi.get(user.id);
      setItems(cart.items);
    } else {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsub1 = realtime.on(Events.CART_CHANGED, () => refresh());
    const unsub2 = realtime.on(Events.PRODUCTS_CHANGED, () => refresh());
    return () => {
      unsub1();
      unsub2();
    };
  }, [refresh]);

  const products = useMemo(
    () => items.map((i) => allProducts.find((p) => p.id === i.productId)).filter(Boolean) as Product[],
    [items, allProducts]
  );

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => {
    const p = allProducts.find((x) => x.id === i.productId);
    return s + (p ? p.price * i.quantity : 0);
  }, 0);

  const persist = useCallback(
    async (next: CartItem[]) => {
      setItems(next);
      if (user && user.role === 'customer') {
        await cartApi.setItems(user.id, next);
      }
    },
    [user]
  );

  const add = useCallback(
    async (productId: string, qty = 1) => {
      const existing = items.find((i) => i.productId === productId);
      const next = existing
        ? items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + qty } : i))
        : [...items, { productId, quantity: qty }];
      await persist(next);
    },
    [items, persist]
  );

  const remove = useCallback(
    async (productId: string) => {
      const next = items.filter((i) => i.productId !== productId);
      await persist(next);
    },
    [items, persist]
  );

  const setQty = useCallback(
    async (productId: string, qty: number) => {
      if (qty <= 0) {
        await remove(productId);
        return;
      }
      const next = items.find((i) => i.productId === productId)
        ? items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
        : [...items, { productId, quantity: qty }];
      await persist(next);
    },
    [items, persist, remove]
  );

  const clear = useCallback(async () => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscount(0);
    if (user && user.role === 'customer') {
      await cartApi.clear(user.id);
    }
  }, [user]);

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        const { coupon, discount: d } = await couponApi.apply(code, subtotal);
        setAppliedCoupon(coupon);
        setDiscount(d);
        return { success: true, message: `Coupon applied! You saved ₹${d}` };
      } catch (e: any) {
        return { success: false, message: e.message || 'Invalid coupon' };
      }
    },
    [subtotal]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscount(0);
  }, []);

  const isInCart = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);
  const getQty = useCallback((productId: string) => items.find((i) => i.productId === productId)?.quantity || 0, [items]);

  return (
    <CartContext.Provider
      value={{
        items, products, add, remove, setQty, clear,
        totalItems, subtotal,
        appliedCoupon, discount, applyCoupon, removeCoupon,
        isInCart, getQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
