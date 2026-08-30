import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { productApi, categoryApi } from '../../db/api';
import { Product, Category } from '../../db/types';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { realtime, Events } from '../../db/realtime';

export function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'inactive'>('all');

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([productApi.list(), categoryApi.listAll()]);
    setProducts(p);
    setCategories(c);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.PRODUCTS_CHANGED, load);
    return () => u();
  }, [load]);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name || '—';

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'low' && p.stock >= 30) return false;
    if (filter === 'inactive' && p.active) return false;
    return true;
  });

  const handleDelete = (p: Product) => {
    Alert.alert('Delete product', `Delete "${p.name}"? This cannot be undone.`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => productApi.remove(p.id) },
    ]);
  };

  const toggleActive = (p: Product) => {
    Alert.alert(
      p.active ? 'Deactivate product?' : 'Activate product?',
      p.active ? 'Customers will not see this product' : 'This product will be visible to customers',
      [
        { text: 'Cancel' },
        { text: 'Yes', onPress: () => productApi.toggleActive(p.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Products"
        subtitle={`${products.length} items in catalog`}
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={() => navigation.navigate('AddProduct')} style={styles.addBtn} hitSlop={8}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </Pressable>
        }
      />

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products…"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'low', 'inactive'] as const).map((f) => {
          const active = filter === f;
          const count = f === 'all' ? products.length : f === 'low' ? products.filter(p => p.stock < 30).length : products.filter(p => !p.active).length;
          return (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Inactive'} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.active && { opacity: 0.6 }]}>
            <View style={styles.emoji}>
              <Text style={{ fontSize: 36 }}>{item.image}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cat}>{catName(item.categoryId)} • {item.unit}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.price}>₹{item.price}</Text>
                {item.mrp > item.price && <Text style={styles.mrp}>₹{item.mrp}</Text>}
                <View style={[styles.stockBadge, { backgroundColor: item.stock === 0 ? '#FFE0E0' : item.stock < 30 ? '#FFF4D6' : Colors.primaryLight }]}>
                  <Text style={[styles.stockText, { color: item.stock === 0 ? Colors.error : item.stock < 30 ? '#E6A700' : Colors.primaryDark }]}>
                    Stock: {item.stock}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => navigation.navigate('EditProduct', { productId: item.id })} style={styles.iconBtn} hitSlop={6}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={() => toggleActive(item)} style={styles.iconBtn} hitSlop={6}>
                <Ionicons name={item.active ? 'eye-off' : 'eye'} size={18} color={Colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={styles.iconBtn} hitSlop={6}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="📦"
            title="No products"
            message={search ? 'Try a different search' : 'Add your first product to get started'}
            action={!search ? <Button title="Add Product" onPress={() => navigation.navigate('AddProduct')} /> : undefined}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  toolbar: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.md },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, marginLeft: Spacing.sm },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  chipTextActive: { color: Colors.white },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  emoji: { width: 64, height: 64, borderRadius: Radius.md, backgroundColor: Colors.gray50, alignItems: 'center', justifyContent: 'center' },
  name: { ...Typography.bodyBold, color: Colors.text },
  cat: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, flexWrap: 'wrap', gap: 6 },
  price: { ...Typography.h4, color: Colors.text },
  mrp: { fontSize: 12, color: Colors.textMuted, textDecorationLine: 'line-through' },
  stockBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  stockText: { fontSize: 10, fontWeight: '700' },
  actions: { alignItems: 'center' },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
});
