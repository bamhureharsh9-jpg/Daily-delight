// API layer
// ---------------------------------------------------------------
// When API_CONFIG.useMockData is true  -> uses the built-in
//   AsyncStorage mock backend below (zero config, works offline).
// When API_CONFIG.useMockData is false -> routes every call to
//   your real backend at API_CONFIG.baseUrl.
//
// To switch to a real backend:
//   1. Open src/api/config.ts
//   2. Set useMockData: false
//   3. Set baseUrl: 'https://your-server.com'
//   4. Make sure your server implements the routes listed in
//      INTEGRATION.md (see /api routes section).
// No other file in the app needs to change.
// ---------------------------------------------------------------

import { loadDB, updateDB, saveDB } from './database';
import { Events, realtime } from './realtime';
import API_CONFIG from '../api/config';
import { api, setAuthToken, ApiError } from '../api/client';
import {
  User, UserRole, Product, Category, Order, OrderStatus, PaymentMethod,
  Coupon, Address, DeliveryArea, Banner, AppSettings, CartItem
} from './types';

const SIM_DELAY = 80; // ms - simulates network latency

const delay = <T>(value: T): Promise<T> =>
  new Promise((res) => setTimeout(() => res(value), SIM_DELAY));

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

// ============ AUTH ============
export let authApi = {
  async signup(data: { name: string; email: string; phone: string; password: string; role: UserRole }) {
    const db = await loadDB();
    if (db.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('Email already registered');
    }
    if (db.users.some((u) => u.phone === data.phone)) {
      throw new Error('Phone already registered');
    }
    const user: User = {
      id: uid('u'),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      password: data.password,
      role: data.role,
      createdAt: now(),
    };
    await updateDB((d) => {
      d.users.push(user);
      d.session = { userId: user.id, role: user.role };
    });
    realtime.emit(Events.SESSION_CHANGED, { userId: user.id, role: user.role });
    realtime.emit(Events.USERS_CHANGED, null);
    return delay(user);
  },

  async login(emailOrPhone: string, password: string, role: UserRole) {
    const db = await loadDB();
    const id = emailOrPhone.toLowerCase().trim();
    const user = db.users.find(
      (u) =>
        u.role === role &&
        ((u.email === id) || (u.phone === emailOrPhone.trim())) &&
        u.password === password
    );
    if (!user) throw new Error('Invalid credentials or role');
    if (user.blocked) throw new Error('Account blocked. Contact support.');
    await updateDB((d) => {
      d.session = { userId: user.id, role: user.role };
    });
    realtime.emit(Events.SESSION_CHANGED, { userId: user.id, role: user.role });
    return delay(user);
  },

  async logout() {
    await updateDB((d) => {
      d.session = null;
    });
    realtime.emit(Events.SESSION_CHANGED, null);
    return delay(true);
  },

  async getSession() {
    const db = await loadDB();
    return delay(db.session);
  },

  async getCurrentUser(): Promise<User | null> {
    const db = await loadDB();
    if (!db.session) return delay(null);
    return delay(db.users.find((u) => u.id === db.session!.userId) || null);
  },
};

// ============ USERS / CUSTOMERS ============
export let userApi = {
  async list(role?: UserRole) {
    const db = await loadDB();
    const list = role ? db.users.filter((u) => u.role === role) : db.users;
    return delay(list.map(({ password, ...u }) => u));
  },

  async getById(id: string) {
    const db = await loadDB();
    const u = db.users.find((x) => x.id === id);
    return delay(u ? { ...u, password: undefined } : null);
  },

  async update(id: string, patch: Partial<User>) {
    let updated: User | null = null;
    await updateDB((d) => {
      const idx = d.users.findIndex((u) => u.id === id);
      if (idx >= 0) {
        d.users[idx] = { ...d.users[idx], ...patch };
        updated = d.users[idx];
      }
    });
    realtime.emit(Events.USERS_CHANGED, { id });
    return delay(updated);
  },

  async toggleBlock(id: string) {
    let updated: User | null = null;
    await updateDB((d) => {
      const idx = d.users.findIndex((u) => u.id === id);
      if (idx >= 0) {
        d.users[idx].blocked = !d.users[idx].blocked;
        updated = d.users[idx];
      }
    });
    realtime.emit(Events.USERS_CHANGED, { id });
    return delay(updated);
  },
};

