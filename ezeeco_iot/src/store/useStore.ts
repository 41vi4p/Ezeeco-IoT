import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { Device, Room, deviceService, roomService, userService } from '@/services/firestoreService';
import { iotControlService } from '@/services/iotControlService';

type ExtendedDevice = Device & {
  iotState?: { online: boolean; state: number | string; lastUpdated: any };
  controlType?: 'toggle' | 'range' | 'multi-button' | 'custom';
};

interface DeviceState {
  devices: ExtendedDevice[];
  rooms: Room[];
  pinnedIds: string[];
  activeRoomId: string | null;
  isLoading: boolean;
  error: string | null;
  darkMode: boolean;
  setDevices: (devices: ExtendedDevice[]) => void;
  setRooms: (rooms: Room[]) => void;
  setActiveRoom: (roomId: string | null) => void;
  toggleDevice: (deviceId: string, userId: string) => Promise<void>;
  setDeviceValue: (deviceId: string, value: number, userId: string) => Promise<void>;
  fetchDevices: (userId?: string) => Promise<void>;
  fetchRooms: (userId?: string) => Promise<void>;
  loadPinnedIds: (userId: string) => Promise<void>;
  togglePin: (userId: string, deviceId: string) => Promise<void>;
  setDarkMode: (isDark: boolean) => void;
  initDarkMode: () => Promise<void>;
  subscribeToDevices: (userId: string) => (() => void) | undefined;
  subscribeToRooms: (userId: string) => (() => void) | undefined;
}

export const useStore = create<DeviceState>((set, get) => ({
  devices: [],
  rooms: [],
  pinnedIds: [],
  activeRoomId: null,
  isLoading: false,
  error: null,
  darkMode: Appearance.getColorScheme() === 'dark',

  setDevices: (devices) => set({ devices }),
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  initDarkMode: async () => {
    try {
      const stored = await AsyncStorage.getItem('darkMode');
      if (stored !== null) {
        set({ darkMode: stored === 'true' });
      }
    } catch {}
  },

  setDarkMode: (isDark) => {
    AsyncStorage.setItem('darkMode', isDark.toString()).catch(() => {});
    set({ darkMode: isDark });
  },

  toggleDevice: async (deviceId, userId) => {
    set({ isLoading: true });
    try {
      const device = get().devices.find(d => d.id === deviceId);
      if (!device) throw new Error('Device not found');
      const currentState = (device.iotState?.state as number) || 0;
      const newState = currentState === 1 ? 0 : 1;

      set(state => ({
        devices: state.devices.map(d =>
          d.id === deviceId ? { ...d, currentValue: newState, isOnline: true } : d
        ),
      }));

      await iotControlService.toggleDevice(deviceId, userId, device.roomId, currentState);
      await deviceService.updateDevice(deviceId, { isOnline: true, currentValue: newState });

      set(state => ({
        devices: state.devices.map(d =>
          d.id === deviceId
            ? { ...d, isOnline: true, currentValue: newState, iotState: { online: true, state: newState, lastUpdated: new Date() } }
            : d
        ),
        isLoading: false,
      }));
    } catch (error) {
      set(state => ({
        devices: state.devices.map(d =>
          d.id === deviceId ? { ...d, currentValue: d.currentValue === 1 ? 0 : 1 } : d
        ),
        error: 'Failed to toggle device',
        isLoading: false,
      }));
    }
  },

  setDeviceValue: async (deviceId, value, userId) => {
    set({ isLoading: true });
    try {
      const device = get().devices.find(d => d.id === deviceId);
      if (!device) throw new Error('Device not found');
      await iotControlService.setDeviceValue(deviceId, value, userId, device.roomId);
      await deviceService.updateDevice(deviceId, { isOnline: true, currentValue: value });
      set(state => ({
        devices: state.devices.map(d =>
          d.id === deviceId
            ? { ...d, isOnline: true, currentValue: value, iotState: { online: true, state: value, lastUpdated: new Date() } }
            : d
        ),
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to set device value', isLoading: false });
    }
  },

  fetchDevices: async (userId) => {
    if (!userId) return;
    set({ isLoading: true });
    try {
      let devices: Device[] = [];

      // Primary: query by userId field — catch separately so errors fall to fallback
      try {
        devices = await deviceService.getUserDevices(userId);
      } catch { /* fall through to room-based fallback */ }

      // Fallback: iterate rooms and collect their devices
      if (devices.length === 0) {
        const rooms = get().rooms.length > 0
          ? get().rooms
          : await roomService.getUserRooms(userId);

        const roomDevicesArrays = await Promise.all(
          rooms.map(r => deviceService.getRoomDevices(r.id).catch(() => [] as Device[]))
        );
        const seen = new Set<string>();
        roomDevicesArrays.flat().forEach(d => {
          if (!seen.has(d.id)) { seen.add(d.id); devices.push(d); }
        });
      }

      const devicesWithState = await Promise.all(
        devices.map(async (device) => {
          try {
            if (device.roomId) {
              const iotState = await iotControlService.getDeviceState(device.id, device.roomId);
              return { ...device, iotState };
            }
            return device;
          } catch { return device; }
        })
      );
      set({ devices: devicesWithState as ExtendedDevice[], isLoading: false });
    } catch (err) {
      console.error('[fetchDevices] error:', err);
      set({ error: 'Failed to fetch devices', isLoading: false });
    }
  },

  fetchRooms: async (userId) => {
    if (!userId) return;
    set({ isLoading: true });
    try {
      const rooms = await roomService.getUserRooms(userId);
      set({ rooms, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch rooms', isLoading: false });
    }
  },

  loadPinnedIds: async (userId) => {
    try {
      const ids = await userService.getUserPinnedDevices(userId);
      set({ pinnedIds: ids });
    } catch {}
  },

  togglePin: async (userId, deviceId) => {
    const { pinnedIds } = get();
    const isPinned = pinnedIds.includes(deviceId);
    // Optimistic update
    set({ pinnedIds: isPinned ? pinnedIds.filter(id => id !== deviceId) : [...pinnedIds, deviceId] });
    try {
      if (isPinned) {
        await userService.unpinDevice(userId, deviceId);
      } else {
        await userService.pinDevice(userId, deviceId);
      }
    } catch {
      // Revert on failure
      set({ pinnedIds });
    }
  },

  subscribeToDevices: (userId) => {
    try {
      return deviceService.subscribeToUserDevices(userId, (devices) => {
        set({ devices: devices as ExtendedDevice[] });
      });
    } catch { return undefined; }
  },

  subscribeToRooms: (userId) => {
    try {
      return roomService.subscribeToUserRooms(userId, (rooms) => set({ rooms }));
    } catch { return undefined; }
  },
}));
