import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { couponApi } from '../../db/api';
import { Coupon } from '../../db/types';
import { CouponCard } from '../../components/customer/CouponCard';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { realtime, Events } from '../../db/realtime';

export function OffersScreen() {
  const navigation = useNavigation<any>();
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const load = useCallback(async () => {
    const c = await couponApi.active();
    setCoupons(c);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.COUPONS_CHANGED, load);
    return () => u();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Offers & Coupons" subtitle="Save more on your orders" onBack={() => navigation.goBack()} />
      <FlatList
        data={coupons}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => <CouponCard coupon={item} />}
        ListEmptyComponent={<EmptyState emoji="🏷️" title="No active offers" message="Check back later for exciting deals" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
});
