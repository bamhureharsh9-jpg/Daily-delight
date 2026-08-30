import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { couponApi } from '../../db/api';
import { Coupon, CouponType } from '../../db/types';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export function AddEditCouponScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const couponId: string | undefined = route.params?.couponId;
  const isEdit = !!couponId;

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CouponType>('flat');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('100');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [validTill, setValidTill] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (couponId) {
        const all = await couponApi.list();
        const c = all.find((x) => x.id === couponId);
        if (c) {
          setCode(c.code);
          setDescription(c.description);
          setType(c.type);
          setValue(String(c.value));
          setMinOrder(String(c.minOrder));
          setMaxDiscount(c.maxDiscount ? String(c.maxDiscount) : '');
          setUsageLimit(c.usageLimit ? String(c.usageLimit) : '');
          setValidTill(c.validTill.split('T')[0]);
          setActive(c.active);
        }
      } else {
        // default valid till: 90 days from now
        const d = new Date();
        d.setDate(d.getDate() + 90);
        setValidTill(d.toISOString().split('T')[0]);
      }
    })();
  }, [couponId]);

  const save = async () => {
    if (!code.trim() || !description.trim() || !value || !minOrder || !validTill) {
      Alert.alert('Required', 'Please fill all required fields');
      return;
    }
    const v = parseFloat(value);
    const m = parseFloat(minOrder);
    if (isNaN(v) || isNaN(m) || v <= 0) {
      Alert.alert('Invalid', 'Value and minimum order must be valid numbers');
      return;
    }
    setSaving(true);
    try {
      const data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'> = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        type,
        value: v,
        minOrder: m,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        active,
        validFrom: new Date().toISOString().split('T')[0],
        validTill: new Date(validTill).toISOString(),
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
      };
      if (isEdit) {
        await couponApi.update(couponId!, data);
      } else {
        // check for duplicate code
        const existing = await couponApi.getByCode(data.code);
        if (existing) {
          Alert.alert('Duplicate', 'A coupon with this code already exists');
          setSaving(false);
          return;
        }
        await couponApi.create(data);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={isEdit ? 'Edit Coupon' : 'Create Coupon'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <View style={styles.preview}>
            <View style={styles.previewLeft}>
              <Text style={styles.previewValue}>{type === 'flat' ? `₹${value || '0'}` : `${value || '0'}%`}</Text>
              <Text style={styles.previewOff}>OFF</Text>
            </View>
            <View style={styles.previewRight}>
              <Text style={styles.previewDesc} numberOfLines={2}>{description || 'Your coupon description'}</Text>
              <View style={styles.previewCodeBox}><Text style={styles.previewCode}>{code.toUpperCase() || 'CODE'}</Text></View>
            </View>
          </View>

          <Input label="Coupon Code *" value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="e.g. SAVE20" autoCapitalize="characters" />
          <Input label="Description *" value={description} onChangeText={setDescription} placeholder="What does this offer?" multiline />

          <Text style={styles.section}>Discount Type *</Text>
          <View style={styles.typeRow}>
            {(['flat', 'percent'] as CouponType[]).map((t) => {
              const a = type === t;
              return (
                <Pressable key={t} onPress={() => setType(t)} style={[styles.typeBtn, a && styles.typeBtnActive]}>
                  <Ionicons name={t === 'flat' ? 'cash' : 'percent'} size={20} color={a ? Colors.white : Colors.text} />
                  <Text style={[styles.typeText, a && { color: Colors.white }]}>{t === 'flat' ? 'Flat ₹' : 'Percent %'}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input label={type === 'flat' ? 'Discount (₹) *' : 'Discount (%) *'} value={value} onChangeText={setValue} placeholder="0" keyboardType="decimal-pad" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Input label="Min Order (₹) *" value={minOrder} onChangeText={setMinOrder} placeholder="100" keyboardType="decimal-pad" />
            </View>
          </View>

          {type === 'percent' && (
            <Input label="Max Discount Cap (₹)" value={maxDiscount} onChangeText={setMaxDiscount} placeholder="Optional" keyboardType="decimal-pad" />
          )}

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input label="Usage Limit" value={usageLimit} onChangeText={setUsageLimit} placeholder="Unlimited" keyboardType="number-pad" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Input label="Valid Till *" value={validTill} onChangeText={setValidTill} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          <Pressable onPress={() => setActive((a) => !a)} style={styles.toggleRow}>
            <View style={[styles.checkbox, active && styles.checkboxActive]}>
              {active && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.toggleTitle}>Active</Text>
              <Text style={styles.toggleSub}>Customers can use this coupon</Text>
            </View>
          </Pressable>

          <Button title={isEdit ? 'Save Changes' : 'Create Coupon'} onPress={save} loading={saving} size="lg" fullWidth style={{ marginTop: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  preview: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.xl },
  previewLeft: { width: 100, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg },
  previewValue: { color: Colors.white, fontSize: 24, fontWeight: '800' },
  previewOff: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 1 },
  previewRight: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  previewDesc: { color: Colors.white, fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm },
  previewCodeBox: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.sm, alignSelf: 'flex-start', borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.white },
  previewCode: { color: Colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  section: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.md },
  typeRow: { flexDirection: 'row', marginBottom: Spacing.lg },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.md, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, marginRight: Spacing.sm },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText: { fontSize: 13, fontWeight: '700', color: Colors.text, marginLeft: 6 },
  row2: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleTitle: { ...Typography.bodyBold, color: Colors.text },
  toggleSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
