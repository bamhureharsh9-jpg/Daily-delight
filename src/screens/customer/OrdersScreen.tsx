import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { orderApi } from '../../db/api';
import { Order, OrderStatus } from '../../db/types';
import { OrderCard } from '../../components/customer/OrderCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { realtime, Events } from '../../db/realtime';

const TABS: { id: 'all' | OrderStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'placed', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function OrdersScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'all' | OrderStatus>('all');

  const load = useCallback(async () => {
    const list = await orderApi.list({ userId: user!.id });
    setOrders(list);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.ORDERS_CHANGED, load);
    return () => u();
  }, [load]);

  const filtered = orders.filter((o) => {
    if (tab === 'all') return true;
    if (tab === 'placed') return ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(o.status);
    return o.status === tab;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>{orders.length} orders</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingVertical: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}>
            <OrderCard order={item} />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="📦"
            title="No orders yet"
            message="Your order history will appear here"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  head: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill, backgroundColor: Colors.gray100, marginRight: Spacing.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
});
