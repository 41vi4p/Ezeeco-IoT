import { Tabs } from 'expo-router';
import { Home, Grid3X3, Shield, Settings, Radio } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';

export default function TabsLayout() {
  const theme  = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { tabBarSideM } = useResponsive();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom + 12,
          left: tabBarSideM,
          right: tabBarSideM,
          height: 72,
          borderRadius: 36,
          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.5 : 0.15,
          shadowRadius: 24,
          paddingBottom: 0,
          paddingTop: 0,
          overflow: 'hidden',
        },
        tabBarActiveTintColor:   theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarItemStyle: {
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarIconStyle: {
          marginBottom: 3,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          lineHeight: 12,
          includeFontPadding: false,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.tabIconSelected + '20' }]}>
              <Home size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.tabIconSelected + '20' }]}>
              <Grid3X3 size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="ir-tab"
        options={{
          title: 'IR',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.tabIconSelected + '20' }]}>
              <Radio size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="security-tab"
        options={{
          title: 'Security',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.tabIconSelected + '20' }]}>
              <Shield size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.tabIconSelected + '20' }]}>
              <Settings size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* Hidden — routes still accessible via navigation */}
      <Tabs.Screen name="add"    options={{ href: null }} />
      <Tabs.Screen name="scenes" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 38,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
