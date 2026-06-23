import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, AlertCircle, Sun, Moon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import SmartHomeIcon from '@/components/SmartHomeIcon';

export default function RegisterScreen() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading, user } = useAuth();
  const { darkMode, setDarkMode } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const darkGrad: [string, string, string] = ['#1E1B4B', '#4C1D95', '#1E1B4B'];
  const lightGrad: [string, string, string] = ['#60A5FA', '#38BDF8', '#6366F1'];
  const gradientColors = darkMode ? darkGrad : lightGrad;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && !isLoading) router.replace('/(auth)/onboarding');
  }, [isAuthenticated, isLoading, user]);

  const handleSignup = async () => {
    setError(null);
    if (!name.trim()) { setError('Name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLocalLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLocalLoading(false);
    }
  };

  const cardBg = darkMode ? 'rgba(30,27,75,0.85)' : 'rgba(255,255,255,0.94)';
  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)';
  const inputBorder = darkMode ? 'rgba(255,255,255,0.15)' : '#D1D5DB';
  const inputText = darkMode ? '#FFFFFF' : '#111827';
  const placeholder = darkMode ? 'rgba(255,255,255,0.4)' : '#9CA3AF';

  const Field = ({ icon: Icon, placeholder: ph, value, onChangeText, secureTextEntry, showToggle, onToggle, keyboardType = 'default', autoCapitalize = 'sentences' }: any) => (
    <View style={styles.inputWrap}>
      <Icon size={16} color={placeholder} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputText, paddingRight: showToggle ? 44 : 12 }]}
        placeholder={ph}
        placeholderTextColor={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
          {secureTextEntry ? <Eye size={16} color={placeholder} /> : <EyeOff size={16} color={placeholder} />}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDarkMode(!darkMode)} style={[styles.themeToggle, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              {darkMode ? <Moon size={14} color="#FFFFFF" /> : <Sun size={14} color="#F59E0B" />}
              <Text style={styles.themeText}>{darkMode ? 'Dark' : 'Light'}</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoSection}>
              <View style={styles.logoWrap}>
                <SmartHomeIcon size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the IoT management platform</Text>
            </View>

            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.decorTop} />
              <View style={styles.decorBottom} />

              {error && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color="#F87171" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Field icon={User} placeholder="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
              <Field icon={Mail} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Field icon={Lock} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)} />
              <Field icon={Lock} placeholder="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm} showToggle onToggle={() => setShowConfirm(!showConfirm)} />

              <TouchableOpacity onPress={handleSignup} disabled={localLoading} style={styles.primaryBtnWrap} activeOpacity={0.85}>
                <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGrad}>
                  <Text style={styles.primaryBtnText}>{localLoading ? 'Creating Account...' : 'Create Account'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.signInRow}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, marginBottom: 24 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  themeToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  themeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  content: { alignItems: 'center', maxWidth: 400, alignSelf: 'center', width: '100%' },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  card: { width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', position: 'relative', marginBottom: 16 },
  decorTop: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22D3EE' },
  decorBottom: { position: 'absolute', bottom: -3, left: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: '#A78BFA' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 10, padding: 10, marginBottom: 14 },
  errorText: { color: '#F87171', fontSize: 13, flex: 1 },
  inputWrap: { marginBottom: 14, position: 'relative' },
  inputIcon: { position: 'absolute', left: 12, top: 14, zIndex: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingLeft: 38, paddingVertical: 12, fontSize: 15 },
  eyeBtn: { position: 'absolute', right: 12, top: 14 },
  primaryBtnWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  primaryBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  signInRow: { flexDirection: 'row', alignItems: 'center' },
  signInText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  signInLink: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textDecorationLine: 'underline' },
});
