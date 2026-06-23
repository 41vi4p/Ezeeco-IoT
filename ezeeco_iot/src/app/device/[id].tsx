import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Lightbulb, Fan, Tv, Volume2, Camera, Lock, Plug, Wifi, WifiOff, Clock, Zap, Trash2 } from 'lucide-react-native';
import { ref as dbRef, update as dbUpdate, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { deviceService } from '@/services/firestoreService';
import { logUserAction } from '@/utils/activityLogger';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

const getDeviceIcon = (type: string, color = '#6366F1', size = 24) => {
  switch (type?.toLowerCase()) {
    case 'fan': return <Fan size={size} color={color} />;
    case 'tv': return <Tv size={size} color={color} />;
    case 'speaker': return <Volume2 size={size} color={color} />;
    case 'camera': return <Camera size={size} color={color} />;
    case 'lock': return <Lock size={size} color={color} />;
    case 'plug': return <Plug size={size} color={color} />;
    default: return <Lightbulb size={size} color={color} />;
  }
};

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();
  const { devices, setDevices, fetchDevices } = useStore();

  const [device, setDevice] = useState<any>(null);
  const [realtimeState, setRealtimeState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'info' | 'logs'>('controls');

  useEffect(() => {
    if (!id || !user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await deviceService.getDevice(id as string);
        if (!data) { Alert.alert('Not found', 'Device not found'); router.canGoBack() ? router.back() : router.replace('/(tabs)'); return; }
        setDevice(data);
        if (data.roomId) {
          const stateRef = dbRef(database, `rooms/${data.roomId}/devices/${id}/iotState`);
          onValue(stateRef, snap => setRealtimeState(snap.val()));
        }
      } catch { Alert.alert('Error', 'Could not load device'); router.canGoBack() ? router.back() : router.replace('/(tabs)'); }
      finally { setLoading(false); }
    };
    fetch();
    return () => {
      const storeDevice = devices.find(d => d.id === id);
      if (storeDevice?.roomId) {
        const stateRef = dbRef(database, `rooms/${storeDevice.roomId}/devices/${id}/iotState`);
        off(stateRef);
      }
    };
  }, [id, user]);

  const currentState = realtimeState?.state ?? device?.currentValue ?? 0;
  const isOn = typeof currentState === 'number' ? currentState === 1 : currentState === 'on' || currentState === '1' || currentState === true;
  const isOnline = realtimeState?.online ?? device?.isOnline ?? false;

  const handleToggle = async () => {
    if (!device || toggling) return;
    setToggling(true);
    try {
      const newState = isOn ? 0 : 1;
      if (device.roomId) {
        const stateRef = dbRef(database, `rooms/${device.roomId}/devices/${id}/iotState`);
        await dbUpdate(stateRef, { state: newState, online: true, lastUpdated: Date.now() });
      }
      await deviceService.updateDevice(id as string, { currentValue: isOn ? 0 : 1, isOnline: true });
      if (user) logUserAction(user.id, user.name || '', `Device ${newState === 1 ? 'turned on' : 'turned off'}: ${device.name}`, 'device_control', id as string);
    } catch { Alert.alert('Error', 'Failed to control device'); }
    finally { setToggling(false); }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Device',
      `Are you sure you want to delete "${device?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(),
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!user || !id) return;
    setDeleting(true);
    try {
      await deviceService.deleteDevice(id as string, user.id);
      setDevices(devices.filter(d => d.id !== id));
      await fetchDevices(user.id);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Delete device error:', err);
      const msg = err?.message ?? err?.code ?? 'Unknown error';
      Alert.alert('Delete Failed', msg);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            {getDeviceIcon(device?.type, '#FFFFFF', 26)}
          </View>
          <View>
            <Text style={styles.headerTitle}>{device?.name || 'Device'}</Text>
            <View style={styles.statusRow}>
              {isOnline ? <Wifi size={12} color="#6EE7B7" /> : <WifiOff size={12} color="#FCA5A5" />}
              <Text style={[styles.statusText, { color: isOnline ? '#6EE7B7' : '#FCA5A5' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderBottomColor: theme.cardBorder }]}>
        {(['controls', 'info', 'logs'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textSecondary }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {activeTab === tab && <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'controls' && (
          <View style={styles.controlsPane}>
            {/* Main Toggle */}
            <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <View style={styles.powerRow}>
                <View>
                  <Text style={[styles.powerLabel, { color: theme.textSecondary }]}>Power</Text>
                  <Text style={[styles.powerState, { color: isOn ? '#10B981' : theme.text }]}>{isOn ? 'On' : 'Off'}</Text>
                </View>
                <TouchableOpacity onPress={handleToggle} disabled={toggling}>
                  <View style={[styles.powerBtn, { backgroundColor: isOn ? '#10B981' : (isDark ? '#374151' : '#E5E7EB') }]}>
                    {toggling ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Zap size={22} color="#FFFFFF" fill={isOn ? '#FFFFFF' : 'none'} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Card */}
            <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Status</Text>
              <View style={styles.statusGrid}>
                {[
                  { label: 'State', value: isOn ? 'On' : 'Off', color: isOn ? '#10B981' : theme.textSecondary },
                  { label: 'Connectivity', value: isOnline ? 'Online' : 'Offline', color: isOnline ? '#10B981' : '#EF4444' },
                  { label: 'Type', value: device?.type || 'Unknown', color: theme.text },
                  { label: 'Category', value: device?.category || 'Unknown', color: theme.text },
                ].map(item => (
                  <View key={item.label} style={[styles.statusItem, { borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statusItemLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                    <Text style={[styles.statusItemValue, { color: item.color }]}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
            {/* Delete */}
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: '#EF4444' }]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <><Trash2 size={16} color="#EF4444" /><Text style={styles.deleteBtnText}>Delete Device</Text></>
              }
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'info' && (
          <View style={styles.infoPane}>
            <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              {[
                { label: 'Device ID', value: device?.id },
                { label: 'Name', value: device?.name },
                { label: 'Type', value: device?.type },
                { label: 'Category', value: device?.category },
                { label: 'Room ID', value: device?.roomId || 'N/A' },
                { label: 'User ID', value: device?.userId || 'N/A' },
              ].map((item, i) => (
                <View key={item.label} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.cardBorder }]}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>{item.value || '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'logs' && (
          <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
            <Clock size={32} color={theme.textSecondary} strokeWidth={1.5} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No logs available yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusText: { fontSize: 11, fontWeight: '600' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, borderRadius: 1 },
  content: { padding: 16, paddingBottom: 100 },
  controlsPane: { gap: 12 },
  infoPane: { gap: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  powerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  powerLabel: { fontSize: 12, marginBottom: 2 },
  powerState: { fontSize: 22, fontWeight: '800' },
  powerBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusItem: { width: '47%', padding: 12, borderRadius: 10, borderWidth: 1 },
  statusItemLabel: { fontSize: 11, marginBottom: 4 },
  statusItemValue: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  emptyText: { textAlign: 'center', fontSize: 14 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14 },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
