import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme';

interface Props {
  text: string;
  color?: string;
  bg?: string;
  small?: boolean;
  style?: ViewStyle;
  outline?: boolean;
}

export function Badge({ text, color = Colors.primary, bg, small, style, outline }: Props) {
  return (
    <View
      style={[
        styles.badge,
        small && { paddingVertical: 2, paddingHorizontal: 6 },
        outline
          ? { backgroundColor: 'transparent', borderColor: color, borderWidth: 1 }
          : { backgroundColor: bg || `${color}1A` },
        style,
      ]}
    >
      <Text
        style={[
          { color, fontSize: small ? 10 : 11, fontWeight: '700', letterSpacing: 0.2 },
          outline && { color },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
});
