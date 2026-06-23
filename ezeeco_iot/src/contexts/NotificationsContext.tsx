import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types/notification';

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
  error: string | null;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (!user) { setNotifications([]); setLoading(false); return; }
    setLoading(true);
    try {
      unsubscribe = notificationService.subscribeToNotifications(
        user.id,
        (updated) => { setNotifications(updated); setLoading(false); },
        (err) => { console.error('Notification error:', err); setError('Failed to load notifications'); setLoading(false); }
      );
    } catch { setError('Failed to connect'); setLoading(false); }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await notificationService.markAsRead(user.id, notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch { setError('Failed to update notification'); }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { setError('Failed to update notifications'); }
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading, error }}>
      {children}
    </NotificationsContext.Provider>
  );
};
