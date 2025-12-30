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
      style: 'DARK',
      backgroundColor: '#0a0a0a'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    BackgroundGeolocation: {
      // iOS background modes will be configured in Xcode
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a0a0a'
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: true
  }
};

export default config;
