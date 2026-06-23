import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, Zap, Clock, BarChart2 } from 'lucide-react-native';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function AutomationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const { user } = useAuth();
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const q = query(collection(firestore, 'automations'), where('userId', '==', user.id));
        const snap = await getDocs(q);
        setAutomations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { setAutomations([]); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const toggleAutomation = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(firestore, 'automations', id), { enabled: !current });
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !current } : a));
    } catch { Alert.alert('Error', 'Failed to update automation'); }
  };

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Automation</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/automation-logs')}>
              <BarChart2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {automations.length === 0 ? (
            <View style={styles.empty}>
              <Zap size={48} color={theme.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No automations yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Create rules to automate your devices</Text>
            </View>
          ) : (
            automations.map(auto => (
              <View key={auto.id} style={[styles.autoCard, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}>
                <View style={[styles.autoIcon, { backgroundColor: isDark ? '#444444' : '#F3F4F6' }]}>
                  <Clock size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.autoName, { color: theme.text }]}>{auto.name || 'Automation'}</Text>
                  <Text style={[styles.autoDesc, { color: theme.textSecondary }]}>{auto.description || 'No description'}</Text>
                </View>
                <Switch
                  value={auto.enabled}
                  onValueChange={() => toggleAutomation(auto.id, auto.enabled)}
                  trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#818CF8' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 100, gap: 10 },
  autoCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, borderWidth: 1, gap: 14 },
  autoIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  autoName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  autoDesc: { fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
