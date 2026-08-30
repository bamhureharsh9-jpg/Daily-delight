import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { Product } from '../../db/types';
import { ProductImage } from '../common/ProductImage';
import { useCart } from '../../context/CartContext';

interface Props {
  product: Product;
  onPress?: () => void;
  compact?: boolean;
}

export function ProductCard({ product, onPress, compact }: Props) {
  const { isInCart, getQty, add, setQty } = useCart();
  const inCart = isInCart(product.id);
  const qty = getQty(product.id);
  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.imgWrap}>
        <ProductImage emoji={product.image} size={compact ? 80 : 100} />
        {off > 0 && (
          <View style={styles.offBadge}>
            <Text style={styles.offText}>{off}% OFF</Text>
          </View>
        )}
        {product.stock === 0 && (
          <View style={styles.oosBadge}>
            <Text style={styles.oosText}>Out of stock</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          {off > 0 && <Text style={styles.mrp}>₹{product.mrp}</Text>}
        </View>
        {!compact && (
          <View style={styles.actionRow}>
            {inCart ? (
              <View style={styles.qtyControl}>
                <Pressable hitSlop={8} onPress={() => setQty(product.id, qty - 1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={14} color={Colors.primary} />
                </Pressable>
                <Text style={styles.qtyText}>{qty}</Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => setQty(product.id, qty + 1)}
                  style={styles.qtyBtn}
                  disabled={qty >= product.stock}
                >
                  <Ionicons name="add" size={14} color={Colors.primary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => add(product.id)}
                disabled={product.stock === 0}
                style={[styles.addBtn, product.stock === 0 && { opacity: 0.4 }]}
              >
                <Ionicons name="add" size={14} color={Colors.white} />
                <Text style={styles.addBtnText}>ADD</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompact: { width: 150 },
  imgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray50,
  },
  offBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  offText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  oosBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosText: { color: Colors.error, fontWeight: '700', fontSize: 12 },
  body: { padding: Spacing.md },
  name: { ...Typography.bodyBold, color: Colors.text, minHeight: 36 },
  unit: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.sm },
  price: { ...Typography.h4, color: Colors.text },
  mrp: { fontSize: 12, color: Colors.textMuted, marginLeft: 6, textDecorationLine: 'line-through' },
  actionRow: { marginTop: Spacing.md, alignItems: 'flex-end' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  addBtnText: { color: Colors.white, fontSize: 12, fontWeight: '800', marginLeft: 4, letterSpacing: 0.5 },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 2,
  },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyText: { minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: '700', color: Colors.primary },
});
