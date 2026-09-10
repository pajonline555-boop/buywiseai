package com.pajonline.buywiseai.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.R
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple

@Composable
fun BuyWiseLogo(
    modifier: Modifier = Modifier,
    logoHeight: Dp = 38.dp,
    showAiBadge: Boolean = true,
    fontSize: Int = 24
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Official BuyWise 3D Shopping Bag Icon
        Image(
            painter = painterResource(id = R.drawable.buywise_logo),
            contentDescription = "BuyWise AI Official Logo",
            modifier = Modifier.size(logoHeight)
        )

        Spacer(modifier = Modifier.width(10.dp))

        // "BuyWise" Brand Text
        Text(
            text = "BuyWise",
            fontSize = fontSize.sp,
            fontWeight = FontWeight.Black,
            color = Color.White,
            letterSpacing = (-0.5).sp
        )

        if (showAiBadge) {
            Spacer(modifier = Modifier.width(6.dp))

            // Pink / Purple Gradient "AI" Badge
            Box(
                modifier = Modifier
                    .background(
                        brush = Brush.horizontalGradient(
                            colors = listOf(BuyWisePurple, BuyWiseNeonPink)
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "AI",
                    fontSize = (fontSize * 0.5).sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    letterSpacing = 0.5.sp
                )
            }
        }
    }
}
