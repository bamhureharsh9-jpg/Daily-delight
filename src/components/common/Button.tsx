import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  icon, iconPosition = 'left', loading, disabled, fullWidth, style, textStyle,
}: Props) {
  const palette = {
    primary: { bg: Colors.primary, fg: Colors.white, border: Colors.primary },
    accent: { bg: Colors.accent, fg: Colors.white, border: Colors.accent },
    outline: { bg: 'transparent', fg: Colors.primary, border: Colors.primary },
    ghost: { bg: Colors.gray100, fg: Colors.text, border: 'transparent' },
    danger: { bg: Colors.error, fg: Colors.white, border: Colors.error },
  }[variant];

  const sizing = {
    sm: { padV: Spacing.sm, padH: Spacing.lg, font: 13, h: 36 },
    md: { padV: Spacing.md, padH: Spacing.xl, font: 15, h: 48 },
    lg: { padV: Spacing.lg, padH: Spacing.xl, font: 16, h: 54 },
  }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingVertical: sizing.padV,
          paddingHorizontal: sizing.padH,
          minHeight: sizing.h,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={sizing.font + 3} color={palette.fg} style={{ marginRight: Spacing.sm }} />
          )}
          <Text style={[{ color: palette.fg, fontSize: sizing.font, fontWeight: '700' }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={sizing.font + 3} color={palette.fg} style={{ marginLeft: Spacing.sm }} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
