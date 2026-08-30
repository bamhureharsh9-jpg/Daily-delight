import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, emoji, title, message, action }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        {emoji ? (
          <Text style={{ fontSize: 56 }}>{emoji}</Text>
        ) : (
          <Ionicons name={icon || 'cube-outline'} size={56} color={Colors.textMuted} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && <View style={{ marginTop: Spacing.xl }}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.huge,
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
