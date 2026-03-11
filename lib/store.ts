import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  setDoc,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { BankAccount, BalanceRecord } from './types';

// Collection paths
const getAccountsRef = (userId: string) => collection(db, "users", userId, "accounts");
const getRecordsRef = (userId: string) => collection(db, "users", userId, "records");

export const getAccounts = async (userId: string): Promise<BankAccount[]> => {
  try {
    const q = query(getAccountsRef(userId));
    const querySnapshot = await getDocs(q);
    const accounts: BankAccount[] = [];
    
    querySnapshot.forEach((doc) => {
      accounts.push({ id: doc.id, ...doc.data() } as BankAccount);
    });

    // Sort accounts by name alphabetically
    accounts.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));

    // If no accounts, create default ones using fixed IDs to prevent duplicates
    if (accounts.length === 0) {
      const defaultAccounts = [
        { id: 'default_cathay', name: '國泰世華', color: '#00a650', currency: 'TWD' },
        { id: 'default_esun', name: '玉山銀行', color: '#06b6d4', currency: 'TWD' }
      ];
      
      for (const acc of defaultAccounts) {
        const { id, ...data } = acc;
        const docRef = doc(db, "users", userId, "accounts", id);
        await setDoc(docRef, data);
        accounts.push({ id, ...data } as BankAccount);
      }
      
      // Sort again after adding defaults
      accounts.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
    }

    return accounts;
  } catch (e) {
    console.error('Error getting accounts:', e);
    return [];
  }
};

export const addAccount = async (userId: string, account: Omit<BankAccount, 'id'>): Promise<BankAccount> => {
  const docRef = await addDoc(getAccountsRef(userId), account);
  return { id: docRef.id, ...account } as BankAccount;
};

export const updateAccount = async (userId: string, account: BankAccount): Promise<void> => {
  const docRef = doc(db, "users", userId, "accounts", account.id);
  const { id, ...data } = account;
  await updateDoc(docRef, data);
};

export const deleteAccount = async (userId: string, id: string): Promise<void> => {
  // Delete account
  const docRef = doc(db, "users", userId, "accounts", id);
  await deleteDoc(docRef);
  
  // Delete associated records
  const q = query(getRecordsRef(userId), where("accountId", "==", id));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach(async (d) => {
    await deleteDoc(doc(db, "users", userId, "records", d.id));
  });
};

export const getRecords = async (userId: string): Promise<BalanceRecord[]> => {
  try {
    const q = query(getRecordsRef(userId));
    const querySnapshot = await getDocs(q);
    const records: BalanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as BalanceRecord);
    });
    
    return records;
  } catch (e) {
    console.error('Error getting records:', e);
    return [];
  }
};

export const addRecord = async (userId: string, record: Omit<BalanceRecord, 'id'>): Promise<void> => {
  const recordsRef = getRecordsRef(userId);
  
  // Sanitize data: Firestore doesn't accept 'undefined'
  const sanitizedRecord = {
    ...record,
    amountTWD: record.amountTWD === undefined ? null : record.amountTWD
  };
  
  // Check if record for same account and month exists
  const q = query(recordsRef, where("accountId", "==", record.accountId), where("date", "==", record.date));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const existingDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, "users", userId, "records", existingDoc.id), {
      amount: sanitizedRecord.amount,
      amountTWD: sanitizedRecord.amountTWD
    });
  } else {
    await addDoc(recordsRef, sanitizedRecord);
  }
};

export const updateRecord = async (userId: string, record: BalanceRecord): Promise<void> => {
  const docRef = doc(db, "users", userId, "records", record.id);
  const { id, ...data } = record;
  
  // Sanitize data
  const sanitizedData = {
    ...data,
    amountTWD: data.amountTWD === undefined ? null : data.amountTWD
  };
  
  await updateDoc(docRef, sanitizedData);
};

export const deleteRecord = async (userId: string, id: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "records", id);
  await deleteDoc(docRef);
};
