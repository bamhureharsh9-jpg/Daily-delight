import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, FlatList } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Category } from '../../db/types';

interface Props {
  categories: Category[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  horizontal?: boolean;
}

export function CategoryGrid({ categories, selectedId, onSelect, horizontal }: Props) {
  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
      >
        {categories.map((c) => {
          const active = selectedId === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => onSelect?.(c.id)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text style={styles.chipEmoji}>{c.icon}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }
  return (
    <View style={styles.grid}>
      {categories.map((c) => {
        const active = selectedId === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect?.(c.id)}
            style={({ pressed }) => [
              styles.gridItem,
              pressed && { backgroundColor: Colors.primaryLight },
            ]}
          >
            <View style={styles.gridIcon}>
              <Text style={{ fontSize: 28 }}>{c.icon}</Text>
            </View>
            <Text style={styles.gridLabel} numberOfLines={2}>{c.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    marginRight: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipEmoji: { fontSize: 26, marginBottom: 2 },
  chipText: { fontSize: 11, color: Colors.text, fontWeight: '600' },
  chipTextActive: { color: Colors.primaryDark },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
  },
  gridIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  gridLabel: { fontSize: 11, color: Colors.text, textAlign: 'center', fontWeight: '600' },
});
