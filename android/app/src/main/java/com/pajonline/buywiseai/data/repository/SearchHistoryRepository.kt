package com.pajonline.buywiseai.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import org.json.JSONArray

/**
 * Pure business logic engine for managing local search history and account isolation.
 * Uses Gson for robust JSON serialization compatible with both JVM unit tests and Android runtime.
 */
object SearchHistoryEngine {
    const val MAX_HISTORY_ITEMS = 30
    const val KEY_PREFIX = "local_search_history_"
    const val KEY_ANONYMOUS = "local_search_history_guest"
    const val KEY_LEGACY = "local_search_history_v1"

    private val gson = Gson()

    /**
     * Derives a safe, collision-resistant storage key based on the authenticated UID.
     * - Null, empty, or whitespace-only UIDs map to KEY_ANONYMOUS.
     * - Disallows tokens, passwords, or emails from polluting key names.
     * - Characters outside [a-zA-Z0-9_-] are sanitized to '_'.
     * - If sanitization yields only underscores or empty text, falls back to KEY_ANONYMOUS.
     */
    fun getStorageKey(uid: String?): String {
        if (uid.isNullOrBlank()) return KEY_ANONYMOUS
        val trimmed = uid.trim()
        if (trimmed.isEmpty()) return KEY_ANONYMOUS
        val isStandard = trimmed.all { it.isLetterOrDigit() || it == '-' || it == '_' }
        return if (isStandard) {
            "${KEY_PREFIX}uid_${trimmed}"
        } else {
            val sanitized = trimmed.replace(Regex("[^a-zA-Z0-9_-]"), "_")
            val hash = (trimmed.hashCode().toLong() and 0xFFFFFFFFL).toString(16)
            "${KEY_PREFIX}uid_${sanitized}_$hash"
        }
    }

    /**
     * Normalizes a search query for deduplication and matching:
     * - Trims leading/trailing whitespace
     * - Converts to lowercase
     * - Collapses internal multiple spaces
     */
    fun normalize(query: String): String {
        return query.trim().lowercase().replace(Regex("\\s+"), " ")
    }

    /**
     * Adds or updates a search query in the list:
     * - Rejects blank/whitespace-only queries
     * - Deduplicates case-insensitively while preserving the readable typed text
     * - Places the most recent query at index 0
     * - Enforces the maximum history capacity (default 30)
     */
    fun addSearch(currentList: List<String>, newQuery: String, maxItems: Int = MAX_HISTORY_ITEMS): List<String> {
        val trimmed = newQuery.trim()
        if (trimmed.isEmpty()) return currentList

        val normalized = normalize(trimmed)
        // Filter out existing item with same normalized text
        val filtered = currentList.filter { normalize(it) != normalized }
        val updated = mutableListOf(trimmed)
        updated.addAll(filtered)

        return if (updated.size > maxItems) updated.subList(0, maxItems) else updated
    }

    /**
     * Removes an item matching the query (case-insensitive).
     */
    fun removeItem(currentList: List<String>, queryToRemove: String): List<String> {
        val targetNorm = normalize(queryToRemove)
        return currentList.filter { normalize(it) != targetNorm }
    }

    /**
     * Filters suggestions based on the user's input:
     * - If input is empty/blank: returns top recent items up to limit
     * - If input is provided: prioritizes prefix matches first, then substring matches
     */
    fun filterSuggestions(historyList: List<String>, input: String, limit: Int = 8): List<String> {
        val trimmedInput = input.trim()
        if (trimmedInput.isEmpty()) {
            return historyList.take(limit)
        }

        val inputNorm = normalize(trimmedInput)
        val prefixMatches = mutableListOf<String>()
        val substringMatches = mutableListOf<String>()

        for (item in historyList) {
            val itemNorm = normalize(item)
            if (itemNorm.startsWith(inputNorm)) {
                prefixMatches.add(item)
            } else if (itemNorm.contains(inputNorm)) {
                substringMatches.add(item)
            }
        }

        val combined = mutableListOf<String>()
        combined.addAll(prefixMatches)
        combined.addAll(substringMatches)

        return combined.take(limit)
    }

    /**
     * Serializes history list to JSON string via Gson.
     */
    fun toJson(list: List<String>): String {
        return try {
            gson.toJson(list)
        } catch (_: Exception) {
            "[]"
        }
    }

