package com.nomiqa.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

/**
 * Foreground Service for continuous location tracking on Android.
 * Required for background location on Android 10+ (API 29+).
 * 
 * This service keeps the app alive and actively tracks location
 * while the user is contributing network coverage data in the background.
 * 
 * Uses FusedLocationProvider for battery-efficient location updates.
 */
public class LocationForegroundService extends Service {
    private static final String TAG = "LocationForegroundSvc";
    private static final String CHANNEL_ID = "nomiqa_location_channel";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_START = "com.nomiqa.app.ACTION_START_LOCATION_SERVICE";
    public static final String ACTION_STOP = "com.nomiqa.app.ACTION_STOP_LOCATION_SERVICE";

    // Location update interval (5 minutes for battery efficiency)
    private static final long LOCATION_INTERVAL_MS = 5 * 60 * 1000;
    private static final long LOCATION_FASTEST_INTERVAL_MS = 2 * 60 * 1000;
    private static final float LOCATION_MIN_DISPLACEMENT_M = 100f; // Only update if moved 100m

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private Handler mainHandler;
    private boolean isTracking = false;

    // Static listener for broadcasting location updates to the plugin
    private static LocationUpdateListener locationListener;

    public interface LocationUpdateListener {
        void onLocationUpdate(Location location);
    }

    public static void setLocationUpdateListener(LocationUpdateListener listener) {
        locationListener = listener;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "LocationForegroundService created");
        createNotificationChannel();
        
        mainHandler = new Handler(Looper.getMainLooper());
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        
        // Create location callback
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(@NonNull LocationResult locationResult) {
                Location location = locationResult.getLastLocation();
                if (location != null) {
                    Log.d(TAG, String.format("Background location: %.6f, %.6f (accuracy: %.1fm)",
                            location.getLatitude(), location.getLongitude(), location.getAccuracy()));
                    
                    // Broadcast to plugin
                    if (locationListener != null) {
                        locationListener.onLocationUpdate(location);
                    }
                    
                    // Update notification with location info
                    updateNotification(location);
                }
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            Log.d(TAG, "onStartCommand action: " + action);

            if (ACTION_START.equals(action)) {
                startForegroundTracking();
            } else if (ACTION_STOP.equals(action)) {
                stopForegroundTracking();
            }
        }
        return START_STICKY;
    }

    private void startForegroundTracking() {
        Log.d(TAG, "Starting foreground tracking");

        // Create notification
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Nomiqa Active")
            .setContentText("Contributing network coverage data")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();

        // Start as foreground service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        // Start location tracking
        startLocationUpdates();
        
        Log.d(TAG, "Foreground service started with notification and location tracking");
    }

    private void startLocationUpdates() {
        if (isTracking) {
            Log.d(TAG, "Already tracking, skipping");
            return;
        }

        // Check permission
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "Location permission not granted, cannot start tracking");
            return;
        }

        // Build location request for battery-efficient background tracking
        LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, LOCATION_INTERVAL_MS)
            .setMinUpdateIntervalMillis(LOCATION_FASTEST_INTERVAL_MS)
            .setMinUpdateDistanceMeters(LOCATION_MIN_DISPLACEMENT_M)
            .setWaitForAccurateLocation(false)
            .build();

        try {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, mainHandler.getLooper());
            isTracking = true;
            Log.d(TAG, "Location updates started (interval: " + LOCATION_INTERVAL_MS/1000 + "s, displacement: " + LOCATION_MIN_DISPLACEMENT_M + "m)");
        } catch (SecurityException e) {
            Log.e(TAG, "SecurityException starting location updates", e);
        }
    }

    private void stopLocationUpdates() {
        if (!isTracking) return;
        
        fusedLocationClient.removeLocationUpdates(locationCallback);
        isTracking = false;
        Log.d(TAG, "Location updates stopped");
    }

    private void stopForegroundTracking() {
        Log.d(TAG, "Stopping foreground tracking");
        stopLocationUpdates();
        stopForeground(true);
        stopSelf();
    }

    private void updateNotification(Location location) {
        try {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager == null) return;

            Intent notificationIntent = new Intent(this, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );

            String contentText = String.format("Mapping coverage (accuracy: %.0fm)", location.getAccuracy());

            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Nomiqa Active")
                .setContentText(contentText)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();

            notificationManager.notify(NOTIFICATION_ID, notification);
        } catch (Exception e) {
            Log.e(TAG, "Failed to update notification", e);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows when Nomiqa is tracking your location for network mapping");
            channel.setShowBadge(false);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "Notification channel created");
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopLocationUpdates();
        Log.d(TAG, "LocationForegroundService destroyed");
    }
}
