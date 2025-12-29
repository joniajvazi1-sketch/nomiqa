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
  CloudOff
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { usePlatform } from '@/hooks/usePlatform';
import { cn } from '@/lib/utils';

/**
 * Network Contribution Page - The "Mining" feature
 * Dark futuristic UI with real-time stats and background geolocation
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
    startContribution,
    stopContribution,
    formatDuration,
    formatDistance
  } = useNetworkContribution();

  const isActive = session.status === 'active';

  return (
    <div className="min-h-screen bg-background px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Network Contribution</h1>
        <p className="text-sm text-muted-foreground">Help map coverage & earn Nomi Points</p>
      </div>

      {/* Battery Warning (Android only) */}
      {isAndroid && !isActive && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Battery className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Battery Optimization</AlertTitle>
          <AlertDescription className="text-amber-200/80">
            For best results, disable battery optimization for Nomiqa in Settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Permission Error */}
      {hasPermission === false && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-500">Location Required</AlertTitle>
          <AlertDescription className="text-red-200/80">
            Please enable location permissions to start contributing.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Control Button */}
      <div className="flex justify-center py-8">
        <button
          onClick={isActive ? stopContribution : startContribution}
          disabled={!user}
          className={cn(
            'relative w-40 h-40 rounded-full transition-all duration-500',
            'flex items-center justify-center',
            'shadow-2xl transform active:scale-95',
            isActive 
              ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/50' 
              : 'bg-gradient-to-br from-primary to-primary/70 shadow-primary/50',
            !user && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Pulsing rings when active */}
          {isActive && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-red-500/20 animate-pulse" />
            </>
          )}
          
          <div className="relative z-10 text-center text-white">
            {isActive ? (
              <>
                <Pause className="w-12 h-12 mx-auto mb-1" />
                <span className="text-sm font-medium">STOP</span>
              </>
            ) : (
              <>
                <Play className="w-12 h-12 mx-auto mb-1" />
                <span className="text-sm font-medium">START</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Auth prompt */}
      {!user && (
        <div className="text-center text-muted-foreground text-sm">
          Please sign in to start contributing
        </div>
      )}

      {/* Live Stats */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-xl font-bold text-foreground">{stats.pointsEarned}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div>
              <Gauge className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="text-xl font-bold text-foreground">{stats.speedKmh}</div>
              <div className="text-xs text-muted-foreground">km/h</div>
            </div>
            <div>
              <MapPin className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <div className="text-xl font-bold text-foreground">{formatDistance(stats.distanceMeters)}</div>
              <div className="text-xs text-muted-foreground">Distance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <Signal className={cn(
              'w-5 h-5',
              isOnline ? 'text-green-500' : 'text-red-500'
            )} />
            <div>
              <div className="text-sm font-medium text-foreground capitalize">{connectionType}</div>
              <div className="text-xs text-muted-foreground">Network</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <Wifi className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm font-medium text-foreground">{formatDuration(stats.duration)}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Points Counter */}
      <Card className="bg-card/50 border-border/50">
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
        </CardContent>
      </Card>

      {/* Offline indicator */}
      {!isOnline && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <CloudOff className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200/80">
            You're offline. Data will sync when connected.
          </AlertDescription>
        </Alert>
      )}

      {/* Geo Error */}
      {geoError && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200/80">
            {geoError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
