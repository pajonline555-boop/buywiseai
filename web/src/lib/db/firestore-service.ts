import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { PriceHistoryEntry } from '../history/types';
import { PriceAlertSubscription } from '../alerts/types';

export async function saveVerifiedPriceHistory(entry: PriceHistoryEntry): Promise<boolean> {
  // ZERO MOCK DATABASE WRITE GUARD: Mock data MUST NOT contaminate production Firestore database
  if (entry.dataSource === 'mock' || entry.verificationStatus === 'unverified') {
    return false;
  }

  try {
    const docData = {
      productId: entry.productId.toLowerCase().trim(),
      retailerId: entry.retailerId.toLowerCase().trim(),
      store: entry.store,
      price: entry.price,
      mrp: entry.mrp || null,
      currency: entry.currency || 'INR',
      verificationStatus: entry.verificationStatus,
      dataSource: entry.dataSource,
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    await addDoc(collection(db, 'price_history'), docData);
    return true;
  } catch (err) {
    console.warn('Firestore price_history write notice:', err);
    return false;
  }
}

export async function getPersistentPriceHistory(
  productId: string,
  retailerId?: string
): Promise<PriceHistoryEntry[]> {
  try {
    const skuKey = productId.toLowerCase().trim();
    let q = query(
      collection(db, 'price_history'),
      where('productId', '==', skuKey),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    if (retailerId) {
      q = query(
        collection(db, 'price_history'),
        where('productId', '==', skuKey),
        where('retailerId', '==', retailerId.toLowerCase().trim()),
        orderBy('timestamp', 'asc'),
        limit(100)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        productId: data.productId,
        retailerId: data.retailerId,
        store: data.store,
        price: data.price,
        mrp: data.mrp || undefined,
        currency: data.currency || 'INR',
        timestamp: data.timestamp,
        verificationStatus: data.verificationStatus,
        dataSource: data.dataSource,
      };
    });
  } catch (err) {
    console.warn('Firestore price_history query notice:', err);
    return [];
  }
}

export async function saveAlertSubscription(sub: PriceAlertSubscription): Promise<boolean> {
  try {
    const skuKey = sub.productId.toLowerCase().trim();
    
    // DUPLICATE SUBSCRIPTION CHECK: Prevent creating redundant alert documents for same user + product + target
    const existingQ = query(
      collection(db, 'alerts'),
      where('userId', '==', sub.userId),
      where('productId', '==', skuKey),
      where('active', '==', true)
    );
    const existingSnap = await getDocs(existingQ);

    if (!existingSnap.empty) {
      // Update existing subscription doc with new target price
      const existingDoc = existingSnap.docs[0];
      await updateDoc(doc(db, 'alerts', existingDoc.id), {
        targetPrice: sub.targetPrice || null,
        targetDiscountPercent: sub.targetDiscountPercent || 10,
        updatedAt: new Date().toISOString(),
      });
      return true;
    }

    const docData = {
      userId: sub.userId,
      userEmail: sub.userEmail || null,
      productId: skuKey,
      productTitle: sub.productTitle,
      retailerId: sub.retailerId || null,
      targetPrice: sub.targetPrice || null,
      targetDiscountPercent: sub.targetDiscountPercent || 10,
      notifyOnHistoricalLow: sub.notifyOnHistoricalLow ?? true,
      initialPrice: sub.initialPrice,
      lastNotifiedPrice: sub.lastNotifiedPrice || null,
      lastNotifiedAt: sub.lastNotifiedAt || null,
      cooldownMinutes: sub.cooldownMinutes || 1440,
      active: sub.active ?? true,
      createdAt: sub.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'alerts'), docData);
    return true;
  } catch (err) {
    console.warn('Firestore alerts write notice:', err);
    return false;
  }
}

export async function deleteUserAlertSubscription(alertId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'alerts', alertId));
    return true;
  } catch (err) {
    console.warn('Firestore alert delete notice:', err);
    return false;
  }
}

export async function getUserAlertSubscriptions(userId: string): Promise<PriceAlertSubscription[]> {
  try {
    const q = query(
      collection(db, 'alerts'),
      where('userId', '==', userId),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        userEmail: data.userEmail || undefined,
        productId: data.productId,
        productTitle: data.productTitle,
        retailerId: data.retailerId || undefined,
        targetPrice: data.targetPrice || undefined,
        targetDiscountPercent: data.targetDiscountPercent,
        notifyOnHistoricalLow: data.notifyOnHistoricalLow,
        initialPrice: data.initialPrice,
        lastNotifiedPrice: data.lastNotifiedPrice || undefined,
        lastNotifiedAt: data.lastNotifiedAt || undefined,
        cooldownMinutes: data.cooldownMinutes || 1440,
        active: data.active,
        createdAt: data.createdAt,
      };
    });
  } catch (err) {
    console.warn('Firestore alerts query notice:', err);
    return [];
  }
}

export function subscribeToUserAlerts(
  userId: string,
  callback: (alerts: PriceAlertSubscription[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'alerts'),
    where('userId', '==', userId),
    where('active', '==', true)
  );

  return onSnapshot(q, (snapshot) => {
    const list: PriceAlertSubscription[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        userEmail: data.userEmail || undefined,
        productId: data.productId,
        productTitle: data.productTitle,
        retailerId: data.retailerId || undefined,
        targetPrice: data.targetPrice || undefined,
        targetDiscountPercent: data.targetDiscountPercent,
        notifyOnHistoricalLow: data.notifyOnHistoricalLow,
        initialPrice: data.initialPrice,
        lastNotifiedPrice: data.lastNotifiedPrice || undefined,
        lastNotifiedAt: data.lastNotifiedAt || undefined,
        cooldownMinutes: data.cooldownMinutes || 1440,
        active: data.active,
        createdAt: data.createdAt,
      };
    });
    callback(list);
  }, (err) => {
    console.warn('Firestore alerts listener notice:', err);
    callback([]);
  });
}
