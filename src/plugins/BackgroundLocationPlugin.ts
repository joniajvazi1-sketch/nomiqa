import { registerPlugin } from '@capacitor/core';

export interface PermissionStatus {
  fineLocation: boolean;
  coarseLocation: boolean;
  backgroundLocation: boolean;
  notification: boolean;
  shouldShowForegroundRationale: boolean;
  shouldShowBackgroundRationale: boolean;
  androidVersion: number;
  requiresBackgroundPermission: boolean;
  foregroundStatus: 'granted' | 'denied' | 'prompt';
  backgroundStatus: 'granted' | 'denied' | 'prompt';
}

export interface PermissionResult {
  granted: boolean;
  status: 'granted' | 'denied';
  note?: string;
}

export interface ServiceResult {
  success: boolean;
}

export interface BackgroundLocationPlugin {
  /**
   * Get detailed permission status for all location-related permissions
   */
  getPermissionStatus(): Promise<PermissionStatus>;

  /**
   * Request foreground location permission (Step 1)
   * This triggers the Android system permission dialog
   */
  requestForegroundPermission(): Promise<PermissionResult>;

  /**
   * Request background location permission (Step 2)
   * Must be called AFTER foreground permission is granted
   * On Android 10+, this shows a separate dialog
   */
  requestBackgroundPermission(): Promise<PermissionResult>;

  /**
   * Request notification permission (Android 13+)
   * Required to show the foreground service notification
   */
  requestNotificationPermission(): Promise<PermissionResult>;

  /**
   * Start the foreground service for background location tracking
   * Shows a persistent notification while tracking
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
}

const BackgroundLocation = registerPlugin<BackgroundLocationPlugin>('BackgroundLocation');

export default BackgroundLocation;
