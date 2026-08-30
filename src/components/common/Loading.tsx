import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

export function Loading({ full = false }: { full?: boolean }) {
  if (full) {
    return (
      <View style={styles.full}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }
  return <ActivityIndicator color={Colors.primary} />;
}

const styles = StyleSheet.create({
  full: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
