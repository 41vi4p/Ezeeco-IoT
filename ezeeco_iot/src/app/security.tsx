import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch,
  Image, ActivityIndicator, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, Shield, Bell, Lock, Eye, Camera,
  Video, RotateCw, Maximize2, WifiOff, ChevronRight,
} from 'lucide-react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CameraDevice {
  id: string;
  name: string;
  ip: string;       // from customProperties.ipAddress
  isOnline: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const snapshotUrl = (ip: string, key: number) =>
  `http://${ip}/capture?t=${key}`;

function formatTime(ts: any): string {
  if (!ts) return '';
  const d: Date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? timeStr : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
}

function logIcon(action: string) {
  if (action.toLowerCase().includes('motion') || action.toLowerCase().includes('camera'))
    return { icon: Camera, color: '#7C3AED' };
  if (action.toLowerCase().includes('lock') || action.toLowerCase().includes('door'))
    return { icon: Lock, color: '#EF4444' };
  return { icon: Shield, color: '#6366F1' };
}

// ── Camera feed panel ─────────────────────────────────────────────────────────

function CameraFeed({ camera, isDark, theme }: { camera: CameraDevice; isDark: boolean; theme: any }) {
  const [frameKey, setFrameKey] = useState(Date.now());
  const [error, setError]       = useState(false);
  const [loading, setLoading]   = useState(true);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    setError(false);
    setLoading(true);
    intervalRef.current = setInterval(() => setFrameKey(Date.now()), 1000);
  }, []);

  useEffect(() => {
    if (!camera.ip) return;
    startPolling();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [camera.ip, startPolling]);

  const retry = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startPolling();
  };

  if (!camera.ip) {
    return (
      <View style={[styles.feedPlaceholder, { backgroundColor: isDark ? '#1C1C1C' : '#1F2937' }]}>
        <Camera size={40} color="#6B7280" />
        <Text style={styles.feedPlaceholderTitle}>No IP configured</Text>
        <Text style={styles.feedPlaceholderSub}>Set the IP address in device settings</Text>
      </View>
    );
  }

  return (
    <View style={[styles.feedContainer, { backgroundColor: '#111' }]}>
      {!error ? (
        <>
          <Image
            key={frameKey}
            source={{ uri: snapshotUrl(camera.ip, frameKey) }}
            style={styles.feedImage}
            resizeMode="cover"
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); if (intervalRef.current) clearInterval(intervalRef.current); }}
          />
          {loading && (
            <View style={styles.feedLoading}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </>
      ) : (
        <View style={styles.feedError}>
          <WifiOff size={36} color="#6B7280" />
          <Text style={styles.feedErrorTitle}>Camera Not Connected</Text>
          <Text style={styles.feedErrorSub}>Unable to reach {camera.ip}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retry}>
            <RotateCw size={14} color="#FFFFFF" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status badge */}
      <View style={styles.feedTopRow}>
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <View style={[styles.statusDot, { backgroundColor: error ? '#6B7280' : '#22C55E' }]} />
          <Text style={styles.statusText}>{error ? 'OFFLINE' : 'LIVE'}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Mini camera thumbnail ─────────────────────────────────────────────────────

