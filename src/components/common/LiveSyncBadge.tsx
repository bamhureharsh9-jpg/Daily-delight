import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../theme';
import { useSync } from '../../context/SyncContext';
import { useNavigation } from '@react-navigation/native';

export function LiveSyncBadge({ light = false }: { light?: boolean }) {
  const { lastSync, peerCount, isConnected, eventCount } = useSync();
  const navigation = useNavigation<any>();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [timeAgo, setTimeAgo] = useState('—');

  useEffect(() => {
    if (!lastSync) return;
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.4, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [lastSync]);

  useEffect(() => {
    const update = () => {
      if (!lastSync) { setTimeAgo('—'); return; }
      const diff = Date.now() - lastSync;
      if (diff < 2000) setTimeAgo('now');
      else if (diff < 60000) setTimeAgo(`${Math.floor(diff / 1000)}s`);
      else if (diff < 3600000) setTimeAgo(`${Math.floor(diff / 60000)}m`);
      else setTimeAgo(`${Math.floor(diff / 3600000)}h`);
    };
    const t = setInterval(update, 1000);
    update();
    return () => clearInterval(t);
  }, [lastSync]);

  const bg = light ? 'rgba(255,255,255,0.18)' : Colors.primaryLight;
  const fg = light ? Colors.white : Colors.primaryDark;
  const subFg = light ? 'rgba(255,255,255,0.75)' : Colors.primary;

  return (
    <Pressable
      style={[styles.badge, { backgroundColor: bg }]}
      onPress={() => navigation.navigate('ActivityLog')}
    >
      <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }, isConnected ? styles.dotActive : styles.dotInactive]} />
      <View>
        <Text style={[styles.title, { color: fg }]}>● LIVE</Text>
        <Text style={[styles.subtitle, { color: subFg }]}>
          {isConnected ? `${peerCount + 1} tab${peerCount !== 0 ? 's' : ''} • ${timeAgo}` : 'offline'}
        </Text>
      </View>
      <View style={[styles.count, light ? { backgroundColor: Colors.white } : { backgroundColor: Colors.primary }]}>
        <Text style={[styles.countText, { color: light ? Colors.primary : Colors.white }]}>{eventCount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginRight: Spacing.sm,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#22C55E', shadowColor: '#22C55E', shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  dotInactive: { backgroundColor: Colors.gray400 },
  title: { fontSize: 10, fontWeight: '900', lineHeight: 11, letterSpacing: 0.5 },
  subtitle: { fontSize: 9, lineHeight: 10, fontWeight: '700' },
  count: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: Radius.pill, marginLeft: 2, minWidth: 18, alignItems: 'center' },
  countText: { fontSize: 9, fontWeight: '900' },
});
