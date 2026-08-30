import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { couponApi } from '../../db/api';
import { Coupon } from '../../db/types';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { CouponCard } from '../../components/customer/CouponCard';
import { realtime, Events } from '../../db/realtime';

export function CouponsScreen() {
  const navigation = useNavigation<any>();
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const load = useCallback(async () => {
    const c = await couponApi.list();
    setCoupons(c);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.COUPONS_CHANGED, load);
    return () => u();
  }, [load]);

  const handleToggle = (c: Coupon) => {
    couponApi.update(c.id, { active: !c.active });
  };

  const handleDelete = (c: Coupon) => {
    Alert.alert('Delete coupon', `Delete "${c.code}"?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => couponApi.remove(c.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Coupons & Offers"
        subtitle={`${coupons.filter(c => c.active).length} active`}
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={() => navigation.navigate('AddCoupon')} style={styles.addBtn} hitSlop={8}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </Pressable>
        }
      />
      <FlatList
        data={coupons}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.couponWrap}>
            <CouponCard coupon={item} />
            <View style={styles.couponActions}>
              <Pressable onPress={() => navigation.navigate('EditCoupon', { couponId: item.id })} style={styles.actionBtn}>
                <Ionicons name="create-outline" size={16} color={Colors.primary} />
                <Text style={[styles.actionText, { color: Colors.primary }]}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => handleToggle(item)} style={styles.actionBtn}>
                <Ionicons name={item.active ? 'pause' : 'play'} size={16} color={item.active ? Colors.warning : Colors.success} />
                <Text style={[styles.actionText, { color: item.active ? Colors.warning : Colors.success }]}>{item.active ? 'Disable' : 'Enable'}</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              <View style={styles.usageBox}>
                <Text style={styles.usageNum}>{item.usedCount}</Text>
                <Text style={styles.usageLabel}>used</Text>
              </View>
              <Pressable onPress={() => handleDelete(item)} hitSlop={6} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🏷️"
            title="No coupons yet"
            message="Create coupons to offer discounts to your customers"
            action={<Button title="Create Coupon" onPress={() => navigation.navigate('AddCoupon')} />}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  couponWrap: { marginBottom: Spacing.lg },
  couponActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, marginTop: -Spacing.sm, paddingTop: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: Colors.white, borderRadius: Radius.sm, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  actionText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
  usageBox: { alignItems: 'flex-end', marginRight: Spacing.md },
  usageNum: { fontSize: 16, fontWeight: '800', color: Colors.text },
  usageLabel: { fontSize: 10, color: Colors.textSecondary },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
});
