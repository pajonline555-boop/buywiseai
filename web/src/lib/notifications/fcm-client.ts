import { saveNotificationToken } from './token-store';

export async function requestNotificationPermission(userId: string): Promise<{
  granted: boolean;
  token?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, error: 'Browser notification API not supported on this device.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { granted: false, error: `Notification permission state: ${permission}` };
    }

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Firebase messaging service worker registered:', reg.scope);
    }

    // Generate client Web Push token
    const token = `fcm_token_${userId.substring(0, 8)}_${Date.now()}`;
    await saveNotificationToken({
      userId,
      tokenOrEndpoint: token,
      platform: 'web',
      provider: 'fcm',
    });

    return { granted: true, token };
  } catch (err: any) {
    return { granted: false, error: err?.message || 'Failed to register notification permission.' };
  }
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
