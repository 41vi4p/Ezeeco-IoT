import { useRouter } from 'expo-router';

export function useBackNavigation(fallback: string = '/(tabs)') {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
  };
}
