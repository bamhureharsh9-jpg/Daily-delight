import React from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

interface Props {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  selected?: boolean;
  style?: any;
  padding?: number;
}

export function ListRow({ onPress, onLongPress, children, selected, style, padding = Spacing.lg }: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        { padding },
        selected && { backgroundColor: Colors.primaryLight },
        pressed && { backgroundColor: Colors.gray100 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
});
