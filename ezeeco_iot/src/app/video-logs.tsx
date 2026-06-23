import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Video, Camera, Clock } from 'lucide-react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function VideoLogsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const q = query(collection(firestore, 'videoLogs'), where('userId', '==', user.id), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { setLogs([]); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const formatTime = (ts: any) => {
    try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleString(); } catch { return ''; }
  };

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Video Logs</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : logs.length === 0 ? (
        <View style={styles.empty}>
          <Camera size={48} color={theme.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No video logs</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Security camera events will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.logItem, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <View style={[styles.logIcon, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
                <Video size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.logTitle, { color: theme.text }]}>{item.event || 'Motion detected'}</Text>
                <Text style={[styles.logDevice, { color: theme.textSecondary }]}>{item.deviceName || 'Camera'}</Text>
                <Text style={[styles.logTime, { color: theme.textSecondary }]}>{formatTime(item.timestamp)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.badgeText, { color: '#DC2626' }]}>Alert</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 100, gap: 10 },
  logItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, borderWidth: 1, gap: 12 },
  logIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  logDevice: { fontSize: 12, marginBottom: 2 },
  logTime: { fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
