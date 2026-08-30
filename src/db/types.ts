// All TypeScript interfaces for Daily Delight

export type UserRole = 'customer' | 'owner';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // hashed in real app
  role: UserRole;
  createdAt: string;
  blocked?: boolean;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  image: string;
  order: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  mrp: number;
  unit: string; // e.g. "1 kg", "500 g", "1 L"
  image: string;
  stock: number;
  active: boolean;
  featured: boolean;
  tags: string[]; // e.g. ["bestseller", "new"]
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'upi' | 'card' | 'wallet';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    image: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  handlingFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  address: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: OrderStatus;
  notes?: string;
  placedAt: string;
  timeline: { status: OrderStatus; at: string; note?: string }[];
  // Delivery tracking
  deliveryBoy?: string;
  estimatedTime?: string;
}

export type CouponType = 'flat' | 'percent';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number; // amount in ₹ or percent
  minOrder: number;
  maxDiscount?: number;
  active: boolean;
  validFrom: string;
  validTill: string;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
}

export interface DeliveryArea {
  id: string;
  pincode: string;
  area: string;
  city: string;
  deliveryRadius: number; // in km
  estimatedTime: number; // in minutes
  active: boolean;
  deliveryFee: number;
  freeAbove?: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  active: boolean;
  order: number;
}

export interface AppSettings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  storeEmail: string;
  deliveryRadiusKm: number;
  baseDeliveryFee: number;
  freeDeliveryAbove: number;
  handlingFee: number;
  codEnabled: boolean;
  upiEnabled: boolean;
  cardEnabled: boolean;
  walletEnabled: boolean;
  minOrderValue: number;
  gstPercent: number;
  notificationsEnabled: boolean;
}

// Database schema - single root object in AsyncStorage
export interface DatabaseSchema {
  users: User[];
  addresses: Address[];
  categories: Category[];
  products: Product[];
  carts: Cart[];
  orders: Order[];
  coupons: Coupon[];
  deliveryAreas: DeliveryArea[];
  banners: Banner[];
  settings: AppSettings;
  session: { userId: string; role: UserRole } | null;
}
