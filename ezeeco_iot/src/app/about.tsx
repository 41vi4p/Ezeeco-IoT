import React from 'react';
import Constants from 'expo-constants';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Code, Shield, Heart } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings')} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <View style={styles.appIconWrap}>
            <LinearGradient colors={['#7C3AED', '#3B82F6']} style={styles.appIcon}>
              <Shield size={36} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>Ezeeco IoT</Text>
          <Text style={[styles.appTagline, { color: theme.textSecondary }]}>Smart Home Control & Automation</Text>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Version {Constants.expoConfig?.version ?? '—'}</Text>
        </View>

        {/* About */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>About This App</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            Ezeeco IoT is a comprehensive smart home solution that allows you to connect, control, and automate your IoT devices. Built with ESP32 integration and Firebase backend, it provides real-time device control and monitoring.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <Code size={18} color="#7C3AED" />
              <Text style={[styles.featureText, { color: theme.text }]}>Built with React Native & Firebase</Text>
            </View>
            <View style={styles.featureRow}>
              <Shield size={18} color="#3B82F6" />
              <Text style={[styles.featureText, { color: theme.text }]}>Secure ESP32 Integration</Text>
            </View>
            <View style={styles.featureRow}>
              <Heart size={18} color="#EF4444" />
              <Text style={[styles.featureText, { color: theme.text }]}>Open Source Project</Text>
            </View>
          </View>
        </View>

        {/* Made by */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Made by</Text>
          <Text style={styles.madeByName}>Project Cell CRCE</Text>
          <Text style={[styles.madeByCollege, { color: theme.textSecondary }]}>Fr. Conceicao Rodrigues College of Engineering</Text>
          <TouchableOpacity
            style={styles.creditsBtn}
            onPress={() => router.push('/credits')}
          >
            <LinearGradient colors={['#7C3AED', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.creditsBtnGrad}>
              <Text style={styles.creditsBtnText}>View Credits</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Contact & Support</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>For technical support or inquiries:</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:projectcell.crce@gmail.com')}>
            <Text style={styles.email}>projectcell.crce@gmail.com</Text>
          </TouchableOpacity>
          <Text style={[styles.cardTextSm, { color: theme.textSecondary }]}>
            This project is developed as part of academic research in IoT and Smart Home Automation.
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>© 2025 Project Cell CRCE. Built with love for the future of IoT.</Text>
        </View>
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
  content: { padding: 16, paddingBottom: 100 },
  card: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
  appIconWrap: { marginBottom: 12 },
  appIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 22, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  appTagline: { fontSize: 14, marginBottom: 4, textAlign: 'center' },
  appVersion: { fontSize: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, alignSelf: 'flex-start' },
  cardText: { fontSize: 13, lineHeight: 20, alignSelf: 'flex-start', marginBottom: 12 },
  cardTextSm: { fontSize: 12, lineHeight: 18, alignSelf: 'flex-start', marginTop: 10 },
  featureList: { gap: 12, alignSelf: 'stretch' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13 },
  madeByName: { fontSize: 20, fontWeight: '900', color: '#7C3AED', marginBottom: 4 },
  madeByCollege: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  creditsBtn: { borderRadius: 12, overflow: 'hidden' },
  creditsBtnGrad: { paddingHorizontal: 24, paddingVertical: 12 },
  creditsBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  email: { color: '#7C3AED', fontSize: 14, fontWeight: '600', marginBottom: 4, alignSelf: 'flex-start' },
  footer: { alignItems: 'center', paddingTop: 20, borderTopWidth: 1 },
  footerText: { fontSize: 12, textAlign: 'center' },
});
