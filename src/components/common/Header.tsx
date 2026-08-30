import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Shadow } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  large?: boolean;
}

export function Header({ title, subtitle, onBack, right, rightIcon, onRightPress, large }: Props) {
  return (
    <View style={[styles.bar, large && { paddingTop: Spacing.lg, paddingBottom: Spacing.lg }]}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
      ) : (
        <View style={styles.backBtn} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, large && { fontSize: 22 }]} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right ? (
        <View style={styles.rightWrap}>{right}</View>
      ) : rightIcon ? (
        <Pressable onPress={onRightPress} style={styles.backBtn} hitSlop={10}>
          <Ionicons name={rightIcon} size={24} color={Colors.text} />
        </Pressable>
      ) : (
        <View style={styles.backBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightWrap: { flexDirection: 'row', alignItems: 'center' },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
