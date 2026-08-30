import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  helper?: string;
}

export function Input({
  label, error, leftIcon, rightIcon, onRightIconPress,
  containerStyle, helper, style, ...rest
}: Props) {
  return (
    <View style={[{ marginBottom: Spacing.lg }, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.box, error ? styles.boxError : null]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          {...rest}
        />
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={20}
            color={Colors.textSecondary}
            style={{ marginLeft: Spacing.sm }}
            onPress={onRightIconPress}
          />
        )}
      </View>
      {(error || helper) && (
        <Text style={[styles.helper, error ? { color: Colors.error } : null]}>{error || helper}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    minHeight: 50,
  },
  boxError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  helper: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
});
