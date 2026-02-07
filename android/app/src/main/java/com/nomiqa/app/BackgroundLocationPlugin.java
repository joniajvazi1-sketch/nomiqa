package com.nomiqa.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Capacitor plugin for Android background location with foreground service.
 * Provides:
 * - Detailed permission status checking
 * - Two-step permission flow (foreground → background)
 * - Foreground service management with location tracking
 * - Location update broadcasting to JS
 * - Open app settings
 * - Native device info
 */
@CapacitorPlugin(
    name = "BackgroundLocation",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        ),
        @Permission(
            alias = "backgroundLocation",
            strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION }
        ),
        @Permission(
            alias = "notification",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class BackgroundLocationPlugin extends Plugin implements LocationForegroundService.LocationUpdateListener {
    private static final String TAG = "BackgroundLocationPlugin";

    @Override
    public void load() {
        super.load();
        // Register this plugin as the location update listener
        LocationForegroundService.setLocationUpdateListener(this);
        Log.d(TAG, "BackgroundLocationPlugin loaded and registered as location listener");
    }

    @Override
    public void onLocationUpdate(Location location) {
        // Forward location updates to the webview
        JSObject data = new JSObject();
        data.put("latitude", location.getLatitude());
        data.put("longitude", location.getLongitude());
        data.put("accuracy", location.getAccuracy());
        data.put("altitude", location.getAltitude());
        data.put("speed", location.getSpeed());
        data.put("timestamp", location.getTime());
        
        notifyListeners("locationUpdate", data);
        Log.d(TAG, String.format("Location update sent to JS: %.6f, %.6f", 
                location.getLatitude(), location.getLongitude()));
    }

    /**
     * Get detailed permission status for debugging
     */
    @PluginMethod
    public void getPermissionStatus(PluginCall call) {
        Context context = getContext();
        JSObject result = new JSObject();

        // Fine location
        boolean hasFineLocation = ContextCompat.checkSelfPermission(context, 
            Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        // Coarse location  
        boolean hasCoarseLocation = ContextCompat.checkSelfPermission(context,
            Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;

        // Background location (Android 10+)
        boolean hasBackgroundLocation = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            hasBackgroundLocation = ContextCompat.checkSelfPermission(context,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
        } else {
            // Pre-Android 10: background is granted with foreground
            hasBackgroundLocation = hasFineLocation || hasCoarseLocation;
        }

        // Notification permission (Android 13+)
        boolean hasNotificationPermission = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotificationPermission = ContextCompat.checkSelfPermission(context,
                Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }

        // Check if should show rationale (means user denied once but didn't check "Don't ask again")
        boolean shouldShowForegroundRationale = ActivityCompat.shouldShowRequestPermissionRationale(
            getActivity(), Manifest.permission.ACCESS_FINE_LOCATION);
        boolean shouldShowBackgroundRationale = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            shouldShowBackgroundRationale = ActivityCompat.shouldShowRequestPermissionRationale(
                getActivity(), Manifest.permission.ACCESS_BACKGROUND_LOCATION);
        }

        result.put("fineLocation", hasFineLocation);
        result.put("coarseLocation", hasCoarseLocation);
        result.put("backgroundLocation", hasBackgroundLocation);
        result.put("notification", hasNotificationPermission);
        result.put("shouldShowForegroundRationale", shouldShowForegroundRationale);
        result.put("shouldShowBackgroundRationale", shouldShowBackgroundRationale);
        result.put("androidVersion", Build.VERSION.SDK_INT);
        result.put("requiresBackgroundPermission", Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q);

        // Determine overall status
        String foregroundStatus = hasFineLocation || hasCoarseLocation ? "granted" : 
            (shouldShowForegroundRationale ? "denied" : "prompt");
        String backgroundStatus = hasBackgroundLocation ? "granted" :
            (shouldShowBackgroundRationale ? "denied" : "prompt");

        result.put("foregroundStatus", foregroundStatus);
        result.put("backgroundStatus", backgroundStatus);

        Log.d(TAG, "Permission status: " + result.toString());
        call.resolve(result);
    }

    /**
     * Request foreground location permission (Step 1)
     */
    @PluginMethod
    public void requestForegroundPermission(PluginCall call) {
        Log.d(TAG, "Requesting foreground location permission");
        requestPermissionForAlias("location", call, "foregroundPermissionCallback");
    }

    @PermissionCallback
    private void foregroundPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = ContextCompat.checkSelfPermission(getContext(),
            Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        result.put("granted", granted);
        result.put("status", granted ? "granted" : "denied");
        Log.d(TAG, "Foreground permission result: " + granted);
        call.resolve(result);
    }

    /**
     * Request background location permission (Step 2)
     * Must be called AFTER foreground permission is granted
     */
    @PluginMethod
    public void requestBackgroundPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            // Pre-Android 10: background comes with foreground
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("status", "granted");
            result.put("note", "Background permission not needed on Android < 10");
            call.resolve(result);
            return;
        }

        // Check if foreground is granted first
        boolean hasForeground = ContextCompat.checkSelfPermission(getContext(),
            Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        if (!hasForeground) {
            call.reject("Must grant foreground location permission first");
            return;
        }

        Log.d(TAG, "Requesting background location permission");
        requestPermissionForAlias("backgroundLocation", call, "backgroundPermissionCallback");
    }

    @PermissionCallback
    private void backgroundPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            granted = ContextCompat.checkSelfPermission(getContext(),
                Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
        result.put("granted", granted);
        result.put("status", granted ? "granted" : "denied");
        Log.d(TAG, "Background permission result: " + granted);
        call.resolve(result);
    }

    /**
     * Request notification permission (Android 13+)
     */
    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("note", "Notification permission not needed on Android < 13");
            call.resolve(result);
            return;
        }

        Log.d(TAG, "Requesting notification permission");
        requestPermissionForAlias("notification", call, "notificationPermissionCallback");
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            granted = ContextCompat.checkSelfPermission(getContext(),
                Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }
        result.put("granted", granted);
        call.resolve(result);
    }

    /**
     * Start foreground service for background location
     */
    @PluginMethod
    public void startForegroundService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, LocationForegroundService.class);
            serviceIntent.setAction(LocationForegroundService.ACTION_START);

            Boolean resetStats = call.getBoolean("resetStats");
            if (resetStats != null) {
                serviceIntent.putExtra(LocationForegroundService.EXTRA_RESET_STATS, resetStats);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            Log.d(TAG, "Foreground service started with location tracking");
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("note", "Background location tracking started");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground service", e);
            call.reject("Failed to start foreground service: " + e.getMessage());
        }
    }

    /**
     * Stop foreground service
     */
    @PluginMethod
    public void stopForegroundService(PluginCall call) {
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, LocationForegroundService.class);
            serviceIntent.setAction(LocationForegroundService.ACTION_STOP);
            context.startService(serviceIntent);

            Log.d(TAG, "Foreground service stopped");
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop foreground service", e);
            call.reject("Failed to stop foreground service: " + e.getMessage());
        }
    }

    /**
     * Open app settings (for when permissions are permanently denied)
     */
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open app settings", e);
            call.reject("Failed to open settings: " + e.getMessage());
        }
    }

    /**
     * Get accurate device info from native Android APIs
     */
    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        JSObject result = new JSObject();
        
        result.put("manufacturer", Build.MANUFACTURER);
        result.put("model", Build.MODEL);
        result.put("brand", Build.BRAND);
        result.put("device", Build.DEVICE);
        result.put("product", Build.PRODUCT);
        result.put("osVersion", Build.VERSION.RELEASE);
        result.put("sdkInt", Build.VERSION.SDK_INT);
        result.put("platform", "android");
        result.put("buildId", Build.ID);
        result.put("fingerprint", Build.FINGERPRINT);
        
        Log.d(TAG, "Device info: " + result.toString());
        call.resolve(result);
    }
}
