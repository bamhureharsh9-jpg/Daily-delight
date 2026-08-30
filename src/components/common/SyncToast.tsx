import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { ActivityEntry } from '../../context/SyncContext';

interface Props {
  entry: ActivityEntry | null;
  onDismiss: () => void;
}

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
  return 'flash';
};

export function SyncToast({ entry, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!entry) return;
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 2500);
    return () => clearTimeout(t);
  }, [entry?.id]);

  if (!entry) return null;

  const color = eventColor(entry.type);
  const icon = eventIcon(entry.type);
  const isRemote = entry.source === 'remote';

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, { transform: [{ translateY }], opacity }]}>
      <Pressable style={styles.toast} onPress={onDismiss}>
        <View style={[styles.icon, { backgroundColor: `${color}1A` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.title} numberOfLines={1}>{entry.description}</Text>
          <Text style={styles.subtitle}>
            {isRemote ? '↘ Received from other app' : '↗ Synced to other apps'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 60, left: 16, right: 16, zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.bodyBold, color: Colors.text, fontSize: 13 },
  subtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
});
