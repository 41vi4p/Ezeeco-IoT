import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

const iconOptions = ['tv', 'sun', 'book', 'utensils', 'moon', 'music', 'film', 'lightbulb'];
const colorPairs: [string, string][] = [
  ['#7C3AED', '#4F46E5'],
  ['#F59E0B', '#F97316'],
  ['#3B82F6', '#06B6D4'],
  ['#EF4444', '#EC4899'],
  ['#6366F1', '#7C3AED'],
  ['#EC4899', '#8B5CF6'],
  ['#14B8A6', '#10B981'],
];

export default function CreateSceneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('lightbulb');
  const [selectedColors, setSelectedColors] = useState<[string, string]>(['#7C3AED', '#4F46E5']);
  const [deviceInput, setDeviceInput] = useState('');
  const [devices, setDevices] = useState<string[]>([]);

  const addDevice = () => {
    if (deviceInput.trim() && !devices.includes(deviceInput.trim())) {
      setDevices(prev => [...prev, deviceInput.trim()]);
      setDeviceInput('');
    }
  };

  const handleCreate = () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a scene name'); return; }
    Alert.alert('Scene Created', `"${name}" scene has been created (local only — Firestore persistence coming soon)`);
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  };

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Create Scene</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <LinearGradient colors={selectedColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
          <Text style={styles.previewName}>{name || 'Scene Name'}</Text>
          <Text style={styles.previewDesc}>{description || 'Scene description'}</Text>
        </LinearGradient>

        {/* Name */}
        <Text style={[styles.label, { color: theme.text }]}>Scene Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#333333' : '#FFFFFF', color: theme.text, borderColor: theme.cardBorder }]}
          placeholder="e.g. Movie Night"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
        />

        {/* Description */}
        <Text style={[styles.label, { color: theme.text }]}>Description</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#333333' : '#FFFFFF', color: theme.text, borderColor: theme.cardBorder }]}
          placeholder="What does this scene do?"
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
        />

        {/* Color */}
        <Text style={[styles.label, { color: theme.text }]}>Color Theme</Text>
        <View style={styles.colorGrid}>
          {colorPairs.map(pair => (
            <TouchableOpacity
              key={pair[0]}
              style={[styles.colorDot, selectedColors[0] === pair[0] && styles.colorDotSelected]}
              onPress={() => setSelectedColors(pair)}
            >
              <LinearGradient colors={pair} style={styles.colorDotGrad} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Devices */}
        <Text style={[styles.label, { color: theme.text }]}>Devices</Text>
        <View style={styles.deviceInputRow}>
          <TextInput
            style={[styles.deviceInput, { backgroundColor: isDark ? '#333333' : '#FFFFFF', color: theme.text, borderColor: theme.cardBorder }]}
            placeholder="Add a device..."
            placeholderTextColor={theme.textSecondary}
            value={deviceInput}
            onChangeText={setDeviceInput}
            onSubmitEditing={addDevice}
            returnKeyType="done"
          />
          <TouchableOpacity style={[styles.addDeviceBtn, { backgroundColor: theme.primary }]} onPress={addDevice}>
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.deviceTags}>
          {devices.map(device => (
            <View key={device} style={[styles.deviceTag, { backgroundColor: isDark ? '#444444' : '#EEF2FF' }]}>
              <Text style={[styles.deviceTagText, { color: theme.primary }]}>{device}</Text>
              <TouchableOpacity onPress={() => setDevices(prev => prev.filter(d => d !== device))}>
                <X size={14} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Create */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!name.trim()}
          style={{ borderRadius: 14, overflow: 'hidden', marginTop: 16, opacity: !name.trim() ? 0.6 : 1 }}
        >
          <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtn}>
            <Text style={styles.createBtnText}>Create Scene</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 100 },
  preview: { borderRadius: 20, padding: 24, marginBottom: 20, minHeight: 100, justifyContent: 'flex-end' },
  previewName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  previewDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  colorDot: { width: 40, height: 40, borderRadius: 20, padding: 2, borderWidth: 2, borderColor: 'transparent' },
  colorDotSelected: { borderColor: '#6366F1' },
  colorDotGrad: { flex: 1, borderRadius: 16 },
  deviceInputRow: { flexDirection: 'row', gap: 8 },
  deviceInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  addDeviceBtn: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deviceTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  deviceTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  deviceTagText: { fontSize: 13, fontWeight: '500' },
  createBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
