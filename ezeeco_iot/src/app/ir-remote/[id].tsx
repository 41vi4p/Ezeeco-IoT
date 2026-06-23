import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, Plus, Trash2, Edit3, Radio, Send, Zap,
  Wifi, ChevronUp, ChevronDown, Check,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { irService, IrRemote, IrButton } from '@/services/irService';

const generateId = () => Math.random().toString(36).slice(2, 10);

type LearnState = 'idle' | 'waiting' | 'success' | 'timeout';

export default function IrRemoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();

  const [remote, setRemote] = useState<IrRemote | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [learnState, setLearnState] = useState<LearnState>('idle');
  const [learningButtonId, setLearningButtonId] = useState<string | null>(null);
  const [learnCountdown, setLearnCountdown] = useState(0);

  const [buttonModalOpen, setButtonModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<IrButton | null>(null);
  const [buttonName, setButtonName] = useState('');

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const headerGrad: [string, string, string] = isDark
    ? ['#1A0A3D', '#3B1E8B', '#1E1B4B']
    : ['#7C3AED', '#4F46E5', '#6D28D9'];

  // Load remote
  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const all = await irService.getRemotes(user.id);
        const found = all.find(r => r.id === id) ?? null;
        setRemote(found);
      } catch { setRemote(null); }
      finally { setLoading(false); }
    };
    load();
  }, [user, id]);

  // Listen for IR learn results
  useEffect(() => {
    if (!user) return;
    unsubRef.current = irService.listenResult(user.id, result => {
      if (!result || learnState !== 'waiting') return;
      if (result.buttonId === learningButtonId) {
        clearTimer();
        if (result.action === 'learned') {
          setLearnState('success');
          setRemote(prev => {
            if (!prev) return prev;
            const buttons = prev.buttons.map(b =>
              b.id === learningButtonId
                ? { ...b, irCode: result.irCode, protocol: result.protocol, bits: result.bits }
                : b,
            );
            irService.updateRemote(prev.id, { buttons });
            return { ...prev, buttons };
          });
          irService.clearResult(user.id);
          setTimeout(() => setLearnState('idle'), 2500);
        } else {
          setLearnState('timeout');
          irService.clearResult(user.id);
          setTimeout(() => setLearnState('idle'), 2500);
        }
      }
    });
    return () => { unsubRef.current?.(); };
  }, [user, learnState, learningButtonId]);

  const clearTimer = () => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setLearnCountdown(0);
    setLearningButtonId(null);
  };

  const persistButtons = async (buttons: IrButton[]) => {
    if (!remote) return;
    try {
      await irService.updateRemote(remote.id, { buttons });
      setRemote(prev => prev ? { ...prev, buttons } : prev);
    } catch { Alert.alert('Error', 'Could not save changes'); }
  };

  const handleLearn = async (btn: IrButton) => {
    if (!user || !remote) return;
    setLearnState('waiting');
    setLearningButtonId(btn.id);
    setLearnCountdown(10);
    await irService.sendCommand(user.id, { action: 'learn', buttonId: btn.id, remoteId: remote.id });
    countdownRef.current = setInterval(() => {
      setLearnCountdown(prev => {
        if (prev <= 1) {
          clearTimer();
          setLearnState('timeout');
          irService.sendCommand(user!.id, { action: 'idle' });
          setTimeout(() => setLearnState('idle'), 2500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSend = async (btn: IrButton) => {
    if (!user) return;
    if (!btn.irCode) {
      Alert.alert('No IR code', 'Learn a code for this button first (tap Edit → Learn).');
      return;
    }
    await irService.sendCommand(user.id, {
      action: 'send',
      irCode: btn.irCode,
      protocol: btn.protocol,
      bits: btn.bits,
      buttonId: btn.id,
      remoteId: remote?.id,
    });
  };

  const handleSaveButton = async () => {
    if (!buttonName.trim() || !remote) return;
    let updated: IrButton[];
    if (editingButton) {
      updated = remote.buttons.map(b =>
        b.id === editingButton.id ? { ...b, name: buttonName.trim() } : b,
      );
    } else {
      updated = [
        ...remote.buttons,
        { id: generateId(), name: buttonName.trim(), irCode: '', protocol: '', bits: 32, order: remote.buttons.length },
      ];
    }
    setButtonModalOpen(false);
    await persistButtons(updated);
  };

  const handleDeleteButton = (btnId: string) => {
    if (!remote) return;
    const updated = remote.buttons
      .filter(b => b.id !== btnId)
      .map((b, i) => ({ ...b, order: i }));
    persistButtons(updated);
  };

  const handleMove = (btnId: string, dir: 'up' | 'down') => {
    if (!remote) return;
    const arr = [...remote.buttons].sort((a, b) => a.order - b.order);
    const i = arr.findIndex(b => b.id === btnId);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    persistButtons(arr.map((b, k) => ({ ...b, order: k })));
  };

  const handleDeleteRemote = () => {
    if (!remote) return;
    Alert.alert('Delete Remote', `Delete "${remote.name}" and all its buttons?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await irService.deleteRemote(remote.id);
          router.back();
        },
      },
    ]);
  };

  const sortedButtons = remote ? [...remote.buttons].sort((a, b) => a.order - b.order) : [];

  const learnColor = learnState === 'success' ? '#10B981' : learnState === 'timeout' ? '#EF4444' : '#F59E0B';
  const learnText = learnState === 'success'
    ? '✓ Code captured successfully!'
    : learnState === 'timeout'
    ? '✗ No signal received'
    : `Point remote at ESP8266 receiver… ${learnCountdown}s`;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.center}><ActivityIndicator size="large" color="#7C3AED" /></View>
      </View>
    );
  }

  if (!remote) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ChevronLeft size={24} color="#FFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Remote not found</Text>
        </LinearGradient>
        <View style={styles.center}>
          <Text style={[{ color: theme.textSecondary, fontSize: 14 }]}>This remote no longer exists.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={headerGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerIcon}>{remote.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{remote.name}</Text>
            <Text style={styles.headerSub}>{sortedButtons.length} button{sortedButtons.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, editMode && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
            onPress={() => setEditMode(!editMode)}
          >
            {editMode ? <Check size={18} color="#FFFFFF" /> : <Edit3 size={18} color="#FFFFFF" />}
          </TouchableOpacity>
          {editMode && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.25)' }]} onPress={handleDeleteRemote}>
              <Trash2 size={18} color="#FCA5A5" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Learn banner */}
      {learnState !== 'idle' && (
        <View style={[styles.learnBanner, { backgroundColor: learnColor }]}>
          {learnState === 'waiting' && <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />}
          <Text style={styles.learnText}>{learnText}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* ESP status pill */}
        {!editMode && (
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: isDark ? '#1E2A1E' : '#F0FDF4', borderColor: '#22C55E30' }]}>
              <Wifi size={12} color="#22C55E" />
              <Text style={[styles.statusText, { color: '#22C55E' }]}>ESP8266 paired</Text>
            </View>
          </View>
        )}

        {/* Edit toolbar */}
        {editMode && (
          <TouchableOpacity
            style={[styles.addButtonRow, { borderColor: '#7C3AED', backgroundColor: isDark ? '#2A2020' : '#FAF5FF' }]}
            onPress={() => { setEditingButton(null); setButtonName(''); setButtonModalOpen(true); }}
          >
            <Plus size={18} color="#7C3AED" />
            <Text style={[styles.addButtonText, { color: '#7C3AED' }]}>Add New Button</Text>
          </TouchableOpacity>
        )}

        {/* Empty state */}
        {sortedButtons.length === 0 && (
          <View style={styles.emptyButtons}>
            <Zap size={36} color={theme.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No buttons yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Tap Edit → Add New Button to get started.
            </Text>
          </View>
        )}

        {/* Buttons */}
        {editMode ? (
          // Edit mode: list view
          <View style={styles.editList}>
            {sortedButtons.map((btn, idx) => (
              <View
                key={btn.id}
                style={[styles.editRow, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF', borderColor: theme.cardBorder }]}
              >
                <View style={styles.editMoveCol}>
                  <TouchableOpacity onPress={() => handleMove(btn.id, 'up')} disabled={idx === 0} style={{ opacity: idx === 0 ? 0.25 : 1 }}>
                    <ChevronUp size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleMove(btn.id, 'down')} disabled={idx === sortedButtons.length - 1} style={{ opacity: idx === sortedButtons.length - 1 ? 0.25 : 1 }}>
                    <ChevronDown size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editBtnName, { color: theme.text }]}>{btn.name}</Text>
                  <Text style={[styles.editBtnCode, { color: btn.irCode ? '#10B981' : '#F59E0B' }]}>
                    {btn.irCode ? `${btn.protocol} · 0x${btn.irCode.toUpperCase()}` : 'No code — tap Learn'}
                  </Text>
                </View>
                <View style={styles.editRowActions}>
                  <TouchableOpacity
                    style={[styles.editActionChip, { backgroundColor: learningButtonId === btn.id ? '#F59E0B30' : '#F59E0B20' }]}
                    onPress={() => handleLearn(btn)}
                    disabled={learnState === 'waiting'}
                  >
                    {learningButtonId === btn.id && learnState === 'waiting'
                      ? <ActivityIndicator size="small" color="#F59E0B" />
                      : <Radio size={13} color="#F59E0B" />}
                    <Text style={[styles.editActionLabel, { color: '#F59E0B' }]}>Learn</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editActionChip, { backgroundColor: '#7C3AED20' }]}
                    onPress={() => { setEditingButton(btn); setButtonName(btn.name); setButtonModalOpen(true); }}
                  >
                    <Edit3 size={13} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editActionChip, { backgroundColor: '#EF444420' }]}
                    onPress={() => handleDeleteButton(btn.id)}
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          // Send mode: button grid
          <View style={styles.btnGrid}>
            {sortedButtons.map(btn => (
              <TouchableOpacity
                key={btn.id}
                style={[
                  styles.irBtn,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                    borderColor: btn.irCode ? '#7C3AED50' : (isDark ? '#3A3A3A' : '#E5E7EB'),
                  },
                ]}
                onPress={() => handleSend(btn)}
                activeOpacity={0.7}
              >
                <Send size={14} color={btn.irCode ? '#7C3AED' : theme.textSecondary} style={{ marginBottom: 5 }} />
                <Text style={[styles.irBtnLabel, { color: btn.irCode ? theme.text : theme.textSecondary }]} numberOfLines={2}>
                  {btn.name}
                </Text>
                {!btn.irCode && <View style={styles.uncodedDot} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!editMode && sortedButtons.length > 0 && (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Tap a button to send · Yellow dot = no code yet · Use Edit to learn
          </Text>
        )}
      </ScrollView>

      {/* Add / Rename Button Modal */}
      <Modal visible={buttonModalOpen} transparent animationType="slide" onRequestClose={() => setButtonModalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setButtonModalOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: isDark ? '#222' : '#FFFFFF' }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#444' : '#D1D5DB' }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {editingButton ? 'Rename Button' : 'New Button'}
            </Text>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Label</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: isDark ? '#333' : '#F9FAFB',
                borderColor: theme.cardBorder,
                color: theme.text,
              }]}
              placeholder="e.g. Power, Vol+, Mute, Cool 18°"
              placeholderTextColor={theme.textSecondary}
              value={buttonName}
              onChangeText={setButtonName}
              autoFocus
            />
            <TouchableOpacity
              style={{ opacity: buttonName.trim() ? 1 : 0.4, borderRadius: 14, overflow: 'hidden' }}
              onPress={handleSaveButton}
              disabled={!buttonName.trim()}
            >
              <LinearGradient
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.saveBtnGrad}
              >
                <Text style={styles.saveBtnText}>{editingButton ? 'Rename' : 'Add Button'}</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 22 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },

  learnBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  learnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  body: { padding: 16, paddingBottom: 120 },

  statusRow: { alignItems: 'center', marginBottom: 16 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '600' },

  addButtonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, marginBottom: 16 },
  addButtonText: { fontSize: 14, fontWeight: '700' },

  emptyButtons: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  editList: { gap: 10 },
  editRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  editMoveCol: { gap: 2, alignItems: 'center' },
  editBtnName: { fontSize: 14, fontWeight: '700' },
  editBtnCode: { fontSize: 10, marginTop: 3, fontFamily: 'monospace' },
  editRowActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  editActionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  editActionLabel: { fontSize: 11, fontWeight: '600' },

  btnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  irBtn: { width: '30%', aspectRatio: 1, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', padding: 8, position: 'relative' },
  irBtnLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  uncodedDot: { position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },

  hint: { fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 17 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 20 },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
