import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, ScrollView, KeyboardAvoidingView, Platform, StatusBar,
  Dimensions, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Eye, EyeOff, Lock, Mail, AlertCircle,
  Sun, Moon, Shield, Key, Smartphone, Zap, UserCircle, Wifi, BellRing,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import SmartHomeIcon from '@/components/SmartHomeIcon';

const { width, height } = Dimensions.get('window');

// ── Floating icon ──────────────────────────────────────────────────────────
const ICONS = [
  { Icon: Shield,     color: '#818CF8', x: 0.07, y: 0.14, size: 20, delay: 0   },
  { Icon: Wifi,       color: '#38BDF8', x: 0.85, y: 0.20, size: 18, delay: 500 },
  { Icon: Key,        color: '#F59E0B', x: 0.10, y: 0.62, size: 18, delay: 900 },
  { Icon: Zap,        color: '#EF4444', x: 0.88, y: 0.55, size: 20, delay: 300 },
  { Icon: Smartphone, color: '#10B981', x: 0.84, y: 0.80, size: 18, delay: 700 },
  { Icon: UserCircle, color: '#EC4899', x: 0.06, y: 0.83, size: 20, delay: 400 },
  { Icon: BellRing,   color: '#A78BFA', x: 0.88, y: 0.38, size: 17, delay: 1100},
];

function FloatingIcon({ Icon, color, x, y, size, delay }: {
  Icon: any; color: string; x: number; y: number; size: number; delay: number;
}) {
  const floatY  = useRef(new Animated.Value(0)).current;
  const floatX  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 0.82, duration: 900, delay, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2100 + delay % 600, useNativeDriver: true, isInteraction: false }),
        Animated.timing(floatY, { toValue: 10,  duration: 2100 + delay % 600, useNativeDriver: true, isInteraction: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatX, { toValue: 6,  duration: 2700 + delay % 500, useNativeDriver: true, isInteraction: false }),
        Animated.timing(floatX, { toValue: -6, duration: 2700 + delay % 500, useNativeDriver: true, isInteraction: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingIcon,
        { left: x * width, top: y * height, opacity, transform: [{ translateY: floatY }, { translateX: floatX }] },
      ]}
    >
      <View style={[styles.floatingIconBg, { borderColor: color + '50' }]}>
        <Icon size={size} color={color} />
      </View>
    </Animated.View>
  );
}

