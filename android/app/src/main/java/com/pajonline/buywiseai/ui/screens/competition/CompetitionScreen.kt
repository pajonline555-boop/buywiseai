package com.pajonline.buywiseai.ui.screens.competition

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.AlertDialog
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pajonline.buywiseai.data.i18n.tr
import com.pajonline.buywiseai.data.repository.CompetitionRepository
import com.pajonline.buywiseai.domain.model.CompetitionSubmission
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple

@Composable
fun CompetitionScreen(
    onNavigateToVto: () -> Unit = {}
) {
    val context = LocalContext.current
    val activeComp = CompetitionRepository.getActiveCompetition()
    val pastWinnerPair = CompetitionRepository.getPastWinnerCompetition()
    val submissions = remember(activeComp?.id) {
        if (activeComp != null) CompetitionRepository.getSubmissionsForCompetition(activeComp.id) else emptyList()
    }

    var showSubmitDialog by remember { mutableStateOf(false) }
    var showRulesDialog by remember { mutableStateOf(false) }
    var voterId by remember { mutableStateOf("device_user_926dbc44") }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Box(
                        modifier = Modifier
                            .background(
                                brush = Brush.horizontalGradient(listOf(BuyWiseGold, BuyWiseNeonPink)),
                                shape = RoundedCornerShape(12.dp)
                            )
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text("🏆 BUYWISE CHALLENGE", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color.Black)
                    }
                    Text(
                        text = "Weekly Try-On Competition",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }

                Button(
                    onClick = { showSubmitDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("➕ Submit Entry", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // ACTIVE COMPETITION CARD
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
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                            shape = RoundedCornerShape(22.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.45f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("STATUS: ${activeComp.status}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BuyWiseEmerald)
                                    Text("🆓 Free Entry • 18+ Only", fontSize = 11.sp, color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // PRODUCT IMAGE + SHORT TITLE (Features description hidden as requested)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(80.dp)
                                            .clip(RoundedCornerShape(14.dp))
                                            .background(Color(0xFF261D3D))
                                            .border(1.dp, BuyWiseGold.copy(alpha = 0.6f), RoundedCornerShape(14.dp))
                                    ) {
                                        AsyncImage(
                                            model = productImg,
                                            contentDescription = cleanShortTitle,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = cleanShortTitle,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color.White,
                                            maxLines = 2
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "👗 Verified ${activeComp.retailer} • ₹${activeComp.featuredProductPrice}",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = BuyWiseCyan
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFF1E1B2E), RoundedCornerShape(12.dp))
                                        .padding(10.dp)
                                ) {
                                    Text("🎁 Prize: ${activeComp.prizeDescription}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BuyWiseGold)
                                }

                                Spacer(modifier = Modifier.height(14.dp))

                                // BUTTON LINE: TRY PRODUCT NOW, ENTER NOW, RULE TO PARTICIPATE
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Button(
                                        onClick = {
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
                                        },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                                    ) {
                                        Text("👗 Try Product Now", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 10.sp)
                                    }

                                    Button(
                                        onClick = { showSubmitDialog = true },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                                    ) {
                                        Text("🏆 Enter Now", color = Color.White, fontWeight = FontWeight.Black, fontSize = 10.sp)
                                    }

                                    Button(
                                        onClick = { showRulesDialog = true },
                                        modifier = Modifier.weight(1.1f),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B2E)),
                                        shape = RoundedCornerShape(10.dp),
                                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                                    ) {
                                        Text("📜 Rule to Participate", color = Color(0xFFFFD700), fontWeight = FontWeight.Bold, fontSize = 10.sp)
                                    }
                                }
                            }
                        }
                    }
                }

                // SUNDAY WINNER SPOTLIGHT
                if (pastWinnerPair != null) {
                    item {
                        val (pastComp, winner) = pastWinnerPair
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                            shape = RoundedCornerShape(22.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseEmerald.copy(alpha = 0.45f))
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text("👑 SUNDAY WINNER SPOTLIGHT", fontSize = 11.sp, fontWeight = FontWeight.Black, color = BuyWiseEmerald)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Congratulations, ${winner.userName}! 🎉", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White)
                                Text("Winner of ${pastComp.title} with ${winner.voteCount} votes!", fontSize = 12.sp, color = Color.LightGray)
                            }
                        }
                    }
                }

                // VOTING GALLERY HEADER
                item {
                    Text("🗳️ Approved Entries Voting Gallery (${submissions.size})", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
                }

                // SUBMISSIONS VOTING GRID ITEMS
                items(submissions) { sub ->
                    SubmissionVotingCard(
                        submission = sub,
                        onVote = {
                            val (success, msg) = CompetitionRepository.castVote(sub.competitionId, sub.id, voterId)
                            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                        }
                    )
                }

                item { Spacer(modifier = Modifier.height(30.dp)) }
            }
        }
    }

    // VOLUNTARY ENTRY SUBMISSION DIALOG
    if (showSubmitDialog) {
        SubmitEntryDialog(
            onDismiss = { showSubmitDialog = false },
            onSubmit = { name ->
                if (activeComp != null) {
                    val submissionLook = com.pajonline.buywiseai.ui.screens.vto.VtoSessionState.lastGeneratedLookUri
                        ?: activeComp.featuredProductImage
                    val (success, msg) = CompetitionRepository.submitEntry(
                        activeComp.id,
                        voterId,
                        name,
                        null,
                        submissionLook
                    )
                    Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                }
                showSubmitDialog = false
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
private fun SubmissionVotingCard(
    submission: CompetitionSubmission,
    onVote: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
        shape = RoundedCornerShape(18.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(submission.userName, fontSize = 15.sp, fontWeight = FontWeight.Black, color = Color.White)
                Spacer(modifier = Modifier.height(2.dp))
                Text("Status: ${submission.status} • ❤️ ${submission.voteCount} Votes", fontSize = 12.sp, color = BuyWiseGold, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = onVote,
                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink.copy(alpha = 0.2f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseNeonPink),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Favorite, contentDescription = "Vote", tint = BuyWiseNeonPink, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Vote", color = BuyWiseNeonPink, fontWeight = FontWeight.Black, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun SubmitEntryDialog(
    onDismiss: () -> Unit,
    onSubmit: (String) -> Unit
) {
    var name by remember { mutableStateOf("Priya S.") }
    var is18Plus by remember { mutableStateOf(false) }
    var consentVoting by remember { mutableStateOf(false) }
    var consentWinner by remember { mutableStateOf(false) }

    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xFF120E24),
            border = androidx.compose.foundation.BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.4f)),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🏆 Submit Challenge Entry", fontSize = 18.sp, fontWeight = FontWeight.Black, color = BuyWiseGold)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                Text("Private photos remain private by default. Only this submitted look will enter the voting gallery.", fontSize = 12.sp, color = Color.Gray)

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Display Name", color = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BuyWiseGold,
                        unfocusedBorderColor = Color.DarkGray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = is18Plus,
                        onCheckedChange = { is18Plus = it },
                        colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                    )
                    Text("🔞 I confirm I am 18 years of age or older", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = consentVoting,
                        onCheckedChange = { consentVoting = it },
                        colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                    )
                    Text("Consent: Allow look in competition voting", fontSize = 11.sp, color = Color.White)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = consentWinner,
                        onCheckedChange = { consentWinner = it },
                        colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                    )
                    Text("Consent: Feature look if declared winner", fontSize = 11.sp, color = Color.White)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = { onSubmit(name) },
                    enabled = is18Plus && consentVoting && consentWinner,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("🏆 SUBMIT TO COMPETITION", color = Color.Black, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}
