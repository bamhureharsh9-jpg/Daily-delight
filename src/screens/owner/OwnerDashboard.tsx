import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow, Brand } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { orderApi, productApi, settingsApi } from '../../db/api';
import { Order, OrderStatus, Product, AppSettings } from '../../db/types';
import { realtime, Events } from '../../db/realtime';
import { LiveSyncBadge } from '../../components/common/LiveSyncBadge';
import { useSync, ActivityEntry } from '../../context/SyncContext';
import { Badge } from '../../components/common/Badge';

interface Stats {
  totalOrders: number;
  todayOrders: number;
  revenue: number;
  pending: number;
  active: number;
  customers: number;
  products: number;
  lowStock: number;
}

// "View in Customer App" debug button — emits an event the Customer
// side listens for and shows a toast, then Owner switches role to
// Customer so the user can see the product they just added.
async function openCustomerPreview() {
  try {
    // Get the most recent product
    const all = await productApi.list();
    const latest = all[0];
    if (latest) {
      realtime.emit(Events.PREVIEW_PRODUCT, { productId: latest.id, name: latest.name });
    }
    // Switch the user to customer role so they can see the live app
    setPreviewAs('customer');
  } catch (e) {
    // ignore
  }
}

async function simulateCustomerOrder() {
  const products = await productApi.list({ activeOnly: true });
  if (products.length === 0) return;
  const pick = products[Math.floor(Math.random() * Math.min(5, products.length))];
  const customer = (await import('../../db/api')).userApi;
  const customers = await customer.list('customer') as any[];
  if (customers.length === 0) return;
  const cust = customers[Math.floor(Math.random() * customers.length)];
  const order = await orderApi.place({
    userId: cust.id,
    customerName: cust.name,
    customerPhone: cust.phone,
    items: [{
      productId: pick.id,
      name: pick.name,
      price: pick.price,
      quantity: 1 + Math.floor(Math.random() * 3),
      unit: pick.unit,
      image: pick.image,
    }],
    subtotal: pick.price,
    deliveryFee: 25,
    handlingFee: 5,
    discount: 0,
    total: pick.price + 30,
    address: {
      id: 'demo-addr',
      userId: cust.id,
      label: 'Home',
      line1: 'Demo Address, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      isDefault: true,
    },
    paymentMethod: 'upi',
  });
  return order;
}

