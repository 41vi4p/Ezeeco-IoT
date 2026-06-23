import { useWindowDimensions } from 'react-native';

export const CONTENT_MAX = 1100;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet  = width >= 600;
  const isDesktop = width >= 900;

  const numCols   = isDesktop ? 4 : isTablet ? 3 : 2;
  const hPad      = isDesktop ? 40 : isTablet ? 24 : 16;
  const contentW  = Math.min(width, CONTENT_MAX);

  const gridGap   = 12;
  const itemWidth = (contentW - hPad * 2 - gridGap * (numCols - 1)) / numCols;

  // Tab bar: cap at 640 px, centred
  const tabBarMaxW  = Math.min(width - (isTablet ? 48 : 32), 640);
  const tabBarSideM = (width - tabBarMaxW) / 2;

  return {
    width, height,
    isTablet, isDesktop,
    numCols, hPad, contentW,
    gridGap, itemWidth,
    tabBarMaxW, tabBarSideM,
  };
}
