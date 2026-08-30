import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productApi, settingsApi, addressApi, deliveryApi, couponApi } from '../../db/api';
import { Product, AppSettings, Address, DeliveryArea } from '../../db/types';
import { ProductImage } from '../../components/common/ProductImage';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { realtime, Events } from '../../db/realtime';

export function CartScreen() {
  const navigation = useNavigation<any>();
  const { items, add, remove, setQty, subtotal, appliedCoupon, discount, applyCoupon, removeCoupon, totalItems } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const [all, s, addrs] = await Promise.all([productApi.list(), settingsApi.get(), addressApi.listForUser(user!.id)]);
    setProducts(all);
    setSettings(s);
    const def = addrs.find((a) => a.isDefault) || addrs[0];
    setDefaultAddress(def || null);
    if (def) {
      const da = await deliveryApi.checkPincode(def.pincode);
      setDeliveryArea(da);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const u1 = realtime.on(Events.PRODUCTS_CHANGED, load);
    const u2 = realtime.on(Events.ADDRESSES_CHANGED, load);
    const u3 = realtime.on(Events.SETTINGS_CHANGED, load);
    return () => { u1(); u2(); u3(); };
  }, [load]);

  const deliveryFee = useMemo(() => {
    if (!settings || !defaultAddress) return 0;
    if (subtotal >= settings.freeDeliveryAbove) return 0;
    return deliveryArea?.deliveryFee ?? settings.baseDeliveryFee;
  }, [settings, defaultAddress, subtotal, deliveryArea]);

  const handlingFee = settings?.handlingFee || 0;
  const total = subtotal + deliveryFee + handlingFee - discount;

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.head}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>My Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          message="Browse our categories and add items to get started"
          action={<Button title="Start Shopping" onPress={() => navigation.navigate('MainTabs')} />}
        />
      </SafeAreaView>
    );
  }

  const onApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await applyCoupon(couponCode.trim());
    setCouponMsg({ type: res.success ? 'ok' : 'err', text: res.message });
    if (res.success) setCouponCode('');
  };

  const handleCheckout = () => {
    if (!defaultAddress) {
      Alert.alert('Add address', 'Please add a delivery address to continue');
      navigation.navigate('Addresses');
      return;
    }
    if (!deliveryArea || !deliveryArea.active) {
      Alert.alert('Not serviceable', 'Sorry, we do not deliver to this pincode yet');
      return;
    }
    if (subtotal < (settings?.minOrderValue || 0)) {
      Alert.alert('Min order', `Minimum order value is ₹${settings?.minOrderValue}`);
      return;
    }
    navigation.navigate('Checkout', {
      deliveryFee, handlingFee, discount, total, appliedCoupon,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>My Cart ({totalItems})</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
        {/* Address block */}
        <Pressable style={styles.block} onPress={() => navigation.navigate('Addresses')}>
          <View style={styles.iconBox}>
            <Ionicons name="location" size={20} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockTitle}>Delivering to {defaultAddress?.label || '—'}</Text>
            <Text style={styles.blockSub} numberOfLines={1}>
              {defaultAddress ? `${defaultAddress.line1}, ${defaultAddress.pincode}` : 'Add an address to continue'}
            </Text>
            {deliveryArea && !deliveryArea.active && (
              <Text style={styles.warnText}>⚠️ Not serviceable at the moment</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Items in your cart</Text>
          </View>
          {items.map((it) => {
            const p = products.find((x) => x.id === it.productId);
            if (!p) return null;
            return (
              <View key={it.productId} style={styles.item}>
                <ProductImage emoji={p.image} size={64} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.itemUnit}>{p.unit}</Text>
                  <View style={styles.itemBottom}>
                    <Text style={styles.itemPrice}>₹{p.price * it.quantity}</Text>
                    <View style={styles.qtyCtrl}>
                      <Pressable onPress={() => setQty(it.productId, it.quantity - 1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={14} color={Colors.primary} />
                      </Pressable>
                      <Text style={styles.qtyVal}>{it.quantity}</Text>
                      <Pressable
                        onPress={() => setQty(it.productId, it.quantity + 1)}
                        style={styles.qtyBtn}
                        disabled={it.quantity >= p.stock}
                      >
                        <Ionicons name="add" size={14} color={Colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          {appliedCoupon ? (
            <View style={styles.couponApplied}>
              <View>
                <Text style={styles.couponCode}>✓ {appliedCoupon.code}</Text>
                <Text style={styles.couponDesc}>You saved ₹{discount}</Text>
              </View>
              <Pressable onPress={removeCoupon} hitSlop={10}>
                <Text style={styles.removeCoupon}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.couponInput}>
              <TextInput
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Enter coupon code"
                placeholderTextColor={Colors.textMuted}
                style={styles.couponField}
                autoCapitalize="characters"
              />
              <Pressable onPress={onApplyCoupon} style={styles.couponApply}>
                <Text style={styles.couponApplyText}>Apply</Text>
              </Pressable>
            </View>
          )}
          {couponMsg && (
            <Text style={[styles.couponMsg, couponMsg.type === 'err' && { color: Colors.error }]}>
              {couponMsg.text}
            </Text>
          )}
        </View>

        {/* Bill details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && { color: Colors.success }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling Fee</Text>
            <Text style={styles.billValue}>₹{handlingFee}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon Discount</Text>
              <Text style={[styles.billValue, { color: Colors.success }]}>-₹{discount}</Text>
            </View>
          )}
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomTotal}>₹{total}</Text>
          <Text style={styles.bottomSub}>Total • {totalItems} items</Text>
        </View>
        <Button title="Proceed to Checkout" onPress={handleCheckout} size="lg" icon="arrow-forward" iconPosition="right" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  title: { ...Typography.h2, color: Colors.text },
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  blockTitle: { ...Typography.bodyBold, color: Colors.text },
  blockSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  warnText: { fontSize: 11, color: Colors.error, marginTop: 4, fontWeight: '600' },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  item: { flexDirection: 'row', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemName: { ...Typography.bodyBold, color: Colors.text },
  itemUnit: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  itemPrice: { ...Typography.h4, color: Colors.text },
  qtyCtrl: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: 2 },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { minWidth: 26, textAlign: 'center', fontSize: 13, fontWeight: '700', color: Colors.primary },
  couponInput: { flexDirection: 'row', alignItems: 'center' },
  couponField: { flex: 1, backgroundColor: Colors.gray100, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.md, fontSize: 14, color: Colors.text, marginRight: Spacing.sm },
  couponApply: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.md },
  couponApplyText: { color: Colors.white, fontWeight: '800' },
  couponApplied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  couponCode: { color: Colors.primaryDark, fontWeight: '800' },
  couponDesc: { color: Colors.primaryDark, fontSize: 12, marginTop: 2 },
  removeCoupon: { color: Colors.error, fontWeight: '700' },
  couponMsg: { color: Colors.success, fontSize: 12, marginTop: Spacing.sm, fontWeight: '600' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { color: Colors.textSecondary, fontSize: 13 },
  billValue: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  billTotal: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.md },
  totalLabel: { ...Typography.h4, color: Colors.text },
  totalValue: { ...Typography.h2, color: Colors.text },
  bottomBar: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomTotal: { ...Typography.h2, color: Colors.text },
  bottomSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
