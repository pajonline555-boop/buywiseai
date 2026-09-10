# BUYWISE AI — NATIVE MOBILE APP INSTALLATION & RUN GUIDE

**APPLICATION NAME**: BuyWise AI  
**PACKAGE ID**: `com.pajonline.buywiseai`  
**APK FILE PATH**: `C:\APPS\BUYWISE AI\android\app\build\outputs\apk\debug\app-debug.apk`  
**APK SIZE**: ~19.05 MB  
**DATE**: September 10, 2026  

---

## 📱 HOW TO RUN & INSTALL BUYWISE AI ON YOUR PHYSICAL ANDROID PHONE

You can install and run BuyWise AI directly on any physical Android smartphone (Android 7.0 / API 24 or newer) using either of the following two quick methods:

---

### METHOD A: USB ADB INSTANT INSTALL (RECOMMENDED)

If your Android phone is connected to your PC via USB cable:

1. **Enable Developer Options & USB Debugging on your phone**:
   - Go to **Settings > About Phone** -> Tap **Build Number** 7 times until Developer Mode is unlocked.
   - Go to **Settings > System / Developer Options** -> Enable **USB Debugging**.
2. **Connect phone via USB cable** and allow USB debugging prompt on your phone screen.
3. **Run this single command in Antigravity or PowerShell**:

```powershell
adb install -r "C:\APPS\BUYWISE AI\android\app\build\outputs\apk\debug\app-debug.apk"
```

The BuyWise AI native app will immediately install and launch on your phone!

---

### METHOD B: DIRECT APK FILE TRANSFER (NO ADB NEEDED)

If you prefer installing without a USB cable:

1. **Locate the APK file on your PC**:
   `C:\APPS\BUYWISE AI\android\app\build\outputs\apk\debug\app-debug.apk`
2. **Transfer `app-debug.apk` to your phone**:
   - Send via WhatsApp / Telegram / Google Drive / Email to yourself, OR
   - Copy to your phone via USB file transfer / SD card.
3. **Tap `app-debug.apk` on your phone screen**:
   - If prompted: Allow **"Install from unknown sources"** or **"Allow from this source"**.
   - Tap **Install** -> Tap **Open**.

---

## 🚀 VERIFIED NATIVE FEATURES ON MOBILE

When you open BuyWise AI on your phone, you get:

1. **Live Web & Backend Connection**: Connected to `https://buywiseai.pajonline.co.in` with automatic local server fallback.
2. **Native Bottom Sheet Navigation**: Home, Price Comparison, Virtual Try-On Studio, Smart Search, Prime Membership, and Shopping Profile.
3. **In-App WebView Studio**: Seamless embedded browser with custom user-agent header.
4. **Android Share Sheet Integration**: Share any product link from Amazon / Flipkart / Myntra to BuyWise AI to instantly compare deals.
5. **Firebase Cloud Messaging Push Notifications**: Receive real-time price drop notifications directly on your Android status bar.