// ============ CATEGORIES ============
export let categoryApi = {
  async list() {
    const db = await loadDB();
    return delay(db.categories.filter((c) => c.active).sort((a, b) => a.order - b.order));
  },
  async listAll() {
    const db = await loadDB();
    return delay(db.categories.sort((a, b) => a.order - b.order));
  },
  async create(data: Omit<Category, 'id'>) {
    const c: Category = { ...data, id: uid('cat') };
    await updateDB((d) => {
      d.categories.push(c);
    });
    realtime.emit(Events.CATEGORIES_CHANGED, null);
    return delay(c);
  },
  async update(id: string, patch: Partial<Category>) {
    let c: Category | null = null;
    await updateDB((d) => {
      const idx = d.categories.findIndex((x) => x.id === id);
      if (idx >= 0) {
        d.categories[idx] = { ...d.categories[idx], ...patch };
        c = d.categories[idx];
      }
    });
    realtime.emit(Events.CATEGORIES_CHANGED, null);
    return delay(c);
  },
  async remove(id: string) {
    await updateDB((d) => {
      d.categories = d.categories.filter((c) => c.id !== id);
    });
    realtime.emit(Events.CATEGORIES_CHANGED, null);
    return delay(true);
  },
};

// ============ PRODUCTS ============
export let productApi = {
  async list(opts?: { categoryId?: string; search?: string; activeOnly?: boolean }) {
    const db = await loadDB();
    let list = db.products.slice();
    if (opts?.activeOnly) list = list.filter((p) => p.active);
    if (opts?.categoryId) list = list.filter((p) => p.categoryId === opts.categoryId);
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return delay(list);
  },

  async getById(id: string) {
    const db = await loadDB();
    return delay(db.products.find((p) => p.id === id) || null);
  },

  async featured() {
    const db = await loadDB();
    return delay(db.products.filter((p) => p.featured && p.active));
  },

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const p: Product = { ...data, id: uid('p'), createdAt: now(), updatedAt: now() };
    await updateDB((d) => {
      d.products.push(p);
    });
    realtime.emit(Events.PRODUCTS_CHANGED, null);
    return delay(p);
  },

  async update(id: string, patch: Partial<Product>) {
    let p: Product | null = null;
    await updateDB((d) => {
      const idx = d.products.findIndex((x) => x.id === id);
      if (idx >= 0) {
        d.products[idx] = { ...d.products[idx], ...patch, updatedAt: now() };
        p = d.products[idx];
      }
    });
    realtime.emit(Events.PRODUCTS_CHANGED, { id });
    return delay(p);
  },

  async setStock(id: string, stock: number) {
    return productApi.update(id, { stock });
  },

  async toggleActive(id: string) {
    const db = await loadDB();
    const p = db.products.find((x) => x.id === id);
    if (!p) return delay(null);
    return productApi.update(id, { active: !p.active });
  },

  async remove(id: string) {
    await updateDB((d) => {
      d.products = d.products.filter((p) => p.id !== id);
    });
    realtime.emit(Events.PRODUCTS_CHANGED, null);
    return delay(true);
  },
};

// ============ CART ============
export let cartApi = {
  async get(userId: string) {
    const db = await loadDB();
    return delay(db.carts.find((c) => c.userId === userId) || { userId, items: [], updatedAt: now() });
  },

  async setItems(userId: string, items: CartItem[]) {
    await updateDB((d) => {
      const idx = d.carts.findIndex((c) => c.userId === userId);
      const cart = { userId, items, updatedAt: now() };
      if (idx >= 0) d.carts[idx] = cart;
      else d.carts.push(cart);
    });
    realtime.emit(Events.CART_CHANGED, { userId });
    return delay(items);
  },

  async clear(userId: string) {
    return cartApi.setItems(userId, []);
  },
};

