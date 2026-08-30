import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { Header } from '../../components/common/Header';
import { useSync, ActivityEntry } from '../../context/SyncContext';
import { Button } from '../../components/common/Button';

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatAgo = (ts: number) => {
  const diff = Date.now() - ts;
  if (diff < 5000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
};

const eventColor = (type: string): string => {
  if (type.includes('ORDER')) return Colors.primary;
  if (type.includes('PRODUCT')) return Colors.accent;
  if (type.includes('COUPON')) return Colors.warning;
  if (type.includes('CATEGORY')) return Colors.statusPacked;
  if (type.includes('BANNER')) return Colors.statusShipped;
  if (type.includes('SETTING')) return Colors.info;
  if (type.includes('DELIVERY')) return Colors.statusConfirmed;
  if (type.includes('USER')) return Colors.statusPlaced;
  if (type.includes('CART')) return Colors.statusShipped;
  if (type.includes('SESSION')) return Colors.statusCancelled;
  return Colors.textSecondary;
};

const eventIcon = (type: string): any => {
  if (type.includes('ORDER')) return 'receipt';
  if (type.includes('PRODUCT')) return 'cube';
  if (type.includes('COUPON')) return 'pricetag';
  if (type.includes('CATEGORY')) return 'grid';
  if (type.includes('BANNER')) return 'megaphone';
  if (type.includes('SETTING')) return 'settings';
  if (type.includes('DELIVERY')) return 'location';
  if (type.includes('USER')) return 'people';
  if (type.includes('CART')) return 'cart';
  if (type.includes('SESSION')) return 'log-in';
  return 'flash';
};

export function ActivityLogScreen() {
  const navigation = useNavigation<any>();
  const { activity, clearActivity, peerCount, isConnected, eventCount, tabId } = useSync();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const openInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Live Activity"
        subtitle="Real-time data sync log"
        onBack={() => navigation.goBack()}
        right={
          activity.length > 0 ? (
            <Pressable onPress={clearActivity} hitSlop={8}>
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>Clear</Text>
            </Pressable>
          ) : undefined
        }
      />

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <View style={[styles.dot, { backgroundColor: isConnected ? Colors.success : Colors.error }]} />
          <Text style={styles.statLabel}>{isConnected ? 'Synced' : 'Offline'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Ionicons name="globe-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.statLabel}>{peerCount + 1} tab{peerCount !== 0 ? 's' : ''}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Ionicons name="pulse" size={14} color={Colors.textSecondary} />
          <Text style={styles.statLabel}>{eventCount}</Text>
        </View>
      </View>

      <View style={styles.idBox}>
        <Ionicons name="finger-print" size={14} color={Colors.textMuted} />
        <Text style={styles.idLabel}>Tab ID</Text>
        <Text style={styles.idValue}>{tabId}</Text>
      </View>

      {activity.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyWrap}>
          <Text style={{ fontSize: 56 }}>📡</Text>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyText}>
            Actions in this app — and in any other open tab/window — will appear here in real-time.
          </Text>
          <View style={styles.tipBox}>
            <Ionicons name="bulb" size={16} color={Colors.warning} />
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: '800' }}>Pro tip:</Text> Open this URL in a new tab, log in as the other role, and watch the data flow between the two tabs in real-time.
            </Text>
          </View>
          <Button title="Open in new tab" onPress={openInNewTab} icon="open-outline" variant="outline" style={{ marginTop: Spacing.lg }} />
        </ScrollView>
      ) : (
        <FlatList
          data={activity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item, index }) => {
            const color = eventColor(item.type);
            const icon = eventIcon(item.type);
            const isRemote = item.source === 'remote';
            return (
              <View style={[styles.row, index === 0 && styles.rowLatest]}>
                <View style={styles.timeCol}>
                  <Text style={styles.time}>{formatTime(item.ts)}</Text>
                  <Text style={styles.timeAgo}>{formatAgo(item.ts)}</Text>
                </View>
                <View style={[styles.iconBox, { backgroundColor: `${color}1A` }]}>
                  <Ionicons name={icon} size={16} color={color} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.desc}>{item.description}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.tag, isRemote ? styles.tagRemote : styles.tagLocal]}>
                      <Ionicons
                        name={isRemote ? 'arrow-down-circle' : 'arrow-up-circle'}
                        size={10}
                        color={isRemote ? Colors.info : Colors.success}
                      />
                      <Text style={[styles.tagText, { color: isRemote ? Colors.info : Colors.success }]}>
                        {isRemote ? 'INCOMING' : 'OUTGOING'}
                      </Text>
                    </View>
                    {!isRemote && item.origin !== 'unknown' && (
                      <View style={[styles.tag, { backgroundColor: item.origin === 'owner' ? Colors.accentLight : Colors.primaryLight }]}>
                        <Text style={[styles.tagText, { color: item.origin === 'owner' ? Colors.accentDark : Colors.primaryDark }]}>
                          {item.origin.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {isRemote && (
                      <View style={[styles.tag, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="globe" size={9} color="#92400E" />
                        <Text style={[styles.tagText, { color: '#92400E' }]}>OTHER TAB</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'center' },
  statBox: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  divider: { width: 1, height: 20, backgroundColor: Colors.border },
  idBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.gray50, gap: 6 },
  idLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  idValue: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'monospace' },
  emptyWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginTop: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20, maxWidth: 320 },
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFBEB', padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.xl, maxWidth: 340, gap: 8, borderWidth: 1, borderColor: '#FDE68A' },
  tipText: { ...Typography.body, color: '#92400E', fontSize: 12, lineHeight: 18, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  rowLatest: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: Colors.primaryLight },
  timeCol: { width: 64 },
  time: { fontSize: 10, color: Colors.textSecondary, fontWeight: '800' },
  timeAgo: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
  iconBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  desc: { ...Typography.bodyBold, color: Colors.text, fontSize: 13 },
  metaRow: { flexDirection: 'row', marginTop: 4, gap: 6, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, gap: 3 },
  tagLocal: { backgroundColor: '#E8F5E9' },
  tagRemote: { backgroundColor: '#E3F2FD' },
  tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
});
