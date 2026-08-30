import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { orderApi } from '../../db/api';
import { Order, OrderStatus } from '../../db/types';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { realtime, Events } from '../../db/realtime';
import { LiveSyncBadge } from '../../components/common/LiveSyncBadge';

const TABS: { id: 'all' | 'active' | OrderStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'packed', label: 'Packed' },
  { id: 'out_for_delivery', label: 'On the way' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const statusInfo: Record<OrderStatus, { label: string; color: string }> = {
  placed: { label: 'Placed', color: Colors.statusPlaced },
  confirmed: { label: 'Confirmed', color: Colors.statusConfirmed },
  packed: { label: 'Packed', color: Colors.statusPacked },
  out_for_delivery: { label: 'On the way', color: Colors.statusShipped },
  delivered: { label: 'Delivered', color: Colors.statusDelivered },
  cancelled: { label: 'Cancelled', color: Colors.statusCancelled },
};

export function OwnerOrdersScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'all' | 'active' | OrderStatus>('all');
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const list = await orderApi.list();
    // Detect new orders and flash them
    const newIds = new Set(list.map((o) => o.id));
    const prev = prevOrderIdsRef.current;
    const added: string[] = [];
    newIds.forEach((id) => { if (!prev.has(id)) added.push(id); });
    if (added.length) {
      setFlashIds((cur) => {
        const next = new Set(cur);
        added.forEach((id) => next.add(id));
        return next;
      });
      setTimeout(() => {
        setFlashIds((cur) => {
          const next = new Set(cur);
          added.forEach((id) => next.delete(id));
          return next;
        });
      }, 3000);
    }
    prevOrderIdsRef.current = newIds;
    setOrders(list);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.ORDERS_CHANGED, load);
    const t = setInterval(load, 2000);
    return () => { u(); clearInterval(t); };
  }, [load]);

  const filtered = orders.filter((o) => {
    if (tab === 'all') return true;
    if (tab === 'active') return ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(o.status);
    return o.status === tab;
  });

  const counts = {
    all: orders.length,
    active: orders.filter((o) => ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(o.status)).length,
    placed: orders.filter((o) => o.status === 'placed').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    packed: orders.filter((o) => o.status === 'packed').length,
    out_for_delivery: orders.filter((o) => o.status === 'out_for_delivery').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Orders"
        subtitle={`${orders.length} total • auto-refreshing`}
        onBack={() => navigation.goBack()}
        right={<LiveSyncBadge />}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map((t) => {
          const active = tab === t.id;
          const c = counts[t.id as keyof typeof counts] || 0;
          return (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              {c > 0 && (
                <View style={[styles.tabBadge, active && { backgroundColor: Colors.white }]}>
                  <Text style={[styles.tabBadgeText, active && { color: Colors.primary }]}>{c}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const info = statusInfo[item.status];
          const isFlashing = flashIds.has(item.id);
          return (
            <Pressable style={[styles.card, isFlashing && styles.cardFlash]} onPress={() => navigation.navigate('OwnerOrderDetail', { orderId: item.id })}>
              <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.customer}>{item.customerName} • {item.customerPhone}</Text>
                </View>
                <Badge text={info.label} color={info.color} />
              </View>
              <View style={styles.itemsRow}>
                {item.items.slice(0, 4).map((it, i) => (
                  <View key={i} style={styles.itemIcon}>
                    <Text style={{ fontSize: 24 }}>{it.image}</Text>
                  </View>
                ))}
                {item.items.length > 4 && (
                  <View style={[styles.itemIcon, { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700' }}>+{item.items.length - 4}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.itemsText}>{item.items.reduce((s, i) => s + i.quantity, 0)} items • {item.paymentMethod.toUpperCase()}</Text>
                  <Text style={styles.address} numberOfLines={1}>📍 {item.address.line1}, {item.address.pincode}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.total}>₹{item.total}</Text>
                  <Text style={styles.date}>{new Date(item.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState emoji="📋" title="No orders" message="Orders will appear here" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  tabsRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.gray100, marginRight: Spacing.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  tabBadge: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.pill, marginLeft: 6, minWidth: 20, alignItems: 'center' },
  tabBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardFlash: { borderColor: Colors.accent, borderWidth: 2, backgroundColor: '#FFF7ED' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  orderId: { ...Typography.h4, color: Colors.text },
  customer: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemsRow: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  itemIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginRight: -6, borderWidth: 2, borderColor: Colors.white },
  itemsText: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  address: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  total: { ...Typography.h4, color: Colors.text },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
