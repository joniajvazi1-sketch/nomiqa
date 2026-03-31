# Capacitor core — keep all plugin classes
-keep class com.getcapacitor.** { *; }
-keep class com.nomiqa.app.** { *; }

# Keep WebView JS interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# AndroidX Biometric
-keep class androidx.biometric.** { *; }

# Sentry
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**
