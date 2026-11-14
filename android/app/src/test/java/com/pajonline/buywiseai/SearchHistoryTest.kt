package com.pajonline.buywiseai

import com.pajonline.buywiseai.data.repository.SearchHistoryEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SearchHistoryTest {

    @Test
    fun testSavingSubmittedSearch() {
        val initial = emptyList<String>()
        val result = SearchHistoryEngine.addSearch(initial, "Garba dresses")
        assertEquals(1, result.size)
        assertEquals("Garba dresses", result[0])
    }

    @Test
    fun testEmptyAndWhitespaceOnlyRejection() {
        val initial = listOf("wireless earbuds")
        val withEmpty = SearchHistoryEngine.addSearch(initial, "")
        val withSpaces = SearchHistoryEngine.addSearch(initial, "    ")
        val withTabs = SearchHistoryEngine.addSearch(initial, "\t\n ")

        assertEquals(1, withEmpty.size)
        assertEquals(1, withSpaces.size)
        assertEquals(1, withTabs.size)
    }

    @Test
    fun testCaseInsensitiveDeduplication() {
        val initial = listOf("wireless earbuds")
        val result = SearchHistoryEngine.addSearch(initial, "WIRELESS EARBUDS")
        assertEquals(1, result.size)
        assertEquals("WIRELESS EARBUDS", result[0])
    }

    @Test
    fun testMostRecentFirstOrdering() {
        var list = emptyList<String>()
        list = SearchHistoryEngine.addSearch(list, "garba dresses")
        list = SearchHistoryEngine.addSearch(list, "wireless earbuds")
        list = SearchHistoryEngine.addSearch(list, "running shoes")
        list = SearchHistoryEngine.addSearch(list, "cotton saree")

        assertEquals(4, list.size)
        assertEquals("cotton saree", list[0])
        assertEquals("running shoes", list[1])
        assertEquals("wireless earbuds", list[2])
        assertEquals("garba dresses", list[3])

        // Re-searching garba dresses moves it to the top
        list = SearchHistoryEngine.addSearch(list, "garba dresses")
        assertEquals(4, list.size)
        assertEquals("garba dresses", list[0])
        assertEquals("cotton saree", list[1])
    }

    @Test
    fun testMaxHistoryCapacity() {
        var list = emptyList<String>()
        for (i in 1..40) {
            list = SearchHistoryEngine.addSearch(list, "Query #$i")
        }
        assertEquals(SearchHistoryEngine.MAX_HISTORY_ITEMS, list.size)
        assertEquals("Query #40", list[0])
        assertEquals("Query #11", list[SearchHistoryEngine.MAX_HISTORY_ITEMS - 1])
    }

    @Test
    fun testPrefixAndSubstringAutocomplete() {
        val list = listOf(
            "Apple iPhone 15",
            "iPhone 16 Pro Max",
            "Samsung Galaxy S24",
            "Case for iPhone 16",
            "Boat Earbuds"
        )

        // Empty query returns recent items
        val recents = SearchHistoryEngine.filterSuggestions(list, "", 3)
        assertEquals(3, recents.size)
        assertEquals("Apple iPhone 15", recents[0])

        // Search "iphone" -> prefix match "iPhone 16 Pro Max" must appear first
        val suggestions = SearchHistoryEngine.filterSuggestions(list, "iphone", 5)
        assertEquals(3, suggestions.size)
        assertEquals("iPhone 16 Pro Max", suggestions[0])
        assertTrue(suggestions.contains("Apple iPhone 15"))
        assertTrue(suggestions.contains("Case for iPhone 16"))
    }

    @Test
    fun testRemovingSingleEntry() {
        val list = listOf("iPhone 16", "Samsung TV", "Running Shoes")
        val updated = SearchHistoryEngine.removeItem(list, "samsung tv")
        assertEquals(2, updated.size)
        assertFalse(updated.contains("Samsung TV"))
        assertTrue(updated.contains("iPhone 16"))
        assertTrue(updated.contains("Running Shoes"))
    }

    @Test
    fun testJsonSerializationAndDeserialization() {
        val original = listOf("Garba dresses", "wireless earbuds", "running shoes")
        val json = SearchHistoryEngine.toJson(original)
        assertTrue(json.contains("Garba dresses"))

        val restored = SearchHistoryEngine.fromJson(json)
        assertEquals(original.size, restored.size)
        assertEquals(original[0], restored[0])
        assertEquals(original[1], restored[1])
        assertEquals(original[2], restored[2])
    }

    @Test
    fun testMalformedJsonHandling() {
        val malformed = "{ broken_json: true ]"
        val result = SearchHistoryEngine.fromJson(malformed)
        assertTrue(result.isEmpty())

        val empty = SearchHistoryEngine.fromJson(null)
        assertTrue(empty.isEmpty())

        val emptyStr = SearchHistoryEngine.fromJson("")
        assertTrue(emptyStr.isEmpty())

        val blankStr = SearchHistoryEngine.fromJson("   \n\t  ")
        assertTrue(blankStr.isEmpty())

        val jsonObject = SearchHistoryEngine.fromJson("""{"query": "shoes"}""")
        assertTrue(jsonObject.isEmpty())

        val numberJson = SearchHistoryEngine.fromJson("12345")
        assertTrue(numberJson.isEmpty())

        val primitiveString = SearchHistoryEngine.fromJson(""""shoes"""")
        assertTrue(primitiveString.isEmpty())
    }

    @Test
    fun testLegacyJsonListCompatibilityAndFiltering() {
        // Exact legacy format previously stored by List<String> TypeToken
        val legacyJson = """["traditional saree", "wireless earbuds", "smart watch"]"""
        val parsed = SearchHistoryEngine.fromJson(legacyJson)
        assertEquals(3, parsed.size)
        assertEquals("traditional saree", parsed[0])
        assertEquals("wireless earbuds", parsed[1])
        assertEquals("smart watch", parsed[2])

        // Empty JSON array
        val emptyArray = SearchHistoryEngine.fromJson("[]")
        assertTrue(emptyArray.isEmpty())

        // JSON array containing whitespace and blank strings
        val messyArray = SearchHistoryEngine.fromJson("""["  shoes  ", "", "   ", "watches", "\t\n"]""")
        assertEquals(2, messyArray.size)
        assertEquals("shoes", messyArray[0])
        assertEquals("watches", messyArray[1])

        // Verify array parsing changes do NOT reset existing history
        val existingHistory = listOf("Item A", "Item B", "Item C")
        val serialized = SearchHistoryEngine.toJson(existingHistory)
        val deserialized = SearchHistoryEngine.fromJson(serialized)
        assertEquals(existingHistory, deserialized)
    }

    @Test
    fun testStorageKeyDerivationAndSanitization() {
        // Null or blank falls back to guest
        assertEquals(SearchHistoryEngine.KEY_ANONYMOUS, SearchHistoryEngine.getStorageKey(null))
        assertEquals(SearchHistoryEngine.KEY_ANONYMOUS, SearchHistoryEngine.getStorageKey(""))
        assertEquals(SearchHistoryEngine.KEY_ANONYMOUS, SearchHistoryEngine.getStorageKey("   \t  "))

        // Standard UID
        val standardKey = SearchHistoryEngine.getStorageKey("firebaseUid123")
        assertEquals("${SearchHistoryEngine.KEY_PREFIX}uid_firebaseUid123", standardKey)

        // Unusual UIDs with special characters produce collision-free keys
        val keyDot = SearchHistoryEngine.getStorageKey("user.one")
        val keySlash = SearchHistoryEngine.getStorageKey("user/one")
        val keyAt = SearchHistoryEngine.getStorageKey("user@one")

        assertNotEquals(keyDot, keySlash)
        assertNotEquals(keyDot, keyAt)
        assertNotEquals(keySlash, keyAt)
        assertNotEquals(SearchHistoryEngine.KEY_ANONYMOUS, keyDot)

        // Cannot collide with guest
        assertFalse(keyDot == SearchHistoryEngine.KEY_ANONYMOUS)
    }

    @Test
    fun testMultiAccountIsolation() {
        val storage = mutableMapOf<String, String>()

        fun getHistory(uid: String?): List<String> {
            val key = SearchHistoryEngine.getStorageKey(uid)
            return SearchHistoryEngine.fromJson(storage[key])
        }

        fun saveSearch(uid: String?, query: String) {
            val key = SearchHistoryEngine.getStorageKey(uid)
            val current = SearchHistoryEngine.fromJson(storage[key])
            val updated = SearchHistoryEngine.addSearch(current, query)
            storage[key] = SearchHistoryEngine.toJson(updated)
        }

        fun removeSearch(uid: String?, query: String) {
            val key = SearchHistoryEngine.getStorageKey(uid)
            val current = SearchHistoryEngine.fromJson(storage[key])
            val updated = SearchHistoryEngine.removeItem(current, query)
            storage[key] = SearchHistoryEngine.toJson(updated)
        }

        fun clearHistory(uid: String?) {
            val key = SearchHistoryEngine.getStorageKey(uid)
            storage.remove(key)
        }

        val uidA = "account_user_A"
        val uidB = "account_user_B"
        val guestUid: String? = null

        // 1. Account A saves searches and can retrieve them
        saveSearch(uidA, "Account A Watch")
        saveSearch(uidA, "Account A Shoes")
        val historyA = getHistory(uidA)
        assertEquals(2, historyA.size)
        assertTrue(historyA.contains("Account A Watch"))
        assertTrue(historyA.contains("Account A Shoes"))

        // 2. Account B cannot retrieve Account A's searches
        val historyB = getHistory(uidB)
        assertTrue(historyB.isEmpty())
        assertFalse(historyB.contains("Account A Watch"))

        // 3. Guest history is isolated from both accounts
        saveSearch(guestUid, "Guest Search Laptop")
        val guestHistory = getHistory(guestUid)
        assertEquals(1, guestHistory.size)
        assertEquals("Guest Search Laptop", guestHistory[0])
        assertFalse(getHistory(uidA).contains("Guest Search Laptop"))
        assertFalse(getHistory(uidB).contains("Guest Search Laptop"))

        // 4. Switching A -> B immediately shows B's history only
        saveSearch(uidB, "Account B Handbag")
        val activeAfterSwitchToB = getHistory(uidB)
        assertEquals(listOf("Account B Handbag"), activeAfterSwitchToB)

        // 5. Switching B -> signed out shows anonymous history only
        val activeAfterSignOut = getHistory(null)
        assertEquals(listOf("Guest Search Laptop"), activeAfterSignOut)

        // 6. Returning to A restores A's saved history
        val restoredA = getHistory(uidA)
        assertEquals(2, restoredA.size)
        assertEquals("Account A Shoes", restoredA[0])
        assertEquals("Account A Watch", restoredA[1])

        // 7. Clearing Account A's history does not clear Account B's or Guest history
        clearHistory(uidA)
        assertTrue(getHistory(uidA).isEmpty())
        assertEquals(listOf("Account B Handbag"), getHistory(uidB))
        assertEquals(listOf("Guest Search Laptop"), getHistory(null))

        // 8. Removing an entry affects only the active account
        saveSearch(uidB, "Shared Search Query")
        saveSearch(guestUid, "Shared Search Query")
        removeSearch(uidB, "Shared Search Query")
        assertFalse(getHistory(uidB).contains("Shared Search Query"))
        assertTrue(getHistory(guestUid).contains("Shared Search Query"))
    }

    @Test
    fun testLegacyHistorySafeMigrationPolicy() {
        val storage = mutableMapOf<String, String>()

        // Simulate legacy storage containing pre-existing searches
        val legacySearches = listOf("Legacy Unscoped TV", "Legacy Phone")
        storage[SearchHistoryEngine.KEY_LEGACY] = SearchHistoryEngine.toJson(legacySearches)

        // Function simulating migration policy:
        // Authenticated users NEVER migrate or receive legacy history
        // Guest user safely adopts legacy history ONLY if guest is empty, then cleans up legacy
        fun resolveAndMigrate(uid: String?): String {
            val key = SearchHistoryEngine.getStorageKey(uid)
            if (key == SearchHistoryEngine.KEY_ANONYMOUS && storage.containsKey(SearchHistoryEngine.KEY_LEGACY)) {
                val legacyData = storage[SearchHistoryEngine.KEY_LEGACY]
                val guestData = storage[SearchHistoryEngine.KEY_ANONYMOUS]
                if (guestData.isNullOrBlank() && !legacyData.isNullOrBlank()) {
                    storage[SearchHistoryEngine.KEY_ANONYMOUS] = legacyData
                }
                storage.remove(SearchHistoryEngine.KEY_LEGACY)
            }
            return key
        }

        // Case 1: Authenticated User C accesses history first
        val userCKey = resolveAndMigrate("user_C_uid")
        assertEquals("${SearchHistoryEngine.KEY_PREFIX}uid_user_C_uid", userCKey)
        val userCHistory = SearchHistoryEngine.fromJson(storage[userCKey])
        assertTrue("Authenticated User C must NOT see legacy history", userCHistory.isEmpty())
        assertTrue("Legacy key must still be protected / not assigned to User C", storage.containsKey(SearchHistoryEngine.KEY_LEGACY))

        // Case 2: Guest accesses history -> safe migration to guest occurs
        val guestKey = resolveAndMigrate(null)
        assertEquals(SearchHistoryEngine.KEY_ANONYMOUS, guestKey)
        val guestHistory = SearchHistoryEngine.fromJson(storage[guestKey])
        assertEquals(2, guestHistory.size)
        assertEquals("Legacy Unscoped TV", guestHistory[0])
        assertFalse("Legacy key must be deleted after migration", storage.containsKey(SearchHistoryEngine.KEY_LEGACY))

        // User C still does not have legacy items
        val recheckUserC = SearchHistoryEngine.fromJson(storage[userCKey])
        assertTrue("User C still isolated from migrated guest history", recheckUserC.isEmpty())
    }
}
