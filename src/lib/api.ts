import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserType } from '@/store';

export type ProfitRecord = {
  id: string;
  user: UserType;
  ticker: string;
  date: string;
  time: string;
  profit: number;
  createdAt: number;
};

export const saveProfitRecord = async (data: Omit<ProfitRecord, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'records_new'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

export const updateProfitRecord = async (id: string, data: Partial<ProfitRecord>) => {
  try {
    const recordRef = doc(db, 'records_new', id);
    await updateDoc(recordRef, {
      ...data,
    });
  } catch (error) {
    console.error('Error updating document: ', error);
    throw error;
  }
};

export const deleteProfitRecord = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'records_new', id));
  } catch (error) {
    console.error('Error deleting document: ', error);
    throw error;
  }
};

export const migrateUserRecords = async (oldName: string, newName: string) => {
  try {
    const q = query(collection(db, 'records_new'), where('user', '==', oldName));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { user: newName });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error migrating user records: ', error);
    throw error;
  }
};

export const subscribeToRecords = (callback: (records: ProfitRecord[]) => void) => {
  const q = query(collection(db, 'records_new'), orderBy('createdAt', 'desc'));

  // onSnapshot returns an unsubscribe function
  return onSnapshot(q, (snapshot) => {
    const records: ProfitRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      records.push({
        id: docSnap.id,
        user: data.user,
        ticker: data.ticker,
        date: data.date,
        time: data.time,
        profit: data.profit,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
      });
    });
    callback(records);
  }, (error) => {
    console.error('Error subscribing to records: ', error);
  });
};