// ── Background blob ────────────────────────────────────────────────────────
function BackgroundBlob({ x, y, color, size, delay }: {
  x: number; y: number; color: string; size: number; delay: number;
}) {
  const pulse = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.55, duration: 3200 + delay, useNativeDriver: true, isInteraction: false }),
        Animated.timing(pulse, { toValue: 0.25, duration: 3200 + delay, useNativeDriver: true, isInteraction: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x * width - size / 2,
        top:  y * height - size / 2,
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: pulse,
      }}
    />
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, isLoading, user } = useAuth();
  const { darkMode, setDarkMode } = useStore();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [authError, setAuthError]     = useState<string | null>(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;

  const darkGrad:  [string, string, string] = ['#0F0C3D', '#3B1E8B', '#1A0C4E'];
  const lightGrad: [string, string, string] = ['#4F46E5', '#7C3AED', '#6D28D9'];
  const gradientColors = darkMode ? darkGrad : lightGrad;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && !isLoading) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading, user]);

  const handleLogin = async () => {
    if (!email.trim() || !password) { setAuthError('Please fill in all fields'); return; }
    setLocalLoading(true);
    setAuthError(null);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      setAuthError(error.message || 'Login failed. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      setAuthError(error.message || 'Google login failed.');
    } finally {
      setLocalLoading(false);
    }
  };

  const cardBg        = darkMode ? 'rgba(15,12,60,0.82)' : 'rgba(255,255,255,0.18)';
  const inputBg       = darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.22)';
  const inputBorder   = darkMode ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.35)';
  const inputText     = '#FFFFFF';
  const placeholderColor = 'rgba(255,255,255,0.5)';

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Blobs */}
      <BackgroundBlob x={0.2}  y={0.15} color="#7C3AED" size={200} delay={0}   />
      <BackgroundBlob x={0.85} y={0.30} color="#4F46E5" size={150} delay={600} />
      <BackgroundBlob x={0.55} y={0.72} color="#6366F1" size={170} delay={1100}/>
      <BackgroundBlob x={0.08} y={0.88} color="#7C3AED" size={120} delay={350} />

      {/* Floating icons */}
      {ICONS.map((item, i) => <FloatingIcon key={i} {...item} />)}

      {/* Theme toggle */}
      <View style={styles.themeToggleContainer}>
        <View style={[
          styles.themeToggleWrap,
          {
            backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)',
            borderColor:     darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.40)',
          },
        ]}>
          <Sun size={14} color="#F59E0B" />
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#38BDF8', true: '#4338CA' }}
            thumbColor="#FFFFFF"
            style={styles.switchEl}
          />
          <Moon size={14} color="#818CF8" />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/welcome')}
              style={styles.backBtn}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoWrap}>
                <SmartHomeIcon size={44} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to access your IoT platform</Text>
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.decorTopRight} />
              <View style={styles.decorBottomLeft} />

              {authError && (
                <View style={styles.errorBox}>
                  <AlertCircle size={15} color="#FCA5A5" />
                  <Text style={styles.errorText}>{authError}</Text>
                </View>
              )}

              {/* Email */}
              <View style={styles.inputWrap}>
                <Mail size={15} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputText }]}
                  placeholder="Email"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrap}>
                <Lock size={15} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputText, paddingRight: 46 }]}
                  placeholder="Password"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPassword
                    ? <EyeOff size={15} color={placeholderColor} />
                    : <Eye    size={15} color={placeholderColor} />
                  }
                </TouchableOpacity>
              </View>

              {/* Sign In */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={localLoading || isLoading}
                style={[styles.primaryBtnWrap, { opacity: localLoading || isLoading ? 0.75 : 1 }]}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGrad}>
                  <Text style={styles.primaryBtnText}>
                    {localLoading ? 'Signing in…' : 'Sign in'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
              </View>

              {/* Google */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={localLoading}
                style={[styles.googleBtn, { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.08)' }]}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>G</Text>
                <Text style={styles.googleBtnText}>Sign in with Google</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up */}
            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>Don't have an account?{' '}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.signUpLink}>Sign up</Text>
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

  // blobs / floating
  floatingIcon: { position: 'absolute', zIndex: 1 },
  floatingIconBg: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // theme toggle — absolutely positioned top-right
  themeToggleContainer: { position: 'absolute', top: 56, right: 16, zIndex: 20 },
  themeToggleWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 30, borderWidth: 1,
  },
  switchEl: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },

  // scroll / layout
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  topBar: { paddingTop: 52, marginBottom: 16, zIndex: 10 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  content: { alignItems: 'center', maxWidth: 400, alignSelf: 'center', width: '100%', zIndex: 5 },

  // logo
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  title:    { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.72)', textAlign: 'center' },

  // card
  card: {
    width: '100%', borderRadius: 22, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden', position: 'relative', marginBottom: 20,
  },
  decorTopRight:  { position: 'absolute', top: -5,  right: -5,  width: 16, height: 16, borderRadius: 8, backgroundColor: '#22D3EE' },
  decorBottomLeft:{ position: 'absolute', bottom: -4, left: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#A78BFA' },

  // error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10, padding: 10, marginBottom: 14,
  },
  errorText: { color: '#FCA5A5', fontSize: 13, flex: 1 },

  // inputs
  inputWrap: { marginBottom: 14, position: 'relative' },
  inputIcon: { position: 'absolute', left: 13, top: 14, zIndex: 1 },
  input: {
    borderWidth: 1, borderRadius: 13,
    paddingLeft: 40, paddingRight: 14, paddingVertical: 13,
    fontSize: 15,
  },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },

  // sign in button
  primaryBtnWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  primaryBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },

  // google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 13, borderWidth: 1,
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  // sign up row
  signUpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  signUpText: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  signUpLink: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textDecorationLine: 'underline' },
});
