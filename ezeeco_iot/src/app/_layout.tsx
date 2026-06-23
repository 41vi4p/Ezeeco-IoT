import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { useStore } from '@/store/useStore';

// Routes accessible without authentication
const PUBLIC_ROOTS = new Set(['(auth)', 'about', 'credits']);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0] as string | undefined;
    const isPublic = root === undefined || PUBLIC_ROOTS.has(root);

    if (!isAuthenticated && !isPublic) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && root === '(auth)') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

function RootLayout() {
  const { initDarkMode, darkMode } = useStore();

  useEffect(() => {
    initDarkMode();
  }, []);

  return (
    <>
      <AuthProvider>
        <NotificationsProvider>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="device/[id]" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="room/[id]" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="room/[id]/members" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="room/[id]/logs" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="add-room" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="add-room-selection" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="add-device" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="automation" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="automation-logs" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="video-logs" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="security" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="family-access" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="profile-edit" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="about" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="credits" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="reports" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="account-settings" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="privacy-security" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="logs" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="help-support" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="scenes/create" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="+not-found" options={{ headerShown: false }} />
            </Stack>
          </AuthGuard>
          <Toast />
          <StatusBar style={darkMode ? 'light' : 'dark'} />
        </NotificationsProvider>
      </AuthProvider>
    </>
  );
}

export default RootLayout;
