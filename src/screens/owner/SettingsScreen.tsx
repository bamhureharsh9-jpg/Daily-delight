import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { settingsApi } from '../../db/api';
import { AppSettings } from '../../db/types';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { resetDB } from '../../db/database';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [form, setForm] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const s = await settingsApi.get();
    setSettings(s);
    setForm(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    await settingsApi.update(form);
    setSaving(false);
    Alert.alert('Saved', 'Settings updated successfully');
  };

  if (!form) {
    return <SafeAreaView style={styles.safe}><Header title="Settings" onBack={() => navigation.goBack()} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Settings" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Information</Text>
            <Input label="Store Name" value={form.storeName} onChangeText={(t) => setForm({ ...form, storeName: t })} />
            <Input label="Store Phone" value={form.storePhone} onChangeText={(t) => setForm({ ...form, storePhone: t })} keyboardType="phone-pad" />
            <Input label="Store Email" value={form.storeEmail} onChangeText={(t) => setForm({ ...form, storeEmail: t })} keyboardType="email-address" />
            <Input label="Store Address" value={form.storeAddress} onChangeText={(t) => setForm({ ...form, storeAddress: t })} multiline />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Configuration</Text>
            <Input label="Base Delivery Fee (₹)" value={String(form.baseDeliveryFee)} onChangeText={(t) => setForm({ ...form, baseDeliveryFee: parseFloat(t) || 0 })} keyboardType="decimal-pad" />
            <Input label="Free Delivery Above (₹)" value={String(form.freeDeliveryAbove)} onChangeText={(t) => setForm({ ...form, freeDeliveryAbove: parseFloat(t) || 0 })} keyboardType="decimal-pad" />
            <Input label="Handling Fee (₹)" value={String(form.handlingFee)} onChangeText={(t) => setForm({ ...form, handlingFee: parseFloat(t) || 0 })} keyboardType="decimal-pad" />
            <Input label="Default Delivery Radius (km)" value={String(form.deliveryRadiusKm)} onChangeText={(t) => setForm({ ...form, deliveryRadiusKm: parseFloat(t) || 0 })} keyboardType="decimal-pad" />
            <Input label="Minimum Order Value (₹)" value={String(form.minOrderValue)} onChangeText={(t) => setForm({ ...form, minOrderValue: parseFloat(t) || 0 })} keyboardType="decimal-pad" />
            <Input label="GST (%)" value={String(form.gstPercent)} onChangeText={(t) => setForm({ ...form, gstPercent: parseFloat(t) || 0 })} keyboardType="decimal-pad" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <ToggleRow label="Cash on Delivery (COD)" value={form.codEnabled} onChange={(v) => setForm({ ...form, codEnabled: v })} />
            <ToggleRow label="UPI (GPay, PhonePe)" value={form.upiEnabled} onChange={(v) => setForm({ ...form, upiEnabled: v })} />
            <ToggleRow label="Credit/Debit Cards" value={form.cardEnabled} onChange={(v) => setForm({ ...form, cardEnabled: v })} />
            <ToggleRow label="Wallet" value={form.walletEnabled} onChange={(v) => setForm({ ...form, walletEnabled: v })} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <ToggleRow label="Push Notifications" value={form.notificationsEnabled} onChange={(v) => setForm({ ...form, notificationsEnabled: v })} />
          </View>

          <Button title="Save Settings" onPress={save} loading={saving} size="lg" fullWidth />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <Pressable style={styles.dangerRow} onPress={() => {
              Alert.alert('Reset demo data', 'This will clear all data and reload seed data. Useful for demos.', [
                { text: 'Cancel' },
                { text: 'Reset', style: 'destructive', onPress: async () => { await resetDB(); Alert.alert('Done', 'Please sign in again'); logout(); } },
              ]);
            }}>
              <Ionicons name="refresh" size={20} color={Colors.error} />
              <Text style={[styles.dangerText, { color: Colors.error }]}>Reset demo data</Text>
            </Pressable>
            <Pressable style={styles.dangerRow} onPress={() => {
              Alert.alert('Sign out', 'Are you sure?', [
                { text: 'Cancel' },
                { text: 'Sign out', style: 'destructive', onPress: logout },
              ]);
            }}>
              <Ionicons name="log-out" size={20} color={Colors.error} />
              <Text style={[styles.dangerText, { color: Colors.error }]}>Sign out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.gray300, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  section: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  toggleLabel: { ...Typography.body, color: Colors.text, flex: 1 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, backgroundColor: '#FFEBEE', marginTop: Spacing.sm },
  dangerText: { ...Typography.bodyBold, marginLeft: Spacing.sm },
});
