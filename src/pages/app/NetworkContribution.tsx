import React from 'react';
import { 
  Zap, 
  Signal, 
  Gauge, 
  MapPin,
  Pause,
  Play,
  AlertTriangle,
  Wifi,
  Battery,
  Cloud,
  CloudOff,
  Smartphone,
  Clock,
  Route
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { usePlatform } from '@/hooks/usePlatform';
import { ContributionMap } from '@/components/app/ContributionMap';
import { cn } from '@/lib/utils';

/**
 * Network Contribution Page - The "Mining" feature
 * 
 * BUSINESS RULES:
 * - CELLULAR ONLY: Mining pauses on WiFi - we are a DePIN for Mobile Networks
 * - TIME-BASED: Users earn 0.5 points/minute even when stationary
 * - DISTANCE: Users earn 0.01 points/meter when moving
 */
export const NetworkContribution: React.FC = () => {
  const { isAndroid } = usePlatform();
  
  const {
    user,
    session,
    stats,
    isTracking,
    hasPermission,
    geoError,
    isOnline,
    connectionType,
    offlineQueueCount,
    lastPosition,
    isCellular,
    isPaused,
    startContribution,
    stopContribution,
    formatDuration,
    formatDistance
  } = useNetworkContribution();

  const isActive = session.status === 'active';
  
  // Convert lastPosition to [lat, lng] tuple for map
  const userPosition: [number, number] | null = lastPosition 
    ? [lastPosition.coords.latitude, lastPosition.coords.longitude]
    : null;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Full-screen dark map background */}
      <ContributionMap userPosition={userPosition} isActive={isActive && isCellular} />
      
      {/* Content overlay */}
      <div className="relative z-20 px-4 py-6 space-y-4 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Network Contribution</h1>
          <p className="text-sm text-muted-foreground">Map cellular coverage & earn Nomi Points</p>
        </div>

        {/* Alerts section */}
        <div className="space-y-2">
          {/* CRITICAL: WiFi Warning - Mining Paused */}
          {isActive && !isCellular && (
            <Alert className="border-amber-500 bg-amber-500/20 backdrop-blur-sm">
              <Wifi className="h-5 w-5 text-amber-400" />
              <AlertTitle className="text-amber-400 font-semibold">Mining Paused</AlertTitle>
              <AlertDescription className="text-amber-200">
                Switch to 5G/4G to contribute. We map mobile networks, not WiFi.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Cellular Active Indicator */}
          {isActive && isCellular && (
            <Alert className="border-green-500/50 bg-green-500/10 backdrop-blur-sm">
              <Smartphone className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200/80">
                📶 Earning on {connectionType.toUpperCase()} - Keep it up!
              </AlertDescription>
            </Alert>
          )}

          {/* Battery Warning (Android only) */}
          {isAndroid && !isActive && (
            <Alert className="border-amber-500/50 bg-amber-500/10 backdrop-blur-sm">
              <Battery className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-500">Battery Optimization</AlertTitle>
              <AlertDescription className="text-amber-200/80">
                For best results, disable battery optimization for Nomiqa in Settings.
              </AlertDescription>
            </Alert>
          )}

          {/* Permission Error */}
          {hasPermission === false && (
            <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-500">Location Required</AlertTitle>
              <AlertDescription className="text-red-200/80">
                Please enable location permissions to start contributing.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Spacer to push button toward center */}
        <div className="flex-1 flex items-center justify-center">
          {/* Main Control Button */}
          <button
            onClick={isActive ? stopContribution : startContribution}
            disabled={!user}
            className={cn(
              'relative w-36 h-36 rounded-full transition-all duration-500',
              'flex items-center justify-center',
              'shadow-2xl transform active:scale-95',
              'backdrop-blur-sm',
              isActive 
                ? isPaused
                  ? 'bg-gradient-to-br from-amber-500/90 to-amber-700/90 shadow-amber-500/50' // Paused (WiFi)
                  : 'bg-gradient-to-br from-green-500/90 to-green-700/90 shadow-green-500/50' // Active + Cellular
                : 'bg-gradient-to-br from-primary/90 to-primary/70 shadow-primary/50', // Idle
              !user && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Pulsing rings when active on cellular */}
            {isActive && isCellular && (
              <>
                <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-green-500/20 animate-pulse" />
              </>
            )}
            
            {/* Paused indicator when on WiFi */}
            {isActive && isPaused && (
              <span className="absolute inset-2 rounded-full border-4 border-dashed border-amber-400/50 animate-spin" style={{ animationDuration: '8s' }} />
            )}
            
            <div className="relative z-10 text-center text-white">
              {isActive ? (
                isPaused ? (
                  <>
                    <Wifi className="w-10 h-10 mx-auto mb-1 opacity-80" />
                    <span className="text-xs font-medium">PAUSED</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-10 h-10 mx-auto mb-1" />
                    <span className="text-sm font-medium">STOP</span>
                  </>
                )
              ) : (
                <>
                  <Play className="w-10 h-10 mx-auto mb-1" />
                  <span className="text-sm font-medium">START</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Auth prompt */}
        {!user && (
          <div className="text-center text-muted-foreground text-sm backdrop-blur-sm bg-background/30 py-2 rounded-lg">
            Please sign in to start contributing
          </div>
        )}

        {/* Bottom Stats Panel */}
        <div className="space-y-3 pb-4">
          {/* Live Stats */}
          <Card className="bg-card/70 border-border/50 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <div className="text-xl font-bold text-foreground">
                    {stats.pointsEarned.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div>
                  <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <div className="text-xl font-bold text-foreground">
                    {stats.timePoints.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Time Pts</div>
                </div>
                <div>
                  <Route className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-xl font-bold text-foreground">
                    {stats.distancePoints.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Dist Pts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card/70 border-border/50 backdrop-blur-md">
              <CardContent className="p-3 text-center">
                <Signal className={cn(
                  'w-5 h-5 mx-auto mb-1',
                  isCellular ? 'text-green-500' : 'text-amber-500'
                )} />
                <div className="text-sm font-medium text-foreground capitalize">
                  {connectionType || 'none'}
                </div>
                <div className="text-xs text-muted-foreground">Network</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/70 border-border/50 backdrop-blur-md">
              <CardContent className="p-3 text-center">
                <Wifi className="w-5 h-5 mx-auto mb-1 text-primary" />
                <div className="text-sm font-medium text-foreground">
                  {formatDuration(stats.duration)}
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/70 border-border/50 backdrop-blur-md">
              <CardContent className="p-3 text-center">
                <MapPin className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <div className="text-sm font-medium text-foreground">
                  {formatDistance(stats.distanceMeters)}
                </div>
                <div className="text-xs text-muted-foreground">Distance</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Points Counter */}
          <Card className="bg-card/70 border-border/50 backdrop-blur-md">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Cloud className="w-5 h-5 text-green-500" />
                ) : (
                  <CloudOff className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {stats.dataPointsCount} data points
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {offlineQueueCount > 0 ? `${offlineQueueCount} pending sync` : 'All synced'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Speed</div>
                <div className="text-sm font-medium text-foreground">{stats.speedKmh} km/h</div>
              </div>
            </CardContent>
          </Card>

          {/* Offline indicator */}
          {!isOnline && (
            <Alert className="border-amber-500/50 bg-amber-500/10 backdrop-blur-sm">
              <CloudOff className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200/80">
                You're offline. Data will sync when connected.
              </AlertDescription>
            </Alert>
          )}

          {/* Geo Error */}
          {geoError && (
            <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200/80">
                {geoError}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};
