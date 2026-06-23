import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, Timestamp,
} from 'firebase/firestore';
import { ref, set, onValue, off } from 'firebase/database';
import { firestore, database } from '@/lib/firebase';

export interface IrButton {
  id: string;
  name: string;
  irCode: string;
  protocol: string;
  bits: number;
  order: number;
}

export interface IrRemote {
  id: string;
  userId: string;
  name: string;
  icon: string;
  buttons: IrButton[];
  createdAt: Timestamp;
}

export interface IrCommand {
  action: 'send' | 'learn' | 'idle';
  irCode?: string;
  protocol?: string;
  bits?: number;
  buttonId?: string;
  remoteId?: string;
  timestamp?: number;
}

export interface IrResult {
  action: 'learned' | 'timeout' | 'error';
  buttonId: string;
  irCode: string;
  protocol: string;
  bits: number;
  timestamp: number;
}

export const irService = {
  async getRemotes(userId: string): Promise<IrRemote[]> {
    const q = query(collection(firestore, 'irRemotes'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as IrRemote[];
  },

  async createRemote(userId: string, name: string, icon: string): Promise<string> {
    const docRef = await addDoc(collection(firestore, 'irRemotes'), {
      userId,
      name,
      icon,
      buttons: [],
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async updateRemote(remoteId: string, data: Partial<Pick<IrRemote, 'name' | 'icon' | 'buttons'>>): Promise<void> {
    await updateDoc(doc(firestore, 'irRemotes', remoteId), data as any);
  },

  async deleteRemote(remoteId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'irRemotes', remoteId));
  },

  sendCommand(userId: string, command: IrCommand): Promise<void> {
    return set(ref(database, `ir_command/${userId}`), {
      ...command,
      timestamp: Date.now(),
    });
  },

  listenResult(userId: string, callback: (result: IrResult | null) => void): () => void {
    const resultRef = ref(database, `ir_result/${userId}`);
    onValue(resultRef, snap => callback(snap.val() as IrResult | null));
    return () => off(resultRef);
  },

  clearResult(userId: string): Promise<void> {
    return set(ref(database, `ir_result/${userId}`), null);
  },
};
