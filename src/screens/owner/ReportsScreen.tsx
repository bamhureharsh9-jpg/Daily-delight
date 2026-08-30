import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { orderApi, productApi, userApi } from '../../db/api';
import { Order, Product, User } from '../../db/types';
import { Header } from '../../components/common/Header';
import { SectionHeader } from '../../components/common/SectionHeader';

export function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const load = useCallback(async () => {
    const [o, p, c] = await Promise.all([orderApi.list(), productApi.list(), userApi.list('customer')]);
    setOrders(o);
    setProducts(p);
    setCustomers(c as User[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filterByPeriod = (list: Order[]) => {
    const now = new Date();
    if (period === 'all') return list;
    const start = new Date();
    if (period === 'today') start.setHours(0, 0, 0, 0);
    if (period === 'week') start.setDate(now.getDate() - 7);
    if (period === 'month') start.setMonth(now.getMonth() - 1);
    return list.filter((o) => +new Date(o.placedAt) >= +start);
  };

  const filtered = filterByPeriod(orders).filter((o) => o.status !== 'cancelled');
  const revenue = filtered.reduce((s, o) => s + o.total, 0);
  const avgOrder = filtered.length ? Math.round(revenue / filtered.length) : 0;
  const codRevenue = filtered.filter((o) => o.paymentMethod === 'cod').reduce((s, o) => s + o.total, 0);
  const onlineRevenue = revenue - codRevenue;

  // Top products (from order items)
  const productSales = new Map<string, { qty: number; revenue: number; name: string; image: string }>();
  filtered.forEach((o) => {
    o.items.forEach((it) => {
      const cur = productSales.get(it.productId) || { qty: 0, revenue: 0, name: it.name, image: it.image };
      cur.qty += it.quantity;
      cur.revenue += it.price * it.quantity;
      productSales.set(it.productId, cur);
    });
  });
  const topProducts = Array.from(productSales.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const maxQty = topProducts[0]?.qty || 1;

  // Order status distribution
  const statusCounts = {
    placed: filtered.filter((o) => o.status === 'placed').length,
    confirmed: filtered.filter((o) => o.status === 'confirmed').length,
    packed: filtered.filter((o) => o.status === 'packed').length,
    out_for_delivery: filtered.filter((o) => o.status === 'out_for_delivery').length,
    delivered: filtered.filter((o) => o.status === 'delivered').length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Reports" subtitle="Business analytics" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <View style={styles.periodRow}>
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.periodBtn, period === p && styles.periodBtnActive]}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p === 'today' ? 'Today' : p === 'week' ? '7 days' : p === 'month' ? '30 days' : 'All time'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.bigLabel}>Total Revenue</Text>
          <Text style={styles.bigValue}>₹{revenue.toLocaleString('en-IN')}</Text>
          <View style={styles.bigRow}>
            <View style={styles.bigItem}>
              <Text style={styles.bigItemLabel}>Orders</Text>
              <Text style={styles.bigItemValue}>{filtered.length}</Text>
            </View>
            <View style={styles.bigDivider} />
            <View style={styles.bigItem}>
              <Text style={styles.bigItemLabel}>Avg Order</Text>
              <Text style={styles.bigItemValue}>₹{avgOrder}</Text>
            </View>
            <View style={styles.bigDivider} />
            <View style={styles.bigItem}>
              <Text style={styles.bigItemLabel}>Customers</Text>
              <Text style={styles.bigItemValue}>{customers.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.smallCard, { backgroundColor: Colors.statusPacked }]}>
            <Text style={styles.smallLabel}>Online</Text>
            <Text style={styles.smallValue}>₹{onlineRevenue.toLocaleString('en-IN')}</Text>
            <Text style={styles.smallSub}>UPI/Card/Wallet</Text>
          </View>
          <View style={[styles.smallCard, { backgroundColor: Colors.statusShipped }]}>
            <Text style={styles.smallLabel}>COD</Text>
            <Text style={styles.smallValue}>₹{codRevenue.toLocaleString('en-IN')}</Text>
            <Text style={styles.smallSub}>Cash on Delivery</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          {Object.entries(statusCounts).map(([k, v]) => {
            const total = Object.values(statusCounts).reduce((s, x) => s + x, 0) || 1;
            const pct = Math.round((v / total) * 100);
            const info: Record<string, { label: string; color: string }> = {
              placed: { label: 'Placed', color: Colors.statusPlaced },
              confirmed: { label: 'Confirmed', color: Colors.statusConfirmed },
              packed: { label: 'Packed', color: Colors.statusPacked },
              out_for_delivery: { label: 'On the way', color: Colors.statusShipped },
              delivered: { label: 'Delivered', color: Colors.statusDelivered },
            };
            const i = info[k];
            return (
              <View key={k} style={styles.statusRow}>
                <View style={styles.statusLeft}>
                  <View style={[styles.statusDot, { backgroundColor: i.color }]} />
                  <Text style={styles.statusLabel}>{i.label}</Text>
                </View>
                <View style={styles.statusBar}>
                  <View style={[styles.statusFill, { width: `${pct}%`, backgroundColor: i.color }]} />
                </View>
                <Text style={styles.statusValue}>{v} • {pct}%</Text>
              </View>
            );
          })}
        </View>

        {topProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
            {topProducts.map((p, idx) => (
              <View key={idx} style={styles.topRow}>
                <Text style={styles.topRank}>#{idx + 1}</Text>
                <Text style={{ fontSize: 28, marginRight: Spacing.sm }}>{p.image}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topName} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.topBar}>
                    <View style={[styles.topFill, { width: `${(p.qty / maxQty) * 100}%` }]} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.topQty}>{p.qty} sold</Text>
                  <Text style={styles.topRev}>₹{p.revenue}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Health</Text>
          <View style={styles.healthRow}>
            <View style={styles.healthItem}>
              <Text style={styles.healthVal}>{products.length}</Text>
              <Text style={styles.healthLab}>Total SKUs</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthVal, { color: Colors.success }]}>{products.filter((p) => p.stock >= 30).length}</Text>
              <Text style={styles.healthLab}>In stock</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthVal, { color: Colors.warning }]}>{products.filter((p) => p.stock < 30 && p.stock > 0).length}</Text>
              <Text style={styles.healthLab}>Low</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthVal, { color: Colors.error }]}>{products.filter((p) => p.stock === 0).length}</Text>
              <Text style={styles.healthLab}>Out</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  periodRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.lg },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  periodTextActive: { color: Colors.white },
  bigCard: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadow.md },
  bigLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  bigValue: { color: Colors.white, fontSize: 36, fontWeight: '800', marginTop: 4 },
  bigRow: { flexDirection: 'row', marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  bigItem: { flex: 1, alignItems: 'center' },
  bigDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  bigItemLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  bigItemValue: { color: Colors.white, fontSize: 18, fontWeight: '800', marginTop: 4 },
  cardRow: { flexDirection: 'row', marginBottom: Spacing.lg },
  smallCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.lg, marginHorizontal: 4 },
  smallLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  smallValue: { color: Colors.white, fontSize: 18, fontWeight: '800', marginTop: 4 },
  smallSub: { color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 2 },
  section: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', width: 110 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusLabel: { fontSize: 12, fontWeight: '600', color: Colors.text },
  statusBar: { flex: 1, height: 8, backgroundColor: Colors.gray100, borderRadius: 4, overflow: 'hidden', marginHorizontal: Spacing.sm },
  statusFill: { height: '100%', borderRadius: 4 },
  statusValue: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', width: 60, textAlign: 'right' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  topRank: { fontSize: 14, fontWeight: '800', color: Colors.primary, width: 30 },
  topName: { ...Typography.bodyBold, color: Colors.text, fontSize: 13 },
  topBar: { height: 4, backgroundColor: Colors.gray100, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  topFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  topQty: { fontSize: 12, fontWeight: '700', color: Colors.text },
  topRev: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between' },
  healthItem: { alignItems: 'center', flex: 1 },
  healthVal: { fontSize: 24, fontWeight: '800', color: Colors.text },
  healthLab: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },
});
