package com.pajonline.buywiseai.core.update

enum class UpdateCheckStatus {
    IDLE,
    CHECKING,
    UP_TO_DATE,
    OPTIONAL_UPDATE_AVAILABLE,
    MANDATORY_UPDATE_REQUIRED,
    FETCH_FAILED
}

data class AppVersionInfo(
    val currentBuildNumber: Int,
    val minimumSupportedVersion: Int,
    val latestVersion: Int,
    val forceUpdate: Boolean,
    val updateMessage: String,
    val updateUrl: String = "",
    val isRemoteConfigValid: Boolean = false,
    val checkStatus: UpdateCheckStatus = UpdateCheckStatus.IDLE,
    val errorMessage: String? = null
) {
    /**
     * Mandatory update is enforced ONLY when remote configuration was successfully
     * validated from the authoritative server, the installed build is strictly below
     * minimum supported version, AND forceUpdate is explicitly true.
     *
     * In all failure modes (permission denied, missing config, timeout, offline),
     * isRemoteConfigValid is false, so isMandatoryUpdate evaluates to false, ensuring
     * the app never hangs or crashes on startup.
     */
    val isMandatoryUpdate: Boolean
        get() = isRemoteConfigValid && (currentBuildNumber < minimumSupportedVersion) && forceUpdate

    /**
     * Optional update is offered when valid remote config shows a newer build exists,
     * but the update is not mandatory.
     */
    val isOptionalUpdate: Boolean
        get() = isRemoteConfigValid && !isMandatoryUpdate && (currentBuildNumber < latestVersion)

    val hasAnyUpdate: Boolean
        get() = isMandatoryUpdate || isOptionalUpdate
}
