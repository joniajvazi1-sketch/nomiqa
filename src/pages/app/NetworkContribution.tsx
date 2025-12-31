import React from 'react';
import { 
  Zap, 
  Signal, 
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
  Route,
  Radio
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { usePlatform } from '@/hooks/usePlatform';
import { ContributionMap } from '@/components/app/ContributionMap';
import { cn } from '@/lib/utils';

/**
 * Network Contribution Page - DePIN Network Scanner
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
    <div className="relative w-full h-full min-h-screen bg-background">
      {/* Full-screen dark map background */}
      <div className="absolute inset-0 z-0">
        <ContributionMap userPosition={userPosition} isActive={isActive && isCellular} />
      </div>
      
      {/* Content overlay - above map */}
      <div 
        className="relative z-10 px-4 py-6 flex flex-col min-h-screen"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 1rem)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h1 
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
          >
            NETWORK SCANNER
          </h1>
          <p className="text-sm text-muted-foreground">Map cellular coverage • Earn rewards</p>
        </div>

        {/* Alerts section */}
        <div className="space-y-2 mb-4">
          {/* CRITICAL: WiFi Warning - Mining Paused */}
          {isActive && !isCellular && (
            <Alert className="border-amber-500 bg-amber-500/20 backdrop-blur-sm">
              <Wifi className="h-5 w-5 text-amber-400" />
              <AlertTitle className="text-amber-400 font-semibold">Scanning Paused</AlertTitle>
              <AlertDescription className="text-amber-200">
                Switch to 5G/4G to contribute. We map mobile networks, not WiFi.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Cellular Active Indicator */}
          {isActive && isCellular && (
            <Alert className="border-neon-cyan/50 bg-neon-cyan/10 backdrop-blur-sm">
              <Smartphone className="h-4 w-4 text-neon-cyan" />
              <AlertDescription className="text-neon-cyan/80">
                📶 Scanning on {connectionType.toUpperCase()} - Keep moving!
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
                Please enable location permissions to start scanning.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Control Button - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={isActive ? stopContribution : startContribution}
            disabled={!user}
            className={cn(
              'relative w-40 h-40 rounded-full transition-all duration-500',
              'flex items-center justify-center',
              'shadow-2xl transform active:scale-95',
              'backdrop-blur-sm border-2',
              isActive 
                ? isPaused
                  ? 'bg-gradient-to-br from-amber-500/90 to-amber-700/90 shadow-amber-500/50 border-amber-400/50' 
                  : 'bg-gradient-to-br from-neon-cyan/90 to-neon-cyan/70 shadow-neon-cyan/50 border-neon-cyan/50' 
                : 'bg-gradient-to-br from-primary/90 to-primary/70 shadow-primary/50 border-primary/50',
              !user && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Sonar/Radar ping animation when IDLE */}
            {!isActive && user && (
              <>
                <span 
                  className="absolute inset-0 rounded-full border-2 border-neon-cyan/60"
                  style={{ animation: 'sonar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                />
                <span 
                  className="absolute inset-0 rounded-full border-2 border-neon-cyan/40"
                  style={{ animation: 'sonar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s' }}
                />
                <span 
                  className="absolute inset-0 rounded-full border border-neon-cyan/20"
                  style={{ animation: 'sonar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 1s' }}
                />
                <span className="absolute inset-4 rounded-full bg-neon-cyan/10 animate-pulse" />
              </>
            )}
            
            {/* Pulsing rings when active on cellular */}
            {isActive && isCellular && (
              <>
                <span className="absolute inset-0 rounded-full bg-neon-cyan/30 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-neon-cyan/20 animate-pulse" />
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
                    <Wifi className="w-12 h-12 mx-auto mb-1 opacity-80" />
                    <span className="text-xs font-mono font-medium">PAUSED</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-12 h-12 mx-auto mb-1" />
                    <span className="text-sm font-mono font-medium">STOP</span>
                  </>
                )
              ) : (
                <>
                  <Radio className="w-12 h-12 mx-auto mb-1" />
                  <span className="text-sm font-mono font-medium">SCAN</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Auth prompt */}
        {!user && (
          <div className="text-center text-muted-foreground text-sm backdrop-blur-sm bg-background/30 py-2 rounded-lg mb-4 font-mono">
            Sign in to start scanning
          </div>
        )}

        {/* Bottom Stats Panel */}
        <div className="space-y-3 mt-auto">
          {/* Live Stats */}
          <Card className="bg-background/60 border-border/50 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Zap className="w-5 h-5 mx-auto mb-1 text-neon-cyan" />
                  <div 
                    className="text-xl font-bold text-foreground"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                  >
                    {stats.pointsEarned.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">POINTS</div>
                </div>
                <div>
                  <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <div 
                    className="text-xl font-bold text-foreground"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                  >
                    {stats.timePoints.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">TIME</div>
                </div>
                <div>
                  <Route className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <div 
                    className="text-xl font-bold text-foreground"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                  >
                    {stats.distancePoints.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">DIST</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-background/60 border-border/50 backdrop-blur-xl">
              <CardContent className="p-3 text-center">
                <Signal className={cn(
                  'w-5 h-5 mx-auto mb-1',
                  isCellular ? 'text-neon-cyan' : 'text-amber-500'
                )} />
                <div 
                  className="text-sm font-medium text-foreground uppercase"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {connectionType || 'NONE'}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">NETWORK</div>
              </CardContent>
            </Card>
            
            <Card className="bg-background/60 border-border/50 backdrop-blur-xl">
              <CardContent className="p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <div 
                  className="text-sm font-medium text-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {formatDuration(stats.duration)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">DURATION</div>
              </CardContent>
            </Card>
            
            <Card className="bg-background/60 border-border/50 backdrop-blur-xl">
              <CardContent className="p-3 text-center">
                <MapPin className="w-5 h-5 mx-auto mb-1 text-neon-cyan" />
                <div 
                  className="text-sm font-medium text-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {formatDistance(stats.distanceMeters)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">DISTANCE</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Points Counter */}
          <Card className="bg-background/60 border-border/50 backdrop-blur-xl">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Cloud className="w-5 h-5 text-neon-cyan" />
                ) : (
                  <CloudOff className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <div 
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                  >
                    {stats.dataPointsCount} DATA POINTS
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {offlineQueueCount > 0 ? `${offlineQueueCount} PENDING` : 'SYNCED'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground font-mono">SPEED</div>
                <div 
                  className="text-sm font-medium text-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {stats.speedKmh} KM/H
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offline indicator */}
          {!isOnline && (
            <Alert className="border-amber-500/50 bg-amber-500/10 backdrop-blur-sm">
              <CloudOff className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200/80 font-mono text-xs">
                OFFLINE - Data will sync when connected
              </AlertDescription>
            </Alert>
          )}

          {/* Geo Error */}
          {geoError && (
            <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200/80 font-mono text-xs">
                {geoError}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Sonar animation keyframes */}
      <style>{`
        @keyframes sonar-ping {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
