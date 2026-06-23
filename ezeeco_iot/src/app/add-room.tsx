import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Home } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { roomService } from '@/services/firestoreService';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

const roomTypes = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Garage', 'Garden', 'Other'];
const roomIcons = ['🏠', '🛏️', '🍳', '🚿', '💼', '🚗', '🌿', '📦'];

export default function AddRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();
  const { rooms, setRooms, fetchRooms } = useStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏠');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const room = await roomService.createRoom({
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        userId: user.id,
        deviceIds: [],
        members: [{ id: user.id, name: user.name || 'Owner', email: user.email || '', role: 'owner', joinedAt: new Date() as any }],
      });
      await fetchRooms(user.id);
      router.replace(`/room/${room.id}`);
    } catch { Alert.alert('Error', 'Could not create room'); }
    finally { setLoading(false); }
  };

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/rooms')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Create Room</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon Select */}
        <Text style={[styles.label, { color: theme.text }]}>Choose an Icon</Text>
        <View style={styles.iconGrid}>
          {roomIcons.map(icon => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconBtn, { borderColor: selectedIcon === icon ? theme.primary : theme.cardBorder, backgroundColor: selectedIcon === icon ? (isDark ? '#444444' : '#EEF2FF') : 'transparent' }]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Room Name */}
        <Text style={[styles.label, { color: theme.text }]}>Room Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#333333' : '#FFFFFF', color: theme.text, borderColor: theme.cardBorder }]}
          placeholder="e.g. Living Room"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
        />

        {/* Quick Select */}
        <Text style={[styles.label, { color: theme.text }]}>Quick Select</Text>
        <View style={styles.typeGrid}>
          {roomTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, { borderColor: name === type ? theme.primary : theme.cardBorder, backgroundColor: name === type ? (isDark ? '#444444' : '#EEF2FF') : (isDark ? '#333333' : '#FFFFFF') }]}
              onPress={() => setName(type)}
            >
              <Text style={[styles.typeBtnText, { color: name === type ? theme.primary : theme.text }]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={[styles.label, { color: theme.text }]}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#333333' : '#FFFFFF', color: theme.text, borderColor: theme.cardBorder }]}
          placeholder="Add a description for this room..."
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Create Button */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!name.trim() || loading}
          style={{ opacity: !name.trim() || loading ? 0.6 : 1, borderRadius: 14, overflow: 'hidden', marginTop: 8 }}
        >
          <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtn}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.createBtnText}>Create Room</Text>}
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
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 16 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  iconBtn: { width: 52, height: 52, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  textArea: { minHeight: 80, paddingTop: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  typeBtnText: { fontSize: 13, fontWeight: '500' },
  createBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
