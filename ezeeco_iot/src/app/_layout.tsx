import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { useStore } from '@/store/useStore';

function RootLayout() {
  const { initDarkMode, darkMode } = useStore();

  useEffect(() => {
    initDarkMode();
  }, []);

  return (
    <>
      <AuthProvider>
        <NotificationsProvider>
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
          <Toast />
          <StatusBar style={darkMode ? 'light' : 'dark'} />
        </NotificationsProvider>
      </AuthProvider>
    </>
  );
}

export default RootLayout;
