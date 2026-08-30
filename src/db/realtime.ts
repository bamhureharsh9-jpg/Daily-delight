// Real-time event bus with cross-tab broadcast
// Every emit also broadcasts to other tabs via syncManager
// Receivers re-emit locally with { source: 'remote' } so they don't re-broadcast

import { syncManager } from './sync';

type Handler = (payload: any, meta?: { source?: 'local' | 'remote' }) => void;

class Realtime {
  private listeners = new Map<string, Set<Handler>>();

  on(event: string, fn: Handler): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  emit(event: string, payload?: any, meta?: { source?: 'local' | 'remote' }): void {
    // Fire local listeners
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((fn) => {
        try { fn(payload, meta); } catch (e) { console.warn('listener error', e); }
      });
    }
    // Wildcard listeners
    const all = this.listeners.get('*');
    if (all) {
      all.forEach((fn) => {
        try { fn({ event, payload }, meta); } catch (e) {}
      });
    }
    // Cross-tab broadcast (skip if this is already a remote-sourced event)
    if (meta?.source !== 'remote') {
      syncManager.broadcast(event, payload);
    }
  }
}

export const realtime = new Realtime();

// Bridge: when syncManager receives a message from another tab, fire it locally
syncManager.subscribe((msg) => {
  realtime.emit(msg.type, msg.payload, { source: 'remote' });
});

// Initialize sync layer
if (typeof window !== 'undefined') {
  syncManager.init();
}

export const Events = {
  PRODUCTS_CHANGED: 'products:changed',
  CATEGORIES_CHANGED: 'categories:changed',
  ORDERS_CHANGED: 'orders:changed',
  PREVIEW_PRODUCT: 'preview:product',
  COUPONS_CHANGED: 'coupons:changed',
  DELIVERY_AREAS_CHANGED: 'delivery:changed',
  BANNERS_CHANGED: 'banners:changed',
  SETTINGS_CHANGED: 'settings:changed',
  USERS_CHANGED: 'users:changed',
  CART_CHANGED: 'cart:changed',
  ADDRESSES_CHANGED: 'addresses:changed',
  SESSION_CHANGED: 'session:changed',
} as const;
