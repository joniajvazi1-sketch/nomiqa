import { registerPlugin } from '@capacitor/core';

/**
 * TelephonyInfoPlugin - Custom Capacitor Plugin for Android
 * 
 * Provides access to TelephonyManager APIs for telco-grade signal metrics:
 * - getAllCellInfo() for RSRP, RSRQ, SINR, Cell ID
 * - getServiceState() for roaming status  
 * - SubscriptionManager for MCC/MNC
 * 
 * NOTE: This plugin requires native Android implementation in:
 * android/app/src/main/java/com/nomiqa/app/TelephonyInfoPlugin.java
 * 
 * iOS is not supported - returns empty/null values due to Apple restrictions.
 */

export interface SignalInfo {
  // Signal strength metrics
  rsrp?: number;     // Reference Signal Received Power (dBm, e.g., -90)
  rsrq?: number;     // Reference Signal Received Quality (dB)
  rssi?: number;     // Received Signal Strength Indicator (dBm)
  sinr?: number;     // Signal-to-Interference-plus-Noise Ratio (dB)
  
  // Cell tower info
  cellId?: string;   // Cell ID
  tac?: string;      // Tracking Area Code
  pci?: number;      // Physical Cell ID
  
  // Network identity
  mcc?: string;      // Mobile Country Code (e.g., '310')
  mnc?: string;      // Mobile Network Code (e.g., '410')
  mccMnc?: string;   // Combined (e.g., '310-410')
  carrierName?: string;
  
  // Network type
  networkType?: string;  // '5G_SA', '5G_NSA', 'LTE', 'LTE_CA', '3G', '2G'
  isRoaming?: boolean;
  
  // Frequency info
  bandNumber?: number;
  frequencyMhz?: number;
  bandwidthMhz?: number;
  
  // Mock location detection (Android only)
  isMockLocation?: boolean;
}

export interface NativeDeviceInfo {
  manufacturer: string;  // "Samsung", "Apple"
  model: string;         // "SM-S918B" (Android) or "iPhone17,2" (iOS)
  brand?: string;        // "samsung", "Apple"
  device?: string;       // "b0q" (Android) or "iPhone" (iOS)
  product?: string;      // Android only
  osVersion: string;     // "14" (Android) or "17.4" (iOS)
  sdkInt?: number;       // Android SDK version (e.g., 34)
  platform: string;      // "android" or "ios"
  buildId?: string;      // Android build ID
  fingerprint?: string;  // Android build fingerprint
  modelIdentifier?: string; // iOS raw model (same as model)
  deviceName?: string;   // iOS user's device name
}

export interface TelephonyInfoPluginInterface {
  /**
   * Get current signal strength and cell info
   * Requires ACCESS_FINE_LOCATION and READ_PHONE_STATE permissions
   */
  getSignalInfo(): Promise<SignalInfo>;
  
  /**
   * Get carrier information
   */
  getCarrierInfo(): Promise<{
    carrierName?: string;
    mcc?: string;
    mnc?: string;
    isRoaming?: boolean;
  }>;
  
  /**
   * Get accurate device info from native APIs
   * Android: Uses Build.MANUFACTURER, Build.MODEL
   * iOS: Uses raw model identifier (e.g., "iPhone17,2")
   */
  getDeviceInfo(): Promise<NativeDeviceInfo>;
  
  /**
   * Check if mock location is enabled (anti-cheat)
   */
  isMockLocationEnabled(): Promise<{ isMock: boolean }>;
  
  /**
   * Check if all required permissions are granted
   */
  checkPermissions(): Promise<{ 
    location: boolean; 
    phoneState: boolean;
  }>;
  
  /**
   * Request required permissions
   */
  requestPermissions(): Promise<{
    location: boolean;
    phoneState: boolean;
  }>;
}

/**
 * Web fallback implementation
 * Returns empty/estimated values when native plugin is unavailable
 */
const TelephonyInfoPluginWeb: TelephonyInfoPluginInterface = {
  async getSignalInfo(): Promise<SignalInfo> {
    // Web: No access to native signal APIs
    return {};
  },
  
  async getCarrierInfo() {
    return {
      carrierName: undefined,
      mcc: undefined,
      mnc: undefined,
      isRoaming: undefined
    };
  },
  
  async getDeviceInfo(): Promise<NativeDeviceInfo> {
    // Web fallback - use navigator info
    return {
      manufacturer: 'Unknown',
      model: 'Web Browser',
      osVersion: 'Web',
      platform: 'web'
    };
  },
  
  async isMockLocationEnabled() {
    return { isMock: false };
  },
  
  async checkPermissions() {
    return { location: true, phoneState: true };
  },
  
  async requestPermissions() {
    return { location: true, phoneState: true };
  }
};

// Register the plugin - will use native implementation on Android
// Falls back to web implementation on iOS/Web
export const TelephonyInfoPlugin = registerPlugin<TelephonyInfoPluginInterface>(
  'TelephonyInfoPlugin',
  {
    web: () => Promise.resolve(TelephonyInfoPluginWeb),
    ios: () => Promise.resolve(TelephonyInfoPluginWeb), // iOS uses fallback
  }
);

/**
 * Check if native TelephonyInfo plugin is available
 * (Only available on Android with native implementation)
 */
export const isTelephonyPluginAvailable = (): boolean => {
  try {
    // Check if we're on Android native platform
    return typeof (window as any).Capacitor !== 'undefined' && 
           (window as any).Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
};
