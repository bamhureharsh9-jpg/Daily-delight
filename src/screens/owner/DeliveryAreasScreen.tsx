import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { deliveryApi } from '../../db/api';
import { DeliveryArea } from '../../db/types';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { realtime, Events } from '../../db/realtime';

export function DeliveryAreasScreen() {
  const navigation = useNavigation<any>();
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [editing, setEditing] = useState<DeliveryArea | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pincode: '', area: '', city: '', deliveryRadius: '5', estimatedTime: '15', deliveryFee: '25', freeAbove: '199' });

  const load = useCallback(async () => {
    const a = await deliveryApi.list();
    setAreas(a);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.DELIVERY_AREAS_CHANGED, load);
    return () => u();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ pincode: '', area: '', city: 'Bengaluru', deliveryRadius: '5', estimatedTime: '15', deliveryFee: '25', freeAbove: '199' });
    setShowForm(true);
  };

  const openEdit = (a: DeliveryArea) => {
    setEditing(a);
    setForm({
      pincode: a.pincode,
      area: a.area,
      city: a.city,
      deliveryRadius: String(a.deliveryRadius),
      estimatedTime: String(a.estimatedTime),
      deliveryFee: String(a.deliveryFee),
      freeAbove: a.freeAbove ? String(a.freeAbove) : '',
    });
    setShowForm(true);
  };

  const save = async () => {
    if (form.pincode.length !== 6 || !form.area.trim() || !form.city.trim()) {
      Alert.alert('Required', 'Pincode must be 6 digits and all fields required');
      return;
    }
    const data: Omit<DeliveryArea, 'id'> = {
      pincode: form.pincode,
      area: form.area,
      city: form.city,
      deliveryRadius: parseFloat(form.deliveryRadius) || 5,
      estimatedTime: parseInt(form.estimatedTime, 10) || 15,
      deliveryFee: parseFloat(form.deliveryFee) || 25,
      freeAbove: form.freeAbove ? parseFloat(form.freeAbove) : undefined,
      active: true,
    };
    if (editing) {
      await deliveryApi.update(editing.id, data);
    } else {
      await deliveryApi.create(data);
    }
    setShowForm(false);
  };

  const toggleActive = (a: DeliveryArea) => {
    deliveryApi.update(a.id, { active: !a.active });
  };

  const remove = (a: DeliveryArea) => {
    Alert.alert('Delete area', `Remove ${a.pincode}?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deliveryApi.remove(a.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Delivery Areas"
        subtitle={`${areas.filter(a => a.active).length} serviceable of ${areas.length}`}
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={openAdd} style={styles.addBtn} hitSlop={8}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </Pressable>
        }
      />

      <View style={styles.notice}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.noticeText}>
          Areas marked inactive will not accept orders. Customers outside serviceable areas will see a "not deliverable" message.
        </Text>
      </View>

      <FlatList
        data={areas}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.active && { opacity: 0.6 }]}>
            <View style={styles.cardLeft}>
              <View style={[styles.pincodeBox, !item.active && { backgroundColor: Colors.gray100 }]}>
                <Text style={styles.pincodeLabel}>PIN</Text>
                <Text style={styles.pincode}>{item.pincode}</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.area}>{item.area}</Text>
              <Text style={styles.city}>{item.city}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="speedometer-outline" size={11} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{item.deliveryRadius} km</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{item.estimatedTime} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={11} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>₹{item.deliveryFee}</Text>
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={6}>
                <Ionicons name="create-outline" size={16} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={() => toggleActive(item)} style={styles.iconBtn} hitSlop={6}>
                <Ionicons name={item.active ? 'pause' : 'play'} size={16} color={item.active ? Colors.warning : Colors.success} />
              </Pressable>
              <Pressable onPress={() => remove(item)} style={styles.iconBtn} hitSlop={6}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState emoji="📍" title="No delivery areas" message="Add serviceable pincodes to start accepting orders" />}
      />

      <Modal visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Area' : 'Add Delivery Area'}>
        <Input label="Pincode *" value={form.pincode} onChangeText={(t) => setForm({ ...form, pincode: t.replace(/[^0-9]/g, '').slice(0, 6) })} placeholder="6-digit pincode" keyboardType="number-pad" maxLength={6} />
        <Input label="Area / Locality *" value={form.area} onChangeText={(t) => setForm({ ...form, area: t })} placeholder="e.g. MG Road" />
        <Input label="City *" value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} placeholder="City" />
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Input label="Radius (km)" value={form.deliveryRadius} onChangeText={(t) => setForm({ ...form, deliveryRadius: t })} keyboardType="decimal-pad" />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Input label="ETA (min)" value={form.estimatedTime} onChangeText={(t) => setForm({ ...form, estimatedTime: t })} keyboardType="number-pad" />
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Input label="Delivery Fee (₹)" value={form.deliveryFee} onChangeText={(t) => setForm({ ...form, deliveryFee: t })} keyboardType="decimal-pad" />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Input label="Free Above (₹)" value={form.freeAbove} onChangeText={(t) => setForm({ ...form, freeAbove: t })} keyboardType="decimal-pad" />
          </View>
        </View>
        <Button title={editing ? 'Save Changes' : 'Add Area'} onPress={save} fullWidth style={{ marginTop: Spacing.lg }} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', backgroundColor: '#E3F2FD', margin: Spacing.lg, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 12, color: Colors.info, marginLeft: Spacing.sm, lineHeight: 18 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardLeft: { alignItems: 'center' },
  pincodeBox: { width: 64, paddingVertical: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.md, alignItems: 'center' },
  pincodeLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  pincode: { color: Colors.white, fontSize: 14, fontWeight: '800', marginTop: 2 },
  area: { ...Typography.bodyBold, color: Colors.text },
  city: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', marginTop: Spacing.sm, flexWrap: 'wrap', gap: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  metaText: { fontSize: 10, color: Colors.textSecondary, marginLeft: 3, fontWeight: '600' },
  actions: { alignItems: 'center' },
  iconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
});
