package com.nomiqa.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

/**
 * Foreground Service for continuous location tracking on Android.
 * Required for background location on Android 10+ (API 29+).
 * 
 * This service keeps the app alive while the user is contributing
 * network coverage data in the background.
 */
public class LocationForegroundService extends Service {
    private static final String TAG = "LocationForegroundSvc";
    private static final String CHANNEL_ID = "nomiqa_location_channel";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_START = "com.nomiqa.app.ACTION_START_LOCATION_SERVICE";
    public static final String ACTION_STOP = "com.nomiqa.app.ACTION_STOP_LOCATION_SERVICE";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "LocationForegroundService created");
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            Log.d(TAG, "onStartCommand action: " + action);

            if (ACTION_START.equals(action)) {
                startForegroundService();
            } else if (ACTION_STOP.equals(action)) {
                stopForegroundService();
            }
        }
        return START_STICKY;
    }

    private void startForegroundService() {
        Log.d(TAG, "Starting foreground service");

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

        // Android 14+ requires specifying foreground service type
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        Log.d(TAG, "Foreground service started with notification");
    }

    private void stopForegroundService() {
        Log.d(TAG, "Stopping foreground service");
        stopForeground(true);
        stopSelf();
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
        Log.d(TAG, "LocationForegroundService destroyed");
    }
}