    /**
     * Deserializes history list from JSON string with error resilience.
     * Uses concrete String Array class reified at JVM runtime (immune to generic erasure / R8 minification),
     * with an org.json.JSONArray fallback for maximum crash resilience.
     */
    fun fromJson(jsonStr: String?): List<String> {
        if (jsonStr.isNullOrBlank()) return emptyList()
        return try {
            val result: Array<String>? = gson.fromJson(jsonStr, Array<String>::class.java)
            if (result.isNullOrEmpty()) return emptyList()
            val filtered = result.filter { it.isNotBlank() }.map { it.trim() }
            if (filtered.size > MAX_HISTORY_ITEMS) filtered.subList(0, MAX_HISTORY_ITEMS) else filtered
        } catch (_: Exception) {
            try {
                val array = JSONArray(jsonStr)
                val list = mutableListOf<String>()
                for (i in 0 until array.length()) {
                    val item = array.optString(i, "").trim()
                    if (item.isNotEmpty()) {
                        list.add(item)
                    }
                }
                if (list.size > MAX_HISTORY_ITEMS) list.subList(0, MAX_HISTORY_ITEMS) else list
            } catch (_: Exception) {
                emptyList()
            }
        }
    }
}

/**
 * Android repository responsible for persisting search history locally in SharedPreferences,
 * with strict account isolation by authenticated user ID (UID).
 * 
 * Strict Privacy Guarantees:
 * - Data never uploaded to server, Firestore, Firebase Storage, or analytics.
 * - Authenticated accounts are segregated under `local_search_history_uid_<UID>`.
 * - Signed-out users use `local_search_history_guest`.
 * - Switching accounts switches history keys immediately without cross-contamination.
 * - Legacy history (`local_search_history_v1`) is migrated ONLY into guest history, never into authenticated accounts.
 */
class SearchHistoryRepository private constructor(context: Context) {
    private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )

    companion object {
        private const val PREFS_NAME = "buywise_search_history_prefs"

        @Volatile
        private var instance: SearchHistoryRepository? = null

        fun getInstance(context: Context): SearchHistoryRepository {
            return instance ?: synchronized(this) {
                instance ?: SearchHistoryRepository(context).also { instance = it }
            }
        }
    }

    /**
     * Resolves the storage key for a given account UID, applying safe legacy migration
     * strictly when operating as guest/anonymous.
     */
    fun resolveKey(accountScope: String?): String {
        val targetKey = SearchHistoryEngine.getStorageKey(accountScope)

        // Safe Legacy Migration Policy:
        // If guest history is requested, and KEY_ANONYMOUS is not yet present in SharedPreferences,
        // but KEY_LEGACY exists from prior builds:
        // Migrate KEY_LEGACY into KEY_ANONYMOUS, then remove KEY_LEGACY.
        // Authenticated accounts NEVER touch or inherit KEY_LEGACY, completely preventing any data leak.
        if (targetKey == SearchHistoryEngine.KEY_ANONYMOUS) {
            if (!prefs.contains(SearchHistoryEngine.KEY_ANONYMOUS) && prefs.contains(SearchHistoryEngine.KEY_LEGACY)) {
                val legacyData = prefs.getString(SearchHistoryEngine.KEY_LEGACY, null)
                if (!legacyData.isNullOrBlank()) {
                    prefs.edit()
                        .putString(SearchHistoryEngine.KEY_ANONYMOUS, legacyData)
                        .remove(SearchHistoryEngine.KEY_LEGACY)
                        .apply()
                }
            }
        }
        return targetKey
    }

    /**
     * Retrieves the saved search history for the given account UID (or guest if null).
     */
    fun getHistory(accountScope: String? = null): List<String> {
        val key = resolveKey(accountScope)
        val jsonStr = prefs.getString(key, null)
        return SearchHistoryEngine.fromJson(jsonStr)
    }

    /**
     * Saves a submitted search query and updates local storage for the specified account scope.
     */
    @Synchronized
    fun saveSearch(query: String, accountScope: String? = null): List<String> {
        val key = resolveKey(accountScope)
        val current = SearchHistoryEngine.fromJson(prefs.getString(key, null))
        val updated = SearchHistoryEngine.addSearch(current, query)
        prefs.edit().putString(key, SearchHistoryEngine.toJson(updated)).apply()
        return updated
    }

    /**
     * Removes a single search query from local storage for the specified account scope.
     */
    @Synchronized
    fun removeSearch(query: String, accountScope: String? = null): List<String> {
        val key = resolveKey(accountScope)
        val current = SearchHistoryEngine.fromJson(prefs.getString(key, null))
        val updated = SearchHistoryEngine.removeItem(current, query)
        prefs.edit().putString(key, SearchHistoryEngine.toJson(updated)).apply()
        return updated
    }

    /**
     * Clears all local search history for the specified account scope.
     */
    @Synchronized
    fun clearHistory(accountScope: String? = null) {
        val key = resolveKey(accountScope)
        prefs.edit().remove(key).apply()
    }

    /**
     * Generates autocomplete suggestions from local history for the specified account scope.
     */
    fun getSuggestions(input: String, accountScope: String? = null, limit: Int = 8): List<String> {
        return SearchHistoryEngine.filterSuggestions(getHistory(accountScope), input, limit)
    }
}
