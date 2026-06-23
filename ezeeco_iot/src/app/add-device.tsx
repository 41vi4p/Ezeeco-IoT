import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Alert, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, X, Search, Check,
  Lightbulb, Fan, Tv, Volume2, Camera, Lock, Plug,
  Thermometer, Smartphone, Laptop, Wifi, Music,
  Flame, Droplets, Sun, Moon, Power, Coffee,
  Snowflake, Mic, Headphones, AlarmClock, Monitor,
  Radio, Cpu, Zap, Bell, Home, AirVent,
  Satellite, Keyboard, Mouse, Shield,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { deviceService, roomService } from '@/services/firestoreService';
import { iotControlService } from '@/services/iotControlService';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

// ── Icon catalogue ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  lightbulb: Lightbulb, fan: Fan, tv: Tv, speaker: Volume2, camera: Camera,
  lock: Lock, plug: Plug, thermometer: Thermometer, smartphone: Smartphone,
  laptop: Laptop, wifi: Wifi, music: Music, flame: Flame, droplets: Droplets,
  sun: Sun, moon: Moon, power: Power, coffee: Coffee, snowflake: Snowflake,
  mic: Mic, headphones: Headphones, alarm: AlarmClock, monitor: Monitor,
  radio: Radio, cpu: Cpu, zap: Zap, bell: Bell, home: Home, airvent: AirVent,
  satellite: Satellite, keyboard: Keyboard, mouse: Mouse, shield: Shield,
};

const ICON_LABELS: Record<string, string> = {
  lightbulb: 'Lightbulb', fan: 'Fan', tv: 'TV', speaker: 'Speaker',
  camera: 'Camera', lock: 'Lock', plug: 'Plug', thermometer: 'Thermostat',
  smartphone: 'Phone', laptop: 'Laptop', wifi: 'Wifi', music: 'Music',
  flame: 'Flame', droplets: 'Water', sun: 'Sun', moon: 'Moon', power: 'Power',
  coffee: 'Coffee', snowflake: 'Cooling', mic: 'Mic', headphones: 'Audio',
  alarm: 'Alarm', monitor: 'Monitor', radio: 'Radio', cpu: 'CPU', zap: 'Energy',
  bell: 'Bell', home: 'Home', airvent: 'AC', satellite: 'Satellite',
  keyboard: 'Keyboard', mouse: 'Mouse', shield: 'Security',
};

const ICON_KEYS = Object.keys(ICON_MAP);

// ── Device type list ──────────────────────────────────────────────────────────

const deviceTypes = [
  { type: 'lightbulb', label: 'Light',     icon: Lightbulb, category: 'lights'        },
  { type: 'fan',       label: 'Fan',        icon: Fan,       category: 'devices'       },
  { type: 'tv',        label: 'TV',         icon: Tv,        category: 'entertainment' },
  { type: 'speaker',   label: 'Speaker',    icon: Volume2,   category: 'entertainment' },
  { type: 'camera',    label: 'Camera',     icon: Camera,    category: 'security'      },
  { type: 'lock',      label: 'Lock',       icon: Lock,      category: 'security'      },
  { type: 'plug',      label: 'Smart Plug', icon: Plug,      category: 'devices'       },
];

