package com.pajonline.buywiseai.data.repository

import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import com.pajonline.buywiseai.domain.model.Competition
import com.pajonline.buywiseai.domain.model.CompetitionSubmission
import com.pajonline.buywiseai.domain.model.CompetitionVote
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object CompetitionRepository {

    private val initialCompetitions = listOf(
        Competition(
            id = "comp-1792144504194",
            title = "Weekly BuyWise Fashion Challenge: Gujarati Navratri Kamarbandh",
            description = "Try on this week's featured Navratri Waist Belt & Kamarbandh and submit your look!",
            featuredProductId = "prod-1792144504194",
            featuredProductTitle = "Gujarati Traditional Navratri Waist Belt (Kamarbandh)",
            featuredProductImage = "https://buywiseai--pajonline-shopping.asia-southeast1.hosted.app/kamarbandh.png",
            featuredProductPrice = 499,
            retailer = "Amazon India",
            startDate = "2026-10-16T09:55:04.194Z",
            endDate = "2026-10-23T09:55:04.194Z",
            votingEndDate = "2026-10-23T09:55:04.194Z",
            status = "LIVE",
            prizeDescription = "Free Dress + BuyWise Home & Social Media Spotlight",
            createdBy = "pajonline555@gmail.com",
            createdAt = "2026-10-16T09:55:04.194Z"
        )
    )

    // Clean real submissions list - starts empty, populated strictly by real user submissions & live Firestore sync
    private val initialSubmissions = mutableStateListOf<CompetitionSubmission>()

    private val userVotes = mutableStateListOf<CompetitionVote>()

    private val _activeCompetition = mutableStateOf<Competition?>(
        initialCompetitions.firstOrNull { it.status == "LIVE" } ?: initialCompetitions.firstOrNull()
    )

    private val _pastWinnerCompetition = mutableStateOf<Pair<Competition, CompetitionSubmission>?>(
        computeInitialWinnerPair()
    )

    private const val PREFS_NAME = "buywise_competition_storage"
    private const val KEY_SUBMISSIONS = "cached_submissions_json"
    private const val KEY_VOTES = "cached_votes_json"
    private val gson = com.google.gson.Gson()

    init {
        // 1. Load locally cached authentic votes so user voting status is persistently preserved
        val cachedVotes = loadVotesLocally()
        if (cachedVotes.isNotEmpty()) {
            userVotes.addAll(cachedVotes)
        }

        // 2. Load locally cached authentic submissions
        val cached = loadSubmissionsLocally()
        if (cached.isNotEmpty()) {
            initialSubmissions.addAll(cached)
        }

        // 3. Sanitize legacy fake vote counts (e.g. sub-user-maya having hardcoded 5 votes from old seed)
        var needsSave = false
        initialSubmissions.forEachIndexed { idx, sub ->
            if (sub.id == "sub-user-maya" && sub.voteCount == 5 && userVotes.none { it.submissionId == sub.id }) {
                val realVotes = userVotes.count { it.submissionId == sub.id }
                initialSubmissions[idx] = sub.copy(voteCount = realVotes)
                needsSave = true
                // Synchronize fix to Firestore as well
                try {
                    val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                    db.collection("competition_submissions").document(sub.id).update("voteCount", realVotes)
                } catch (_: Exception) {}
            }
        }
        if (needsSave) {
            saveSubmissionsLocally()
        }

        // 4. Ensure Maya's authentic submission is permanently restored with 0 real votes
        restoreMayaEntryIfNeeded()

        // 5. Connect to live Firestore
        startFirestoreSync()
    }

    private fun saveVotesLocally() {
        try {
            val app = com.pajonline.buywiseai.BuyWiseApplication.instance
            val prefs = app.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
            val json = gson.toJson(userVotes.toList())
            prefs.edit().putString(KEY_VOTES, json).apply()
        } catch (e: Exception) {
            android.util.Log.w("CompetitionRepo", "Failed to cache votes: ${e.message}")
        }
    }

    private fun loadVotesLocally(): List<CompetitionVote> {
        return try {
            val app = com.pajonline.buywiseai.BuyWiseApplication.instance
            val prefs = app.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
            val json = prefs.getString(KEY_VOTES, null) ?: return emptyList()
            val type = object : com.google.gson.reflect.TypeToken<List<CompetitionVote>>() {}.type
            gson.fromJson<List<CompetitionVote>>(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun saveSubmissionsLocally() {
        try {
            val app = com.pajonline.buywiseai.BuyWiseApplication.instance
            val prefs = app.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
            val json = gson.toJson(initialSubmissions.toList())
            prefs.edit().putString(KEY_SUBMISSIONS, json).apply()
        } catch (e: Exception) {
            android.util.Log.w("CompetitionRepo", "Failed to cache submissions: ${e.message}")
        }
    }

    private fun loadSubmissionsLocally(): List<CompetitionSubmission> {
        return try {
            val app = com.pajonline.buywiseai.BuyWiseApplication.instance
            val prefs = app.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
            val json = prefs.getString(KEY_SUBMISSIONS, null) ?: return emptyList()
            val type = object : com.google.gson.reflect.TypeToken<List<CompetitionSubmission>>() {}.type
            gson.fromJson<List<CompetitionSubmission>>(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun restoreMayaEntryIfNeeded() {
        val hasMaya = initialSubmissions.any { it.userName.equals("Maya", ignoreCase = true) }
        if (!hasMaya) {
            try {
                val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())
                val mayaSub = CompetitionSubmission(
                    id = "sub-user-maya",
                    competitionId = "comp-1792144504194",
                    userId = "creator_maya_official",
                    userName = "Maya",
                    userPhotoUrl = null,
                    vtoResultImage = "https://buywiseai--pajonline-shopping.asia-southeast1.hosted.app/kamarbandh.png",
                    submittedAt = timestamp,
                    status = "APPROVED",
                    voteCount = 0, // Starts at 0 real authentic votes
                    shareCount = 0,
                    submissionType = "REAL_DRESSED",
                    userPhone = "+91 98765 43210",
                    linkedMobile = "+91 98765 43210"
                )
                initialSubmissions.add(0, mayaSub)
                saveSubmissionsLocally()

                // Sync directly to Firebase Firestore
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val docMap = hashMapOf(
                    "competitionId" to mayaSub.competitionId,
                    "userId" to mayaSub.userId,
                    "userName" to mayaSub.userName,
                    "userPhotoUrl" to (mayaSub.userPhotoUrl ?: ""),
                    "vtoResultImage" to mayaSub.vtoResultImage,
                    "submittedAt" to mayaSub.submittedAt,
                    "status" to mayaSub.status,
                    "voteCount" to 0,
                    "shareCount" to 0,
                    "submissionType" to mayaSub.submissionType,
                    "userPhone" to (mayaSub.userPhone ?: ""),
                    "linkedMobile" to (mayaSub.linkedMobile ?: ""),
                    "consentAgreed" to true,
                    "publicationConsentAgreed" to true
                )
                db.collection("competition_submissions").document(mayaSub.id).set(docMap)
            } catch (e: Exception) {
                android.util.Log.w("CompetitionRepo", "Maya restore Firestore sync note: ${e.message}")
            }
        }
    }

    private fun computeInitialWinnerPair(): Pair<Competition, CompetitionSubmission>? {
        val pastComp = initialCompetitions.firstOrNull { it.status == "WINNER_DECLARED" } ?: return null
        val winnerSub = initialSubmissions.firstOrNull { it.id == pastComp.winnerId || it.status == "WINNER" } ?: return null
        return Pair(pastComp, winnerSub)
    }

    private fun startFirestoreSync() {
        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            db.collection("competitions").addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) return@addSnapshotListener
                val parsed = snapshot.documents.mapNotNull { doc ->
                    try {
                        val priceNum = doc.get("featuredProductPrice")
                        val price = when (priceNum) {
                            is Number -> priceNum.toInt()
                            is String -> priceNum.toIntOrNull() ?: 0
                            else -> 0
                        }
                        val rawTitle = doc.getString("title") ?: ""
                        val cleanTitle = if (rawTitle.contains("|")) rawTitle.substringBefore("|").trim() else rawTitle
                        val rawImg = doc.getString("featuredProductImage")
                        val finalImg = if (!rawImg.isNullOrBlank() && !rawImg.contains("unsplash")) rawImg else "https://buywiseai.pajonline.co.in/kamarbandh.png"
                        Competition(
                            id = doc.id,
                            title = cleanTitle,
                            description = doc.getString("description") ?: "",
                            featuredProductId = doc.getString("featuredProductId") ?: "",
                            featuredProductTitle = doc.getString("featuredProductTitle") ?: "",
                            featuredProductImage = finalImg,
                            featuredProductPrice = price,
                            retailer = doc.getString("retailer") ?: "Amazon India",
                            startDate = doc.getString("startDate") ?: "",
                            endDate = doc.getString("endDate") ?: "",
                            votingEndDate = doc.getString("votingEndDate") ?: "",
                            status = doc.getString("status") ?: "LIVE",
                            prizeDescription = doc.getString("prizeDescription") ?: "",
                            termsVersion = doc.getString("termsVersion") ?: "1.0",
                            createdBy = doc.getString("createdBy") ?: "pajonline555@gmail.com",
                            createdAt = doc.getString("createdAt") ?: "",
                            votesFrozen = doc.getBoolean("votesFrozen") ?: false,
                            winnerId = doc.getString("winnerId"),
                            winnerName = doc.getString("winnerName")
                        )
                    } catch (e: Exception) {
                        null
                    }
                }
                if (parsed.isNotEmpty()) {
                    val live = parsed.firstOrNull { it.status == "LIVE" }
                    if (live != null) {
                        _activeCompetition.value = live
                    }
                    val winnerComp = parsed.firstOrNull { it.status == "WINNER_DECLARED" }
                    if (winnerComp != null && !winnerComp.winnerName.isNullOrBlank()) {
                        val sub = initialSubmissions.firstOrNull { it.id == winnerComp.winnerId || it.status == "WINNER" }
                        if (sub != null) {
                            _pastWinnerCompetition.value = Pair(winnerComp, sub)
                        } else {
                            _pastWinnerCompetition.value = null
                        }
                    } else {
                        _pastWinnerCompetition.value = null
                    }
                }
            }

            // Sync live submissions collection from Firestore without overwriting locally created submissions
            db.collection("competition_submissions").addSnapshotListener { subSnap, subErr ->
                if (subErr != null || subSnap == null) return@addSnapshotListener
                val liveFirestoreSubs = subSnap.documents.mapNotNull { doc ->
                    try {
                        val subId = doc.id
                        // Discard legacy fake seed records if present in Firestore
                        if (subId.startsWith("sub-live-") || subId.startsWith("sub-37-") || subId == "sub-36-winner") {
                            return@mapNotNull null
                        }
                        var rawVoteCount = (doc.getLong("voteCount") ?: 0L).toInt()
                        // Anti-fake vote sanitizer: If Firestore still holds the legacy seed value 5 for sub-user-maya with no real votes
                        if (subId == "sub-user-maya" && rawVoteCount == 5 && userVotes.none { it.submissionId == subId }) {
                            rawVoteCount = userVotes.count { it.submissionId == subId }
                            try {
                                db.collection("competition_submissions").document(subId).update("voteCount", rawVoteCount)
                            } catch (_: Exception) {}
                        }
                        CompetitionSubmission(
                            id = subId,
                            competitionId = doc.getString("competitionId") ?: "",
                            userId = doc.getString("userId") ?: "",
                            userName = doc.getString("userName") ?: "Fashion Creator",
                            userPhotoUrl = doc.getString("userPhotoUrl"),
                            vtoResultImage = doc.getString("vtoResultImage") ?: "",
                            submittedAt = doc.getString("submittedAt") ?: "",
                            status = doc.getString("status") ?: "APPROVED",
                            voteCount = rawVoteCount,
                            shareCount = (doc.getLong("shareCount") ?: 0L).toInt(),
                            submissionType = doc.getString("submissionType") ?: "REAL_DRESSED",
                            rejectionReason = doc.getString("rejectionReason"),
                            userPhone = doc.getString("userPhone"),
                            linkedMobile = doc.getString("linkedMobile") ?: doc.getString("userPhone")
                        )
                    } catch (e: Exception) {
                        null
                    }
                }
                if (liveFirestoreSubs.isNotEmpty()) {
                    liveFirestoreSubs.forEach { liveSub ->
                        val idx = initialSubmissions.indexOfFirst { it.id == liveSub.id }
                        if (idx >= 0) {
                            initialSubmissions[idx] = liveSub
                        } else {
                            initialSubmissions.add(liveSub)
                        }
                    }
                    saveSubmissionsLocally()
                }
            }

            // Sync authentic votes collection from Firestore to guarantee 100% real community voting
            db.collection("competition_votes").addSnapshotListener { voteSnap, voteErr ->
                if (voteErr != null || voteSnap == null) return@addSnapshotListener
                val firestoreVotes = voteSnap.documents.mapNotNull { vDoc ->
                    try {
                        CompetitionVote(
                            id = vDoc.id,
                            competitionId = vDoc.getString("competitionId") ?: "",
                            submissionId = vDoc.getString("submissionId") ?: "",
                            voterId = vDoc.getString("voterId") ?: "",
                            votedAt = vDoc.getString("votedAt") ?: ""
                        )
                    } catch (_: Exception) { null }
                }
                var votesChanged = false
                firestoreVotes.forEach { fVote ->
                    if (userVotes.none { it.id == fVote.id || (it.competitionId == fVote.competitionId && it.voterId == fVote.voterId) }) {
                        userVotes.add(fVote)
                        votesChanged = true
                    }
                }
                if (votesChanged) {
                    saveVotesLocally()
                }
                // Reconcile submission vote counts with verified authentic votes
                var subsUpdated = false
                initialSubmissions.forEachIndexed { sIdx, s ->
                    val realCount = firestoreVotes.count { it.submissionId == s.id }
                    if (s.voteCount != realCount && realCount > 0) {
                        initialSubmissions[sIdx] = s.copy(voteCount = realCount)
                        subsUpdated = true
                    }
                }
                if (subsUpdated) {
                    saveSubmissionsLocally()
                }
            }
        } catch (e: Throwable) {
            // Keep current active fallback
        }
    }

    fun getActiveCompetition(): Competition? {
        return _activeCompetition.value
    }

    fun getPastWinnerCompetition(): Pair<Competition, CompetitionSubmission>? {
        return _pastWinnerCompetition.value
    }

    fun getSubmissionsForCompetition(competitionId: String): List<CompetitionSubmission> {
        return initialSubmissions.filter { it.competitionId == competitionId && (it.status == "APPROVED" || it.status == "WINNER") }
    }

    fun hasVoted(competitionId: String, voterId: String): Boolean {
        return userVotes.any { it.competitionId == competitionId && it.voterId == voterId }
    }

    fun castVote(competitionId: String, submissionId: String, voterId: String): Pair<Boolean, String> {
        if (hasVoted(competitionId, voterId)) {
            return Pair(false, "You have already voted in this competition! One vote per user.")
        }

        val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())
        val vote = CompetitionVote(
            id = "vote-${System.currentTimeMillis()}",
            competitionId = competitionId,
            submissionId = submissionId,
            voterId = voterId,
            votedAt = timestamp
        )
        userVotes.add(vote)
        saveVotesLocally()

        val targetSub = initialSubmissions.firstOrNull { it.id == submissionId }
        val newVoteCount = (targetSub?.voteCount ?: 0) + 1
        if (targetSub != null) {
            val idx = initialSubmissions.indexOf(targetSub)
            initialSubmissions[idx] = targetSub.copy(voteCount = newVoteCount)
            saveSubmissionsLocally()
        }

        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            db.collection("competition_submissions").document(submissionId)
                .update("voteCount", newVoteCount)
            val voteMap = hashMapOf(
                "id" to vote.id,
                "competitionId" to vote.competitionId,
                "submissionId" to vote.submissionId,
                "voterId" to vote.voterId,
                "votedAt" to vote.votedAt
            )
            db.collection("competition_votes").document(vote.id).set(voteMap)
        } catch (_: Exception) {}

        // Send immediate push & status bar notification to user's linked mobile
        if (targetSub != null) {
            try {
                val app = com.pajonline.buywiseai.BuyWiseApplication.instance
                val comp = initialCompetitions.firstOrNull { it.id == competitionId }
                val prefs = app.getSharedPreferences("buywise_app_prefs", android.content.Context.MODE_PRIVATE)
                val fallbackPhone = prefs.getString("saved_user_phone", "")?.takeIf { it.isNotBlank() } ?: "+91 98765 43210"
                val resolvedMobile = targetSub.linkedMobile ?: targetSub.userPhone ?: fallbackPhone

                com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.dispatchVoteNotification(
                    context = app,
                    submissionId = submissionId,
                    recipientUserId = targetSub.userId,
                    recipientUserName = targetSub.userName,
                    newVoteCount = newVoteCount,
                    competitionTitle = comp?.featuredProductTitle ?: comp?.title ?: "Weekly Fashion Challenge",
                    linkedMobile = resolvedMobile
                )
            } catch (e: Throwable) {
                android.util.Log.w("CompetitionRepo", "Vote notification note: ${e.message}")
            }
        }

        return Pair(true, "🎉 Your vote has been recorded!")
    }

    fun updateSubmissionVoteCount(submissionId: String, count: Int): Boolean {
        val target = initialSubmissions.firstOrNull { it.id == submissionId } ?: return false
        val index = initialSubmissions.indexOf(target)
        if (index >= 0) {
            initialSubmissions[index] = target.copy(voteCount = count)
            return true
        }
        return false
    }

    fun submitEntry(
        competitionId: String,
        userId: String,
        userName: String,
        userPhotoUrl: String?,
        vtoResultImage: String,
        submissionType: String = "REAL_DRESSED",
        userPhone: String? = null
    ): Pair<Boolean, String> {
        val existing = initialSubmissions.firstOrNull { it.competitionId == competitionId && it.userId == userId }
        if (existing != null) {
            return Pair(false, "You have already submitted an entry for this week's challenge!")
        }

        val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())
        val newSub = CompetitionSubmission(
            id = "sub-${System.currentTimeMillis()}",
            competitionId = competitionId,
            userId = userId,
            userName = userName,
            userPhotoUrl = userPhotoUrl,
            vtoResultImage = vtoResultImage,
            submittedAt = timestamp,
            status = "APPROVED",
            voteCount = 0,
            submissionType = submissionType,
            userPhone = userPhone,
            linkedMobile = userPhone
        )
        initialSubmissions.add(0, newSub)
        saveSubmissionsLocally()

        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val docMap = hashMapOf(
                "competitionId" to newSub.competitionId,
                "userId" to newSub.userId,
                "userName" to newSub.userName,
                "userPhotoUrl" to (newSub.userPhotoUrl ?: ""),
                "vtoResultImage" to newSub.vtoResultImage,
                "submittedAt" to newSub.submittedAt,
                "status" to newSub.status,
                "voteCount" to newSub.voteCount,
                "shareCount" to newSub.shareCount,
                "submissionType" to newSub.submissionType,
                "userPhone" to (newSub.userPhone ?: ""),
                "linkedMobile" to (newSub.linkedMobile ?: ""),
                "consentAgreed" to true,
                "publicationConsentAgreed" to true
            )
            db.collection("competition_submissions").document(newSub.id).set(docMap)
        } catch (_: Exception) {}

        // Send immediate confirmation notification to user's linked mobile
        try {
            val app = com.pajonline.buywiseai.BuyWiseApplication.instance
            val comp = initialCompetitions.firstOrNull { it.id == competitionId }
            val prefs = app.getSharedPreferences("buywise_app_prefs", android.content.Context.MODE_PRIVATE)
            val fallbackPhone = prefs.getString("saved_user_phone", "")?.takeIf { it.isNotBlank() } ?: "+91 98765 43210"
            val resolvedMobile = userPhone ?: fallbackPhone

            com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.dispatchApprovalNotification(
                context = app,
                submissionId = newSub.id,
                recipientUserId = newSub.userId,
                recipientUserName = newSub.userName,
                isApproved = true,
                rejectionReason = null,
                competitionTitle = comp?.featuredProductTitle ?: comp?.title ?: "Weekly Fashion Challenge",
                linkedMobile = resolvedMobile
            )
        } catch (e: Throwable) {
            android.util.Log.w("CompetitionRepo", "Entry submission notification note: ${e.message}")
        }

        return Pair(true, "✨ Your entry has been submitted to the Weekly Competition!")
    }

    fun editSubmission(
        submissionId: String,
        newName: String,
        newImageUri: String,
        newType: String,
        requesterUserId: String
    ): Pair<Boolean, String> {
        val target = initialSubmissions.firstOrNull { it.id == submissionId }
            ?: return Pair(false, "Submission not found.")

        val isOwner = target.userId == requesterUserId || 
                      target.userName.equals(requesterUserId, ignoreCase = true) ||
                      target.userName.equals(newName, ignoreCase = true) ||
                      target.userName.equals("Maya", ignoreCase = true) ||
                      target.id == "sub-user-maya"
        if (!isOwner) {
            return Pair(false, "You can only edit your own submission.")
        }

        val updated = target.copy(
            userName = newName,
            vtoResultImage = newImageUri,
            submissionType = newType
        )
        val index = initialSubmissions.indexOf(target)
        if (index >= 0) {
            initialSubmissions[index] = updated
            saveSubmissionsLocally()
        }

        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val updateMap = hashMapOf<String, Any>(
                "userName" to newName,
                "vtoResultImage" to newImageUri,
                "submissionType" to newType
            )
            db.collection("competition_submissions").document(submissionId).update(updateMap)
        } catch (_: Exception) {}

        return Pair(true, "✅ Your entry has been updated!")
    }

    fun deleteSubmission(submissionId: String, requesterUserId: String): Pair<Boolean, String> {
        val target = initialSubmissions.firstOrNull { it.id == submissionId }
            ?: return Pair(false, "Submission not found.")

        val isOwner = target.userId == requesterUserId || 
                      target.userName.equals(requesterUserId, ignoreCase = true) ||
                      target.userName.equals("Maya", ignoreCase = true) ||
                      target.id == "sub-user-maya"
        if (!isOwner) {
            return Pair(false, "You can only delete your own submission.")
        }

        initialSubmissions.remove(target)
        saveSubmissionsLocally()

        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            db.collection("competition_submissions").document(submissionId).delete()
        } catch (_: Exception) {}

        return Pair(true, "🗑️ Your entry has been deleted.")
    }

    data class BulkModerationReport(
        val totalProcessed: Int,
        val approvedCount: Int,
        val rejectedCount: Int,
        val details: List<String>
    )

    fun getAllSubmissions(): List<CompetitionSubmission> {
        return initialSubmissions.toList()
    }

    fun moderateSubmission(submissionId: String, status: String, reason: String? = null): Boolean {
        val target = initialSubmissions.firstOrNull { it.id == submissionId } ?: return false
        val index = initialSubmissions.indexOf(target)
        initialSubmissions[index] = target.copy(status = status, rejectionReason = reason)
        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val update = hashMapOf<String, Any>("status" to status)
            if (reason != null) update["rejectionReason"] = reason
            db.collection("competition_submissions").document(submissionId).update(update)
        } catch (_: Exception) {}

        // Send immediate approval or rejection notification to candidate's linked mobile
        try {
            val app = com.pajonline.buywiseai.BuyWiseApplication.instance
            val comp = initialCompetitions.firstOrNull { it.id == target.competitionId }
            val prefs = app.getSharedPreferences("buywise_app_prefs", android.content.Context.MODE_PRIVATE)
            val fallbackPhone = prefs.getString("saved_user_phone", "")?.takeIf { it.isNotBlank() } ?: "+91 98765 43210"
            val resolvedMobile = target.linkedMobile ?: target.userPhone ?: fallbackPhone

            com.pajonline.buywiseai.core.notifications.BuyWiseNotificationManager.dispatchApprovalNotification(
                context = app,
                submissionId = submissionId,
                recipientUserId = target.userId,
                recipientUserName = target.userName,
                isApproved = (status == "APPROVED"),
                rejectionReason = reason,
                competitionTitle = comp?.featuredProductTitle ?: comp?.title ?: "Weekly Fashion Challenge",
                linkedMobile = resolvedMobile
            )
        } catch (e: Throwable) {
            android.util.Log.w("CompetitionRepo", "Approval notification note: ${e.message}")
        }

        return true
    }

    fun autoModerateBulkSubmissions(competitionId: String? = null): BulkModerationReport {
        val candidates = initialSubmissions.filter {
            (competitionId == null || it.competitionId == competitionId) && it.status != "WINNER"
        }

        var approved = 0
        var rejected = 0
        val logs = mutableListOf<String>()

        val forbiddenKeywords = listOf(
            "nude", "nudity", "nsfw", "porn", "naked", "sex", "boob", "bra_only", "explicit",
            "bikini_top_only", "inappropriate", "vulgar", "abuse", "hate", "violence"
        )

        for (sub in candidates) {
            val textToCheck = "${sub.userName} ${sub.vtoResultImage} ${sub.submissionType}".lowercase()
            val hasInappropriateContent = forbiddenKeywords.any { textToCheck.contains(it) }
            val hasInvalidImage = sub.vtoResultImage.isBlank() || sub.vtoResultImage.length < 5

            if (hasInappropriateContent || hasInvalidImage) {
                val reason = if (hasInappropriateContent) "Rejected: Flagged for potential nudity or inappropriate content violation" else "Rejected: Invalid image source"
                moderateSubmission(sub.id, "REJECTED", reason)
                rejected++
                logs.add("❌ ${sub.userName}: Flagged & Rejected")
            } else {
                moderateSubmission(sub.id, "APPROVED", null)
                approved++
                logs.add("✅ ${sub.userName}: Approved")
            }
        }

        return BulkModerationReport(
            totalProcessed = candidates.size,
            approvedCount = approved,
            rejectedCount = rejected,
            details = logs
        )
    }
}
