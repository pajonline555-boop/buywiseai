package com.pajonline.buywiseai.ui.screens.vto

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.URL

enum class VtoFittingMode {
    FIT_ON_USER,   // Fit dress onto user's real body/photo (default - 100% authentic)
    RUNWAY_MODEL   // High-fashion studio model with neural face/garment adaptation
}

/**
 * BuyWise AI Production Virtual Try-On Engine
 * Connects directly to Modal L4 GPU (InsightFace Neural Swapper + Diffusion Pipeline)
 * with Hugging Face ZeroGPU (IDM-VTON) fallback.
 *
 * All local 2D Canvas cutouts, color-keying stickers, and oval pasting have been COMPLETELY REMOVED.
 */
object VtoImageSynthesizer {

    private const val TAG = "BuyWiseVtoEngine"
    private const val MODAL_VTO_URL = "https://ashupajonline--buywise-vto-engine-buywisevtoengine-generate.us-east.modal.run"

    private val httpClient by lazy {
        okhttp3.OkHttpClient.Builder()
            .connectTimeout(45, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(120, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(45, java.util.concurrent.TimeUnit.SECONDS)
            .build()
    }

    suspend fun generateFittedLook(
        context: Context,
        userPhotoUriOrUrl: String,
        garment: WearableGarment,
        mode: VtoFittingMode = VtoFittingMode.FIT_ON_USER,
        outputFile: File
    ): Boolean = withContext(Dispatchers.IO) {
        Log.d(TAG, "Starting Real AI VTO generation for garment: ${garment.title}")

        // 1. Prepare User Image Bytes (Compressed max 1024px WebP/JPEG)
        val userBytes = loadCompressedImageBytes(context, userPhotoUriOrUrl, 1024)
        if (userBytes == null) {
            Log.e(TAG, "Failed to load/compress user photo from: $userPhotoUriOrUrl")
            return@withContext false
        }
        val userBase64 = "data:image/webp;base64," + Base64.encodeToString(userBytes, Base64.NO_WRAP)

        // 2. Primary Engine: Modal L4 GPU (InsightFace Inswapper + Leffa Diffusion)
        try {
            Log.d(TAG, "Calling Modal L4 GPU Endpoint: $MODAL_VTO_URL")
            val payload = JSONObject().apply {
                put("userImageBase64", userBase64)
                put("garmentImageUrl", garment.imageUrl)
                put("category", garment.category)
                put("title", garment.title)
                put("mode", mode.name)
            }

            val mediaTypeJson = "application/json".toMediaTypeOrNull()
            val request = okhttp3.Request.Builder()
                .url(MODAL_VTO_URL)
                .post(payload.toString().toRequestBody(mediaTypeJson))
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val jsonStr = response.body?.string() ?: ""
                val respJson = JSONObject(jsonStr)
                if (respJson.optBoolean("success", false)) {
                    val rawB64 = respJson.optString("imageBase64", "")
                    val cleanB64 = if (rawB64.contains(",")) rawB64.substringAfter(",") else rawB64
                    if (cleanB64.isNotEmpty()) {
                        val decodedBytes = Base64.decode(cleanB64, Base64.DEFAULT)
                        FileOutputStream(outputFile).use { fos ->
                            fos.write(decodedBytes)
                        }
                        Log.d(TAG, "🎉 Success via Modal GPU (${respJson.optString("modeUsed")}): ${outputFile.length()} bytes")
                        return@withContext true
                    }
                }
            } else {
                Log.w(TAG, "Modal GPU returned HTTP ${response.code}, trying fallback engine...")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Modal GPU call failed: ${e.message}, trying fallback engine...", e)
        }

        // 3. Fallback Engine: Canonical BuyWise Server (/api/vto/generate with Quality Gate)
        try {
            val serverUrl = "${com.pajonline.buywiseai.data.api.ApiClient.BASE_URL}/api/vto/generate"
            Log.d(TAG, "Executing BuyWise Server VTO Fallback via $serverUrl...")
            val payload = JSONObject().apply {
                put("userImageBase64", userBase64)
                put("garmentImageUrl", garment.imageUrl)
                put("category", garment.category)
                put("title", garment.title)
                put("mode", mode.name)
            }
            val request = okhttp3.Request.Builder()
                .url(serverUrl)
                .post(payload.toString().toRequestBody("application/json".toMediaTypeOrNull()))
                .build()

            val response = httpClient.newCall(request).execute()
            val contentType = response.header("Content-Type", "") ?: ""
            if (response.isSuccessful) {
                val bodyStr = response.body?.string() ?: ""
                if (!contentType.contains("application/json") || bodyStr.trim().startsWith("<")) {
                    Log.w(TAG, "Server endpoint returned non-JSON response ($contentType). Host may be serving static HTML fallback.")
                } else {
                    val respJson = JSONObject(bodyStr)
                    if (respJson.optBoolean("success", false)) {
                        val rawB64 = respJson.optString("imageBase64", "")
                        val cleanB64 = if (rawB64.contains(",")) rawB64.substringAfter(",") else rawB64
                        if (cleanB64.isNotEmpty()) {
                            val decodedBytes = Base64.decode(cleanB64, Base64.DEFAULT)
                            FileOutputStream(outputFile).use { fos ->
                                fos.write(decodedBytes)
                            }
                            Log.d(TAG, "🎉 Success via BuyWise Server Engine (${respJson.optString("modeUsed")}): ${outputFile.length()} bytes")
                            return@withContext true
                        }
                    } else {
                        Log.w(TAG, "Server VTO rejected result: ${respJson.optString("message")}")
                    }
                }
            } else {
                Log.w(TAG, "Server VTO returned HTTP ${response.code}: ${response.message}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Server VTO fallback failed: ${e.message}", e)
        }

        // Under NO circumstances do we fall back to 2D cutout pasting!
        Log.e(TAG, "All Real AI VTO backends unavailable or rejected by Quality Gate. Aborting cleanly.")
        false
    }

    private fun loadCompressedImageBytes(context: Context, uriOrUrl: String, maxDim: Int): ByteArray? {
        return try {
            val stream: InputStream? = when {
                uriOrUrl.startsWith("content://") -> {
                    context.contentResolver.openInputStream(Uri.parse(uriOrUrl))
                }
                uriOrUrl.startsWith("file://") -> {
                    val path = Uri.parse(uriOrUrl).path
                    if (path != null && File(path).exists()) java.io.FileInputStream(File(path))
                    else context.contentResolver.openInputStream(Uri.parse(uriOrUrl))
                }
                uriOrUrl.startsWith("http://") || uriOrUrl.startsWith("https://") -> {
                    val req = okhttp3.Request.Builder().url(uriOrUrl).build()
                    val resp = httpClient.newCall(req).execute()
                    if (resp.isSuccessful) resp.body?.byteStream() else null
                }
                else -> {
                    val f = File(uriOrUrl)
                    if (f.exists()) java.io.FileInputStream(f) else null
                }
            }
            stream?.use { s ->
                val bmp = BitmapFactory.decodeStream(s) ?: return null
                val scale = minOf(1.0f, maxDim.toFloat() / maxOf(bmp.width, bmp.height))
                val scaled = if (scale < 1.0f) {
                    Bitmap.createScaledBitmap(bmp, (bmp.width * scale).toInt(), (bmp.height * scale).toInt(), true)
                } else bmp

                val out = ByteArrayOutputStream()
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                    scaled.compress(Bitmap.CompressFormat.WEBP_LOSSY, 85, out)
                } else {
                    @Suppress("DEPRECATION")
                    scaled.compress(Bitmap.CompressFormat.WEBP, 85, out)
                }
                out.toByteArray()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error compressing image: ${e.message}", e)
            null
        }
    }
}

object IdmVtoCloudEngine {
    // Deprecated: All VTO calls route securely through Next.js /api/vto/generate or Modal GPU
    // Zero client-side tokens or direct Gradio calls in APK.
    suspend fun generateRealAiTryOn(
        context: Context,
        userPhotoUriOrUrl: String,
        garmentImageUrl: String,
        garmentTitle: String,
        outputFile: File
    ): Boolean {
        // Obsoleted: All VTO requests execute securely through server-side quality-gated endpoints
        return false
    }
}
