import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { bannerApi } from '../../db/api';
import { Banner } from '../../db/types';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { realtime, Events } from '../../db/realtime';

const COLORS = ['#0C831F', '#FF6B35', '#9C27B0', '#2196F3', '#E53935', '#FF9500'];
const EMOJIS = ['🥦', '🍎', '🥛', '🍞', '🚚', '🏷️', '🎉', '⭐', '🛒', '💰', '🎁', '✨'];

export function BannersScreen() {
  const navigation = useNavigation<any>();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', image: '🎉', color: COLORS[0], order: '1' });

  const load = useCallback(async () => {
    const b = await bannerApi.listAll();
    setBanners(b);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = realtime.on(Events.BANNERS_CHANGED, load);
    return () => u();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', image: '🎉', color: COLORS[0], order: String(banners.length + 1) });
    setShowForm(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle, image: b.image, color: b.color, order: String(b.order) });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.subtitle.trim()) {
      Alert.alert('Required', 'Title and subtitle are required');
      return;
    }
    const data: Omit<Banner, 'id'> = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      image: form.image,
      color: form.color,
      order: parseInt(form.order, 10) || 1,
      active: true,
    };
    if (editing) {
      await bannerApi.update(editing.id, data);
    } else {
      await bannerApi.create(data);
    }
    setShowForm(false);
  };

  const toggleActive = (b: Banner) => bannerApi.update(b.id, { active: !b.active });
  const remove = (b: Banner) => {
    Alert.alert('Delete banner', `Delete "${b.title}"?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => bannerApi.remove(b.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Banners & Promos"
        subtitle="Customer app home screen"
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={openAdd} style={styles.addBtn} hitSlop={8}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </Pressable>
        }
      />
      <FlatList
        data={banners}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.active && { opacity: 0.6 }]}>
            <View style={[styles.preview, { backgroundColor: item.color }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle}>{item.title}</Text>
                <Text style={styles.previewSub}>{item.subtitle}</Text>
              </View>
              <Text style={{ fontSize: 50 }}>{item.image}</Text>
            </View>
            <View style={styles.cardActions}>
              <Text style={styles.orderText}>Order: #{item.order}</Text>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={6}><Ionicons name="create-outline" size={16} color={Colors.primary} /></Pressable>
              <Pressable onPress={() => toggleActive(item)} style={styles.iconBtn} hitSlop={6}><Ionicons name={item.active ? 'eye-off' : 'eye'} size={16} color={Colors.textSecondary} /></Pressable>
              <Pressable onPress={() => remove(item)} style={styles.iconBtn} hitSlop={6}><Ionicons name="trash-outline" size={16} color={Colors.error} /></Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState emoji="🎨" title="No banners" message="Add banners to showcase offers on the home screen" action={<Button title="Add Banner" onPress={openAdd} />} />}
      />

      <Modal visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Banner' : 'New Banner'}>
        <View style={[styles.livePreview, { backgroundColor: form.color }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle}>{form.title || 'Your title here'}</Text>
            <Text style={styles.previewSub}>{form.subtitle || 'Your subtitle here'}</Text>
          </View>
          <Text style={{ fontSize: 50 }}>{form.image}</Text>
        </View>
        <Input label="Title *" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} placeholder="Catchy headline" />
        <Input label="Subtitle *" value={form.subtitle} onChangeText={(t) => setForm({ ...form, subtitle: t })} placeholder="Supporting text" />
        <Text style={styles.section}>Icon</Text>
        <View style={styles.iconsRow}>
          {EMOJIS.map((e) => (
            <Pressable key={e} onPress={() => setForm({ ...form, image: e })} style={[styles.iconItem, form.image === e && styles.iconItemActive]}>
              <Text style={{ fontSize: 28 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>Color</Text>
        <View style={styles.colorsRow}>
          {COLORS.map((c) => (
            <Pressable key={c} onPress={() => setForm({ ...form, color: c })} style={[styles.colorItem, { backgroundColor: c }, form.color === c && styles.colorItemActive]} />
          ))}
        </View>
        <Input label="Display Order" value={form.order} onChangeText={(t) => setForm({ ...form, order: t.replace(/[^0-9]/g, '') })} placeholder="1" keyboardType="number-pad" />
        <Button title={editing ? 'Save' : 'Create Banner'} onPress={save} fullWidth style={{ marginTop: Spacing.lg }} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, marginBottom: Spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  preview: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, height: 130 },
  previewTitle: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  previewSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.white },
  orderText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  livePreview: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, height: 120, borderRadius: Radius.lg, marginBottom: Spacing.lg },
  section: { ...Typography.h4, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.md },
  iconsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md },
  iconItem: { width: '20%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  iconItemActive: { backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary },
  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md },
  colorItem: { width: 44, height: 44, borderRadius: 22, margin: 4 },
  colorItemActive: { borderWidth: 3, borderColor: Colors.text },
});
