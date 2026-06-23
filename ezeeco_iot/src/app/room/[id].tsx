import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MoreVertical, Plus, Users, Clock, Key, Copy, Trash } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { onValue, ref, off, set, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { Room, Device, deviceService, roomService } from '@/services/firestoreService';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import DeviceCard from '@/components/DeviceCard';

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();
  const { rooms, setRooms, fetchDevices, pinnedIds, togglePin, loadPinnedIds } = useStore();

  const [room, setRoom] = useState<Room | null>(null);
  const [roomDevices, setRoomDevices] = useState<Device[]>([]);
  const [deviceStates, setDeviceStates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);
      try {
        const storeRoom = rooms.find(r => r.id === id);
        let loadedRoom = storeRoom;
        if (!storeRoom) {
          const fetched = await roomService.getRoom(id as string);
          if (!fetched) { Alert.alert('Not found'); router.canGoBack() ? router.back() : router.replace('/(tabs)'); return; }
          loadedRoom = fetched;
        }
        setRoom(loadedRoom || null);
        const devices = await deviceService.getRoomDevices(id as string);
        setRoomDevices(devices);
        loadPinnedIds(user.id);
        devices.forEach(device => {
          const stateRef = ref(database, `rooms/${id}/devices/${device.id}/iotState`);
          onValue(stateRef, snap => {
            const val = snap.val();
            if (val) setDeviceStates(prev => ({ ...prev, [device.id]: val }));
          });
        });
      } catch { Alert.alert('Error', 'Could not load room'); }
      finally { setLoading(false); }
    };
    load();
    return () => { roomDevices.forEach(d => { const r = ref(database, `rooms/${id}/devices/${d.id}/iotState`); off(r); }); };
  }, [id, user]);

  const handleToggleDevice = async (deviceId: string) => {
    const device = roomDevices.find(d => d.id === deviceId);
    if (!device) return;
    const state = deviceStates[deviceId]?.state;
    const currentState = typeof state === 'number' ? state : (state === 'on' || state === '1' ? 1 : 0);
    const newState = currentState === 1 ? 0 : 1;
    try {
      const stateRef = ref(database, `rooms/${id}/devices/${deviceId}/iotState`);
      await set(stateRef, { online: true, state: newState, lastUpdated: serverTimestamp() });
      await deviceService.updateDevice(deviceId, { currentValue: newState, isOnline: true });
      setDeviceStates(prev => ({ ...prev, [deviceId]: { online: true, state: newState } }));
    } catch { Alert.alert('Error', 'Failed to control device'); }
  };

  const handleDeleteRoom = async () => {
    if (!room || !user) return;
    try {
      await roomService.deleteRoom(room.id, user.id);
      setRooms(rooms.filter(r => r.id !== room.id));
      router.replace('/(tabs)/rooms');
    } catch { Alert.alert('Error', 'Could not delete room'); }
  };


  const handleTogglePin = (deviceId: string) => {
    if (!user) return;
    togglePin(user.id, deviceId);
  };

  const copyJoinCode = async () => {
    if (room?.joinCode) {
      await Clipboard.setStringAsync(room.joinCode);
      Alert.alert('Copied', 'Join code copied to clipboard');
    }
  };

  const isOwner = room?.userId === user?.id || room?.members?.find(m => m.id === user?.id)?.role === 'owner';

  if (loading) {
    return <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{room?.name || 'Room'}</Text>
            <Text style={styles.headerSub}>{roomDevices.length} devices · {room?.members?.length || 0} members</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <MoreVertical size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => router.push(`/room/${id}/members`)}>
            <Users size={15} color="#FFFFFF" />
            <Text style={styles.headerActionText}>Members</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => router.push(`/room/${id}/logs`)}>
            <Clock size={15} color="#FFFFFF" />
            <Text style={styles.headerActionText}>Logs</Text>
          </TouchableOpacity>
          {room?.joinCode && (
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShareOpen(true)}>
              <Key size={15} color="#FFFFFF" />
              <Text style={styles.headerActionText}>Share Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Devices</Text>
          <TouchableOpacity onPress={() => router.push(`/add-device?roomId=${room?.id}`)} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {roomDevices.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No devices in this room</Text>
            <TouchableOpacity onPress={() => router.push(`/add-device?roomId=${room?.id}`)} style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Device</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {roomDevices.map(device => (
              <View key={device.id} style={styles.gridItem}>
                <DeviceCard
                  device={{ ...device, iotState: deviceStates[device.id] }}
                  onToggle={handleToggleDevice}
                  onEdit={did => router.push(`/device/${did}`)}
                  isPinned={pinnedIds.includes(device.id)}
                  onPinToggle={handleTogglePin}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuModal, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setShareOpen(true); }}>
              <Key size={18} color={theme.text} /><Text style={[styles.menuItemText, { color: theme.text }]}>Share Join Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); router.push(`/room/${id}/members`); }}>
              <Users size={18} color={theme.text} /><Text style={[styles.menuItemText, { color: theme.text }]}>Manage Members</Text>
            </TouchableOpacity>
            {isOwner && (
              <>
                <View style={[styles.menuDivider, { backgroundColor: theme.cardBorder }]} />
                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setDeleteOpen(true); }}>
                  <Trash size={18} color="#EF4444" /><Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete Room</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Delete Confirm */}
      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setDeleteOpen(false)}>
          <Pressable style={[styles.alertModal, { backgroundColor: isDark ? '#333333' : '#FFFFFF' }]} onPress={e => e.stopPropagation()}>
            <Text style={[styles.alertTitle, { color: theme.text }]}>Delete Room?</Text>
            <Text style={[styles.alertSub, { color: theme.textSecondary }]}>This will remove the room and all its devices permanently.</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={[styles.alertCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setDeleteOpen(false)}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertDeleteBtn} onPress={() => { setDeleteOpen(false); handleDeleteRoom(); }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Share Code */}
      <Modal visible={shareOpen} transparent animationType="slide" onRequestClose={() => setShareOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setShareOpen(false)}>
          <Pressable style={[styles.shareModal, { backgroundColor: isDark ? '#333333' : '#FFFFFF' }]} onPress={e => e.stopPropagation()}>
            <Text style={[styles.joinTitle, { color: theme.text }]}>Room Join Code</Text>
            <Text style={[styles.joinSub, { color: theme.textSecondary }]}>Share this code with family or friends</Text>
            <TouchableOpacity style={[styles.codeBox, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]} onPress={copyJoinCode}>
              <Text style={[styles.codeText, { color: theme.primary }]}>{room?.joinCode || '------'}</Text>
              <Copy size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShareOpen(false)} style={[styles.doneBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  headerActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginBottom: 16 },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuModal: { position: 'absolute', top: 120, right: 16, width: 200, borderRadius: 16, borderWidth: 1, overflow: 'hidden', elevation: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  menuItemText: { fontSize: 14, fontWeight: '500' },
  menuDivider: { height: 1, marginHorizontal: 14 },
  alertModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  alertTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  alertSub: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  alertActions: { flexDirection: 'row', gap: 10 },
  alertCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  alertDeleteBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#EF4444' },
  shareModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  joinTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  joinSub: { fontSize: 13, marginBottom: 20 },
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 14, paddingVertical: 20, marginBottom: 20 },
  codeText: { fontSize: 32, fontWeight: '800', letterSpacing: 6 },
  doneBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 16 },
});
