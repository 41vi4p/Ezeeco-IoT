import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, User, Mail, Calendar, Shield, Trash2,
  Save, Home, Lock, LogOut, ExternalLink,
} from 'lucide-react-native';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { roomService, userService, Room } from '@/services/firestoreService';
import { validateName, sanitizeInput } from '@/utils/validation';
import { logUserAction } from '@/utils/activityLogger';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user, logout } = useAuth();

  // Account info
  const [name, setName]           = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving]       = useState(false);

  // Password
  const [currentPass, setCurrentPass]   = useState('');
  const [newPass, setNewPass]           = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [changing, setChanging]         = useState(false);

  // Rooms
  const [ownedRooms, setOwnedRooms]   = useState<Room[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms]       = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const headerGrad: [string, string, string] = isDark
    ? ['#0F0C3D', '#3B1E8B', '#1A0C4E']
    : ['#4F46E5', '#7C3AED', '#6D28D9'];

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    loadRooms();
  }, [user]);

  const loadRooms = async () => {
    if (!user) return;
    setLoadingRooms(true);
    try {
      const [all, owned, joined] = await Promise.all([
        roomService.getUserRooms(user.id),
        roomService.getUserOwnedRooms(user.id),
        roomService.getUserMemberRooms(user.id),
      ]);
      setAllRooms(all);
      setOwnedRooms(owned);
      setJoinedRooms(joined);
    } catch { /* silently fail */ }
    finally { setLoadingRooms(false); }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatTimestamp = (ts: any): string => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  // ── Save account info ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    const validation = validateName(name);
    if (!validation.isValid) { setNameError(validation.error || 'Invalid name'); return; }
    setNameError('');
    setSaving(true);
    try {
      await userService.updateUser(user.id, { name: sanitizeInput(name) });
      await logUserAction({ userId: user.id, userName: user.name, action: 'UPDATE_PROFILE', details: 'Updated account name', metadata: { fields: ['name'] } });
      Alert.alert('Saved', 'Your account information has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally { setSaving(false); }
  };

  // ── Change password ────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) { Alert.alert('Error', 'Fill all fields'); return; }
    if (newPass !== confirmPass) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (newPass.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    setChanging(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPass);
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (e: any) {
      Alert.alert('Error', e.code === 'auth/wrong-password' ? 'Current password is incorrect' : 'Failed to change password');
    } finally { setChanging(false); }
  };

  // ── Leave room ────────────────────────────────────────────────────────
  const handleLeaveRoom = (room: Room) => {
    Alert.alert(
      'Leave Room',
      `Are you sure you want to leave "${room.name}"? You will lose access to all devices in this room.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave', style: 'destructive',
          onPress: async () => {
            try {
              await roomService.removeMemberFromRoom(room.id, user!.id, user!.name, user!.id, user!.name);
              Alert.alert('Left room', `You have left "${room.name}".`);
              loadRooms();
            } catch {
              Alert.alert('Error', 'Failed to leave room. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ── Delete account ─────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all your devices, rooms, and data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever', style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await logUserAction({ userId: user.id, action: 'DELETE_ACCOUNT_ATTEMPT', details: 'User deleted account' });
              await userService.deleteUserAccount(user.id, true);
              logout();
            } catch {
              Alert.alert('Error', 'Could not delete account. Please re-login and try again.');
            }
          },
        },
      ]
    );
  };

  const cardBg     = isDark ? '#333333' : '#FFFFFF';
  const cardBorder = theme.cardBorder;
  const subText    = theme.textSecondary;
  const mainText   = theme.text;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings')} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Profile Picture ─────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.avatarGrad}>
                  <Text style={styles.avatarInitials}>{getUserInitials()}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: mainText }]}>{user?.name || 'User'}</Text>
              <Text style={[styles.profileSub, { color: subText }]}>
                {user?.photoURL ? 'Using Google profile picture' : 'Using default avatar'}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: isDark ? '#444444' : '#EEF2FF' }]}>
                <Text style={[styles.roleText, { color: theme.primary }]}>{user?.role || 'user'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Account Information ────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <User size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: mainText }]}>Account Information</Text>
          </View>

          <Text style={[styles.inputLabel, { color: subText }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#444444' : '#F9FAFB', color: mainText, borderColor: nameError ? '#EF4444' : cardBorder }]}
            value={name}
            onChangeText={t => { setName(t); setNameError(''); }}
            placeholder="Enter your full name"
            placeholderTextColor={subText}
          />
          {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}

          <Text style={[styles.inputLabel, { color: subText, marginTop: 14 }]}>Email Address</Text>
          <View style={[styles.input, styles.readOnlyInput, { backgroundColor: isDark ? '#1a1a30' : '#F3F4F6', borderColor: cardBorder }]}>
            <Mail size={14} color={subText} />
            <Text style={[styles.readOnlyText, { color: subText }]}>{user?.email}</Text>
            <View style={[styles.cantChangeBadge, { backgroundColor: isDark ? '#444444' : '#E5E7EB' }]}>
              <Text style={[styles.cantChangeText, { color: subText }]}>Cannot change</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { opacity: saving ? 0.7 : 1 }]}
          >
            <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
              {saving
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <><Save size={15} color="#FFFFFF" /><Text style={styles.saveBtnText}>Save Changes</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Account Details ────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Calendar size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: mainText }]}>Account Details</Text>
          </View>

          {[
            { label: 'Account Type', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User' },
            { label: 'Member Since', value: user ? formatTimestamp((user as any).createdAt) : '—' },
            { label: 'Devices', value: String(user?.deviceIds?.length ?? 0) },
            { label: 'Total Rooms', value: String(allRooms.length) },
          ].map((item, i) => (
            <View key={item.label} style={[styles.detailRow, i > 0 && { borderTopWidth: 1, borderTopColor: cardBorder }]}>
              <Text style={[styles.detailLabel, { color: subText }]}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: mainText }]}>{item.value}</Text>
            </View>
          ))}

          {/* Room breakdown */}
          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: cardBorder }]}>
            <Text style={[styles.detailLabel, { color: subText, paddingLeft: 14 }]}>↳ Owned</Text>
            <Text style={[styles.detailValue, { color: mainText }]}>{loadingRooms ? '…' : String(ownedRooms.length)}</Text>
          </View>
          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: cardBorder }]}>
            <Text style={[styles.detailLabel, { color: subText, paddingLeft: 14 }]}>↳ Joined</Text>
            <Text style={[styles.detailValue, { color: mainText }]}>{loadingRooms ? '…' : String(joinedRooms.length)}</Text>
          </View>
        </View>

        {/* ── Joined Rooms ───────────────────────────────────────────── */}
        {(joinedRooms.length > 0 || loadingRooms) && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <Home size={16} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: mainText }]}>Joined Rooms</Text>
            </View>

            {loadingRooms ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
            ) : joinedRooms.map((room, i) => {
              const member = room.members?.find(m => m.id === user?.id);
              return (
                <View key={room.id} style={[styles.roomRow, i > 0 && { borderTopWidth: 1, borderTopColor: cardBorder }]}>
                  <View style={styles.roomIconWrap}>
                    <LinearGradient colors={['#3B82F6', '#7C3AED']} style={styles.roomIconGrad}>
                      <Text style={styles.roomIconText}>
                        {room.icon || room.name.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roomName, { color: mainText }]}>{room.name}</Text>
                    <Text style={[styles.roomSub, { color: subText }]}>
                      {room.deviceIds?.length || 0} devices
                      {member?.joinedAt ? ` · Since ${formatTimestamp(member.joinedAt)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.roomActions}>
                    <TouchableOpacity
                      style={[styles.roomActionBtn, { borderColor: cardBorder }]}
                      onPress={() => router.push(`/room/${room.id}`)}
                    >
                      <ExternalLink size={13} color={theme.primary} />
                      <Text style={[styles.roomActionText, { color: theme.primary }]}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.roomActionBtn, { borderColor: '#EF4444' }]}
                      onPress={() => handleLeaveRoom(room)}
                    >
                      <LogOut size={13} color="#EF4444" />
                      <Text style={[styles.roomActionText, { color: '#EF4444' }]}>Leave</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Change Password ────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Lock size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: mainText }]}>Change Password</Text>
          </View>
          {[
            { label: 'Current Password', value: currentPass, set: setCurrentPass },
            { label: 'New Password',     value: newPass,     set: setNewPass     },
            { label: 'Confirm New Password', value: confirmPass, set: setConfirmPass },
          ].map(item => (
            <View key={item.label} style={{ marginBottom: 12 }}>
              <Text style={[styles.inputLabel, { color: subText }]}>{item.label}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#444444' : '#F9FAFB', color: mainText, borderColor: cardBorder }]}
                secureTextEntry
                value={item.value}
                onChangeText={item.set}
                placeholder="••••••••"
                placeholderTextColor={subText}
              />
            </View>
          ))}
          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={changing}
            style={[styles.saveBtn, { opacity: changing ? 0.7 : 1 }]}
          >
            <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
              {changing
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.saveBtnText}>Change Password</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Danger Zone ────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: '#EF444444' }]}>
          <View style={styles.sectionHeaderRow}>
            <Shield size={16} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          </View>
          <Text style={[styles.dangerDesc, { color: subText }]}>
            Once you delete your account, there is no going back. This will permanently remove all your devices, rooms, and associated data.
          </Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  content: { padding: 16, paddingBottom: 100, gap: 14 },
  card: { borderRadius: 18, padding: 20, borderWidth: 1 },

  // profile
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden' },
  avatarImg:  { width: 72, height: 72, borderRadius: 36 },
  avatarGrad: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  profileName: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  profileSub:  { fontSize: 12, marginBottom: 8 },
  roleBadge:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  roleText:    { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  // section
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },

  // inputs
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input:       { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  fieldError:  { color: '#EF4444', fontSize: 12, marginTop: 4 },
  readOnlyInput: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  readOnlyText:  { flex: 1, fontSize: 14 },
  cantChangeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cantChangeText:  { fontSize: 10, fontWeight: '600' },

  // save button
  saveBtn:     { borderRadius: 12, overflow: 'hidden', marginTop: 16 },
  saveBtnGrad: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // account details
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '700' },

  // joined rooms
  roomRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  roomIconWrap: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  roomIconGrad: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  roomIconText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  roomName:    { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  roomSub:     { fontSize: 11 },
  roomActions: { flexDirection: 'row', gap: 6 },
  roomActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  roomActionText: { fontSize: 11, fontWeight: '600' },

  // danger zone
  dangerDesc:  { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  deleteBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, borderWidth: 1, borderColor: '#EF4444', justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
