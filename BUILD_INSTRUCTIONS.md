# Android APK Build Instructions

## Prerequisites

1. **Android Studio** - Latest version installed
2. **Java 17** - Required for Android development
3. **Node.js** - Version 18 or higher
4. **Gradle** - Version 8.0 or higher

## Build Process

### 1. Development Build (Debug APK)

```bash
# Install dependencies
npm install

# Build the web app and sync with Android
npm run build:android

# Open Android Studio
npm run android:open

# Or build directly from command line
npm run android:build:debug
```

### 2. Production Build (Release APK)

```bash
# Build for production
npm run android:build:release

# The APK will be located at:
# android/app/build/outputs/apk/release/app-release.apk
```

### 3. Testing on Device

```bash
# Connect your Android device via USB
# Enable USB debugging in developer options

# Run the app on connected device
npm run android:run
```

## Configuration Details

### App Information
- **Package Name**: `com.persatuanup1.app`
- **App Name**: `Persatuan UKP1`
- **Version**: `1.0.0`
- **Version Code**: `1`

### Android Requirements
- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 36 (Android 14)
- **Compile SDK**: 36 (Android 14)

### Permissions Included
- Internet access
- Camera access
- Location services
- Storage access
- Push notifications
- Vibration control

## Key Features Enabled

### Capacitor Plugins
- **Local Notifications**: In-app notifications
- **Push Notifications**: Firebase Cloud Messaging
- **Camera**: Photo and video capture
- **Geolocation**: GPS location services

### Security Features
- **ProGuard**: Code obfuscation for release builds
- **MultiDex**: Support for large applications
- **Network Security**: HTTPS enforcement

## Troubleshooting

### Common Issues

1. **Build Fails with "SDK location not found"**
   - Set `ANDROID_HOME` environment variable
   - Or configure in Android Studio: File → Settings → Appearance & Behavior → System Settings → Android SDK

2. **Gradle Sync Issues**
   - Delete `.gradle` folder in android directory
   - Invalidate caches in Android Studio: File → Invalidate Caches/Restart

3. **Permission Errors**
   - Check AndroidManifest.xml for required permissions
   - Ensure runtime permission handling in app code

4. **Build Too Large**
   - Enable ProGuard minification
   - Use app bundles instead of APK for Play Store

## Production Deployment

### Google Play Store
1. Generate signed APK or App Bundle
2. Create Google Play Console account
3. Upload app bundle
4. Complete store listing
5. Submit for review

### Direct Distribution
1. Enable "Unknown Sources" on device
2. Install APK directly
3. Consider using app signing for security

## Maintenance

### Version Updates
1. Update `versionCode` and `versionName` in app/build.gradle
2. Update package.json version
3. Rebuild APK

### Plugin Updates
```bash
# Update Capacitor plugins
npx cap sync android

# Update Android project
npx cap update android
```

## Support

For additional support:
- Check [Capacitor Documentation](https://capacitorjs.com/docs)
- Review [Android Studio Documentation](https://developer.android.com/studio)
- Consult project logs in Android Studio Logcat
