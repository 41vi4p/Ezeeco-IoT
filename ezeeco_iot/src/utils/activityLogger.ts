import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import { firestore } from '@/lib/firebase';

export interface ActivityLog {
  id?: string;
  userId: string;
  userName?: string;
  action: string;
  details: string;
  timestamp: Timestamp;
  category: 'USER' | 'DEVICE' | 'ROOM' | 'SECURITY' | 'SYSTEM';
  metadata?: Record<string, any>;
  deviceInfo?: { platform: string };
}

export const ACTION_TYPES = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  DELETE_ACCOUNT_ATTEMPT: 'DELETE_ACCOUNT_ATTEMPT',
  VIEW_PRIVACY_SETTINGS: 'VIEW_PRIVACY_SETTINGS',
  UPDATE_PRIVACY_SETTING: 'UPDATE_PRIVACY_SETTING',
  UPDATE_SECURITY_SETTING: 'UPDATE_SECURITY_SETTING',
  EXPORT_USER_DATA: 'EXPORT_USER_DATA',
  DEVICE_TOGGLE: 'DEVICE_TOGGLE',
  DEVICE_SET_VALUE: 'DEVICE_SET_VALUE',
  DEVICE_CREATE: 'DEVICE_CREATE',
  DEVICE_UPDATE: 'DEVICE_UPDATE',
  DEVICE_DELETE: 'DEVICE_DELETE',
  DEVICE_ADDED: 'DEVICE_ADDED',
  DEVICE_REMOVED: 'DEVICE_REMOVED',
  DEVICE_CONTROL: 'DEVICE_CONTROL',
  ROOM_CREATE: 'ROOM_CREATE',
  ROOM_UPDATE: 'ROOM_UPDATE',
  ROOM_DELETE: 'ROOM_DELETE',
  ROOM_JOIN: 'ROOM_JOIN',
  ROOM_LEAVE: 'ROOM_LEAVE',
  ROOM_VIEW: 'ROOM_VIEW',
  ROOM_ADDED: 'ROOM_ADDED',
  ROOM_REMOVED: 'ROOM_REMOVED',
  SECURITY_ALERT: 'SECURITY_ALERT',
  FAILED_LOGIN: 'FAILED_LOGIN',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  APP_OPEN: 'APP_OPEN',
  APP_CLOSE: 'APP_CLOSE',
  PAGE_VIEW: 'PAGE_VIEW',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
} as const;

const categorizeAction = (action: string): ActivityLog['category'] => {
  if (action.startsWith('USER_') || action.includes('PROFILE') || action.includes('PASSWORD') || action.includes('PRIVACY') || action.includes('SECURITY_SETTING')) return 'USER';
  if (action.startsWith('DEVICE_')) return 'DEVICE';
  if (action.startsWith('ROOM_')) return 'ROOM';
  if (action.includes('SECURITY') || action.includes('FAILED_LOGIN') || action.includes('SUSPICIOUS')) return 'SECURITY';
  return 'SYSTEM';
};

const stripUndefined = (obj: Record<string, any>): Record<string, any> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export const logUserAction = async (logData: {
  userId: string;
  userName?: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
}): Promise<string | null> => {
  try {
    const activityLog: Record<string, any> = {
      userId: logData.userId,
      action: logData.action,
      details: logData.details,
      timestamp: Timestamp.now(),
      category: categorizeAction(logData.action),
      deviceInfo: { platform: Platform.OS },
    };
    if (logData.userName !== undefined) activityLog.userName = logData.userName;
    if (logData.metadata) activityLog.metadata = stripUndefined(logData.metadata);
    const docRef = await addDoc(collection(firestore, 'activityLogs'), activityLog);
    return docRef.id;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

export const logUserLogin = (userId: string, userName: string, method: 'email' | 'google' = 'email') =>
  logUserAction({ userId, userName, action: ACTION_TYPES.USER_LOGIN, details: `User logged in using ${method}`, metadata: { loginMethod: method } });

export const logUserLogout = (userId: string, userName: string) =>
  logUserAction({ userId, userName, action: ACTION_TYPES.USER_LOGOUT, details: 'User logged out' });

export const logDeviceAction = (userId: string, userName: string, deviceId: string, deviceName: string, action: 'toggle' | 'setValue' | 'create' | 'update' | 'delete', value?: any) => {
  const actionMap = { toggle: ACTION_TYPES.DEVICE_TOGGLE, setValue: ACTION_TYPES.DEVICE_SET_VALUE, create: ACTION_TYPES.DEVICE_CREATE, update: ACTION_TYPES.DEVICE_UPDATE, delete: ACTION_TYPES.DEVICE_DELETE };
  return logUserAction({ userId, userName, action: actionMap[action], details: `${action} device: ${deviceName}`, metadata: { deviceId, deviceName, action, value } });
};

export const logRoomAction = (userId: string, userName: string, roomId: string, roomName: string, action: 'create' | 'update' | 'delete' | 'join' | 'leave' | 'view') => {
  const actionMap = { create: ACTION_TYPES.ROOM_CREATE, update: ACTION_TYPES.ROOM_UPDATE, delete: ACTION_TYPES.ROOM_DELETE, join: ACTION_TYPES.ROOM_JOIN, leave: ACTION_TYPES.ROOM_LEAVE, view: ACTION_TYPES.ROOM_VIEW };
  return logUserAction({ userId, userName, action: actionMap[action], details: `${action} room: ${roomName}`, metadata: { roomId, roomName, action } });
};

export const getActivityLogs = async (userId: string, limitCount = 50, category?: ActivityLog['category']): Promise<ActivityLog[]> => {
  try {
    const constraints: any[] = [where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(limitCount)];
    if (category) constraints.splice(1, 0, where('category', '==', category));
    const q = query(collection(firestore, 'activityLogs'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityLog[];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};

export const getAllActivityLogs = async (limitCount = 100): Promise<ActivityLog[]> => {
  try {
    const q = query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityLog[];
  } catch (error) {
    return [];
  }
};

export const formatLogTimestamp = (timestamp: any): string => {
  try {
    let date: Date;
    if (timestamp?.toDate) date = timestamp.toDate();
    else if (timestamp?.seconds) date = new Date(timestamp.seconds * 1000);
    else date = new Date(timestamp);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return 'Unknown time'; }
};

export const getActionIcon = (action: string): string => {
  const iconMap: Record<string, string> = {
    [ACTION_TYPES.USER_LOGIN]: '🔑', [ACTION_TYPES.USER_LOGOUT]: '🚪', [ACTION_TYPES.USER_REGISTER]: '👤',
    [ACTION_TYPES.UPDATE_PROFILE]: '✏️', [ACTION_TYPES.CHANGE_PASSWORD]: '🔒',
    [ACTION_TYPES.DEVICE_TOGGLE]: '🔄', [ACTION_TYPES.DEVICE_SET_VALUE]: '⚙️', [ACTION_TYPES.DEVICE_CREATE]: '➕',
    [ACTION_TYPES.DEVICE_UPDATE]: '🔧', [ACTION_TYPES.DEVICE_DELETE]: '🗑️',
    [ACTION_TYPES.ROOM_CREATE]: '🏠', [ACTION_TYPES.ROOM_JOIN]: '🚪', [ACTION_TYPES.ROOM_LEAVE]: '🚪',
    [ACTION_TYPES.SECURITY_ALERT]: '🚨', [ACTION_TYPES.FAILED_LOGIN]: '❌',
  };
  return iconMap[action] || '📝';
};
