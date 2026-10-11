package com.pajonline.buywiseai.core.update

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Manages Google Play In-App Updates for BuyWise AI.
 * Enforces official Play Core update mechanisms (FLEXIBLE and IMMEDIATE).
 * Strictly avoids custom or unverified APK downlaoders.
 */
class InAppUpdateManager private constructor(context: Context) {

    companion object {
        private const val TAG = "InAppUpdateManager"
        private const val PREFS_NAME = "buywise_update_prefs"
        private const val KEY_LAST_CHECK_TIMESTAMP = "last_check_timestamp"
        private const val COOLDOWN_MS = 60 * 60 * 1000L // 1 hour cooldown between checks

        @Volatile
        private var INSTANCE: InAppUpdateManager? = null

        fun getInstance(context: Context): InAppUpdateManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: InAppUpdateManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    private val appUpdateManager: AppUpdateManager = AppUpdateManagerFactory.create(context)
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _updateState = MutableStateFlow<UpdateState>(UpdateState.Idle)
    val updateState: StateFlow<UpdateState> = _updateState.asStateFlow()

    private val listener: InstallStateUpdatedListener = InstallStateUpdatedListener { state ->
        when (state.installStatus()) {
            InstallStatus.DOWNLOADING -> {
                val bytesDownloaded = state.bytesDownloaded()
                val totalBytes = state.totalBytesToDownload()
                _updateState.value = UpdateState.Downloading(bytesDownloaded, totalBytes)
                Log.d(TAG, "Download progress: $bytesDownloaded / $totalBytes")
            }
            InstallStatus.DOWNLOADED -> {
                _updateState.value = UpdateState.Downloaded
                Log.d(TAG, "BuyWise AI update downloaded. Ready for restart.")
            }
            InstallStatus.INSTALLING -> {
                _updateState.value = UpdateState.Installing
            }
            InstallStatus.INSTALLED -> {
                _updateState.value = UpdateState.Completed
                appUpdateManager.unregisterListener(this.listener)
            }
            InstallStatus.FAILED -> {
                _updateState.value = UpdateState.Failed("Install failed with status ${state.installErrorCode()}")
            }
            InstallStatus.CANCELED -> {
                _updateState.value = UpdateState.UserCancelled
            }
            else -> {
                Log.d(TAG, "Install status: ${state.installStatus()}")
            }
        }
    }

    init {
        appUpdateManager.registerListener(listener)
    }

    /**
     * Checks if a new release is available on Google Play.
     * Respects a 1-hour cooldown unless [forceCheck] is true.
     */
    fun checkForUpdate(forceCheck: Boolean = false, currentPolicy: UpdatePolicy = UpdatePolicy.NORMAL) {
        val now = System.currentTimeMillis()
        val lastCheck = prefs.getLong(KEY_LAST_CHECK_TIMESTAMP, 0L)

        if (!forceCheck && (now - lastCheck) < COOLDOWN_MS) {
            Log.d(TAG, "Update check skipped due to cooldown.")
            return
        }

        prefs.edit().putLong(KEY_LAST_CHECK_TIMESTAMP, now).apply()

        appUpdateManager.appUpdateInfo.addOnSuccessListener { info ->
            if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) {
                val isFlexibleAllowed = info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
                val isImmediateAllowed = info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)

                val effectivePolicy = when {
                    currentPolicy == UpdatePolicy.CRITICAL && isImmediateAllowed -> UpdatePolicy.CRITICAL
                    isFlexibleAllowed -> UpdatePolicy.NORMAL
                    else -> currentPolicy
                }

                _updateState.value = UpdateState.UpdateAvailable(
                    availableVersionCode = info.availableVersionCode(),
                    policy = effectivePolicy
                )
                Log.i(TAG, "Update available: versionCode ${info.availableVersionCode()}, policy: $effectivePolicy")
            } else if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                Log.i(TAG, "Developer-triggered update already in progress.")
                if (info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                    _updateState.value = UpdateState.UpdateAvailable(info.availableVersionCode(), UpdatePolicy.CRITICAL)
                }
            } else {
                _updateState.value = UpdateState.NoUpdateAvailable
                Log.d(TAG, "No Google Play update available.")
            }
        }.addOnFailureListener { error ->
            Log.e(TAG, "Failed to check Google Play updates", error)
            _updateState.value = UpdateState.Failed(error.message ?: "Failed to query Google Play Store")
        }
    }

    /**
     * Starts the update flow via Google Play In-App Updates.
     */
    fun startUpdateFlow(activity: Activity, requestCode: Int, policy: UpdatePolicy = UpdatePolicy.NORMAL) {
        appUpdateManager.appUpdateInfo.addOnSuccessListener { info ->
            val updateType = if (policy == UpdatePolicy.CRITICAL && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                AppUpdateType.IMMEDIATE
            } else {
                AppUpdateType.FLEXIBLE
            }

            try {
                val options = AppUpdateOptions.newBuilder(updateType).build()
                appUpdateManager.startUpdateFlowForResult(info, activity, options, requestCode)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to launch Play update flow", e)
                _updateState.value = UpdateState.Failed(e.message ?: "Could not launch update flow")
            }
        }
    }

    /**
     * Completes flexible update by restarting the app.
     */
    fun completeFlexibleUpdate() {
        appUpdateManager.completeUpdate()
    }

    fun unregister() {
        appUpdateManager.unregisterListener(listener)
    }
}
