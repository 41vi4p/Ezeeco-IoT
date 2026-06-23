import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Alert, Modal, RefreshControl, ActivityIndicator, Pressable, Image,
} from 'react-native';
import { useResponsive } from '@/hooks/use-responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Search, Plus, KeyRound, LogOut, Settings, User, FileText, ChevronDown, Star, Cpu, Home, Wifi } from 'lucide-react-native'; // ChevronDown used by profile menu
import { ref, set, serverTimestamp, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { roomService, deviceService } from '@/services/firestoreService';
import { validateJoinCode, checkRateLimit, sanitizeInput } from '@/utils/validation';
import DeviceCard from '@/components/DeviceCard';
import RoomCard from '@/components/RoomCard';
import BrandFooter from '@/components/BrandFooter';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { hPad, itemWidth, gridGap, contentW, isTablet } = useResponsive();
  const { user, logout, isLoading } = useAuth();
  const { unreadCount } = useNotifications();
  const { devices, rooms, pinnedIds, fetchDevices, fetchRooms, loadPinnedIds, togglePin, setRooms, darkMode } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDevices, setFilteredDevices] = useState(devices);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [deviceStates, setDeviceStates] = useState<Record<string, { online: boolean; state: number | string; lastUpdated?: any }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [allDevices, setAllDevices] = useState<any[]>([]);
  const [loadingManage, setLoadingManage] = useState(false);
  const hasLoadedStates = useRef(false);

  const headerGrad: [string, string, string] = isDark
    ? ['#0F0C3D', '#3B1E8B', '#1A0C4E']
    : ['#4F46E5', '#7C3AED', '#6D28D9'];

  const refreshAll = useCallback(async (uid: string) => {
    await fetchRooms(uid);
    await fetchDevices(uid);
    await loadPinnedIds(uid);
  }, []);

  useEffect(() => {
    if (!user) return;
    hasLoadedStates.current = false;
    setDeviceStates({});
    refreshAll(user.id);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      refreshAll(user.id);
    }, [user])
  );

  useEffect(() => {
    if (!user || !devices.length) return;
    const unsubscribes: (() => void)[] = [];
    devices.forEach(device => {
      if (!device.roomId) return;
      const stateRef = ref(database, `rooms/${device.roomId}/devices/${device.id}/iotState`);
      const unsub = onValue(stateRef, (snap) => {
        const val = snap.val();
        if (val) setDeviceStates(prev => ({ ...prev, [device.id]: val }));
      });
      unsubscribes.push(unsub);
    });
    hasLoadedStates.current = true;
    return () => unsubscribes.forEach(u => u());
  }, [user, devices]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDevices(devices);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredDevices(devices.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q)
      ));
    }
  }, [devices, searchQuery]);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await refreshAll(user.id);
    setRefreshing(false);
  }, [user]);

  const handleToggleDevice = async (deviceId: string) => {
    if (!user) return;
    const device = devices.find(d => d.id === deviceId);
    if (!device?.roomId) return;
    try {
      const state = deviceStates[deviceId]?.state;
      const currentState = typeof state === 'number' ? state : (state === 'on' || state === '1' ? 1 : 0);
      const newState = currentState === 1 ? 0 : 1;
      const stateRef = ref(database, `rooms/${device.roomId}/devices/${deviceId}/iotState`);
      await set(stateRef, { online: true, state: newState, lastUpdated: serverTimestamp() });
      await deviceService.updateDevice(deviceId, { currentValue: newState, isOnline: true });
      setDeviceStates(prev => ({ ...prev, [deviceId]: { online: true, state: newState, lastUpdated: Date.now() } }));
      setFilteredDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, currentValue: newState, iotState: { online: true, state: newState, lastUpdated: Date.now() } } : d
      ));
    } catch (e) {
      Alert.alert('Error', 'Failed to control device');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || !user) return;
    const validation = validateJoinCode(joinCode);
    if (!validation.isValid) { Alert.alert('Invalid code', validation.error); return; }
    if (!checkRateLimit(`join_${user.id}`, 5, 300000)) { Alert.alert('Too many attempts', 'Please wait before trying again'); return; }
    setIsJoining(true);
    try {
      const result = await roomService.joinRoomByCode(sanitizeInput(joinCode), user.id, user.name || 'User', user.email || '');
      if (result) {
        await fetchRooms(user.id);
        await fetchDevices(user.id);
        setJoinDialogOpen(false);
        setJoinCode('');
        const room = 'alreadyMember' in result ? result.room : result;
        Alert.alert('alreadyMember' in result ? 'Already a member' : 'Room joined', `You joined "${room.name}"`);
        router.push(`/room/${room.id}`);
      } else {
        Alert.alert('Invalid code', 'The room join code is invalid or expired');
      }
    } catch { Alert.alert('Error', 'Failed to join room'); }
    finally { setIsJoining(false); }
  };

  const handleTogglePin = (deviceId: string) => {
    if (!user) return;
    togglePin(user.id, deviceId);
  };

  const openManage = async () => {
    setManageOpen(true);
    if (!user) return;
    setLoadingManage(true);
    try {
      // Use store devices if already loaded, otherwise fetch from all rooms
      if (devices.length > 0) {
        setAllDevices(devices);
      } else {
        const userRooms = rooms.length > 0 ? rooms : await roomService.getUserRooms(user.id);
        const arrays = await Promise.all(
          userRooms.map(r => deviceService.getRoomDevices(r.id).catch(() => [] as any[]))
        );
        const seen = new Set<string>();
        const flat: any[] = [];
        arrays.flat().forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); flat.push(d); } });
        setAllDevices(flat);
      }
    } catch { setAllDevices(devices); }
    finally { setLoadingManage(false); }
  };

  const onlineCount = devices.filter(d => {
    const s = deviceStates[d.id];
    return s ? s.online : d.isOnline;
  }).length;
  const recentRooms = rooms.slice(0, 4);
  const quickAccessDevices = devices
    .filter(d => pinnedIds.includes(d.id))
    .map(d => ({ ...d, iotState: deviceStates[d.id] || d.iotState }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Header */}
        <LinearGradient
          colors={headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: hPad }]}
        >
          <View style={[styles.contentCap, { maxWidth: contentW }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Hello, {user?.name?.split(' ')[0] || 'User'}</Text>
              <Text style={styles.headerSub}>Welcome back home</Text>
            </View>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => setProfileOpen(true)}>
              <View style={styles.avatar}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                )}
              </View>
              <ChevronDown size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search size={18} color="rgba(255,255,255,0.6)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search devices, rooms..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications')}>
              <Bell size={20} color="rgba(255,255,255,0.8)" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Device summary pills */}
          <View style={styles.headerPills}>
            <View style={styles.headerPill}>
              <Cpu size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.headerPillText}>{devices.length} Devices</Text>
            </View>
            <View style={styles.headerPill}>
              <Wifi size={12} color="#34D399" />
              <Text style={[styles.headerPillText, { color: '#34D399' }]}>{onlineCount} Online</Text>
            </View>
            <View style={styles.headerPill}>
              <Home size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.headerPillText}>{rooms.length} Rooms</Text>
            </View>
          </View>
          </View>{/* end contentCap */}
        </LinearGradient>

        {/* Quick Access Devices */}
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <View style={[styles.contentCap, { maxWidth: contentW }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
              <TouchableOpacity onPress={openManage}>
                <Text style={[styles.seeAll, { color: theme.primary }]}>Manage</Text>
              </TouchableOpacity>
            </View>
            {isLoading && !devices.length ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
            ) : quickAccessDevices.length > 0 ? (
              <View style={[styles.deviceGrid, { gap: gridGap }]}>
                {quickAccessDevices.map(device => (
                  <View key={device.id} style={{ width: itemWidth }}>
                    <DeviceCard
                      device={device as any}
                      onToggle={handleToggleDevice}
                      onEdit={id => router.push(`/device/${id}`)}
                      isPinned={pinnedIds.includes(device.id)}
                      onPinToggle={handleTogglePin}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Star size={32} color={theme.textSecondary} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: theme.textSecondary, marginTop: 10 }]}>No pinned devices</Text>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: theme.primary }]}
                  onPress={openManage}
                >
                  <Star size={14} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Pin Devices</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Rooms */}
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <View style={[styles.contentCap, { maxWidth: contentW }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Rooms</Text>
              <View style={styles.sectionHeaderRight}>
                <TouchableOpacity onPress={() => setJoinDialogOpen(true)} style={styles.joinBtn}>
                  <KeyRound size={14} color={theme.primary} />
                  <Text style={[styles.seeAll, { color: theme.primary }]}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/rooms')}>
                  <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
                </TouchableOpacity>
              </View>
            </View>
            {recentRooms.length > 0 ? (
              <View style={isTablet ? styles.roomGrid : undefined}>
                {recentRooms.map(room => (
                  <View key={room.id} style={isTablet ? styles.roomGridItem : undefined}>
                    <RoomCard room={room} onClick={() => router.push(`/room/${room.id}`)} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No rooms found</Text>
                <View style={styles.emptyActions}>
                  <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/add-room')}>
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>Create Room</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={() => setJoinDialogOpen(true)}>
                    <KeyRound size={16} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>Join Room</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <BrandFooter />
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={profileOpen} transparent animationType="fade" onRequestClose={() => setProfileOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setProfileOpen(false)}>
          <View style={[styles.profileMenu, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
            <View style={[styles.profileHeader, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>{user?.name || 'User'}</Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>{user?.email}</Text>
            </View>
            {[
              { icon: User, label: 'Account Settings', route: '/account-settings' },
              { icon: Settings, label: 'Profile Settings', route: '/profile-edit' },
              { icon: FileText, label: 'Activity Logs', route: '/logs' },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.profileMenuItem}
                onPress={() => { setProfileOpen(false); router.push(item.route as any); }}
              >
                <item.icon size={18} color={theme.textSecondary} />
                <Text style={[styles.profileMenuText, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.menuDivider, { backgroundColor: theme.cardBorder }]} />
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => { setProfileOpen(false); logout(); }}
            >
              <LogOut size={18} color="#EF4444" />
              <Text style={[styles.profileMenuText, { color: '#EF4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Manage Quick Access Modal */}
      <Modal visible={manageOpen} transparent animationType="slide" onRequestClose={() => setManageOpen(false)}>
        <Pressable style={styles.manageOverlay} onPress={() => setManageOpen(false)}>
          <Pressable style={[styles.manageSheet, { backgroundColor: isDark ? '#333333' : '#FFFFFF' }]} onPress={e => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#374151' : '#D1D5DB' }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Pin Devices</Text>
            <Text style={[styles.sheetSub, { color: theme.textSecondary }]}>
              Tap a device to pin or unpin it from Quick Access
            </Text>

            {loadingManage ? (
              <View style={styles.manageLoading}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.sheetSub, { color: theme.textSecondary, marginTop: 8 }]}>Loading devices...</Text>
              </View>
            ) : allDevices.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No devices found</Text>
              </View>
            ) : (
              <ScrollView style={styles.deviceList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {allDevices.map(device => {
                  const isPinned = pinnedIds.includes(device.id);
                  return (
                    <TouchableOpacity
                      key={device.id}
                      style={[styles.deviceRow, { borderBottomColor: theme.cardBorder, backgroundColor: isPinned ? (isDark ? '#3A3A3A' : '#FFFBEB') : 'transparent' }]}
                      onPress={() => handleTogglePin(device.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.deviceRowIcon, { backgroundColor: isPinned ? '#FEF3C7' : (isDark ? '#444444' : '#F3F4F6') }]}>
                        <Star size={18} color={isPinned ? '#F59E0B' : theme.textSecondary} fill={isPinned ? '#F59E0B' : 'none'} />
                      </View>
                      <View style={styles.deviceRowInfo}>
                        <Text style={[styles.deviceRowName, { color: theme.text }]}>{device.name}</Text>
                        <Text style={[styles.deviceRowSub, { color: theme.textSecondary }]}>
                          {device.category || device.type || 'Device'}
                        </Text>
                      </View>
                      <View style={[styles.pinChip, { backgroundColor: isPinned ? '#F59E0B' : (isDark ? '#444444' : '#F3F4F6') }]}>
                        <Text style={[styles.pinChipText, { color: isPinned ? '#FFFFFF' : theme.textSecondary }]}>
                          {isPinned ? 'Pinned' : 'Pin'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.sheetDoneBtn, { backgroundColor: theme.primary }]}
              onPress={() => setManageOpen(false)}
            >
              <Text style={styles.sheetDoneText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join Room Modal */}
      <Modal visible={joinDialogOpen} transparent animationType="slide" onRequestClose={() => setJoinDialogOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setJoinDialogOpen(false)}>
          <Pressable style={[styles.joinModal, { backgroundColor: isDark ? '#333333' : '#FFFFFF' }]} onPress={e => e.stopPropagation()}>
            <Text style={[styles.joinTitle, { color: theme.text }]}>Join a Room</Text>
            <Text style={[styles.joinSub, { color: theme.textSecondary }]}>Enter the 6-digit code provided by the room owner</Text>
            <TextInput
              style={[styles.joinInput, { backgroundColor: isDark ? '#444444' : '#F3F4F6', color: theme.text, borderColor: theme.cardBorder }]}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              maxLength={6}
              value={joinCode}
              onChangeText={v => setJoinCode(v.replace(/\D/g, '').slice(0, 6))}
              textAlign="center"
            />
            <View style={styles.joinActions}>
              <TouchableOpacity onPress={() => { setJoinDialogOpen(false); setJoinCode(''); }} style={[styles.joinCancelBtn, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.joinCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleJoinRoom}
                disabled={joinCode.length !== 6 || isJoining}
                style={[styles.joinConfirmBtn, { opacity: joinCode.length !== 6 || isJoining ? 0.6 : 1 }]}
              >
                <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.joinConfirmGrad}>
                  <Text style={styles.joinConfirmText}>{isJoining ? 'Joining...' : 'Join Room'}</Text>
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
  header: { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerGreeting: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  avatarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  bellBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  headerPills: { flexDirection: 'row', gap: 8, marginTop: 14 },
  headerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  headerPillText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  section: { paddingTop: 20 },
  contentCap: { alignSelf: 'center', width: '100%' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deviceGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roomGridItem: { flex: 1, minWidth: 280 },
  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, marginBottom: 12 },
  emptyActions: { flexDirection: 'row', gap: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  profileMenu: { position: 'absolute', top: 120, right: 16, width: 200, borderRadius: 16, borderWidth: 1, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12 },
  profileHeader: { padding: 14, borderBottomWidth: 1 },
  profileName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  profileEmail: { fontSize: 11 },
  profileMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  profileMenuText: { fontSize: 14, fontWeight: '500' },
  menuDivider: { height: 1, marginHorizontal: 14 },
  joinModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  joinTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  joinSub: { fontSize: 13, marginBottom: 20 },
  joinInput: { borderWidth: 1, borderRadius: 14, paddingVertical: 16, fontSize: 28, fontWeight: '700', letterSpacing: 8, marginBottom: 20 },
  joinActions: { flexDirection: 'row', gap: 10 },
  joinCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  joinCancelText: { fontSize: 14, fontWeight: '600' },
  joinConfirmBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  joinConfirmGrad: { paddingVertical: 14, alignItems: 'center' },
  joinConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  manageOverlay: { flex: 1, justifyContent: 'flex-end' },
  manageSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '85%', elevation: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sheetSub: { fontSize: 13, marginBottom: 16 },
  manageLoading: { alignItems: 'center', paddingVertical: 32 },
  deviceList: { flexGrow: 0 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, gap: 12, paddingHorizontal: 2, borderRadius: 8 },
  deviceRowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deviceRowInfo: { flex: 1 },
  deviceRowName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  deviceRowSub: { fontSize: 12, textTransform: 'capitalize' },
  pinChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pinChipText: { fontSize: 12, fontWeight: '700' },
  sheetDoneBtn: { marginTop: 16, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sheetDoneText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
