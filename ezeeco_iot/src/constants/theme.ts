import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    background: '#FFFFFF',
    backgroundElement: '#F3F4F6',
    backgroundSelected: '#E5E7EB',
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',
    headerGradient: ['#60A5FA', '#38BDF8', '#6366F1'] as string[],
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    accent: '#8B5CF6',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    purple: '#7C3AED',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#6366F1',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#B3B3B3',
    background: '#2D2D2D',
    backgroundElement: '#333333',
    backgroundSelected: '#444444',
    card: '#333333',
    cardBorder: '#444444',
    headerGradient: ['#1E1B4B', '#4C1D95', '#1E1B4B'] as string[],
    primary: '#818CF8',
    primaryDark: '#6366F1',
    accent: '#A78BFA',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    purple: '#A78BFA',
    tabBar: '#2D2D2D',
    tabBarBorder: '#444444',
    tabIconDefault: '#888888',
    tabIconSelected: '#818CF8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64,
} as const;

export const BorderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
