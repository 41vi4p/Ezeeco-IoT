import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStore } from '@/store/useStore';

export function useTheme() {
  const { darkMode } = useStore();
  return darkMode ? Colors.dark : Colors.light;
}

export function useIsDark() {
  const { darkMode } = useStore();
  return darkMode;
}
