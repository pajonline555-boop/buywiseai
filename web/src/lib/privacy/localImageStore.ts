"use client"

export interface StoredImage {
  id: string;
  createdAt: number;
  updatedAt: number;
  type: 'USER_PHOTO' | 'VTO_RESULT';
  imageData: string; // DataURL or Blob representation
  productId?: string;
  productSource?: string;
  isPrimary?: boolean;
  isCompetitionSubmitted?: boolean;
  submissionId?: string;
}

const DB_NAME = 'BuyWise_Private_Media_DB';
const DB_VERSION = 1;
const STORE_NAME = 'private_images';

let dbInstance: IDBDatabase | null = null;
let isClearedExplicitly = false;

async function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in browser environments.');
  }

  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('isPrimary', 'isPrimary', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event: any) => {
      dbInstance = event.target.result;
      resolve(dbInstance!);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

// Fallback in-memory / localStorage store if IndexedDB is disabled or fails
const MEMORY_IMAGES: Record<string, StoredImage> = {};

/**
 * Save user photograph locally
 */
export async function saveUserPhoto(imageData: string, isPrimary: boolean = false): Promise<StoredImage> {
  isClearedExplicitly = false;
  const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const storedItem: StoredImage = {
    id,
    createdAt: now,
    updatedAt: now,
    type: 'USER_PHOTO',
    imageData,
    isPrimary,
  };

  try {
    const db = await getDB();
    if (isPrimary) {
      await resetPrimaryPhotos(db);
    }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(storedItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    MEMORY_IMAGES[id] = storedItem;
  }

  return storedItem;
}

/**
 * Helper to unset existing primary flags
 */
async function resetPrimaryPhotos(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        if (cursor.value.type === 'USER_PHOTO' && cursor.value.isPrimary) {
          const updated = { ...cursor.value, isPrimary: false };
          cursor.update(updated);
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => resolve();
  });
}

/**
 * Set a specific photo as primary
 */
export async function setPrimaryPhoto(id: string): Promise<void> {
  try {
    const db = await getDB();
    await resetPrimaryPhotos(db);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        const updated = { ...req.result, isPrimary: true, updatedAt: Date.now() };
        store.put(updated);
      }
    };
  } catch (err) {
    if (MEMORY_IMAGES[id]) {
      Object.keys(MEMORY_IMAGES).forEach((key) => {
        if (MEMORY_IMAGES[key].type === 'USER_PHOTO') {
          MEMORY_IMAGES[key].isPrimary = false;
        }
      });
      MEMORY_IMAGES[id].isPrimary = true;
    }
  }
}

/**
 * Get all user photographs stored locally
 */
export async function getUserPhotos(): Promise<StoredImage[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result || []).filter((item: StoredImage) => item.type === 'USER_PHOTO');
        if (results.length === 0 && !isClearedExplicitly) {
          resolve([
            {
              id: 'photo_default_seed',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              type: 'USER_PHOTO',
              imageData: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
            },
          ]);
        } else {
          results.sort((a: StoredImage, b: StoredImage) => b.createdAt - a.createdAt);
          resolve(results);
        }
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    const memList = Object.values(MEMORY_IMAGES).filter((item) => item.type === 'USER_PHOTO');
    if (memList.length === 0 && !isClearedExplicitly) {
      return [
        {
          id: 'photo_default_seed',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          type: 'USER_PHOTO',
          imageData: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
          isPrimary: true,
        },
      ];
    }
    return memList;
  }
}

/**
 * Get single user photograph
 */
export async function getUserPhoto(id: string): Promise<StoredImage | null> {
  const photos = await getUserPhotos();
  return photos.find((p) => p.id === id) || null;
}

/**
 * Delete a user photograph
 */
export async function deleteUserPhoto(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    delete MEMORY_IMAGES[id];
  }
}

/**
 * Save VTO result locally
 */
export async function saveVtoResult(
  imageData: string,
  productId?: string,
  productSource?: string
): Promise<StoredImage> {
  isClearedExplicitly = false;
  const id = `vto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const storedItem: StoredImage = {
    id,
    createdAt: now,
    updatedAt: now,
    type: 'VTO_RESULT',
    imageData,
    productId,
    productSource,
  };

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(storedItem);
  } catch (err) {
    MEMORY_IMAGES[id] = storedItem;
  }

  return storedItem;
}

/**
 * Get all VTO generated results stored locally
 */
export async function getVtoResults(): Promise<StoredImage[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result || []).filter((item: StoredImage) => item.type === 'VTO_RESULT');
        results.sort((a: StoredImage, b: StoredImage) => b.createdAt - a.createdAt);
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return Object.values(MEMORY_IMAGES).filter((item) => item.type === 'VTO_RESULT');
  }
}

/**
 * Get single VTO result
 */
export async function getVtoResult(id: string): Promise<StoredImage | null> {
  const results = await getVtoResults();
  return results.find((r) => r.id === id) || null;
}

/**
 * Delete a VTO result locally
 */
export async function deleteVtoResult(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    delete MEMORY_IMAGES[id];
  }
}

/**
 * Clear all private user photographs and VTO results from local device
 */
export async function clearAllPrivateImages(): Promise<void> {
  isClearedExplicitly = true;
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    Object.keys(MEMORY_IMAGES).forEach((k) => delete MEMORY_IMAGES[k]);
  }
}

/**
 * Get live counts for Privacy Center
 */
export async function getPrivateMediaCounts(): Promise<{
  privatePhotos: number;
  privateLooks: number;
  competitionSubmissions: number;
}> {
  const photos = await getUserPhotos();
  const vtoResults = await getVtoResults();
  const submittedCount = vtoResults.filter((r) => r.isCompetitionSubmitted).length;

  return {
    privatePhotos: isClearedExplicitly ? 0 : photos.length,
    privateLooks: vtoResults.length,
    competitionSubmissions: submittedCount,
  };
}
