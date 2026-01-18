import { registerPlugin } from '@capacitor/core';

export interface PermissionStatus {
  fineLocation: boolean;
  coarseLocation: boolean;
  backgroundLocation: boolean;
  notification: boolean;
  shouldShowForegroundRationale: boolean;
  shouldShowBackgroundRationale: boolean;
  androidVersion: number;
  iosVersion?: number;
  requiresBackgroundPermission: boolean;
  foregroundStatus: 'granted' | 'denied' | 'prompt';
  backgroundStatus: 'granted' | 'denied' | 'prompt';
  // iOS-specific
  accuracyAuthorization?: 'full' | 'reduced' | 'unknown';
  isBackgroundActive?: boolean;
}

export interface PermissionResult {
  granted: boolean;
  status: 'granted' | 'denied';
  note?: string;
}

export interface ServiceResult {
  success: boolean;
  note?: string;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  speed: number;
  timestamp: number;
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

export interface BackgroundLocationPlugin {
  /**
   * Get detailed permission status for all location-related permissions
   */
  getPermissionStatus(): Promise<PermissionStatus>;

  /**
   * Request foreground location permission (Step 1)
   * - Android: Triggers the system permission dialog
   * - iOS: Requests "When In Use" authorization
   */
  requestForegroundPermission(): Promise<PermissionResult>;

  /**
   * Request background location permission (Step 2)
   * Must be called AFTER foreground permission is granted
   * - Android 10+: Shows a separate dialog for "Allow all the time"
   * - iOS: Requests upgrade from "When In Use" to "Always" authorization
   * 
   * IMPORTANT for iOS: Apple requires showing a rationale screen before
   * calling this to explain why background location is needed.
   */
  requestBackgroundPermission(): Promise<PermissionResult>;

  /**
   * Request notification permission (Android 13+)
   * Required to show the foreground service notification
   * On iOS, this is a no-op as notifications aren't required for location
   */
  requestNotificationPermission(): Promise<PermissionResult>;

  /**
   * Start the foreground service for background location tracking
   * - Android: Shows a persistent notification while tracking
   * - iOS: Starts location updates with allowsBackgroundLocationUpdates
   */
  startForegroundService(): Promise<ServiceResult>;

  /**
   * Stop the foreground service
   */
  stopForegroundService(): Promise<ServiceResult>;

  /**
   * Open the app settings page
   * Use when permissions are permanently denied
   */
  openAppSettings(): Promise<ServiceResult>;

  /**
   * Get accurate device info from native APIs
   * Android: Uses Build.MANUFACTURER, Build.MODEL
   * iOS: Uses raw model identifier (e.g., "iPhone17,2")
   */
  getDeviceInfo(): Promise<NativeDeviceInfo>;

  /**
   * Add a listener for location updates (iOS only currently)
   */
  addListener(
    eventName: 'locationUpdate',
    listenerFunc: (location: LocationUpdate) => void
  ): Promise<{ remove: () => void }>;
}

const BackgroundLocation = registerPlugin<BackgroundLocationPlugin>('BackgroundLocation');

export default BackgroundLocation;
