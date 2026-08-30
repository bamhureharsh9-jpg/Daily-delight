import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { LiveSyncBadge } from '../../components/common/LiveSyncBadge';

const ITEMS = [
  { id: 'Coupons', label: 'Coupons & Offers', icon: 'pricetag', color: Colors.accent, desc: 'Create and manage discount coupons' },
  { id: 'Banners', label: 'Banners & Promos', icon: 'megaphone', color: Colors.statusPacked, desc: 'Home screen promotional banners' },
  { id: 'Categories', label: 'Categories', icon: 'grid', color: Colors.statusShipped, desc: 'Manage product categories' },
  { id: 'DeliveryAreas', label: 'Delivery Areas', icon: 'location', color: Colors.info, desc: 'Serviceable pincodes & radius' },
  { id: 'Reports', label: 'Reports & Analytics', icon: 'bar-chart', color: Colors.statusDelivered, desc: 'Revenue, top products, insights' },
  { id: 'Settings', label: 'Store Settings', icon: 'settings', color: Colors.textSecondary, desc: 'Store info, payment, fees' },
];

export function OwnerMoreScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>Manage your store</Text>
        </View>
        <LiveSyncBadge light />
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <Pressable
          onPress={() => navigation.navigate('ActivityLog')}
          style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}
        >
          <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="pulse" size={24} color="#16A34A" />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.label}>Live Activity Log</Text>
            <Text style={styles.desc}>Real-time data sync between Customer & Owner apps</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.set('role', 'customer');
              url.searchParams.set('t', Date.now().toString());
              window.open(url.toString(), '_blank');
            }
          }}
          style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}
        >
          <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="open-outline" size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.label}>Open Customer App</Text>
            <Text style={styles.desc}>Launch the customer-facing app in a new tab</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>
        {ITEMS.map((it) => (
          <Pressable
            key={it.id}
            onPress={() => navigation.navigate(it.id)}
            style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}
          >
            <View style={[styles.iconBox, { backgroundColor: `${it.color}1A` }]}>
              <Ionicons name={it.icon} size={24} color={it.color} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.label}>{it.label}</Text>
              <Text style={styles.desc}>{it.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  head: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  iconBox: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { ...Typography.h4, color: Colors.text },
  desc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
