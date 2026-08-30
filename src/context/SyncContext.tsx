import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { realtime, Events } from '../db/realtime';
import { syncManager, SyncMessage } from '../db/sync';
import { useAuth } from './AuthContext';

export interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  payload: any;
  source: 'local' | 'remote';
  origin: 'customer' | 'owner' | 'system' | 'unknown';
  ts: number;
  tabId?: string;
}

const MAX_ACTIVITY = 200;

const humanize = (type: string, payload: any): string => {
  const map: Record<string, (p: any) => string> = {
    [Events.PRODUCTS_CHANGED]: (p) => p?.id ? `Product updated (${p.id.slice(-4).toUpperCase()})` : 'Product catalog updated',
    [Events.ORDERS_CHANGED]: (p) => p?.id ? `Order #${p.id.slice(-6).toUpperCase()}` : 'Orders list updated',
    [Events.COUPONS_CHANGED]: () => 'Coupons updated',
    [Events.CATEGORIES_CHANGED]: () => 'Categories updated',
    [Events.BANNERS_CHANGED]: () => 'Banners updated',
    [Events.SETTINGS_CHANGED]: () => 'Store settings updated',
    [Events.DELIVERY_AREAS_CHANGED]: () => 'Delivery areas updated',
    [Events.USERS_CHANGED]: () => 'Customers updated',
    [Events.ADDRESSES_CHANGED]: () => 'Addresses updated',
    [Events.CART_CHANGED]: () => 'Cart updated',
    [Events.SESSION_CHANGED]: () => 'Session changed',
  };
  const fn = map[type];
  return fn ? fn(payload) : type;
};

interface SyncContextValue {
  activity: ActivityEntry[];
  lastSync: number | null;
  tabId: string;
  peerCount: number;
  isConnected: boolean;
  eventCount: number;
  clearActivity: () => void;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { actualRole } = useAuth();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const lastEventTypeRef = useRef<{ type: string; ts: number } | null>(null);

  // Periodically poll sync stats
  useEffect(() => {
    const update = () => {
      const info = syncManager.getInfo();
      setIsConnected(info.connected);
      setPeerCount(info.peerTabs.length);
    };
    const t = setInterval(update, 1500);
    update();
    return () => clearInterval(t);
  }, []);

  // Listen to all events
  useEffect(() => {
    const unsub = realtime.on('*', ({ event, payload }, meta) => {
      // Throttle duplicate consecutive events of the same type
      const now = Date.now();
      const last = lastEventTypeRef.current;
      if (last && last.type === event && now - last.ts < 50) {
        return;
      }
      lastEventTypeRef.current = { type: event, ts: now };

      // Determine origin: if it's a remote event, the origin is the OTHER tab's role.
      // We don't actually know the role of the other tab from the event alone, so we
      // tag it as 'remote' and let the UI show "from other tab".
      const isRemote = meta?.source === 'remote';
      const origin: ActivityEntry['origin'] = isRemote
        ? 'unknown'
        : (actualRole || 'system');

      const entry: ActivityEntry = {
        id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
        type: event,
        description: humanize(event, payload),
        payload,
        source: isRemote ? 'remote' : 'local',
        origin,
        ts: now,
      };
      setActivity((prev) => [entry, ...prev].slice(0, MAX_ACTIVITY));
      setLastSync(now);
    });
    return unsub;
  }, [actualRole]);

  const clearActivity = useCallback(() => setActivity([]), []);

  return (
    <SyncContext.Provider
      value={{
        activity,
        lastSync,
        tabId: syncManager.tabId,
        peerCount,
        isConnected,
        eventCount: activity.length,
        clearActivity,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
