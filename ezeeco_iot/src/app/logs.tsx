import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, Clock, Zap, User, LogIn, LogOut, Settings,
  Home, Shield, Smartphone, AlertTriangle, Plus, Trash2, Edit3, RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { getActivityLogs, formatLogTimestamp, ActivityLog } from '@/utils/activityLogger';

type Category = 'ALL' | 'DEVICE' | 'ROOM' | 'USER' | 'SECURITY' | 'SYSTEM';

const FILTERS: { label: string; value: Category }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Device', value: 'DEVICE' },
  { label: 'Room', value: 'ROOM' },
  { label: 'User', value: 'USER' },
  { label: 'Security', value: 'SECURITY' },
  { label: 'System', value: 'SYSTEM' },
];

const CATEGORY_COLORS: Record<Category, string> = {
  ALL: '#6366F1',
  DEVICE: '#3B82F6',
  ROOM: '#10B981',
  USER: '#8B5CF6',
  SECURITY: '#EF4444',
  SYSTEM: '#F59E0B',
};

function getActionIcon(action: string, color: string) {
  if (action.includes('LOGIN')) return <LogIn size={15} color={color} />;
  if (action.includes('LOGOUT')) return <LogOut size={15} color={color} />;
  if (action.includes('REGISTER')) return <User size={15} color={color} />;
  if (action.includes('PROFILE') || action.includes('UPDATE')) return <Edit3 size={15} color={color} />;
  if (action.includes('TOGGLE') || action.includes('CONTROL')) return <Zap size={15} color={color} />;
  if (action.includes('CREATE') || action.includes('ADDED') || action.includes('ADD')) return <Plus size={15} color={color} />;
  if (action.includes('DELETE') || action.includes('REMOVED') || action.includes('REMOVE')) return <Trash2 size={15} color={color} />;
  if (action.includes('ROOM')) return <Home size={15} color={color} />;
  if (action.includes('SECURITY') || action.includes('FAILED') || action.includes('SUSPICIOUS')) return <AlertTriangle size={15} color={color} />;
  if (action.includes('DEVICE')) return <Smartphone size={15} color={color} />;
  if (action.includes('SETTING')) return <Settings size={15} color={color} />;
  return <RefreshCw size={15} color={color} />;
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export default function LogsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Category>('ALL');
  const [pageSize] = useState(50);
  const [hasMore, setHasMore] = useState(true);

  const headerGrad: [string, string, string] = isDark
    ? ['#1E1B4B', '#4C1D95', '#1E1B4B']
    : ['#60A5FA', '#38BDF8', '#6366F1'];

  const loadLogs = useCallback(async (category: Category, isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const fetched = await getActivityLogs(
        user.id,
        pageSize,
        category === 'ALL' ? undefined : category,
      );
      setLogs(fetched);
      setHasMore(fetched.length === pageSize);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, pageSize]);

  useEffect(() => {
    loadLogs(activeFilter);
  }, [activeFilter]);

  const onRefresh = () => loadLogs(activeFilter, true);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore || loadingMore || logs.length === 0) return;
    setLoadingMore(true);
    try {
      const fetched = await getActivityLogs(
        user.id,
        pageSize * 2,
        activeFilter === 'ALL' ? undefined : activeFilter,
      );
      setLogs(fetched);
      setHasMore(fetched.length > logs.length);
    } catch {}
    finally { setLoadingMore(false); }
  }, [user, hasMore, loadingMore, logs.length, activeFilter, pageSize]);

  const categoryColor = CATEGORY_COLORS[activeFilter];

  const renderItem = ({ item }: { item: ActivityLog }) => {
    const color = CATEGORY_COLORS[(item.category as Category) ?? 'SYSTEM'];
    return (
      <View style={[styles.logItem, {
        backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
        borderColor: theme.cardBorder,
      }]}>
        <View style={[styles.logIconWrap, { backgroundColor: color + '20' }]}>
          {getActionIcon(item.action, color)}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.logTopRow}>
            <Text style={[styles.logAction, { color: theme.text }]} numberOfLines={1}>
              {formatAction(item.action)}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color }]}>{item.category}</Text>
            </View>
          </View>
          {item.details ? (
            <Text style={[styles.logDetails, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.details}
            </Text>
          ) : null}
          <Text style={[styles.logTime, { color: theme.textSecondary }]}>
            {formatLogTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={headerGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Activity Logs</Text>
            <Text style={styles.headerSub}>{logs.length} entries</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { borderBottomColor: theme.cardBorder }]}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => {
          const isActive = activeFilter === f.value;
          const color = CATEGORY_COLORS[f.value];
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setActiveFilter(f.value)}
              style={[
                styles.filterChip,
                isActive
                  ? { backgroundColor: color, borderColor: color }
                  : { backgroundColor: 'transparent', borderColor: isDark ? '#444' : '#E5E7EB' },
              ]}
            >
              <Text style={[styles.filterLabel, { color: isActive ? '#FFFFFF' : theme.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={categoryColor} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading logs…</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.center}>
          <Clock size={52} color={theme.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No activity yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {activeFilter === 'ALL'
              ? 'Your actions will appear here'
              : `No ${activeFilter.toLowerCase()} activity found`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id ?? Math.random().toString()}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={categoryColor} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator size="small" color={categoryColor} style={{ marginVertical: 16 }} />
              : hasMore
              ? null
              : <Text style={[styles.endText, { color: theme.textSecondary }]}>— end of logs —</Text>
          }
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
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  filterBar: { maxHeight: 56, borderBottomWidth: 1 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 12, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100, gap: 10 },
  logItem: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  logIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  logTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  logAction: { fontSize: 13, fontWeight: '700', flex: 1 },
  categoryBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  categoryBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  logDetails: { fontSize: 12, lineHeight: 17 },
  logTime: { fontSize: 11 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  loadingText: { fontSize: 13, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  endText: { fontSize: 11, textAlign: 'center', paddingVertical: 20 },
});
