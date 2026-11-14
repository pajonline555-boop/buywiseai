package com.pajonline.buywiseai.core.coil

import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.net.Uri
import android.util.Base64
import coil.ImageLoader
import coil.decode.DataSource
import coil.fetch.DrawableResult
import coil.fetch.FetchResult
import coil.fetch.Fetcher
import coil.request.Options

class DataUriFetcher(
    private val dataUriString: String,
    private val options: Options
) : Fetcher {

    override suspend fun fetch(): FetchResult? {
        return try {
            val commaIdx = dataUriString.indexOf(',')
            val base64Data = if (commaIdx != -1) dataUriString.substring(commaIdx + 1) else dataUriString
            val cleanBase64 = base64Data.replace("\n", "").replace("\r", "").trim()
            val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size) ?: return null
            val drawable = BitmapDrawable(options.context.resources, bitmap)
            DrawableResult(
                drawable = drawable,
                isSampled = false,
                dataSource = DataSource.MEMORY
            )
        } catch (_: Throwable) {
            null
        }
    }

    class Factory : Fetcher.Factory<Uri> {
        override fun create(data: Uri, options: Options, imageLoader: ImageLoader): Fetcher? {
            val scheme = data.scheme
            if (scheme != null && scheme.equals("data", ignoreCase = true)) {
                return DataUriFetcher(data.toString(), options)
            }
            return null
        }
    }

    class StringFactory : Fetcher.Factory<String> {
        override fun create(data: String, options: Options, imageLoader: ImageLoader): Fetcher? {
            if (data.startsWith("data:", ignoreCase = true)) {
                return DataUriFetcher(data, options)
            }
            return null
        }
    }
}

