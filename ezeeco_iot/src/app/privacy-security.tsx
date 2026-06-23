import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Eye, Share2, Database, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const [shareUsage, setShareUsage] = useState(false);
  const [shareCrash, setShareCrash] = useState(true);
  const [locationData, setLocationData] = useState(false);

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  const Row = ({ icon: Icon, label, desc, value, onToggle }: any) => (
    <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
      <View style={[styles.rowIcon, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
        <Icon size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        {desc && <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>{desc}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#818CF8' }} thumbColor="#FFFFFF" />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Data Sharing</Text>
          <Row icon={Share2} label="Share Usage Data" desc="Help us improve with anonymous analytics" value={shareUsage} onToggle={setShareUsage} />
          <Row icon={Database} label="Crash Reports" desc="Automatically send crash reports" value={shareCrash} onToggle={setShareCrash} />
          <Row icon={Eye} label="Location Data" desc="Allow location-based automations" value={locationData} onToggle={setLocationData} />
        </View>

        <View style={[styles.section, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Data Management</Text>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.cardBorder }]}
            onPress={() => Alert.alert('Clear Cache', 'Cache cleared successfully')}
          >
            <View style={[styles.rowIcon, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
              <Database size={18} color={theme.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Clear Cache</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>Remove locally stored data</Text>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: 'transparent' }]}
            onPress={() => Alert.alert('Export Data', 'Data export feature coming soon')}
          >
            <View style={[styles.rowIcon, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
              <Trash2 size={18} color='#EF4444' />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: '#EF4444' }]}>Delete All Data</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>Permanently remove all your data</Text>
            </View>
          </TouchableOpacity>
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
  content: { padding: 16, paddingBottom: 100, gap: 16 },
  section: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  rowDesc: { fontSize: 11 },
});
