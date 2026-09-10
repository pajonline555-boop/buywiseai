package com.pajonline.buywiseai.data.api

import com.pajonline.buywiseai.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    // Production Canonical Web Endpoint with BuildConfig fallback
    val BASE_URL: String = if (BuildConfig.BASE_URL.isNotBlank()) BuildConfig.BASE_URL else "https://buywiseai.pajonline.co.in"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.HEADERS
        // Redact Authorization headers to comply with zero-leak privacy policies
        redactHeader("Authorization")
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(loggingInterceptor)
        .build()

    val apiService: BuyWiseApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(BuyWiseApiService::class.java)
    }
}
