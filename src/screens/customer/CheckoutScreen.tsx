import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { addressApi, settingsApi, orderApi, deliveryApi, couponApi } from '../../db/api';
import { Address, AppSettings, PaymentMethod, Order } from '../../db/types';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { realtime, Events } from '../../db/realtime';

export function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { items, products, subtotal, appliedCoupon, clear, discount } = useCart();
  const { deliveryFee, handlingFee, total } = route.params || { deliveryFee: 0, handlingFee: 0, total: 0 };
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<Address | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('upi');
  const [placing, setPlacing] = useState(false);
  const [deliveryEta, setDeliveryEta] = useState(15);

  const load = useCallback(async () => {
    const [addrs, s] = await Promise.all([addressApi.listForUser(user!.id), settingsApi.get()]);
    setAddresses(addrs);
    setSelected(addrs.find((a) => a.isDefault) || addrs[0] || null);
    setSettings(s);
    if (selected) {
      const da = await deliveryApi.checkPincode(selected.pincode);
      if (da) setDeliveryEta(da.estimatedTime);
    }
  }, [user, selected]);

  useEffect(() => { load(); }, [load]);

  const onPlaceOrder = async () => {
    if (!selected) {
      Alert.alert('Address required', 'Please select a delivery address');
      return;
    }
    setPlacing(true);
    try {
      // simulate payment gateway delay
      await new Promise((r) => setTimeout(r, 1200));
      const orderItems = items.map((i) => {
        const p = products.find((x) => x.id === i.productId)!;
        return {
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: i.quantity,
          unit: p.unit,
          image: p.image,
        };
      });
      const order = await orderApi.place({
        userId: user!.id,
        customerName: user!.name,
        customerPhone: user!.phone,
        items: orderItems,
        subtotal,
        deliveryFee,
        handlingFee,
        discount,
        couponCode: appliedCoupon?.code,
        total,
        address: selected,
        paymentMethod: payment,
        estimatedTime: `${deliveryEta} mins`,
      });
      if (appliedCoupon) {
        await couponApi.incrementUsage(appliedCoupon.id);
      }
      await clear();
      navigation.replace('OrderTracking', { orderId: order.id });
    } catch (e: any) {
      Alert.alert('Order failed', e.message);
    } finally {
      setPlacing(false);
    }
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: any; desc: string }[] = [
    { id: 'upi', label: 'UPI', icon: 'flash', desc: 'GPay, PhonePe, Paytm' },
    { id: 'card', label: 'Credit/Debit Card', icon: 'card', desc: 'Visa, Mastercard, RuPay' },
    { id: 'wallet', label: 'Wallet', icon: 'wallet', desc: 'Daily Delight Wallet' },
    { id: 'cod', label: 'Cash on Delivery', icon: 'cash', desc: 'Pay when you receive' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 200 }}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Pressable onPress={() => navigation.navigate('Addresses', { selectMode: true })}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>
          {selected ? (
            <View style={styles.addrBox}>
              <View style={styles.addrLabel}>
                <Ionicons name="home" size={14} color={Colors.primary} />
                <Text style={styles.addrLabelText}>{selected.label}</Text>
              </View>
              <Text style={styles.addrText}>{selected.line1}{selected.line2 ? `, ${selected.line2}` : ''}</Text>
              <Text style={styles.addrText}>{selected.city}, {selected.state} - {selected.pincode}</Text>
            </View>
          ) : (
            <Pressable style={styles.addAddr} onPress={() => navigation.navigate('Addresses', { selectMode: true })}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addAddrText}>Add a delivery address</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery in {deliveryEta} minutes</Text>
          <View style={styles.etaRow}>
            <View style={styles.etaStep}><View style={[styles.etaDot, { backgroundColor: Colors.success }]} /><Text style={styles.etaText}>Confirmed</Text></View>
            <View style={styles.etaLine} />
            <View style={styles.etaStep}><View style={[styles.etaDot, { backgroundColor: Colors.gray300 }]} /><Text style={styles.etaText}>Packed</Text></View>
            <View style={styles.etaLine} />
            <View style={styles.etaStep}><View style={[styles.etaDot, { backgroundColor: Colors.gray300 }]} /><Text style={styles.etaText}>Delivered</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          {paymentMethods.map((m) => {
            const enabled =
              (m.id === 'upi' && settings?.upiEnabled) ||
              (m.id === 'card' && settings?.cardEnabled) ||
              (m.id === 'wallet' && settings?.walletEnabled) ||
              (m.id === 'cod' && settings?.codEnabled);
            if (!enabled) return null;
            const isSelected = payment === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setPayment(m.id)}
                style={[styles.payRow, isSelected && styles.payRowActive]}
              >
                <View style={[styles.payIcon, isSelected && { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name={m.icon} size={22} color={isSelected ? Colors.primary : Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payLabel}>{m.label}</Text>
                  <Text style={styles.payDesc}>{m.desc}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Details ({items.length} items)</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
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
              <Text style={styles.billLabel}>Coupon Discount {appliedCoupon && `(${appliedCoupon.code})`}</Text>
              <Text style={[styles.billValue, { color: Colors.success }]}>-₹{discount}</Text>
            </View>
          )}
          <View style={styles.billTotal}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomTotal}>₹{total}</Text>
          <Text style={styles.bottomSub}>
            {payment === 'cod' ? 'Cash on Delivery' : payment.toUpperCase()} • {items.length} items
          </Text>
        </View>
        <Button
          title={placing ? 'Placing Order…' : 'Place Order'}
          onPress={onPlaceOrder}
          loading={placing}
          size="lg"
          icon="checkmark-circle"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white },
  title: { ...Typography.h2, color: Colors.text },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  changeLink: { color: Colors.primary, fontWeight: '700' },
  addrBox: { backgroundColor: Colors.gray50, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  addrLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  addrLabelText: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginLeft: 4 },
  addrText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  addAddr: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: Radius.md, justifyContent: 'center' },
  addAddrText: { color: Colors.primary, fontWeight: '700', marginLeft: 6 },
  etaRow: { flexDirection: 'row', alignItems: 'center' },
  etaStep: { alignItems: 'center' },
  etaDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  etaText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  etaLine: { flex: 1, height: 2, backgroundColor: Colors.gray200, marginHorizontal: 4, marginBottom: 16 },
  payRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, marginBottom: Spacing.sm },
  payRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  payIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  payLabel: { ...Typography.bodyBold, color: Colors.text },
  payDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { color: Colors.textSecondary, fontSize: 13 },
  billValue: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  billTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.md, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { ...Typography.h4, color: Colors.text },
  totalValue: { ...Typography.h2, color: Colors.text },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  bottomTotal: { ...Typography.h2, color: Colors.text },
  bottomSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
