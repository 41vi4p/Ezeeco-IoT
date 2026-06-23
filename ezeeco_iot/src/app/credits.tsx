import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Users, Code, Globe } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

const GithubIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
  </Svg>
);

const LinkedinIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill={color}>
    <Path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </Svg>
);

const InstagramIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </Svg>
);

const teamMembers = [
  {
    name: 'Deon Raj',
    designation: 'Developer',
    role: 'Full Stack Development',
    color: ['#EC4899', '#F43F5E'] as [string, string],
    github: '',
    linkedin: '',
    instagram: '',
    portfolio: '',
  },
  {
    name: 'David Porathur',
    designation: 'Club Lead',
    role: 'Full Stack Development',
    color: ['#7C3AED', '#EC4899'] as [string, string],
    github: 'https://github.com/41vi4p',
    linkedin: 'https://www.linkedin.com/in/david-porathur-33780228a',
    instagram: 'https://www.instagram.com/davidp2529.sh?igsh=aHBleHRzc2cxajJk',
    portfolio: 'https://davidporathur.vercel.app',
  },
  {
    name: 'Pranav Koradiya',
    designation: 'Club Co-Lead',
    role: 'Full Stack Development',
    color: ['#3B82F6', '#06B6D4'] as [string, string],
    github: 'https://github.com/08pranav',
    linkedin: 'https://linkedin.com/in/pranavkoradiya',
    instagram: 'https://www.instagram.com/pranav85_?igsh=MWwwbDBzaHUzOHdwNg%3D%3D',
    portfolio: 'https://pranavkoradiya.com',
  },
  {
    name: 'Yash Masaye',
    designation: 'Design Co-Lead',
    role: 'UI/UX Designer',
    color: ['#F59E0B', '#EAB308'] as [string, string],
    github: '',
    linkedin: '',
    instagram: 'https://www.instagram.com/yash.masaye?igsh=MTF3eTVrcm1qa2gzcg==',
    portfolio: '',
  },
  {
    name: 'Naimish Purohit',
    designation: 'Hardware Specialist',
    role: 'ESP32 Integration & Hardware',
    color: ['#10B981', '#14B8A6'] as [string, string],
    github: '',
    linkedin: '',
    instagram: 'https://www.instagram.com/naimish.purohit?igsh=MXB4d2JxeTUwYXlmeg==',
    portfolio: '',
  },
  {
    name: 'Mangalam Jaiswal',
    designation: 'IoT Lead',
    role: 'ESP32 Integration & Hardware',
    color: ['#F97316', '#EF4444'] as [string, string],
    github: '',
    linkedin: '',
    instagram: 'https://www.instagram.com/__manxglam__?igsh=eHFxa29uanJoaGFu',
    portfolio: '',
  },
];

const technologies = [
  'Expo SDK 56', 'React Native', 'TypeScript', 'Firebase',
  'Realtime Database', 'Firestore', 'ESP32', 'Zustand',
  'Expo Router', 'Lucide Icons', 'Linear Gradient',
];

export default function CreditsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#7C3AED', '#4F46E5', '#3B82F6'];

  const openLink = (url: string) => { if (url) Linking.openURL(url); };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/about')} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Credits</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Development Team</Text>
          </View>
          <View style={styles.teamGrid}>
            {teamMembers.map((member) => (
              <View key={member.name} style={[styles.memberCard, { backgroundColor: isDark ? '#444444' : '#F9FAFB', borderColor: isDark ? '#444444' : '#E5E7EB' }]}>
                <LinearGradient colors={member.color} style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>{member.name.charAt(0)}</Text>
                </LinearGradient>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                  <Text style={[styles.memberDesig, { color: theme.primary }]}>{member.designation}</Text>
                  <Text style={[styles.memberRole, { color: theme.textSecondary }]}>{member.role}</Text>
                </View>
                {(member.github || member.linkedin || member.instagram || member.portfolio) ? (
                  <View style={styles.socialCol}>
                    {member.github ? (
                      <TouchableOpacity style={[styles.socialBtn, { backgroundColor: isDark ? '#333333' : '#F3F4F6' }]} onPress={() => openLink(member.github)}>
                        <GithubIcon color={theme.textSecondary} />
                      </TouchableOpacity>
                    ) : null}
                    {member.linkedin ? (
                      <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#0A66C2' }]} onPress={() => openLink(member.linkedin)}>
                        <LinkedinIcon color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : null}
                    {member.instagram ? (
                      <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#E1306C' }]} onPress={() => openLink(member.instagram)}>
                        <InstagramIcon color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : null}
                    {member.portfolio ? (
                      <TouchableOpacity style={[styles.socialBtn, { backgroundColor: isDark ? '#333333' : '#F3F4F6' }]} onPress={() => openLink(member.portfolio)}>
                        <Globe size={13} color={theme.textSecondary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Institution */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder, alignItems: 'center' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Institution</Text>
          <Text style={styles.institutionName}>Fr. Conceicao Rodrigues College of Engineering</Text>
          <Text style={[styles.institutionSub, { color: theme.textSecondary }]}>Bandra, Mumbai</Text>
          <Text style={[styles.institutionSub, { color: theme.textSecondary }]}>University of Mumbai</Text>
        </View>

        {/* Technologies */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Code size={18} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Technologies Used</Text>
          </View>
          <View style={styles.techWrap}>
            {technologies.map(tech => (
              <View key={tech} style={[styles.techChip, { backgroundColor: isDark ? '#312e81' : '#EDE9FE' }]}>
                <Text style={[styles.techChipText, { color: isDark ? '#C4B5FD' : '#5B21B6' }]}>{tech}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Special Thanks */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Special Thanks</Text>
          {[
            'Faculty and mentors for their guidance',
            'Open-source contributors for tools and libraries',
            'Firebase team for backend support',
            'ESP32 community for integration help',
            'Beta testers for valuable feedback',
          ].map(line => (
            <Text key={line} style={[styles.thanksLine, { color: theme.textSecondary }]}>• {line}</Text>
          ))}
        </View>

        {/* Open Source */}
        <View style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder, alignItems: 'center' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 8 }]}>Open Source</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary, textAlign: 'center' }]}>
            This project is developed for educational purposes and research in IoT automation.
          </Text>
          <Text style={[styles.copyright, { color: theme.textSecondary }]}>
            © 2025 Project Cell CRCE. Built with love for the future of IoT.
          </Text>
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
  card: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  teamGrid: { gap: 12 },
  memberCard: { borderRadius: 14, padding: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  memberAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  memberInitial: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  memberDesig: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  memberRole: { fontSize: 11 },
  socialCol: { flexDirection: 'row', flexWrap: 'wrap', width: 68, gap: 6, alignSelf: 'center', justifyContent: 'flex-end' },
  socialBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  institutionName: { fontSize: 16, fontWeight: '800', color: '#7C3AED', textAlign: 'center', marginBottom: 6 },
  institutionSub: { fontSize: 13, marginBottom: 2 },
  techWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  techChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  techChipText: { fontSize: 12, fontWeight: '600' },
  thanksLine: { fontSize: 13, lineHeight: 22 },
  cardText: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  copyright: { fontSize: 11, textAlign: 'center' },
});