const controlTypes = [
  { key: 'toggle',       label: 'Toggle (On/Off)' },
  { key: 'range',        label: 'Range Control'   },
  { key: 'multi-button', label: 'Multi-Button'    },
  { key: 'custom',       label: 'Custom'          },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AddDeviceScreen() {
  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const theme       = useTheme();
  const isDark      = useIsDark();
  const { user }    = useAuth();
  const { rooms, fetchDevices } = useStore();
  const { roomId: paramRoomId } = useLocalSearchParams<{ roomId?: string }>();

  const [name, setName]                       = useState('');
  const [brand, setBrand]                     = useState('');
  const [description, setDescription]         = useState('');
  const [ipAddress, setIpAddress]             = useState('');
  const [controlEndpoint, setControlEndpoint] = useState('');
  const [selectedType, setSelectedType]       = useState(deviceTypes[0]);
  const [selectedIconKey, setSelectedIconKey] = useState(deviceTypes[0].type);
  const [controlType, setControlType]         = useState('toggle');
  const [selectedRoomId, setSelectedRoomId]   = useState(paramRoomId ?? '');
  const [iconPickerOpen, setIconPickerOpen]   = useState(false);
  const [iconSearch, setIconSearch]           = useState('');
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    if (paramRoomId) { setSelectedRoomId(paramRoomId); return; }
    if (rooms.length > 0) setSelectedRoomId(rooms[0].id);
  }, [rooms, paramRoomId]);

  const handleTypeSelect = (dt: typeof deviceTypes[0]) => {
    setSelectedType(dt);
    setSelectedIconKey(dt.type);
  };

  const handleCreate = async () => {
    if (!name.trim() || !selectedRoomId || !user) return;
    setLoading(true);
    try {
      const deviceData = {
        name: name.trim(),
        type: 'custom' as const,
        category: selectedType.category as any,
        brand: brand.trim() || 'Custom',
        icon: selectedIconKey,
        controlType: controlType as any,
        customProperties: {
          ipAddress: ipAddress.trim(),
          description: description.trim(),
          controlEndpoint: controlEndpoint.trim(),
        },
        roomId: selectedRoomId,
        isOnline: false,
        currentValue: 0,
        userId: user.id,
      };
      const deviceId = await deviceService.createDevice(deviceData);
      await iotControlService.initializeDeviceState(deviceId, selectedRoomId, 0);
      await roomService.addDeviceToRoom(selectedRoomId, deviceId);
      await fetchDevices(user.id);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Could not add device');
    } finally {
      setLoading(false);
    }
  };

  const headerGrad: [string, string, string] = isDark
    ? ['#0F0C3D', '#3B1E8B', '#1A0C4E']
    : ['#4F46E5', '#7C3AED', '#6D28D9'];

  const cardBg  = isDark ? '#333333' : '#FFFFFF';
  const inputBg = isDark ? '#444444' : '#F3F4F6';
  const SelectedIconComp = ICON_MAP[selectedIconKey] ?? Lightbulb;

  const filteredIcons = iconSearch
    ? ICON_KEYS.filter(k => ICON_LABELS[k].toLowerCase().includes(iconSearch.toLowerCase()))
    : ICON_KEYS;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Device</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Device Type */}
          <Text style={[styles.label, { color: theme.text }]}>Device Type</Text>
          <View style={styles.typeGrid}>
            {deviceTypes.map(dt => {
              const Icon = dt.icon;
              const isSel = selectedType.type === dt.type;
              return (
                <TouchableOpacity
                  key={dt.type}
                  style={[styles.typeCard, { backgroundColor: cardBg,
                    borderColor: isSel ? theme.primary : theme.cardBorder }]}
                  onPress={() => handleTypeSelect(dt)}
                >
                  <View style={[styles.typeIconWrap,
                    { backgroundColor: isSel ? `${theme.primary}20` : inputBg }]}>
                    <Icon size={22} color={isSel ? theme.primary : theme.textSecondary} />
                  </View>
                  <Text style={[styles.typeLabel, { color: isSel ? theme.primary : theme.text }]}>
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Device Icon */}
          <Text style={[styles.label, { color: theme.text }]}>Device Icon</Text>
          <TouchableOpacity
            style={[styles.iconRow, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}
            onPress={() => { setIconSearch(''); setIconPickerOpen(true); }}
          >
            <View style={[styles.iconPreview, { backgroundColor: `${theme.primary}20` }]}>
              <SelectedIconComp size={26} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.iconRowLabel, { color: theme.text }]}>
                {ICON_LABELS[selectedIconKey] ?? selectedIconKey}
              </Text>
              <Text style={[styles.iconRowSub, { color: theme.textSecondary }]}>Tap to change icon</Text>
            </View>
            <View style={[styles.changeBtn, {
              backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }]}>
              <Text style={[styles.changeBtnText, { color: theme.primary }]}>Change</Text>
            </View>
          </TouchableOpacity>

          {/* Device Name */}
          <Text style={[styles.label, { color: theme.text }]}>
            Device Name <Text style={{ color: theme.danger }}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: theme.text, borderColor: theme.cardBorder }]}
            placeholder={`e.g. Living Room ${selectedType.label}`}
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />

          {/* Brand */}
          <Text style={[styles.label, { color: theme.text }]}>
            Brand <Text style={[styles.optional, { color: theme.textSecondary }]}>(Optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: theme.text, borderColor: theme.cardBorder }]}
            placeholder="e.g. Philips, TP-Link, Custom"
            placeholderTextColor={theme.textSecondary}
            value={brand}
            onChangeText={setBrand}
          />

          {/* Control Type */}
          <Text style={[styles.label, { color: theme.text }]}>Control Type</Text>
          <View style={styles.controlTypeRow}>
            {controlTypes.map(ct => {
              const isSel = controlType === ct.key;
              return (
                <TouchableOpacity
                  key={ct.key}
                  style={[styles.controlChip, {
                    backgroundColor: isSel ? theme.primary : cardBg,
                    borderColor: isSel ? theme.primary : theme.cardBorder,
                  }]}
                  onPress={() => setControlType(ct.key)}
                >
                  <Text style={[styles.controlChipText,
                    { color: isSel ? '#FFFFFF' : theme.textSecondary }]}>
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* IP Address */}
          <Text style={[styles.label, { color: theme.text }]}>
            IP Address <Text style={[styles.optional, { color: theme.textSecondary }]}>(Optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: theme.text, borderColor: theme.cardBorder }]}
            placeholder="e.g. 192.168.1.100"
            placeholderTextColor={theme.textSecondary}
            value={ipAddress}
            onChangeText={setIpAddress}
            autoCapitalize="none"
          />

          {/* Control Endpoint */}
          <Text style={[styles.label, { color: theme.text }]}>
            Control Endpoint <Text style={[styles.optional, { color: theme.textSecondary }]}>(Optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: theme.text, borderColor: theme.cardBorder }]}
            placeholder="e.g. https://api.example.com/control"
            placeholderTextColor={theme.textSecondary}
            value={controlEndpoint}
            onChangeText={setControlEndpoint}
            autoCapitalize="none"
          />

          {/* Description */}
          <Text style={[styles.label, { color: theme.text }]}>
            Description <Text style={[styles.optional, { color: theme.textSecondary }]}>(Optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textarea,
              { backgroundColor: inputBg, color: theme.text, borderColor: theme.cardBorder }]}
            placeholder="Describe your device..."
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Room */}
          <Text style={[styles.label, { color: theme.text }]}>Assign to Room</Text>
          {rooms.length === 0 ? (
            <View style={[styles.noRoomBox, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.noRoomText, { color: theme.textSecondary }]}>
                You need to create a room first
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/add-room')}
                style={[styles.createRoomBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.createRoomBtnText}>Create Room</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {rooms.map(room => (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomChip, {
                    borderColor: selectedRoomId === room.id ? theme.primary : theme.cardBorder,
                    backgroundColor: selectedRoomId === room.id ? `${theme.primary}20` : cardBg,
                  }]}
                  onPress={() => setSelectedRoomId(room.id)}
                >
                  <Text style={[styles.roomChipText,
                    { color: selectedRoomId === room.id ? theme.primary : theme.text }]}>
                    {room.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!name.trim() || !selectedRoomId || loading}
            style={{ borderRadius: 14, overflow: 'hidden', marginTop: 28,
              opacity: (!name.trim() || !selectedRoomId || loading) ? 0.6 : 1 }}
          >
            <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.createBtn}>
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.createBtnText}>Add Device</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Icon Picker Modal ── */}
      <Modal
        visible={iconPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIconPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#2D2D2D' : '#F9FAFB' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Device Icon</Text>
              <TouchableOpacity onPress={() => setIconPickerOpen(false)} style={styles.modalClose}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.iconSearchWrap,
              { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <Search size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.iconSearchInput, { color: theme.text }]}
                placeholder="Search icons..."
                placeholderTextColor={theme.textSecondary}
                value={iconSearch}
                onChangeText={setIconSearch}
              />
            </View>

            <FlatList
              data={filteredIcons}
              numColumns={4}
              keyExtractor={k => k}
              contentContainerStyle={styles.iconGrid}
              renderItem={({ item: key }) => {
                const Ic = ICON_MAP[key];
                const isSel = selectedIconKey === key;
                return (
                  <TouchableOpacity
                    style={[styles.iconCell, {
                      backgroundColor: isSel ? `${theme.primary}20` : (isDark ? '#333333' : '#FFFFFF'),
                      borderColor: isSel ? theme.primary : theme.cardBorder,
                    }]}
                    onPress={() => { setSelectedIconKey(key); setIconPickerOpen(false); }}
                  >
                    {isSel && (
                      <View style={[styles.iconCellCheck, { backgroundColor: theme.primary }]}>
                        <Check size={10} color="#FFFFFF" />
                      </View>
                    )}
                    <Ic size={24} color={isSel ? theme.primary : theme.textSecondary} />
                    <Text
                      style={[styles.iconCellLabel,
                        { color: isSel ? theme.primary : theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {ICON_LABELS[key]}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.noIconsText, { color: theme.textSecondary }]}>No icons found</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:         { flex: 1 },
  header:            { paddingHorizontal: 20, paddingBottom: 20,
                       borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  backBtn:           { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:       { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  content:           { padding: 16, paddingBottom: 100 },
  label:             { fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 18 },
  optional:          { fontSize: 12, fontWeight: '400' },

  typeGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard:          { width: '30%', alignItems: 'center', padding: 12,
                       borderRadius: 14, borderWidth: 2, gap: 8 },
  typeIconWrap:      { width: 44, height: 44, borderRadius: 12,
                       alignItems: 'center', justifyContent: 'center' },
  typeLabel:         { fontSize: 11, fontWeight: '600' },

  iconRow:           { flexDirection: 'row', alignItems: 'center', gap: 14,
                       padding: 14, borderRadius: 14, borderWidth: 1 },
  iconPreview:       { width: 52, height: 52, borderRadius: 14,
                       alignItems: 'center', justifyContent: 'center' },
  iconRowLabel:      { fontSize: 14, fontWeight: '700' },
  iconRowSub:        { fontSize: 12, marginTop: 2 },
  changeBtn:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  changeBtnText:     { fontSize: 13, fontWeight: '600' },

  input:             { borderWidth: 1, borderRadius: 12,
                       paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  textarea:          { height: 90, paddingTop: 12 },

  controlTypeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  controlChip:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  controlChipText:   { fontSize: 12, fontWeight: '600' },

  noRoomBox:         { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center', gap: 12 },
  noRoomText:        { fontSize: 13 },
  createRoomBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  createRoomBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  roomChip:          { paddingHorizontal: 16, paddingVertical: 10,
                       borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  roomChipText:      { fontSize: 13, fontWeight: '600' },

  createBtn:         { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  createBtnText:     { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle:        { fontSize: 16, fontWeight: '700' },
  modalClose:        { padding: 4 },

  iconSearchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16,
                       marginTop: 12, paddingHorizontal: 14, paddingVertical: 10,
                       borderRadius: 12, borderWidth: 1 },
  iconSearchInput:   { flex: 1, fontSize: 14, padding: 0 },

  iconGrid:          { padding: 16, gap: 10 },
  iconCell:          { flex: 1, margin: 4, aspectRatio: 1, alignItems: 'center',
                       justifyContent: 'center', borderRadius: 14, borderWidth: 1.5,
                       padding: 8, gap: 6, position: 'relative' },
  iconCellCheck:     { position: 'absolute', top: 6, right: 6, width: 16, height: 16,
                       borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  iconCellLabel:     { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  noIconsText:       { textAlign: 'center', padding: 32, fontSize: 14 },
});
