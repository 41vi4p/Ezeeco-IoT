import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Clock, Zap, User, LogIn, LogOut, Settings } from 'lucide-react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

const getIcon = (type: string, color: string) => {
  switch (type) {
    case 'device_control': return <Zap size={16} color={color} />;
    case 'login': return <LogIn size={16} color={color} />;
    case 'logout': return <LogOut size={16} color={color} />;
    case 'settings': return <Settings size={16} color={color} />;
    default: return <User size={16} color={color} />;
  }
};

export default function LogsScreen() {
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
        const q = query(collection(firestore, 'activityLogs'), where('userId', '==', user.id), orderBy('timestamp', 'desc'), limit(100));
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
          <Text style={styles.headerTitle}>Activity Logs</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : logs.length === 0 ? (
        <View style={styles.empty}>
          <Clock size={48} color={theme.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No activity yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your actions will be logged here</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.logItem, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <View style={[styles.logIcon, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
                {getIcon(item.type, theme.primary)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.logAction, { color: theme.text }]}>{item.action}</Text>
                {item.entityName && <Text style={[styles.logEntity, { color: theme.primary }]}>{item.entityName}</Text>}
                <Text style={[styles.logTime, { color: theme.textSecondary }]}>{formatTime(item.timestamp)}</Text>
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
  logItem: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, padding: 14, borderWidth: 1, gap: 12 },
  logIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logAction: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  logEntity: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  logTime: { fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14 },
});
