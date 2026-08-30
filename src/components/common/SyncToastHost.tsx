import React, { useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSync, ActivityEntry } from '../../context/SyncContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Radius, Spacing, Shadow } from '../../theme';

// Renders a small floating "pill" at the top of the app that shows the latest sync
// event. Auto-dismisses after a few seconds. Visible across all screens.

export function SyncToastHost() {
  const { activity } = useSync();
  const { actualRole, setPreviewAs, isPreview, user } = useAuth();
  const navigation = useNavigation<any>();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [latest, setLatest] = useState<ActivityEntry | null>(null);

  useEffect(() => {
    if (!activity.length) return;
    const top = activity[0];
    if (top.id === dismissed) return;
    setLatest(top);
  }, [activity, dismissed]);

  useEffect(() => {
    if (!latest) return;
    const t = setTimeout(() => {
      setDismissed(latest.id);
      setLatest(null);
    }, 3500);
    return () => clearTimeout(t);
  }, [latest?.id]);

  if (!latest) return null;

  const color = latest.type.includes('ORDER') ? Colors.primary
    : latest.type.includes('PRODUCT') ? Colors.accent
    : latest.type.includes('COUPON') ? Colors.warning
    : latest.type.includes('CATEGORY') ? Colors.statusPacked
    : latest.type.includes('BANNER') ? Colors.statusShipped
    : latest.type.includes('SETTING') ? Colors.info
    : latest.type.includes('DELIVERY') ? Colors.statusConfirmed
    : latest.type.includes('USER') ? Colors.statusPlaced
    : latest.type.includes('CART') ? Colors.statusShipped
    : Colors.textSecondary;

  const icon = latest.type.includes('ORDER') ? 'receipt'
    : latest.type.includes('PRODUCT') ? 'cube'
    : latest.type.includes('COUPON') ? 'pricetag'
    : latest.type.includes('CATEGORY') ? 'grid'
    : latest.type.includes('BANNER') ? 'megaphone'
    : latest.type.includes('SETTING') ? 'settings'
    : latest.type.includes('DELIVERY') ? 'location'
    : latest.type.includes('USER') ? 'people'
    : latest.type.includes('CART') ? 'cart'
    : 'flash';

  const isRemote = latest.source === 'remote';
  const label = isRemote ? '↘ Synced from other tab' : '↗ Synced to other apps';

  // If we're in the customer app, the most useful action is to view the affected
  // resource. Same for owner.
  const handlePress = () => {
    setDismissed(latest.id);
    setLatest(null);
    if (latest.type.includes('ORDER') && actualRole === 'owner') {
      navigation.navigate('MainTabs', { screen: 'Orders' });
    } else if (latest.type.includes('ORDER') && actualRole === 'customer') {
      navigation.navigate('Orders');
    } else if (latest.type.includes('PRODUCT') && actualRole === 'customer') {
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else if (latest.type.includes('PRODUCT') && actualRole === 'owner') {
      navigation.navigate('MainTabs', { screen: 'Products' });
    } else {
      navigation.navigate('ActivityLog');
    }
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable style={styles.toast} onPress={handlePress}>
        <View style={[styles.iconBox, { backgroundColor: `${color}1A` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.title} numberOfLines={1}>{latest.description}</Text>
          <Text style={styles.sub}>{label}</Text>
        </View>
        <View style={[styles.dot, { backgroundColor: isRemote ? Colors.info : Colors.success }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
});
