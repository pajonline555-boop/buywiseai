package com.pajonline.buywiseai.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import kotlin.math.roundToInt

object ImagePreProcessor {

    /**
     * Resizes user photo to maxHeight = 1024px and compresses to WebP (80% quality).
     * Cuts payload size by ~65-75% before hitting Next.js / Modal backend.
     */
    suspend fun uriToCompressedWebPBase64(
        context: Context,
        imageUri: Uri,
        maxHeight: Int = 1024,
        quality: Int = 80
    ): String = withContext(Dispatchers.IO) {
        val inputStream = context.contentResolver.openInputStream(imageUri)
            ?: throw IllegalArgumentException("Cannot open URI: $imageUri")

        val originalBitmap = BitmapFactory.decodeStream(inputStream)
        inputStream.close()

        val scaledBitmap = if (originalBitmap.height > maxHeight) {
            val aspectRatio = originalBitmap.width.toFloat() / originalBitmap.height.toFloat()
            val targetWidth = (maxHeight * aspectRatio).roundToInt()
            Bitmap.createScaledBitmap(originalBitmap, targetWidth, maxHeight, true)
        } else {
            originalBitmap
        }

        val outputStream = ByteArrayOutputStream()
        val compressFormat = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Bitmap.CompressFormat.WEBP_LOSSY
        } else {
            @Suppress("DEPRECATION")
            Bitmap.CompressFormat.WEBP
        }

        scaledBitmap.compress(compressFormat, quality, outputStream)
        val webpBytes = outputStream.toByteArray()

        val base64String = Base64.encodeToString(webpBytes, Base64.NO_WRAP)
        "data:image/webp;base64,$base64String"
    }
}
