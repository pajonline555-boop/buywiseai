# Proguard rules for BuyWise AI Android App (Google Play Store Release Compliance)

# Keep Retained classes for Compose & Serialization
-keepclassmembers class * {
    @androidx.annotation.Keep <fields>;
    @androidx.annotation.Keep <methods>;
}

# Keep Firebase / Google Play services classes
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep Data Models and Entities
-keep class com.pajonline.buywiseai.data.model.** { *; }

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
-dontwarn com.google.gson.**

# Coil Image Loader
-keep class coil.** { *; }

# AndroidX Navigation & Web
-keep class androidx.navigation.** { *; }
-keep class android.webkit.** { *; }
