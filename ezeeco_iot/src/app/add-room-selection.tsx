import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, KeyRound } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function AddRoomSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Add Room</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>How would you like to add a room?</Text>

        <TouchableOpacity style={[styles.optionCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]} onPress={() => router.push('/add-room')}>
          <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.optionIcon}>
            <Plus size={28} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>Create New Room</Text>
            <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>Set up a new room and add your devices to it</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]} onPress={() => router.push('/rooms')}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.optionIcon}>
            <KeyRound size={28} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>Join Existing Room</Text>
            <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>Enter a join code to join someone else's room</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  content: { padding: 20, gap: 16, flex: 1, justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, borderWidth: 1 },
  optionIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  optionDesc: { fontSize: 13, lineHeight: 18 },
});
