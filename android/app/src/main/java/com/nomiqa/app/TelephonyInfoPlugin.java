/**
 * TelephonyInfoPlugin - Native Android Implementation
 * 
 * This file provides the native Android Capacitor plugin
 * that accesses TelephonyManager APIs for telco-grade signal metrics.
 * 
 * Supports minSdk 24 (Android 7.0) with graceful fallbacks for newer APIs.
 * 
 * Required Permissions (add to AndroidManifest.xml):
 *   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
 *   <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
 *   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
 */

package com.nomiqa.app;

import android.Manifest;
import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.telephony.CellIdentityLte;
import android.telephony.CellInfo;
import android.telephony.CellInfoLte;
import android.telephony.CellSignalStrengthLte;
import android.telephony.TelephonyManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.List;

@CapacitorPlugin(
    name = "TelephonyInfoPlugin",
    permissions = {
        @Permission(
            alias = "location",
            strings = { Manifest.permission.ACCESS_FINE_LOCATION }
        ),
        @Permission(
            alias = "phoneState", 
            strings = { Manifest.permission.READ_PHONE_STATE }
        )
    }
)
public class TelephonyInfoPlugin extends Plugin {

    private TelephonyManager telephonyManager;
    private LocationManager locationManager;

    @Override
    public void load() {
        Context context = getContext();
        telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
        locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
    }

