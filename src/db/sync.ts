// Cross-tab / cross-window sync layer using BroadcastChannel
// This makes two separate browser tabs/windows behave like two separate apps
// connected to the same backend in real-time.

const CHANNEL_NAME = 'dailydelight-realtime-v2';
const STORAGE_KEY = '@dailydelight/realtime-event-v2';

export interface SyncMessage {
  id: string;
  type: string;
  payload: any;
  source: string;
  ts: number;
}

class SyncManager {
  private channel: BroadcastChannel | null = null;
  public tabId: string;
  private listeners: Set<(msg: SyncMessage) => void> = new Set();
  private _connected: boolean = false;
  private _lastMessage: SyncMessage | null = null;
  private _messageCount: number = 0;
  private _peerTabs: Set<string> = new Set();
  private heartbeatInterval: any = null;

  constructor() {
    this.tabId = `tab-${Date.now().toString(36).slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  init() {
    if (typeof window === 'undefined') return;

    // Primary: BroadcastChannel (modern browsers)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.addEventListener('message', (e) => this.handleMessage(e.data));
        this._connected = true;
      }
    } catch (e) {
      console.warn('[sync] BroadcastChannel failed', e);
    }

    // Fallback: localStorage 'storage' event (different tab fires this)
    if (typeof window.addEventListener !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.handleMessage(JSON.parse(e.newValue));
          } catch (err) {}
        }
      });
    }

    // Announce ourselves
    this.broadcast('__hello__', { from: this.tabId });

    // Heartbeat to discover peers
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('__heartbeat__', { from: this.tabId });
    }, 3000);
  }

  private handleMessage(msg: SyncMessage) {
    if (!msg || msg.source === this.tabId) return;
    if (msg.type === '__heartbeat__' || msg.type === '__hello__') {
      this._peerTabs.add(msg.source);
      // Reply so the other side knows about us too
      if (msg.type === '__hello__') {
        this.broadcast('__heartbeat__', { from: this.tabId, to: msg.source });
      }
      return;
    }
    this._lastMessage = msg;
    this._messageCount++;
    this._peerTabs.add(msg.source);
    this.listeners.forEach((fn) => {
      try { fn(msg); } catch (e) { console.warn('[sync] listener error', e); }
    });
  }

  broadcast(type: string, payload: any) {
    const msg: SyncMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      payload,
      source: this.tabId,
      ts: Date.now(),
    };
    // Send via BroadcastChannel
    if (this.channel) {
      try { this.channel.postMessage(msg); } catch (e) {}
    }
    // Also use storage event as backup
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(msg));
        setTimeout(() => {
          try { localStorage.removeItem(STORAGE_KEY); } catch {}
        }, 80);
      }
    } catch {}
  }

  subscribe(fn: (msg: SyncMessage) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getInfo() {
    return {
      tabId: this.tabId,
      connected: this._connected,
      lastMessage: this._lastMessage,
      messageCount: this._messageCount,
      peerTabs: Array.from(this._peerTabs),
    };
  }
}

export const syncManager = new SyncManager();
