import { collection, query, where, orderBy, addDoc, updateDoc, doc, getDoc, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Notification, NotificationType } from '@/types/notification';

class NotificationService {
  private readonly collectionName = 'notifications';

  subscribeToNotifications(
    userId: string,
    onUpdate: (notifications: Notification[]) => void,
    onError: (error: any) => void
  ): () => void {
    const q = query(
      collection(firestore, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type as NotificationType,
          read: data.read,
          data: data.data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          entityId: data.entityId,
          entityType: data.entityType,
          action: data.action,
        };
      });
      onUpdate(notifications);
    }, onError);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const q = query(collection(firestore, this.collectionName), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type as NotificationType,
        read: data.read,
        data: data.data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        entityId: data.entityId,
        entityType: data.entityType,
        action: data.action,
      };
    });
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const ref = await addDoc(collection(firestore, this.collectionName), {
        ...notification,
        createdAt: new Date(),
      });
      return ref.id;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const ref = doc(firestore, this.collectionName, notificationId);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data()?.userId !== userId) throw new Error('Unauthorized');
    await updateDoc(ref, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const q = query(collection(firestore, this.collectionName), where('userId', '==', userId), where('read', '==', false));
    const batch = writeBatch(firestore);
    const snap = await getDocs(q);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }

  async createRoomJoinNotification(ownerId: string, roomId: string, roomName: string, memberId: string, memberName: string): Promise<string> {
    return this.createNotification({
      userId: ownerId,
      title: 'New Room Member',
      message: `${memberName} joined your room "${roomName}"`,
      type: 'info',
      read: false,
      entityId: roomId,
      entityType: 'room',
      data: { roomId, roomName, memberId, memberName },
      action: { label: 'View Room', url: `/room/${roomId}` },
    });
  }

  async createRoomRemovalNotification(userId: string, roomId: string, roomName: string, removedByUserId: string, removedByUserName: string): Promise<string> {
    return this.createNotification({
      userId,
      title: 'Room Membership Ended',
      message: removedByUserId === userId ? `You left room "${roomName}"` : `You were removed from room "${roomName}" by ${removedByUserName}`,
      type: 'info',
      read: false,
      entityId: roomId,
      entityType: 'room',
      data: { roomId, roomName, removedBy: removedByUserId, removedByName: removedByUserName },
      action: { label: 'View Rooms', url: '/rooms' },
    });
  }
}

export const notificationService = new NotificationService();