// ============ ORDERS ============
export let orderApi = {
  async list(opts?: { userId?: string; status?: OrderStatus }) {
    const db = await loadDB();
    let list = db.orders.slice();
    if (opts?.userId) list = list.filter((o) => o.userId === opts.userId);
    if (opts?.status) list = list.filter((o) => o.status === opts.status);
    return delay(list.sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt)));
  },

  async getById(id: string) {
    const db = await loadDB();
    return delay(db.orders.find((o) => o.id === id) || null);
  },

  async place(data: Omit<Order, 'id' | 'placedAt' | 'timeline' | 'status' | 'paymentStatus'>) {
    const order: Order = {
      ...data,
      id: uid('ord'),
      placedAt: now(),
      paymentStatus: data.paymentMethod === 'cod' ? 'pending' : 'paid',
      status: 'placed',
      timeline: [{ status: 'placed', at: now() }],
    };
    await updateDB((d) => {
      d.orders.push(order);
      // Decrement stock
      order.items.forEach((item) => {
        const p = d.products.find((x) => x.id === item.productId);
        if (p) p.stock = Math.max(0, p.stock - item.quantity);
      });
      // Clear cart
      const ci = d.carts.findIndex((c) => c.userId === data.userId);
      if (ci >= 0) d.carts[ci].items = [];
    });
    realtime.emit(Events.ORDERS_CHANGED, { id: order.id });
    realtime.emit(Events.PRODUCTS_CHANGED, null);
    realtime.emit(Events.CART_CHANGED, { userId: data.userId });
    return delay(order);
  },

  async setStatus(id: string, status: OrderStatus, note?: string) {
    let o: Order | null = null;
    await updateDB((d) => {
      const idx = d.orders.findIndex((x) => x.id === id);
      if (idx >= 0) {
        d.orders[idx].status = status;
        d.orders[idx].timeline.push({ status, at: now(), note });
        o = d.orders[idx];
      }
    });
    realtime.emit(Events.ORDERS_CHANGED, { id });
    return delay(o);
  },

  async setPaymentStatus(id: string, paymentStatus: 'pending' | 'paid' | 'failed') {
    let o: Order | null = null;
    await updateDB((d) => {
      const idx = d.orders.findIndex((x) => x.id === id);
      if (idx >= 0) {
        d.orders[idx].paymentStatus = paymentStatus;
        o = d.orders[idx];
      }
    });
    realtime.emit(Events.ORDERS_CHANGED, { id });
    return delay(o);
  },

  async stats() {
    const db = await loadDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = db.orders.filter((o) => +new Date(o.placedAt) >= +today);
    const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const pending = db.orders.filter((o) => ['placed', 'confirmed', 'packed'].includes(o.status)).length;
    const active = db.orders.filter((o) => o.status === 'out_for_delivery').length;
    return delay({
      totalOrders: db.orders.length,
      todayOrders: todayOrders.length,
      revenue,
      pending,
      active,
      customers: db.users.filter((u) => u.role === 'customer').length,
      products: db.products.length,
      lowStock: db.products.filter((p) => p.stock < 30).length,
    });
  },
};

