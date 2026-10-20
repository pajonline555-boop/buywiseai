package com.pajonline.buywiseai.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink

@Composable
fun ChallengeRulesDialog(
    onDismissRequest: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismissRequest,
        containerColor = Color(0xFF141026),
        shape = RoundedCornerShape(22.dp),
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("📜", fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Official Rules & Regulations",
                            color = BuyWiseGold,
                            fontWeight = FontWeight.Black,
                            fontSize = 17.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Challenge Rules & Participation Guidelines",
                        color = Color.Gray,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Normal
                    )
                }
                IconButton(onClick = onDismissRequest) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 480.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // SECTION 1: ELIGIBILITY & PARTICIPATION RULES
                RuleSectionCard(
                    badge = "SECTION 1",
                    badgeColor = BuyWiseCyan,
                    title = "⚖️ Eligibility & Participation Rules"
                ) {
                    RuleBullet(label = "Age Requirement", description = "Open to all registered users aged 18 years and older.")
                    RuleBullet(label = "Account Requirement", description = "Both challenge participation and voting require a logged-in account on the BuyWise AI app.")
                    RuleBullet(label = "Submission Guidelines", description = "Upload a selfie or product photo in the Challenge section of the app. You may also use the mobile Virtual Try-On feature to create your entry.")
                    RuleBullet(label = "Entry Limit", description = "Strictly one (1) image submission is allowed per user.")
                    RuleBullet(label = "Voting Limit", description = "Voting is restricted to one (1) vote per mobile device/account.")
                    RuleBullet(label = "Promotion", description = "Participants are encouraged to share their entry links across social media platforms to appeal for votes.")
                    RuleBullet(label = "Selection & Announcement of Winners", description = "Winners are determined based on the highest combined engagement—including in-app votes, BuyWise AI social media interactions, and verified purchases. Winners will be announced on the BuyWise AI app, website, YouTube channel, and official social media pages.")
                    RuleBullet(label = "Management Discretion", description = "Prizes, challenge tiers, and structure may be increased, decreased, or modified at the sole discretion of BuyWise AI management.")
                }

                // SECTION 2: SAFETY, CONDUCT & ANTI-FRAUD
                RuleSectionCard(
                    badge = "SECTION 2",
                    badgeColor = BuyWiseNeonPink,
                    title = "🛡️ Safety, Conduct & Anti-Fraud Guidelines"
                ) {
                    RuleBullet(label = "Code of Conduct", description = "Uploading nude, offensive, or unethical content is strictly prohibited and will result in immediate disqualification and legal action.")
                    RuleBullet(label = "Privacy Protection", description = "Never share your mobile number, home address, or sensitive personal information publicly on our app, website, or social media comments.")
                    RuleBullet(label = "Zero Fee Policy", description = "Claiming a prize is 100% free. Never pay money to anyone claiming to represent BuyWise AI to release or deliver your prize.")
                }

                // SECTION 3: HOW TO CLAIM YOUR PRIZE
                RuleSectionCard(
                    badge = "SECTION 3",
                    badgeColor = BuyWiseEmerald,
                    title = "🎁 How to Claim Your Prize"
                ) {
                    Text(
                        text = "Winners can claim their reward through either of the following methods:",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                    RuleBullet(
                        label = "Option 1 (Cashback Reimbursement)",
                        description = "Purchase the featured product from our app or website and submit a 10 to 60-second try-on video. Once verified, the full product amount will be refunded directly to your bank account."
                    )
                    RuleBullet(
                        label = "Option 2 (Direct Delivery)",
                        description = "Provide your shipping address privately through our official verification channel, and we will ship the prize directly to your doorstep at no cost."
                    )
                }

                // SECTION 4: CONTENT USAGE DISCLAIMER
                RuleSectionCard(
                    badge = "SECTION 4",
                    badgeColor = BuyWiseGold,
                    title = "📢 Content Usage Disclaimer"
                ) {
                    RuleBullet(
                        label = "Authorization & Media Rights",
                        description = "By submitting images or videos to the BuyWise AI Challenge, you grant BuyWise AI a non-exclusive, royalty-free license to use, display, and promote your content across our official app, website, and social media platforms for legitimate marketing and promotional purposes."
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismissRequest,
                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Understood & Agreed", color = Color.Black, fontWeight = FontWeight.Black)
            }
        }
    )
}

@Composable
private fun RuleSectionCard(
    badge: String,
    badgeColor: Color,
    title: String,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1B1533)),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, badgeColor.copy(alpha = 0.4f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = badgeColor.copy(alpha = 0.2f),
                    border = BorderStroke(1.dp, badgeColor)
                ) {
                    Text(
                        text = badge,
                        color = badgeColor,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                    fontSize = 13.5.sp
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            content()
        }
    }
}

@Composable
private fun RuleBullet(
    label: String,
    description: String
) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Row(verticalAlignment = Alignment.Top) {
            Text("•", color = BuyWiseGold, fontSize = 14.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "$label: ",
                color = BuyWiseGold,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
        Text(
            text = description,
            color = Color.LightGray,
            fontSize = 11.5.sp,
            lineHeight = 16.sp,
            modifier = Modifier.padding(start = 14.dp, top = 2.dp)
        )
    }
}
