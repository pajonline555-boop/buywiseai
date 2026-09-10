import { logSecurityEvent } from "@/lib/auth/roleMiddleware";

export const INPUT_LIMITS = {
  PASSWORD_MAX: 128,
  EMAIL_MAX: 254,
  NAME_MAX: 100,
  SEARCH_QUERY_MAX: 200,
  CHAT_PROMPT_MAX: 2000,
  COUPON_CODE_MAX: 50,
  PRODUCT_TITLE_MAX: 300,
  ADDRESS_MAX: 500,
  URL_MAX: 2048,
  JSON_BODY_MAX_BYTES: 5 * 1024 * 1024, // 5MB
};

export interface InputValidationResult {
  valid: boolean;
  reason?: string;
  sanitizedValue?: string;
}

/**
 * Validates text string against defined maximum character limit.
 * Rejects oversized input rather than silently truncating.
 */
export function validateInputLength(
  input: string,
  maxLength: number,
  fieldName: string
): InputValidationResult {
  if (typeof input !== "string") {
    return { valid: false, reason: `${fieldName} must be a string` };
  }

  if (input.length > maxLength) {
    logSecurityEvent({
      eventType: "SUSPICIOUS_ACTIVITY",
      route: "inputLimits",
      reason: `Input size limit exceeded for ${fieldName}: received ${input.length} chars, max allowed is ${maxLength}`
    });
    return {
      valid: false,
      reason: `${fieldName} exceeds maximum allowed length of ${maxLength} characters.`
    };
  }

  return { valid: true, sanitizedValue: input };
}

/**
 * Sanitizes input string to prevent SSTI, Script Injection, and Dynamic Evaluation.
 * Ensures user content remains inert data when rendered.
 */
export function sanitizeTextContent(input: string): string {
  if (!input) return "";
  
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/\$\{/g, "&#36;&#123;"); // Neutralize JS template literal interpolation tokens
}

/**
 * ReDoS-safe email validator using simple, non-backtracking regular expression.
 */
export function isSafeEmail(email: string): boolean {
  if (!email || email.length > INPUT_LIMITS.EMAIL_MAX) return false;
  // Simple non-nested regex to avoid exponential backtracking (ReDoS)
  const safeEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return safeEmailRegex.test(email);
}

/**
 * Validates that incoming URLs use HTTP/HTTPS and target allowed domains.
 * Enhanced SSRF protection blocking internal network IPs, IPv6 loopbacks, hex/octal/decimal IP representations, and metadata services.
 */
export function isSafeExternalUrl(url: string, allowedHostnames?: string[]): boolean {
  if (!url || url.length > INPUT_LIMITS.URL_MAX) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // 1. Exact string matches for common internal identifiers
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "[::1]" ||
      host === "::1" ||
      host === "0000:0000:0000:0000:0000:0000:0000:0001" ||
      host.endsWith(".localhost") ||
      host.endsWith(".internal") ||
      host.endsWith(".local") ||
      host === "169.254.169.254" || // AWS / GCP / Azure Cloud Metadata
      host === "metadata.google.internal"
    ) {
      logSecurityEvent({
        eventType: "SUSPICIOUS_ACTIVITY",
        route: "isSafeExternalUrl",
        reason: `Blocked potential SSRF URL targeting internal/restricted host: ${host}`
      });
      return false;
    }

    // 2. IPv4 Decimal / Hex / Octal representation checks
    // e.g. 2130706433 (127.0.0.1), 0177.0.0.1, 0x7f000001
    if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) {
      logSecurityEvent({
        eventType: "SUSPICIOUS_ACTIVITY",
        route: "isSafeExternalUrl",
        reason: `Blocked decimal/hex encoded IP representation: ${host}`
      });
      return false;
    }

    // 3. Private & Link-Local IPv4 CIDR range checks
    const ipv4Parts = host.split(".").map(Number);
    if (ipv4Parts.length === 4 && ipv4Parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
      const [ip1, ip2] = ipv4Parts;
      if (
        ip1 === 127 || // 127.0.0.0/8 Loopback
        ip1 === 10 ||  // 10.0.0.0/8 Private Network
        ip1 === 0 ||   // 0.0.0.0/8 Current Network
        (ip1 === 172 && ip2 >= 16 && ip2 <= 31) || // 172.16.0.0/12 Private Network
        (ip1 === 192 && ip2 === 168) || // 192.168.0.0/16 Private Network
        (ip1 === 169 && ip2 === 254)    // 169.254.0.0/16 Link-Local / Metadata
      ) {
        logSecurityEvent({
          eventType: "SUSPICIOUS_ACTIVITY",
          route: "isSafeExternalUrl",
          reason: `Blocked private/link-local IPv4 address: ${host}`
        });
        return false;
      }
    }

    // 4. Domain allowlist check if provided
    if (allowedHostnames && allowedHostnames.length > 0) {
      const isAllowed = allowedHostnames.some(allowed => 
        host === allowed || host.endsWith("." + allowed)
      );
      if (!isAllowed) return false;
    }

    return true;
  } catch {
    return false;
  }
}