export function OwnerDashboard() {
  const navigation = useNavigation<any>();
  const { user, setPreviewAs, isPreview, actualRole } = useAuth();
  const { activity } = useSync();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, recentOrders, allProducts] = await Promise.all([
      orderApi.stats(),
      orderApi.list(),
      productApi.list(),
    ]);
    setStats(s);
    setRecent(recentOrders.slice(0, 5));
    setLowStockProducts(allProducts.filter((p) => p.stock < 30).sort((a, b) => a.stock - b.stock).slice(0, 5));
    const st = await settingsApi.get();
    setSettings(st);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsubs = [
      realtime.on(Events.ORDERS_CHANGED, load),
      realtime.on(Events.PRODUCTS_CHANGED, load),
      realtime.on(Events.SETTINGS_CHANGED, load),
    ];
    const t = setInterval(load, 5000); // poll every 5s for "real-time" feel
    return () => { unsubs.forEach((u) => u()); clearInterval(t); };
  }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const getStatusInfo = (s: OrderStatus) => {
    switch (s) {
      case 'placed': return { label: 'Placed', color: Colors.statusPlaced };
      case 'confirmed': return { label: 'Confirmed', color: Colors.statusConfirmed };
      case 'packed': return { label: 'Packed', color: Colors.statusPacked };
      case 'out_for_delivery': return { label: 'Out for delivery', color: Colors.statusShipped };
      case 'delivered': return { label: 'Delivered', color: Colors.statusDelivered };
      case 'cancelled': return { label: 'Cancelled', color: Colors.statusCancelled };
    }
  };

  const newOrdersCount = recent.filter((o) => o.status === 'placed').length;
  const lastOrder = recent[0];
  const orderAge = lastOrder ? Date.now() - new Date(lastOrder.placedAt).getTime() : Infinity;
  const isFreshOrder = orderAge < 30000; // within 30 seconds

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {isPreview && (
        <Pressable style={styles.previewBanner} onPress={() => setPreviewAs(null)}>
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.previewText}>Previewing as Customer • Tap to return to Owner</Text>
          <Ionicons name="close" size={16} color={Colors.white} />
        </Pressable>
      )}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name?.split(' ')[0] || 'Owner'} 👋</Text>
          </View>
          <LiveSyncBadge light />
          <View style={{ flexDirection: 'row' }}>
            {!isPreview && actualRole === 'owner' && (
              <Pressable onPress={() => setPreviewAs('customer')} style={[styles.settingsBtn, { marginRight: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Ionicons name="eye-outline" size={20} color={Colors.white} />
              </Pressable>
            )}
            <Pressable onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={22} color={Colors.white} />
            </Pressable>
          </View>
        </View>

        {newOrdersCount === 0 && recent.length === 0 && (
          <View style={styles.emptyBanner}>
            <Text style={{ fontSize: 36, marginBottom: Spacing.sm }}>📦</Text>
            <Text style={styles.emptyBannerTitle}>No orders yet</Text>
            <Text style={styles.emptyBannerText}>
              To see the live sync in action:{'\n'}
              1. Open this URL in a new tab and log in as Customer (Priya){'\n'}
              2. Add items to cart and place an order{'\n'}
              3. Come back here — the order appears instantly!
            </Text>
            <Pressable
              onPress={() => {
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('role', 'customer');
                  window.open(url.toString(), '_blank');
                }
              }}
              style={styles.emptyBannerBtn}
            >
              <Ionicons name="open-outline" size={14} color={Colors.white} />
              <Text style={styles.emptyBannerBtnText}>Open Customer in new tab</Text>
            </Pressable>
          </View>
        )}

        {newOrdersCount > 0 && (
          <Pressable
            style={[styles.newOrderBanner, isFreshOrder && styles.newOrderBannerFresh]}
            onPress={() => navigation.navigate('OwnerOrderDetail', { orderId: recent.find((o) => o.status === 'placed')?.id })}
          >
            <View style={styles.newOrderIcon}>
              <Ionicons name="notifications" size={20} color={Colors.white} />
              {isFreshOrder && <View style={styles.pulseRing} />}
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.newOrderTitle}>
                {newOrdersCount} new order{newOrdersCount !== 1 ? 's' : ''} waiting!
              </Text>
              <Text style={styles.newOrderSub}>
                Latest: #{lastOrder?.id.slice(-6).toUpperCase()} from {lastOrder?.customerName} • ₹{lastOrder?.total}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </Pressable>
        )}

        {stats && (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
              <Text style={styles.statLabel}>Today's Revenue</Text>
              <Text style={styles.statBig}>₹{stats.revenue.toLocaleString('en-IN')}</Text>
              <View style={styles.statFooter}>
                <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.statFooterText}>{stats.todayOrders} orders today</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.accent }]}>
              <Text style={styles.statLabel}>Pending Orders</Text>
              <Text style={styles.statBig}>{stats.pending}</Text>
              <View style={styles.statFooter}>
                <Ionicons name="time" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.statFooterText}>Need attention</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.info }]}>
              <Text style={styles.statLabel}>Out for Delivery</Text>
              <Text style={styles.statBig}>{stats.active}</Text>
              <View style={styles.statFooter}>
                <Ionicons name="bicycle" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.statFooterText}>On the way</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.statusPacked }]}>
              <Text style={styles.statLabel}>Total Customers</Text>
              <Text style={styles.statBig}>{stats.customers}</Text>
              <View style={styles.statFooter}>
                <Ionicons name="people" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.statFooterText}>Registered</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.alertCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.alertIcon, { backgroundColor: '#FFE5E5' }]}>
              <Ionicons name="alert-circle" size={22} color={Colors.error} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.alertTitle}>{stats?.lowStock || 0} low stock items</Text>
              <Text style={styles.alertSub}>Restock soon to avoid out-of-stock</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Products')} hitSlop={8}>
              <Text style={styles.alertLink}>View</Text>
            </Pressable>
          </View>
          {lowStockProducts.length > 0 && (
            <View style={{ marginTop: Spacing.md }}>
              {lowStockProducts.slice(0, 3).map((p) => (
                <View key={p.id} style={styles.lowStockRow}>
                  <Text style={{ fontSize: 22, marginRight: 8 }}>{p.image}</Text>
                  <Text style={styles.lowStockName} numberOfLines={1}>{p.name}</Text>
                  <View style={[styles.stockPill, { backgroundColor: p.stock === 0 ? '#FFE0E0' : '#FFF4D6' }]}>
                    <Text style={[styles.stockPillText, { color: p.stock === 0 ? Colors.error : '#E6A700' }]}>{p.stock} left</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <Pressable onPress={() => navigation.navigate('MainTabs', { screen: 'Orders' })}>
              <Text style={styles.sectionAction}>View all</Text>
            </Pressable>
          </View>
          {recent.length === 0 ? (
            <Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: Spacing.lg }}>No orders yet</Text>
          ) : (
            recent.map((o) => {
              const info = getStatusInfo(o.status);
              return (
                <Pressable key={o.id} style={styles.orderRow} onPress={() => navigation.navigate('OwnerOrderDetail', { orderId: o.id })}>
                  <View style={styles.orderIcon}>
                    <Text style={{ fontSize: 22 }}>{o.items[0]?.image || '🛒'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>#{o.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderName} numberOfLines={1}>{o.customerName} • {o.items.length} items</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderAmt}>₹{o.total}</Text>
                    <Badge text={info.label} color={info.color} small style={{ marginTop: 4 }} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Live Sync Stream</Text>
            <Pressable onPress={() => navigation.navigate('ActivityLog')}>
              <Text style={styles.sectionAction}>View all →</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => simulateCustomerOrder()}
            style={styles.simulateBtn}
          >
            <Ionicons name="flash" size={16} color={Colors.white} />
            <Text style={styles.simulateBtnText}>Simulate a customer placing an order</Text>
          </Pressable>
          <Pressable
            onPress={openCustomerPreview}
            style={[styles.simulateBtn, { backgroundColor: Colors.primary }]}
          >
            <Ionicons name="eye" size={16} color={Colors.white} />
            <Text style={styles.simulateBtnText}>View latest product in Customer app</Text>
          </Pressable>
          {activity.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Ionicons name="radio-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyActivityText}>
                No sync events yet. Open the Customer App in another tab and place an order — you'll see it here in real-time.
              </Text>
            </View>
          ) : (
            activity.slice(0, 4).map((entry) => {
              const isRemote = entry.source === 'remote';
              const color = entry.type.includes('ORDER') ? Colors.primary
                : entry.type.includes('PRODUCT') ? Colors.accent
                : entry.type.includes('COUPON') ? Colors.warning
                : entry.type.includes('CATEGORY') ? Colors.statusPacked
                : entry.type.includes('BANNER') ? Colors.statusShipped
                : entry.type.includes('SETTING') ? Colors.info
                : entry.type.includes('DELIVERY') ? Colors.statusConfirmed
                : entry.type.includes('USER') ? Colors.statusPlaced
                : entry.type.includes('CART') ? Colors.statusShipped
                : Colors.textSecondary;
              const icon = entry.type.includes('ORDER') ? 'receipt'
                : entry.type.includes('PRODUCT') ? 'cube'
                : entry.type.includes('COUPON') ? 'pricetag'
                : entry.type.includes('CATEGORY') ? 'grid'
                : entry.type.includes('BANNER') ? 'megaphone'
                : entry.type.includes('SETTING') ? 'settings'
                : entry.type.includes('DELIVERY') ? 'location'
                : entry.type.includes('USER') ? 'people'
                : entry.type.includes('CART') ? 'cart'
                : 'flash';
              return (
                <View key={entry.id} style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: `${color}1A` }]}>
                    <Ionicons name={icon} size={14} color={color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.activityDesc} numberOfLines={1}>{entry.description}</Text>
                    <Text style={styles.activityMeta}>
                      {isRemote ? '↘ from Customer App' : '↗ from Owner App'} • {new Date(entry.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionCard icon="add-circle" label="Add Product" color={Colors.primary} onPress={() => navigation.navigate('AddProduct')} />
            <ActionCard icon="pricetag" label="New Coupon" color={Colors.accent} onPress={() => navigation.navigate('AddCoupon')} />
            <ActionCard icon="megaphone" label="Add Banner" color={Colors.statusPacked} onPress={() => navigation.navigate('Banners')} />
            <ActionCard icon="location" label="Delivery Areas" color={Colors.info} onPress={() => navigation.navigate('DeliveryAreas')} />
            <ActionCard icon="grid" label="Categories" color={Colors.statusShipped} onPress={() => navigation.navigate('Categories')} />
            <ActionCard icon="bar-chart" label="Reports" color={Colors.statusDelivered} onPress={() => navigation.navigate('Reports')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && { transform: [{ scale: 0.97 }] }]}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  previewText: { color: Colors.white, fontSize: 12, fontWeight: '700', marginHorizontal: Spacing.sm },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.accent,
  },
  greet: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  name: { color: Colors.white, fontSize: 24, fontWeight: '800', marginTop: 2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginTop: -16 },
  statCard: { width: '46%', margin: '2%', borderRadius: Radius.lg, padding: Spacing.lg, minHeight: 120, ...Shadow.md },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  statBig: { color: Colors.white, fontSize: 28, fontWeight: '800', marginTop: 4 },
  statFooter: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  statFooterText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginLeft: 4, fontWeight: '600' },
  alertCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  alertIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { ...Typography.bodyBold, color: Colors.text },
  alertSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  alertLink: { color: Colors.primary, fontWeight: '700' },
  lowStockRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  lowStockName: { ...Typography.body, color: Colors.text, flex: 1 },
  stockPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm },
  stockPillText: { fontSize: 11, fontWeight: '700' },
  section: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  sectionAction: { color: Colors.primary, fontWeight: '700' },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  orderIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  orderId: { ...Typography.bodyBold, color: Colors.text },
  orderName: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  orderAmt: { ...Typography.bodyBold, color: Colors.text },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { width: '31%', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: Radius.md, marginBottom: Spacing.sm },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  actionLabel: { fontSize: 11, color: Colors.text, fontWeight: '700', textAlign: 'center' },
  emptyActivity: { alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md },
  emptyActivityText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 18 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activityDesc: { fontSize: 12, fontWeight: '700', color: Colors.text },
  activityMeta: { fontSize: 10, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
  simulateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.accent, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md, gap: 6 },
  simulateBtnText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
  newOrderBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, padding: Spacing.lg, borderRadius: Radius.lg, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  newOrderBannerFresh: { backgroundColor: Colors.statusPlaced },
  newOrderIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  newOrderTitle: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  newOrderSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  emptyBanner: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg, padding: Spacing.xl, backgroundColor: Colors.white, borderRadius: Radius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyBannerTitle: { ...Typography.h3, color: Colors.text },
  emptyBannerText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 18 },
  emptyBannerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, marginTop: Spacing.md, gap: 4 },
  emptyBannerBtnText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
});
