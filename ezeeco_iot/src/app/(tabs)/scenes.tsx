import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Play, Tv, Sun, BookOpen, Utensils, Moon, Music, Film, Lightbulb } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { scenes, Scene } from '@/data/scenesData';

const getSceneIcon = (icon: string, color = '#FFFFFF', size = 22) => {
  switch (icon) {
    case 'tv': return <Tv size={size} color={color} />;
    case 'sun': return <Sun size={size} color={color} />;
    case 'book': return <BookOpen size={size} color={color} />;
    case 'utensils': return <Utensils size={size} color={color} />;
    case 'moon': return <Moon size={size} color={color} />;
    case 'music': return <Music size={size} color={color} />;
    case 'film': return <Film size={size} color={color} />;
    default: return <Lightbulb size={size} color={color} />;
  }
};

export default function ScenesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = useIsDark();
  const [search, setSearch] = useState('');
  const [scenesList, setScenesList] = useState<Scene[]>(scenes);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (!q.trim()) { setScenesList(scenes); return; }
    const lower = q.toLowerCase();
    setScenesList(scenes.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.devices.some(d => d.toLowerCase().includes(lower))
    ));
  };

  const handleActivate = (scene: Scene) => {
    Alert.alert('Scene Activated', `"${scene.name}" has been activated`);
  };

  const headerGrad: [string, string, string] = isDark ? ['#1E1B4B', '#4C1D95', '#1E1B4B'] : ['#60A5FA', '#38BDF8', '#6366F1'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Scenes</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/scenes/create')}>
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search scenes..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {scenesList.map(scene => (
            <View key={scene.id} style={styles.sceneCard}>
              <LinearGradient colors={scene.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sceneGrad}>
                <View style={styles.sceneIconRow}>
                  <View style={styles.sceneIconWrap}>
                    {getSceneIcon(scene.icon)}
                  </View>
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => handleActivate(scene)}
                  >
                    <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sceneName} numberOfLines={1}>{scene.name}</Text>
                <Text style={styles.sceneDesc} numberOfLines={2}>{scene.description}</Text>
                <Text style={styles.sceneDevices} numberOfLines={1}>
                  {scene.devices.slice(0, 2).join(', ')}{scene.devices.length > 2 ? ` +${scene.devices.length - 2}` : ''}
                </Text>
              </LinearGradient>
            </View>
          ))}

          {/* Add Scene Card */}
          <TouchableOpacity style={[styles.addCard, { borderColor: theme.cardBorder, backgroundColor: isDark ? '#333333' : '#F9FAFB' }]} onPress={() => router.push('/scenes/create')}>
            <Plus size={28} color={theme.primary} strokeWidth={1.5} />
            <Text style={[styles.addCardText, { color: theme.primary }]}>Create Scene</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  content: { padding: 16, paddingBottom: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sceneCard: { width: '47%', borderRadius: 16, overflow: 'hidden' },
  sceneGrad: { padding: 16, minHeight: 160 },
  sceneIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sceneIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sceneName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  sceneDesc: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 8, lineHeight: 15 },
  sceneDevices: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  addCard: { width: '47%', borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addCardText: { fontSize: 13, fontWeight: '600' },
});
