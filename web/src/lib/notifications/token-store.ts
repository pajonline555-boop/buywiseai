import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { NotificationTokenDoc, NotificationRegistrationPayload } from './types';

// In-memory store fallback for node environment / unit testing
const inMemoryTokenStore = new Map<string, NotificationTokenDoc>();

export async function saveNotificationToken(
  payload: NotificationRegistrationPayload,
  useMemoryFallbackOnly: boolean = false
): Promise<boolean> {
  const userId = payload.userId.trim();
  const tokenKey = payload.tokenOrEndpoint.trim();

  if (!userId || !tokenKey) return false;

  if (useMemoryFallbackOnly || typeof window === 'undefined') {
    const existing = Array.from(inMemoryTokenStore.values()).find(
      (t) => t.userId === userId && t.tokenOrEndpoint === tokenKey
    );
    if (existing) {
      existing.active = true;
      existing.updatedAt = new Date().toISOString();
      return true;
    }
    const id = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    inMemoryTokenStore.set(id, {
      id,
      userId,
      tokenOrEndpoint: tokenKey,
      platform: payload.platform || 'web',
      provider: payload.provider || 'fcm',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  try {
    const q = query(
      collection(db, 'notification_tokens'),
      where('userId', '==', userId),
      where('tokenOrEndpoint', '==', tokenKey)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'notification_tokens', existingDoc.id), {
        active: true,
        updatedAt: new Date().toISOString(),
      });
      return true;
    }

    const docData = {
      userId,
      tokenOrEndpoint: tokenKey,
      platform: payload.platform || 'web',
      provider: payload.provider || 'fcm',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'notification_tokens'), docData);
    return true;
  } catch {
    const id = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    inMemoryTokenStore.set(id, {
      id,
      userId,
      tokenOrEndpoint: tokenKey,
      platform: payload.platform || 'web',
      provider: payload.provider || 'fcm',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  }
}

export async function getUserNotificationTokens(
  userId: string,
  useMemoryFallbackOnly: boolean = false
): Promise<NotificationTokenDoc[]> {
  if (!userId) return [];

  if (useMemoryFallbackOnly || typeof window === 'undefined') {
    return Array.from(inMemoryTokenStore.values()).filter(
      (t) => t.userId === userId && t.active
    );
  }

  try {
    const q = query(
      collection(db, 'notification_tokens'),
      where('userId', '==', userId),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        tokenOrEndpoint: data.tokenOrEndpoint,
        platform: data.platform || 'web',
        provider: data.provider || 'fcm',
        active: data.active,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });
  } catch {
    return Array.from(inMemoryTokenStore.values()).filter(
      (t) => t.userId === userId && t.active
    );
  }
}

export async function deactivateNotificationToken(tokenId: string): Promise<boolean> {
  if (inMemoryTokenStore.has(tokenId)) {
    const tok = inMemoryTokenStore.get(tokenId)!;
    tok.active = false;
    tok.updatedAt = new Date().toISOString();
    return true;
  }

  try {
    await updateDoc(doc(db, 'notification_tokens', tokenId), {
      active: false,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteNotificationToken(tokenId: string): Promise<boolean> {
  if (inMemoryTokenStore.has(tokenId)) {
    return inMemoryTokenStore.delete(tokenId);
  }

  try {
    await deleteDoc(doc(db, 'notification_tokens', tokenId));
    return true;
  } catch {
    return false;
  }
}

export function clearInMemoryTokenStore(): void {
  inMemoryTokenStore.clear();
}
