package com.pajonline.buywiseai

import com.pajonline.buywiseai.core.update.AppVersionInfo
import com.pajonline.buywiseai.core.update.AppVersionManager
import com.pajonline.buywiseai.core.update.UpdateCheckStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AppVersionManagerTest {

    // --- Scenario 1: Update Configuration Present & Valid (Up-to-Date) ---
    @Test
    fun testUpdateConfigurationPresentAndValid_UpToDate() {
        val current = 13
        val status = AppVersionManager.evaluateUpdateStatus(
            currentBuildNumber = current,
            minimumSupportedVersion = 12,
            latestVersion = 13,
            forceUpdate = false,
            isRemoteConfigValid = true
        )
        val info = AppVersionInfo(
            currentBuildNumber = current,
            minimumSupportedVersion = 12,
            latestVersion = 13,
            forceUpdate = false,
            updateMessage = "Welcome",
            isRemoteConfigValid = true,
            checkStatus = status
        )

        assertEquals(UpdateCheckStatus.UP_TO_DATE, status)
        assertFalse(info.isMandatoryUpdate)
        assertFalse(info.isOptionalUpdate)
        assertFalse(info.hasAnyUpdate)
    }

    // --- Scenario 2: Valid Mandatory Update ---
    @Test
    fun testValidMandatoryUpdate_EnforcesMandatoryGate() {
        val current = 11
        val minSupported = 13
        val latest = 13
        val status = AppVersionManager.evaluateUpdateStatus(
            currentBuildNumber = current,
            minimumSupportedVersion = minSupported,
            latestVersion = latest,
            forceUpdate = true,
            isRemoteConfigValid = true
        )
        val info = AppVersionInfo(
            currentBuildNumber = current,
            minimumSupportedVersion = minSupported,
            latestVersion = latest,
            forceUpdate = true,
            updateMessage = "Security upgrade required",
            isRemoteConfigValid = true,
            checkStatus = status
        )

        assertEquals(UpdateCheckStatus.MANDATORY_UPDATE_REQUIRED, status)
        assertTrue("Mandatory update must be enforced when valid remote requires it", info.isMandatoryUpdate)
        assertFalse(info.isOptionalUpdate)
        assertTrue(info.hasAnyUpdate)
    }

    // --- Scenario 3: Valid Optional Update ---
    @Test
    fun testValidOptionalUpdate_OffersUpdateWithoutMandatoryBlock() {
        val current = 11
        val minSupported = 10
        val latest = 13
        val status = AppVersionManager.evaluateUpdateStatus(
            currentBuildNumber = current,
            minimumSupportedVersion = minSupported,
            latestVersion = latest,
            forceUpdate = false,
            isRemoteConfigValid = true
        )
        val info = AppVersionInfo(
            currentBuildNumber = current,
            minimumSupportedVersion = minSupported,
            latestVersion = latest,
            forceUpdate = false,
            updateMessage = "New features available",
            isRemoteConfigValid = true,
            checkStatus = status
        )

        assertEquals(UpdateCheckStatus.OPTIONAL_UPDATE_AVAILABLE, status)
        assertFalse("Optional update must not be treated as mandatory", info.isMandatoryUpdate)
        assertTrue("Optional update must be offered", info.isOptionalUpdate)
        assertTrue(info.hasAnyUpdate)
    }

    // --- Scenario 4: Configuration Document Missing ---
    @Test
    fun testConfigurationDocumentMissing_DefaultsToUpToDateWithoutBlocking() {
        // When document is missing in Firestore, system safely treats as up-to-date
        val current = 13
        val status = AppVersionManager.evaluateUpdateStatus(
            currentBuildNumber = current,
            minimumSupportedVersion = current,
            latestVersion = current,
            forceUpdate = false,
            isRemoteConfigValid = true
        )
        val info = AppVersionInfo(
            currentBuildNumber = current,
            minimumSupportedVersion = current,
            latestVersion = current,
            forceUpdate = false,
            updateMessage = AppVersionManager.DEFAULT_MESSAGE,
            isRemoteConfigValid = true,
            checkStatus = status
        )

        assertEquals(UpdateCheckStatus.UP_TO_DATE, status)
        assertFalse(info.isMandatoryUpdate)
        assertFalse(info.isOptionalUpdate)
    }

    // --- Scenario 5: Firestore PERMISSION_DENIED ---
    @Test
    fun testFirestorePermissionDenied_FailsGracefullyWithoutBlockingStartup() {
        // When Firestore rules deny read access, isRemoteConfigValid is false
        val current = 11 // Even if current build is older
        val status = AppVersionManager.evaluateUpdateStatus(
            currentBuildNumber = current,
            minimumSupportedVersion = 13,
            latestVersion = 13,
            forceUpdate = true,
            isRemoteConfigValid = false // Failed due to permission denied
        )
        val info = AppVersionInfo(
            currentBuildNumber = current,
            minimumSupportedVersion = 13,
            latestVersion = 13,
            forceUpdate = true,
            updateMessage = "Update required",
            isRemoteConfigValid = false,
            checkStatus = status,
            errorMessage = "PERMISSION_DENIED: Missing or insufficient permissions"
        )

        assertEquals(UpdateCheckStatus.FETCH_FAILED, status)
        assertFalse("Startup MUST NOT be blocked when remote config fails with permission denied", info.isMandatoryUpdate)
        assertFalse(info.isOptionalUpdate)
    }

    // --- Scenario 6: Network Timeout / Offline ---
    @Test
    fun testNetworkTimeout_FailsGracefullyWithoutBlockingStartup() {
        val current = 12
        val status = AppVersionManager.evaluateUpdateStatus(
            currentBuildNumber = current,
            minimumSupportedVersion = 13,
            latestVersion = 13,
            forceUpdate = true,
            isRemoteConfigValid = false // Failed due to network timeout
        )
        val info = AppVersionInfo(
            currentBuildNumber = current,
            minimumSupportedVersion = 13,
            latestVersion = 13,
            forceUpdate = true,
            updateMessage = "Update required",
            isRemoteConfigValid = false,
            checkStatus = status,
            errorMessage = "DEADLINE_EXCEEDED"
        )

        assertEquals(UpdateCheckStatus.FETCH_FAILED, status)
        assertFalse("App must open home screen when network times out", info.isMandatoryUpdate)
        assertFalse(info.isOptionalUpdate)
    }

    // --- Scenario 7: Malformed Version Number Fields ---
    @Test
    fun testMalformedVersionFields_SafelyFallbacks() {
        val defaultVal = 13
        // Long, Double, Int, valid String, invalid String, null, empty
        assertEquals(13, AppVersionManager.parseVersionInt(13L, defaultVal))
        assertEquals(14, AppVersionManager.parseVersionInt(14, defaultVal))
        assertEquals(15, AppVersionManager.parseVersionInt(15.0, defaultVal))
        assertEquals(16, AppVersionManager.parseVersionInt("16", defaultVal))
        assertEquals(17, AppVersionManager.parseVersionInt(" 17 ", defaultVal))
        assertEquals(defaultVal, AppVersionManager.parseVersionInt("not_a_number", defaultVal))
        assertEquals(defaultVal, AppVersionManager.parseVersionInt(null, defaultVal))
        assertEquals(defaultVal, AppVersionManager.parseVersionInt("", defaultVal))
    }

    // --- Scenario 8: Malformed Boolean Fields ---
    @Test
    fun testMalformedBooleanFields_SafelyFallbacks() {
        val defaultVal = false
        assertTrue(AppVersionManager.parseBoolean(true, defaultVal))
        assertFalse(AppVersionManager.parseBoolean(false, true))
        assertTrue(AppVersionManager.parseBoolean("true", defaultVal))
        assertTrue(AppVersionManager.parseBoolean("TRUE", defaultVal))
        assertFalse(AppVersionManager.parseBoolean("false", true))
        assertTrue(AppVersionManager.parseBoolean(1, defaultVal))
        assertFalse(AppVersionManager.parseBoolean(0, true))
        assertFalse(AppVersionManager.parseBoolean("random_text", defaultVal))
        assertFalse(AppVersionManager.parseBoolean(null, defaultVal))
    }

    // --- Scenario 9: Normal Startup and Navigation Resiliency ---
    @Test
    fun testNormalStartupAndNavigation_InitialStateNeverBlocksLaunch() {
        val current = 13
        val initialInfo = AppVersionInfo(
            currentBuildNumber = current,
            minimumSupportedVersion = current,
            latestVersion = current,
            forceUpdate = false,
            updateMessage = AppVersionManager.DEFAULT_MESSAGE,
            isRemoteConfigValid = false,
            checkStatus = UpdateCheckStatus.CHECKING
        )

        assertFalse("Initial startup state must never block launch before remote verification", initialInfo.isMandatoryUpdate)
        assertFalse(initialInfo.isOptionalUpdate)
    }
}
