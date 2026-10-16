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
            title = "Weekly BuyWise Fashion Challenge: Gujarati Traditional Navratri Waist Belt with Long Tie Hanging | Embroidered Kutchi Mirror Work Kamarbandh/Waist Band for Chaniya Choli & Garba Dress",
            description = "Try on this week's featured fashion product and submit your entry to win!",
            featuredProductId = "prod-1792144504194",
            featuredProductTitle = "Gujarati Traditional Navratri Waist Belt with Long Tie Hanging | Embroidered Kutchi Mirror Work Kamarbandh/Waist Band for Chaniya Choli & Garba Dress",
            featuredProductImage = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
            featuredProductPrice = 499,
            retailer = "Amazon India",
            startDate = "2026-10-16T09:55:04.194Z",
            endDate = "2026-10-23T09:55:04.194Z",
            votingEndDate = "2026-10-23T09:55:04.194Z",
            status = "LIVE",
            prizeDescription = "Free Dress+ BuyWise Home & Social Media Spotlight",
            createdBy = "pajonline555@gmail.com",
            createdAt = "2026-10-16T09:55:04.194Z"
        ),
        Competition(
            id = "comp-week-37-2026",
            title = "Weekly BuyWise Fashion Challenge: Royal Kanjivaram Silk Saree",
            description = "Previous challenge: Authentic Banarasi Kanjivaram Silk Saree in Crimson Gold.",
            featuredProductId = "prod-kanjivaram-silk-1",
            featuredProductTitle = "Authentic Banarasi Kanjivaram Silk Saree in Crimson Gold",
            featuredProductImage = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
            featuredProductPrice = 4999,
            retailer = "Amazon India",
            startDate = "2026-09-07T00:00:00Z",
            endDate = "2026-09-12T23:59:59Z",
            votingEndDate = "2026-09-13T18:00:00Z",
            status = "VOTING_CLOSED",
            prizeDescription = "₹5,000 Shopping Voucher + Featured Banner on BuyWise Home Screen",
            createdBy = "pajonline555@gmail.com",
            createdAt = "2026-09-07T00:00:00Z"
        ),
        Competition(
            id = "comp-week-36-2026",
            title = "Weekly BuyWise Fashion Challenge: Designer Anarkali Suit",
            description = "Previous week's challenge featuring luxury embroidered Anarkali suits.",
            featuredProductId = "prod-anarkali-suit-2",
            featuredProductTitle = "Emerald Green Hand-Embroidered Anarkali Set",
            featuredProductImage = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
            featuredProductPrice = 3850,
            retailer = "Myntra",
            startDate = "2026-08-31T00:00:00Z",
            endDate = "2026-09-05T23:59:59Z",
            votingEndDate = "2026-09-06T18:00:00Z",
            status = "WINNER_DECLARED",
            prizeDescription = "₹5,000 Shopping Voucher",
            createdBy = "pajonline555@gmail.com",
            createdAt = "2026-08-31T00:00:00Z",
            votesFrozen = true,
            winnerId = "sub-36-winner",
            winnerName = "Sneha Reddy"
        )
    )

    private val initialSubmissions = mutableStateListOf(
        CompetitionSubmission(
            id = "sub-37-1",
            competitionId = "comp-week-37-2026",
            userId = "user-priya-sharma",
            userName = "Priya Sharma",
            userPhotoUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            vtoResultImage = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
            submittedAt = "2026-09-08T14:20:00Z",
            status = "APPROVED",
            voteCount = 142,
            shareCount = 28
        ),
        CompetitionSubmission(
            id = "sub-37-2",
            competitionId = "comp-week-37-2026",
            userId = "user-ananya-roy",
            userName = "Ananya Roy",
            userPhotoUrl = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
            vtoResultImage = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
            submittedAt = "2026-09-08T16:45:00Z",
            status = "APPROVED",
            voteCount = 118,
            shareCount = 19
        ),
        CompetitionSubmission(
            id = "sub-36-winner",
            competitionId = "comp-week-36-2026",
            userId = "user-sneha-reddy",
            userName = "Sneha Reddy",
            userPhotoUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
            vtoResultImage = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
            submittedAt = "2026-09-02T11:00:00Z",
            status = "WINNER",
            voteCount = 1284,
            shareCount = 310
        )
    )

    private val userVotes = mutableStateListOf<CompetitionVote>()

    private val _activeCompetition = mutableStateOf<Competition?>(
        initialCompetitions.firstOrNull { it.status == "LIVE" } ?: initialCompetitions.firstOrNull()
    )

    private val _pastWinnerCompetition = mutableStateOf<Pair<Competition, CompetitionSubmission>?>(
        computeInitialWinnerPair()
    )

    init {
        startFirestoreSync()
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
                        Competition(
                            id = doc.id,
                            title = doc.getString("title") ?: "",
                            description = doc.getString("description") ?: "",
                            featuredProductId = doc.getString("featuredProductId") ?: "",
                            featuredProductTitle = doc.getString("featuredProductTitle") ?: "",
                            featuredProductImage = doc.getString("featuredProductImage") ?: "",
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
                    if (winnerComp != null) {
                        val sub = initialSubmissions.firstOrNull { it.id == winnerComp.winnerId || it.status == "WINNER" }
                            ?: CompetitionSubmission(
                                id = winnerComp.winnerId ?: "sub-winner",
                                competitionId = winnerComp.id,
                                userId = "user-winner",
                                userName = winnerComp.winnerName ?: "Sneha Reddy",
                                vtoResultImage = winnerComp.featuredProductImage,
                                submittedAt = winnerComp.createdAt,
                                status = "WINNER",
                                voteCount = 1284
                            )
                        _pastWinnerCompetition.value = Pair(winnerComp, sub)
                    }
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

        val targetSub = initialSubmissions.firstOrNull { it.id == submissionId }
        if (targetSub != null) {
            targetSub.voteCount += 1
        }

        return Pair(true, "🎉 Your vote has been recorded!")
    }

    fun submitEntry(
        competitionId: String,
        userId: String,
        userName: String,
        userPhotoUrl: String?,
        vtoResultImage: String
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
            voteCount = 1
        )
        initialSubmissions.add(0, newSub)
        return Pair(true, "✨ Your entry has been submitted to the Weekly Competition!")
    }
}
