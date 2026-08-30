import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { userApi, orderApi, addressApi } from '../../db/api';
import { User, Order, Address } from '../../db/types';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { ProductImage } from '../../components/common/ProductImage';
import { OrderCard } from '../../components/customer/OrderCard';
import { EmptyState } from '../../components/common/EmptyState';

export function CustomerDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const customerId: string = route.params?.customerId;
  const [customer, setCustomer] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const load = useCallback(async () => {
    const [c, o, a] = await Promise.all([userApi.getById(customerId), orderApi.list({ userId: customerId }), addressApi.listForUser(customerId)]);
    setCustomer(c as User);
    setOrders(o);
    setAddresses(a);
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  if (!customer) {
    return <SafeAreaView style={styles.safe}><Header title="Customer" onBack={() => navigation.goBack()} /></SafeAreaView>;
  }

  const totalSpent = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const activeOrders = orders.filter((o) => ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(o.status)).length;

  const toggleBlock = () => {
    Alert.alert(customer.blocked ? 'Unblock customer?' : 'Block customer?', `${customer.name} will ${customer.blocked ? 'be able to' : 'not be able to'} place orders.`, [
      { text: 'Cancel' },
      { text: customer.blocked ? 'Unblock' : 'Block', style: 'destructive', onPress: async () => { await userApi.toggleBlock(customer.id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Customer Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <View style={styles.profileCard}>
          <View style={[styles.avatar, customer.blocked && { backgroundColor: Colors.error }]}>
            <Text style={styles.avatarText}>{customer.name[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.email}>{customer.email}</Text>
          <Text style={styles.phone}>📞 {customer.phone}</Text>
          {customer.blocked && <View style={styles.blockedBadge}><Text style={styles.blockedText}>⚠️ Account Blocked</Text></View>}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statNum}>{orders.length}</Text><Text style={styles.statLabel}>Orders</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{activeOrders}</Text><Text style={styles.statLabel}>Active</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>₹{totalSpent}</Text><Text style={styles.statLabel}>Spent</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{customer.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{customer.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>Member since {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saved Addresses ({addresses.length})</Text>
          {addresses.length === 0 ? (
            <Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: Spacing.lg }}>No saved addresses</Text>
          ) : addresses.map((a) => (
            <View key={a.id} style={styles.addrBox}>
              <Ionicons name="location" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.addrName}>{a.label}{a.isDefault && ' • Default'}</Text>
                <Text style={styles.addrText}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
                <Text style={styles.addrText}>{a.city}, {a.state} - {a.pincode}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order History ({orders.length})</Text>
          {orders.length === 0 ? (
            <Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: Spacing.lg }}>No orders yet</Text>
          ) : orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </View>

        <Button title={customer.blocked ? 'Unblock Customer' : 'Block Customer'} variant="danger" size="lg" fullWidth onPress={toggleBlock} icon={customer.blocked ? 'lock-open' : 'ban'} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  profileCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText: { color: Colors.white, fontSize: 36, fontWeight: '800' },
  name: { ...Typography.h1, color: Colors.text },
  email: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  phone: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  blockedBadge: { backgroundColor: '#FFE0E0', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill, marginTop: Spacing.md },
  blockedText: { color: Colors.error, fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { ...Typography.h2, color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoText: { fontSize: 13, color: Colors.text, marginLeft: Spacing.sm },
  addrBox: { flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: Radius.md, marginBottom: Spacing.sm },
  addrName: { ...Typography.bodyBold, color: Colors.text, fontSize: 13 },
  addrText: { fontSize: 12, color: Colors.text, lineHeight: 16, marginTop: 2 },
});
