import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography, Brand } from '../../theme';
import { useSync } from '../../context/SyncContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { resetDB, loadDB } from '../../db/database';
import { useNavigation } from '@react-navigation/native';

export function RoleSelectScreen({ navigation }: any) {
  const { isConnected, peerCount, tabId, eventCount } = useSync();
  const { user, logout } = useAuth();
  const [showDemo, setShowDemo] = useState(false);

  const isWeb = typeof window !== 'undefined';
  const isMobile = Dimensions.get('window').width < 768;

  const openApp = (role: 'customer' | 'owner') => {
    navigation.navigate('Login', { role });
  };

  const openInNewTab = (role: 'customer' | 'owner') => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('role', role);
      window.open(url.toString(), '_blank');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🛒</Text>
          </View>
          <Text style={styles.brand}>{Brand.name}</Text>
          <Text style={styles.tagline}>{Brand.tagline}</Text>

          <View style={styles.syncChip}>
            <View style={[styles.syncDot, isConnected ? styles.syncDotActive : styles.syncDotInactive]} />
            <Text style={styles.syncText}>
              {isConnected
                ? `Live sync active • ${peerCount + 1} tab${peerCount !== 0 ? 's' : ''}`
                : 'Single-tab mode • all data flows in real-time'}
            </Text>
          </View>
        </View>

        <View style={styles.cardWrap}>
          <Text style={styles.welcome}>Daily Delight Platform</Text>
          <Text style={styles.subtitle}>Two apps, one database, fully synced in real-time</Text>

          {/* Customer App Card */}
          <View style={[styles.appCard, { borderColor: Colors.primary }]}>
            <View style={[styles.appIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="cart" size={32} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.appLabel}>CUSTOMER APP</Text>
              <Text style={styles.appName}>Daily Delight</Text>
              <Text style={styles.appDesc}>Browse products, place orders, track deliveries, apply coupons</Text>
              <View style={styles.demoCredentials}>
                <Text style={styles.demoCredLabel}>Demo: priya@example.com / priya123</Text>
              </View>
            </View>
          </View>
          <View style={styles.appActions}>
            <Pressable onPress={() => openApp('customer')} style={[styles.primaryBtn, { backgroundColor: Colors.primary }]}>
              <Ionicons name="log-in" size={16} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Open Customer App</Text>
            </Pressable>
            {!isMobile && (
              <Pressable onPress={() => openInNewTab('customer')} style={styles.secondaryBtn}>
                <Ionicons name="open-outline" size={14} color={Colors.primary} />
                <Text style={[styles.secondaryBtnText, { color: Colors.primary }]}>New tab</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>↓ BOTH APPS SHARE ONE DATABASE ↓</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Owner App Card */}
          <View style={[styles.appCard, { borderColor: Colors.accent }]}>
            <View style={[styles.appIcon, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="storefront" size={32} color={Colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={[styles.appLabel, { color: Colors.accent }]}>OWNER / ADMIN APP</Text>
              <Text style={styles.appName}>Daily Delight Owner</Text>
              <Text style={styles.appDesc}>Manage products, orders, customers, coupons, banners & settings</Text>
              <View style={styles.demoCredentials}>
                <Text style={styles.demoCredLabel}>Demo: owner@dailydelight.in / owner123</Text>
              </View>
            </View>
          </View>
          <View style={styles.appActions}>
            <Pressable onPress={() => openApp('owner')} style={[styles.primaryBtn, { backgroundColor: Colors.accent }]}>
              <Ionicons name="log-in" size={16} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Open Owner App</Text>
            </Pressable>
            {!isMobile && (
              <Pressable onPress={() => openInNewTab('owner')} style={[styles.secondaryBtn, { borderColor: Colors.accent }]}>
                <Ionicons name="open-outline" size={14} color={Colors.accent} />
                <Text style={[styles.secondaryBtnText, { color: Colors.accent }]}>New tab</Text>
              </Pressable>
            )}
          </View>

          {/* Quick Demo */}
          <View style={styles.demoBox}>
            <View style={styles.demoHead}>
              <Ionicons name="rocket" size={18} color={Colors.info} />
              <Text style={styles.demoHeadText}>Quick Demo (same tab)</Text>
            </View>
            <Text style={styles.demoBody}>
              1. Open Customer App → login as Priya → add items to cart → place an order{'\n'}
              2. Open Owner App (in this same tab) → login → you'll see the new order immediately{'\n'}
              3. Edit a product price in Owner App → switch back to Customer App → price is updated
            </Text>
            <Text style={styles.demoHint}>
              💡 Every action emits a real-time event. The data is shared through a persistent local database.
            </Text>
          </View>

          <View style={styles.tabIdBox}>
            <Ionicons name="finger-print" size={12} color={Colors.textMuted} />
            <Text style={styles.tabIdText}>Session: {tabId}</Text>
            {eventCount > 0 && (
              <View style={styles.eventChip}>
                <Text style={styles.eventChipText}>{eventCount} events</Text>
              </View>
            )}
          </View>

          {user && (
            <Button
              title={`Sign out (${user.role})`}
              variant="outline"
              onPress={() => {
                logout();
              }}
              style={{ marginTop: Spacing.lg }}
            />
          )}

          <Pressable onPress={() => {
            if (confirm('Reset all data to defaults? This is irreversible.')) {
              resetDB();
            }
          }} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset demo data</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={showDemo} onClose={() => setShowDemo(false)} title="How it works">
        <Text style={styles.howText}>
          Daily Delight is a complete grocery delivery platform with two apps connected to one shared database.
        </Text>
        <Text style={styles.howText}>
          <Text style={{ fontWeight: '800' }}>Single-tab mode: </Text>
          Open Customer App, place an order, then open Owner App in the same tab. All data flows instantly through the shared database. Switch back to Customer — changes from Owner are visible.
        </Text>
        <Text style={styles.howText}>
          <Text style={{ fontWeight: '800' }}>Multi-tab mode: </Text>
          On desktop, click "New tab" to open the other app in a separate browser tab. Both tabs sync in real-time via BroadcastChannel. Actions in one tab appear as toast notifications in the other.
        </Text>
        <Text style={styles.howText}>
          <Text style={{ fontWeight: '800' }}>Architecture: </Text>
          All mutations go through the API layer which writes to a persistent local database and emits a real-time event. Every subscribed screen (in any tab) refreshes automatically.
        </Text>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  hero: { alignItems: 'center', paddingTop: Spacing.huge, paddingBottom: Spacing.xl },
  logo: { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  logoText: { fontSize: 44 },
  brand: { ...Typography.h1, color: Colors.white, marginBottom: 4 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500' },
  syncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginTop: Spacing.md,
    gap: 6,
  },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncDotActive: { backgroundColor: '#4ADE80', shadowColor: '#4ADE80', shadowOpacity: 1, shadowRadius: 4 },
  syncDotInactive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  syncText: { color: Colors.white, fontSize: 11, fontWeight: '700' },

  cardWrap: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  welcome: { ...Typography.h1, color: Colors.text, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },

  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
  },
  appIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  appLabel: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1, marginBottom: 2 },
  appName: { ...Typography.h2, color: Colors.text, marginBottom: 4 },
  appDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  demoCredentials: { marginTop: 6, backgroundColor: Colors.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  demoCredLabel: { fontSize: 11, color: Colors.text, fontWeight: '700' },

  appActions: { flexDirection: 'row', marginTop: Spacing.sm, marginBottom: Spacing.lg, gap: Spacing.sm },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 6,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: 4,
  },
  secondaryBtnText: { fontWeight: '700', fontSize: 12 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 10, marginHorizontal: Spacing.md, fontWeight: '800', letterSpacing: 1 },

  demoBox: { backgroundColor: '#EFF6FF', padding: Spacing.lg, borderRadius: Radius.md, marginTop: Spacing.lg, borderWidth: 1, borderColor: '#BFDBFE' },
  demoHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  demoHeadText: { ...Typography.h4, color: Colors.info, fontSize: 14 },
  demoBody: { fontSize: 12, color: Colors.text, lineHeight: 18, marginBottom: Spacing.sm },
  demoHint: { fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 16 },

  tabIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    gap: 6,
  },
  tabIdText: { fontSize: 10, color: Colors.textMuted, fontFamily: 'monospace' },
  eventChip: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.pill },
  eventChipText: { color: Colors.white, fontSize: 9, fontWeight: '800' },

  resetBtn: { alignItems: 'center', marginTop: Spacing.md, padding: Spacing.sm },
  resetText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  howText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
});
