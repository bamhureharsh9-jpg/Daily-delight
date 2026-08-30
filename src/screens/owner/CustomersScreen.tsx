import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { userApi, orderApi } from '../../db/api';
import { User, Order } from '../../db/types';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { realtime, Events } from '../../db/realtime';

export function CustomersScreen() {
  const navigation = useNavigation<any>();
  const [customers, setCustomers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [users, allOrders] = await Promise.all([userApi.list('customer'), orderApi.list()]);
    setCustomers(users as User[]);
    setOrders(allOrders);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u1 = realtime.on(Events.USERS_CHANGED, load);
    const u2 = realtime.on(Events.ORDERS_CHANGED, load);
    return () => { u1(); u2(); };
  }, [load]);

  const stats = (id: string) => {
    const co = orders.filter((o) => o.userId === id);
    const total = co.reduce((s, o) => s + (o.status === 'cancelled' ? 0 : o.total), 0);
    return { count: co.length, total };
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleBlock = (c: User) => {
    Alert.alert(c.blocked ? 'Unblock customer?' : 'Block customer?', `${c.name} will ${c.blocked ? 'be able to' : 'not be able to'} place orders.`, [
      { text: 'Cancel' },
      { text: c.blocked ? 'Unblock' : 'Block', style: 'destructive', onPress: () => userApi.toggleBlock(c.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Customers" subtitle={`${customers.length} registered`} onBack={() => navigation.goBack()} />
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search by name, email, phone…" placeholderTextColor={Colors.textMuted} style={styles.searchInput} />
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const s = stats(item.id);
          return (
            <Pressable style={styles.card} onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}>
              <View style={[styles.avatar, item.blocked && { backgroundColor: Colors.error }]}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.blocked && <Badge text="Blocked" color={Colors.error} small style={{ marginLeft: 6 }} />}
                </View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.phone}>📞 {item.phone}</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statItem}><Text style={styles.statNum}>{s.count}</Text> orders</Text>
                  <Text style={styles.statDivider}>•</Text>
                  <Text style={styles.statItem}><Text style={styles.statNum}>₹{s.total}</Text> spent</Text>
                </View>
              </View>
              <Pressable onPress={() => handleBlock(item)} style={styles.actionBtn} hitSlop={6}>
                <Ionicons name={item.blocked ? 'lock-open' : 'ban'} size={18} color={item.blocked ? Colors.success : Colors.error} />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState emoji="👥" title="No customers" message="Customers will appear here after signup" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  toolbar: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.md },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, marginLeft: Spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  name: { ...Typography.bodyBold, color: Colors.text },
  email: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  phone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statItem: { fontSize: 11, color: Colors.textSecondary },
  statNum: { fontWeight: '800', color: Colors.text },
  statDivider: { marginHorizontal: 6, color: Colors.textMuted },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
});
