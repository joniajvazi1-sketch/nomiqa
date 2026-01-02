import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Zap, 
  Signal, 
  MapPin,
  Pause,
  AlertTriangle,
  Wifi,
  Battery,
  Cloud,
  CloudOff,
  Smartphone,
  Clock,
  Route,
  Radio,
  Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { usePlatform } from '@/hooks/usePlatform';
import { useHaptics } from '@/hooks/useHaptics';
import { ContributionMap } from '@/components/app/ContributionMap';
import { AnimatedCounter } from '@/components/app/AnimatedCounter';
import { RadarScanner } from '@/components/app/RadarScanner';
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { CircularProgress } from '@/components/app/CircularProgress';
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
  const { error: errorHaptic } = useHaptics();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [celebrationType, setCelebrationType] = useState<'milestone' | 'session-end'>('milestone');
  const lastPointsRef = useRef(0);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  
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

  // Calculate daily goal progress (example: 100 points daily goal)
  const dailyGoal = 100;
  const dailyProgress = Math.min((stats.pointsEarned / dailyGoal) * 100, 100);

  // Handle milestone celebrations
  const handleMilestone = useCallback((milestone: number) => {
    setCelebrationPoints(milestone);
    setCelebrationType('milestone');
    setShowCelebration(true);
  }, []);

  // Handle session end celebration
  const handleStopContribution = useCallback(() => {
    if (stats.pointsEarned > 0) {
      setCelebrationPoints(stats.pointsEarned);
      setCelebrationType('session-end');
      setShowCelebration(true);
    }
    stopContribution();
  }, [stats.pointsEarned, stopContribution]);

  // Signal strength simulation based on connection type
  const connStr = String(connectionType).toLowerCase();
  const signalStrength = connStr.includes('5g') ? 95 : connStr.includes('4g') || connStr.includes('lte') ? 80 : connStr.includes('3g') ? 60 : 40;

  return (
    <div className="relative w-full h-full min-h-screen bg-background">
      {/* Full-screen dark map background */}
      <div className="absolute inset-0 z-0">
        <ContributionMap userPosition={userPosition} isActive={isActive && isCellular} />
      </div>
      
      {/* Celebration overlay */}
      <RewardCelebration 
        trigger={showCelebration} 
        points={celebrationPoints}
        type={celebrationType}
        onComplete={() => setShowCelebration(false)}
      />
      
      {/* Content overlay - above map */}
      <div 
        className="relative z-10 px-4 py-6 flex flex-col min-h-screen"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 1rem)'
        }}
      >
        {/* Header with signal waves when active */}
        <div className="text-center mb-4 relative">
          {isActive && isCellular && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-24 h-24 rounded-full border border-neon-cyan/30 animate-signal-wave" />
              <div className="absolute w-24 h-24 rounded-full border border-neon-cyan/20 animate-signal-wave" style={{ animationDelay: '0.5s' }} />
            </div>
          )}
          <h1 
            className="text-2xl font-bold text-foreground relative"
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
            <Alert className="border-amber-500 bg-amber-500/20 backdrop-blur-sm animate-fade-in">
              <Wifi className="h-5 w-5 text-amber-400" />
              <AlertTitle className="text-amber-400 font-semibold">Scanning Paused</AlertTitle>
              <AlertDescription className="text-amber-200">
                Switch to 5G/4G to contribute. We map mobile networks, not WiFi.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Cellular Active Indicator with animated icon */}
          {isActive && isCellular && (
            <Alert className="border-neon-cyan/50 bg-neon-cyan/10 backdrop-blur-sm animate-fade-in">
              <Activity className="h-4 w-4 text-neon-cyan animate-pulse" />
              <AlertDescription className="text-neon-cyan/80 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                Scanning on {connectionType.toUpperCase()} - Keep moving!
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
            <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm animate-shake">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-500">Location Required</AlertTitle>
              <AlertDescription className="text-red-200/80">
                Please enable location permissions to start scanning.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Control Button with Radar Scanner */}
        <div className="flex-1 flex items-center justify-center">
          <button
            ref={startButtonRef}
            onClick={() => {
              // Error feedback when no permissions
              if (!isActive && hasPermission === false) {
                errorHaptic();
                startButtonRef.current?.classList.add('animate-error-shake', 'error-highlight');
                setTimeout(() => {
                  startButtonRef.current?.classList.remove('animate-error-shake');
                }, 400);
                setTimeout(() => {
                  startButtonRef.current?.classList.remove('error-highlight');
                }, 800);
                return;
              }
              isActive ? handleStopContribution() : startContribution();
            }}
            disabled={!user}
            className={cn(
              'relative w-44 h-44 rounded-full',
              'flex items-center justify-center',
              'shadow-2xl transform active:scale-95',
              'backdrop-blur-sm border-2',
              'transition-all duration-250 ease-out', // Consistent timing
              isActive 
                ? isPaused
                  ? 'bg-gradient-to-br from-amber-500/90 to-amber-700/90 shadow-amber-500/50 border-amber-400/50' 
                  : 'bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5 shadow-neon-cyan/50 border-neon-cyan/50' 
                : 'bg-gradient-to-br from-primary/90 to-primary/70 shadow-primary/50 border-primary/50',
              !user && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Radar Scanner Background when active on cellular */}
            {isActive && isCellular && (
              <div className="absolute inset-2">
                <RadarScanner 
                  isActive={true} 
                  isPaused={isPaused}
                  signalStrength={signalStrength}
                  className="w-full h-full"
                />
              </div>
            )}

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
          {/* Daily Progress Ring */}
          {isActive && (
            <Card className="bg-background/60 border-border/50 backdrop-blur-xl animate-fade-in">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CircularProgress 
                    value={dailyProgress} 
                    size={60} 
                    strokeWidth={6}
                  >
                    <Zap className="w-5 h-5 text-neon-cyan" />
                  </CircularProgress>
                  <div>
                    <div className="text-xs text-muted-foreground font-mono">DAILY GOAL</div>
                    <div 
                      className="text-lg font-bold text-foreground"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                    >
                      {dailyProgress.toFixed(0)}% Complete
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-mono">SIGNAL</div>
                  <div className="flex items-center gap-1 justify-end">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <div 
                        key={bar}
                        className={cn(
                          'w-1 rounded-full transition-all duration-300',
                          bar <= Math.ceil(signalStrength / 20) 
                            ? 'bg-neon-cyan shadow-glow-sm' 
                            : 'bg-border'
                        )}
                        style={{ height: `${bar * 4 + 4}px` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Stats with Animated Counters */}
          <Card className="bg-background/60 border-border/50 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="group">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-neon-cyan group-hover:animate-bounce transition-transform" />
                  <AnimatedCounter 
                    value={stats.pointsEarned}
                    decimals={1}
                    className="text-xl font-bold text-foreground block"
                    onMilestone={handleMilestone}
                    milestoneThreshold={25}
                  />
                  <div className="text-xs text-muted-foreground font-mono">POINTS</div>
                </div>
                <div className="group">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500 group-hover:animate-spin-slow transition-transform" />
                  <AnimatedCounter 
                    value={stats.timePoints}
                    decimals={1}
                    className="text-xl font-bold text-foreground block"
                  />
                  <div className="text-xs text-muted-foreground font-mono">TIME</div>
                </div>
                <div className="group">
                  <Route className="w-5 h-5 mx-auto mb-1 text-primary group-hover:scale-110 transition-transform" />
                  <AnimatedCounter 
                    value={stats.distancePoints}
                    decimals={1}
                    className="text-xl font-bold text-foreground block"
                  />
                  <div className="text-xs text-muted-foreground font-mono">DIST</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-background/60 border-border/50 backdrop-blur-xl group hover:border-neon-cyan/30 transition-colors">
              <CardContent className="p-3 text-center">
                <Signal className={cn(
                  'w-5 h-5 mx-auto mb-1 transition-transform group-hover:scale-110',
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
            
            <Card className="bg-background/60 border-border/50 backdrop-blur-xl group hover:border-primary/30 transition-colors">
              <CardContent className="p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary transition-transform group-hover:scale-110" />
                <div 
                  className="text-sm font-medium text-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {formatDuration(stats.duration)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">DURATION</div>
              </CardContent>
            </Card>
            
            <Card className="bg-background/60 border-border/50 backdrop-blur-xl group hover:border-neon-cyan/30 transition-colors">
              <CardContent className="p-3 text-center">
                <MapPin className="w-5 h-5 mx-auto mb-1 text-neon-cyan transition-transform group-hover:scale-110" />
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

          {/* Data Points Counter with animated sync indicator */}
          <Card className="bg-background/60 border-border/50 backdrop-blur-xl">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Cloud className={cn(
                    'w-5 h-5 text-neon-cyan',
                    offlineQueueCount === 0 && 'animate-pulse'
                  )} />
                ) : (
                  <CloudOff className="w-5 h-5 text-amber-500 animate-pulse" />
                )}
                <div>
                  <div 
                    className="text-sm font-medium text-foreground flex items-center gap-2"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                  >
                    <AnimatedCounter value={stats.dataPointsCount} decimals={0} />
                    <span>DATA POINTS</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    {offlineQueueCount > 0 ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {offlineQueueCount} PENDING
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                        SYNCED
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground font-mono">SPEED</div>
                <div 
                  className="text-sm font-medium text-foreground flex items-center gap-1"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  <AnimatedCounter value={stats.speedKmh} decimals={0} suffix=" KM/H" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offline indicator */}
          {!isOnline && (
            <Alert className="border-amber-500/50 bg-amber-500/10 backdrop-blur-sm animate-fade-in">
              <CloudOff className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200/80 font-mono text-xs">
                OFFLINE - Data will sync when connected
              </AlertDescription>
            </Alert>
          )}

          {/* Geo Error */}
          {geoError && (
            <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm animate-fade-in">
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
