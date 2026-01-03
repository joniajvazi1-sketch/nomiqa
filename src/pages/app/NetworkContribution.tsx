import React, { useState, useCallback, useRef } from 'react';
import { 
  Signal, 
  Pause,
  AlertTriangle,
  Wifi,
  CloudOff,
  Radio,
  Activity,
  Zap,
  Timer,
  Gauge
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { usePlatform } from '@/hooks/usePlatform';
import { useHaptics } from '@/hooks/useHaptics';
import { ContributionMap } from '@/components/app/ContributionMap';
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { SignalQualityDial } from '@/components/app/SignalQualityDial';
import { cn } from '@/lib/utils';

/**
 * Network Contribution Page - Premium Scanning Experience
 * 
 * Phase A2 Redesign:
 * - Top status capsule showing connection type
 * - Center quality dial with signal metrics
 * - Quick vs Full speed test buttons
 */
export const NetworkContribution: React.FC = () => {
  const { isAndroid } = usePlatform();
  const { error: errorHaptic, mediumTap, success } = useHaptics();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [celebrationType, setCelebrationType] = useState<'milestone' | 'session-end'>('milestone');
  const [speedTestRunning, setSpeedTestRunning] = useState<'quick' | 'full' | null>(null);
  const [dailyFullTests, setDailyFullTests] = useState(0);
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
    formatDuration
  } = useNetworkContribution();

  const isActive = session.status === 'active';
  
  // Convert lastPosition to [lat, lng] tuple for map
  const userPosition: [number, number] | null = lastPosition 
    ? [lastPosition.coords.latitude, lastPosition.coords.longitude]
    : null;

  // Signal strength simulation based on connection type
  const connStr = String(connectionType).toLowerCase();
  const signalStrength = connStr.includes('5g') ? 95 : connStr.includes('4g') || connStr.includes('lte') ? 80 : connStr.includes('3g') ? 60 : 40;

  // Mock speed metrics (would come from actual speed test in production)
  const downloadSpeed = isActive ? (signalStrength * 0.8 + Math.random() * 20) : 0;
  const uploadSpeed = isActive ? (signalStrength * 0.3 + Math.random() * 10) : 0;
  const latency = isActive ? Math.max(10, 100 - signalStrength + Math.random() * 20) : 0;

  // Handle session end celebration
  const handleStopContribution = useCallback(() => {
    if (stats.pointsEarned > 0) {
      setCelebrationPoints(stats.pointsEarned);
      setCelebrationType('session-end');
      setShowCelebration(true);
    }
    stopContribution();
  }, [stats.pointsEarned, stopContribution]);

  // Handle speed test
  const handleSpeedTest = useCallback((type: 'quick' | 'full') => {
    if (type === 'full' && dailyFullTests >= 3) {
      errorHaptic();
      return;
    }
    
    mediumTap();
    setSpeedTestRunning(type);
    
    // Simulate speed test duration
    const duration = type === 'quick' ? 3000 : 8000;
    const points = type === 'quick' ? 5 : 20;
    
    setTimeout(() => {
      setSpeedTestRunning(null);
      if (type === 'full') {
        setDailyFullTests(prev => prev + 1);
      }
      // Award points
      setCelebrationPoints(points);
      setCelebrationType('milestone');
      setShowCelebration(true);
      success();
    }, duration);
  }, [dailyFullTests, errorHaptic, mediumTap, success]);

  // Get connection label
  const getConnectionLabel = () => {
    if (!isOnline) return 'Offline';
    const type = connStr;
    if (type.includes('5g')) return '5G';
    if (type.includes('4g') || type.includes('lte')) return 'LTE';
    if (type.includes('3g')) return '3G';
    if (type.includes('wifi')) return 'WiFi';
    return 'Cellular';
  };

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
        className="relative z-10 px-4 py-4 flex flex-col min-h-screen"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 1rem)'
        }}
      >
        {/* TOP STATUS CAPSULE */}
        <div className="flex items-center justify-center mb-4">
          <div className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl border transition-all',
            isActive && isCellular 
              ? 'bg-neon-cyan/10 border-neon-cyan/30' 
              : isActive && !isCellular
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-white/5 border-white/10'
          )}>
            {/* Status indicator */}
            <div className={cn(
              'w-2.5 h-2.5 rounded-full',
              isActive && isCellular 
                ? 'bg-neon-cyan animate-pulse shadow-lg shadow-neon-cyan/50' 
                : isActive && !isCellular
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-muted-foreground'
            )} />
            
            {/* Connection type */}
            <span 
              className={cn(
                'text-sm font-semibold',
                isActive && isCellular ? 'text-neon-cyan' : isActive ? 'text-amber-400' : 'text-foreground'
              )}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
            >
              {getConnectionLabel()}
            </span>
            
            {/* Signal bars */}
            <div className="flex items-end gap-0.5 h-4">
              {[1, 2, 3, 4].map((bar) => (
                <div 
                  key={bar}
                  className={cn(
                    'w-1 rounded-full transition-all duration-300',
                    bar <= Math.ceil(signalStrength / 25) 
                      ? isActive && isCellular ? 'bg-neon-cyan' : 'bg-muted-foreground' 
                      : 'bg-border/50'
                  )}
                  style={{ height: `${bar * 3 + 4}px` }}
                />
              ))}
            </div>
            
            {/* Duration when active */}
            {isActive && (
              <>
                <div className="w-px h-4 bg-border/30" />
                <span 
                  className="text-xs text-muted-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {formatDuration(stats.duration)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Alerts section - compact */}
        <div className="space-y-2 mb-4">
          {/* WiFi Warning */}
          {isActive && !isCellular && (
            <Alert className="border-amber-500/50 bg-amber-500/20 backdrop-blur-xl py-2 animate-fade-in">
              <Wifi className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                Switch to cellular to continue earning
              </AlertDescription>
            </Alert>
          )}

          {/* Permission Error */}
          {hasPermission === false && (
            <Alert className="border-red-500/50 bg-red-500/20 backdrop-blur-xl py-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200 text-sm">
                Location permission required
              </AlertDescription>
            </Alert>
          )}

          {/* Offline */}
          {!isOnline && (
            <Alert className="border-amber-500/50 bg-amber-500/20 backdrop-blur-xl py-2">
              <CloudOff className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                Offline • {offlineQueueCount} points queued
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* CENTER: Quality Dial + Main Control */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {/* Signal Quality Dial */}
          <SignalQualityDial
            signalStrength={signalStrength}
            downloadSpeed={downloadSpeed}
            uploadSpeed={uploadSpeed}
            latency={latency}
            isActive={isActive && isCellular}
          />

          {/* Main Start/Stop Button */}
          <button
            ref={startButtonRef}
            onClick={() => {
              if (!isActive && hasPermission === false) {
                errorHaptic();
                startButtonRef.current?.classList.add('animate-error-shake');
                setTimeout(() => startButtonRef.current?.classList.remove('animate-error-shake'), 400);
                return;
              }
              mediumTap();
              isActive ? handleStopContribution() : startContribution();
            }}
            disabled={!user}
            className={cn(
              'relative w-20 h-20 rounded-full',
              'flex items-center justify-center',
              'shadow-xl transform active:scale-95',
              'backdrop-blur-xl border-2',
              'transition-all duration-200',
              isActive 
                ? isPaused
                  ? 'bg-amber-500/20 border-amber-400/50 shadow-amber-500/30' 
                  : 'bg-neon-cyan/20 border-neon-cyan/50 shadow-neon-cyan/30' 
                : 'bg-primary/20 border-primary/50 shadow-primary/30',
              !user && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Pulse rings when idle */}
            {!isActive && user && (
              <>
                <span 
                  className="absolute inset-0 rounded-full border border-primary/40"
                  style={{ animation: 'sonar-ping 2s ease-out infinite' }}
                />
                <span 
                  className="absolute inset-0 rounded-full border border-primary/20"
                  style={{ animation: 'sonar-ping 2s ease-out infinite 0.5s' }}
                />
              </>
            )}
            
            <div className="relative z-10 text-center">
              {isActive ? (
                isPaused ? (
                  <Wifi className="w-8 h-8 text-amber-400" />
                ) : (
                  <Pause className="w-8 h-8 text-neon-cyan" />
                )
              ) : (
                <Radio className="w-8 h-8 text-primary" />
              )}
            </div>
          </button>

          {/* Button label */}
          <div className="text-center">
            <div 
              className={cn(
                'text-sm font-semibold',
                isActive && isCellular ? 'text-neon-cyan' : isActive ? 'text-amber-400' : 'text-muted-foreground'
              )}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
            >
              {isActive ? (isPaused ? 'PAUSED' : 'SCANNING') : 'START SCAN'}
            </div>
            {!user && (
              <div className="text-xs text-muted-foreground mt-1">Sign in required</div>
            )}
          </div>
        </div>

        {/* BOTTOM: Speed Test Buttons + Points */}
        <div className="space-y-3 mt-auto">
          {/* Current session points */}
          {isActive && (
            <div className="flex items-center justify-center gap-2 py-2 animate-fade-in">
              <Zap className="w-4 h-4 text-neon-cyan" />
              <span 
                className="text-lg font-bold text-foreground"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
              >
                +{stats.pointsEarned.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">pts this session</span>
            </div>
          )}

          {/* Speed Test Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quick Test */}
            <button
              onClick={() => handleSpeedTest('quick')}
              disabled={!isActive || !isCellular || speedTestRunning !== null}
              className={cn(
                'relative rounded-2xl p-4 backdrop-blur-xl border transition-all active:scale-[0.98]',
                isActive && isCellular && !speedTestRunning
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-white/3 border-white/5 opacity-50 cursor-not-allowed'
              )}
            >
              {speedTestRunning === 'quick' && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div 
                    className="h-full bg-neon-cyan/20"
                    style={{ animation: 'fill-progress 3s linear forwards' }}
                  />
                </div>
              )}
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold text-foreground">Quick Test</div>
                  <div className="text-xs text-muted-foreground">~25 MB • +5 pts</div>
                </div>
              </div>
            </button>

            {/* Full Test */}
            <button
              onClick={() => handleSpeedTest('full')}
              disabled={!isActive || !isCellular || speedTestRunning !== null || dailyFullTests >= 3}
              className={cn(
                'relative rounded-2xl p-4 backdrop-blur-xl border transition-all active:scale-[0.98]',
                isActive && isCellular && !speedTestRunning && dailyFullTests < 3
                  ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                  : 'bg-white/3 border-white/5 opacity-50 cursor-not-allowed'
              )}
            >
              {speedTestRunning === 'full' && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div 
                    className="h-full bg-primary/20"
                    style={{ animation: 'fill-progress 8s linear forwards' }}
                  />
                </div>
              )}
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold text-foreground">Full Test</div>
                  <div className="text-xs text-muted-foreground">
                    ~80 MB • +20 pts • {3 - dailyFullTests}/3
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Data points synced indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            <Activity className={cn(
              'w-3.5 h-3.5',
              isOnline ? 'text-neon-cyan' : 'text-amber-500'
            )} />
            <span className="text-xs text-muted-foreground">
              {stats.dataPointsCount} data points • {isOnline ? 'Synced' : `${offlineQueueCount} pending`}
            </span>
          </div>
        </div>

        {/* Geo Error */}
        {geoError && (
          <Alert className="border-red-500/50 bg-red-500/20 backdrop-blur-xl py-2 mt-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200 text-xs">{geoError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes sonar-ping {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes fill-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
