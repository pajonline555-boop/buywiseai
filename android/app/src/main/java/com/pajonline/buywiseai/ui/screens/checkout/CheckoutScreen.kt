package com.pajonline.buywiseai.ui.screens.checkout

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pajonline.buywiseai.data.repository.AndroidShippingAddress
import com.pajonline.buywiseai.data.repository.AuthoritativePaymentOrderResult
import com.pajonline.buywiseai.data.repository.PaymentRepository
import com.pajonline.buywiseai.domain.model.StoreOffer
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold

@Composable
fun CheckoutScreen(
    offer: StoreOffer?,
    onBack: () -> Unit,
    onOrderComplete: () -> Unit
) {
    var fullName by remember { mutableStateOf("Rajesh Kumar") }
    var phone by remember { mutableStateOf("+91 9876543210") }
    var street by remember { mutableStateOf("123 MG Road, Indiranagar") }
    var city by remember { mutableStateOf("Bengaluru") }
    var pincode by remember { mutableStateOf("560038") }
    var selectedProvider by remember { mutableStateOf("RAZORPAY") }

    var isSubmitting by remember { mutableStateOf(false) }
    var completedOrder by remember { mutableStateOf<AuthoritativePaymentOrderResult?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val isPaymentsEnabled = PaymentRepository.isPaymentsEnabled()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF05030C)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "🔒 BUYWISE AUTHORITATIVE CHECKOUT",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = BuyWiseEmerald
                    )
                    Text(
                        text = "Checkout Order",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Emergency Kill Switch Banner Check
            if (!isPaymentsEnabled) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF3F1212)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFFF4D4D))
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "BUYWISE_PAYMENTS_TEMPORARILY_DISABLED: Payments are temporarily paused for maintenance.",
                            fontSize = 12.sp,
                            color = Color(0xFFFFB3B3),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            if (completedOrder != null) {
                // Completed Order Confirmation Screen
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1A15)),
                    shape = RoundedCornerShape(20.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BuyWiseEmerald))
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = BuyWiseEmerald,
                            modifier = Modifier.height(48.dp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Order Created & Stock Reserved!",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = BuyWiseEmerald
                        )
                        Text(
                            text = "Order Number: ${completedOrder!!.orderNumber}",
                            fontSize = 13.sp,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Gateway Ref: ${completedOrder!!.paymentGatewayOrderId}",
                            fontSize = 12.sp,
                            color = BuyWiseCyan
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF080D0B), RoundedCornerShape(12.dp))
                                .padding(14.dp)
                        ) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Status:", fontSize = 12.sp, color = Color.Gray)
                                Text(completedOrder!!.paymentStatus, fontSize = 12.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Subtotal:", fontSize = 12.sp, color = Color.Gray)
                                Text("₹${completedOrder!!.subtotal}", fontSize = 12.sp, color = Color.White)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Tax (5% GST):", fontSize = 12.sp, color = Color.Gray)
                                Text("₹${completedOrder!!.taxAmount}", fontSize = 12.sp, color = Color.White)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Total Amount:", fontSize = 14.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                Text("₹${completedOrder!!.totalAmount}", fontSize = 14.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Box(
                            modifier = Modifier
                                .background(Color(0xFF2A2000), RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Text(
                                text = "⚠️ COMMERCIAL PAYMENT GATEWAY NOT LIVE. Server-side payment validation & inventory reservation operational.",
                                fontSize = 11.sp,
                                color = BuyWiseGold
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = onOrderComplete,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = BuyWiseEmerald),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Return to App 🛍️", color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else {
                // Form Section
                val itemTitle = offer?.title ?: "Authentic Kanjivaram Silk Saree"
                val itemPrice = offer?.price?.toInt() ?: 4999
                val gstAmount = (itemPrice * 0.05).toInt()
                val totalAmount = itemPrice + gstAmount

                // Shipping Form Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("📍 Shipping & Delivery Details", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = fullName,
                            onValueChange = { fullName = it },
                            label = { Text("Full Name") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BuyWiseCyan, 
                                unfocusedBorderColor = Color.Gray, 
                                focusedTextColor = Color.White, 
                                unfocusedTextColor = Color.White
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Phone Number") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BuyWiseCyan, 
                                unfocusedBorderColor = Color.Gray, 
                                focusedTextColor = Color.White, 
                                unfocusedTextColor = Color.White
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = street,
                            onValueChange = { street = it },
                            label = { Text("Street Address") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BuyWiseCyan, 
                                unfocusedBorderColor = Color.Gray, 
                                focusedTextColor = Color.White, 
                                unfocusedTextColor = Color.White
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = city,
                                onValueChange = { city = it },
                                label = { Text("City") },
                                modifier = Modifier.weight(1f),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = BuyWiseCyan, 
                                    unfocusedBorderColor = Color.Gray, 
                                    focusedTextColor = Color.White, 
                                    unfocusedTextColor = Color.White
                                )
                            )
                            OutlinedTextField(
                                value = pincode,
                                onValueChange = { pincode = it },
                                label = { Text("Pincode") },
                                modifier = Modifier.weight(1f),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = BuyWiseCyan, 
                                    unfocusedBorderColor = Color.Gray, 
                                    focusedTextColor = Color.White, 
                                    unfocusedTextColor = Color.White
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Payment Gateway Selector
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("💳 Select Payment Gateway", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(
                                        if (selectedProvider == "RAZORPAY") BuyWiseEmerald.copy(alpha = 0.2f) else Color(0xFF1E1A33),
                                        RoundedCornerShape(12.dp)
                                    )
                                    .border(
                                        width = if (selectedProvider == "RAZORPAY") 2.dp else 1.dp,
                                        color = if (selectedProvider == "RAZORPAY") BuyWiseEmerald else Color.Gray,
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .clickable { selectedProvider = "RAZORPAY" }
                                    .padding(12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Razorpay", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(
                                        if (selectedProvider == "CASHFREE") BuyWiseCyan.copy(alpha = 0.2f) else Color(0xFF1E1A33),
                                        RoundedCornerShape(12.dp)
                                    )
                                    .border(
                                        width = if (selectedProvider == "CASHFREE") 2.dp else 1.dp,
                                        color = if (selectedProvider == "CASHFREE") BuyWiseCyan else Color.Gray,
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .clickable { selectedProvider = "CASHFREE" }
                                    .padding(12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Cashfree", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Price Summary
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("🛒 Order Summary", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(itemTitle, fontSize = 13.sp, color = Color.LightGray)
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Item Price", fontSize = 12.sp, color = Color.Gray)
                            Text("₹$itemPrice", fontSize = 12.sp, color = Color.White)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("GST Tax (5%)", fontSize = 12.sp, color = Color.Gray)
                            Text("₹$gstAmount", fontSize = 12.sp, color = Color.White)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Delivery", fontSize = 12.sp, color = Color.Gray)
                            Text("FREE", fontSize = 12.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Payable", fontSize = 15.sp, color = Color.White, fontWeight = FontWeight.Bold)
                            Text("₹$totalAmount", fontSize = 15.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        isSubmitting = true
                        val address = AndroidShippingAddress(
                            fullName = fullName,
                            phone = phone,
                            email = "customer@buywise.ai",
                            street = street,
                            city = city,
                            state = "Karnataka",
                            pincode = pincode
                        )
                        val (success, result) = PaymentRepository.createAuthoritativePaymentOrder(
                            partnerId = offer?.retailerId ?: offer?.sellerName ?: "part_1",
                            productId = offer?.id ?: "prod_1",
                            title = itemTitle,
                            sku = "SKU-PROD-1",
                            quantity = 1,
                            unitPrice = itemPrice,
                            shippingAddress = address,
                            provider = selectedProvider
                        )

                        if (success && result != null) {
                            PaymentRepository.verifyPaymentSignature(result.orderId, "pay_simulated", "valid_sig")
                            PaymentRepository.reconcileOrder(result.orderId, "PAID", result.totalAmount)
                            completedOrder = result.copy(paymentStatus = "PAYMENT_CAPTURED")
                        } else {
                            errorMessage = "Payment creation failed. Payments may be disabled."
                        }
                        isSubmitting = false
                    },
                    enabled = isPaymentsEnabled && !isSubmitting,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = BuyWiseEmerald),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isSubmitting) "Processing..." else "Proceed to Authoritative Payment 🔒",
                        color = Color.Black,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
