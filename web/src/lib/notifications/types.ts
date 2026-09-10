export interface NotificationTokenDoc {
  id: string;
  userId: string;
  tokenOrEndpoint: string;
  platform: 'web' | 'android' | 'ios';
  provider: 'fcm' | 'web_push';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRegistrationPayload {
  userId: string;
  tokenOrEndpoint: string;
  platform?: 'web' | 'android' | 'ios';
  provider?: 'fcm' | 'web_push';
}

export interface NotificationDeliveryResult {
  attempted: number;
  delivered: number;
  failed: number;
  invalidTokensRemoved: number;
  skippedNoRegistration: number;
  errors: string[];
}
