import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { orderApi, addressApi, settingsApi, couponApi } from '../../db/api';
import { Order, Address, AppSettings, Coupon } from '../../db/types';
import { resetDB } from '../../db/database';
import { Button } from '../../components/common/Button';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, setPreviewAs, actualRole, isPreview } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const load = useCallback(async () => {
    const [o, a, s, c] = await Promise.all([
      orderApi.list({ userId: user!.id }),
      addressApi.listForUser(user!.id),
      settingsApi.get(),
      couponApi.active(),
    ]);
    setOrders(o);
    setAddresses(a);
    setSettings(s);
    setCoupons(c);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const totalSpent = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {isPreview && (
          <Pressable style={styles.previewBanner} onPress={() => setPreviewAs(null)}>
            <Ionicons name="eye" size={16} color={Colors.white} />
            <Text style={styles.previewText}>Previewing Customer App • Tap to return to Owner</Text>
            <Ionicons name="close" size={16} color={Colors.white} />
          </Pressable>
        )}
        <View style={styles.profileHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>₹{totalSpent}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coupons.length}</Text>
            <Text style={styles.statLabel}>Offers</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.row} onPress={() => {
            Alert.alert('Switch to Owner App?', 'You will be signed out and taken to the role selector. Use the same database — all your orders and cart will be preserved.', [
              { text: 'Cancel' },
              { text: 'Switch', onPress: () => logout() },
            ]);
          }}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="swap-horizontal" size={20} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Switch to Owner App</Text>
              <Text style={styles.rowSub}>Test the admin panel — same database</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.row} onPress={() => navigation.navigate('ActivityLog')}>
            <View style={[styles.rowIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="pulse" size={20} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Live Activity</Text>
              <Text style={styles.rowSub}>See real-time sync events</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row} onPress={() => navigation.navigate('Orders')}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="receipt" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.rowText}>My Orders</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row} onPress={() => navigation.navigate('Addresses')}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="location" size={20} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Saved Addresses</Text>
              <Text style={styles.rowSub}>{addresses.length} address{addresses.length !== 1 ? 'es' : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row} onPress={() => navigation.navigate('Offers')}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFF4D6' }]}>
              <Ionicons name="pricetag" size={20} color="#E6A700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Offers & Coupons</Text>
              <Text style={styles.rowSub}>{coupons.length} active offers</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.row} onPress={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.set('role', 'owner');
              url.searchParams.set('t', Date.now().toString());
              window.open(url.toString(), '_blank');
            }
          }}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="storefront" size={20} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Open Owner App</Text>
              <Text style={styles.rowSub}>Launch the store admin panel in a new tab</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row} onPress={() => navigation.navigate('ActivityLog')}>
            <View style={[styles.rowIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="pulse" size={20} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Live Activity Log</Text>
              <Text style={styles.rowSub}>See every real-time data sync</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.row} onPress={() => {
            Alert.alert('Back to launcher?', 'You will be signed out. Your data is saved.', [
              { text: 'Cancel' },
              { text: 'Back to launcher', onPress: () => logout() },
            ]);
          }}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.gray100 }]}>
              <Ionicons name="home" size={20} color={Colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Back to app launcher</Text>
              <Text style={styles.rowSub}>Switch to Owner or open another role</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="help-circle" size={20} color={Colors.info} />
            </View>
            <Text style={styles.rowText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="document-text" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.rowText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.error} />
            </View>
            <Text style={styles.rowText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.row} onPress={() => Alert.alert('Contact', `${settings?.storeName}\n${settings?.storePhone}\n${settings?.storeEmail}`)}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="call" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Contact us</Text>
              <Text style={styles.rowSub}>{settings?.storePhone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable style={styles.row} onPress={() => {
            Alert.alert('Reset Demo', 'This will clear all data and reset to seed. Useful for demo.', [
              { text: 'Cancel' },
              { text: 'Reset', style: 'destructive', onPress: async () => { await resetDB(); Alert.alert('Done', 'Please sign in again'); } },
            ]);
          }}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.gray100 }]}>
              <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
            </View>
            <Text style={styles.rowText}>Reset demo data</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.row} onPress={() => {
            Alert.alert('Sign out', 'Are you sure?', [
              { text: 'Cancel' },
              { text: 'Sign out', style: 'destructive', onPress: logout },
            ]);
          }}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="log-out" size={20} color={Colors.error} />
            </View>
            <Text style={[styles.rowText, { color: Colors.error }]}>Sign out</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.version}>Daily Delight v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  previewText: { color: Colors.white, fontSize: 12, fontWeight: '700', marginHorizontal: Spacing.sm },
  profileHead: { backgroundColor: Colors.white, alignItems: 'center', paddingVertical: Spacing.xxl, marginBottom: Spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText: { color: Colors.white, fontSize: 36, fontWeight: '800' },
  name: { ...Typography.h1, color: Colors.text },
  email: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  phone: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h2, color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
  divider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  section: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rowText: { ...Typography.bodyBold, color: Colors.text, flex: 1 },
  rowSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: Spacing.lg },
});
