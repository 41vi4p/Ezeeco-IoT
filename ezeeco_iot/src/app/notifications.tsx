import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Bell, AlertCircle, CheckCircle, Info, AlertTriangle, Trash2 } from 'lucide-react-native';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

const typeConfig = {
  alert: { icon: AlertCircle, color: '#EF4444', bg: '#FEE2E2' },
  warning: { icon: AlertTriangle, color: '#F59E0B', bg: '#FEF3C7' },
  success: { icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
  info: { icon: Info, color: '#3B82F6', bg: '#DBEAFE' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const isDarkBg = (bgLight: string) => isDark ? `${bgLight}33` : bgLight;
  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  const formatTime = (date: Date) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      const diff = Date.now() - d.getTime();
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return d.toLocaleDateString();
    } catch { return ''; }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {notifications.some(n => !n.read) && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.readAllBtn}>
              <Text style={styles.readAllText}>Read All</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Bell size={48} color={theme.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No notifications</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const cfg = typeConfig[item.type] || typeConfig.info;
            const Icon = cfg.icon;
            return (
              <TouchableOpacity
                style={[styles.notifItem, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder, opacity: item.read ? 0.7 : 1 }]}
                onPress={() => markAsRead(item.id)}
              >
                <View style={[styles.notifIcon, { backgroundColor: isDark ? cfg.color + '33' : cfg.bg }]}>
                  <Icon size={18} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifTitleRow}>
                    <Text style={[styles.notifTitle, { color: theme.text }]}>{item.title}</Text>
                    {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                  </View>
                  <Text style={[styles.notifMsg, { color: theme.textSecondary }]} numberOfLines={2}>{item.message}</Text>
                  <Text style={[styles.notifTime, { color: theme.textSecondary }]}>{formatTime(item.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteNotification(item.id)} style={styles.deleteBtn}>
                  <Trash2 size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  readAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  readAllText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100, gap: 10 },
  notifItem: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifMsg: { fontSize: 12, lineHeight: 17, marginBottom: 4 },
  notifTime: { fontSize: 11 },
  deleteBtn: { padding: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14 },
});
