import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  emoji?: string;
}

export function SectionHeader({ title, subtitle, action, onAction, emoji }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        {emoji && <Text style={{ fontSize: 20, marginRight: Spacing.sm }}>{emoji}</Text>}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  action: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
});
