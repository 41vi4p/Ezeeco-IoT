import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const isDark = useIsDark();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.code, { color: theme.primary }]}>404</Text>
        <Text style={[styles.title, { color: theme.text }]}>Page Not Found</Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>The screen you're looking for doesn't exist.</Text>
        <Link href="/" style={[styles.link, { color: theme.primary }]}>
          Go to Home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  code: { fontSize: 72, fontWeight: '900', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  desc: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  link: { fontSize: 16, fontWeight: '600' },
});
