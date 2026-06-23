import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Mail, Globe, BookOpen, MessageCircle, ExternalLink, Phone,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import BrandFooter from '@/components/BrandFooter';

// ── SVG GitHub icon ────────────────────────────────────────────────────────
import Svg, { Path } from 'react-native-svg';
const GithubIcon = ({ color = '#FFFFFF', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </Svg>
);

// ── Data ───────────────────────────────────────────────────────────────────
const CONTACT_METHODS = [
  {
    icon: 'mail', title: 'Email Support',
    description: 'Get help via email', contact: 'projectcellcrce2024@gmail.com',
    url: 'mailto:projectcellcrce2024@gmail.com?subject=Ezeeco IoT Support',
    primary: true,
  },
  {
    icon: 'github', title: 'GitHub Repository',
    description: 'View source code and report issues', contact: 'github.com/Project-Cell-CRCE',
    url: 'https://github.com/Project-Cell-CRCE',
    primary: false,
  },
  {
    icon: 'globe', title: 'Project Website',
    description: 'Learn more about Project Cell', contact: 'project-cell-crce.vercel.app',
    url: 'https://project-cell-crce.vercel.app/',
    primary: false,
  },
];

const QUICK_LINKS = [
  { title: 'ESP32 Setup Guide',       description: 'Step-by-step guide to connect your ESP32',          url: 'https://github.com/Project-Cell-CRCE' },
  { title: 'Firebase Configuration',  description: 'How to configure Firebase for your devices',         url: 'https://github.com/Project-Cell-CRCE' },
  { title: 'API Documentation',       description: 'Developer documentation for the IoT API',            url: 'https://github.com/Project-Cell-CRCE' },
  { title: 'Troubleshooting Guide',   description: 'Common issues and their solutions',                  url: 'https://github.com/Project-Cell-CRCE' },
];

const HELP_TOPICS = [
  {
    emoji: '🏠', title: 'Getting Started',
    description: 'Learn how to set up your first room and devices',
    topics: ['Creating your first room', 'Adding ESP32 devices', 'Connecting to Firebase', 'Setting up device controls'],
  },
  {
    emoji: '🔧', title: 'Device Management',
    description: 'Manage and control your IoT devices',
    topics: ['Adding new devices', 'Device configuration', 'Troubleshooting connectivity', 'Device sharing and permissions'],
  },
  {
    emoji: '⚡', title: 'Automation',
    description: 'Create automated schedules and triggers',
    topics: ['Setting up automation rules', 'Creating schedules', 'Using triggers and conditions', 'Managing automation conflicts'],
  },
  {
    emoji: '📊', title: 'Energy Reports',
    description: 'Understanding your energy usage data',
    topics: ['Reading energy reports', 'Setting up monitoring', 'Cost calculations', 'Historical data analysis'],
  },
  {
    emoji: '🔒', title: 'Security & Privacy',
    description: 'Keep your smart home secure',
    topics: ['Account security settings', 'Device access control', 'Privacy configurations', 'Two-factor authentication'],
  },
  {
    emoji: '🤝', title: 'Room Sharing',
    description: 'Share rooms with family and friends',
    topics: ['Generating join codes', 'Managing room members', 'Setting member permissions', 'Removing access'],
  },
];

// ── Screen ─────────────────────────────────────────────────────────────────
export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const [expanded, setExpanded] = useState<number | null>(null);

  const headerGrad: [string, string, string] = isDark
    ? ['#0F0C3D', '#3B1E8B', '#1A0C4E']
    : ['#4F46E5', '#7C3AED', '#6D28D9'];

  const cardBg     = isDark ? '#333333' : '#FFFFFF';
  const cardBorder = theme.cardBorder;
  const subText    = theme.textSecondary;
  const mainText   = theme.text;

  const ContactIcon = ({ type, primary }: { type: string; primary: boolean }) => {
    const color = primary ? '#FFFFFF' : theme.textSecondary;
    const size  = 20;
    if (type === 'github') return <GithubIcon color={color} size={size} />;
    if (type === 'globe')  return <Globe size={size} color={color} />;
    return <Mail size={size} color={color} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings')} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Contact Support ──────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <MessageCircle size={16} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: mainText }]}>Contact Support</Text>
              <Text style={[styles.sectionSub, { color: subText }]}>Need help? Our support team is here to assist you.</Text>
            </View>
          </View>

          {CONTACT_METHODS.map((method, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.contactRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: cardBorder },
                method.primary && { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(238,242,255,0.8)', borderRadius: 12, marginTop: 4 },
              ]}
              onPress={() => Linking.openURL(method.url)}
              activeOpacity={0.75}
            >
              <View style={[
                styles.contactIconWrap,
                method.primary
                  ? { backgroundColor: theme.primary }
                  : { backgroundColor: isDark ? '#444444' : '#F3F4F6' },
              ]}>
                <ContactIcon type={method.icon} primary={method.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactTitle, { color: mainText }]}>{method.title}</Text>
                <Text style={[styles.contactDesc, { color: subText }]}>{method.description}</Text>
                <Text style={[styles.contactValue, { color: theme.primary }]}>{method.contact}</Text>
              </View>
              <ExternalLink size={16} color={subText} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Documentation & Guides ───────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <BookOpen size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: mainText }]}>Documentation & Guides</Text>
          </View>

          {QUICK_LINKS.map((link, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.linkRow, { borderColor: cardBorder }, i > 0 && { marginTop: 8 }]}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkTitle, { color: mainText }]}>{link.title}</Text>
                <Text style={[styles.linkDesc, { color: subText }]}>{link.description}</Text>
              </View>
              <ExternalLink size={15} color={subText} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Frequently Asked Topics ──────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: mainText, marginBottom: 14 }]}>Frequently Asked Topics</Text>

          {HELP_TOPICS.map((topic, i) => {
            const isOpen = expanded === i;
            return (
              <View key={i} style={[styles.accordionWrap, { borderColor: cardBorder }, i > 0 && { marginTop: 8 }]}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setExpanded(isOpen ? null : i)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.accordionEmoji}>{topic.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.accordionTitle, { color: mainText }]}>{topic.title}</Text>
                    <Text style={[styles.accordionDesc, { color: subText }]}>{topic.description}</Text>
                  </View>
                  {isOpen
                    ? <ChevronUp size={16} color={subText} />
                    : <ChevronDown size={16} color={subText} />
                  }
                </TouchableOpacity>

                {isOpen && (
                  <View style={[styles.accordionBody, { backgroundColor: isDark ? '#282828' : '#F9FAFB', borderTopColor: cardBorder }]}>
                    {topic.topics.map((sub, j) => (
                      <View key={j} style={styles.subItem}>
                        <View style={[styles.subDot, { backgroundColor: theme.primary }]} />
                        <Text style={[styles.subText, { color: subText }]}>{sub}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Emergency Support ────────────────────────────────────────── */}
        <View style={[styles.card, styles.emergencyCard, { borderColor: '#EF444455' }]}>
          <View style={styles.emergencyRow}>
            <View style={styles.emergencyIconWrap}>
              <Phone size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>Emergency Support</Text>
              <Text style={styles.emergencyDesc}>
                If you're experiencing critical security issues or system failures, contact our emergency support.
              </Text>
              <TouchableOpacity
                style={styles.emergencyBtn}
                onPress={() => Linking.openURL('mailto:projectcell.crce@gmail.com?subject=URGENT: Ezeeco IoT Emergency')}
              >
                <Mail size={14} color="#EF4444" />
                <Text style={styles.emergencyBtnText}>Emergency Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Help us improve ──────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, alignItems: 'center' }]}>
          <Text style={[styles.feedbackTitle, { color: mainText }]}>Help us improve</Text>
          <Text style={[styles.feedbackDesc, { color: subText }]}>
            Your feedback helps us make Ezeeco IoT better for everyone.
          </Text>
          <TouchableOpacity
            style={styles.feedbackBtn}
            onPress={() => Linking.openURL('https://github.com/Project-Cell-CRCE')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.feedbackBtnGrad}>
              <GithubIcon color="#FFFFFF" size={16} />
              <Text style={styles.feedbackBtnText}>Submit Feedback</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <BrandFooter />
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

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionSub:   { fontSize: 12, marginTop: 2 },

  // contact
  contactRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  contactIconWrap:{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactTitle:   { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  contactDesc:    { fontSize: 11, marginBottom: 3 },
  contactValue:   { fontSize: 11, fontWeight: '600' },

  // quick links
  linkRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  linkTitle: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  linkDesc:  { fontSize: 12 },

  // accordion
  accordionWrap:   { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  accordionEmoji:  { fontSize: 22 },
  accordionTitle:  { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  accordionDesc:   { fontSize: 11 },
  accordionBody:   { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, gap: 8 },
  subItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subDot:   { width: 6, height: 6, borderRadius: 3 },
  subText:  { fontSize: 13 },

  // emergency
  emergencyCard: { backgroundColor: 'rgba(239,68,68,0.07)' },
  emergencyRow:  { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  emergencyIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  emergencyTitle:    { fontSize: 15, fontWeight: '700', color: '#EF4444', marginBottom: 6 },
  emergencyDesc:     { fontSize: 12, color: '#EF4444', opacity: 0.85, lineHeight: 18, marginBottom: 12 },
  emergencyBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  emergencyBtnText:  { fontSize: 13, fontWeight: '600', color: '#EF4444' },

  // feedback
  feedbackTitle:   { fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  feedbackDesc:    { fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 19 },
  feedbackBtn:     { borderRadius: 12, overflow: 'hidden', alignSelf: 'stretch' },
  feedbackBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  feedbackBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
