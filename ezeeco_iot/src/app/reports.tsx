import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, BarChart2, Zap, Clock, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();
  const { devices, rooms } = useStore();

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const offlineDevices = devices.length - onlineDevices;

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
        <Text style={styles.headerSub}>Energy & Device Usage</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard icon={Zap} label="Total Devices" value={devices.length} color="#6366F1" />
          <StatCard icon={TrendingUp} label="Online" value={onlineDevices} color="#10B981" />
          <StatCard icon={Clock} label="Offline" value={offlineDevices} color="#EF4444" />
          <StatCard icon={BarChart2} label="Rooms" value={rooms.length} color="#F59E0B" />
        </View>

        <View style={[styles.chartCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Device Activity</Text>
          <View style={styles.chartPlaceholder}>
            <BarChart2 size={48} color={theme.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.chartPlaceholderText, { color: theme.textSecondary }]}>
              Activity charts coming soon
            </Text>
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Rooms Overview</Text>
          {rooms.map(room => (
            <View key={room.id} style={[styles.roomRow, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.roomName, { color: theme.text }]}>{room.name}</Text>
              <Text style={[styles.roomMembers, { color: theme.textSecondary }]}>{room.members?.length || 0} members</Text>
            </View>
          ))}
          {rooms.length === 0 && <Text style={[styles.chartPlaceholderText, { color: theme.textSecondary }]}>No rooms yet</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  content: { padding: 16, paddingBottom: 100, gap: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'flex-start' },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  chartCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  chartPlaceholder: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  chartPlaceholderText: { fontSize: 14, textAlign: 'center' },
  roomRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  roomName: { fontSize: 14, fontWeight: '600' },
  roomMembers: { fontSize: 12 },
});
