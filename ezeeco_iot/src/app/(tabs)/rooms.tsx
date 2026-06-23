import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal, Pressable } from 'react-native';
import { useResponsive } from '@/hooks/use-responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, KeyRound, Home } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { roomService, Room } from '@/services/firestoreService';
import { validateJoinCode, sanitizeInput, checkRateLimit } from '@/utils/validation';
import RoomCard from '@/components/RoomCard';

export default function RoomsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();
  const { rooms, setRooms, fetchRooms, fetchDevices } = useStore();
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Room[]>([]);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user) fetchRooms(user.id);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchRooms(user.id);
    }, [user])
  );

  useEffect(() => {
    if (!search.trim()) setFiltered(rooms);
    else {
      const q = search.toLowerCase();
      setFiltered(rooms.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)));
    }
  }, [search, rooms]);

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || !user) return;
    const v = validateJoinCode(joinCode);
    if (!v.isValid) { Alert.alert('Invalid code', v.error); return; }
    if (!checkRateLimit(`join_${user.id}`, 5, 300000)) { Alert.alert('Too many attempts'); return; }
    setJoining(true);
    try {
      const result = await roomService.joinRoomByCode(sanitizeInput(joinCode), user.id, user.name || 'User', user.email || '');
      if (result) {
        await fetchRooms(user.id);
        await fetchDevices(user.id);
        setJoinOpen(false); setJoinCode('');
        const room = 'alreadyMember' in result ? result.room : result;
        Alert.alert('Success', `You joined "${room.name}"`);
        router.push(`/room/${room.id}`);
      } else Alert.alert('Invalid code', 'The room join code is invalid or expired');
    } catch { Alert.alert('Error', 'Failed to join room'); }
    finally { setJoining(false); }
  };

  const headerGrad: [string, string, string] = isDark ? ['#0F0C3D', '#3B1E8B', '#1A0C4E'] : ['#4F46E5', '#7C3AED', '#6D28D9'];
  const { hPad, contentW, isTablet } = useResponsive();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: hPad }]}>
        <View style={{ maxWidth: contentW, alignSelf: 'center', width: '100%' }}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>All Rooms</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setJoinOpen(true)}>
              <KeyRound size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/add-room')}>
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rooms..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        </View>{/* end contentCap */}
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]} showsVerticalScrollIndicator={false}>

        {filtered.length === 0 && search.trim() ? (
          <View style={styles.empty}>
            <Home size={48} color={theme.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No rooms found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Try a different search term</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Home size={48} color={theme.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No rooms yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Create a room or join one with a code</Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/add-room')}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>Create Room</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: theme.primary }]} onPress={() => setJoinOpen(true)}>
                <KeyRound size={16} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>Join Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ maxWidth: contentW, alignSelf: 'center', width: '100%' }}>
            <View style={isTablet ? styles.roomGrid : undefined}>
              {filtered.map(room => (
                <View key={room.id} style={isTablet ? styles.roomGridItem : undefined}>
                  <RoomCard room={room} onClick={() => router.push(`/room/${room.id}`)} />
                </View>
              ))}
              {/* Add New Room card */}
              <View style={isTablet ? styles.roomGridItem : undefined}>
                <TouchableOpacity
                  style={[styles.addRoomCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}
                  onPress={() => router.push('/add-room')}
                  activeOpacity={0.7}
                >
                  <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.addRoomIcon}>
                    <Plus size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addRoomTitle, { color: theme.text }]}>Add New Room</Text>
                    <Text style={[styles.addRoomSub, { color: theme.textSecondary }]}>Set up a new room in your home</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Join Modal */}
      <Modal visible={joinOpen} transparent animationType="slide" onRequestClose={() => setJoinOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setJoinOpen(false)}>
          <Pressable style={[styles.joinModal, { backgroundColor: isDark ? '#333333' : '#FFFFFF' }]} onPress={e => e.stopPropagation()}>
            <Text style={[styles.joinTitle, { color: theme.text }]}>Join a Room</Text>
            <Text style={[styles.joinSub, { color: theme.textSecondary }]}>Enter the 6-digit code from the room owner</Text>
            <TextInput
              style={[styles.joinInput, { backgroundColor: isDark ? '#444444' : '#F3F4F6', color: theme.text, borderColor: theme.cardBorder }]}
              placeholder="123456" placeholderTextColor={theme.textSecondary}
              keyboardType="numeric" maxLength={6}
              value={joinCode}
              onChangeText={v => setJoinCode(v.replace(/\D/g, '').slice(0, 6))}
              textAlign="center"
            />
            <View style={styles.joinActions}>
              <TouchableOpacity onPress={() => { setJoinOpen(false); setJoinCode(''); }} style={[styles.cancelBtn, { borderColor: theme.cardBorder }]}>
                <Text style={[{ color: theme.text, fontWeight: '600', fontSize: 14 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleJoinRoom} disabled={joinCode.length !== 6 || joining} style={[styles.confirmBtn, { opacity: joinCode.length !== 6 || joining ? 0.6 : 1 }]}>
                <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmGrad}>
                  <Text style={styles.confirmText}>{joining ? 'Joining...' : 'Join Room'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  content: { paddingTop: 16, paddingBottom: 140 },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roomGridItem: { flex: 1, minWidth: 280 },
  addRoomCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  addRoomIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addRoomTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  addRoomSub: { fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: 'center', marginBottom: 24 },
  emptyActions: { flexDirection: 'row', gap: 10 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  joinModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  joinTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  joinSub: { fontSize: 13, marginBottom: 20 },
  joinInput: { borderWidth: 1, borderRadius: 14, paddingVertical: 16, fontSize: 28, fontWeight: '700', letterSpacing: 8, marginBottom: 20 },
  joinActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 14, alignItems: 'center' },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
