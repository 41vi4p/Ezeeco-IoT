import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, ActivityIndicator,
} from 'react-native';
import {
  Lightbulb, Fan, Tv, Volume2, Camera, Lock, Plug, Cpu,
  Star, MoreVertical, ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

interface DeviceCardProps {
  device: {
    id: string;
    name: string;
    type: string;
    category?: string;
    isOnline?: boolean;
    currentValue?: number | string;
    iotState?: { online: boolean; state: number | string; lastUpdated?: any };
  };
  onToggle?: (deviceId: string) => void;
  onEdit?: (deviceId: string) => void;
  isPinned?: boolean;
  onPinToggle?: (deviceId: string) => void;
  pinLoading?: boolean;
}

const getDeviceIcon = (type: string, color: string, size = 20) => {
  const t = (type || '').toLowerCase();
  if (t.includes('fan'))                         return <Fan       size={size} color={color} />;
  if (t.includes('tv'))                          return <Tv        size={size} color={color} />;
  if (t.includes('speaker') || t.includes('volume')) return <Volume2 size={size} color={color} />;
  if (t.includes('camera'))                      return <Camera    size={size} color={color} />;
  if (t.includes('lock'))                        return <Lock      size={size} color={color} />;
  if (t.includes('plug'))                        return <Plug      size={size} color={color} />;
  if (t.includes('light') || t === 'lights')     return <Lightbulb size={size} color={color} />;
  return <Cpu size={size} color={color} />;
};

export default function DeviceCard({
  device, onToggle, onEdit, isPinned, onPinToggle, pinLoading,
}: DeviceCardProps) {
  const theme  = useTheme();
  const isDark = useIsDark();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOn = (() => {
    if (device.iotState?.state !== undefined) {
      const s = device.iotState.state;
      if (typeof s === 'number')  return s === 1;
      if (typeof s === 'string')  return s === 'on' || s === '1';
      if (typeof s === 'boolean') return s;
    }
    if (device.currentValue !== undefined) {
      if (typeof device.currentValue === 'number') return device.currentValue === 1;
      if (typeof device.currentValue === 'string') return device.currentValue === 'on' || device.currentValue === '1';
    }
    return false;
  })();

  const isOnline   = device.iotState?.online ?? device.isOnline ?? false;
  const cardBg     = isDark ? '#2D2D2D' : '#FFFFFF';
  const iconBg     = isDark ? '#3A3A3A' : '#F3F4F6';
  const iconColor  = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg, borderColor: isOn ? '#22C55E' : theme.cardBorder }]}
        onPress={() => onToggle?.(device.id)}
        onLongPress={() => onEdit?.(device.id)}
        delayLongPress={400}
        activeOpacity={0.75}
      >
        {/* ── Top row: icon · name+state · online dot · three-dots ── */}
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            {getDeviceIcon(device.type || device.category || '', iconColor)}
          </View>

          <View style={styles.nameBlock}>
            <Text style={[styles.nameState, { color: theme.text }]} numberOfLines={1}>
              {device.name}{' '}
              <Text style={[styles.stateInline, { color: theme.textSecondary }]}>
                {isOn ? 'On' : 'Off'}
              </Text>
            </Text>
            <Text style={[styles.category, { color: theme.textSecondary }]} numberOfLines={1}>
              {device.category || device.type || 'custom'}
            </Text>
          </View>

          <View style={styles.topRight}>
            {/* Online indicator dot */}
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#22C55E' : '#6B7280' }]} />
            {/* Three-dots menu */}
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.dotsBtn}
            >
              <MoreVertical size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Status row ── */}
        <View style={styles.statusBlock}>
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOn ? '#22C55E' : '#6B7280' }]} />
            <Text style={[styles.statusText, { color: isOn ? '#22C55E' : theme.textSecondary }]}>
              {isOn ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* ── Hint text ── */}
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Tap to toggle  •  Hold for details
        </Text>
      </TouchableOpacity>

      {/* ── Three-dots bottom sheet ── */}
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: isDark ? '#333333' : '#FFFFFF' }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={[styles.handle, { backgroundColor: isDark ? '#444444' : '#D1D5DB' }]} />

            {/* Device label */}
            <Text style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={[styles.sheetSub, { color: theme.textSecondary }]}>
              {device.category || device.type || 'Device'}
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            {/* Open Details */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => { setMenuOpen(false); onEdit?.(device.id); }}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${theme.primary}18` }]}>
                <ExternalLink size={18} color={theme.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>Open Details</Text>
            </TouchableOpacity>

            {/* Pin / Unpin */}
            {onPinToggle && (
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => { setMenuOpen(false); onPinToggle(device.id); }}
                disabled={pinLoading}
              >
                <View style={[styles.menuIcon, {
                  backgroundColor: isPinned ? '#FEF3C7' : (isDark ? '#444444' : '#F3F4F6'),
                }]}>
                  {pinLoading
                    ? <ActivityIndicator size={16} color={theme.primary} />
                    : <Star size={18} color={isPinned ? '#F59E0B' : theme.textSecondary}
                        fill={isPinned ? '#F59E0B' : 'none'} />
                  }
                </View>
                <Text style={[styles.menuLabel, { color: theme.text }]}>
                  {isPinned ? 'Unpin from Quick Access' : 'Pin to Quick Access'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.cancelRow, { borderTopColor: theme.cardBorder }]}
              onPress={() => setMenuOpen(false)}
            >
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },

  // Top row
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  nameBlock:  { flex: 1, gap: 1 },
  nameState:  { fontSize: 13, fontWeight: '700' },
  stateInline:{ fontSize: 12, fontWeight: '400' },
  category:   { fontSize: 11 },
  topRight:   { alignItems: 'center', gap: 6 },
  onlineDot:  { width: 8, height: 8, borderRadius: 4 },
  dotsBtn:    { padding: 2 },

  // Status
  statusBlock:{ gap: 4 },
  statusLabel:{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Hint
  hint: { fontSize: 10, textAlign: 'center', marginTop: 2 },

  // Sheet
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 15, fontWeight: '700' },
  sheetSub:   { fontSize: 12, marginBottom: 12 },
  divider:    { height: 1, marginBottom: 12 },
  menuRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  menuIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:  { fontSize: 15, fontWeight: '500' },
  cancelRow:  { borderTopWidth: 1, paddingTop: 14, marginTop: 4, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '500' },
});
