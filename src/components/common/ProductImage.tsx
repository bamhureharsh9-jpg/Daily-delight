import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../theme';

interface Props {
  emoji: string;
  size?: number;
  style?: ViewStyle;
  bg?: string;
}

// Big emoji "image" - since we don't have real product photos, we use
// a clean tile with the emoji as visual. Looks polished and consistent.
export function ProductImage({ emoji, size = 80, style, bg }: Props) {
  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.min(size * 0.25, Radius.lg),
          backgroundColor: bg || Colors.gray100,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
