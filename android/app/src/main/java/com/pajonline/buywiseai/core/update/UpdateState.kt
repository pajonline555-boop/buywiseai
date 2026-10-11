package com.pajonline.buywiseai.core.update

/**
 * State representation of Google Play In-App Update flow.
 */
sealed class UpdateState {
    object Idle : UpdateState()
    object NoUpdateAvailable : UpdateState()
    data class UpdateAvailable(val availableVersionCode: Int, val policy: UpdatePolicy) : UpdateState()
    data class Downloading(val bytesDownloaded: Long, val totalBytesToDownload: Long) : UpdateState()
    object Downloaded : UpdateState()
    object Installing : UpdateState()
    object Completed : UpdateState()
    data class Failed(val error: String) : UpdateState()
    object UserCancelled : UpdateState()
    object NetworkUnavailable : UpdateState()
    object PlayStoreUnavailable : UpdateState()
}
