export interface Scene {
  id: string;
  name: string;
  description: string;
  devices: string[];
  icon: string;
  colors: [string, string];
}

export const scenes: Scene[] = [
  { id: 'scene-1', name: 'Movie Night', description: 'Dim lights and turn on TV', devices: ['Living Room Lights', 'TV', 'Sound System'], icon: 'tv', colors: ['#7C3AED', '#4F46E5'] },
  { id: 'scene-2', name: 'Good Morning', description: 'Gentle wake up routine', devices: ['Bedroom Lights', 'Kitchen Lights', 'Coffee Maker'], icon: 'sun', colors: ['#F59E0B', '#F97316'] },
  { id: 'scene-3', name: 'Reading Time', description: 'Comfortable reading environment', devices: ['Reading Lamp', 'Living Room Lights'], icon: 'book', colors: ['#3B82F6', '#06B6D4'] },
  { id: 'scene-4', name: 'Dinner Time', description: 'Perfect ambiance for dining', devices: ['Dining Room Lights', 'Kitchen Lights'], icon: 'utensils', colors: ['#EF4444', '#EC4899'] },
  { id: 'scene-5', name: 'Sleep Mode', description: 'Prepare your home for bedtime', devices: ['All Lights', 'Thermostat', 'Security System'], icon: 'moon', colors: ['#6366F1', '#7C3AED'] },
  { id: 'scene-6', name: 'Party Mode', description: 'Get the party started', devices: ['Living Room Lights', 'Sound System', 'Kitchen Lights'], icon: 'music', colors: ['#EC4899', '#8B5CF6'] },
  { id: 'scene-7', name: 'Movie Theater', description: 'Ultimate cinema experience', devices: ['Theater Lights', 'Projector', 'Sound System', 'Blinds'], icon: 'film', colors: ['#374151', '#111827'] },
  { id: 'scene-8', name: 'Relaxing Evening', description: 'Wind down after a long day', devices: ['Living Room Lights', 'Bedroom Lights', 'Smart Speaker'], icon: 'lightbulb', colors: ['#14B8A6', '#10B981'] },
];
