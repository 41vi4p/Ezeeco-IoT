import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface BrandFooterProps {
  style?: any;
}

export default function BrandFooter({ style }: BrandFooterProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.line, { backgroundColor: theme.cardBorder }]} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>
        Powered by Project Cell CRCE
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 16 },
  line: { height: 1, width: 120, marginBottom: 8 },
  text: { fontSize: 11, fontWeight: '500' },
});
