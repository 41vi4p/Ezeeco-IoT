import { ref, set, get, onValue, off, serverTimestamp, push, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { deviceLogService, deviceService } from './firestoreService';

// IoT Control Commands
export interface IoTCommand {
  deviceId: string;
  roomId: string; // Include roomId in all commands
  command: 'toggle' | 'setValue' | 'getBrightness' | 'setBrightness';
  value?: number | string | boolean;
  timestamp: any;
  userId: string;
}

// Device States for IoT
export interface IoTDeviceState {
  online: boolean;
  state: number | string; // 0/1 for toggle, 0-255 for brightness, etc.
  lastUpdated: any;
  lastCommand?: IoTCommand;
}

// IoT Device Control Service
export const iotControlService = {
  // Send toggle command (ON/OFF for lights, locks, etc.)
  async toggleDevice(deviceId: string, userId: string, roomId?: string, currentState?: number): Promise<void> {
    try {
      // Get device details to include in the log
      const device = await deviceService.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }
      
      // Get current value from device
      const currentValue = device.currentValue ?? 0; // Default to 0 if undefined
      
      // Determine new state: if current is 1 (on), set to 0 (off), otherwise set to 1 (on)
      const newState = currentState === 1 ? 0 : 1;
      
      const command: IoTCommand = {
        deviceId,
        roomId,
        command: 'toggle',
        value: newState,
        timestamp: serverTimestamp(),
        userId
      };

      // Set the device state in realtime database under the room structure
      const deviceStateRef = ref(database, `rooms/${roomId}/devices/${deviceId}/iotState`);
      await set(deviceStateRef, {
        online: true,
        state: newState,
        lastUpdated: serverTimestamp(),
        lastCommand: command
      });

      // Log the command to Firestore only (not in Realtime DB)
      await deviceLogService.createLog({
        deviceId,
        deviceName: device.name,
        roomId,
        roomName: '', // This should be populated by the caller
        userId,
        userName: '', // This should be populated by the caller
        action: `Toggled ${newState === 1 ? 'ON' : 'OFF'}`,
        value: newState,
        previousValue: currentValue,
        metadata: { command }
      });

      console.log(`Device ${deviceId} in room ${roomId} toggled to state: ${newState}`);
    } catch (error) {
      console.error('Error toggling device:', error);
      throw error;
    }
  },

  // Set range value (brightness for lights, temperature for thermostats, etc.)
  async setDeviceValue(deviceId: string, value: number, userId: string, roomId?: string, minValue = 0, maxValue = 255): Promise<void> {
    try {
      // Get device details to include in the log
      const device = await deviceService.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }
      
      // Clamp value to valid range
      const clampedValue = Math.max(minValue, Math.min(maxValue, value));
      
      const command: IoTCommand = {
        deviceId,
        roomId,
        command: 'setValue',
        value: clampedValue,
        timestamp: serverTimestamp(),
        userId
      };

      // Set the device state in realtime database under the room structure
      const deviceStateRef = ref(database, `rooms/${roomId}/devices/${deviceId}/iotState`);
      await set(deviceStateRef, {
        online: true,
        state: clampedValue,
        lastUpdated: serverTimestamp(),
        lastCommand: command
      });

      // Log the command to Firestore only (not in Realtime DB)
      await deviceLogService.createLog({
        deviceId,
        deviceName: device.name,
        roomId,
        roomName: '', // This should be populated by the caller
        userId,
        userName: '', // This should be populated by the caller
        action: `Set value to ${clampedValue}`,
        value: clampedValue,
        metadata: { command }
      });

      console.log(`Device ${deviceId} in room ${roomId} value set to: ${clampedValue}`);
    } catch (error) {
      console.error('Error setting device value:', error);
      throw error;
    }
  },

  // Set brightness specifically for lights (0-255)
  async setLightBrightness(deviceId: string, brightness: number, userId: string, roomId: string): Promise<void> {
    try {
      await this.setDeviceValue(deviceId, brightness, userId, roomId, 0, 255);
      console.log(`Light ${deviceId} in room ${roomId} brightness set to: ${brightness}`);
    } catch (error) {
      console.error('Error setting light brightness:', error);
      throw error;
    }
  },

  // Set temperature for thermostats (typically 16-30°C)
  async setThermostatTemperature(deviceId: string, temperature: number, userId: string, roomId: string): Promise<void> {
    try {
      await this.setDeviceValue(deviceId, temperature, userId, roomId, 16, 30);
      console.log(`Thermostat ${deviceId} in room ${roomId} temperature set to: ${temperature}°C`);
    } catch (error) {
      console.error('Error setting thermostat temperature:', error);
      throw error;
    }
  },

  // Set volume for speakers (0-100)
  async setSpeakerVolume(deviceId: string, volume: number, userId: string, roomId: string): Promise<void> {
    try {
      await this.setDeviceValue(deviceId, volume, userId, roomId, 0, 100);
      console.log(`Speaker ${deviceId} in room ${roomId} volume set to: ${volume}%`);
    } catch (error) {
      console.error('Error setting speaker volume:', error);
      throw error;
    }
  },

  // Get current device state
  async getDeviceState(deviceId: string, roomId: string): Promise<IoTDeviceState | null> {
    try {
      const deviceStateRef = ref(database, `rooms/${roomId}/devices/${deviceId}/iotState`);
      const snapshot = await get(deviceStateRef);
      
      if (snapshot.exists()) {
        return snapshot.val() as IoTDeviceState;
      }
      return null;
    } catch (error) {
      console.error(`Error getting device state for ${deviceId} in room ${roomId}:`, error);
      throw error;
    }
  },

  // Subscribe to device state changes
  subscribeToDeviceState(deviceId: string, roomId: string, callback: (state: IoTDeviceState | null) => void) {
    const deviceStateRef = ref(database, `rooms/${roomId}/devices/${deviceId}/iotState`);
    
    const listener = onValue(deviceStateRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as IoTDeviceState);
      } else {
        callback(null);
      }
    });

    // Return unsubscribe function
    return () => off(deviceStateRef, 'value', listener);
  },

  // Subscribe to all devices in a room
  subscribeToRoomDevices(roomId: string, callback: (states: Record<string, IoTDeviceState>) => void) {
    const roomDevicesRef = ref(database, `rooms/${roomId}/devices`);
    
    const listener = onValue(roomDevicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devices = snapshot.val();
        const deviceStates: Record<string, IoTDeviceState> = {};
        
        // Extract state from each device
        Object.keys(devices).forEach(deviceId => {
          if (devices[deviceId].state) {
            deviceStates[deviceId] = devices[deviceId].state;
          }
        });
        
        callback(deviceStates);
      } else {
        callback({});
      }
    });
    
    // Return unsubscribe function
    return () => off(roomDevicesRef, 'value', listener);
  },

  // Initialize device state (called when device is first added)
  async initializeDeviceState(deviceId: string, roomId: string, initialState = 0): Promise<void> {
    try {
      const deviceStateRef = ref(database, `rooms/${roomId}/devices/${deviceId}/iotState`);
      await set(deviceStateRef, {
        online: true,
        state: initialState,
        lastUpdated: serverTimestamp()
      });
      console.log(`Device ${deviceId} in room ${roomId} initialized with state: ${initialState}`);
    } catch (error) {
      console.error('Error initializing device state:', error);
      throw error;
    }
  },

  // Set device offline
  async setDeviceOffline(deviceId: string, roomId?: string): Promise<void> {
    try {
      const deviceStateRef = ref(database, `rooms/${roomId}/devices/${deviceId}/iotState`);
      const currentState = await get(deviceStateRef);
      
      if (currentState.exists()) {
        const state = currentState.val();
        await set(deviceStateRef, {
          ...state,
          online: false,
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error(`Error setting device ${deviceId} in room ${roomId} offline:`, error);
      throw error;
    }
  },

  // Clean up device data when a device is deleted
  async removeDevice(deviceId: string, roomId: string): Promise<void> {
    try {
      // Remove the device from the realtime database
      const deviceRef = ref(database, `rooms/${roomId}/devices/${deviceId}`);
      await remove(deviceRef);
      console.log(`Device ${deviceId} removed from room ${roomId} in Realtime Database`);
    } catch (error) {
      console.error(`Error removing device ${deviceId} from room ${roomId}:`, error);
      throw error;
    }
  },

  // Batch control multiple devices in the same room
  async controlMultipleDevices(commands: IoTCommand[]): Promise<void> {
    try {
      const promises = commands.map(async (command) => {
        if (command.command === 'toggle') {
          return this.toggleDevice(
            command.deviceId, 
            command.userId, 
            command.roomId, 
            typeof command.value === 'number' ? (command.value === 1 ? 0 : 1) : 0
          );
        } else if (command.command === 'setValue') {
          return this.setDeviceValue(
            command.deviceId, 
            command.value as number, 
            command.userId,
            command.roomId
          );
        }
      });

      await Promise.all(promises);
      console.log(`Batch controlled ${commands.length} devices`);
    } catch (error) {
      console.error('Error controlling multiple devices:', error);
      throw error;
    }
  },
  
  // Migrate a device from old structure to new room-based structure
  async migrateDeviceToRoomStructure(deviceId: string, roomId: string): Promise<void> {
    try {
      // Get the current device state from the old path
      const oldDeviceStateRef = ref(database, `iot_devices/${deviceId}/state`);
      const snapshot = await get(oldDeviceStateRef);
      
      if (snapshot.exists()) {
        // Copy the state to the new structure
        const deviceState = snapshot.val();
        const newDeviceStateRef = ref(database, `rooms/${roomId}/devices/${deviceId}/iotState`);
        await set(newDeviceStateRef, deviceState);
        
        // Delete the old data
        await remove(oldDeviceStateRef);
        
        // Also delete any command history
        const oldCommandsRef = ref(database, `iot_devices/${deviceId}/commands`);
        await remove(oldCommandsRef);
        
        console.log(`Device ${deviceId} migrated to room ${roomId} structure`);
      }
    } catch (error) {
      console.error(`Error migrating device ${deviceId} to room ${roomId}:`, error);
      throw error;
    }
  }
};
