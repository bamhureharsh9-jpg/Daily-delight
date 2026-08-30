import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { productApi, categoryApi } from '../../db/api';
import { Product, Category } from '../../db/types';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

const EMOJIS = ['🥦', '🍎', '🍅', '🥛', '🍞', '🥚', '🍚', '🍪', '🥤', '🧴', '🧼', '🌶️', '🥕', '🥔', '🧅', '🥬', '🍌', '🍊', '🥭', '🍇', '🥩', '🍗', '🧀', '🧈', '🍫', '☕', '🍵', '💧', '🧂', '🌾', '🛢️', '🍬', '🍯', '🥜', '🌽', '🍆', '🥒', '🌽', '🥦', '🍄'];

export function AddEditProductScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const productId: string | undefined = route.params?.productId;
  const isEdit = !!productId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState('1 kg');
  const [stock, setStock] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState('🥦');
  const [featured, setFeatured] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const cats = await categoryApi.listAll();
      setCategories(cats.filter((c) => c.active));
      if (productId) {
        const p = await productApi.getById(productId);
        if (p) {
          setName(p.name);
          setDescription(p.description);
          setPrice(String(p.price));
          setMrp(String(p.mrp));
          setUnit(p.unit);
          setStock(String(p.stock));
          setCategoryId(p.categoryId);
          setImage(p.image);
          setFeatured(p.featured);
        }
      } else if (cats.length) {
        setCategoryId(cats[0].id);
      }
    })();
  }, [productId]);

  const save = async () => {
    if (!name.trim() || !price || !mrp || !unit.trim() || !categoryId) {
      Alert.alert('Required', 'Please fill all required fields');
      return;
    }
    const pNum = parseFloat(price);
    const mNum = parseFloat(mrp);
    const sNum = parseInt(stock, 10);
    if (isNaN(pNum) || isNaN(mNum) || isNaN(sNum)) {
      Alert.alert('Invalid', 'Price, MRP and stock must be valid numbers');
      return;
    }
    if (pNum > mNum) {
      Alert.alert('Invalid', 'Selling price cannot be greater than MRP');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        price: pNum,
        mrp: mNum,
        unit: unit.trim(),
        stock: sNum,
        categoryId,
        image,
        active: true,
        featured,
        tags: [],
      };
      if (isEdit) {
        await productApi.update(productId!, data);
      } else {
        await productApi.create(data);
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
      <Header title={isEdit ? 'Edit Product' : 'Add Product'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Image</Text>
          <Pressable style={styles.imagePicker} onPress={() => setShowEmojiPicker(true)}>
            <Text style={{ fontSize: 60 }}>{image}</Text>
            <View style={styles.changeBadge}>
              <Ionicons name="camera" size={14} color={Colors.white} />
              <Text style={styles.changeText}>Change</Text>
            </View>
          </Pressable>

          <Input label="Product Name *" value={name} onChangeText={setName} placeholder="e.g. Fresh Tomato" />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="Short product description" multiline numberOfLines={3} />

          <Text style={styles.section}>Category *</Text>
          <View style={styles.catGrid}>
            {categories.map((c) => {
              const active = categoryId === c.id;
              return (
                <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.catItem, active && styles.catItemActive]}>
                  <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                  <Text style={[styles.catLabel, active && { color: Colors.primaryDark, fontWeight: '700' }]} numberOfLines={1}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input label="Selling Price (₹) *" value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Input label="MRP (₹) *" value={mrp} onChangeText={setMrp} placeholder="0" keyboardType="decimal-pad" />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input label="Unit *" value={unit} onChangeText={setUnit} placeholder="e.g. 1 kg, 500 ml" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Input label="Stock *" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
            </View>
          </View>

          <Pressable onPress={() => setFeatured((f) => !f)} style={styles.toggleRow}>
            <View style={[styles.checkbox, featured && styles.checkboxActive]}>
              {featured && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.toggleTitle}>Mark as Featured</Text>
              <Text style={styles.toggleSub}>Show on the home screen for customers</Text>
            </View>
          </Pressable>

          <Button title={isEdit ? 'Save Changes' : 'Add Product'} onPress={save} loading={saving} size="lg" fullWidth style={{ marginTop: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} title="Pick an icon">
        <View style={styles.emojiGrid}>
          {EMOJIS.map((e, i) => (
            <Pressable key={i} onPress={() => { setImage(e); setShowEmojiPicker(false); }} style={[styles.emojiItem, image === e && styles.emojiItemActive]}>
              <Text style={{ fontSize: 32 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  section: { ...Typography.h4, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.md },
  imagePicker: { height: 130, backgroundColor: Colors.white, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', position: 'relative', marginBottom: Spacing.lg },
  changeBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.pill },
  changeText: { color: Colors.white, fontSize: 11, fontWeight: '700', marginLeft: 4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  catItem: { width: '23%', alignItems: 'center', padding: Spacing.sm, backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  catItemActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  catLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  row2: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleTitle: { ...Typography.bodyBold, color: Colors.text },
  toggleSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: Spacing.md },
  emojiItem: { width: '20%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  emojiItemActive: { backgroundColor: Colors.primaryLight },
});
