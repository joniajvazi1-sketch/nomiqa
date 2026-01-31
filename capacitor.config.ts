import type { CapacitorConfig } from '@capacitor/cli';

// -------------------------------------------------------------------------------------
// Debug toggles (NO behavior change unless env vars are set when running `npx cap sync`)
//
// Usage examples:
//   CAPACITOR_DEBUG=true npx cap sync ios
//   CAPACITOR_SERVER_URL="https://your-site.com" npx cap sync ios
// -------------------------------------------------------------------------------------
const CAP_DEBUG = String(process.env.CAPACITOR_DEBUG ?? '').toLowerCase() === 'true';
const CAP_SERVER_URL = (process.env.CAPACITOR_SERVER_URL ?? '').trim();

const config: CapacitorConfig = {
  appId: 'com.nomiqa.app',
  appName: 'Nomiqa',
  webDir: 'dist',
  // Optional: force-load from a remote URL (useful to prove whether the issue is with bundled assets)
  ...(CAP_SERVER_URL
    ? {
        server: {
          url: CAP_SERVER_URL,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      // iOS: wait for WebView content to be ready
      useDialog: false
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
    // IMPORTANT: JS console logs do NOT show in Xcode; enabling this allows Safari Web Inspector.
    // Keep off by default for security; enable only when debugging via CAPACITOR_DEBUG=true.
    webContentsDebuggingEnabled: CAP_DEBUG,
    // Allow inline media playback (required for video/animations)
    allowsLinkPreview: true,
    scrollEnabled: true
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: true,
    // Pan input into view when keyboard opens
    windowSoftInputMode: 'adjustPan'
  }
};

export default config;
