/**
 * BuyWise AI - Multi-Layer Anti-Spam & Bot Shield Engine
 * Protects against automated scrapers, disposable email services,
 * synthetic bot accounts, and headless automation.
 */

// 1. Comprehensive list of disposable/temporary email provider domains
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com", "tempmail.net", "tempmail.org", "tempmailo.com",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com",
  "mailinator.com", "mailinator.net", "mailin8r.com",
  "10minutemail.com", "10minutemail.net", "10minmail.com",
  "yopmail.com", "yopmail.net", "yopmail.fr",
  "trashmail.com", "trashmail.net", "trashmail.org",
  "fakemailgenerator.com", "fakeinbox.com", "fakemail.net",
  "sharklasers.com", "grr.la", "pokemail.net", "spam4.me",
  "throwawaymail.com", "burnermail.io", "maildrop.cc",
  "dispostable.com", "getairmail.com", "crazymailing.com",
  "generator.email", "nada.ltd", "inboxkitten.com",
  "temp-mail.org", "temp-mail.io", "mohmal.com", "emailondeck.com",
  "mytemp.email", "luxusmail.org", "crazymail.com", "armyspy.com",
  "cuvox.de", "dayrep.com", "fleckens.hu", "gustr.com", "jourrapide.com",
  "rhyta.com", "superrito.com", "teleworm.us", "einrot.com"
]);

// 2. Specific known malicious or bot email accounts blocked platform-wide
export const BLOCKED_SPAM_EMAILS = new Set([
  "mirandarivera.40229@gmail.com",
  "herberttyler.09898@gmail.com"
]);

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  threatLevel: "NONE" | "LOW" | "HIGH" | "CRITICAL";
}

/**
 * Analyzes an email address against disposable domains, bot generator patterns, and blacklists.
 */
export function evaluateEmailAntiSpam(email: string): SpamCheckResult {
  if (!email || typeof email !== "string") {
    return { isSpam: true, reason: "Empty or invalid email address", threatLevel: "HIGH" };
  }

  const clean = email.toLowerCase().trim();

  // Explicit blacklist check
  if (BLOCKED_SPAM_EMAILS.has(clean)) {
    return {
      isSpam: true,
      reason: "Identified automated spam account",
      threatLevel: "CRITICAL"
    };
  }

  const parts = clean.split("@");
  if (parts.length !== 2) {
    return { isSpam: true, reason: "Malformed email format", threatLevel: "HIGH" };
  }

  const [handle, domain] = parts;

  // Disposable domain check
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isSpam: true,
      reason: `Disposable or temporary email provider detected (${domain})`,
      threatLevel: "CRITICAL"
    };
  }

  // Automated bot email generator pattern (e.g. "firstname.lastname.12345@gmail.com" or "name.40229@gmail.com")
  // Common signature of automated Google account generators:
  const botPatternDot5Digits = /^[a-z]+(\.[a-z]+)?\.[0-9]{4,6}@gmail\.com$/i;
  if (botPatternDot5Digits.test(clean)) {
    // Specifically catch synthetic handles like "mirandarivera.40229" or "herberttyler.09898"
    const handleDigits = handle.split(".").pop();
    if (handleDigits && /^[0-9]{5}$/.test(handleDigits)) {
      return {
        isSpam: true,
        reason: "Synthetic automated account signature detected (dot-5-digit pattern)",
        threatLevel: "HIGH"
      };
    }
  }

  // Excessive consecutive digits (e.g. user9823487123984@...)
  if (/[0-9]{8,}@/.test(clean)) {
    return {
      isSpam: true,
      reason: "Suspicious randomized numeric sequence in email handle",
      threatLevel: "HIGH"
    };
  }

  return { isSpam: false, threatLevel: "NONE" };
}

/**
 * Validates a web signup attempt with honeypot and timing heuristics.
 */
export function evaluateSignupSubmission(params: {
  email: string;
  honeypotTrap?: string;
  pageRenderTimeMs?: number;
  userAgent?: string;
}): SpamCheckResult {
  // 1. Honeypot check - humans cannot see this field, bots fill it in
  if (params.honeypotTrap && params.honeypotTrap.trim().length > 0) {
    return {
      isSpam: true,
      reason: "Automated form scraper detected (honeypot triggered)",
      threatLevel: "CRITICAL"
    };
  }

  // 2. Submission speed check - humans take at least 1500ms to fill a form
  if (params.pageRenderTimeMs && params.pageRenderTimeMs > 0) {
    const elapsed = Date.now() - params.pageRenderTimeMs;
    if (elapsed < 1200) {
      return {
        isSpam: true,
        reason: `Sub-human registration speed (${elapsed}ms) detected`,
        threatLevel: "HIGH"
      };
    }
  }

  // 3. User agent bot check
  if (params.userAgent) {
    const ua = params.userAgent.toLowerCase();
    const botTokens = ["headlesschrome", "selenium", "puppeteer", "playwright", "phantomjs", "python-requests", "go-http-client"];
    for (const token of botTokens) {
      if (ua.includes(token)) {
        return {
          isSpam: true,
          reason: `Headless automation driver detected in user agent (${token})`,
          threatLevel: "CRITICAL"
        };
      }
    }
  }

  // 4. Email evaluation
  return evaluateEmailAntiSpam(params.email);
}

