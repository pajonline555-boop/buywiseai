package com.pajonline.buywiseai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple

private data class JourneyStep(
    val id: String,
    val label: String,
    val icon: String,
    val color: Color,
    val isGradient: Boolean = false
)

@Composable
fun ShoppingJourneyBar(
    onStepClick: (String) -> Unit = {}
) {
    val steps = listOf(
        JourneyStep("see", "1. See", "🔎", BuyWiseCyan),
        JourneyStep("compare", "2. Compare", "🆚", BuyWisePurple),
        JourneyStep("tryon", "3. Try On", "👗", BuyWiseNeonPink),
        JourneyStep("save", "4. Save", "🎟️", BuyWiseEmerald),
        JourneyStep("buy", "5. Buy Wisely", "🛒", BuyWiseEmerald, isGradient = true)
    )

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "SEE ➔ COMPARE ➔ TRY ON ➔ SAVE ➔ BUY",
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
            color = Color.LightGray,
            letterSpacing = 1.sp,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
        )

        Spacer(modifier = Modifier.height(6.dp))

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(steps) { step ->
                if (step.isGradient) {
                    Box(
                        modifier = Modifier
                            .background(
                                brush = Brush.horizontalGradient(
                                    colors = listOf(BuyWiseEmerald, BuyWiseCyan)
                                ),
                                shape = RoundedCornerShape(14.dp)
                            )
                            .clickable { onStepClick(step.id) }
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = step.icon, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = step.label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF070510)
                            )
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .background(
                                color = step.color.copy(alpha = 0.12f),
                                shape = RoundedCornerShape(14.dp)
                            )
                            .border(
                                width = 1.dp,
                                color = step.color.copy(alpha = 0.35f),
                                shape = RoundedCornerShape(14.dp)
                            )
                            .clickable { onStepClick(step.id) }
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = step.icon, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = step.label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = step.color
                            )
                        }
                    }
                }
            }
        }
    }
}
