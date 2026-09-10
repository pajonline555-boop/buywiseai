package com.pajonline.buywiseai.domain.model

data class Competition(
    val id: String,
    val title: String,
    val description: String,
    val featuredProductId: String,
    val featuredProductTitle: String,
    val featuredProductImage: String,
    val featuredProductPrice: Int,
    val retailer: String,
    val startDate: String,
    val endDate: String,
    val votingEndDate: String,
    val status: String, // 'LIVE', 'WINNER_DECLARED', 'VOTING_CLOSED', etc.
    val prizeDescription: String,
    val termsVersion: String = "1.0",
    val createdBy: String = "pajonline555@gmail.com",
    val createdAt: String = "",
    val votesFrozen: Boolean = false,
    val winnerId: String? = null,
    val winnerName: String? = null
)

data class CompetitionSubmission(
    val id: String,
    val competitionId: String,
    val userId: String,
    val userName: String,
    val userPhotoUrl: String? = null,
    val vtoResultImage: String,
    val submittedAt: String,
    val status: String, // 'APPROVED', 'WINNER', 'REJECTED', 'SUBMITTED'
    var voteCount: Int,
    val shareCount: Int = 0,
    val consentAgreed: Boolean = true,
    val publicationConsentAgreed: Boolean = true,
    val rejectionReason: String? = null
)

data class CompetitionVote(
    val id: String,
    val competitionId: String,
    val submissionId: String,
    val voterId: String,
    val votedAt: String
)
