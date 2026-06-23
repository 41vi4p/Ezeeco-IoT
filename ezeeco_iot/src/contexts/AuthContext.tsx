import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userService, deviceService, roomService } from '@/services/firestoreService';
import { iotControlService } from '@/services/iotControlService';
import { useStore } from '@/store/useStore';
import { logUserLogin, logUserLogout, logUserAction } from '@/utils/activityLogger';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  photoURL?: string;
  theme?: 'light' | 'dark';
  deviceIds?: string[];
  roomIds?: string[];
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  addDevice: (device: any) => Promise<string>;
  updateDevice: (deviceId: string, data: any) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  controlDevice: (deviceId: string, status: any) => Promise<void>;
  addRoom: (room: any) => Promise<string>;
  updateRoom: (roomId: string, data: any) => Promise<void>;
  removeRoom: (roomId: string) => Promise<void>;
  addDeviceToRoom: (roomId: string, deviceId: string) => Promise<void>;
  removeDeviceFromRoom: (roomId: string, deviceId: string) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
  updateLocalUser: (updates: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const showToast = (title: string, message?: string) => {
  Alert.alert(title, message);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setDarkMode } = useStore();

  const processUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
    try {
      const basicUserData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        role: 'user' as const,
        photoURL: firebaseUser.photoURL || undefined,
      };

      try {
        const existingUser = await userService.getUser(firebaseUser.uid);
        if (existingUser) {
          const freshPhoto = firebaseUser.photoURL || undefined;
          if (freshPhoto && existingUser.photoURL !== freshPhoto) {
            try { await userService.updateUser(firebaseUser.uid, { photoURL: freshPhoto }); } catch {}
          }
          return { ...existingUser, photoURL: freshPhoto || existingUser.photoURL };
        } else {
          const newUser = {
            id: firebaseUser.uid,
            name: basicUserData.name,
            email: basicUserData.email,
            role: basicUserData.role,
            ...(basicUserData.photoURL ? { photoURL: basicUserData.photoURL } : {}),
            theme: 'light' as const,
            deviceIds: [],
            roomIds: [],
          };
          await userService.createUser(newUser);
          setDarkMode(false);
          return newUser;
        }
      } catch {
        return { ...basicUserData, theme: 'light', deviceIds: [], roomIds: [] } as User;
      }
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    let unsubscribed = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribed) return;
      try {
        if (firebaseUser) {
          try {
            const userData = await processUserData(firebaseUser);
            setUser(userData);
            if (userData.theme) setDarkMode(userData.theme === 'dark');
          } catch {
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'user',
              photoURL: firebaseUser.photoURL || undefined,
              theme: 'light',
            });
            setDarkMode(false);
          }
        } else {
          setUser(null);
        }
      } catch { setUser(null); }
      finally { if (!unsubscribed) setIsLoading(false); }
    }, () => { setIsLoading(false); setUser(null); });

    const timeout = setTimeout(() => { if (!unsubscribed) setIsLoading(false); }, 5000);
    return () => { unsubscribed = true; clearTimeout(timeout); unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await logUserLogin(cred.user.uid, cred.user.displayName || email, 'email');
    } catch (error: any) {
      showToast('Login failed', error.message || 'Something went wrong');
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, googleProvider);
      await logUserLogin(cred.user.uid, cred.user.displayName || cred.user.email || 'User', 'google');
    } catch (error: any) {
      showToast('Google login failed', error.message || 'Something went wrong');
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const newUser = {
        id: cred.user.uid, name, email,
        role: 'user' as const,
        theme: 'light' as const,
        deviceIds: [], roomIds: [],
      };
      await userService.createUser(newUser);
      setUser(newUser);
      setDarkMode(false);
    } catch (error: any) {
      showToast('Registration failed', error.message || 'Something went wrong');
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user) await logUserLogout(user.id, user.name);
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      showToast('Logout failed', error.message);
    }
  };

  const isAdmin = () => user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = () => user?.role === 'superadmin';

  const addDevice = async (device: any): Promise<string> => {
    if (!user) throw new Error('Not logged in');
    try {
      const deviceId = await deviceService.createDevice({ ...device, userId: user.id, isOnline: false, currentValue: 0 });
      await iotControlService.initializeDeviceState(deviceId, device.roomId, 0);
      await logUserAction({ userId: user.id, userName: user.name, action: 'DEVICE_ADDED', details: `Added device: ${device.name}`, metadata: { deviceId, deviceName: device.name } });
      return deviceId;
    } catch (error: any) { showToast('Error adding device', error.message); throw error; }
  };

  const updateDevice = async (deviceId: string, data: any) => {
    if (!user) throw new Error('Not logged in');
    try { await deviceService.updateDevice(deviceId, data); }
    catch (error: any) { showToast('Error updating device', error.message); throw error; }
  };

  const removeDevice = async (deviceId: string) => {
    if (!user) throw new Error('Not logged in');
    try {
      const d = await deviceService.getDevice(deviceId);
      await deviceService.deleteDevice(deviceId, user.id);
      if (d?.roomId) await iotControlService.setDeviceOffline(deviceId, d.roomId);
      if (d) await logUserAction({ userId: user.id, userName: user.name, action: 'DEVICE_REMOVED', details: `Removed device: ${d.name}`, metadata: { deviceId } });
    } catch (error: any) { showToast('Error removing device', error.message); throw error; }
  };

  const controlDevice = async (deviceId: string, status: any) => {
    if (!user) throw new Error('Not logged in');
    try {
      const device = await deviceService.getDevice(deviceId);
      if (typeof status === 'number') {
        if (status === 0 || status === 1) await iotControlService.toggleDevice(deviceId, user.id, device?.roomId, status);
        else await iotControlService.setDeviceValue(deviceId, status, user.id, device?.roomId);
      }
      await deviceService.updateDevice(deviceId, { currentValue: status, isOnline: true });
    } catch (error: any) { showToast('Error controlling device', error.message); throw error; }
  };

  const addRoom = async (room: any): Promise<string> => {
    if (!user) throw new Error('Not logged in');
    try {
      const roomId = await roomService.createRoom({ ...room, userId: user.id, deviceIds: [] });
      await logUserAction({ userId: user.id, userName: user.name, action: 'ROOM_ADDED', details: `Added room: ${room.name}`, metadata: { roomId, roomName: room.name } });
      return roomId;
    } catch (error: any) { showToast('Error adding room', error.message); throw error; }
  };

  const updateRoom = async (roomId: string, data: any) => {
    if (!user) throw new Error('Not logged in');
    try { await roomService.updateRoom(roomId, data); }
    catch (error: any) { showToast('Error updating room', error.message); throw error; }
  };

  const removeRoom = async (roomId: string) => {
    if (!user) throw new Error('Not logged in');
    try {
      const r = await roomService.getRoom(roomId);
      await roomService.deleteRoom(roomId);
      if (r) await logUserAction({ userId: user.id, userName: user.name, action: 'ROOM_REMOVED', details: `Removed room: ${r.name}`, metadata: { roomId } });
    } catch (error: any) { showToast('Error removing room', error.message); throw error; }
  };

  const addDeviceToRoom = async (roomId: string, deviceId: string) => {
    if (!user) throw new Error('Not logged in');
    try { await roomService.addDeviceToRoom(roomId, deviceId); }
    catch (error: any) { showToast('Error', error.message); throw error; }
  };

  const removeDeviceFromRoom = async (roomId: string, deviceId: string) => {
    if (!user) throw new Error('Not logged in');
    try { await roomService.removeDeviceFromRoom(roomId, deviceId); }
    catch (error: any) { showToast('Error', error.message); throw error; }
  };

  const updateTheme = async (theme: 'light' | 'dark') => {
    if (!user) throw new Error('Not logged in');
    try {
      await userService.updateUser(user.id, { theme });
      setDarkMode(theme === 'dark');
      setUser(prev => prev ? { ...prev, theme } : null);
    } catch (error: any) { showToast('Error updating theme', error.message); throw error; }
  };

  const updateLocalUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      setUser(prev => prev ? { ...prev, ...updates } : null);
      await userService.updateUser(user.id, updates);
    } catch { showToast('Error', 'Could not save profile changes'); }
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, loginWithGoogle, signup, logout,
      isAdmin, isSuperAdmin,
      addDevice, updateDevice, removeDevice, controlDevice,
      addRoom, updateRoom, removeRoom, addDeviceToRoom, removeDeviceFromRoom,
      updateTheme, updateLocalUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
