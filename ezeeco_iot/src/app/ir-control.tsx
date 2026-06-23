import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Modal, Pressable, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Radio, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { irService, IrRemote } from '@/services/irService';
import { useFocusEffect } from 'expo-router';

const REMOTE_ICONS = ['📺', '❄️', '🔌', '💡', '🎵', '📻', '🎮', '🌀', '🔊', '📷'];

const CARD_GRADIENTS: [string, string][] = [
  ['#7C3AED', '#4F46E5'],
  ['#0EA5E9', '#0284C7'],
  ['#10B981', '#059669'],
  ['#F59E0B', '#D97706'],
  ['#EF4444', '#DC2626'],
  ['#EC4899', '#DB2777'],
  ['#8B5CF6', '#7C3AED'],
  ['#14B8A6', '#0D9488'],
  ['#F97316', '#EA580C'],
  ['#6366F1', '#4338CA'],
];

function cardGradient(idx: number): [string, string] {
  return CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
}

export default function IrControlScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();

  const [remotes, setRemotes] = useState<IrRemote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📺');
  const [saving, setSaving] = useState(false);

  const headerGrad: [string, string, string] = isDark
    ? ['#1A0A3D', '#3B1E8B', '#1E1B4B']
    : ['#7C3AED', '#4F46E5', '#6D28D9'];

  const loadRemotes = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const data = await irService.getRemotes(user.id);
      data.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
      setRemotes(data);
    } catch { setRemotes([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { loadRemotes(); }, [loadRemotes]);

  useFocusEffect(useCallback(() => { loadRemotes(true); }, [loadRemotes]));

  const handleCreateRemote = async () => {
    if (!newName.trim() || !user) return;
    setSaving(true);
    try {
      const id = await irService.createRemote(user.id, newName.trim(), newIcon);
      setCreateOpen(false);
      setNewName('');
      setNewIcon('📺');
      await loadRemotes(true);
      router.push(`/ir-remote/${id}`);
    } catch {
      // silently fail — user can tap the card once list reloads
    } finally { setSaving(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={headerGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>IR Remote Control</Text>
            <Text style={styles.headerSub}>ESP8266 · D5 blast · D6 recv</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCreateOpen(true)}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : remotes.length === 0 ? (
        <View style={styles.center}>
          <Radio size={56} color={theme.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No remotes yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Tap + to add your first IR remote
          </Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setCreateOpen(true)}>
            <LinearGradient
              colors={['#7C3AED', '#4F46E5']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.createBtnGrad}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createBtnText}>Create Remote</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadRemotes(true); }}
              tintColor="#7C3AED"
            />
          }
        >
          <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>
            {remotes.length} remote{remotes.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.cardGrid}>
            {remotes.map((remote, idx) => {
              const [c1, c2] = cardGradient(idx);
              const btnCount = remote.buttons?.length ?? 0;
              const coded = remote.buttons?.filter(b => !!b.irCode).length ?? 0;
              return (
                <TouchableOpacity
                  key={remote.id}
                  style={styles.cardWrap}
                  onPress={() => router.push(`/ir-remote/${remote.id}`)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[c1, c2]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.card}
                  >
                    <Text style={styles.cardIcon}>{remote.icon}</Text>
                    <Text style={styles.cardName} numberOfLines={2}>{remote.name}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardCount}>
                        {btnCount === 0
                          ? 'No buttons'
                          : `${coded}/${btnCount} coded`}
                      </Text>
                      <ChevronRight size={14} color="rgba(255,255,255,0.7)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}

            {/* Add new remote card */}
            <TouchableOpacity
              style={styles.cardWrap}
              onPress={() => setCreateOpen(true)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.card,
                styles.addCard,
                { borderColor: isDark ? '#444' : '#D1D5DB', backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB' },
              ]}>
                <View style={[styles.addIcon, { backgroundColor: isDark ? '#3A3A3A' : '#F3F4F6' }]}>
                  <Plus size={24} color="#7C3AED" />
                </View>
                <Text style={[styles.addLabel, { color: theme.textSecondary }]}>New Remote</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Create Remote Modal */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCreateOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: isDark ? '#222' : '#FFFFFF' }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#444' : '#D1D5DB' }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>New Remote</Text>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: isDark ? '#333' : '#F9FAFB',
                borderColor: theme.cardBorder,
                color: theme.text,
              }]}
              placeholder="e.g. Living Room TV"
              placeholderTextColor={theme.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
              {REMOTE_ICONS.map(ic => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconOpt,
                    newIcon === ic && { backgroundColor: '#7C3AED30', borderColor: '#7C3AED' },
                  ]}
                  onPress={() => setNewIcon(ic)}
                >
                  <Text style={styles.iconOptText}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={{ opacity: newName.trim() ? 1 : 0.4, borderRadius: 14, overflow: 'hidden' }}
              onPress={handleCreateRemote}
              disabled={!newName.trim() || saving}
            >
              <LinearGradient
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.saveBtnGrad}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.saveBtnText}>Create Remote</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19, color: '#888' },
  createBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  createBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 13 },
  createBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  grid: { padding: 16, paddingBottom: 120 },
  gridLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWrap: { width: '47%' },
  card: { borderRadius: 20, padding: 18, minHeight: 150, justifyContent: 'space-between' },
  cardIcon: { fontSize: 40, marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', lineHeight: 20, flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  cardCount: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  addCard: { borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  addLabel: { fontSize: 13, fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 20 },
  iconRow: { marginBottom: 20 },
  iconOpt: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5, borderColor: 'transparent' },
  iconOptText: { fontSize: 22 },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
