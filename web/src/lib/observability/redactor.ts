const SENSITIVE_PATTERNS = [
  'key', 'token', 'secret', 'password', 'auth', 'credential', 'vapid',
  'authorization', 'apikey', 'clientsecret', 'privatekey', 'bearer'
];

export function redactSecrets(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecrets(item));
  }

  const clean: Record<string, any> = {};

  for (const k of Object.keys(obj)) {
    const keyLower = k.toLowerCase();
    const isSensitive = SENSITIVE_PATTERNS.some((pattern) => keyLower.includes(pattern));

    if (isSensitive) {
      clean[k] = '[REDACTED]';
    } else if (typeof obj[k] === 'object') {
      clean[k] = redactSecrets(obj[k]);
    } else {
      clean[k] = obj[k];
    }
  }

  return clean;
}
