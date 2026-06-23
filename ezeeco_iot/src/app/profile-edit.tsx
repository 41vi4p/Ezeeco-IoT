import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function ProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !auth.currentUser) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      Alert.alert('Success', 'Profile updated successfully');
      router.canGoBack() ? router.back() : router.replace('/(tabs)/settings');
    } catch { Alert.alert('Error', 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
            <Camera size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Display Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#333333' : '#FFFFFF', color: theme.text, borderColor: theme.cardBorder }]}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.textSecondary}
        />

        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
        <View style={[styles.input, styles.disabledInput, { backgroundColor: isDark ? '#333333' : '#F9FAFB', borderColor: theme.cardBorder }]}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{user?.email}</Text>
        </View>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>Email cannot be changed here</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!name.trim() || saving}
          style={{ borderRadius: 14, overflow: 'hidden', marginTop: 24, opacity: !name.trim() || saving ? 0.6 : 1 }}
        >
          <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  cameraBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: -16, marginLeft: 56 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  disabledInput: { justifyContent: 'center' },
  hint: { fontSize: 11, marginTop: 4 },
  saveBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
