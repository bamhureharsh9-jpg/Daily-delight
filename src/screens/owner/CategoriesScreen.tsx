import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { categoryApi } from '../../db/api';
import { Category } from '../../db/types';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { realtime, Events } from '../../db/realtime';

const ICONS = ['🥦', '🍎', '🥛', '🍞', '🍪', '🥤', '🌾', '🌶️', '🧴', '🧹', '🥩', '🍗', '🍫', '☕', '🍵', '💧', '🧀', '🥚', '🍯', '🥜'];

export function CategoriesScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '🥦' });

  const load = useCallback(async () => {
    const c = await categoryApi.listAll();
    setCategories(c);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.CATEGORIES_CHANGED, load);
    return () => u();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', icon: '🥦' });
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, icon: c.icon });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Category name is required');
      return;
    }
    if (editing) {
      await categoryApi.update(editing.id, { name: form.name.trim(), icon: form.icon });
    } else {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), 0);
      await categoryApi.create({ name: form.name.trim(), icon: form.icon, image: form.icon, order: maxOrder + 1, active: true });
    }
    setShowForm(false);
  };

  const toggleActive = (c: Category) => categoryApi.update(c.id, { active: !c.active });
  const remove = (c: Category) => {
    Alert.alert('Delete category', `Delete "${c.name}"?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => categoryApi.remove(c.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Categories"
        subtitle={`${categories.length} categories`}
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={openAdd} style={styles.addBtn} hitSlop={8}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </Pressable>
        }
      />
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.active && { opacity: 0.6 }]}>
            <View style={styles.cardHead}>
              <View style={styles.iconBox}><Text style={{ fontSize: 32 }}>{item.icon}</Text></View>
              <View style={styles.actions}>
                <Pressable onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={6}><Ionicons name="create-outline" size={16} color={Colors.primary} /></Pressable>
                <Pressable onPress={() => toggleActive(item)} style={styles.iconBtn} hitSlop={6}><Ionicons name={item.active ? 'eye-off' : 'eye'} size={16} color={Colors.textSecondary} /></Pressable>
                <Pressable onPress={() => remove(item)} style={styles.iconBtn} hitSlop={6}><Ionicons name="trash-outline" size={16} color={Colors.error} /></Pressable>
              </View>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.order}>Order #{item.order}</Text>
          </View>
        )}
        ListEmptyComponent={<EmptyState emoji="🗂️" title="No categories" />}
      />

      <Modal visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <Input label="Category Name *" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="e.g. Beverages" />
        <Text style={styles.section}>Choose Icon</Text>
        <View style={styles.iconsRow}>
          {ICONS.map((i) => (
            <Pressable key={i} onPress={() => setForm({ ...form, icon: i })} style={[styles.iconItem, form.icon === i && styles.iconItemActive]}>
              <Text style={{ fontSize: 28 }}>{i}</Text>
            </Pressable>
          ))}
        </View>
        <Button title={editing ? 'Save Changes' : 'Add Category'} onPress={save} fullWidth style={{ marginTop: Spacing.lg }} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { width: '48%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  iconBox: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  actions: { alignItems: 'flex-end' },
  iconBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  name: { ...Typography.bodyBold, color: Colors.text, marginTop: Spacing.sm },
  order: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  section: { ...Typography.h4, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.md },
  iconsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  iconItem: { width: '20%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  iconItemActive: { backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary },
});
