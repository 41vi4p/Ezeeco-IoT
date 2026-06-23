import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Clock, Zap, User } from 'lucide-react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

interface LogEntry { id: string; action: string; userId: string; userName: string; entityId: string; entityName: string; timestamp: any; type: string; }

export default function RoomLogsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const q = query(
          collection(firestore, 'activityLogs'),
          where('roomId', '==', id),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as LogEntry)));
      } catch { setLogs([]); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const formatTime = (ts: any) => {
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleString();
    } catch { return 'Unknown time'; }
  };

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Room Activity Logs</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : logs.length === 0 ? (
        <View style={styles.empty}>
          <Clock size={48} color={theme.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No activity logs yet</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.logItem, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <View style={[styles.logIcon, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
                {item.type === 'device_control' ? <Zap size={16} color={theme.primary} /> : <User size={16} color={theme.textSecondary} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.logAction, { color: theme.text }]}>{item.action}</Text>
                <Text style={[styles.logMeta, { color: theme.textSecondary }]}>{item.userName} · {formatTime(item.timestamp)}</Text>
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
  logIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logAction: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  logMeta: { fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14 },
});
