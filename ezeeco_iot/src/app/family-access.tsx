import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, Modal, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Users, UserPlus, UserMinus, Crown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { roomService } from '@/services/firestoreService';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function FamilyAccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();
  const { rooms } = useStore();
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const combined: any[] = [];
    rooms.forEach(room => {
      (room.members || []).forEach(member => {
        if (member.userId !== user?.id && !combined.find(m => m.userId === member.userId)) {
          combined.push({ ...member, roomName: room.name, roomId: room.id });
        }
      });
    });
    setAllMembers(combined);
    setLoading(false);
  }, [rooms, user]);

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Family Access</Text>
        </View>
        <Text style={styles.headerSub}>People who have access to your rooms</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : allMembers.length === 0 ? (
        <View style={styles.empty}>
          <Users size={48} color={theme.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No family members yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Share room join codes to invite family members</Text>
        </View>
      ) : (
        <FlatList
          data={allMembers}
          keyExtractor={item => item.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.memberCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <View style={[styles.avatar, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
                <Text style={[styles.avatarText, { color: theme.textSecondary }]}>{item.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>{item.email}</Text>
                <Text style={[styles.memberRoom, { color: theme.primary }]}>Room: {item.roomName}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: item.role === 'owner' ? '#7C3AED20' : (isDark ? '#444444' : '#F3F4F6') }]}>
                <Text style={[styles.roleText, { color: item.role === 'owner' ? '#7C3AED' : theme.textSecondary }]}>{item.role}</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  list: { padding: 16, paddingBottom: 100, gap: 10 },
  memberCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  memberName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  memberEmail: { fontSize: 11, marginBottom: 2 },
  memberRoom: { fontSize: 11, fontWeight: '600' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
