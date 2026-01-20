import Foundation
import Capacitor
import CoreLocation

/**
 * IOSBackgroundLocationPlugin - iOS Native Background Location Permission Handler
 * 
 * This plugin implements Apple's required 2-step location permission flow:
 * 1. Request "When In Use" permission first
 * 2. Request "Always" permission after user starts using location features
 * 
 * Without this, iOS only shows "Allow Once" and "While Using" options.
 * The "Always Allow" option only appears when:
 * - App has "Background Modes > Location updates" capability enabled
 * - Info.plist has NSLocationAlwaysAndWhenInUseUsageDescription
 * - App requests upgrade from "When In Use" to "Always"
 */
@objc(IOSBackgroundLocationPlugin)
public class IOSBackgroundLocationPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    
    public let identifier = "IOSBackgroundLocationPlugin"
    public let jsName = "BackgroundLocation"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getPermissionStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestForegroundPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestBackgroundPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestNotificationPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startForegroundService", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopForegroundService", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDeviceInfo", returnType: CAPPluginReturnPromise)
    ]
    
    private var locationManager: CLLocationManager!
    private var pendingCall: CAPPluginCall?
    private var isRequestingAlways = false
    private var isBackgroundUpdatesActive = false
    private var hasReceivedInitialCallback = false // Ignore iOS 14+ initial callback
    
    override public func load() {
        // Create location manager on main thread
        DispatchQueue.main.async {
            self.locationManager = CLLocationManager()
            self.locationManager.delegate = self
            self.locationManager.desiredAccuracy = kCLLocationAccuracyBest
            // IMPORTANT: Do NOT set allowsBackgroundLocationUpdates until we have permission
            // Setting it before permission causes issues
            self.locationManager.pausesLocationUpdatesAutomatically = false
        }
        
        print("[IOSBackgroundLocation] Plugin loaded successfully")
    }
    
    // MARK: - Get Permission Status
    
    @objc func getPermissionStatus(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let status: CLAuthorizationStatus
            if #available(iOS 14.0, *) {
                status = self.locationManager.authorizationStatus
            } else {
                status = CLLocationManager.authorizationStatus()
            }
            
            print("[IOSBackgroundLocation] getPermissionStatus called, status: \(self.statusString(status))")
            
            let foregroundStatus: String
            let backgroundStatus: String
            let fineLocation: Bool
            let coarseLocation: Bool
            let backgroundLocation: Bool
            
            switch status {
            case .notDetermined:
                // CRITICAL: Return "not_determined" so JS can detect first-time state
                foregroundStatus = "not_determined"
                backgroundStatus = "not_determined"
                fineLocation = false
                coarseLocation = false
                backgroundLocation = false
                
            case .restricted, .denied:
                foregroundStatus = "denied"
                backgroundStatus = "denied"
                fineLocation = false
                coarseLocation = false
                backgroundLocation = false
                
            case .authorizedWhenInUse:
                foregroundStatus = "granted"
                backgroundStatus = "prompt" // Can still request Always
                fineLocation = true
                coarseLocation = true
                backgroundLocation = false
                
            case .authorizedAlways:
                foregroundStatus = "granted"
                backgroundStatus = "granted"
                fineLocation = true
                coarseLocation = true
                backgroundLocation = true
                
            @unknown default:
                foregroundStatus = "not_determined"
                backgroundStatus = "not_determined"
                fineLocation = false
                coarseLocation = false
                backgroundLocation = false
            }
            
            // iOS accuracy authorization (iOS 14+)
            var accuracyAuthorization = "full"
            if #available(iOS 14.0, *) {
                switch self.locationManager.accuracyAuthorization {
                case .reducedAccuracy:
                    accuracyAuthorization = "reduced"
                case .fullAccuracy:
                    accuracyAuthorization = "full"
                @unknown default:
                    accuracyAuthorization = "unknown"
                }
            }
            
            call.resolve([
                "fineLocation": fineLocation,
                "coarseLocation": coarseLocation,
                "backgroundLocation": backgroundLocation,
                "notification": true, // iOS doesn't require separate notification permission for location
                "shouldShowForegroundRationale": false, // iOS doesn't have this concept
                "shouldShowBackgroundRationale": status == .authorizedWhenInUse, // Show rationale before Always request
                "androidVersion": 0, // Not Android
                "iosVersion": ProcessInfo.processInfo.operatingSystemVersion.majorVersion,
                "requiresBackgroundPermission": true,
                "foregroundStatus": foregroundStatus,
                "backgroundStatus": backgroundStatus,
                "accuracyAuthorization": accuracyAuthorization,
                "isBackgroundActive": self.isBackgroundUpdatesActive
            ])
        }
    }
    
    // Timeout work item for permission requests
    private var permissionTimeoutWork: DispatchWorkItem?
    
    // MARK: - Request Foreground (When In Use) Permission
    
    @objc func requestForegroundPermission(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Cancel any existing timeout
            self.permissionTimeoutWork?.cancel()
            
            let status: CLAuthorizationStatus
            if #available(iOS 14.0, *) {
                status = self.locationManager.authorizationStatus
            } else {
                status = CLLocationManager.authorizationStatus()
            }
            
            print("[IOSBackgroundLocation] requestForegroundPermission called, current status: \(self.statusString(status))")
            
            // Already have permission
            if status == .authorizedWhenInUse || status == .authorizedAlways {
                print("[IOSBackgroundLocation] Already have permission, returning granted")
                call.resolve([
                    "granted": true,
                    "status": "granted",
                    "note": status == .authorizedAlways ? "Already have Always permission" : "Already have When In Use permission"
                ])
                return
            }
            
            // Permanently denied
            if status == .denied || status == .restricted {
                print("[IOSBackgroundLocation] Permission denied/restricted, user must enable in Settings")
                call.resolve([
                    "granted": false,
                    "status": "denied",
                    "note": "Permission denied. User must enable in Settings > Privacy > Location Services"
                ])
                return
            }
            
            // Status is .notDetermined - Request When In Use permission
            print("[IOSBackgroundLocation] Status is notDetermined, requesting When In Use authorization...")
            self.pendingCall = call
            self.isRequestingAlways = false
            
            // Set up timeout - if delegate doesn't fire within 30s, re-check status
            let timeoutWork = DispatchWorkItem { [weak self] in
                guard let self = self, let pendingCall = self.pendingCall else { return }
                
                print("[IOSBackgroundLocation] Permission request timeout - checking status again...")
                
                let currentStatus: CLAuthorizationStatus
                if #available(iOS 14.0, *) {
                    currentStatus = self.locationManager.authorizationStatus
                } else {
                    currentStatus = CLLocationManager.authorizationStatus()
                }
                
                // If status changed while we were waiting, handle it
                if currentStatus != .notDetermined {
                    self.handleAuthorizationChange(currentStatus)
                } else {
                    // Still not determined - user didn't respond or dismissed
                    print("[IOSBackgroundLocation] Timeout: still notDetermined, returning denied")
                    self.pendingCall = nil
                    pendingCall.resolve([
                        "granted": false,
                        "status": "denied",
                        "note": "Permission request timed out or was dismissed"
                    ])
                }
            }
            self.permissionTimeoutWork = timeoutWork
            DispatchQueue.main.asyncAfter(deadline: .now() + 30.0, execute: timeoutWork)
            
            // This MUST trigger the iOS permission popup
            self.locationManager.requestWhenInUseAuthorization()
            print("[IOSBackgroundLocation] requestWhenInUseAuthorization() called")
        }
    }
    
    // MARK: - Request Background (Always) Permission
    
    @objc func requestBackgroundPermission(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Cancel any existing timeout
            self.permissionTimeoutWork?.cancel()
            
            let status: CLAuthorizationStatus
            if #available(iOS 14.0, *) {
                status = self.locationManager.authorizationStatus
            } else {
                status = CLLocationManager.authorizationStatus()
            }
            
            print("[IOSBackgroundLocation] requestBackgroundPermission called, current status: \(self.statusString(status))")
            
            // Already have Always permission
            if status == .authorizedAlways {
                call.resolve([
                    "granted": true,
                    "status": "granted",
                    "note": "Already have Always permission"
                ])
                return
            }
            
            // Must have When In Use first
            if status != .authorizedWhenInUse {
                call.resolve([
                    "granted": false,
                    "status": "denied",
                    "note": "Must have When In Use permission first. Current status: \(self.statusString(status))"
                ])
                return
            }
            
            // Request upgrade to Always
            // IMPORTANT: This will trigger iOS's "upgrade to Always" dialog
            print("[IOSBackgroundLocation] Requesting upgrade to Always authorization...")
            self.pendingCall = call
            self.isRequestingAlways = true
            
            // Set up timeout for Always request
            let timeoutWork = DispatchWorkItem { [weak self] in
                guard let self = self, let pendingCall = self.pendingCall else { return }
                
                print("[IOSBackgroundLocation] Always permission request timeout - checking status...")
                
                let currentStatus: CLAuthorizationStatus
                if #available(iOS 14.0, *) {
                    currentStatus = self.locationManager.authorizationStatus
                } else {
                    currentStatus = CLLocationManager.authorizationStatus()
                }
                
                // Check if we got Always permission
                if currentStatus == .authorizedAlways {
                    self.handleAuthorizationChange(currentStatus)
                } else {
                    // User didn't upgrade to Always
                    print("[IOSBackgroundLocation] Timeout: user did not upgrade to Always")
                    self.pendingCall = nil
                    self.isRequestingAlways = false
                    pendingCall.resolve([
                        "granted": false,
                        "status": "denied",
                        "note": "User did not upgrade to Always permission"
                    ])
                }
            }
            self.permissionTimeoutWork = timeoutWork
            DispatchQueue.main.asyncAfter(deadline: .now() + 30.0, execute: timeoutWork)
            
            self.locationManager.requestAlwaysAuthorization()
            print("[IOSBackgroundLocation] requestAlwaysAuthorization() called")
        }
    }
    
    // MARK: - Notification Permission (No-op on iOS for location)
    
    @objc func requestNotificationPermission(_ call: CAPPluginCall) {
        // iOS doesn't require notification permission for location services
        call.resolve([
            "granted": true,
            "status": "granted",
            "note": "iOS doesn't require separate notification permission for location tracking"
        ])
    }
    
    // MARK: - Start Background Location Updates
    
    @objc func startForegroundService(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let status: CLAuthorizationStatus
            if #available(iOS 14.0, *) {
                status = self.locationManager.authorizationStatus
            } else {
                status = CLLocationManager.authorizationStatus()
            }
            
            guard status == .authorizedAlways || status == .authorizedWhenInUse else {
                call.resolve([
                    "success": false,
                    "note": "Location permission not granted"
                ])
                return
            }
            
            // Only enable background updates if we have Always permission
            if status == .authorizedAlways {
                self.locationManager.allowsBackgroundLocationUpdates = true
            }
            self.locationManager.pausesLocationUpdatesAutomatically = false
            
            // Use significant location change for battery efficiency
            // This works even when app is terminated
            self.locationManager.startMonitoringSignificantLocationChanges()
            
            // Also start standard updates for more accuracy when active
            self.locationManager.startUpdatingLocation()
            
            self.isBackgroundUpdatesActive = true
            
            call.resolve([
                "success": true,
                "note": "Background location updates started"
            ])
        }
    }
    
    // MARK: - Stop Background Location Updates
    
    @objc func stopForegroundService(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.locationManager.stopUpdatingLocation()
            self.locationManager.stopMonitoringSignificantLocationChanges()
            self.locationManager.allowsBackgroundLocationUpdates = false
            self.isBackgroundUpdatesActive = false
            
            call.resolve([
                "success": true,
                "note": "Background location updates stopped"
            ])
        }
    }
    
    // MARK: - Open App Settings
    
    @objc func openAppSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url, options: [:]) { success in
                    call.resolve([
                        "success": success
                    ])
                }
            } else {
                call.resolve([
                    "success": false
                ])
            }
        }
    }
    
    // MARK: - Get Device Info (Raw iOS identifiers)
    
    /**
     * Get accurate device info directly from iOS APIs
     * Returns raw model identifier (e.g., "iPhone17,2") NOT marketing names
     * This is more reliable for B2B data than guessed names
     */
    @objc func getDeviceInfo(_ call: CAPPluginCall) {
        var systemInfo = utsname()
        uname(&systemInfo)
        
        // Get raw model identifier (e.g., "iPhone17,2", "iPad14,3")
        let modelIdentifier = withUnsafePointer(to: &systemInfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                String(validatingUTF8: $0) ?? "Unknown"
            }
        }
        
        // Get iOS version
        let systemVersion = UIDevice.current.systemVersion
        let systemName = UIDevice.current.systemName // "iOS" or "iPadOS"
        
        // Get device name (user-set name, might be useful for debugging)
        let deviceName = UIDevice.current.name
        
        // Get device family
        let userInterfaceIdiom = UIDevice.current.userInterfaceIdiom
        var deviceFamily = "Unknown"
        switch userInterfaceIdiom {
        case .unspecified:
            deviceFamily = "Unknown"
        case .phone:
            deviceFamily = "iPhone"
        case .pad:
            deviceFamily = "iPad"
        case .tv:
            deviceFamily = "Apple TV"
        case .carPlay:
            deviceFamily = "CarPlay"
        case .mac:
            deviceFamily = "Mac"
        case .vision:
            deviceFamily = "Vision Pro"
        @unknown default:
            deviceFamily = "Unknown"
        }
        
        call.resolve([
            // Raw model identifier - this is what B2B customers want
            "model": modelIdentifier,
            // Device family for quick filtering
            "manufacturer": "Apple",
            "brand": "Apple",
            "device": deviceFamily,
            // OS info
            "osVersion": systemVersion,
            "platform": systemName.lowercased(), // "ios" or "ipados"
            // Extra context
            "deviceName": deviceName, // User's custom name for their device
            "modelIdentifier": modelIdentifier // Same as model, explicit naming
        ])
    }
    
    // MARK: - CLLocationManagerDelegate
    
    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status: CLAuthorizationStatus
        if #available(iOS 14.0, *) {
            status = manager.authorizationStatus
        } else {
            status = CLLocationManager.authorizationStatus()
        }
        
        // iOS 14+ fires this immediately when locationManager is created
        // Ignore the first callback if we're not actively requesting permission
        if !hasReceivedInitialCallback {
            hasReceivedInitialCallback = true
            if pendingCall == nil {
                print("[IOSBackgroundLocation] Initial authorization callback (ignored): \(statusString(status))")
                return
            }
        }
        
        print("[IOSBackgroundLocation] Authorization changed to: \(statusString(status))")
        handleAuthorizationChange(status)
    }
    
    // iOS 13 and earlier
    public func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        // iOS 13 also fires on initial setup
        if !hasReceivedInitialCallback {
            hasReceivedInitialCallback = true
            if pendingCall == nil {
                print("[IOSBackgroundLocation] Initial authorization callback (legacy, ignored): \(statusString(status))")
                return
            }
        }
        
        print("[IOSBackgroundLocation] Authorization changed (legacy) to: \(statusString(status))")
        handleAuthorizationChange(status)
    }
    
    private func handleAuthorizationChange(_ status: CLAuthorizationStatus) {
        // Cancel any pending timeout since delegate fired
        permissionTimeoutWork?.cancel()
        permissionTimeoutWork = nil
        
        guard let call = pendingCall else {
            print("[IOSBackgroundLocation] No pending call to resolve")
            return
        }
        pendingCall = nil
        
        if isRequestingAlways {
            // We were requesting Always permission
            let granted = status == .authorizedAlways
            print("[IOSBackgroundLocation] Always request result: \(granted ? "granted" : "denied")")
            call.resolve([
                "granted": granted,
                "status": granted ? "granted" : "denied",
                "note": granted 
                    ? "Always permission granted - background tracking enabled" 
                    : "User did not upgrade to Always. Background tracking limited."
            ])
        } else {
            // We were requesting When In Use permission
            let granted = status == .authorizedWhenInUse || status == .authorizedAlways
            print("[IOSBackgroundLocation] When In Use request result: \(granted ? "granted" : "denied")")
            call.resolve([
                "granted": granted,
                "status": granted ? "granted" : "denied",
                "note": granted 
                    ? "Location permission granted" 
                    : "User denied location permission"
            ])
        }
        
        isRequestingAlways = false
    }
    
    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        // Forward location updates to the webview if needed
        guard let location = locations.last else { return }
        
        notifyListeners("locationUpdate", data: [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "speed": location.speed,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000
        ])
    }
    
    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("[IOSBackgroundLocation] Location error: \(error.localizedDescription)")
    }
    
    // MARK: - Helper
    
    private func statusString(_ status: CLAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "notDetermined"
        case .restricted: return "restricted"
        case .denied: return "denied"
        case .authorizedWhenInUse: return "whenInUse"
        case .authorizedAlways: return "always"
        @unknown default: return "unknown"
        }
    }
}