function CameraThumbnail({
  camera, selected, onPress, isDark,
}: { camera: CameraDevice; selected: boolean; onPress: () => void; isDark: boolean }) {
  const [err, setErr] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.thumbContainer,
        { backgroundColor: '#1C1C1C', borderColor: selected ? '#7C3AED' : 'transparent', borderWidth: selected ? 2 : 0 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {camera.ip && !err ? (
        <Image
          source={{ uri: `http://${camera.ip}/capture?t=${Date.now()}` }}
          style={styles.thumbImage}
          resizeMode="cover"
          onError={() => setErr(true)}
        />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Camera size={20} color="#6B7280" />
        </View>
      )}
      <View style={[styles.thumbBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.statusDot, { backgroundColor: err ? '#6B7280' : '#22C55E', width: 5, height: 5 }]} />
      </View>
      <Text style={styles.thumbLabel} numberOfLines={1}>{camera.name}</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SecurityScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const theme   = useTheme();
  const isDark  = useIsDark();
  const { user } = useAuth();
  const { devices } = useStore();

  const [armed, setArmed]               = useState(true);
  const [twoFactor, setTwoFactor]       = useState(false);
  const [loginAlerts, setLoginAlerts]   = useState(true);
  const [deviceAlerts, setDeviceAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [logs, setLogs]                 = useState<ActivityLog[]>([]);
  const [selectedCam, setSelectedCam]   = useState<CameraDevice | null>(null);

  // Filter camera devices from the store
  const cameras: CameraDevice[] = devices
    .filter(d => d.icon === 'camera' || d.category === 'security')
    .map(d => ({
      id: d.id,
      name: d.name,
      ip: (d as any).customProperties?.ipAddress ?? '',
      isOnline: d.isOnline ?? false,
    }));

  useEffect(() => {
    if (cameras.length > 0 && !selectedCam) setSelectedCam(cameras[0]);
  }, [cameras.length]);

  // Fetch recent activity logs
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'activityLogs'),
      where('userId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    getDocs(q).then(snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog)));
    }).catch(() => {});
  }, [user]);

  const headerGrad: [string, string, string] = isDark
    ? ['#0F0C3D', '#3B1E8B', '#1A0C4E']
    : ['#4F46E5', '#7C3AED', '#6D28D9'];

  const cardBg  = isDark ? '#333333' : '#FFFFFF';
  const inputBg = isDark ? '#444444' : '#F3F4F6';

  const SettingRow = ({ icon: Icon, iconColor, label, desc, value, onToggle }: any) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.cardBorder }]}>
      <View style={[styles.settingIcon, { backgroundColor: inputBg }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
        {desc && <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#818CF8' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security</Text>
          <TouchableOpacity style={styles.headerAction} onPress={() => router.push('/video-logs')}>
            <Video size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}>

        {/* ── Security System ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
          <View style={[styles.armedIcon, {
            backgroundColor: armed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
          }]}>
            <Shield size={22} color={armed ? '#22C55E' : '#EF4444'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Security System</Text>
            <Text style={[styles.cardSub, { color: armed ? '#22C55E' : theme.textSecondary }]}>
              {armed ? 'Armed' : 'Disarmed'}
            </Text>
          </View>
          <Switch
            value={armed}
            onValueChange={setArmed}
            trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#22C55E' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── Live View ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Live View</Text>
          <TouchableOpacity onPress={() => router.push('/video-logs')} style={styles.sectionAction}>
            <Text style={[styles.sectionActionText, { color: theme.primary }]}>View Logs</Text>
            <ChevronRight size={14} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {cameras.length === 0 ? (
          <View style={[styles.noCameraCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
            <Camera size={36} color={theme.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.noCameraTitle, { color: theme.text }]}>No Cameras Configured</Text>
            <Text style={[styles.noCameraSub, { color: theme.textSecondary }]}>
              Add a camera device with an ESP32 IP address to enable live monitoring
            </Text>
            <TouchableOpacity
              style={[styles.addCameraBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/add-device')}
            >
              <Text style={styles.addCameraBtnText}>Add Camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          selectedCam && (
            <View style={[styles.feedCard, { borderColor: theme.cardBorder }]}>
              <CameraFeed camera={selectedCam} isDark={isDark} theme={theme} />
              <View style={[styles.feedFooter, { backgroundColor: cardBg }]}>
                <Text style={[styles.feedName, { color: theme.text }]}>{selectedCam.name}</Text>
                {selectedCam.ip ? (
                  <Text style={[styles.feedIp, { color: theme.textSecondary }]}>{selectedCam.ip}</Text>
                ) : null}
              </View>
            </View>
          )
        )}

        {/* ── All Cameras grid ── */}
        {cameras.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>All Cameras</Text>
              <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>
                {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.thumbGrid}>
              {cameras.map(cam => (
                <CameraThumbnail
                  key={cam.id}
                  camera={cam}
                  selected={selectedCam?.id === cam.id}
                  onPress={() => setSelectedCam(cam)}
                  isDark={isDark}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Recent Activity ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/logs')} style={styles.sectionAction}>
            <Text style={[styles.sectionActionText, { color: theme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {logs.length === 0 ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.cardBorder, justifyContent: 'center' }]}>
            <Text style={[styles.cardSub, { color: theme.textSecondary, textAlign: 'center', flex: 1 }]}>
              No recent activity
            </Text>
          </View>
        ) : (
          <View style={[styles.logsCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
            {logs.map((log, i) => {
              const { icon: Icon, color } = logIcon(log.action);
              return (
                <View key={log.id}
                  style={[styles.logRow, i < logs.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder }]}>
                  <View style={[styles.logIcon, { backgroundColor: `${color}18` }]}>
                    <Icon size={15} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.logAction, { color: theme.text }]}>{log.action}</Text>
                    {log.details ? (
                      <Text style={[styles.logDetail, { color: theme.textSecondary }]} numberOfLines={1}>
                        {log.details}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.logTime, { color: theme.textSecondary }]}>
                    {formatTime(log.timestamp)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Security Settings ── */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 10 }]}>Settings</Text>

        <View style={[styles.settingsCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.settingsGroup, { color: theme.textSecondary }]}>AUTHENTICATION</Text>
          <SettingRow icon={Shield} iconColor="#7C3AED" label="Two-Factor Authentication"
            desc="Add an extra layer of security" value={twoFactor} onToggle={setTwoFactor} />
          <SettingRow icon={Lock} iconColor="#EF4444" label="Session Timeout"
            desc="Auto-logout after 30 min" value={sessionTimeout} onToggle={setSessionTimeout} />
        </View>

        <View style={[styles.settingsCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.settingsGroup, { color: theme.textSecondary }]}>ALERTS</Text>
          <SettingRow icon={Bell} iconColor="#F59E0B" label="Login Alerts"
            desc="Get notified of new sign-ins" value={loginAlerts} onToggle={setLoginAlerts} />
          <SettingRow icon={Eye} iconColor="#3B82F6" label="Device Control Alerts"
            desc="Notifications when devices are controlled" value={deviceAlerts} onToggle={setDeviceAlerts} />
        </View>

        <View style={[styles.infoCard, { backgroundColor: isDark ? '#333333' : '#EEF2FF', borderColor: '#818CF8' }]}>
          <Shield size={18} color="#6366F1" />
          <Text style={[styles.infoText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
            All data is transmitted securely. Camera feeds are accessed directly from your local network — no video is stored on our servers.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1 },
  header:           { paddingHorizontal: 20, paddingBottom: 20,
                      borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  backBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontSize: 18, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  headerAction:     { width: 36, height: 36, borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      alignItems: 'center', justifyContent: 'center' },

  content:          { padding: 16, gap: 12 },

  card:             { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
                      borderRadius: 16, borderWidth: 1 },
  armedIcon:        { width: 44, height: 44, borderRadius: 12,
                      alignItems: 'center', justifyContent: 'center' },
  cardLabel:        { fontSize: 14, fontWeight: '700' },
  cardSub:          { fontSize: 12, marginTop: 2 },

  sectionHeader:    { flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'space-between', marginTop: 4 },
  sectionTitle:     { fontSize: 16, fontWeight: '700' },
  sectionAction:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText:{ fontSize: 13, fontWeight: '600' },
  sectionCount:     { fontSize: 13 },

  noCameraCard:     { alignItems: 'center', padding: 32, borderRadius: 16,
                      borderWidth: 1, gap: 8 },
  noCameraTitle:    { fontSize: 15, fontWeight: '700', marginTop: 6 },
  noCameraSub:      { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  addCameraBtn:     { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addCameraBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  feedCard:         { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  feedContainer:    { height: 220, position: 'relative' },
  feedImage:        { width: '100%', height: '100%' },
  feedLoading:      { ...StyleSheet.absoluteFillObject,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.4)' },
  feedError:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
  feedErrorTitle:   { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  feedErrorSub:     { color: '#9CA3AF', fontSize: 12 },
  retryBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: '#7C3AED', paddingHorizontal: 16,
                      paddingVertical: 8, borderRadius: 10, marginTop: 4 },
  retryText:        { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  feedTopRow:       { position: 'absolute', top: 10, left: 10, right: 10,
                      flexDirection: 'row', justifyContent: 'space-between' },
  statusBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot:        { width: 7, height: 7, borderRadius: 4 },
  statusText:       { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  feedFooter:       { paddingHorizontal: 14, paddingVertical: 10 },
  feedName:         { fontSize: 13, fontWeight: '700' },
  feedIp:           { fontSize: 11, marginTop: 2 },

  thumbGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbContainer:   { width: '31%', aspectRatio: 4 / 3, borderRadius: 10,
                      overflow: 'hidden', position: 'relative' },
  thumbImage:       { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbBadge:       { position: 'absolute', top: 4, left: 4, padding: 3, borderRadius: 6 },
  thumbLabel:       { position: 'absolute', bottom: 4, left: 4, right: 4,
                      color: '#FFFFFF', fontSize: 9, fontWeight: '600', textAlign: 'center' },

  logsCard:         { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  logRow:           { flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 14, paddingVertical: 12 },
  logIcon:          { width: 32, height: 32, borderRadius: 10,
                      alignItems: 'center', justifyContent: 'center' },
  logAction:        { fontSize: 13, fontWeight: '600' },
  logDetail:        { fontSize: 11, marginTop: 1 },
  logTime:          { fontSize: 11 },

  settingsCard:     { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  settingsGroup:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
                      letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  settingRow:       { flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, gap: 12 },
  settingIcon:      { width: 34, height: 34, borderRadius: 10,
                      alignItems: 'center', justifyContent: 'center' },
  settingLabel:     { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  settingDesc:      { fontSize: 11 },

  infoCard:         { flexDirection: 'row', alignItems: 'flex-start',
                      borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  infoText:         { flex: 1, fontSize: 12, lineHeight: 18 },
});
