import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { addressApi, deliveryApi } from '../../db/api';
import { Address, DeliveryArea } from '../../db/types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { realtime, Events } from '../../db/realtime';

export function AddressesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const selectMode: boolean = !!route.params?.selectMode;
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pincodeCheck, setPincodeCheck] = useState<DeliveryArea | null>(null);
  const [checking, setChecking] = useState(false);
  const [form, setForm] = useState({
    label: 'Home', line1: '', line2: '', city: '', state: 'Karnataka', pincode: '',
  });

  const load = useCallback(async () => {
    const list = await addressApi.listForUser(user!.id);
    setAddresses(list);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.ADDRESSES_CHANGED, load);
    return () => u();
  }, [load]);

  const checkPincode = async (pin: string) => {
    if (pin.length !== 6) {
      setPincodeCheck(null);
      return;
    }
    setChecking(true);
    const da = await deliveryApi.checkPincode(pin);
    setPincodeCheck(da);
    setChecking(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ label: 'Home', line1: '', line2: '', city: '', state: 'Karnataka', pincode: '' });
    setPincodeCheck(null);
    setShowForm(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({ label: a.label, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode });
    setShowForm(true);
    checkPincode(a.pincode);
  };

  const save = async () => {
    if (!form.line1.trim() || !form.city.trim() || form.pincode.length !== 6) {
      Alert.alert('Required', 'Please fill all required fields with a valid 6-digit pincode');
      return;
    }
    if (pincodeCheck && !pincodeCheck.active) {
      Alert.alert('Not serviceable', 'Sorry, we do not deliver to this pincode');
      return;
    }
    if (editing) {
      await addressApi.update(editing.id, form);
    } else {
      await addressApi.add(user!.id, { ...form, isDefault: addresses.length === 0 });
    }
    setShowForm(false);
  };

  const remove = (a: Address) => {
    Alert.alert('Delete address', `Remove ${a.label}?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => addressApi.remove(a.id) },
    ]);
  };

  const makeDefault = async (a: Address) => {
    await addressApi.update(a.id, { isDefault: true });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Saved Addresses</Text>
        <Pressable onPress={openAdd} hitSlop={10}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 64, marginBottom: Spacing.md }}>📍</Text>
            <Text style={styles.emptyTitle}>No addresses yet</Text>
            <Text style={styles.emptyText}>Add an address to start receiving deliveries</Text>
            <Button title="Add Address" onPress={openAdd} style={{ marginTop: Spacing.xl }} />
          </View>
        ) : (
          addresses.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.labelTag}>
                  <Ionicons name={a.label === 'Home' ? 'home' : a.label === 'Office' ? 'briefcase' : 'location'} size={14} color={Colors.primary} />
                  <Text style={styles.labelText}>{a.label}</Text>
                  {a.isDefault && <View style={styles.defaultPill}><Text style={styles.defaultText}>Default</Text></View>}
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <Pressable onPress={() => openEdit(a)} hitSlop={8} style={{ marginRight: Spacing.md }}>
                    <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => remove(a)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.addrText}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
              <Text style={styles.addrText}>{a.city}, {a.state} - {a.pincode}</Text>
              <View style={styles.cardActions}>
                {!a.isDefault && (
                  <Pressable onPress={() => makeDefault(a)} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>Make default</Text>
                  </Pressable>
                )}
                {selectMode && (
                  <Pressable
                    onPress={() => navigation.navigate('Checkout', { selectedAddressId: a.id })}
                    style={[styles.smallBtn, { backgroundColor: Colors.primary }]}
                  >
                    <Text style={[styles.smallBtnText, { color: Colors.white }]}>Deliver here</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Address' : 'Add New Address'}>
        <Input label="Label" placeholder="Home, Office..." value={form.label} onChangeText={(t) => setForm({ ...form, label: t })} />
        <Input label="Address Line 1" placeholder="House no, building" value={form.line1} onChangeText={(t) => setForm({ ...form, line1: t })} />
        <Input label="Address Line 2" placeholder="Street, area" value={form.line2} onChangeText={(t) => setForm({ ...form, line2: t })} />
        <Input label="City" placeholder="City" value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} />
        <Input label="State" placeholder="State" value={form.state} onChangeText={(t) => setForm({ ...form, state: t })} />
        <Input
          label="Pincode"
          placeholder="6-digit pincode"
          value={form.pincode}
          onChangeText={(t) => { setForm({ ...form, pincode: t.replace(/[^0-9]/g, '').slice(0, 6) }); checkPincode(t.replace(/[^0-9]/g, '').slice(0, 6)); }}
          keyboardType="number-pad"
          maxLength={6}
        />
        {checking && <ActivityIndicator color={Colors.primary} />}
        {pincodeCheck && (
          <View style={[styles.pincodeInfo, { backgroundColor: pincodeCheck.active ? Colors.primaryLight : '#FFE0E0' }]}>
            <Ionicons name={pincodeCheck.active ? 'checkmark-circle' : 'close-circle'} size={20} color={pincodeCheck.active ? Colors.primary : Colors.error} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={{ fontWeight: '700', color: pincodeCheck.active ? Colors.primaryDark : Colors.error }}>
                {pincodeCheck.active ? '✓ Serviceable' : '✗ Not serviceable'}
              </Text>
              <Text style={{ fontSize: 12, color: pincodeCheck.active ? Colors.primaryDark : Colors.error, marginTop: 2 }}>
                {pincodeCheck.area}, {pincodeCheck.city} • {pincodeCheck.estimatedTime} min delivery
              </Text>
            </View>
          </View>
        )}
        <Button title={editing ? 'Save Changes' : 'Add Address'} onPress={save} fullWidth style={{ marginTop: Spacing.lg }} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white },
  title: { ...Typography.h2, color: Colors.text },
  empty: { alignItems: 'center', paddingVertical: Spacing.huge },
  emptyTitle: { ...Typography.h3, color: Colors.text },
  emptyText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  labelTag: { flexDirection: 'row', alignItems: 'center' },
  labelText: { fontSize: 12, fontWeight: '800', color: Colors.primary, marginLeft: 4, letterSpacing: 0.5 },
  defaultPill: { backgroundColor: Colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill, marginLeft: 6 },
  defaultText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  addrText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  cardActions: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.sm },
  smallBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.gray100 },
  smallBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  pincodeInfo: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.sm },
});
