import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  writeBatch,
  limit,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { firestore, database } from '@/lib/firebase';
import { ref, remove } from 'firebase/database';
import { logUserAction } from '@/utils/activityLogger';
import { notificationService } from '@/services/notificationService';

// Type definitions
export interface Device {
  id: string;
  name: string;
  brand: string;
  category: string;
  icon: string;
  type: 'lights' | 'thermostats' | 'speakers' | 'cameras' | 'locks' | 'plugs' | 'custom';
  controlType: 'toggle' | 'range' | 'multi-button' | 'custom';
  customProperties?: {
    ipAddress?: string;
    description?: string;
    controlEndpoint?: string;
    brightness?: number;
    minValue?: number;
    maxValue?: number;
  };
  roomId?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isOnline: boolean;
  currentValue?: number | string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  icon: string;
  userId: string; // primary owner
  deviceIds: string[];
  joinCode?: string; // 6-digit unique code for others to join
  members?: {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Timestamp;
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  photoURL?: string;
  theme?: 'light' | 'dark';
  deviceIds: string[];
  roomIds: string[];
  pinnedDeviceIds?: string[]; // Add pinned devices for Quick Access
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Restructured Device Log for Firestore
export interface DeviceLog {
  id: string;
  deviceId: string;
  deviceName: string;
  roomId: string; // Required for all device logs
  roomName: string;
  userId: string;
  userName: string;
  action: string;
  value?: number | string;
  previousValue?: number | string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

export interface DeletedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  photoURL?: string;
  deviceIds: string[];
  roomIds: string[];
  createdAt: Timestamp;
  deletedAt: Timestamp;
  metadata?: Record<string, any>;
}

// Device Management
export const deviceService = {
  // Create a new device - always requires a roomId
  async createDevice(deviceData: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Ensure device has a roomId
      if (!deviceData.roomId) {
        throw new Error('Device must be assigned to a room');
      }
      
      const docRef = await addDoc(collection(firestore, 'devices'), {
        ...deviceData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Update user's deviceIds
      await this.addDeviceToUser(deviceData.userId, docRef.id);
      
      // Also add device to the specified room
      await roomService.addDeviceToRoom(deviceData.roomId, docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  },

  // Get device by ID
  async getDevice(deviceId: string): Promise<Device | null> {
    try {
      const docRef = doc(firestore, 'devices', deviceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Device;
      }
      return null;
    } catch (error) {
      console.error('Error getting device:', error);
      throw error;
    }
  },

  // Get all devices for a user
  async getUserDevices(userId: string): Promise<Device[]> {
    try {
      const q = query(
        collection(firestore, 'devices'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const devices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Device[];
      // Sort client-side — avoids requiring a composite Firestore index
      return devices.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
    } catch (error) {
      console.error('Error getting user devices:', error);
      return [];
    }
  },

  async getRoomDevices(roomId: string): Promise<Device[]> {
    try {
      const q = query(
        collection(firestore, 'devices'),
        where('roomId', '==', roomId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Device[];
    } catch (error) {
      console.error('Error getting room devices:', error);
      throw error;
    }
  },

  // Get all devices accessible to a user (owned devices + devices from joined rooms)
  async getUserAccessibleDevices(userId: string): Promise<Device[]> {
    try {
      // Get all rooms the user has access to
      const userRooms = await roomService.getUserRooms(userId);
      
      // Get all device IDs from these rooms
      const allDeviceIds = new Set<string>();
      userRooms.forEach(room => {
        room.deviceIds?.forEach(deviceId => allDeviceIds.add(deviceId));
      });
      
      if (allDeviceIds.size === 0) {
        return [];
      }
      
      // Fetch all devices from these IDs
      const devices: Device[] = [];
      const deviceIdArray = Array.from(allDeviceIds);
      
      // Firestore 'in' queries are limited to 10 items, so we need to batch
      const batchSize = 10;
      for (let i = 0; i < deviceIdArray.length; i += batchSize) {
        const batch = deviceIdArray.slice(i, i + batchSize);
        const q = query(
          collection(firestore, 'devices'),
          where('__name__', 'in', batch),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const batchDevices = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Device[];
        
        devices.push(...batchDevices);
      }
      
      return devices;
    } catch (error) {
      console.error('Error getting user accessible devices:', error);
      throw error;
    }
  },

  // Update device
  async updateDevice(deviceId: string, updates: Partial<Device>): Promise<void> {
    try {
      const docRef = doc(firestore, 'devices', deviceId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  },

  // Delete device
  async deleteDevice(deviceId: string, userId: string): Promise<void> {
    // Get device info first to know which room it belongs to
    let roomId: string | undefined;
    try {
      const docSnap = await getDoc(doc(firestore, 'devices', deviceId));
      if (docSnap.exists()) roomId = docSnap.data().roomId;
    } catch { /* ignore — proceed with deletion even if we can't read */ }

    // Remove from Firestore devices collection
    await deleteDoc(doc(firestore, 'devices', deviceId));

    // Remove from room's deviceIds array (best-effort)
    if (roomId) {
      try {
        await setDoc(
          doc(firestore, 'rooms', roomId),
          { deviceIds: arrayRemove(deviceId), updatedAt: Timestamp.now() },
          { merge: true }
        );
        await remove(ref(database, `rooms/${roomId}/devices/${deviceId}`));
      } catch { /* non-fatal */ }
    }

    // Remove from user's deviceIds array (best-effort)
    try {
      await setDoc(
        doc(firestore, 'users', userId),
        { deviceIds: arrayRemove(deviceId), updatedAt: Timestamp.now() },
        { merge: true }
      );
    } catch { /* non-fatal */ }

    // Clean up Realtime Database entries (best-effort)
    try { await remove(ref(database, `users/${userId}/devices/${deviceId}`)); } catch { }
    try { await remove(ref(database, `devices/${deviceId}`)); } catch { }
  },

  // Add device to user's list
  async addDeviceToUser(userId: string, deviceId: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentDeviceIds = userData.deviceIds || [];
        
        if (!currentDeviceIds.includes(deviceId)) {
          await updateDoc(userRef, {
            deviceIds: [...currentDeviceIds, deviceId],
            updatedAt: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error('Error adding device to user:', error);
      throw error;
    }
  },

  // Remove device from user's list
  async removeDeviceFromUser(userId: string, deviceId: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentDeviceIds = userData.deviceIds || [];
        
        await updateDoc(userRef, {
          deviceIds: currentDeviceIds.filter((id: string) => id !== deviceId),
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error removing device from user:', error);
      throw error;
    }
  },

  // Listen to device changes
  subscribeToUserDevices(userId: string, callback: (devices: Device[]) => void) {
    const q = query(
      collection(firestore, 'devices'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const devices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Device[];
      callback(devices);
    });
  }
};

// Room Management
export const roomService = {
  // Create a new room with a unique 6-digit join code
  async createRoom(roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'joinCode'>): Promise<string> {
    try {
      // Generate a guaranteed unique 6-digit join code
      const joinCode = await this.generateUniqueJoinCode();
      
      // Add owner as the first member
      const members = roomData.members || [{
        id: roomData.userId,
        name: 'Owner',
        email: '',
        role: 'owner',
        joinedAt: Timestamp.now()
      }];

      const docRef = await addDoc(collection(firestore, 'rooms'), {
        ...roomData,
        members,
        joinCode,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Update user's roomIds
      await this.addRoomToUser(roomData.userId, docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  // Generate a unique 6-digit join code that is checked against existing codes
  async generateUniqueJoinCode(): Promise<string> {
    // Try up to 10 times to generate a unique code
    for (let attempt = 0; attempt < 10; attempt++) {
      // Generate a random 6-digit number
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if this code already exists
      const existingRoom = await this.getRoomByJoinCode(code);
      
      if (!existingRoom) {
        return code; // Code is unique, return it
      }
    }
    
    // If we've tried 10 times and still can't find a unique code,
    // create a truly unique one based on timestamp and a random number
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return (timestamp.slice(0, 3) + randomPart.slice(0, 3)).slice(0, 6);
  },

  // Join a room using a join code
  async joinRoomByCode(joinCode: string, userId: string, userName: string, userEmail: string): Promise<Room | null | { alreadyMember: true, room: Room }> {
    try {
      // Find the room with this join code
      const q = query(
        collection(firestore, 'rooms'),
        where('joinCode', '==', joinCode)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null; // Room not found
      }
      
      const roomDoc = querySnapshot.docs[0];
      const roomId = roomDoc.id;
      const roomData = roomDoc.data() as Room;
      
      // Check if user is already a member
      const members = roomData.members || [];
      if (members.some(member => member.id === userId)) {
        // User is already a member, return special object indicating this
        return { 
          alreadyMember: true,
          room: { id: roomId, ...roomData }
        };
      }
      
      // Add user to room members
      const updatedMembers = [
        ...members,
        {
          id: userId,
          name: userName,
          email: userEmail,
          role: 'member' as 'owner' | 'admin' | 'member',
          joinedAt: Timestamp.now()
        }
      ];
      
      // Update the room
      await updateDoc(doc(firestore, 'rooms', roomId), {
        members: updatedMembers,
        updatedAt: Timestamp.now()
      });
      
      // Add room to user's roomIds
      await this.addRoomToUser(userId, roomId);
      
      // Find the room owner to send notification
      const owner = members.find(member => member.role === 'owner');
      if (owner) {
        try {
          // Send notification to the room owner
          await notificationService.createRoomJoinNotification(
            owner.id,
            roomId,
            roomData.name,
            userId,
            userName
          );
          
          console.log(`Notification sent to room owner ${owner.id} about new member join`);
        } catch (notificationError) {
          console.error('Failed to send room join notification:', notificationError);
        }
      } else {
        console.warn(`Could not find owner for room ${roomId} to send notification. Members:`, members);
      }
      
      return { id: roomId, ...roomData, members: updatedMembers };
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  },

  // Get room by join code
  async getRoomByJoinCode(joinCode: string): Promise<Room | null> {
    try {
      const q = query(
        collection(firestore, 'rooms'),
        where('joinCode', '==', joinCode)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const roomDoc = querySnapshot.docs[0];
      return { id: roomDoc.id, ...roomDoc.data() } as Room;
    } catch (error) {
      console.error('Error getting room by join code:', error);
      throw error;
    }
  },

  // Get room by ID
  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const docRef = doc(firestore, 'rooms', roomId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Room;
      }
      return null;
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  },

  // Get all rooms for a user (including rooms they're a member of)
  async getUserRooms(userId: string): Promise<Room[]> {
    try {
      // Get rooms where user is the owner (no orderBy — avoids composite index requirement)
      const ownerQuery = query(
        collection(firestore, 'rooms'),
        where('userId', '==', userId)
      );

      const ownerSnapshot = await getDocs(ownerQuery);
      const ownerRooms = ownerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];

      // Then get rooms where user is a member
      const memberQuery = query(
        collection(firestore, 'rooms'),
        where('members', 'array-contains', { id: userId })
      );
      
      try {
        const memberSnapshot = await getDocs(memberQuery);
        const memberRooms = memberSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Room[];
        
        // Combine and deduplicate
        const allRooms = [...ownerRooms];
        memberRooms.forEach(room => {
          if (!allRooms.some(r => r.id === room.id)) {
            allRooms.push(room);
          }
        });
        
        return allRooms;
      } catch (error) {
        // If the array-contains query fails, fall back to a more manual approach
        console.warn('Falling back to manual member check:', error);
        
        // Get all rooms and filter manually (no orderBy to avoid index requirement)
        const allRoomsQuery = query(
          collection(firestore, 'rooms')
        );
        
        const allRoomsSnapshot = await getDocs(allRoomsQuery);
        const allRooms = allRoomsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Room[];
        
        // Filter rooms where user is a member
        const memberRooms = allRooms.filter(room => 
          room.members?.some(member => member.id === userId)
        );
        
        // Combine with owner rooms and deduplicate
        const combinedRooms = [...ownerRooms];
        memberRooms.forEach(room => {
          if (!combinedRooms.some(r => r.id === room.id)) {
            combinedRooms.push(room);
          }
        });
        
        return combinedRooms;
      }
    } catch (error) {
      console.error('Error getting user rooms:', error);
      throw error;
    }
  },

  // Get rooms where user is the owner
  async getUserOwnedRooms(userId: string): Promise<Room[]> {
    try {
      const q = query(
        collection(firestore, 'rooms'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
    } catch (error) {
      console.error('Error getting user owned rooms:', error);
      throw error;
    }
  },
  
  // Get rooms where user is a member but not owner
  async getUserMemberRooms(userId: string): Promise<Room[]> {
    try {
      // Get all rooms
      const allRoomsQuery = query(
        collection(firestore, 'rooms'),
        orderBy('createdAt', 'desc')
      );
      
      const allRoomsSnapshot = await getDocs(allRoomsQuery);
      const allRooms = allRoomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      
      // Filter rooms where user is a member but not the owner
      return allRooms.filter(room => 
        room.userId !== userId && // Not the owner
        room.members?.some(member => member.id === userId) // Is a member
      );
    } catch (error) {
      console.error('Error getting user member rooms:', error);
      throw error;
    }
  },
  
  // Transfer room ownership to another member
  async transferRoomOwnership(roomId: string, currentOwnerId: string): Promise<void> {
    try {
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        const members = roomData.members || [];
        
        if (members.length <= 1) {
          // If no other members, just delete the room
          await this.deleteRoom(roomId);
          return;
        }
        
        // Find members who are not the current owner
        const otherMembers = members.filter(member => member.id !== currentOwnerId);
        
        // Find an admin to transfer to, or take the first member
        const newOwner = otherMembers.find(member => member.role === 'admin') || otherMembers[0];
        
        // Update member roles
        const updatedMembers = members.map(member => {
          if (member.id === newOwner.id) {
            return { ...member, role: 'owner' as 'owner' | 'admin' | 'member' };
          }
          return member;
        }).filter(member => member.id !== currentOwnerId); // Remove the current owner
        
        // Update room with new owner
        await updateDoc(roomRef, {
          userId: newOwner.id, // Set new owner as the primary owner
          members: updatedMembers,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error transferring room ownership:', error);
      throw error;
    }
  },

  // Update room
  async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
    try {
      const docRef = doc(firestore, 'rooms', roomId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },

  // Get room join code (join codes are now permanent and cannot be regenerated)
  async getRoomJoinCode(roomId: string): Promise<string | null> {
    try {
      const roomData = await this.getRoom(roomId);
      return roomData?.joinCode || null;
    } catch (error) {
      console.error('Error getting room join code:', error);
      throw error;
    }
  },

  // Add device to room
  async addDeviceToRoom(roomId: string, deviceId: string): Promise<void> {
    try {
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        const currentDeviceIds = roomData.deviceIds || [];
        
        if (!currentDeviceIds.includes(deviceId)) {
          await updateDoc(roomRef, {
            deviceIds: [...currentDeviceIds, deviceId],
            updatedAt: Timestamp.now()
          });
          
          // Update device's roomId
          await deviceService.updateDevice(deviceId, { roomId });
        }
      }
    } catch (error) {
      console.error('Error adding device to room:', error);
      throw error;
    }
  },

  // Remove device from room and move it to another room (devices cannot exist without a room)
  async removeDeviceFromRoom(roomId: string, deviceId: string, newRoomId?: string): Promise<void> {
    try {
      // Ensure a new room is provided
      if (!newRoomId) {
        throw new Error('Devices must be moved to another room. They cannot exist outside a room.');
      }
      
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        const currentDeviceIds = roomData.deviceIds || [];
        
        await updateDoc(roomRef, {
          deviceIds: currentDeviceIds.filter((id: string) => id !== deviceId),
          updatedAt: Timestamp.now()
        });
        
        // Update device's roomId to the new room
        await deviceService.updateDevice(deviceId, { roomId: newRoomId });
        
        // Add device to the new room
        await this.addDeviceToRoom(newRoomId, deviceId);
      }
    } catch (error) {
      console.error('Error removing device from room:', error);
      throw error;
    }
  },

  // Add room to user's list
  async addRoomToUser(userId: string, roomId: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentRoomIds = userData.roomIds || [];
        
        if (!currentRoomIds.includes(roomId)) {
          await updateDoc(userRef, {
            roomIds: [...currentRoomIds, roomId],
            updatedAt: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error('Error adding room to user:', error);
      throw error;
    }
  },

  // Delete room
  async deleteRoom(roomId: string): Promise<void> {
    try {
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        
        // Get all members
        const members = roomData.members || [];
        
        // Remove room from all members' roomIds
        const batch = writeBatch(firestore);
        
        for (const member of members) {
          const userRef = doc(firestore, 'users', member.id);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentRoomIds = userData.roomIds || [];
            batch.update(userRef, {
              roomIds: currentRoomIds.filter((id: string) => id !== roomId),
              updatedAt: Timestamp.now()
            });
          }
        }
        
        // We need to handle devices in this room before deleting
        if (roomData.deviceIds && roomData.deviceIds.length > 0) {
          // For each device, we need to either move it to another room or delete it
          // Here we choose to delete the devices as they can't exist without a room
          for (const deviceId of roomData.deviceIds) {
            // Delete each device from Firestore
            const deviceRef = doc(firestore, 'devices', deviceId);
            batch.delete(deviceRef);
            
            // Remove the device from user's deviceIds
            const device = await deviceService.getDevice(deviceId);
            if (device && device.userId) {
              const userRef = doc(firestore, 'users', device.userId);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const currentDeviceIds = userData.deviceIds || [];
                batch.update(userRef, {
                  deviceIds: currentDeviceIds.filter((id: string) => id !== deviceId),
                  updatedAt: Timestamp.now()
                });
              }
            }
          }
        }
        
        // Commit the batch
        await batch.commit();
        
        // Delete the room document
        await deleteDoc(roomRef);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  },

  // Listen to room changes
  subscribeToUserRooms(userId: string, callback: (rooms: Room[]) => void) {
    const q = query(
      collection(firestore, 'rooms'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const rooms = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      callback(rooms);
    });
  },

  // Remove member from a room
  async removeMemberFromRoom(roomId: string, memberId: string, memberName?: string, removedById?: string, removedByName?: string): Promise<void> {
    try {
      // Production: removed debug log;
      // Production: removed debug log;
      
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        const members = roomData.members || [];
        
        // Get member info for logging
        const memberToRemove = members.find((member: any) => member.id === memberId);
        const memberDisplayName = memberName || memberToRemove?.name || 'Unknown User';
        
        // Production: removed debug log;
        
        // Filter out the member to remove
        const updatedMembers = members.filter((member: any) => member.id !== memberId);
        
        await updateDoc(roomRef, {
          members: updatedMembers,
          updatedAt: Timestamp.now()
        });
        
        // Production: removed debug log;
        
        // Remove room from user's roomIds
        const userRef = doc(firestore, 'users', memberId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentRoomIds = userData.roomIds || [];
          
          await updateDoc(userRef, {
            roomIds: currentRoomIds.filter((id: string) => id !== roomId),
            updatedAt: Timestamp.now()
          });
          
          // Production: removed debug log;
          
          // Remove room from user_rooms subcollection if it exists
          try {
            const userRoomRef = doc(firestore, 'users', memberId, 'user_rooms', roomId);
            const userRoomDoc = await getDoc(userRoomRef);
            
            if (userRoomDoc.exists()) {
              await deleteDoc(userRoomRef);
              // Production: removed debug log;
            }
          } catch (error) {
            console.error('[ERROR] Failed to remove room from user_rooms subcollection:', error);
          }
        }
        
        // Log the room leave action
        try {
          await logUserAction({
            userId: memberId,
            userName: memberDisplayName,
            action: 'ROOM_LEAVE',
            details: `Left room "${roomData.name}"`,
            metadata: {
              roomId,
              roomName: roomData.name,
              removedBy: memberId === (removedById || '') ? 'self' : 'admin',
              remainingMembers: updatedMembers.length
            }
          });
          // Production: removed debug log;
        } catch (logError) {
          console.warn('[WARN] Failed to log room leave action:', logError);
        }
        
        // Send notification to the removed user - With extra care to prevent failures
        try {
          // Validate parameters
          if (!memberId) {
            console.error('[ERROR] Cannot create notification: Missing memberId');
            throw new Error('Missing memberId for notification');
          }
          
          // Get the user who performed the removal
          const removerId = removedById || memberId; // If no remover ID provided, assume self-removal
          const removerName = removedByName || (removerId === memberId ? memberDisplayName : 'Admin');
          
          // Create the notification with explicit try/catch
          try {
            const notificationId = await notificationService.createRoomRemovalNotification(
              memberId,
              roomId,
              roomData.name,
              removerId,
              removerName
            );
            
            console.log(`[SUCCESS] Created room removal notification ${notificationId} for user ${memberId}`);
          } catch (createError) {
            console.error('[ERROR] Failed to create notification object:', createError);
            throw createError;
          }
        } catch (notificationError) {
          console.error('[ERROR] Failed to send room removal notification:', notificationError);
          // Detailed error logging
          console.error('Notification error details:', {
            memberId,
            roomId,
            roomName: roomData.name,
            error: notificationError instanceof Error ? notificationError.message : String(notificationError),
            stack: notificationError instanceof Error ? notificationError.stack : undefined
          });
        }
      }
    } catch (error) {
      console.error('Error removing member from room:', error);
      throw error;
    }
  },

  // Update member role in a room
  async updateMemberRole(roomId: string, memberId: string, newRole: 'owner' | 'admin' | 'member'): Promise<void> {
    try {
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        const members = roomData.members || [];
        
        // Update the role of the specified member
        const updatedMembers = members.map((member: any) => {
          if (member.id === memberId) {
            return { ...member, role: newRole };
          }
          return member;
        });
        
        await updateDoc(roomRef, {
          members: updatedMembers,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }
};

// User Management
export const userService = {
  // Create or update user
  async createOrUpdateUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userData.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          ...userData,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new user
        await setDoc(userRef, {
          ...userData,
          deviceIds: userData.deviceIds || [],
          roomIds: userData.roomIds || [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  },

  // Create user (alias for createOrUpdateUser for new users)
  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
    return this.createOrUpdateUser(userData);
  },

  // Update user
  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(firestore, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Add a method to archive a user before deletion
  async archiveDeletedUser(userId: string): Promise<void> {
    try {
      // Get current user data
      const user = await this.getUser(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Create archived user entry
      const deletedUserData: DeletedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        deviceIds: user.deviceIds || [],
        roomIds: user.roomIds || [],
        createdAt: user.createdAt,
        deletedAt: Timestamp.now()
      };
      
      // Add to deletedUsers collection
      await setDoc(doc(firestore, 'deletedUsers', userId), deletedUserData);
      
      console.log(`User ${userId} archived before deletion`);
    } catch (error) {
      console.error('Error archiving deleted user:', error);
      throw error;
    }
  },
  
  // Delete user account and all associated data
  async deleteUserAccount(userId: string, deleteRooms: boolean): Promise<void> {
    try {
      // First archive the user
      await this.archiveDeletedUser(userId);
      
      // Get user data
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get all rooms where user is the owner
      const ownerRooms = await roomService.getUserOwnedRooms(userId);
      
      // Get all rooms where user is a member
      const memberRooms = await roomService.getUserMemberRooms(userId);
      
      // 1. If deleteRooms is true, delete all rooms created by the user
      if (deleteRooms && ownerRooms.length > 0) {
        for (const room of ownerRooms) {
          await roomService.deleteRoom(room.id);
        }
      } else if (ownerRooms.length > 0) {
        // Transfer ownership of rooms to oldest admin or member
        for (const room of ownerRooms) {
          await roomService.transferRoomOwnership(room.id, userId);
        }
      }
      
      // 2. Remove user from all rooms they are a member of
      for (const room of memberRooms) {
        await roomService.removeMemberFromRoom(room.id, userId, 'Deleted User', 'system', 'System');
      }
      
      // 3. Delete the user document
      await deleteDoc(doc(firestore, 'users', userId));
      
      console.log(`User ${userId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  },
  
  // Pin a device to Quick Access
  async pinDevice(userId: string, deviceId: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await setDoc(userRef, { pinnedDeviceIds: arrayUnion(deviceId), updatedAt: Timestamp.now() }, { merge: true });
    } catch (error) {
      console.error('Error pinning device:', error);
      throw error;
    }
  },

  // Unpin a device from Quick Access
  async unpinDevice(userId: string, deviceId: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await setDoc(userRef, { pinnedDeviceIds: arrayRemove(deviceId), updatedAt: Timestamp.now() }, { merge: true });
    } catch (error) {
      console.error('Error unpinning device:', error);
      throw error;
    }
  },
  
  // Get pinned devices for a user
  async getUserPinnedDevices(userId: string): Promise<string[]> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.pinnedDeviceIds || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting pinned devices:', error);
      throw error;
    }
  }
};

// Device Log Management
export const deviceLogService = {
  // Create a new device log
  async createLog(logData: Omit<DeviceLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, 'deviceLogs'), {
        ...logData,
        timestamp: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating device log:', error);
      throw error;
    }
  },

  // Get logs for a specific device
  async getDeviceLogs(deviceId: string, limitCount = 50): Promise<DeviceLog[]> {
    try {
      const q = query(
        collection(firestore, 'deviceLogs'),
        where('deviceId', '==', deviceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeviceLog[];
    } catch (error) {
      console.error('Error getting device logs:', error);
      throw error;
    }
  },

  // Get logs for a user's devices
  async getUserDeviceLogs(userId: string, limitCount = 50): Promise<DeviceLog[]> {
    try {
      const q = query(
        collection(firestore, 'deviceLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeviceLog[];
    } catch (error) {
      console.error('Error getting user device logs:', error);
      throw error;
    }
  }
};

// Create device log function (to be used in device toggle functions)
// This function is now standalone and can be imported where needed
export const createDeviceLog = async (logData: {
  deviceId: string;
  userId: string;
  actionType: string;
  newValue: any;
  previousValue?: any; // This might be undefined
  roomId?: string;
  details?: string;
}) => {
  try {
    // Ensure previousValue is never undefined by providing a default value
    const sanitizedLogData = {
      ...logData,
      previousValue: logData.previousValue ?? null, // Use null instead of undefined
      timestamp: Timestamp.now() // Use Timestamp from firestore, not serverTimestamp
    };

    const docRef = await addDoc(collection(firestore, 'deviceLogs'), sanitizedLogData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating device log:', error);
    throw error;
  }
};