    @PluginMethod
    public void getSignalInfo(PluginCall call) {
        JSObject result = new JSObject();
        
        try {
            // Get all cell info - requires ACCESS_FINE_LOCATION on API 29+
            List<CellInfo> cellInfoList = null;
            try {
                cellInfoList = telephonyManager.getAllCellInfo();
            } catch (SecurityException e) {
                // Permission not granted
                result.put("error", "Location permission required for signal info");
            }
            
            if (cellInfoList != null && !cellInfoList.isEmpty()) {
                for (CellInfo cellInfo : cellInfoList) {
                    if (!cellInfo.isRegistered()) continue;
                    
                    // 5G NR - API 29+ (Android Q)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        if (process5GInfo(cellInfo, result)) {
                            break;
                        }
                    }
                    
                    // LTE - available on all supported API levels
                    if (cellInfo instanceof CellInfoLte) {
                        CellInfoLte cellInfoLte = (CellInfoLte) cellInfo;
                        CellSignalStrengthLte signalLte = cellInfoLte.getCellSignalStrength();
                        CellIdentityLte identityLte = cellInfoLte.getCellIdentity();
                        
                        result.put("networkType", "LTE");
                        
                        // getRsrp(), getRsrq(), getRssnr() require API 26+ (O)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            result.put("rsrp", signalLte.getRsrp());
                            result.put("rsrq", signalLte.getRsrq());
                            result.put("sinr", signalLte.getRssnr());
                        } else {
                            // API 24-25 fallback: use getDbm() for signal strength estimate
                            result.put("rssi", signalLte.getDbm());
                        }
                        
                        // getRssi() requires API 29+ (Q)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            result.put("rssi", signalLte.getRssi());
                        }
                        
                        result.put("cellId", String.valueOf(identityLte.getCi()));
                        result.put("pci", identityLte.getPci());
                        result.put("tac", String.valueOf(identityLte.getTac()));
                        
                        // getMccString/getMncString require API 28+ (P)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                            result.put("mcc", identityLte.getMccString());
                            result.put("mnc", identityLte.getMncString());
                            result.put("bandNumber", identityLte.getBandwidth() / 1000); // Convert to MHz
                        } else {
                            // Fallback: get from network operator
                            String opCode = telephonyManager.getNetworkOperator();
                            if (opCode != null && opCode.length() >= 5) {
                                result.put("mcc", opCode.substring(0, 3));
                                result.put("mnc", opCode.substring(3));
                            }
                        }
                        break;
                    }
                    // GSM/WCDMA/CDMA can be added here with similar version guards
                }
            }
            
            // Get carrier name - available on all API levels
            result.put("carrierName", telephonyManager.getNetworkOperatorName());
            
            // Get roaming status - available on all API levels
            result.put("isRoaming", telephonyManager.isNetworkRoaming());
            
            // Get MCC/MNC combined - available on all API levels
            String networkOperator = telephonyManager.getNetworkOperator();
            if (networkOperator != null && networkOperator.length() >= 5) {
                result.put("mccMnc", networkOperator.substring(0, 3) + "-" + networkOperator.substring(3));
            }
            
        } catch (SecurityException e) {
            result.put("error", "Permission denied: " + e.getMessage());
        } catch (Exception e) {
            result.put("error", "Failed to get signal info: " + e.getMessage());
        }
        
        call.resolve(result);
    }

    /**
     * Process 5G NR cell info - Only called on API 29+
     * This method is in a separate function to avoid class verification issues
     * on older Android versions that don't have CellInfoNr class.
     */
    @android.annotation.TargetApi(Build.VERSION_CODES.Q)
    private boolean process5GInfo(CellInfo cellInfo, JSObject result) {
        try {
            // Use reflection-safe class check
            if (cellInfo.getClass().getSimpleName().equals("CellInfoNr")) {
                android.telephony.CellInfoNr cellInfoNr = (android.telephony.CellInfoNr) cellInfo;
                android.telephony.CellSignalStrengthNr signalNr = 
                    (android.telephony.CellSignalStrengthNr) cellInfoNr.getCellSignalStrength();
                android.telephony.CellIdentityNr identityNr = 
                    (android.telephony.CellIdentityNr) cellInfoNr.getCellIdentity();
                
                result.put("networkType", "5G_SA");
                result.put("rsrp", signalNr.getSsRsrp());
                result.put("rsrq", signalNr.getSsRsrq());
                result.put("sinr", signalNr.getSsSinr());
                result.put("pci", identityNr.getPci());
                result.put("tac", String.valueOf(identityNr.getTac()));
                result.put("mcc", identityNr.getMccString());
                result.put("mnc", identityNr.getMncString());
                
                // getBands() requires API 30+ (R)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    int[] bands = identityNr.getBands();
                    if (bands != null && bands.length > 0) {
                        result.put("bandNumber", bands[0]);
                    }
                }
                return true;
            }
        } catch (Exception e) {
            // Silently fail - will fall through to LTE processing
        }
        return false;
    }

    /**
     * Get accurate device info directly from Android Build class
     * This is more reliable than Capacitor's Device plugin which may return user-agent fallbacks
     */
    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        JSObject result = new JSObject();
        
        try {
            // These come directly from android.os.Build - always accurate
            result.put("manufacturer", Build.MANUFACTURER);
            result.put("model", Build.MODEL);
            result.put("brand", Build.BRAND);
            result.put("device", Build.DEVICE);
            result.put("product", Build.PRODUCT);
            
            // Android version info
            result.put("osVersion", Build.VERSION.RELEASE);
            result.put("sdkInt", Build.VERSION.SDK_INT);
            result.put("platform", "android");
            
            // Build info for debugging
            result.put("buildId", Build.ID);
            result.put("fingerprint", Build.FINGERPRINT);
            
            // 5G capability detection
            boolean is5gCapable = false;
            String maxGeneration = "4G"; // Default assumption for modern Android
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // API 29+: Check PackageManager for 5G radio feature
                try {
                    android.content.pm.PackageManager pm = getContext().getPackageManager();
                    if (pm.hasSystemFeature("android.hardware.telephony.radio.access.nr")) {
                        is5gCapable = true;
                        maxGeneration = "5G";
                    }
                } catch (Exception e) {
                    // Feature check failed, keep defaults
                }
            }
            
            // Fallback: SDK < 29 means device is pre-5G era
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                maxGeneration = "4G";
                is5gCapable = false;
            }
            
            result.put("is5gCapable", is5gCapable);
            result.put("maxSupportedGeneration", maxGeneration);
            
        } catch (Exception e) {
            result.put("error", "Failed to get device info: " + e.getMessage());
        }
        
        call.resolve(result);
    }

    @PluginMethod
    public void getCarrierInfo(PluginCall call) {
        JSObject result = new JSObject();
        
        try {
            result.put("carrierName", telephonyManager.getNetworkOperatorName());
            
            String networkOperator = telephonyManager.getNetworkOperator();
            if (networkOperator != null && networkOperator.length() >= 5) {
                result.put("mcc", networkOperator.substring(0, 3));
                result.put("mnc", networkOperator.substring(3));
            }
            
            result.put("isRoaming", telephonyManager.isNetworkRoaming());
            
        } catch (SecurityException e) {
            result.put("error", "Permission denied");
        }
        
        call.resolve(result);
    }

    @PluginMethod
    public void isMockLocationEnabled(PluginCall call) {
        JSObject result = new JSObject();
        
        try {
            boolean isMock = false;
            Location lastLocation = null;
            
            try {
                lastLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            } catch (SecurityException e) {
                // Permission not granted, assume not mock
            }
            
            if (lastLocation != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    // Android 12+ (API 31): Use isMock()
                    isMock = lastLocation.isMock();
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
                    // Android 4.3+ (API 18): Use isFromMockProvider()
                    isMock = lastLocation.isFromMockProvider();
                }
            }
            
            // Fallback for older devices or when no location available
            if (!isMock && Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                // Pre-Marshmallow: Check developer options setting
                try {
                    String mockLocation = android.provider.Settings.Secure.getString(
                        getContext().getContentResolver(),
                        "mock_location" // Use string literal for compatibility
                    );
                    isMock = "1".equals(mockLocation);
                } catch (Exception e) {
                    // Ignore - can't determine mock status
                }
            }
            
            result.put("isMock", isMock);
            
        } catch (Exception e) {
            result.put("isMock", false);
            result.put("error", "Failed to check mock location: " + e.getMessage());
        }
        
        call.resolve(result);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put("location", checkAppPermission(Manifest.permission.ACCESS_FINE_LOCATION));
        result.put("phoneState", checkAppPermission(Manifest.permission.READ_PHONE_STATE));
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        requestAllPermissions(call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("location", checkAppPermission(Manifest.permission.ACCESS_FINE_LOCATION));
        result.put("phoneState", checkAppPermission(Manifest.permission.READ_PHONE_STATE));
        call.resolve(result);
    }

    private boolean checkAppPermission(String permission) {
        return getPermissionState(permission) == PermissionState.GRANTED;
    }
}
