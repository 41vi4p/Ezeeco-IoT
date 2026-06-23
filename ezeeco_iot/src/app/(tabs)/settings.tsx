import React from 'react';
import Constants from 'expo-constants';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Image } from 'react-native';
import { useResponsive } from '@/hooks/use-responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User, Moon, Shield, Info, HelpCircle, LogOut, ChevronRight, Clock, Sun,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user, logout, updateTheme } = useAuth();
  const { darkMode, setDarkMode } = useStore();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const { hPad, contentW } = useResponsive();

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    updateTheme(next ? 'dark' : 'light').catch(() => {});
  };

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  const SettingRow = ({ icon: Icon, label, onPress, isSwitch, switchValue, onSwitchChange, danger }: any) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.cardBorder }]}
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? '#FEE2E2' : (isDark ? '#444444' : '#F3F4F6') }]}>
        <Icon size={18} color={danger ? '#EF4444' : theme.textSecondary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? '#EF4444' : theme.text }]}>{label}</Text>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#818CF8' }}
          thumbColor={switchValue ? '#FFFFFF' : '#F9FAFB'}
        />
      ) : (
        <ChevronRight size={18} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: hPad }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: contentW, alignSelf: 'center', width: '100%' }}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <View style={styles.avatarWrap}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.avatarGrad}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>{user?.email || ''}</Text>
            <Text style={[styles.profileRole, { color: theme.primary }]}>{user?.role || 'user'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}
            onPress={() => router.push('/profile-edit')}
          >
            <Text style={[styles.editBtnText, { color: theme.text }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Appearance</Text>
          <SettingRow icon={darkMode ? Moon : Sun} label="Dark Mode" isSwitch switchValue={darkMode} onSwitchChange={toggleDark} />
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account</Text>
          <SettingRow icon={User} label="Account Settings" onPress={() => router.push('/account-settings')} />
<SettingRow icon={Shield} label="Privacy & Security" onPress={() => router.push('/privacy-security')} />
          <SettingRow icon={Clock} label="Activity Logs" onPress={() => router.push('/logs')} />
        </View>

        {/* App */}
        <View style={[styles.section, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>App</Text>
<SettingRow icon={HelpCircle} label="Help & Support" onPress={() => router.push('/help-support')} />
          <SettingRow icon={Info} label="About" onPress={() => router.push('/about')} />
        </View>

        {/* Logout */}
        <View style={[styles.section, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <SettingRow icon={LogOut} label="Logout" onPress={logout} danger />
        </View>

        <View style={styles.versionWrap}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>Ezeeco IoT v{Constants.expoConfig?.version ?? '—'}</Text>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>Powered by Project Cell CRCE</Text>
        </View>
        </View>{/* end contentCap */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  content: { paddingTop: 16, paddingBottom: 140 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  avatarWrap: { marginRight: 14 },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarGrad: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  profileEmail: { fontSize: 12, marginBottom: 2 },
  profileRole: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 13, fontWeight: '600' },
  section: { borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  versionWrap: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  versionText: { fontSize: 11 },
});
