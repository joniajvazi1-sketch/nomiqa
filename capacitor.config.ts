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
      // Prevent keyboard from pushing content up too aggressively
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a0a0a',
    // Allow content to extend into safe areas
    preferredContentMode: 'mobile'
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: true,
    // Enable edge-to-edge display on Android
    windowSoftInputMode: 'adjustResize'
  }
};

export default config;
