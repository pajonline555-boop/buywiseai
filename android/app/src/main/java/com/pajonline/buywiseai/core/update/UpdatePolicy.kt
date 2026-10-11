package com.pajonline.buywiseai.core.update

/**
 * Priority policy controlling whether a release is updated using FLEXIBLE or IMMEDIATE mode.
 */
enum class UpdatePolicy {
    NORMAL,     // FLEXIBLE update, non-blocking UI
    IMPORTANT,  // FLEXIBLE update with prominent notification
    CRITICAL    // IMMEDIATE update for security / breaking fixes
}
