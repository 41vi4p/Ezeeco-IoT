import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface SmartHomeIconProps {
  size?: number;
  color?: string;
}

export default function SmartHomeIcon({ size = 40, color = '#FFFFFF' }: SmartHomeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M20 4L4 16V36H16V26H24V36H36V16L20 4Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="20" cy="20" r="3" fill={color} opacity={0.8} />
      <Path d="M14 20 Q20 14 26 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.7} />
      <Path d="M10 20 Q20 10 30 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.4} />
    </Svg>
  );
}
