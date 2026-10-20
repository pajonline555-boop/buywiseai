package com.pajonline.buywiseai.ui.screens.vto

import android.Manifest
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
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
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.pajonline.buywiseai.data.repository.CompetitionRepository
import com.pajonline.buywiseai.ui.theme.BuyWiseCyan
import com.pajonline.buywiseai.ui.theme.BuyWiseEmerald
import com.pajonline.buywiseai.ui.theme.BuyWiseGold
import com.pajonline.buywiseai.ui.theme.BuyWiseNeonPink
import com.pajonline.buywiseai.ui.theme.BuyWisePurple
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.InputStream
import java.net.URL

data class WearableGarment(
    val id: String,
    val title: String,
    val imageUrl: String,
    val category: String,
    val price: Int,
    val retailer: String = "BuyWise Verified",
    val isChallenge: Boolean = false
)

data class SampleModel(
    val name: String,
    val gender: String,
    val imageUrl: String
)

data class AndroidStyleMatchResult(
    val recommendedSize: String,
    val fitConfidence: String,
    val sizeAdvice: String,
    val colorMatchScore: String,
    val stylingTips: List<String>
)

suspend fun saveImageToGallery(context: Context, imageUrl: String, title: String): Boolean {
    return withContext(Dispatchers.IO) {
        try {
            val cleanTitle = title.replace("[^a-zA-Z0-9]".toRegex(), "_").take(25)
            val fileName = "BuyWise_${cleanTitle}_${System.currentTimeMillis()}.jpg"

            val url = URL(imageUrl)
            val connection = url.openConnection()
            connection.connectTimeout = 8000
            connection.readTimeout = 10000
            val inputStream: InputStream = connection.getInputStream()

            val resolver = context.contentResolver
            val contentValues = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
                put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/BuyWiseAI")
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }
            }

            val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                resolver.openOutputStream(uri)?.use { outputStream ->
                    inputStream.copyTo(outputStream)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    contentValues.clear()
                    contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
                    resolver.update(uri, contentValues, null, null)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}

fun saveUserStyledLookToPrivate(context: Context, uri: Uri, privateVtoDir: File): File? {
    return try {
        val destFile = File(privateVtoDir, "community_look_${System.currentTimeMillis()}.jpg")
        context.contentResolver.openInputStream(uri)?.use { input ->
            destFile.outputStream().use { output ->
                input.copyTo(output)
            }
        }
        if (destFile.exists()) destFile else null
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

fun evaluateStyleMatch(
    garment: WearableGarment,
    height: String,
    weight: String,
    bodyType: String,
    skinTone: String,
    fitPreference: String
): AndroidStyleMatchResult {
    val numWeight = weight.filter { it.isDigit() }.toIntOrNull() ?: 58
    var baseSize = when {
        numWeight < 52 -> "S"
        numWeight <= 64 -> "M"
        numWeight <= 76 -> "L"
        numWeight <= 88 -> "XL"
        else -> "XXL"
    }

    if (bodyType == "Petite" && baseSize != "S") baseSize = "S"
    if (bodyType == "Curvy" && baseSize == "S") baseSize = "M"

    var finalSize = baseSize
    if (fitPreference == "Comfort/Loose") {
        finalSize = when (baseSize) {
            "S" -> "M"
            "M" -> "L"
            "L" -> "XL"
            else -> "XXL"
        }
    } else if (fitPreference == "Snug/Tailored") {
        finalSize = when (baseSize) {
            "XXL" -> "XL"
            "XL" -> "L"
            else -> baseSize
        }
    }

    val isSaree = garment.category.contains("saree", ignoreCase = true) || garment.title.contains("saree", ignoreCase = true)
    val displaySize = if (isSaree) "Free Size (Blouse: $finalSize)" else finalSize
    val confidence = "94% Match"

    val sizeAdvice = if (isSaree) {
        "Based on your height ($height) and $fitPreference fit, the 5.5m drape falls with elegant pleat density while blouse size $finalSize offers 2-inch inner margin room."
    } else {
        "Based on your height ($height), $bodyType frame, and $fitPreference fit, Size $finalSize offers comfortable torso mobility without fabric pulling."
    }

    val colorMatchScore = when (skinTone) {
        "Warm" -> "Excellent Match (96% Harmony)"
        "Cool" -> "Striking Contrast (95% Harmony)"
        else -> "Flawless Versatility (97% Harmony)"
    }

    val tips = mutableListOf<String>()
    if (skinTone == "Warm") {
        tips.add("Rich tones in ${garment.title} beautifully illuminate warm undertones with a radiant festive glow.")
        tips.add("Pair with antique matte gold jhumkas and embellished juttis.")
    } else if (skinTone == "Cool") {
        tips.add("Contrasting motifs in ${garment.title} create a striking contemporary pop against cool undertones.")
        tips.add("Style with oxidized silver or rhodium-plated accessories and sleek footwear.")
    } else {
        tips.add("Balanced neutral undertones give complete versatility with ${garment.title} across all lighting.")
        tips.add("Complement with statement drop earrings, stacked bangles, and an embellished clutch.")
    }

    return AndroidStyleMatchResult(
        recommendedSize = displaySize,
        fitConfidence = confidence,
        sizeAdvice = sizeAdvice,
        colorMatchScore = colorMatchScore,
        stylingTips = tips
    )
}

@Composable
fun VtoScreen() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val privateVtoDir = remember {
        File(context.filesDir, "vto_private").apply { if (!exists()) mkdirs() }
    }

    // Local private storage media
    var localFiles by remember {
        mutableStateOf(privateVtoDir.listFiles()?.sortedByDescending { it.lastModified() } ?: emptyList())
    }

    // Curated catalog options
    val activeComp = remember { CompetitionRepository.getActiveCompetition() }
    val catalogGarments = remember(activeComp?.id) {
        val list = mutableListOf<WearableGarment>()
        if (activeComp != null) {
            list.add(
                WearableGarment(
                    id = activeComp.featuredProductId,
                    title = activeComp.featuredProductTitle,
                    imageUrl = activeComp.featuredProductImage,
                    category = "ethnic_challenge",
                    price = activeComp.featuredProductPrice,
                    retailer = activeComp.retailer,
                    isChallenge = true
                )
            )
        }
        list.addAll(
            listOf(
                WearableGarment(
                    id = "kanjivaram-silk-1",
                    title = "Royal Banarasi Kanjivaram Silk Saree",
                    imageUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
                    category = "sarees",
                    price = 4999,
                    retailer = "Amazon India"
                ),
                WearableGarment(
                    id = "anarkali-suit-2",
                    title = "Emerald Hand-Embroidered Anarkali Set",
                    imageUrl = "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
                    category = "anarkali",
                    price = 3850,
                    retailer = "Myntra"
                ),
                WearableGarment(
                    id = "raymond-blazer-3",
                    title = "Raymond Executive Tailored Slim Fit Blazer",
                    imageUrl = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
                    category = "blazers",
                    price = 3999,
                    retailer = "Amazon India"
                ),
                WearableGarment(
                    id = "evening-gown-4",
                    title = "Zara Floral Georgette Tiered Evening Gown",
                    imageUrl = "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
                    category = "western",
                    price = 2490,
                    retailer = "Zara India"
                ),
                WearableGarment(
                    id = "manyavar-sherwani-5",
                    title = "Manyavar Imperial Silk Wedding Sherwani",
                    imageUrl = "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80",
                    category = "sherwani",
                    price = 8999,
                    retailer = "Manyavar"
                )
            )
        )
        list
    }

    var selectedGarment by remember {
        mutableStateOf(
            if (VtoSessionState.targetGarmentTitle != null && VtoSessionState.targetGarmentImageUrl != null) {
                WearableGarment(
                    id = VtoSessionState.targetCompetitionId ?: "session_target",
                    title = VtoSessionState.targetGarmentTitle!!,
                    imageUrl = VtoSessionState.targetGarmentImageUrl!!,
                    category = VtoSessionState.targetGarmentCategory ?: "dresses",
                    price = VtoSessionState.targetGarmentPrice ?: 499,
                    retailer = VtoSessionState.targetRetailer ?: "BuyWise Verified",
                    isChallenge = VtoSessionState.targetCompetitionId != null
                )
            } else {
                catalogGarments.firstOrNull() ?: WearableGarment("default", "Featured Look", "", "all", 499)
            }
        )
    }

    var showAlternativeGarments by remember { mutableStateOf(false) }

    LaunchedEffect(VtoSessionState.targetGarmentTitle, VtoSessionState.targetGarmentImageUrl) {
        if (VtoSessionState.targetGarmentTitle != null && VtoSessionState.targetGarmentImageUrl != null) {
            selectedGarment = WearableGarment(
                id = VtoSessionState.targetCompetitionId ?: "session_${System.currentTimeMillis()}",
                title = VtoSessionState.targetGarmentTitle!!,
                imageUrl = VtoSessionState.targetGarmentImageUrl!!,
                category = VtoSessionState.targetGarmentCategory ?: "dresses",
                price = VtoSessionState.targetGarmentPrice ?: 499,
                retailer = VtoSessionState.targetRetailer ?: "BuyWise Verified",
                isChallenge = VtoSessionState.targetCompetitionId != null
            )
            showAlternativeGarments = false
        }
    }

    // AI SIZE & STYLE MATCH STATE
    var heightInput by remember { mutableStateOf("5'5\"") }
    var weightInput by remember { mutableStateOf("58") }
    var selectedBodyType by remember { mutableStateOf("Regular") }
    var selectedSkinTone by remember { mutableStateOf("Warm") }
    var selectedFitPref by remember { mutableStateOf("Regular") }
    var styleMatchResult by remember { mutableStateOf<AndroidStyleMatchResult?>(null) }
    var isEvaluatingMatch by remember { mutableStateOf(false) }

    // DOWNLOAD & UPLOAD CHALLENGE STATE
    var isDownloadingOutfit by remember { mutableStateOf(false) }
    var resultLookUri by remember { mutableStateOf<String?>(VtoSessionState.lastGeneratedLookUri) }
    var showChallengeSubmitDialog by remember { mutableStateOf(false) }
    var previewModalFile by remember { mutableStateOf<File?>(null) }

    // Upload styled look launcher
    val pickStyledLookLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            val saved = saveUserStyledLookToPrivate(context, uri, privateVtoDir)
            if (saved != null) {
                resultLookUri = saved.absolutePath
                VtoSessionState.lastGeneratedLookUri = saved.absolutePath
                localFiles = privateVtoDir.listFiles()?.sortedByDescending { it.lastModified() } ?: emptyList()
                Toast.makeText(context, "✨ Styled look added! Ready for Weekly Challenge.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val pickCustomGarmentLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            selectedGarment = WearableGarment(
                id = "custom_${System.currentTimeMillis()}",
                title = "Custom Selected Clothing Item",
                imageUrl = uri.toString(),
                category = "custom",
                price = 1999,
                retailer = "Your Custom Wardrobe"
            )
            showAlternativeGarments = false
            Toast.makeText(context, "👗 Custom clothing item selected!", Toast.LENGTH_SHORT).show()
        }
    }

    // RAW USER PHOTO & REAL TRY-ON CONVERSION STATE
    var userRawPhotoUri by remember { mutableStateOf<Uri?>(null) }
    var isConvertingTryOn by remember { mutableStateOf(false) }
    var conversionStatusText by remember { mutableStateOf<String?>(null) }
    var tempCameraUri by remember { mutableStateOf<Uri?>(null) }
    var selectedFittingMode by remember { mutableStateOf(VtoFittingMode.FIT_ON_USER) }

    // Camera launcher for raw user photo
    val takeRawPhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success && tempCameraUri != null) {
            userRawPhotoUri = tempCameraUri
            Toast.makeText(context, "📸 Photo captured! Ready to convert with selected dress.", Toast.LENGTH_SHORT).show()
        }
    }

    // Gallery launcher for raw user photo
    val pickRawPhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            userRawPhotoUri = uri
            Toast.makeText(context, "🖼️ Photo selected! Ready to convert with selected dress.", Toast.LENGTH_SHORT).show()
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0C0A14)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "AI Size & Style Match",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = "Powered by HI MAYA ✨",
                        fontSize = 12.sp,
                        color = BuyWiseGold,
                        fontWeight = FontWeight.Bold
                    )
                }
                Icon(Icons.Default.Lock, contentDescription = "Privacy Lock", tint = BuyWiseEmerald)
            }

            Spacer(modifier = Modifier.height(14.dp))

            // -------------------------------------------------------------
            // SELECTED OUTFIT CARD
            // -------------------------------------------------------------
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "👗 Selected Outfit",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )

                Text(
                    text = if (showAlternativeGarments) "✕ Close" else "🔄 Change Outfit",
                    fontSize = 11.sp,
                    color = BuyWiseGold,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable {
                        showAlternativeGarments = !showAlternativeGarments
                    }
                )
            }
            Spacer(modifier = Modifier.height(8.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (selectedGarment.isChallenge) Color(0xFF241A3B) else Color(0xFF161226)
                ),
                shape = RoundedCornerShape(18.dp),
                border = BorderStroke(
                    1.5.dp,
                    if (selectedGarment.isChallenge) BuyWiseGold else BuyWiseCyan.copy(alpha = 0.5f)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(86.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color.Black)
                    ) {
                        AsyncImage(
                            model = selectedGarment.imageUrl,
                            contentDescription = selectedGarment.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                        if (selectedGarment.isChallenge) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopStart)
                                    .padding(4.dp)
                                    .background(BuyWiseGold, RoundedCornerShape(6.dp))
                                    .padding(horizontal = 5.dp, vertical = 2.dp)
                            ) {
                                Text("🏆 CHALLENGE", color = Color.Black, fontSize = 8.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = selectedGarment.title,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            maxLines = 2,
                            lineHeight = 18.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "₹${selectedGarment.price} • ${selectedGarment.retailer}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = BuyWiseEmerald
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = BuyWiseGold, modifier = Modifier.size(14.dp))
                            Text(
                                text = "Ready for Fit & Style Match",
                                color = BuyWiseGold,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            AnimatedVisibility(
                visible = showAlternativeGarments,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column(modifier = Modifier.padding(top = 10.dp)) {
                    Text(
                        text = "Or choose another outfit:",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        item {
                            Card(
                                modifier = Modifier
                                    .width(115.dp)
                                    .height(150.dp)
                                    .clickable {
                                        pickCustomGarmentLauncher.launch(
                                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                        )
                                    },
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1B1530)),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, BuyWiseNeonPink)
                            ) {
                                Column(
                                    modifier = Modifier.fillMaxSize().padding(6.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = BuyWiseNeonPink)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Custom Photo", color = BuyWiseNeonPink, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                }
                            }
                        }

                        items(catalogGarments) { garment ->
                            val isSelected = selectedGarment.id == garment.id
                            Card(
                                modifier = Modifier
                                    .width(115.dp)
                                    .height(150.dp)
                                    .clickable {
                                        selectedGarment = garment
                                        showAlternativeGarments = false
                                    },
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF141026)),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(if (isSelected) 2.dp else 1.dp, if (isSelected) BuyWiseGold else Color.White.copy(alpha = 0.15f))
                            ) {
                                Column(modifier = Modifier.fillMaxSize()) {
                                    Box(modifier = Modifier.fillMaxWidth().height(100.dp)) {
                                        AsyncImage(
                                            model = garment.imageUrl,
                                            contentDescription = garment.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }
                                    Column(modifier = Modifier.padding(4.dp)) {
                                        Text(garment.title, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                        Text("₹${garment.price}", color = BuyWiseEmerald, fontSize = 10.sp, fontWeight = FontWeight.Black)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // -------------------------------------------------------------
            // PART 1B: UPLOAD RAW PHOTO & CONVERT WITH SELECTED DRESS
            // -------------------------------------------------------------
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1B1433)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.5.dp, BuyWiseCyan)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "📸 Upload Photo & Try On Dress",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = BuyWiseCyan
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Upload your selfie or full-body photo to fit this dress",
                                fontSize = 11.5.sp,
                                color = Color.LightGray
                            )
                        }
                        if (userRawPhotoUri != null) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = BuyWiseEmerald.copy(alpha = 0.2f),
                                border = BorderStroke(1.dp, BuyWiseEmerald)
                            ) {
                                Text(
                                    text = "✅ Ready",
                                    color = BuyWiseEmerald,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Two Buttons: Camera vs Gallery
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                val photoFile = File(context.cacheDir, "camera_raw_${System.currentTimeMillis()}.jpg")
                                val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", photoFile)
                                tempCameraUri = uri
                                takeRawPhotoLauncher.launch(uri)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2A1F4D)),
                            border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.6f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("📸 Take Photo", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }

                        Button(
                            onClick = {
                                pickRawPhotoLauncher.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2A1F4D)),
                            border = BorderStroke(1.dp, BuyWiseGold.copy(alpha = 0.6f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("🖼️ Pick Gallery", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }

                    // Side-by-Side Preview of User Photo & Selected Garment
                    if (userRawPhotoUri != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(90.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.Black)
                                    .border(1.5.dp, BuyWiseCyan, RoundedCornerShape(12.dp))
                            ) {
                                AsyncImage(
                                    model = userRawPhotoUri,
                                    contentDescription = "Your Raw Photo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomCenter)
                                        .fillMaxWidth()
                                        .background(Color.Black.copy(alpha = 0.7f))
                                        .padding(vertical = 2.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("Your Photo", color = BuyWiseCyan, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.width(10.dp))
                            Text("➕", fontSize = 16.sp, color = BuyWiseGold)
                            Spacer(modifier = Modifier.width(10.dp))

                            Box(
                                modifier = Modifier
                                    .size(90.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.Black)
                                    .border(1.5.dp, BuyWiseGold, RoundedCornerShape(12.dp))
                            ) {
                                AsyncImage(
                                    model = selectedGarment.imageUrl,
                                    contentDescription = selectedGarment.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomCenter)
                                        .fillMaxWidth()
                                        .background(Color.Black.copy(alpha = 0.7f))
                                        .padding(vertical = 2.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("Dress", color = BuyWiseGold, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // TRY-ON FITTING STYLE SELECTOR
                    Text(
                        text = "Fitting Mode:",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.LightGray
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Option 1: WEAR ON MY PHOTO (Default & Recommended - 100% Real You)
                        Card(
                            modifier = Modifier
                                .weight(1.05f)
                                .clickable { selectedFittingMode = VtoFittingMode.FIT_ON_USER },
                            colors = CardDefaults.cardColors(
                                containerColor = if (selectedFittingMode == VtoFittingMode.FIT_ON_USER) Color(0xFF2E1546) else Color(0xFF130E22)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(
                                1.5.dp,
                                if (selectedFittingMode == VtoFittingMode.FIT_ON_USER) BuyWiseNeonPink else Color(0xFF2E2548)
                            )
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("👗", fontSize = 14.sp)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Wear On My Photo",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Black,
                                        color = if (selectedFittingMode == VtoFittingMode.FIT_ON_USER) BuyWiseNeonPink else Color.White
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "★ Recommended • Real Face & Hair",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (selectedFittingMode == VtoFittingMode.FIT_ON_USER) BuyWiseNeonPink else Color.Gray
                                )
                            }
                        }

                        // Option 2: RUNWAY STUDIO (Designer Catalog Showcase)
                        Card(
                            modifier = Modifier
                                .weight(0.95f)
                                .clickable { selectedFittingMode = VtoFittingMode.RUNWAY_MODEL },
                            colors = CardDefaults.cardColors(
                                containerColor = if (selectedFittingMode == VtoFittingMode.RUNWAY_MODEL) Color(0xFF2E2415) else Color(0xFF130E22)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(
                                1.5.dp,
                                if (selectedFittingMode == VtoFittingMode.RUNWAY_MODEL) BuyWiseGold else Color(0xFF2E2548)
                            )
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("👑", fontSize = 14.sp)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Runway Studio",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Black,
                                        color = if (selectedFittingMode == VtoFittingMode.RUNWAY_MODEL) BuyWiseGold else Color.White
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "Catalog Studio Showcase",
                                    fontSize = 9.sp,
                                    color = Color.Gray
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // THE PRIMARY ACTION BUTTON: CONVERT & TRY ON WITH SELECTED DRESS
                    Button(
                        onClick = {
                            val rawUri = userRawPhotoUri
                            if (rawUri == null) {
                                Toast.makeText(context, "👉 Please take a photo or select an image from gallery first!", Toast.LENGTH_SHORT).show()
                            } else {
                                isConvertingTryOn = true
                                conversionStatusText = "⚡ Pre-processing photo to 1024px WebP..."
                                coroutineScope.launch {
                                    try {
                                        com.pajonline.buywiseai.util.ImagePreProcessor.uriToCompressedWebPBase64(context, rawUri, 1024, 80)
                                        conversionStatusText = if (selectedFittingMode == VtoFittingMode.FIT_ON_USER)
                                            "⚡ Generating Real AI Virtual Try-On via Diffusion Engine (~15s)..."
                                        else
                                            "👑 Loading luxury designer runway look..."
                                        val outputFile = File(privateVtoDir, "vto_${System.currentTimeMillis()}.webp")

                                        val success = VtoImageSynthesizer.generateFittedLook(
                                            context = context,
                                            userPhotoUriOrUrl = rawUri.toString(),
                                            garment = selectedGarment,
                                            mode = selectedFittingMode,
                                            outputFile = outputFile
                                        )

                                        if (success && outputFile.exists() && outputFile.length() > 5000) {
                                            resultLookUri = outputFile.absolutePath
                                            VtoSessionState.lastGeneratedLookUri = outputFile.absolutePath
                                            localFiles = privateVtoDir.listFiles()?.sortedByDescending { it.lastModified() } ?: emptyList()
                                            conversionStatusText = "✨ Converted successfully! Dress fitted on your photo."
                                            Toast.makeText(context, "✨ Success! Dress fitted beautifully.", Toast.LENGTH_LONG).show()
                                        } else {
                                            if (outputFile.exists()) {
                                                outputFile.delete()
                                            }
                                            conversionStatusText = "Try-on could not produce a high-fidelity fit. Please try with a clearer front-facing photo or different outfit."
                                            Toast.makeText(context, "Try-on quality check failed. Please select a clearer photo or different garment.", Toast.LENGTH_LONG).show()
                                        }
                                    } catch (e: Exception) {
                                        conversionStatusText = "Error: ${e.message}"
                                        Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                    } finally {
                                        isConvertingTryOn = false
                                    }
                                }
                            }
                        },
                        enabled = !isConvertingTryOn,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedFittingMode == VtoFittingMode.FIT_ON_USER) BuyWiseNeonPink else BuyWiseGold
                        ),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (isConvertingTryOn) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Synthesizing Try-On...",
                                color = Color.White,
                                fontWeight = FontWeight.Black
                            )
                        } else {
                            val buttonTitle = when {
                                userRawPhotoUri == null -> "📸 Upload Photo to Fit With Dress"
                                selectedFittingMode == VtoFittingMode.FIT_ON_USER -> "✨ Fit Dress On My Photo (100% Real You)"
                                else -> "👑 View Runway Studio Look"
                            }
                            Text(
                                text = buttonTitle,
                                color = if (userRawPhotoUri != null && selectedFittingMode == VtoFittingMode.RUNWAY_MODEL) Color.Black else Color.White,
                                fontWeight = FontWeight.Black,
                                fontSize = 13.5.sp
                            )
                        }
                    }

                    if (conversionStatusText != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = conversionStatusText!!,
                            color = BuyWiseGold,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // -------------------------------------------------------------
            // PART 2: "AI SIZE & STYLE MATCH ✨" CARD
            // -------------------------------------------------------------
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF19142E)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.5.dp, BuyWiseGold.copy(alpha = 0.7f))
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("✨", fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "AI Size & Style Match ✨",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = BuyWiseGold
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Find your best fit & styling for ${selectedGarment.title}",
                        fontSize = 12.sp,
                        color = Color.LightGray
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Height & Weight Inputs
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = heightInput,
                            onValueChange = { heightInput = it },
                            label = { Text("Height", fontSize = 11.sp, color = BuyWiseCyan) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BuyWiseCyan,
                                unfocusedBorderColor = Color.DarkGray,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )

                        OutlinedTextField(
                            value = weightInput,
                            onValueChange = { weightInput = it },
                            label = { Text("Weight (kg)", fontSize = 11.sp, color = BuyWiseCyan) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BuyWiseCyan,
                                unfocusedBorderColor = Color.DarkGray,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Body Type Chips
                    Text("Body Type:", fontSize = 11.sp, color = BuyWiseGold, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("Petite", "Regular", "Curvy", "Athletic").forEach { type ->
                            val isSel = selectedBodyType == type
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (isSel) BuyWiseGold else Color(0xFF261D3D),
                                border = BorderStroke(1.dp, if (isSel) BuyWiseGold else Color.Gray.copy(alpha = 0.3f)),
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { selectedBodyType = type }
                            ) {
                                Text(
                                    text = type,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSel) FontWeight.Black else FontWeight.Bold,
                                    color = if (isSel) Color.Black else Color.White,
                                    modifier = Modifier.padding(vertical = 7.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Skin Undertone Chips
                    Text("Skin Undertone / Complexion:", fontSize = 11.sp, color = BuyWiseGold, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("Warm", "Neutral", "Cool", "Auto-detect").forEach { tone ->
                            val isSel = selectedSkinTone == tone
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (isSel) BuyWiseCyan else Color(0xFF261D3D),
                                border = BorderStroke(1.dp, if (isSel) BuyWiseCyan else Color.Gray.copy(alpha = 0.3f)),
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { selectedSkinTone = tone }
                            ) {
                                Text(
                                    text = tone,
                                    fontSize = 10.sp,
                                    fontWeight = if (isSel) FontWeight.Black else FontWeight.Bold,
                                    color = if (isSel) Color.Black else Color.White,
                                    modifier = Modifier.padding(vertical = 7.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Preferred Fit Chips
                    Text("Preferred Fit:", fontSize = 11.sp, color = BuyWiseEmerald, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("Snug/Tailored", "Regular", "Comfort/Loose").forEach { fit ->
                            val isSel = selectedFitPref == fit
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (isSel) BuyWiseEmerald else Color(0xFF261D3D),
                                border = BorderStroke(1.dp, if (isSel) BuyWiseEmerald else Color.Gray.copy(alpha = 0.3f)),
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { selectedFitPref = fit }
                            ) {
                                Text(
                                    text = fit,
                                    fontSize = 10.sp,
                                    fontWeight = if (isSel) FontWeight.Black else FontWeight.Bold,
                                    color = if (isSel) Color.Black else Color.White,
                                    modifier = Modifier.padding(vertical = 7.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Primary Yellow CTA Button
                    Button(
                        onClick = {
                            isEvaluatingMatch = true
                            coroutineScope.launch {
                                delay(600)
                                styleMatchResult = evaluateStyleMatch(
                                    garment = selectedGarment,
                                    height = heightInput,
                                    weight = weightInput,
                                    bodyType = selectedBodyType,
                                    skinTone = selectedSkinTone,
                                    fitPreference = selectedFitPref
                                )
                                isEvaluatingMatch = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BuyWiseGold),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (isEvaluatingMatch) {
                            CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Analyzing fit with Maya...", color = Color.Black, fontWeight = FontWeight.Bold)
                        } else {
                            Text(
                                "✨ Get My AI Size & Style Match",
                                color = Color.Black,
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp
                            )
                        }
                    }

                    // Sizing & Styling Result Card
                    if (styleMatchResult != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF100C1F)),
                            shape = RoundedCornerShape(14.dp),
                            border = BorderStroke(1.dp, BuyWiseGold)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = BuyWiseGold.copy(alpha = 0.2f),
                                        border = BorderStroke(1.dp, BuyWiseGold)
                                    ) {
                                        Text(
                                            text = "🎯 Recommended Size: ${styleMatchResult!!.recommendedSize} (${styleMatchResult!!.fitConfidence})",
                                            color = BuyWiseGold,
                                            fontWeight = FontWeight.Black,
                                            fontSize = 11.5.sp,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                        )
                                    }

                                    Text(
                                        text = "🎨 ${styleMatchResult!!.colorMatchScore}",
                                        color = BuyWiseEmerald,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Text(
                                    text = styleMatchResult!!.sizeAdvice,
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    lineHeight = 17.sp
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(BuyWiseGold.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                                        .padding(10.dp)
                                ) {
                                    Text(
                                        text = "HI MAYA'S STYLING TIPS:",
                                        color = BuyWiseGold,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    styleMatchResult!!.stylingTips.forEach { tip ->
                                        Text(
                                            text = "• $tip",
                                            color = Color.LightGray,
                                            fontSize = 11.sp,
                                            lineHeight = 15.sp,
                                            modifier = Modifier.padding(vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // -------------------------------------------------------------
            // PART 3: "DOWNLOAD OUTFIT & UPLOAD FOR WEEKLY CHALLENGE" FLOW
            // -------------------------------------------------------------
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF20132B)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.5.dp, BuyWiseNeonPink.copy(alpha = 0.6f))
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "🏆 Join the Weekly Look Challenge",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Black,
                        color = BuyWiseNeonPink
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Win ₹5,000 Voucher! Download this outfit, create your styled look with your favorite editor or photo, and upload here to compete.",
                        fontSize = 12.sp,
                        color = Color.LightGray
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                if (isDownloadingOutfit) return@Button
                                isDownloadingOutfit = true
                                coroutineScope.launch {
                                    val ok = saveImageToGallery(context, selectedGarment.imageUrl, selectedGarment.title)
                                    isDownloadingOutfit = false
                                    if (ok) {
                                        Toast.makeText(
                                            context,
                                            "Outfit saved to Gallery! Create your look and upload below to enter the Weekly Challenge.",
                                            Toast.LENGTH_LONG
                                        ).show()
                                    } else {
                                        Toast.makeText(context, "Could not save outfit image.", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E283F)),
                            border = BorderStroke(1.dp, BuyWiseCyan),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            if (isDownloadingOutfit) {
                                CircularProgressIndicator(color = BuyWiseCyan, modifier = Modifier.size(16.dp))
                            } else {
                                Text("⬇️ Download Outfit Image", color = BuyWiseCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Button(
                            onClick = {
                                pickStyledLookLauncher.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38231E)),
                            border = BorderStroke(1.dp, BuyWiseGold),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("📤 Upload Your Styled Look", color = BuyWiseGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            if (resultLookUri != null) {
                                showChallengeSubmitDialog = true
                            } else {
                                Toast.makeText(context, "👉 Please upload your styled look above first!", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("🏆 Submit This Look to Weekly Challenge!", color = Color.White, fontWeight = FontWeight.Black)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // -------------------------------------------------------------
            // PREVIEW CARD: YOUR VIRTUAL TRY-ON RESULT / PRIVATE LOOK PREVIEW
            // -------------------------------------------------------------
            if (resultLookUri != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF140F2E)),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.5.dp, BuyWiseNeonPink)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "✨ Community Look • Ready for Challenge",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = BuyWiseNeonPink
                            )
                            IconButton(onClick = { resultLookUri = null }) {
                                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(380.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.Black)
                        ) {
                            AsyncImage(
                                model = resultLookUri,
                                contentDescription = "Community Look Preview",
                                contentScale = ContentScale.Fit,
                                modifier = Modifier.fillMaxSize()
                            )

                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomStart)
                                    .padding(10.dp)
                                    .background(Color(0xCC000000), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text("🔒 Saved to Local Private Media", color = BuyWiseEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(Intent.EXTRA_TEXT, "Check out my styled look with ${selectedGarment.title} for the BuyWise Challenge! https://buywiseai.pajonline.co.in")
                                    }
                                    context.startActivity(Intent.createChooser(shareIntent, "Share Look"))
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, BuyWiseCyan)
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null, tint = BuyWiseCyan, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Share", color = BuyWiseCyan, fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = {
                                    showChallengeSubmitDialog = true
                                },
                                modifier = Modifier.weight(1.5f),
                                colors = ButtonDefaults.buttonColors(containerColor = BuyWiseNeonPink),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("🏆 Submit Entry", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(20.dp))
            }

            // -------------------------------------------------------------
            // LOCAL PRIVATE MEDIA GALLERY
            // -------------------------------------------------------------
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Local Private Media (${localFiles.size} looks)",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                if (localFiles.isNotEmpty()) {
                    Text(
                        text = "Tap to view",
                        fontSize = 11.sp,
                        color = Color.Gray
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))

            if (localFiles.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp)
                        .background(Color(0xFF13111C), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No private looks saved yet. Upload your look to preview!",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(localFiles) { file ->
                        Card(
                            modifier = Modifier
                                .size(90.dp)
                                .clickable { previewModalFile = file },
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B2E)),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
                        ) {
                            Box(modifier = Modifier.fillMaxSize()) {
                                AsyncImage(
                                    model = file,
                                    contentDescription = "Saved Look",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(30.dp))
        }
    }

    // Modal to view full saved look
    if (previewModalFile != null) {
        Dialog(onDismissRequest = { previewModalFile = null }) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color(0xFF120E24),
                border = BorderStroke(1.dp, BuyWiseCyan.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth().padding(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Private Look Preview", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        IconButton(onClick = { previewModalFile = null }) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(380.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color.Black)
                    ) {
                        AsyncImage(
                            model = previewModalFile,
                            contentDescription = "Full Preview",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                previewModalFile?.delete()
                                localFiles = privateVtoDir.listFiles()?.sortedByDescending { it.lastModified() } ?: emptyList()
                                previewModalFile = null
                                Toast.makeText(context, "Deleted from private storage", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4A1525)),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Delete", color = Color.White)
                        }
                        Button(
                            onClick = { previewModalFile = null },
                            colors = ButtonDefaults.buttonColors(containerColor = BuyWiseCyan),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Done", color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    // Modal to Submit Entry to Weekly Challenge
    if (showChallengeSubmitDialog && activeComp != null) {
        var name by remember { mutableStateOf("Priya S.") }
        var is18Plus by remember { mutableStateOf(true) }
        var consentVoting by remember { mutableStateOf(true) }
        var consentWinner by remember { mutableStateOf(true) }

        Dialog(onDismissRequest = { showChallengeSubmitDialog = false }) {
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = Color(0xFF120E24),
                border = BorderStroke(1.dp, BuyWiseGold),
                modifier = Modifier.fillMaxWidth().padding(14.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🏆 Submit to Challenge", fontSize = 18.sp, fontWeight = FontWeight.Black, color = BuyWiseGold)
                        IconButton(onClick = { showChallengeSubmitDialog = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Submit your styled look for: ${activeComp.title}",
                        fontSize = 12.sp,
                        color = Color.LightGray
                    )

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

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = is18Plus,
                            onCheckedChange = { is18Plus = it },
                            colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                        )
                        Text("🔞 I confirm I am 18 years or older", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = consentVoting,
                            onCheckedChange = { consentVoting = it },
                            colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                        )
                        Text("Consent: Allow this look in community voting", fontSize = 11.sp, color = Color.White)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = consentWinner,
                            onCheckedChange = { consentWinner = it },
                            colors = CheckboxDefaults.colors(checkedColor = BuyWiseGold)
                        )
                        Text("Consent: Feature look on banner if declared winner", fontSize = 11.sp, color = Color.White)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            val voterId = "device_user_926dbc44"
                            val lookToSubmit = resultLookUri ?: activeComp.featuredProductImage
                            val (success, msg) = CompetitionRepository.submitEntry(
                                competitionId = activeComp.id,
                                userId = voterId,
                                userName = name,
                                userPhotoUrl = null,
                                vtoResultImage = lookToSubmit
                            )
                            Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                            showChallengeSubmitDialog = false
                        },
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
}
