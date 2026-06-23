import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, UserMinus, Crown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { roomService } from '@/services/firestoreService';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function RoomMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState('Room');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const room = await roomService.getRoom(id as string);
        if (room) { setMembers(room.members || []); setRoomName(room.name); }
      } catch { Alert.alert('Error', 'Could not load members'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleRemoveMember = async (memberId: string) => {
    if (!user) return;
    Alert.alert('Remove Member', 'Remove this member from the room?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await roomService.removeMember(id as string, memberId, user.id);
            setMembers(prev => prev.filter(m => m.userId !== memberId));
          } catch { Alert.alert('Error', 'Could not remove member'); }
        },
      },
    ]);
  };

  const isOwner = members.find(m => m.userId === user?.id)?.role === 'owner';
  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Members</Text>
            <Text style={styles.headerSub}>{roomName}</Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {members.map((member, i) => (
            <View key={member.userId ?? member.id ?? member.email ?? i} style={[styles.memberRow, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
              <View style={[styles.avatar, { backgroundColor: member.role === 'owner' ? '#7C3AED' : (isDark ? '#444444' : '#F3F4F6') }]}>
                <Text style={[styles.avatarText, { color: member.role === 'owner' ? '#FFFFFF' : theme.textSecondary }]}>
                  {member.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.memberName, { color: theme.text }]}>{member.name || 'Unknown'}</Text>
                  {member.role === 'owner' && <Crown size={14} color="#F59E0B" />}
                </View>
                <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>{member.email}</Text>
                <Text style={[styles.memberRole, { color: member.role === 'owner' ? '#7C3AED' : theme.textSecondary }]}>
                  {member.role}
                </Text>
              </View>
              {isOwner && member.userId !== user?.id && member.role !== 'owner' && (
                <TouchableOpacity onPress={() => handleRemoveMember(member.userId)} style={styles.removeBtn}>
                  <UserMinus size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
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
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { padding: 16, paddingBottom: 100, gap: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  memberName: { fontSize: 15, fontWeight: '700' },
  memberEmail: { fontSize: 12, marginBottom: 2 },
  memberRole: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  removeBtn: { padding: 8 },
});
