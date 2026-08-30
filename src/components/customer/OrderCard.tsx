import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Order, OrderStatus } from '../../db/types';

interface Props {
  order: Order;
}

const statusInfo: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  placed: { label: 'Order Placed', color: Colors.statusPlaced, icon: '📝' },
  confirmed: { label: 'Confirmed', color: Colors.statusConfirmed, icon: '✅' },
  packed: { label: 'Packed', color: Colors.statusPacked, icon: '📦' },
  out_for_delivery: { label: 'On the way', color: Colors.statusShipped, icon: '🚚' },
  delivered: { label: 'Delivered', color: Colors.statusDelivered, icon: '🎉' },
  cancelled: { label: 'Cancelled', color: Colors.statusCancelled, icon: '❌' },
};

export function OrderCard({ order }: Props) {
  const info = statusInfo[order.status];
  const date = new Date(order.placedAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.id}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.date}>{dateStr} • {timeStr}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${info.color}1A` }]}>
          <Text style={{ fontSize: 12 }}>{info.icon}</Text>
          <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
        </View>
      </View>
      <View style={styles.items}>
        {order.items.slice(0, 3).map((it, idx) => (
          <View key={idx} style={styles.itemEmoji}>
            <Text style={{ fontSize: 30 }}>{it.image}</Text>
          </View>
        ))}
        {order.items.length > 3 && (
          <View style={[styles.itemEmoji, { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>+{order.items.length - 3}</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.itemText} numberOfLines={1}>{itemCount} items • {order.items[0]?.name}</Text>
          <Text style={styles.address} numberOfLines={1}>📍 {order.address.line1}</Text>
        </View>
      </View>
      <View style={styles.foot}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{order.total}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  id: { ...Typography.h4, color: Colors.text },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
  items: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  itemEmoji: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginRight: -8, borderWidth: 2, borderColor: Colors.white },
  itemText: { ...Typography.bodyBold, color: Colors.text },
  address: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  totalValue: { fontSize: 17, fontWeight: '800', color: Colors.text },
});
