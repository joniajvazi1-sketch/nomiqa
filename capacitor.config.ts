import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nomiqa.app',
  appName: 'Nomiqa',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      // Use overlay style for edge-to-edge display
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000' // Transparent
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    BackgroundGeolocation: {
      // iOS background modes will be configured in Xcode
    },
    Keyboard: {
      // Use 'native' for proper input scrolling on both platforms
      resize: 'native',
      resizeOnFullScreen: true
    },
  },
  ios: {
    // CRITICAL: 'never' prevents iOS from adding its own scroll view insets
    // Combined with viewport-fit=cover, this enables true edge-to-edge fullscreen
    contentInset: 'never',
    backgroundColor: '#0a0a0a',
    // Allow content to extend into safe areas
    preferredContentMode: 'mobile',
    // Ensure webview extends behind status bar
    webContentsDebuggingEnabled: false
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: true,
    // Pan input into view when keyboard opens
    windowSoftInputMode: 'adjustPan'
  }
};

export default config;
