// IOSBackgroundLocationPlugin.m
// Objective-C bridge for the Swift Capacitor plugin

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the Capacitor plugin for Objective-C bridging
CAP_PLUGIN(IOSBackgroundLocationPlugin, "BackgroundLocation",
    CAP_PLUGIN_METHOD(getPermissionStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestForegroundPermission, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestBackgroundPermission, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestNotificationPermission, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startForegroundService, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopForegroundService, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(openAppSettings, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getDeviceInfo, CAPPluginReturnPromise);
)
