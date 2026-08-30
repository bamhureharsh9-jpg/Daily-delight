import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { productApi } from '../../db/api';
import { Product } from '../../db/types';
import { ProductImage } from '../../components/common/ProductImage';
import { Button } from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import { EmptyState } from '../../components/common/EmptyState';

export function ProductDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const productId: string = route.params?.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { isInCart, getQty, add, setQty } = useCart();

  const load = useCallback(async () => {
    const p = await productApi.getById(productId);
    setProduct(p);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 20, color: Colors.textSecondary }}>{loading ? 'Loading…' : 'Product not found'}</Text>
      </SafeAreaView>
    );
  }

  const inCart = isInCart(product.id);
  const qty = getQty(product.id);
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.topBtn} hitSlop={10}>
          <Ionicons name="heart-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.hero}>
          <ProductImage emoji={product.image} size={220} bg={Colors.primaryLight} />
          {off > 0 && (
            <View style={styles.bigOff}>
              <Text style={styles.bigOffText}>{off}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.headRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.unit}>{product.unit}</Text>
            </View>
            {product.stock > 0 ? (
              <View style={styles.stockBadge}>
                <View style={styles.dot} />
                <Text style={styles.stockText}>In stock</Text>
              </View>
            ) : (
              <View style={[styles.stockBadge, { backgroundColor: '#FFE0E0' }]}>
                <Text style={[styles.stockText, { color: Colors.error }]}>Out of stock</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            {off > 0 && <Text style={styles.mrp}>MRP ₹{product.mrp}</Text>}
            {off > 0 && <View style={styles.offPill}><Text style={styles.offPillText}>Save ₹{product.mrp - product.price}</Text></View>}
          </View>

          {product.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {product.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.desc}>{product.description}</Text>

          <View style={styles.divider} />

          <View style={styles.assuranceRow}>
            <View style={styles.assuranceItem}>
              <Ionicons name="leaf" size={22} color={Colors.primary} />
              <Text style={styles.assuranceText}>100% Fresh</Text>
            </View>
            <View style={styles.assuranceItem}>
              <Ionicons name="time" size={22} color={Colors.primary} />
              <Text style={styles.assuranceText}>10 min delivery</Text>
            </View>
            <View style={styles.assuranceItem}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
              <Text style={styles.assuranceText}>Quality assured</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {inCart ? (
          <View style={styles.qtyBig}>
            <Pressable onPress={() => setQty(product.id, qty - 1)} style={styles.qtyBigBtn}>
              <Ionicons name="remove" size={20} color={Colors.primary} />
            </Pressable>
            <Text style={styles.qtyBigText}>{qty}</Text>
            <Pressable
              onPress={() => setQty(product.id, qty + 1)}
              style={styles.qtyBigBtn}
              disabled={qty >= product.stock}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </Pressable>
          </View>
        ) : (
          <Button
            title={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
            onPress={() => {
              if (product.stock === 0) return;
              add(product.id);
            }}
            size="lg"
            fullWidth
            icon="cart"
            disabled={product.stock === 0}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  topBar: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, alignItems: 'center' },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', paddingVertical: Spacing.huge, backgroundColor: Colors.gray50, position: 'relative' },
  bigOff: { position: 'absolute', top: Spacing.lg, left: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  bigOffText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  body: { padding: Spacing.xl },
  headRow: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { ...Typography.h1, color: Colors.text },
  unit: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginRight: 6 },
  stockText: { color: Colors.primaryDark, fontSize: 11, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg },
  price: { ...Typography.h1, color: Colors.text },
  mrp: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'line-through', marginLeft: Spacing.md },
  offPill: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm, marginLeft: Spacing.md },
  offPillText: { color: Colors.primaryDark, fontSize: 11, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md },
  tag: { backgroundColor: Colors.gray100, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill, marginRight: 6, marginBottom: 6 },
  tagText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  desc: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  assuranceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  assuranceItem: { alignItems: 'center', flex: 1 },
  assuranceText: { fontSize: 11, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  qtyBig: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: 8 },
  qtyBigBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  qtyBigText: { fontSize: 18, fontWeight: '800', color: Colors.primaryDark, marginHorizontal: Spacing.xl },
});