// ============ COUPONS ============
export let couponApi = {
  async list() {
    const db = await loadDB();
    return delay(db.coupons);
  },
  async active() {
    const db = await loadDB();
    const t = now();
    return delay(
      db.coupons.filter(
        (c) => c.active && c.validFrom <= t && c.validTill >= t && (!c.usageLimit || c.usedCount < c.usageLimit)
      )
    );
  },
  async getByCode(code: string) {
    const db = await loadDB();
    const c = db.coupons.find((x) => x.code.toUpperCase() === code.toUpperCase());
    return delay(c || null);
  },
  async create(data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>) {
    const c: Coupon = { ...data, id: uid('cp'), usedCount: 0, createdAt: now() };
    await updateDB((d) => {
      d.coupons.push(c);
    });
    realtime.emit(Events.COUPONS_CHANGED, null);
    return delay(c);
  },
  async update(id: string, patch: Partial<Coupon>) {
    let c: Coupon | null = null;
    await updateDB((d) => {
      const idx = d.coupons.findIndex((x) => x.id === id);
      if (idx >= 0) {
        d.coupons[idx] = { ...d.coupons[idx], ...patch };
        c = d.coupons[idx];
      }
    });
    realtime.emit(Events.COUPONS_CHANGED, null);
    return delay(c);
  },
  async remove(id: string) {
    await updateDB((d) => {
      d.coupons = d.coupons.filter((c) => c.id !== id);
    });
    realtime.emit(Events.COUPONS_CHANGED, null);
    return delay(true);
  },
  async apply(code: string, subtotal: number) {
    const c = await couponApi.getByCode(code);
    if (!c) throw new Error('Invalid coupon code');
    if (!c.active) throw new Error('Coupon is no longer active');
    const t = now();
    if (c.validFrom > t) throw new Error('Coupon not yet valid');
    if (c.validTill < t) throw new Error('Coupon has expired');
    if (subtotal < c.minOrder) throw new Error(`Add items worth ₹${c.minOrder - subtotal} more to use this coupon`);
    if (c.usageLimit && c.usedCount >= c.usageLimit) throw new Error('Coupon usage limit reached');

    let discount = 0;
    if (c.type === 'flat') discount = c.value;
    else if (c.type === 'percent') {
      discount = Math.floor((subtotal * c.value) / 100);
      if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
    }
    return delay({ coupon: c, discount });
  },
  async incrementUsage(id: string) {
    await updateDB((d) => {
      const c = d.coupons.find((x) => x.id === id);
      if (c) c.usedCount += 1;
    });
    realtime.emit(Events.COUPONS_CHANGED, null);
  },
};

// ============ ADDRESSES ============
export let addressApi = {
  async listForUser(userId: string) {
    const db = await loadDB();
    return delay(db.addresses.filter((a) => a.userId === userId));
  },
  async add(userId: string, data: Omit<Address, 'id' | 'userId'>) {
    const a: Address = { ...data, id: uid('a'), userId };
    await updateDB((d) => {
      if (a.isDefault) d.addresses.forEach((x) => (x.isDefault = false));
      d.addresses.push(a);
    });
    realtime.emit(Events.ADDRESSES_CHANGED, { userId });
    return delay(a);
  },
  async update(id: string, patch: Partial<Address>) {
    let a: Address | null = null;
    await updateDB((d) => {
      const idx = d.addresses.findIndex((x) => x.id === id);
      if (idx >= 0) {
        if (patch.isDefault) d.addresses.forEach((x) => (x.isDefault = false));
        d.addresses[idx] = { ...d.addresses[idx], ...patch };
        a = d.addresses[idx];
      }
    });
    realtime.emit(Events.ADDRESSES_CHANGED, { userId: a?.userId });
    return delay(a);
  },
  async remove(id: string) {
    let userId: string | undefined;
    await updateDB((d) => {
      const a = d.addresses.find((x) => x.id === id);
      userId = a?.userId;
      d.addresses = d.addresses.filter((x) => x.id !== id);
    });
    realtime.emit(Events.ADDRESSES_CHANGED, { userId });
    return delay(true);
  },
};

// ============ DELIVERY AREAS ============
export let deliveryApi = {
  async list() {
    const db = await loadDB();
    return delay(db.deliveryAreas);
  },
  async checkPincode(pincode: string) {
    const db = await loadDB();
    const a = db.deliveryAreas.find((x) => x.pincode === pincode);
    return delay(a || null);
  },
  async create(data: Omit<DeliveryArea, 'id'>) {
    const a: DeliveryArea = { ...data, id: uid('da') };
    await updateDB((d) => {
      d.deliveryAreas.push(a);
    });
    realtime.emit(Events.DELIVERY_AREAS_CHANGED, null);
    return delay(a);
  },
  async update(id: string, patch: Partial<DeliveryArea>) {
    let a: DeliveryArea | null = null;
    await updateDB((d) => {
      const idx = d.deliveryAreas.findIndex((x) => x.id === id);
      if (idx >= 0) {
        d.deliveryAreas[idx] = { ...d.deliveryAreas[idx], ...patch };
        a = d.deliveryAreas[idx];
      }
    });
    realtime.emit(Events.DELIVERY_AREAS_CHANGED, null);
    return delay(a);
  },
  async remove(id: string) {
    await updateDB((d) => {
      d.deliveryAreas = d.deliveryAreas.filter((a) => a.id !== id);
    });
    realtime.emit(Events.DELIVERY_AREAS_CHANGED, null);
    return delay(true);
  },
};

