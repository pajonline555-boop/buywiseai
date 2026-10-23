package com.pajonline.buywiseai.ui.screens.competition

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pajonline.buywiseai.data.repository.CompetitionRepository
import com.pajonline.buywiseai.domain.model.CompetitionSubmission
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple
import java.io.File

@Composable
fun CompetitionScreen(
    onBack: () -> Unit = {},
    onNavigateToVto: () -> Unit = {},
    onNavigateToWeb: (title: String, url: String) -> Unit = { _, _ -> }
) {
    val context = LocalContext.current
    val activeComp = CompetitionRepository.getActiveCompetition()
    val pastWinnerPair = CompetitionRepository.getPastWinnerCompetition()
    val allSubmissions = CompetitionRepository.getAllSubmissions()
    val submissions = if (activeComp != null) {
        allSubmissions.filter { it.competitionId == activeComp.id && (it.status == "APPROVED" || it.status == "WINNER") }
    } else emptyList()

    val prefs = remember { context.getSharedPreferences("buywise_competition_prefs", android.content.Context.MODE_PRIVATE) }
    var voterId by remember {
        mutableStateOf(
            prefs.getString("user_voter_uuid", null) ?: run {
                val newId = "voter_${java.util.UUID.randomUUID().toString().take(8)}"
                prefs.edit().putString("user_voter_uuid", newId).apply()
                newId
            }
        )
    }
    var votedSubmissionId by remember {
        mutableStateOf(prefs.getString("voted_sub_${activeComp?.id}", null))
    }

    var showSubmitDialog by remember { mutableStateOf(false) }
    var showRulesDialog by remember { mutableStateOf(false) }
    var submissionToEdit by remember { mutableStateOf<CompetitionSubmission?>(null) }
    var submissionToDelete by remember { mutableStateOf<CompetitionSubmission?>(null) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF090714)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // WORLD-CLASS LUXURY HEADER
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0xFF1B162E), CircleShape)
                        .border(1.dp, BuyWiseCyan.copy(alpha = 0.5f), CircleShape)
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center
                ) {
                    Text("←", fontSize = 19.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .background(
                                    brush = Brush.horizontalGradient(listOf(BuyWiseGold, BuyWiseNeonPink)),
                                    shape = RoundedCornerShape(10.dp)
                                )
                                .padding(horizontal = 9.dp, vertical = 2.5.dp)
                        ) {
                            Text("🏆 BUYWISE CHALLENGE", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.Black)
                        }

                        Box(
                            modifier = Modifier
                                .background(BuyWiseEmerald.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                                .border(1.dp, BuyWiseEmerald.copy(alpha = 0.6f), RoundedCornerShape(10.dp))
                                .padding(horizontal = 8.dp, vertical = 2.5.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Box(modifier = Modifier.size(6.dp).background(BuyWiseEmerald, CircleShape))
                                Text("LIVE", fontSize = 9.5.sp, fontWeight = FontWeight.Black, color = BuyWiseEmerald)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = "Weekly Try-On Competition",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // WORLD-CLASS YOUTUBE SHORTS BANNER (CRISP, RESPONSIVE, ZERO AWKWARD BREAKS)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        brush = Brush.horizontalGradient(
                            colors = listOf(Color(0xFF2E0616), Color(0xFF160624))
                        )
                    )
                    .border(1.dp, Color(0xFFFF0055).copy(alpha = 0.45f), RoundedCornerShape(16.dp))
                    .clickable {
                        val ytShortsUrl = "https://www.youtube.com/@BUYWISEAI-u8n/shorts"
                        onNavigateToWeb("BuyWise AI Shorts", ytShortsUrl)
                    }
                    .padding(horizontal = 14.dp, vertical = 11.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .background(
                                    brush = Brush.radialGradient(listOf(Color(0xFFFF0033), Color(0xFF990022))),
                                    shape = CircleShape
                                )
                                .border(1.dp, Color.White.copy(alpha = 0.3f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("▶", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = "YouTube Shorts",
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                                Box(
                                    modifier = Modifier
                                        .background(Color(0xFFFF0055).copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 6.dp, vertical = 1.dp)
                                ) {
                                    Text(
                                        text = "@BUYWISEAI",
                                        fontSize = 9.5.sp,
                                        color = Color(0xFFFF6699),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Watch weekly try-on video reels & creators",
                                fontSize = 10.sp,
                                color = Color(0xFFD1D5DB)
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFFFF0055).copy(alpha = 0.15f),
                        border = BorderStroke(1.dp, Color(0xFFFF0055).copy(alpha = 0.6f))
                    ) {
                        Text(
                            text = "Watch Reels ↗",
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFFFF4D79),
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // ACTIVE HERO COMPETITION CARD
                if (activeComp != null) {
                    item {
                        val cleanShortTitle = remember(activeComp.title) {
                            activeComp.title.substringBefore("|")
                                .replace("Weekly BuyWise Fashion Challenge: ", "")
                                .replace("Weekly BuyWise Fashion Challenge:", "")
                                .trim()
                        }
                        val productImg = remember(activeComp.featuredProductImage) {
                            if (activeComp.featuredProductImage.isNotBlank() && !activeComp.featuredProductImage.contains("unsplash")) {
                                activeComp.featuredProductImage
                            } else {
                                "https://buywiseai.pajonline.co.in/kamarbandh.png"
                            }
                        }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF130E26)),
                            shape = RoundedCornerShape(22.dp),
                            border = BorderStroke(1.2.dp, BuyWiseGold.copy(alpha = 0.45f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                                        Box(modifier = Modifier.size(7.dp).background(BuyWiseEmerald, CircleShape))
                                        Text("STATUS: ${activeComp.status}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
                                    }
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = BuyWiseCyan.copy(alpha = 0.12f),
                                        border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.4f))
                                    ) {
                                        Text("🆓 Free Entry • 18+ Only", fontSize = 10.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // PRODUCT IMAGE + SHORT TITLE
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(86.dp)
                                            .clip(RoundedCornerShape(16.dp))
                                            .background(Color(0xFF140F26))
                                            .border(1.5.dp, BuyWiseGold.copy(alpha = 0.6f), RoundedCornerShape(16.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        AsyncImage(
                                            model = productImg,
                                            contentDescription = cleanShortTitle,
                                            contentScale = ContentScale.Fit,
                                            modifier = Modifier.fillMaxSize().padding(3.dp)
                                        )
                                    }

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = cleanShortTitle,
                                            fontSize = 15.5.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color.White,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "👗 Verified ${activeComp.retailer} • ₹${activeComp.featuredProductPrice}",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = BuyWiseCyan
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "⏳ Live Voting • Information will be given on app and social media",
                                            fontSize = 9.5.sp,
                                            color = Color(0xFFA5B4FC)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // GRAND PRIZE BANNER
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            brush = Brush.horizontalGradient(
                                                listOf(Color(0xFF2E2211), Color(0xFF1E172E))
                                            ),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        .border(1.dp, BuyWiseGold.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                        .padding(10.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text("🎁", fontSize = 14.sp)
                                        Text(
                                            text = "Grand Prize: ${activeComp.prizeDescription}",
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = BuyWiseGold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(14.dp))

                                // PRIMARY CALL-TO-ACTION BUTTON (TRY OUTFIT IN VTO)
                                Button(
                                    onClick = {
                                        com.pajonline.buywiseai.ui.screens.vto.VtoSessionState.setTarget(
                                            title = activeComp.featuredProductTitle,
                                            imageUrl = activeComp.featuredProductImage,
                                            price = activeComp.featuredProductPrice,
                                            compId = activeComp.id,
                                            retailer = activeComp.retailer
                                        )
                                        onNavigateToVto()
                                    },
                                    modifier = Modifier.fillMaxWidth().height(44.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("👗 Try Outfit in AI Virtual Try-On", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.5.sp)
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                // SECONDARY ACTIONS: ENTER CHALLENGE & RULES
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = { showSubmitDialog = true },
                                        modifier = Modifier.weight(1.3f).height(40.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = PaddingValues(horizontal = 6.dp)
                                    ) {
                                        Text("🏆 Enter Look (Photo / AI)", color = Color.White, fontWeight = FontWeight.Black, fontSize = 11.sp, maxLines = 1)
                                    }

                                    Button(
                                        onClick = { showRulesDialog = true },
                                        modifier = Modifier.weight(1f).height(40.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1B162E)),
                                        border = BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.5f)),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = PaddingValues(horizontal = 6.dp)
                                    ) {
                                        Text("📜 Rules & Info", color = Color(0xFFFFD700), fontWeight = FontWeight.Bold, fontSize = 11.sp, maxLines = 1)
                                    }
                                }
                            }
                        }
                    }
                }

                // SUNDAY WINNER SPOTLIGHT (ONLY DISPLAYED IF AUTHENTIC WINNER EXISTS)
                if (pastWinnerPair != null) {
                    item {
                        val (pastComp, winner) = pastWinnerPair
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                            shape = RoundedCornerShape(20.dp),
                            border = BorderStroke(1.dp, BuyWiseEmerald.copy(alpha = 0.5f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("👑 WINNER SPOTLIGHT", fontSize = 11.sp, fontWeight = FontWeight.Black, color = BuyWiseEmerald)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Congratulations, ${winner.userName}! 🎉", fontSize = 17.sp, fontWeight = FontWeight.Black, color = Color.White)
                                Text("Winner of ${pastComp.title} with ${winner.voteCount} community votes!", fontSize = 11.5.sp, color = Color.LightGray)
                            }
                        }
                    }
                }

                // VOTING GALLERY HEADER
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("🗳️ Approved Entries Voting Gallery", fontSize = 15.5.sp, fontWeight = FontWeight.Black, color = Color.White)
                            Box(
                                modifier = Modifier
                                    .background(BuyWiseGold.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                    .border(1.dp, BuyWiseGold.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 7.dp, vertical = 2.dp)
                            ) {
                                Text("${submissions.size}", fontSize = 11.sp, fontWeight = FontWeight.Black, color = BuyWiseGold)
                            }
                        }

                        if (submissions.isNotEmpty()) {
                            Text("🔥 1 Vote / User", fontSize = 10.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // EMPTY STATE (WORLD CLASS) WHEN NO SUBMISSIONS YET
                if (submissions.isEmpty()) {
                    item {
                        EmptyChallengeGalleryCard(
                            onEnterNow = { showSubmitDialog = true },
                            onTryOutfit = {
                                if (activeComp != null) {
                                    com.pajonline.buywiseai.ui.screens.vto.VtoSessionState.setTarget(
                                        title = activeComp.featuredProductTitle,
                                        imageUrl = activeComp.featuredProductImage,
                                        price = activeComp.featuredProductPrice,
                                        compId = activeComp.id,
                                        retailer = activeComp.retailer
                                    )
                                }
                                onNavigateToVto()
                            }
                        )
                    }
                } else {
                    // SUBMISSIONS VOTING GRID ITEMS
                    items(submissions) { sub ->
                        val isVotedForThis = votedSubmissionId == sub.id
                        val isAnyVoted = votedSubmissionId != null || (activeComp != null && CompetitionRepository.hasVoted(activeComp.id, voterId))
                        val savedName = prefs.getString("saved_user_name", "") ?: ""
                        val isOwner = sub.userId == voterId || (savedName.isNotBlank() && sub.userName.equals(savedName, ignoreCase = true))
                        SubmissionVotingCard(
                            submission = sub,
                            isOwner = isOwner,
                            isVotedForThis = isVotedForThis,
                            isVotingDisabled = isAnyVoted && !isVotedForThis,
                            onVote = {
                                val (success, msg) = CompetitionRepository.castVote(sub.competitionId, sub.id, voterId)
                                if (success) {
                                    prefs.edit().putString("voted_sub_${sub.competitionId}", sub.id).apply()
                                    votedSubmissionId = sub.id
                                }
                                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                            },
                            onEdit = {
                                submissionToEdit = sub
                            },
                            onDelete = {
                                submissionToDelete = sub
                            }
                        )
                    }
                }

                // Ample spacing for bottom navigation bar and Maya floating widget
                item { Spacer(modifier = Modifier.height(130.dp)) }
            }
        }
    }

    // VOLUNTARY ENTRY SUBMISSION DIALOG
    if (showSubmitDialog) {
        SubmitEntryDialog(
            activeComp = activeComp,
            onDismiss = { showSubmitDialog = false },
            onSubmit = { name, imageUri, subType ->
                if (activeComp != null) {
                    val linkedPhone = prefs.getString("saved_user_phone", "") ?: ""
                    prefs.edit().putString("saved_user_name", name).apply()
                    val (success, msg) = CompetitionRepository.submitEntry(
                        competitionId = activeComp.id,
                        userId = voterId,
                        userName = name,
                        userPhotoUrl = null,
                        vtoResultImage = imageUri,
                        submissionType = subType,
                        userPhone = linkedPhone
                    )
                    Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                }
                showSubmitDialog = false
            }
        )
    }

    // EDIT SUBMISSION DIALOG (ONLY FOR OWNER)
    submissionToEdit?.let { sub ->
        EditEntryDialog(
            submission = sub,
            onDismiss = { submissionToEdit = null },
            onSave = { updatedName, updatedImageUri, updatedType ->
                val (success, msg) = CompetitionRepository.editSubmission(
                    submissionId = sub.id,
                    newName = updatedName,
                    newImageUri = updatedImageUri,
                    newType = updatedType,
                    requesterUserId = voterId
                )
                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                submissionToEdit = null
            }
        )
    }

    // DELETE SUBMISSION CONFIRMATION DIALOG (ONLY FOR OWNER)
    submissionToDelete?.let { sub ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { submissionToDelete = null },
            containerColor = Color(0xFF161226),
            title = {
                Text(
                    "🗑️ Delete Entry?",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Text(
                    "Are you sure you want to delete your challenge entry for \"${sub.userName}\"? This will permanently remove your look and votes from the live competition.",
                    color = Color.LightGray,
                    fontSize = 13.5.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val (success, msg) = CompetitionRepository.deleteSubmission(sub.id, voterId)
                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                        submissionToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Delete", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                androidx.compose.material3.TextButton(onClick = { submissionToDelete = null }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    if (showRulesDialog && activeComp != null) {
        com.pajonline.buywiseai.ui.components.ChallengeRulesDialog(
            onDismissRequest = { showRulesDialog = false }
        )
    }
}

@Composable
private fun EmptyChallengeGalleryCard(
    onEnterNow: () -> Unit,
    onTryOutfit: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF120E24)),
        shape = RoundedCornerShape(22.dp),
        border = BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.35f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(
                        brush = Brush.radialGradient(listOf(BuyWisePurple, Color(0xFF1E113A))),
                        shape = CircleShape
                    )
                    .border(1.5.dp, BuyWiseGold.copy(alpha = 0.8f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text("🏆", fontSize = 28.sp)
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "Be the First Challenger! 🌟",
                fontSize = 17.5.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "No approved entries yet this week. Claim the #1 spot on the voting leaderboard right now and lead the competition!",
                fontSize = 12.sp,
                color = Color(0xFFCBD5E1),
                textAlign = TextAlign.Center,
                lineHeight = 17.sp
            )

            Spacer(modifier = Modifier.height(18.dp))

            // 3 STEPS HOW IT WORKS
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1B1533), RoundedCornerShape(12.dp))
                    .padding(10.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("1️⃣", fontSize = 14.sp)
                    Text("Try Outfit", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = BuyWiseGold)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("2️⃣", fontSize = 14.sp)
                    Text("Submit Look", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = BuyWiseCyan)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("3️⃣", fontSize = 14.sp)
                    Text("Get Votes", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = onEnterNow,
                    modifier = Modifier.weight(1f).height(42.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("✨ Enter Now", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp)
                }

                Button(
                    onClick = onTryOutfit,
                    modifier = Modifier.weight(1f).height(42.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1738)),
                    border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.6f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("👗 Try Outfit", color = BuyWiseCyan, fontWeight = FontWeight.Black, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun SubmissionVotingCard(
    submission: CompetitionSubmission,
    isOwner: Boolean = false,
    isVotedForThis: Boolean,
    isVotingDisabled: Boolean,
    onVote: () -> Unit,
    onEdit: () -> Unit = {},
    onDelete: () -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF130F25)),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // HIGH-FASHION PORTRAIT IMAGE WITH OVERLAY BADGES
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(340.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF0C091A)),
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = submission.vtoResultImage,
                    contentDescription = submission.userName,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize().padding(2.dp)
                )

                // BOTTOM GRADIENT SCRIM FOR HIGH LEGIBILITY
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                        .align(Alignment.BottomCenter)
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, Color.Black.copy(alpha = 0.75f))
                            )
                        )
                )

                // TYPE BADGE (TOP-LEFT)
                val isReal = submission.submissionType == "REAL_DRESSED"
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = if (isReal) Color(0xEE0A381F) else Color(0xEE38113B),
                    border = BorderStroke(1.dp, if (isReal) BuyWiseEmerald else BuyWiseNeonPink),
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp)
                ) {
                    Text(
                        text = if (isReal) "📸 Real Dressed Look" else "✨ AI Concept Look",
                        color = if (isReal) BuyWiseEmerald else BuyWiseNeonPink,
                        fontWeight = FontWeight.Black,
                        fontSize = 10.5.sp,
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.5.dp)
                    )
                }

                // VOTE COUNT BADGE (TOP-RIGHT)
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xDD000000),
                    border = BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.5f)),
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.5.dp)
                    ) {
                        Text("❤️", fontSize = 11.sp)
                        Text(
                            text = if (submission.voteCount == 1) "1 Vote" else "${submission.voteCount} Votes",
                            color = BuyWiseGold,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // USER INFO & VOTE / EDIT-DELETE ACTION ROW
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    // USER AVATAR WITH INITIAL
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                brush = Brush.linearGradient(listOf(BuyWisePurple, BuyWiseNeonPink)),
                                shape = CircleShape
                            )
                            .border(1.dp, BuyWiseGold.copy(alpha = 0.6f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = submission.userName.take(1).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = 15.sp
                        )
                    }

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = submission.userName,
                                fontSize = 14.5.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text("✓", color = BuyWiseCyan, fontSize = 12.sp, fontWeight = FontWeight.Black)
                        }
                        Text(
                            text = if (isOwner) "✨ Your Entry • ${submission.status}" else "Verified Look • ${submission.status}",
                            fontSize = 11.sp,
                            color = if (isOwner) BuyWiseGold else Color(0xFF94A3B8)
                        )
                    }
                }

                if (isOwner) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = onEdit,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF251F3D)),
                            border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.6f)),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text("✏️ Edit", color = BuyWiseCyan, fontWeight = FontWeight.Bold, fontSize = 11.5.sp)
                        }

                        Button(
                            onClick = onDelete,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF33141E)),
                            border = BorderStroke(1.dp, Color(0xFFFF3366).copy(alpha = 0.6f)),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 9.dp, vertical = 6.dp)
                        ) {
                            Text("🗑️", fontSize = 12.sp)
                        }
                    }
                } else {
                    Button(
                        onClick = onVote,
                        enabled = !isVotedForThis && !isVotingDisabled,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isVotedForThis) BuyWiseEmerald.copy(alpha = 0.2f)
                                else if (isVotingDisabled) Color(0xFF1E1B2E)
                                else BuyWiseNeonPink,
                            disabledContainerColor = if (isVotedForThis) BuyWiseEmerald.copy(alpha = 0.2f) else Color(0xFF1B162E),
                            disabledContentColor = if (isVotedForThis) BuyWiseEmerald else Color.Gray
                        ),
                        border = BorderStroke(
                            1.dp,
                            if (isVotedForThis) BuyWiseEmerald else if (isVotingDisabled) Color.Gray.copy(alpha = 0.3f) else BuyWiseNeonPink
                        ),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Icon(
                            Icons.Default.Favorite,
                            contentDescription = "Vote",
                            tint = if (isVotedForThis) BuyWiseEmerald else if (isVotingDisabled) Color.Gray else Color.White,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isVotedForThis) "Voted ❤️" else "Vote",
                            color = if (isVotedForThis) BuyWiseEmerald else if (isVotingDisabled) Color.Gray else Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EditEntryDialog(
    submission: CompetitionSubmission,
    onDismiss: () -> Unit,
    onSave: (name: String, imageUri: String, subType: String) -> Unit
) {
    val context = LocalContext.current
    var name by remember { mutableStateOf(submission.userName) }
    var submissionType by remember { mutableStateOf(submission.submissionType) }
    var selectedImageUri by remember { mutableStateOf(submission.vtoResultImage) }
    var tempCameraUri by remember { mutableStateOf<Uri?>(null) }

    val pickPhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            selectedImageUri = uri.toString()
        }
    }

    val takePhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success && tempCameraUri != null) {
            selectedImageUri = tempCameraUri.toString()
        }
    }

    val scrollState = rememberScrollState()

    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF120D24),
            border = BorderStroke(1.2.dp, BuyWiseCyan.copy(alpha = 0.6f)),
            modifier = Modifier.fillMaxWidth().padding(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(18.dp)
                    .verticalScroll(scrollState)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("✏️", fontSize = 18.sp)
                        Text("Edit Challenge Entry", fontSize = 16.5.sp, fontWeight = FontWeight.Black, color = BuyWiseCyan)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // YOUR NAME INPUT
                Text("Your Creator Name", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    placeholder = { Text("e.g., Maya, Priya Sharma", color = Color.Gray) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = BuyWiseCyan,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.25f),
                        cursorColor = BuyWiseCyan
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(14.dp))

                // LOOK TYPE SELECTOR
                Text("Look Type", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val isReal = submissionType == "REAL_DRESSED"
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { submissionType = "REAL_DRESSED" },
                        shape = RoundedCornerShape(12.dp),
                        color = if (isReal) Color(0xFF0F3D24) else Color(0xFF1E1735),
                        border = BorderStroke(1.2.dp, if (isReal) BuyWiseEmerald else Color.White.copy(alpha = 0.15f))
                    ) {
                        Column(
                            modifier = Modifier.padding(10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("📸", fontSize = 18.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Real Dressed", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = if (isReal) BuyWiseEmerald else Color.White)
                        }
                    }

                    val isAi = submissionType == "AI_CONCEPT"
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { submissionType = "AI_CONCEPT" },
                        shape = RoundedCornerShape(12.dp),
                        color = if (isAi) Color(0xFF38113B) else Color(0xFF1E1735),
                        border = BorderStroke(1.2.dp, if (isAi) BuyWiseNeonPink else Color.White.copy(alpha = 0.15f))
                    ) {
                        Column(
                            modifier = Modifier.padding(10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("✨", fontSize = 18.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("AI Concept", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = if (isAi) BuyWiseNeonPink else Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // PHOTO PREVIEW & CHANGE OPTIONS
                Text("Challenge Look Photo", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(240.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF0C091A))
                        .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = selectedImageUri,
                        contentDescription = "Selected Look",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxSize().padding(4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            pickPhotoLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF231C38)),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("🖼️ Gallery", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = {
                            try {
                                val photoFile = File(context.cacheDir, "camera_edit_${System.currentTimeMillis()}.jpg")
                                val uri = FileProvider.getUriForFile(
                                    context,
                                    "${context.packageName}.fileprovider",
                                    photoFile
                                )
                                tempCameraUri = uri
                                takePhotoLauncher.launch(uri)
                            } catch (e: Exception) {
                                Toast.makeText(context, "Could not open camera: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF231C38)),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("📷 Camera", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // SAVE BUTTON
                Button(
                    onClick = {
                        if (name.isBlank()) {
                            Toast.makeText(context, "Please enter your creator name", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        onSave(name.trim(), selectedImageUri, submissionType)
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan)
                ) {
                    Text("💾 Save Changes", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 14.5.sp)
                }
            }
        }
    }
}

@Composable
private fun SubmitEntryDialog(
    activeComp: com.pajonline.buywiseai.domain.model.Competition?,
    onDismiss: () -> Unit,
    onSubmit: (name: String, imageUri: String, subType: String) -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("buywise_competition_prefs", android.content.Context.MODE_PRIVATE) }
    val savedName = remember { prefs.getString("saved_user_name", "") ?: "" }
    var name by remember { mutableStateOf(savedName) }
    var submissionType by remember { mutableStateOf("REAL_DRESSED") }
    var selectedImageUri by remember {
        mutableStateOf<String?>(
            com.pajonline.buywiseai.ui.screens.vto.VtoSessionState.lastGeneratedLookUri
                ?: activeComp?.featuredProductImage
        )
    }
    var tempCameraUri by remember { mutableStateOf<Uri?>(null) }
    var is18Plus by remember { mutableStateOf(false) }
    var consentVoting by remember { mutableStateOf(false) }
    var consentWinner by remember { mutableStateOf(false) }
    var consentRules by remember { mutableStateOf(false) }
    var showRulesInDialog by remember { mutableStateOf(false) }

    val pickPhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            selectedImageUri = uri.toString()
        }
    }

    val takePhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success && tempCameraUri != null) {
            selectedImageUri = tempCameraUri.toString()
        }
    }

    val scrollState = rememberScrollState()

    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF120D24),
            border = BorderStroke(1.2.dp, BuyWiseGold.copy(alpha = 0.45f)),
            modifier = Modifier.fillMaxWidth().padding(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(18.dp)
                    .verticalScroll(scrollState)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("🏆", fontSize = 18.sp)
                        Text("Submit Challenge Entry", fontSize = 16.5.sp, fontWeight = FontWeight.Black, color = BuyWiseGold)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Compete for the Free Designer Outfit! Upload your real dressed photo or an AI styled look.",
                    fontSize = 11.5.sp,
                    color = Color(0xFFCBD5E1)
                )

                Spacer(modifier = Modifier.height(14.dp))

                // DUAL SELECTION TABS: REAL LOOK VS AI LOOK (Direct affiliate link on click)
                val affiliateQuery = remember(activeComp?.featuredProductTitle) {
                    activeComp?.featuredProductTitle ?: "Gujarati Traditional Navratri Waist Belt Kamarbandh"
                }

                Text("Select Submission Type:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BuyWiseGold)
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val isReal = submissionType == "REAL_DRESSED"
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isReal) Color(0xFF0D3823) else Color(0xFF1E1638),
                        border = BorderStroke(1.5.dp, if (isReal) BuyWiseEmerald else Color.DarkGray),
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                submissionType = "REAL_DRESSED"
                                val realUrl = "https://www.amazon.in/s?k=${Uri.encode(affiliateQuery)}&tag=pajonline-21&ascsubtag=bw_vto_realdress"
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(realUrl)).apply {
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            }
                    ) {
                        Column(modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📸 Real Dressed", fontSize = 11.5.sp, fontWeight = FontWeight.Black, color = if (isReal) BuyWiseEmerald else Color.White)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text("Wear look • Amazon ↗", fontSize = 9.sp, color = if (isReal) BuyWiseEmerald.copy(alpha = 0.85f) else Color.Gray)
                        }
                    }

                    val isAi = submissionType == "AI_GENERATED"
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isAi) Color(0xFF381534) else Color(0xFF1E1638),
                        border = BorderStroke(1.5.dp, if (isAi) BuyWiseNeonPink else Color.DarkGray),
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                submissionType = "AI_GENERATED"
                                val aiUrl = "https://www.amazon.in/s?k=${Uri.encode(affiliateQuery)}&tag=pajonline-21&ascsubtag=bw_vto_ailook"
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(aiUrl)).apply {
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            }
                    ) {
                        Column(modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("✨ AI Concept Look", fontSize = 11.5.sp, fontWeight = FontWeight.Black, color = if (isAi) BuyWiseNeonPink else Color.White)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text("AI photos • Amazon ↗", fontSize = 9.sp, color = if (isAi) BuyWiseNeonPink.copy(alpha = 0.85f) else Color.Gray)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // IMAGE PREVIEW & UPLOAD BUTTONS
                Text("Your Look Photo:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BuyWiseCyan)
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(86.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF0C091A))
                            .border(1.dp, BuyWiseCyan, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        AsyncImage(
                            model = selectedImageUri ?: activeComp?.featuredProductImage,
                            contentDescription = "Selected look",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize().padding(3.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Button(
                            onClick = {
                                val photoFile = File(context.cacheDir, "challenge_camera_${System.currentTimeMillis()}.jpg")
                                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", photoFile)
                                tempCameraUri = uri
                                takePhotoLauncher.launch(uri)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF261F42)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth(),
                            contentPadding = PaddingValues(vertical = 6.dp)
                        ) {
                            Text("📸 Take Photo", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                pickPhotoLauncher.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF261F42)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth(),
                            contentPadding = PaddingValues(vertical = 6.dp)
                        ) {
                            Text("🖼️ Pick from Gallery", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Display Name / Alias", color = Color.Gray, fontSize = 11.sp) },
                    placeholder = { Text("e.g. Maya S.", color = Color.DarkGray, fontSize = 11.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseGold,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = is18Plus,
                        onCheckedChange = { is18Plus = it },
                        colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                    )
                    Text("🔞 I confirm I am 18 years of age or older", fontSize = 10.5.sp, color = Color.White, fontWeight = FontWeight.Bold)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = consentVoting,
                        onCheckedChange = { consentVoting = it },
                        colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                    )
                    Text("Consent: Allow look in competition voting", fontSize = 10.5.sp, color = Color.White)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = consentWinner,
                        onCheckedChange = { consentWinner = it },
                        colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                    )
                    Text("Consent: Feature look if declared winner", fontSize = 10.5.sp, color = Color.White)
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Checkbox(
                        checked = consentRules,
                        onCheckedChange = { consentRules = it },
                        colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { consentRules = !consentRules }
                    ) {
                        Text("I agree to the ", fontSize = 10.5.sp, color = Color.White)
                        Text(
                            text = "Rules & Regulations",
                            fontSize = 10.5.sp,
                            color = BuyWiseGold,
                            fontWeight = FontWeight.Black,
                            textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline,
                            modifier = Modifier.clickable { showRulesInDialog = true }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                val isFormValid = name.isNotBlank() && is18Plus && consentVoting && consentWinner && consentRules
                Button(
                    onClick = {
                        val finalUri = selectedImageUri ?: (activeComp?.featuredProductImage ?: "")
                        onSubmit(name.trim(), finalUri, submissionType)
                    },
                    enabled = isFormValid,
                    modifier = Modifier.fillMaxWidth().height(46.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BuyWiseGold,
                        disabledContainerColor = Color(0xFF261D33),
                        disabledContentColor = Color.Gray
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("🏆 SUBMIT TO COMPETITION", color = if (isFormValid) Color.Black else Color.Gray, fontWeight = FontWeight.Black)
                }
            }
        }
    }

    if (showRulesInDialog && activeComp != null) {
        com.pajonline.buywiseai.ui.components.ChallengeRulesDialog(
            onDismissRequest = { showRulesInDialog = false }
        )
    }
}
