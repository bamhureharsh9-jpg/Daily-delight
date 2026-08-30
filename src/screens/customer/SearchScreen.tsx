import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { productApi, categoryApi } from '../../db/api';
import { realtime, Events } from '../../db/realtime';
import { Product, Category } from '../../db/types';
import { ProductCard } from '../../components/customer/ProductCard';
import { CategoryGrid } from '../../components/customer/CategoryGrid';
import { EmptyState } from '../../components/common/EmptyState';

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [q, setQ] = useState(route.params?.filter ? '' : '');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rel' | 'low' | 'high'>('rel');

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([productApi.list({ activeOnly: true }), categoryApi.list()]);
    setAllProducts(p);
    setCategories(c);
  }, []);

  useEffect(() => {
    load();
    const u1 = realtime.on(Events.PRODUCTS_CHANGED, load);
    const u2 = realtime.on(Events.CATEGORIES_CHANGED, load);
    return () => { u1(); u2(); };
  }, [load]);

  const results = useMemo(() => {
    let list = allProducts;
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(ql) || p.description.toLowerCase().includes(ql) || p.tags.some((t) => t.toLowerCase().includes(ql))
      );
    }
    if (route.params?.filter === 'bestseller') {
      list = list.filter((p) => p.tags.includes('bestseller'));
    }
    if (selectedCat) list = list.filter((p) => p.categoryId === selectedCat);
    list = list.slice();
    if (sortBy === 'low') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'high') list.sort((a, b) => b.price - a.price);
    return list;
  }, [q, allProducts, selectedCat, sortBy, route.params?.filter]);

  const trending = ['Milk', 'Bread', 'Eggs', 'Tomato', 'Paneer', 'Atta'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search groceries…"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            autoFocus
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Pressable
          onPress={() => setSelectedCat(null)}
          style={[styles.chip, !selectedCat && styles.chipActive]}
        >
          <Text style={[styles.chipText, !selectedCat && styles.chipTextActive]}>All</Text>
        </Pressable>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setSelectedCat(c.id === selectedCat ? null : c.id)}
            style={[styles.chip, selectedCat === c.id && styles.chipActive]}
          >
            <Text style={{ fontSize: 14, marginRight: 4 }}>{c.icon}</Text>
            <Text style={[styles.chipText, selectedCat === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.toolbar}>
        <Text style={styles.resultText}>{results.length} results</Text>
        <View style={styles.sortRow}>
          {(['rel', 'low', 'high'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSortBy(s)}
              style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
            >
              <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
                {s === 'rel' ? 'Relevance' : s === 'low' ? '₹ Low-High' : '₹ High-Low'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {!q && !selectedCat && !route.params?.filter && (
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          <Text style={styles.trendingLabel}>🔥 Trending searches</Text>
          <View style={styles.trendRow}>
            {trending.map((t) => (
              <Pressable key={t} style={styles.trendChip} onPress={() => setQ(t)}>
                <Text style={styles.trendText}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {results.length === 0 ? (
        <EmptyState emoji="🔍" title="No products found" message={`Try a different search or category`} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: Spacing.lg }}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={{ width: '48%', marginBottom: Spacing.md }}>
              <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  back: { marginRight: Spacing.md },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text, marginLeft: Spacing.sm },
  chipsRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.text, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: Colors.white },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  resultText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  sortRow: { flexDirection: 'row' },
  sortBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.gray100, marginLeft: 6 },
  sortBtnActive: { backgroundColor: Colors.primaryLight },
  sortText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  sortTextActive: { color: Colors.primaryDark },
  trendingLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700', marginBottom: Spacing.sm, letterSpacing: 0.5 },
  trendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  trendChip: { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.gray100 },
  trendText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
});
