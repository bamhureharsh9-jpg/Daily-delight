import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { orderApi } from '../../db/api';
import { Order, OrderStatus } from '../../db/types';
import { ProductImage } from '../../components/common/ProductImage';
import { realtime, Events } from '../../db/realtime';

const steps: { status: OrderStatus; label: string; icon: any; desc: string }[] = [
  { status: 'placed', label: 'Order Placed', icon: 'checkmark-circle', desc: 'We received your order' },
  { status: 'confirmed', label: 'Confirmed', icon: 'thumbs-up', desc: 'Store accepted your order' },
  { status: 'packed', label: 'Packed', icon: 'cube', desc: 'Items are being packed' },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: 'bicycle', desc: 'On the way to you' },
  { status: 'delivered', label: 'Delivered', icon: 'home', desc: 'Enjoy your order!' },
];

export function OrderTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: string = route.params?.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const o = await orderApi.getById(orderId);
    setOrder(o);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.ORDERS_CHANGED, () => load());
    return () => u();
  }, [load]);

  // Auto-progress demo: advance status if active (for demonstration of real-time flow)
  useEffect(() => {
    if (!order) return;
    const isActive = ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(order.status);
    if (!isActive) return;
    const t = setTimeout(async () => {
      const next: Record<string, OrderStatus> = {
        placed: 'confirmed',
        confirmed: 'packed',
        packed: 'out_for_delivery',
        out_for_delivery: 'delivered',
      };
      const newStatus = next[order.status];
      if (newStatus) {
        await orderApi.setStatus(order.id, newStatus, `Auto-progressed to ${newStatus}`);
      }
    }, 15000);
    return () => clearTimeout(t);
  }, [order]);

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const currentIdx = steps.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Order Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <View style={[styles.heroCard, { backgroundColor: isCancelled ? Colors.error : Colors.primary }]}>
          <Text style={styles.heroLabel}>{isCancelled ? 'Order Cancelled' : 'Estimated Delivery'}</Text>
          <Text style={styles.heroEta}>{isCancelled ? '—' : order.estimatedTime || '15 mins'}</Text>
          <Text style={styles.heroId}>#{order.id.slice(-6).toUpperCase()}</Text>
        </View>

        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Status</Text>
            {steps.map((s, i) => {
              const passed = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <View key={s.status} style={styles.stepRow}>
                  <View style={styles.stepLine}>
                    <View style={[styles.stepCircle, passed && { backgroundColor: Colors.success }, isCurrent && styles.stepCircleCurrent]}>
                      <Ionicons name={s.icon} size={16} color={passed ? Colors.white : Colors.gray400} />
                    </View>
                    {i < steps.length - 1 && <View style={[styles.connector, i < currentIdx && { backgroundColor: Colors.success }]} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: i < steps.length - 1 ? Spacing.xl : 0 }}>
                    <Text style={[styles.stepLabel, isCurrent && { color: Colors.primary, fontWeight: '800' }]}>{s.label}</Text>
                    <Text style={styles.stepDesc}>{s.desc}</Text>
                    {isCurrent && (
                      <View style={styles.livePill}>
                        <View style={styles.pulse} />
                        <Text style={styles.liveText}>Live</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <View style={styles.addrBox}>
            <Ionicons name="location" size={18} color={Colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.addrName}>{order.address.label}</Text>
              <Text style={styles.addrText}>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</Text>
              <Text style={styles.addrText}>{order.address.city}, {order.address.state} - {order.address.pincode}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items ({order.items.length})</Text>
          {order.items.map((it) => (
            <View key={it.productId} style={styles.itemRow}>
              <ProductImage emoji={it.image} size={48} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                <Text style={styles.itemUnit}>{it.unit} × {it.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{it.price * it.quantity}</Text>
            </View>
          ))}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{order.subtotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery</Text>
            <Text style={[styles.billValue, order.deliveryFee === 0 && { color: Colors.success }]}>
              {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling</Text>
            <Text style={styles.billValue}>₹{order.handlingFee}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Discount {order.couponCode && `(${order.couponCode})`}</Text>
              <Text style={[styles.billValue, { color: Colors.success }]}>-₹{order.discount}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Paid via {order.paymentMethod.toUpperCase()}</Text>
            <Text style={styles.totalValue}>₹{order.total}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white },
  title: { ...Typography.h2, color: Colors.text },
  heroCard: { borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, alignItems: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  heroEta: { color: Colors.white, fontSize: 32, fontWeight: '800', marginTop: 4 },
  heroId: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.lg },
  stepRow: { flexDirection: 'row' },
  stepLine: { alignItems: 'center', width: 32 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.gray200 },
  stepCircleCurrent: { borderColor: Colors.success, transform: [{ scale: 1.1 }] },
  connector: { width: 2, flex: 1, backgroundColor: Colors.gray200, marginVertical: 2 },
  stepLabel: { ...Typography.bodyBold, color: Colors.textSecondary },
  stepDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  livePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: Colors.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill, marginTop: 4 },
  pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white, marginRight: 4 },
  liveText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  addrBox: { flexDirection: 'row', backgroundColor: Colors.gray50, padding: Spacing.md, borderRadius: Radius.md },
  addrName: { ...Typography.bodyBold, color: Colors.text },
  addrText: { fontSize: 13, color: Colors.text, lineHeight: 18, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemName: { ...Typography.bodyBold, color: Colors.text },
  itemUnit: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { ...Typography.bodyBold, color: Colors.text },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginTop: Spacing.sm },
  billLabel: { color: Colors.textSecondary, fontSize: 13 },
  billValue: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.md, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { ...Typography.h4, color: Colors.text },
  totalValue: { ...Typography.h2, color: Colors.text },
});
