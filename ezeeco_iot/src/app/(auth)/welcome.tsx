import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
  StatusBar, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, ArrowUpRight, Sun, Moon,
  Thermometer, Camera, Wifi, Lock, Lightbulb, Cpu, BellRing, Home,
} from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import SmartHomeIcon from '@/components/SmartHomeIcon';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const ICONS = [
  { Icon: Thermometer, color: '#EF4444', x: 0.08, y: 0.17, size: 22, delay: 0 },
  { Icon: Camera,      color: '#818CF8', x: 0.84, y: 0.26, size: 20, delay: 600 },
  { Icon: Wifi,        color: '#38BDF8', x: 0.82, y: 0.73, size: 22, delay: 1200 },
  { Icon: Lock,        color: '#10B981', x: 0.86, y: 0.87, size: 18, delay: 400 },
  { Icon: Cpu,         color: '#A78BFA', x: 0.06, y: 0.76, size: 20, delay: 800 },
  { Icon: Lightbulb,   color: '#F59E0B', x: 0.88, y: 0.46, size: 18, delay: 200 },
  { Icon: BellRing,    color: '#EC4899', x: 0.04, y: 0.53, size: 18, delay: 1000 },
];

function FloatingIcon({ Icon, color, x, y, size, delay }: {
  Icon: any; color: string; x: number; y: number; size: number; delay: number;
}) {
  const floatY = useRef(new Animated.Value(0)).current;
  const floatX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 0.85, duration: 800, delay, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2000 + delay % 700, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 10,  duration: 2000 + delay % 700, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatX, { toValue: 5,  duration: 2800 + delay % 500, useNativeDriver: true }),
        Animated.timing(floatX, { toValue: -5, duration: 2800 + delay % 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingIcon,
        {
          left: x * width,
          top: y * height,
          opacity,
          transform: [{ translateY: floatY }, { translateX: floatX }],
        },
      ]}
    >
      <View style={[styles.floatingIconBg, { borderColor: color + '40' }]}>
        <Icon size={size} color={color} />
      </View>
    </Animated.View>
  );
}

function BackgroundBlob({ x, y, color, size, delay }: {
  x: number; y: number; color: string; size: number; delay: number;
}) {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.6, duration: 3000 + delay, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 3000 + delay, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * width - size / 2,
        top: y * height - size / 2,
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: pulse,
      }}
    />
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { darkMode, setDarkMode } = useStore();
  const { isAuthenticated, isLoading } = useAuth();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const dark: [string, string, string]  = ['#1E1B4B', '#4C1D95', '#1E1B4B'];
  const light: [string, string, string] = ['#3B82F6', '#7C3AED', '#4F46E5'];
  const gradientColors = darkMode ? dark : light;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading]);

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background blobs */}
      <BackgroundBlob x={0.15} y={0.2}  color="#7C3AED" size={180} delay={0} />
      <BackgroundBlob x={0.85} y={0.35} color="#4F46E5" size={140} delay={500} />
      <BackgroundBlob x={0.5}  y={0.7}  color="#6366F1" size={160} delay={1000} />
      <BackgroundBlob x={0.1}  y={0.85} color="#7C3AED" size={120} delay={300} />

      {/* Floating device icons */}
      {ICONS.map((item, i) => <FloatingIcon key={i} {...item} />)}

      {/* Theme toggle — top right */}
      <View style={styles.topBar}>
        <View style={[styles.themeToggleWrap, { backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)', borderColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)' }]}>
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

      {/* Main content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrap}>
            <SmartHomeIcon size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>IoT Device{'\n'}Management Platform</Text>
          <Text style={styles.subtitle}>
            Connect, control, and monitor any IoT device from a single platform. Build custom integrations and manage your entire device ecosystem.
          </Text>
        </View>

        {/* Glass card */}
        <View style={[styles.card, { backgroundColor: darkMode ? 'rgba(15,12,60,0.75)' : 'rgba(255,255,255,0.18)' }]}>
          <View style={styles.decorTopRight} />
          <View style={styles.decorBottomLeft} />

          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.85}>
            <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnInner}>
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(15,12,60,0.65)', borderColor: 'rgba(255,255,255,0.25)' }]}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Create New Account</Text>
            <ArrowUpRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Powered by Project Cell CRCE</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // floating icons
  floatingIcon: { position: 'absolute', zIndex: 1 },
  floatingIconBg: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // top bar
  topBar: { position: 'absolute', top: 56, right: 16, zIndex: 10 },
  themeToggleWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 30, borderWidth: 1,
  },
  switchEl: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },

  // content
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingTop: 100, paddingBottom: 40,
    zIndex: 2,
  },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 26, fontWeight: '800', color: '#FFFFFF',
    textAlign: 'center', lineHeight: 33, marginBottom: 12,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.78)',
    textAlign: 'center', lineHeight: 21, maxWidth: 300,
  },

  // card
  card: {
    width: '100%', maxWidth: 400, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 20, overflow: 'hidden', position: 'relative',
  },
  decorTopRight: {
    position: 'absolute', top: -6, right: -6, width: 18, height: 18,
    borderRadius: 9, backgroundColor: '#22D3EE',
  },
  decorBottomLeft: {
    position: 'absolute', bottom: -4, left: -4, width: 14, height: 14,
    borderRadius: 7, backgroundColor: '#A78BFA',
  },
  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  btnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, borderRadius: 14, borderWidth: 1, gap: 8,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // footer
  footer: { alignItems: 'center' },
  footerLine: { width: 80, height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 10 },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
});
