import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../../theme';
import { productApi, categoryApi } from '../../db/api';
import { Product, Category } from '../../db/types';
import { ProductCard } from '../../components/customer/ProductCard';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';

export function CategoryScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const categoryId: string = route.params?.categoryId;
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async () => {
    const [cats, prods] = await Promise.all([categoryApi.list(), productApi.list({ categoryId, activeOnly: true })]);
    setCategory(cats.find((c) => c.id === categoryId) || null);
    setProducts(prods);
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={category?.name || 'Category'} onBack={() => navigation.goBack()} />
      {products.length === 0 ? (
        <EmptyState emoji={category?.icon} title="No products in this category" message="Check back soon!" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: Spacing.lg }}
          contentContainerStyle={{ paddingVertical: Spacing.lg, paddingBottom: 100 }}
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
});
