# Proguard rules for BuyWise AI Android App (Google Play Store Release Compliance)

# Preserve standard class structures and Kotlin Metadata for Jetpack Compose & Play Core
-keepattributes *Annotation*,RuntimeVisible*Annotations,Signature,Metadata,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable
-keep class kotlin.Metadata { *; }

# Coroutines Main Dispatcher
-keep class kotlinx.coroutines.internal.MainDispatcherFactory { *; }
-keep class kotlinx.coroutines.CoroutineExceptionHandler { *; }
-dontwarn kotlinx.coroutines.**

# Keep Retained classes for Compose & Serialization
-keepclassmembers class * {
    @androidx.annotation.Keep <fields>;
    @androidx.annotation.Keep <methods>;
}

# Keep Android Components declared in AndroidManifest
-keep class com.pajonline.buywiseai.MainActivity { *; }
-keep class com.pajonline.buywiseai.BuyWiseApplication { *; }
-keep class com.pajonline.buywiseai.core.notifications.BuyWiseFirebaseMessagingService { *; }

# Keep ALL BuyWise AI Core, Domain, Data, ViewModels, Repositories, and Utilities from stripping
-keep class com.pajonline.buywiseai.** { *; }
-keepclassmembers class com.pajonline.buywiseai.** { *; }
-keep class com.pajonline.buywiseai.BuildConfig { *; }
-keepclassmembers class com.pajonline.buywiseai.BuildConfig { *; }

# Keep ViewModel constructors for reflection & lifecycle
-keepclassmembers class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}

# Keep Firebase / Google Play services classes
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Keep Google Play In-App Updates & Billing
-keep class com.google.android.play.core.** { *; }
-keep interface com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**
-keep class com.android.billingclient.** { *; }

# Keep Credential Manager & Google ID Auth
-keep class androidx.credentials.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }

# Keep Jetpack Compose & Lifecycle & Navigation & Web
-keep class androidx.compose.** { *; }
-keep class androidx.lifecycle.** { *; }
-keep class androidx.navigation.** { *; }
-keep class android.webkit.** { *; }

# Keep ML Kit
-keep class com.google.mlkit.** { *; }

# Retrofit & OkHttp
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.** <methods>;
}
-dontwarn okhttp3.**
-dontwarn okio.**

# Gson Serialization & TypeToken Reflection Protection
-keep class com.google.gson.** { *; }
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken
-keepclassmembers class * extends com.google.gson.reflect.TypeToken { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-dontwarn com.google.gson.**

# Coil Image Loader
-keep class coil.** { *; }
