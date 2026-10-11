# Proguard rules for BuyWise AI Android App (Google Play Store Release Compliance)

# Enable R8 optimizations & tree shaking
-repackageclasses ''
-allowaccessmodification

# Keep Retained classes for Compose & Serialization
-keepclassmembers class * {
    @androidx.annotation.Keep <fields>;
    @androidx.annotation.Keep <methods>;
}

# Keep Firebase / Google Play services classes
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep Google Play Ads / AdMob & Play Update / Billing
-keep class com.google.android.gms.ads.** { *; }
-keep class com.android.billingclient.** { *; }

# Keep ML Kit
-keep class com.google.mlkit.** { *; }

# Keep Data Models and Entities for Gson Deserialization
-keep class com.pajonline.buywiseai.domain.model.** { *; }
-keepclassmembers class com.pajonline.buywiseai.domain.model.** { *; }

# Retrofit & OkHttp
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.** <methods>;
}
-dontwarn okhttp3.**
-dontwarn okio.**

# Gson Serialization
-keepattributes Signature
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-dontwarn com.google.gson.**

# Coil Image Loader
-keep class coil.** { *; }

# AndroidX Navigation & Web
-keep class androidx.navigation.** { *; }
-keep class android.webkit.** { *; }