// ============ BANNERS ============
export let bannerApi = {
  async list() {
    const db = await loadDB();
    return delay(db.banners.filter((b) => b.active).sort((a, b) => a.order - b.order));
  },
  async listAll() {
    const db = await loadDB();
    return delay(db.banners.sort((a, b) => a.order - b.order));
  },
  async create(data: Omit<Banner, 'id'>) {
    const b: Banner = { ...data, id: uid('b') };
    await updateDB((d) => {
      d.banners.push(b);
    });
    realtime.emit(Events.BANNERS_CHANGED, null);
    return delay(b);
  },
  async update(id: string, patch: Partial<Banner>) {
    let b: Banner | null = null;
    await updateDB((d) => {
      const idx = d.banners.findIndex((x) => x.id === id);
      if (idx >= 0) {
        d.banners[idx] = { ...d.banners[idx], ...patch };
        b = d.banners[idx];
      }
    });
    realtime.emit(Events.BANNERS_CHANGED, null);
    return delay(b);
  },
  async remove(id: string) {
    await updateDB((d) => {
      d.banners = d.banners.filter((b) => b.id !== id);
    });
    realtime.emit(Events.BANNERS_CHANGED, null);
    return delay(true);
  },
};

// ============ SETTINGS ============
export let settingsApi = {
  async get() {
    const db = await loadDB();
    return delay(db.settings);
  },
  async update(patch: Partial<AppSettings>) {
    let s: AppSettings | null = null;
    await updateDB((d) => {
      d.settings = { ...d.settings, ...patch };
      s = d.settings;
    });
    realtime.emit(Events.SETTINGS_CHANGED, null);
    return delay(s);
  },
};

// ============================================================================
// REAL BACKEND ROUTING
// ============================================================================
// When useMockData is false, every call below goes over HTTP to your backend
// at API_CONFIG.baseUrl. The exported function names and signatures are
// IDENTICAL to the mock versions above, so the rest of the app doesn't change.
// ============================================================================

// Types are already imported at the top of the file

// ---------- LIVE: AUTH ----------
const liveAuth = {
  async signup(data: { name: string; email: string; phone: string; password: string; role: UserRole }) {
    const res = await api.post<{ user: User; token: string }>('/auth/signup', data);
    setAuthToken(res.token);
    realtime.emit(Events.SESSION_CHANGED, { userId: res.user.id, role: res.user.role });
    realtime.emit(Events.USERS_CHANGED, null);
    return res.user;
  },
  async login(emailOrPhone: string, password: string, role: UserRole) {
    const res = await api.post<{ user: User; token: string }>('/auth/login', { emailOrPhone, password, role });
    setAuthToken(res.token);
    realtime.emit(Events.SESSION_CHANGED, { userId: res.user.id, role: res.user.role });
    return res.user;
  },
  async logout() {
    try { await api.post('/auth/logout'); } catch (e) { /* ignore */ }
    setAuthToken(null);
    realtime.emit(Events.SESSION_CHANGED, null);
    return true;
  },
  async getSession() {
    try { return await api.get<any>('/auth/session'); } catch { return null; }
  },
  async getCurrentUser(): Promise<User | null> {
    try { return await api.get<User>('/auth/me'); } catch { return null; }
  },
};

// ---------- LIVE: USERS ----------
const liveUser = {
  async list(role?: UserRole) {
    return api.get<User[]>('/users', { role });
  },
  async getById(id: string) {
    return api.get<User>(`/users/${id}`);
  },
  async update(id: string, patch: Partial<User>) {
    const u = await api.patch<User>(`/users/${id}`, patch);
    realtime.emit(Events.USERS_CHANGED, { id });
    return u;
  },
  async toggleBlock(id: string) {
    const u = await api.post<User>(`/users/${id}/toggle-block`);
    realtime.emit(Events.USERS_CHANGED, { id });
    return u;
  },
};

