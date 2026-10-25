/**
 * BuyWise AI - Local Search History & Autocomplete Utility
 * 
 * Provides private, device-local, client-side search history persistence
 * using browser localStorage. 
 * 
 * Strict Privacy Guarantees:
 * - Stored exclusively on the user's local device.
 * - Never synced to Firestore, Firebase Storage, or any remote server.
 * - No analytics events or telemetry logged for search history operations.
 * - Supports profile/account scoping to prevent cross-account leakage on shared browsers.
 */

export interface SearchHistoryItem {
  /** The display query as typed by the user */
  query: string;
  /** Normalized lowercase trimmed string for exact case-insensitive deduplication */
  normalized: string;
  /** Unix timestamp in milliseconds for recency tracking */
  timestamp: number;
}

export const MAX_SEARCH_HISTORY_ITEMS = 30;
export const DEFAULT_STORAGE_KEY_PREFIX = 'buywise_local_search_history_v1';

/**
 * Returns the scoped localStorage key to isolate history across different user profiles.
 */
export function getStorageKey(scopeKey?: string | null): string {
  if (scopeKey && scopeKey.trim()) {
    // Sanitize scopeKey to avoid invalid key characters
    const cleanScope = scopeKey.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${DEFAULT_STORAGE_KEY_PREFIX}_${cleanScope}`;
  }
  return DEFAULT_STORAGE_KEY_PREFIX;
}

/**
 * Check if localStorage is available and accessible.
 * Handles disabled cookies, Safari private mode restrictions, and SSR.
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__buywise_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely retrieves search history items from localStorage.
 * Handles missing storage, JSON parsing errors, and malformed structures gracefully.
 */
export function getSearchHistory(scopeKey?: string | null): SearchHistoryItem[] {
  if (!isStorageAvailable()) return [];

  try {
    const key = getStorageKey(scopeKey);
    const rawData = window.localStorage.getItem(key);
    if (!rawData) return [];

    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) return [];

    // Validate and sanitize each item
    const validItems: SearchHistoryItem[] = [];
    for (const item of parsed) {
      if (item && typeof item.query === 'string' && item.query.trim().length > 0) {
        const query = item.query.trim();
        const normalized = typeof item.normalized === 'string' ? item.normalized : query.toLowerCase();
        const timestamp = typeof item.timestamp === 'number' ? item.timestamp : Date.now();
        validItems.push({ query, normalized, timestamp });
      }
    }

    return validItems.slice(0, MAX_SEARCH_HISTORY_ITEMS);
  } catch {
    // Malformed JSON or storage read error: return empty array without crashing
    return [];
  }
}

/**
 * Saves a new query to local search history.
 * - Ignores empty or whitespace-only queries.
 * - Deduplicates case-insensitively while preserving the readable display query.
 * - Moves repeated searches to the top (most recent first).
 * - Caps total saved entries at MAX_SEARCH_HISTORY_ITEMS (30).
 * - Handles quota exceptions safely.
 */
export function saveSearchQuery(rawQuery: string, scopeKey?: string | null): SearchHistoryItem[] {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return getSearchHistory(scopeKey);
  }

  const query = rawQuery.trim();
  if (query.length === 0) {
    return getSearchHistory(scopeKey);
  }

  const normalized = query.toLowerCase();
  const currentHistory = getSearchHistory(scopeKey);

  // Filter out any existing item with the same normalized query
  const filtered = currentHistory.filter((item) => item.normalized !== normalized);

  // Prepend new search at top
  const newItem: SearchHistoryItem = {
    query,
    normalized,
    timestamp: Date.now(),
  };

  const updated = [newItem, ...filtered].slice(0, MAX_SEARCH_HISTORY_ITEMS);

  if (isStorageAvailable()) {
    try {
      const key = getStorageKey(scopeKey);
      window.localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // Storage quota exceeded or blocked; silently fail without interrupting user flow
    }
  }

  return updated;
}

/**
 * Removes a single search query from local history.
 */
export function removeSearchQuery(targetQuery: string, scopeKey?: string | null): SearchHistoryItem[] {
  if (!targetQuery || typeof targetQuery !== 'string') {
    return getSearchHistory(scopeKey);
  }

  const normalizedTarget = targetQuery.trim().toLowerCase();
  const currentHistory = getSearchHistory(scopeKey);
  const updated = currentHistory.filter((item) => item.normalized !== normalizedTarget);

  if (isStorageAvailable()) {
    try {
      const key = getStorageKey(scopeKey);
      window.localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // Storage quota or blocked
    }
  }

  return updated;
}

/**
 * Clears all local search history for the given scope.
 */
export function clearSearchHistory(scopeKey?: string | null): void {
  if (!isStorageAvailable()) return;

  try {
    const key = getStorageKey(scopeKey);
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors on clear
  }
}

/**
 * Generates autocomplete suggestions from saved history.
 * - If input is empty/whitespace: returns up to `limit` most recent searches.
 * - If input is provided: matches items whose normalized text contains or starts with input.
 * - Prioritizes prefix matches over substring matches, maintaining recency within groups.
 */
export function getHistorySuggestions(
  currentInput: string,
  scopeKey?: string | null,
  limit: number = 8
): SearchHistoryItem[] {
  const history = getSearchHistory(scopeKey);
  if (!history.length) return [];

  const inputTrimmed = (currentInput || '').trim();
  if (!inputTrimmed) {
    return history.slice(0, limit);
  }

  const inputNorm = inputTrimmed.toLowerCase();

  // Split into prefix matches vs substring matches
  const prefixMatches: SearchHistoryItem[] = [];
  const substringMatches: SearchHistoryItem[] = [];

  for (const item of history) {
    if (item.normalized.startsWith(inputNorm)) {
      prefixMatches.push(item);
    } else if (item.normalized.includes(inputNorm)) {
      substringMatches.push(item);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, limit);
}
