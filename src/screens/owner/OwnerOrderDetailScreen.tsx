import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { orderApi } from '../../db/api';
import { Order, OrderStatus } from '../../db/types';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { ProductImage } from '../../components/common/ProductImage';
import { realtime, Events } from '../../db/realtime';
import { Badge } from '../../components/common/Badge';

const nextStatus: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: any; color: string }>> = {
  placed: { status: 'confirmed', label: 'Confirm Order', icon: 'thumbs-up', color: Colors.statusConfirmed },
  confirmed: { status: 'packed', label: 'Mark as Packed', icon: 'cube', color: Colors.statusPacked },
  packed: { status: 'out_for_delivery', label: 'Out for Delivery', icon: 'bicycle', color: Colors.statusShipped },
  out_for_delivery: { status: 'delivered', label: 'Mark as Delivered', icon: 'checkmark-done-circle', color: Colors.statusDelivered },
};

export function OwnerOrderDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: string = route.params?.orderId;
  const [order, setOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    const o = await orderApi.getById(orderId);
    setOrder(o);
  }, [orderId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.ORDERS_CHANGED, load);
    return () => u();
  }, [load]);

  if (!order) {
    return <SafeAreaView style={styles.safe}><Header title="Order" onBack={() => navigation.goBack()} /></SafeAreaView>;
  }

  const advance = () => {
    const ns = nextStatus[order.status];
    if (!ns) return;
    Alert.alert(ns.label, `Update order status to "${ns.label.replace(/^(Confirm|Mark as|Out for)/, '').trim() || 'next step'}"?`, [
      { text: 'Cancel' },
      { text: 'Yes', onPress: () => orderApi.setStatus(order.id, ns.status, `Status updated to ${ns.status}`) },
    ]);
  };

  const cancel = () => {
    Alert.alert('Cancel order', 'Are you sure you want to cancel this order?', [
      { text: 'No' },
      { text: 'Cancel order', style: 'destructive', onPress: () => orderApi.setStatus(order.id, 'cancelled', 'Order cancelled by owner') },
    ]);
  };

  const ns = nextStatus[order.status];
  const isFinal = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={`Order #${order.id.slice(-6).toUpperCase()}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 200 }}>
        <View style={[styles.statusCard, { backgroundColor: isFinal ? (order.status === 'cancelled' ? Colors.error : Colors.statusDelivered) : Colors.primary }]}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={styles.statusValue}>{order.status.toUpperCase().replace('_', ' ')}</Text>
          <Text style={styles.statusSub}>
            Placed on {new Date(order.placedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{order.customerName[0]}</Text></View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.customerPhone}>📞 {order.customerPhone}</Text>
            </View>
            <Pressable style={styles.callBtn} onPress={() => Alert.alert('Call', `Calling ${order.customerPhone}`)}>
              <Ionicons name="call" size={18} color={Colors.white} />
            </Pressable>
          </View>
          <View style={styles.addrBox}>
            <Ionicons name="location" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
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
              <ProductImage emoji={it.image} size={50} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemUnit}>{it.unit} × {it.quantity}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>₹{it.price * it.quantity}</Text>
                <Text style={styles.itemUnit}>₹{it.price} each</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Details</Text>
          <View style={styles.billRow}><Text style={styles.billLabel}>Subtotal</Text><Text style={styles.billValue}>₹{order.subtotal}</Text></View>
          <View style={styles.billRow}><Text style={styles.billLabel}>Delivery</Text><Text style={[styles.billValue, order.deliveryFee === 0 && { color: Colors.success }]}>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</Text></View>
          <View style={styles.billRow}><Text style={styles.billLabel}>Handling</Text><Text style={styles.billValue}>₹{order.handlingFee}</Text></View>
          {order.discount > 0 && <View style={styles.billRow}><Text style={styles.billLabel}>Discount</Text><Text style={[styles.billValue, { color: Colors.success }]}>-₹{order.discount}</Text></View>}
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>₹{order.total}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.payRow}>
            <Ionicons name={order.paymentMethod === 'cod' ? 'cash' : order.paymentMethod === 'upi' ? 'flash' : order.paymentMethod === 'card' ? 'card' : 'wallet'} size={20} color={Colors.primary} />
            <Text style={styles.payMethod}>{order.paymentMethod.toUpperCase()}</Text>
            <Badge text={order.paymentStatus} color={order.paymentStatus === 'paid' ? Colors.success : Colors.warning} small style={{ marginLeft: 'auto' }} />
          </View>
          {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
            <Button title="Mark as Paid" variant="outline" size="sm" onPress={() => orderApi.setPaymentStatus(order.id, 'paid')} style={{ marginTop: Spacing.md }} />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Timeline</Text>
          {order.timeline.slice().reverse().map((t, i) => (
            <View key={i} style={styles.tlRow}>
              <View style={styles.tlDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tlStatus}>{t.status.toUpperCase().replace('_', ' ')}</Text>
                <Text style={styles.tlTime}>{new Date(t.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                {t.note && <Text style={styles.tlNote}>{t.note}</Text>}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {!isFinal && (
        <View style={styles.bottomBar}>
          {!order.status.includes('cancelled') && (
            <Pressable onPress={cancel} style={styles.cancelBtn}>
              <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
            </Pressable>
          )}
          {ns && (
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Button title={ns.label} onPress={advance} size="lg" icon={ns.icon} style={{ backgroundColor: ns.color }} />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  statusCard: { borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, alignItems: 'center' },
  statusLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  statusValue: { color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 },
  statusSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  customerName: { ...Typography.bodyBold, color: Colors.text },
  customerPhone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  addrBox: { flexDirection: 'row', backgroundColor: Colors.gray50, padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.md },
  addrName: { ...Typography.bodyBold, color: Colors.text, fontSize: 12 },
  addrText: { fontSize: 12, color: Colors.text, lineHeight: 16, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemName: { ...Typography.bodyBold, color: Colors.text },
  itemUnit: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { ...Typography.bodyBold, color: Colors.text },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { color: Colors.textSecondary, fontSize: 13 },
  billValue: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.md, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { ...Typography.h4, color: Colors.text },
  totalValue: { ...Typography.h2, color: Colors.text },
  payRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: Radius.md },
  payMethod: { ...Typography.bodyBold, color: Colors.text, marginLeft: Spacing.sm },
  tlRow: { flexDirection: 'row', paddingVertical: Spacing.sm },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginTop: 6, marginRight: Spacing.md },
  tlStatus: { ...Typography.bodyBold, color: Colors.text, fontSize: 13 },
  tlTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  tlNote: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
});
