'use client';

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'quran-center-db';
const DB_VERSION = 1;

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store for cached data
        if (!db.objectStoreNames.contains('students')) {
          db.createObjectStore('students', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('teachers')) {
          db.createObjectStore('teachers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('daily_progress')) {
          const store = db.createObjectStore('daily_progress', { keyPath: 'id' });
          store.createIndex('by_date', 'hijri_date');
          store.createIndex('by_student', 'student_id');
        }
        if (!db.objectStoreNames.contains('financial_reports')) {
          db.createObjectStore('financial_reports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('activity_types')) {
          db.createObjectStore('activity_types', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }
        // Store for pending sync actions
        if (!db.objectStoreNames.contains('pending_actions')) {
          const store = db.createObjectStore('pending_actions', { keyPath: 'id' });
          store.createIndex('by_timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheData<T extends { id: string }>(storeName: string, data: T[]) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  // Clear existing data and add new
  await store.clear();
  for (const item of data) {
    await store.put(item);
  }
  await tx.done;
}

export async function getCachedData<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return db.getAll(storeName) as Promise<T[]>;
}

export async function getCachedItem<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(storeName, id) as Promise<T | undefined>;
}

export async function addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>) {
  const db = await getDB();
  const pendingAction: PendingAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  await db.add('pending_actions', pendingAction);
  return pendingAction;
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await getDB();
  return db.getAllFromIndex('pending_actions', 'by_timestamp');
}

export async function removePendingAction(id: string) {
  const db = await getDB();
  await db.delete('pending_actions', id);
}

export async function clearPendingActions() {
  const db = await getDB();
  const tx = db.transaction('pending_actions', 'readwrite');
  await tx.objectStore('pending_actions').clear();
  await tx.done;
}

// Offline-first save with optimistic update
export async function saveOfflineFirst<T extends { id?: string }>(
  storeName: string,
  data: T,
  actionType: 'create' | 'update'
): Promise<T & { id: string }> {
  const db = await getDB();
  const id = data.id || crypto.randomUUID();
  const itemWithId = { ...data, id } as T & { id: string };
  
  // Save to local store immediately
  await db.put(storeName, itemWithId);
  
  // Queue for sync
  await addPendingAction({
    type: actionType,
    table: storeName,
    data: itemWithId as Record<string, unknown>,
  });
  
  return itemWithId;
}

export async function deleteOfflineFirst(storeName: string, id: string) {
  const db = await getDB();
  
  // Delete from local store
  await db.delete(storeName, id);
  
  // Queue for sync
  await addPendingAction({
    type: 'delete',
    table: storeName,
    data: { id },
  });
}
