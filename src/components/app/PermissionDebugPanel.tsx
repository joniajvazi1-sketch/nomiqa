import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Bell, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PermissionState {
  fineLocation: boolean;
  coarseLocation: boolean;
  backgroundLocation: boolean;
  notification: boolean;
  shouldShowForegroundRationale: boolean;
  shouldShowBackgroundRationale: boolean;
  androidVersion: number;
  requiresBackgroundPermission: boolean;
  foregroundStatus: 'granted' | 'denied' | 'prompt' | 'not_determined';
  backgroundStatus: 'granted' | 'denied' | 'prompt' | 'not_determined';
}

/**
 * Debug panel for verifying Android permission states
 * Shows detailed permission status and provides test buttons
 */
export const PermissionDebugPanel: React.FC = () => {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [serviceRunning, setServiceRunning] = useState(false);
  const isAndroid = Capacitor.getPlatform() === 'android';
  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = async () => {
    if (!isNative) {
      toast({
        title: "Not Native",
        description: "Permission debug only works on native Android/iOS",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
      const status = await BackgroundLocation.getPermissionStatus();
      setPermissionState(status);
      console.log('[PermissionDebug] Status:', JSON.stringify(status, null, 2));
      
      toast({
        title: "Permission Status Loaded",
        description: `Foreground: ${status.foregroundStatus}, Background: ${status.backgroundStatus}`,
      });
    } catch (error) {
      console.error('[PermissionDebug] Error:', error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const requestForeground = async () => {
    setLoading(true);
    try {
      const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
      console.log('[PermissionDebug] Requesting foreground permission...');
      const result = await BackgroundLocation.requestForegroundPermission();
      console.log('[PermissionDebug] Foreground result:', result);
      
      toast({
        title: result.granted ? "Permission Granted ✓" : "Permission Denied",
        description: result.granted 
          ? "Foreground location access granted" 
          : "User denied foreground location. Tap 'Open Settings' to enable.",
        variant: result.granted ? "default" : "destructive"
      });
      
      await checkPermissions();
    } catch (error) {
      console.error('[PermissionDebug] Foreground request error:', error);
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const requestBackground = async () => {
    setLoading(true);
    try {
      const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
      console.log('[PermissionDebug] Requesting background permission...');
      const result = await BackgroundLocation.requestBackgroundPermission();
      console.log('[PermissionDebug] Background result:', result);
      
      toast({
        title: result.granted ? "Background Granted ✓" : "Background Denied",
        description: result.granted 
          ? "Background location access granted" 
          : "User denied background location. Check 'Allow all the time' in Settings.",
        variant: result.granted ? "default" : "destructive"
      });
      
      await checkPermissions();
    } catch (error) {
      console.error('[PermissionDebug] Background request error:', error);
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const requestNotification = async () => {
    setLoading(true);
    try {
      const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
      const result = await BackgroundLocation.requestNotificationPermission();
      
      toast({
        title: result.granted ? "Notifications Enabled ✓" : "Notifications Denied",
        description: result.note || (result.granted ? "Can show service notification" : "Service may not show notification"),
      });
      
      await checkPermissions();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openSettings = async () => {
    try {
      const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
      await BackgroundLocation.openAppSettings();
      toast({ title: "Opening Settings", description: "Grant permissions and return to app" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const toggleService = async () => {
    setLoading(true);
    try {
      const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
      
      if (serviceRunning) {
        await BackgroundLocation.stopForegroundService();
        setServiceRunning(false);
        toast({ title: "Service Stopped", description: "Background tracking disabled" });
      } else {
        await BackgroundLocation.startForegroundService();
        setServiceRunning(true);
        toast({ title: "Service Started", description: "Background tracking active - check notification" });
      }
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isNative) {
      checkPermissions();
    }
  }, [isNative]);

  const getStatusIcon = (status: 'granted' | 'denied' | 'prompt' | 'not_determined') => {
    if (status === 'granted') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'denied') return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-amber-500" />;
  };

  const getStatusBadge = (status: 'granted' | 'denied' | 'prompt' | 'not_determined') => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      granted: 'default',
      denied: 'destructive',
      prompt: 'secondary',
      not_determined: 'secondary'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase().replace('_', ' ')}</Badge>;
  };

  if (!isNative) {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Permission Debug (Native Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            This panel only works on Android/iOS devices. Build and run on a real device to test.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-md border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Permission Debug
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkPermissions}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Info */}
        {permissionState && (
          <div className="text-xs text-muted-foreground">
            Android {permissionState.androidVersion} • 
            {permissionState.requiresBackgroundPermission ? ' Requires separate background permission' : ' Background included with foreground'}
          </div>
        )}

        {/* Permission Status */}
        {permissionState && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                Foreground Location
              </span>
              <div className="flex items-center gap-2">
                {getStatusIcon(permissionState.foregroundStatus)}
                {getStatusBadge(permissionState.foregroundStatus)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Navigation className="w-4 h-4" />
                Background Location
              </span>
              <div className="flex items-center gap-2">
                {getStatusIcon(permissionState.backgroundStatus)}
                {getStatusBadge(permissionState.backgroundStatus)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4" />
                Notifications
              </span>
              <div className="flex items-center gap-2">
                {permissionState.notification 
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <XCircle className="w-4 h-4 text-red-500" />
                }
                <Badge variant={permissionState.notification ? 'default' : 'destructive'}>
                  {permissionState.notification ? 'GRANTED' : 'DENIED'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Rationale Info */}
        {permissionState && (permissionState.shouldShowForegroundRationale || permissionState.shouldShowBackgroundRationale) && (
          <div className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
            ⚠️ User denied permission once. System will show dialog again with rationale.
          </div>
        )}

        {/* Denied Permanently Info */}
        {permissionState && 
         permissionState.foregroundStatus === 'denied' && 
         !permissionState.shouldShowForegroundRationale && (
          <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">
            ❌ Permission permanently denied ("Don't ask again"). User must enable in Settings.
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={requestForeground}
            disabled={loading || permissionState?.foregroundStatus === 'granted'}
          >
            <MapPin className="w-3 h-3 mr-1" />
            Request Foreground
          </Button>

          <Button 
            size="sm" 
            variant="outline"
            onClick={requestBackground}
            disabled={loading || permissionState?.foregroundStatus !== 'granted'}
          >
            <Navigation className="w-3 h-3 mr-1" />
            Request Background
          </Button>

          <Button 
            size="sm" 
            variant="outline"
            onClick={requestNotification}
            disabled={loading || permissionState?.notification}
          >
            <Bell className="w-3 h-3 mr-1" />
            Request Notification
          </Button>

          <Button 
            size="sm" 
            variant="outline"
            onClick={openSettings}
          >
            <Settings className="w-3 h-3 mr-1" />
            Open Settings
          </Button>
        </div>

        {/* Foreground Service Test */}
        <div className="pt-2 border-t border-border">
          <Button 
            size="sm" 
            variant={serviceRunning ? "destructive" : "default"}
            className="w-full"
            onClick={toggleService}
            disabled={loading || !permissionState?.backgroundLocation}
          >
            {serviceRunning ? 'Stop Background Service' : 'Start Background Service'}
          </Button>
          {!permissionState?.backgroundLocation && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Grant background permission first
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionDebugPanel;
