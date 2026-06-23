import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Coffee, Bed, ChefHat, Car, Dumbbell, BookOpen, Monitor } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    deviceIds?: string[];
  };
  onClick?: () => void;
}

const getRoomIcon = (icon: string, color: string, size = 22) => {
  switch (icon) {
    case 'coffee': return <Coffee size={size} color={color} />;
    case 'bed': return <Bed size={size} color={color} />;
    case 'chef-hat': return <ChefHat size={size} color={color} />;
    case 'car': return <Car size={size} color={color} />;
    case 'dumbbell': return <Dumbbell size={size} color={color} />;
    case 'book': return <BookOpen size={size} color={color} />;
    case 'monitor': return <Monitor size={size} color={color} />;
    default: return <Home size={size} color={color} />;
  }
};

const roomColors = [
  ['#6366F1', '#8B5CF6'],
  ['#0EA5E9', '#6366F1'],
  ['#10B981', '#0EA5E9'],
  ['#F59E0B', '#EF4444'],
  ['#EC4899', '#8B5CF6'],
  ['#14B8A6', '#0EA5E9'],
];

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const colorPair = roomColors[room.name.charCodeAt(0) % roomColors.length];
  const deviceCount = room.deviceIds?.length || 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? '#333333' : '#FFFFFF', borderColor: theme.cardBorder }]}
      onPress={onClick}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colorPair[0]}20` }]}>
        {getRoomIcon(room.icon || 'home', colorPair[0])}
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{room.name}</Text>
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {deviceCount} device{deviceCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={[styles.indicator, { backgroundColor: colorPair[0] }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  count: { fontSize: 12 },
  indicator: { width: 4, height: 32, borderRadius: 2 },
});