// ---------- LIVE: CATEGORIES ----------
const liveCategory = {
  async list() { return api.get<Category[]>('/categories', { active: true }); },
  async listAll() { return api.get<Category[]>('/categories'); },
  async create(data: Omit<Category, 'id'>) {
    const c = await api.post<Category>('/categories', data);
    realtime.emit(Events.CATEGORIES_CHANGED, null);
    return c;
  },
  async update(id: string, patch: Partial<Category>) {
    const c = await api.patch<Category>(`/categories/${id}`, patch);
    realtime.emit(Events.CATEGORIES_CHANGED, null);
    return c;
  },
  async remove(id: string) {
    await api.del(`/categories/${id}`);
    realtime.emit(Events.CATEGORIES_CHANGED, null);
    return true;
  },
};

// ---------- LIVE: PRODUCTS ----------
const liveProduct = {
  async list(opts?: { categoryId?: string; search?: string; activeOnly?: boolean }) {
    return api.get<Product[]>('/products', { ...opts, activeOnly: opts?.activeOnly ? 1 : undefined });
  },
  async getById(id: string) { return api.get<Product>(`/products/${id}`); },
  async featured() { return api.get<Product[]>('/products/featured'); },
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const p = await api.post<Product>('/products', data);
    realtime.emit(Events.PRODUCTS_CHANGED, null);
    return p;
  },
  async update(id: string, patch: Partial<Product>) {
    const p = await api.patch<Product>(`/products/${id}`, patch);
    realtime.emit(Events.PRODUCTS_CHANGED, { id });
    return p;
  },
  async setStock(id: string, stock: number) { return liveProduct.update(id, { stock }); },
  async toggleActive(id: string) { return liveProduct.update(id, {}); }, // server toggles
  async remove(id: string) {
    await api.del(`/products/${id}`);
    realtime.emit(Events.PRODUCTS_CHANGED, null);
    return true;
  },
};

// ---------- LIVE: CART ----------
const liveCart = {
  async get(userId: string) {
    return api.get<{ userId: string; items: CartItem[]; updatedAt: string }>(`/cart/${userId}`);
  },
  async setItems(userId: string, items: CartItem[]) {
    const r = await api.put(`/cart/${userId}`, { items });
    realtime.emit(Events.CART_CHANGED, { userId });
    return r;
  },
  async clear(userId: string) { return liveCart.setItems(userId, []); },
};

// ---------- LIVE: ORDERS ----------
const liveOrder = {
  async list(opts?: { userId?: string; status?: OrderStatus }) {
    return api.get<Order[]>('/orders', opts);
  },
  async getById(id: string) { return api.get<Order>(`/orders/${id}`); },
  async place(data: any) {
    const order = await api.post<Order>('/orders', data);
    realtime.emit(Events.ORDERS_CHANGED, { id: order.id });
    realtime.emit(Events.PRODUCTS_CHANGED, null);
    realtime.emit(Events.CART_CHANGED, { userId: data.userId });
    return order;
  },
  async setStatus(id: string, status: OrderStatus, note?: string) {
    const o = await api.patch<Order>(`/orders/${id}/status`, { status, note });
    realtime.emit(Events.ORDERS_CHANGED, { id });
    return o;
  },
  async setPaymentStatus(id: string, paymentStatus: 'pending' | 'paid' | 'failed') {
    const o = await api.patch<Order>(`/orders/${id}/payment`, { paymentStatus });
    realtime.emit(Events.ORDERS_CHANGED, { id });
    return o;
  },
  async stats() { return api.get<any>('/orders/stats'); },
};

// ---------- LIVE: COUPONS ----------
const liveCoupon = {
  async list() { return api.get<Coupon[]>('/coupons'); },
  async active() { return api.get<Coupon[]>('/coupons/active'); },
  async getByCode(code: string) {
    try { return await api.get<Coupon>(`/coupons/by-code/${encodeURIComponent(code)}`); }
    catch { return null; }
  },
  async create(data: any) {
    const c = await api.post<Coupon>('/coupons', data);
    realtime.emit(Events.COUPONS_CHANGED, null);
    return c;
  },
  async update(id: string, patch: Partial<Coupon>) {
    const c = await api.patch<Coupon>(`/coupons/${id}`, patch);
    realtime.emit(Events.COUPONS_CHANGED, null);
    return c;
  },
  async remove(id: string) {
    await api.del(`/coupons/${id}`);
    realtime.emit(Events.COUPONS_CHANGED, null);
    return true;
  },
  async apply(code: string, subtotal: number) {
    return api.post<{ coupon: Coupon; discount: number }>('/coupons/apply', { code, subtotal });
  },
  async incrementUsage(id: string) {
    await api.post(`/coupons/${id}/increment`);
    realtime.emit(Events.COUPONS_CHANGED, null);
  },
};

