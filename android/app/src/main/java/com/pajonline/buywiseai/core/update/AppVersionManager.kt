package com.pajonline.buywiseai.core.update

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.util.Log
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AppVersionManager private constructor(private val appContext: Context) {

    companion object {
        private const val TAG = "AppVersionManager"
        private const val PREFS_NAME = "buywise_version_config_prefs"
        private const val KEY_MIN_VERSION = "min_version"
        private const val KEY_LATEST_VERSION = "latest_version"
        private const val KEY_FORCE_UPDATE = "force_update"
        private const val KEY_UPDATE_MESSAGE = "update_message"
        private const val KEY_UPDATE_URL = "update_url"

        const val DEFAULT_MESSAGE = "Welcome to BuyWise AI! Enjoy seamless shopping, VTO & smart price drop alerts. Please update the application to continue enjoying the latest features."
        const val DEFAULT_PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.pajonline.buywiseai&hl=en-US&ah=siK1dcywSbhtZZS4Fvy3n9jvWVg&pli=1"

        @Volatile
        private var INSTANCE: AppVersionManager? = null

        fun getInstance(context: Context): AppVersionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AppVersionManager(context.applicationContext).also { INSTANCE = it }
            }
        }

        /**
         * Pure parsing helper: converts mixed Firestore types (Long, Int, Double, String) to safe Int.
         */
        fun parseVersionInt(raw: Any?, defaultVal: Int): Int {
            return when (raw) {
                is Number -> raw.toInt()
                is String -> raw.trim().toDoubleOrNull()?.toInt() ?: raw.trim().toIntOrNull() ?: defaultVal
                else -> defaultVal
            }
        }

        /**
         * Pure parsing helper: converts mixed Firestore types (Boolean, String, Number) to safe Boolean.
         */
        fun parseBoolean(raw: Any?, defaultVal: Boolean): Boolean {
            return when (raw) {
                is Boolean -> raw
                is String -> raw.trim().lowercase().toBooleanStrictOrNull() ?: defaultVal
                is Number -> raw.toInt() != 0
                else -> defaultVal
            }
        }

        /**
         * Pure evaluation engine: calculates explicit update status given version metrics.
         */
        fun evaluateUpdateStatus(
            currentBuildNumber: Int,
            minimumSupportedVersion: Int,
            latestVersion: Int,
            forceUpdate: Boolean,
            isRemoteConfigValid: Boolean
        ): UpdateCheckStatus {
            if (!isRemoteConfigValid) {
                return UpdateCheckStatus.FETCH_FAILED
            }
            return when {
                (currentBuildNumber < minimumSupportedVersion) && forceUpdate ->
                    UpdateCheckStatus.MANDATORY_UPDATE_REQUIRED
                currentBuildNumber < latestVersion ->
                    UpdateCheckStatus.OPTIONAL_UPDATE_AVAILABLE
                else ->
                    UpdateCheckStatus.UP_TO_DATE
            }
        }
    }

    private val prefs: SharedPreferences = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private var firestoreListener: ListenerRegistration? = null

    private val _versionInfoState = MutableStateFlow<AppVersionInfo?>(null)
    val versionInfoState: StateFlow<AppVersionInfo?> = _versionInfoState.asStateFlow()

    val currentBuildNumber: Int = try {
        val pInfo = appContext.packageManager.getPackageInfo(appContext.packageName, 0)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            pInfo.longVersionCode.toInt()
        } else {
            @Suppress("DEPRECATION")
            pInfo.versionCode
        }
    } catch (_: Exception) {
        com.pajonline.buywiseai.BuildConfig.VERSION_CODE
    }

    init {
        loadInitialState()
        startFirestoreSync()
    }

    /**
     * Initializes state safely without blocking startup.
     * Note: isRemoteConfigValid begins as false so an unverified local cache
     * can NEVER block the home screen from opening.
     */
    private fun loadInitialState() {
        val minVer = prefs.getInt(KEY_MIN_VERSION, currentBuildNumber)
        val latestVer = prefs.getInt(KEY_LATEST_VERSION, currentBuildNumber)
        val force = prefs.getBoolean(KEY_FORCE_UPDATE, false)
        val msg = prefs.getString(KEY_UPDATE_MESSAGE, DEFAULT_MESSAGE) ?: DEFAULT_MESSAGE
        val url = prefs.getString(KEY_UPDATE_URL, "") ?: ""

        _versionInfoState.value = AppVersionInfo(
            currentBuildNumber = currentBuildNumber,
            minimumSupportedVersion = minVer,
            latestVersion = latestVer,
            forceUpdate = force,
            updateMessage = msg,
            updateUrl = url,
            isRemoteConfigValid = false,
            checkStatus = UpdateCheckStatus.CHECKING,
            errorMessage = null
        )
    }

    /**
     * Connects to Firestore system_config/app_version to fetch authoritative version metadata.
     * Guaranteed never to throw unhandled exceptions or crash the main thread.
     */
    fun startFirestoreSync() {
        try {
            val db = FirebaseFirestore.getInstance()
            stopFirestoreSync()

            _versionInfoState.value = _versionInfoState.value?.copy(
                checkStatus = UpdateCheckStatus.CHECKING,
                errorMessage = null
            )

            firestoreListener = db.collection("system_config").document("app_version")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.w(TAG, "Version config sync note: ${error.message}")
                        // When permission is denied or network fails, gracefully mark as FETCH_FAILED.
                        // isRemoteConfigValid remains FALSE, ensuring the user can access the home screen.
                        _versionInfoState.value = _versionInfoState.value?.copy(
                            isRemoteConfigValid = false,
                            checkStatus = UpdateCheckStatus.FETCH_FAILED,
                            errorMessage = error.message
                        ) ?: AppVersionInfo(
                            currentBuildNumber = currentBuildNumber,
                            minimumSupportedVersion = currentBuildNumber,
                            latestVersion = currentBuildNumber,
                            forceUpdate = false,
                            updateMessage = DEFAULT_MESSAGE,
                            updateUrl = "",
                            isRemoteConfigValid = false,
                            checkStatus = UpdateCheckStatus.FETCH_FAILED,
                            errorMessage = error.message
                        )
                        return@addSnapshotListener
                    }

                    if (snapshot != null && snapshot.exists()) {
                        applyRemoteSnapshot(snapshot)
                    } else if (snapshot != null && !snapshot.exists()) {
                        // Document does not exist in Firestore: treat as UP_TO_DATE with default configuration
                        Log.i(TAG, "system_config/app_version doc does not exist; default configuration active.")
                        _versionInfoState.value = AppVersionInfo(
                            currentBuildNumber = currentBuildNumber,
                            minimumSupportedVersion = currentBuildNumber,
                            latestVersion = currentBuildNumber,
                            forceUpdate = false,
                            updateMessage = DEFAULT_MESSAGE,
                            updateUrl = "",
                            isRemoteConfigValid = true,
                            checkStatus = UpdateCheckStatus.UP_TO_DATE,
                            errorMessage = null
                        )
                    }
                }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to start Firestore version config sync: ${e.message}")
            _versionInfoState.value = _versionInfoState.value?.copy(
                isRemoteConfigValid = false,
                checkStatus = UpdateCheckStatus.FETCH_FAILED,
                errorMessage = e.message
            )
        }
    }

    private fun applyRemoteSnapshot(snapshot: DocumentSnapshot) {
        val minVer = parseVersionInt(snapshot.get("minimum_supported_version"), currentBuildNumber)
        val latestVer = parseVersionInt(snapshot.get("latest_version"), currentBuildNumber)
        val force = parseBoolean(snapshot.get("force_update"), false)
        val msg = snapshot.getString("update_message")?.takeIf { it.isNotBlank() } ?: DEFAULT_MESSAGE
        val url = snapshot.getString("update_url") ?: ""

        prefs.edit()
            .putInt(KEY_MIN_VERSION, minVer)
            .putInt(KEY_LATEST_VERSION, latestVer)
            .putBoolean(KEY_FORCE_UPDATE, force)
            .putString(KEY_UPDATE_MESSAGE, msg)
            .putString(KEY_UPDATE_URL, url)
            .apply()

        val status = evaluateUpdateStatus(
            currentBuildNumber = currentBuildNumber,
            minimumSupportedVersion = minVer,
            latestVersion = latestVer,
            forceUpdate = force,
            isRemoteConfigValid = true
        )

        _versionInfoState.value = AppVersionInfo(
            currentBuildNumber = currentBuildNumber,
            minimumSupportedVersion = minVer,
            latestVersion = latestVer,
            forceUpdate = force,
            updateMessage = msg,
            updateUrl = url,
            isRemoteConfigValid = true,
            checkStatus = status,
            errorMessage = null
        )
        Log.i(TAG, "Synced live Version Config: min=$minVer, latest=$latestVer, force=$force, status=$status")
    }

    /**
     * Re-triggers version check manually with explicit user retry.
     */
    fun retryVersionCheck() {
        startFirestoreSync()
    }

    /**
     * Cleans up Firestore listener to prevent memory leaks when no longer required.
     */
    fun stopFirestoreSync() {
        try {
            firestoreListener?.remove()
            firestoreListener = null
        } catch (e: Exception) {
            Log.w(TAG, "Error removing Firestore listener: ${e.message}")
        }
    }

    fun saveVersionConfig(
        minimumSupportedVersion: Int,
        latestVersion: Int,
        forceUpdate: Boolean,
        updateMessage: String,
        updateUrl: String,
        onComplete: (Boolean, String) -> Unit
    ) {
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())
        val data = hashMapOf(
            "minimum_supported_version" to minimumSupportedVersion,
            "latest_version" to latestVersion,
            "force_update" to forceUpdate,
            "update_message" to updateMessage.trim(),
            "update_url" to updateUrl.trim(),
            "updatedAt" to now,
            "updatedBy" to "pajonline555@gmail.com"
        )

        // Optimistically update local state immediately
        prefs.edit()
            .putInt(KEY_MIN_VERSION, minimumSupportedVersion)
            .putInt(KEY_LATEST_VERSION, latestVersion)
            .putBoolean(KEY_FORCE_UPDATE, forceUpdate)
            .putString(KEY_UPDATE_MESSAGE, updateMessage.trim())
            .putString(KEY_UPDATE_URL, updateUrl.trim())
            .apply()

        val status = evaluateUpdateStatus(
            currentBuildNumber = currentBuildNumber,
            minimumSupportedVersion = minimumSupportedVersion,
            latestVersion = latestVersion,
            forceUpdate = forceUpdate,
            isRemoteConfigValid = true
        )

        _versionInfoState.value = AppVersionInfo(
            currentBuildNumber = currentBuildNumber,
            minimumSupportedVersion = minimumSupportedVersion,
            latestVersion = latestVersion,
            forceUpdate = forceUpdate,
            updateMessage = updateMessage.trim(),
            updateUrl = updateUrl.trim(),
            isRemoteConfigValid = true,
            checkStatus = status,
            errorMessage = null
        )

        try {
            val db = FirebaseFirestore.getInstance()
            db.collection("system_config").document("app_version")
                .set(data, SetOptions.merge())
                .addOnSuccessListener {
                    onComplete(true, "✅ Version Configuration saved! Changes apply instantly to all users.")
                }
                .addOnFailureListener { e ->
                    onComplete(false, "Failed to save to Firestore: ${e.message}")
                }
        } catch (e: Exception) {
            onComplete(true, "Saved locally. (Firestore note: ${e.message})")
        }
    }

    fun launchPlayStore(context: Context, customUrl: String? = null) {
        val target = customUrl?.trim()?.takeIf { it.isNotBlank() }
            ?: _versionInfoState.value?.updateUrl?.trim()?.takeIf { it.isNotBlank() }
            ?: DEFAULT_PLAY_STORE_URL

        val pkg = context.packageName

        // 1. First, attempt to open Google Play Store app directly via market:// with package targeting
        try {
            val marketIntent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg")).apply {
                setPackage("com.android.vending")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            context.startActivity(marketIntent)
            return
        } catch (_: Exception) {}

        // 2. Second, attempt to open target URL directly inside Google Play app (handles internal/closed testing tracks)
        try {
            val playAppIntent = Intent(Intent.ACTION_VIEW, Uri.parse(target)).apply {
                setPackage("com.android.vending")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            context.startActivity(playAppIntent)
            return
        } catch (_: Exception) {}

        // 3. Third, fallback to opening target URL in browser or default handler
        try {
            val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse(target)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(webIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch Play Store: ${e.message}")
        }
    }
}
