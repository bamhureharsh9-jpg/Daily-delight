import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Pressable, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Brand } from '../../theme';
import { productApi, categoryApi, bannerApi, settingsApi, orderApi, addressApi, deliveryApi } from '../../db/api';
import { realtime, Events } from '../../db/realtime';
import { Product, Category, Banner, AppSettings, Order, Address, DeliveryArea } from '../../db/types';
import { ProductCard } from '../../components/customer/ProductCard';
import { BannerCarousel } from '../../components/customer/BannerCarousel';
import { SectionHeader } from '../../components/common/SectionHeader';
import { CategoryGrid } from '../../components/customer/CategoryGrid';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { LiveSyncBadge } from '../../components/common/LiveSyncBadge';
import { useSync } from '../../context/SyncContext';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, isPreview, setPreviewAs } = useAuth();
  const { totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [p, c, b, s, orders, addrs] = await Promise.all([
      productApi.list({ activeOnly: true }),
      categoryApi.list(),
      bannerApi.list(),
      settingsApi.get(),
      orderApi.list({ userId: user?.id }),
      addressApi.listForUser(user?.id || ''),
    ]);
    setProducts(p);
    setCategories(c);
    setBanners(b);
    setSettings(s);
    const active = orders.find((o) => ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(o.status));
    setActiveOrder(active || null);
    const def = addrs.find((a) => a.isDefault) || addrs[0];
    setAddress(def || null);
    if (def) {
      const da = await deliveryApi.checkPincode(def.pincode);
      setDeliveryArea(da);
    }
    setLoading(false);
  }, [user]);

  // Toast state for "new product added" notification from Owner
  const [previewToast, setPreviewToast] = useState<string | null>(null);

  useEffect(() => {
    load();
    const unsubs = [
      realtime.on(Events.PRODUCTS_CHANGED, load),
      realtime.on(Events.CATEGORIES_CHANGED, load),
      realtime.on(Events.BANNERS_CHANGED, load),
      realtime.on(Events.ORDERS_CHANGED, load),
      realtime.on(Events.ADDRESSES_CHANGED, load),
      realtime.on(Events.SETTINGS_CHANGED, load),
      // When Owner clicks "View in Customer app", show a toast here
      realtime.on(Events.PREVIEW_PRODUCT, (payload: any) => {
        if (payload?.name) {
          setPreviewToast(`✨ "${payload.name}" just appeared!`);
          setTimeout(() => setPreviewToast(null), 4000);
          // Also force a refresh so the new product is at the top
          load();
        }
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const featured = products.filter((p) => p.featured);
  const bestSellers = products.filter((p) => p.tags.includes('bestseller'));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 20, color: Colors.textSecondary }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {previewToast && (
        <Pressable style={styles.toastBanner} onPress={() => setPreviewToast(null)}>
          <Ionicons name="sparkles" size={18} color={Colors.white} />
          <Text style={styles.toastText}>{previewToast}</Text>
          <Ionicons name="close" size={16} color={Colors.white} />
        </Pressable>
      )}
      {isPreview && (
        <Pressable style={styles.previewBanner} onPress={() => setPreviewAs(null)}>
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.previewText}>Previewing Customer App • Tap to return to Owner</Text>
          <Ionicons name="close" size={16} color={Colors.white} />
        </Pressable>
      )}
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <FlatList
        data={products.slice(0, 12)}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deliveryTo}>Delivery to {deliveryArea ? `in ${deliveryArea.estimatedTime} mins` : ''}</Text>
                <Pressable style={styles.addressRow} onPress={() => navigation.navigate('Addresses')}>
                  <Ionicons name="location" size={16} color={Colors.white} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {address ? `${address.line1}, ${address.pincode}` : 'Add delivery address'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.white} />
                </Pressable>
              </View>
              <LiveSyncBadge light />
              <Pressable style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="person" size={20} color={Colors.white} />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <Pressable style={styles.search} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
                <Text style={styles.searchText}>Search "milk", "bread", "fruits"...</Text>
              </Pressable>
            </View>

            {activeOrder && (
              <Pressable
                style={styles.activeOrder}
                onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.id })}
              >
                <View style={styles.activePulse}>
                  <Ionicons name="bicycle" size={22} color={Colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeTitle}>Order on the way</Text>
                  <Text style={styles.activeSub}>
                    #{activeOrder.id.slice(-6).toUpperCase()} • {activeOrder.items.length} items
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.white} />
              </Pressable>
            )}

            {banners.length > 0 && (
              <BannerCarousel banners={banners} />
            )}

            <StoreUpdates />

            <SectionHeader title="Shop by Category" subtitle="What's on your list today?" />
            <CategoryGrid
              categories={categories}
              onSelect={(id) => navigation.navigate('Category', { categoryId: id })}
            />

            {bestSellers.length > 0 && (
              <>
                <SectionHeader
                  title="Bestsellers"
                  subtitle="Most loved by customers"
                  emoji="⭐"
                  action="See all"
                  onAction={() => navigation.navigate('Search', { filter: 'bestseller' })}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                  {bestSellers.map((p) => (
                    <View key={p.id} style={{ marginRight: Spacing.md, width: 170 }}>
                      <ProductCard product={p} onPress={() => navigation.navigate('ProductDetail', { productId: p.id })} />
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            <SectionHeader
              title="All Products"
              subtitle={`${products.length} items available`}
              emoji="🛍️"
              action="View all"
              onAction={() => navigation.navigate('Search')}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
        ListEmptyComponent={<Text style={styles.empty}>No products available</Text>}
      />

      {totalItems > 0 && (
        <Pressable style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.cartBarLeft}>
            <View style={styles.cartBarCount}>
              <Text style={styles.cartBarCountText}>{totalItems}</Text>
            </View>
            <Text style={styles.cartBarText}>View Cart</Text>
          </View>
          <View style={styles.cartBarRight}>
            <Text style={styles.cartBarText}>Go to checkout</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 6 }} />
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  previewText: { color: Colors.white, fontSize: 12, fontWeight: '700', marginHorizontal: Spacing.sm },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  toastText: { color: Colors.white, fontSize: 13, fontWeight: '800', flex: 1, marginHorizontal: Spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  deliveryTo: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  addressText: { color: Colors.white, fontSize: 14, fontWeight: '700', marginHorizontal: 6, flex: 1 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  openOwnerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  openOwnerText: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  searchWrap: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  searchText: { color: Colors.textMuted, fontSize: 14, marginLeft: Spacing.sm, flex: 1 },
  activeOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  activePulse: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  activeTitle: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  activeSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  hScroll: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  column: { justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: Spacing.md },
  empty: { textAlign: 'center', color: Colors.textSecondary, padding: Spacing.xl },
  cartBar: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cartBarLeft: { flexDirection: 'row', alignItems: 'center' },
  cartBarCount: { backgroundColor: Colors.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  cartBarCountText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
  cartBarText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  cartBarRight: { flexDirection: 'row', alignItems: 'center' },
});

// Small inline component: shows the latest updates from the store
function StoreUpdates() {
  const { activity } = useSync();
  const recent = activity.filter((e) => e.source === 'remote' && (
    e.type.includes('PRODUCT') || e.type.includes('BANNER') || e.type.includes('COUPON') || e.type.includes('PRICE') || e.type.includes('SETTING')
  )).slice(0, 3);
  if (recent.length === 0) return null;
  return (
    <View style={storeUpdatesStyles.wrap}>
      <View style={storeUpdatesStyles.head}>
        <Ionicons name="megaphone" size={14} color={Colors.accent} />
        <Text style={storeUpdatesStyles.headText}>Just in from the store</Text>
      </View>
      {recent.map((e) => (
        <View key={e.id} style={storeUpdatesStyles.row}>
          <Ionicons name="sparkles" size={12} color={Colors.accent} />
          <Text style={storeUpdatesStyles.text} numberOfLines={1}>{e.description}</Text>
        </View>
      ))}
    </View>
  );
}

const storeUpdatesStyles = StyleSheet.create({
  wrap: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, padding: Spacing.md, backgroundColor: '#FFF7ED', borderRadius: Radius.md, borderWidth: 1, borderColor: '#FED7AA' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  headText: { fontSize: 11, fontWeight: '800', color: Colors.accentDark, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 6 },
  text: { fontSize: 12, color: Colors.text, flex: 1 },
});