// ---------- LIVE: ADDRESSES ----------
const liveAddress = {
  async listForUser(userId: string) { return api.get<Address[]>(`/addresses`, { userId }); },
  async add(userId: string, data: any) {
    const a = await api.post<Address>('/addresses', { ...data, userId });
    realtime.emit(Events.ADDRESSES_CHANGED, { userId });
    return a;
  },
  async update(id: string, patch: Partial<Address>) {
    const a = await api.patch<Address>(`/addresses/${id}`, patch);
    realtime.emit(Events.ADDRESSES_CHANGED, { userId: a.userId });
    return a;
  },
  async remove(id: string) {
    let userId: string | undefined;
    try {
      const a = await api.get<Address>(`/addresses/${id}`);
      userId = a.userId;
    } catch {}
    await api.del(`/addresses/${id}`);
    realtime.emit(Events.ADDRESSES_CHANGED, { userId });
    return true;
  },
};

// ---------- LIVE: DELIVERY AREAS ----------
const liveDelivery = {
  async list() { return api.get<DeliveryArea[]>('/delivery-areas'); },
  async checkPincode(pincode: string) {
    try { return await api.get<DeliveryArea>(`/delivery-areas/check/${pincode}`); }
    catch { return null; }
  },
  async create(data: any) {
    const a = await api.post<DeliveryArea>('/delivery-areas', data);
    realtime.emit(Events.DELIVERY_AREAS_CHANGED, null);
    return a;
  },
  async update(id: string, patch: Partial<DeliveryArea>) {
    const a = await api.patch<DeliveryArea>(`/delivery-areas/${id}`, patch);
    realtime.emit(Events.DELIVERY_AREAS_CHANGED, null);
    return a;
  },
  async remove(id: string) {
    await api.del(`/delivery-areas/${id}`);
    realtime.emit(Events.DELIVERY_AREAS_CHANGED, null);
    return true;
  },
};

// ---------- LIVE: BANNERS ----------
const liveBanner = {
  async list() { return api.get<Banner[]>('/banners', { active: true }); },
  async listAll() { return api.get<Banner[]>('/banners'); },
  async create(data: any) {
    const b = await api.post<Banner>('/banners', data);
    realtime.emit(Events.BANNERS_CHANGED, null);
    return b;
  },
  async update(id: string, patch: Partial<Banner>) {
    const b = await api.patch<Banner>(`/banners/${id}`, patch);
    realtime.emit(Events.BANNERS_CHANGED, null);
    return b;
  },
  async remove(id: string) {
    await api.del(`/banners/${id}`);
    realtime.emit(Events.BANNERS_CHANGED, null);
    return true;
  },
};

// ---------- LIVE: SETTINGS ----------
const liveSettings = {
  async get() { return api.get<AppSettings>('/settings'); },
  async update(patch: Partial<AppSettings>) {
    const s = await api.patch<AppSettings>('/settings', patch);
    realtime.emit(Events.SETTINGS_CHANGED, null);
    return s;
  },
};

// ---------- SWAP TO LIVE IF CONFIGURED ----------
// The mock implementations above are declared with `let` so we can
// reassign them to the live network-backed implementations when
// API_CONFIG.useMockData is false.
if (!API_CONFIG.useMockData) {
  authApi = liveAuth as any;
  userApi = liveUser as any;
  categoryApi = liveCategory as any;
  productApi = liveProduct as any;
  cartApi = liveCart as any;
  orderApi = liveOrder as any;
  couponApi = liveCoupon as any;
  addressApi = liveAddress as any;
  deliveryApi = liveDelivery as any;
  bannerApi = liveBanner as any;
  settingsApi = liveSettings as any;
}

// Re-export the error class so screens can catch it specifically
export { ApiError } from '../api/client';

