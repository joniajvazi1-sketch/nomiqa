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
  Gauge,
  ArrowDown,
  ArrowUp,
  Loader2,
  Building2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { useContributionHeatmap } from '@/hooks/useContributionHeatmap';
import { useGlobalCoverage } from '@/hooks/useGlobalCoverage';
import { usePlatform } from '@/hooks/usePlatform';
import { useHaptics } from '@/hooks/useHaptics';
import { ContributionMap } from '@/components/app/ContributionMap';
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { SignalQualityDial } from '@/components/app/SignalQualityDial';
import { IndoorModeToggle, IndoorModeIndicator } from '@/components/app/IndoorModeToggle';
import { SpeedTestDiagnostic } from '@/components/app/SpeedTestDiagnostic';
import { cn } from '@/lib/utils';

type CoverageMode = 'personal' | 'global';

/**
 * Network Contribution Page - Premium Scanning Experience
 * 
 * Phase A2 Redesign + B2 Heatmap + Phase 5 Global Coverage:
 * - Top status capsule showing connection type
 * - Center quality dial with signal metrics
 * - Toggle between personal heatmap and global community coverage
 */
export const NetworkContribution: React.FC = () => {
  const { isAndroid } = usePlatform();
  const { error: errorHaptic, mediumTap, success } = useHaptics();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [celebrationType, setCelebrationType] = useState<'milestone' | 'session-end'>('milestone');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [indoorMode, setIndoorMode] = useState(false);
  const [coverageMode, setCoverageMode] = useState<CoverageMode>('personal');
  const startButtonRef = useRef<HTMLButtonElement>(null);
  
  // Network contribution hook
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
    isRunningSpeedTest,
    startContribution,
    stopContribution,
    formatDuration,
    triggerManualSpeedTest
  } = useNetworkContribution();

  // Heatmap data hook (personal)
  const { 
    points: heatmapPoints, 
    loading: heatmapLoading,
    totalDataPoints: heatmapTotalPoints,
    coverageAreaKm,
    refresh: refreshHeatmap
  } = useContributionHeatmap();

  // Global coverage hook
  const {
    data: globalCoverageData,
    loading: globalCoverageLoading,
    error: globalCoverageError,
    refresh: refreshGlobalCoverage,
    networkFilter,
    setNetworkFilter,
  } = useGlobalCoverage({
    autoRefresh: coverageMode === 'global',
    refreshInterval: 60000, // 1 minute
  });

  const isActive = session.status === 'active';
  
  // Convert lastPosition to [lat, lng] tuple for map
  const userPosition: [number, number] | null = lastPosition 
    ? [lastPosition.coords.latitude, lastPosition.coords.longitude]
    : null;

  // Signal strength simulation based on connection type
  const connStr = String(connectionType).toLowerCase();
  const signalStrength = connStr.includes('5g') ? 95 : connStr.includes('4g') || connStr.includes('lte') ? 80 : connStr.includes('3g') ? 60 : 40;

  // Indoor mode multiplier (1.5x)
  const indoorMultiplier = indoorMode ? 1.5 : 1;
  
  // GPS accuracy for auto-detecting indoor
  const gpsAccuracy = lastPosition?.coords?.accuracy;

  // Use real speed test data when available, otherwise estimate
  const downloadSpeed = stats.lastSpeedTest?.down ?? (isActive ? (signalStrength * 0.8 + Math.random() * 20) : 0);
  const uploadSpeed = stats.lastSpeedTest?.up ?? (isActive ? (signalStrength * 0.3 + Math.random() * 10) : 0);
  const latency = stats.lastSpeedTest?.latency ?? (isActive ? Math.max(10, 100 - signalStrength + Math.random() * 20) : 0);

  // Handle session end celebration
  const handleStopContribution = useCallback(() => {
    if (stats.pointsEarned > 0) {
      setCelebrationPoints(stats.pointsEarned);
      setCelebrationType('session-end');
      setShowCelebration(true);
    }
    stopContribution();
  }, [stats.pointsEarned, stopContribution]);

  // Handle manual speed test
  const handleSpeedTest = useCallback(async () => {
    if (!isActive || !isCellular || isRunningSpeedTest) {
      errorHaptic();
      return;
    }
    
    mediumTap();
    const result = await triggerManualSpeedTest();
    
    if (result) {
      // Show celebration for speed test completion
      const bonusPoints = result.down >= 50 ? 3 : 2;
      setCelebrationPoints(bonusPoints);
      setCelebrationType('milestone');
      setShowCelebration(true);
    }
  }, [isActive, isCellular, isRunningSpeedTest, errorHaptic, mediumTap, triggerManualSpeedTest]);

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

  // Toggle heatmap view (personal mode)
  const handleToggleHeatmap = useCallback(() => {
    mediumTap();
    setShowHeatmap(prev => !prev);
    if (!showHeatmap) {
      refreshHeatmap();
    }
  }, [showHeatmap, mediumTap, refreshHeatmap]);

  // Toggle coverage mode (personal <-> global)
  const handleToggleCoverageMode = useCallback(() => {
    mediumTap();
    setCoverageMode(prev => {
      const next = prev === 'personal' ? 'global' : 'personal';
      if (next === 'global') {
        refreshGlobalCoverage(true);
      }
      return next;
    });
  }, [mediumTap, refreshGlobalCoverage]);

  // Handle network filter change
  const handleNetworkFilterChange = useCallback((filter: '5g' | 'lte' | '3g' | null) => {
    mediumTap();
    setNetworkFilter(filter);
  }, [mediumTap, setNetworkFilter]);

  return (
    <div className="relative w-full h-full min-h-screen bg-background">
      {/* Full-screen dark map background */}
      <div className="absolute inset-0 z-0">
        <ContributionMap 
          userPosition={userPosition} 
          isActive={isActive && isCellular}
          heatmapPoints={heatmapPoints}
          showHeatmap={showHeatmap}
          onToggleHeatmap={handleToggleHeatmap}
          globalCoverage={globalCoverageData?.cells || []}
          coverageMode={coverageMode}
          onToggleCoverageMode={handleToggleCoverageMode}
          globalCoverageLoading={globalCoverageLoading}
          networkFilter={networkFilter}
          onNetworkFilterChange={handleNetworkFilterChange}
        />
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
        <div className="flex items-center justify-center gap-2 mb-4">
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
            
            {/* Indoor mode indicator */}
            {indoorMode && <IndoorModeIndicator isIndoor={true} />}
            
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
          {/* WiFi Warning - Enhanced with pulsing WiFi icon and breathing animation */}
          {isActive && !isCellular && (
            <div 
              className="rounded-2xl bg-amber-500/20 backdrop-blur-xl border border-amber-500/40 p-4 animate-fade-in"
              style={{ animation: 'breathing 3s ease-in-out infinite' }}
            >
              <div className="flex items-center gap-3">
                {/* Pulsing WiFi icon container */}
                <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                  {/* Pulsing rings behind icon */}
                  <div 
                    className="absolute inset-0 rounded-full bg-amber-500/20"
                    style={{ animation: 'wifi-icon-pulse 2s ease-in-out infinite' }}
                  />
                  <div 
                    className="absolute inset-1 rounded-full bg-amber-500/30"
                    style={{ animation: 'wifi-icon-pulse 2s ease-in-out infinite 0.3s' }}
                  />
                  <Wifi 
                    className="h-6 w-6 text-amber-400 relative z-10" 
                    style={{ animation: 'wifi-icon-bounce 1.5s ease-in-out infinite' }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-amber-200 mb-0.5">Mining Paused</div>
                  <div className="text-xs text-amber-300/80">
                    Switch to 5G/LTE to continue earning points
                  </div>
                </div>
                {/* Connecting dots indicator */}
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-amber-400/60 uppercase font-mono">WiFi</div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        className="w-1.5 h-1.5 rounded-full bg-amber-400"
                        style={{
                          animation: 'connecting-dots-small 1.4s ease-in-out infinite',
                          animationDelay: `${dot * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Paused points indicator */}
              {stats.pointsEarned > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                  <span className="text-xs text-amber-300/60">Session points (paused)</span>
                  <span className="text-sm font-mono text-amber-300">{stats.pointsEarned.toFixed(1)} pts</span>
                </div>
              )}
              
              {/* CSS for WiFi warning animations */}
              <style>{`
                @keyframes breathing {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.01); opacity: 0.95; }
                }
                @keyframes wifi-icon-pulse {
                  0%, 100% { transform: scale(1); opacity: 0.3; }
                  50% { transform: scale(1.3); opacity: 0; }
                }
                @keyframes wifi-icon-bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-2px); }
                }
                @keyframes connecting-dots-small {
                  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                  40% { opacity: 1; transform: scale(1.3); }
                }
              `}</style>
            </div>
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
          
          {/* Cellular Active Indicator - when mining normally */}
          {isActive && isCellular && (
            <div className="flex items-center justify-center gap-2 py-1.5 animate-fade-in">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20">
                <Signal className="w-3.5 h-3.5 text-neon-cyan" />
                <span className="text-xs font-medium text-neon-cyan">Cellular Active</span>
                <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              </div>
            </div>
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

        {/* BOTTOM: Indoor Mode + Speed Test + Stats */}
        <div className="space-y-3 mt-auto">
          {/* Indoor Mode Toggle */}
          {isActive && (
            <IndoorModeToggle
              isIndoor={indoorMode}
              onToggle={setIndoorMode}
              disabled={!isCellular}
              gpsAccuracy={gpsAccuracy}
            />
          )}

          {/* Current session points breakdown */}
          {isActive && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-3 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-cyan" />
                  <span className="text-sm font-semibold text-foreground">Session Points</span>
                  {indoorMode && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5" />
                      1.5x
                    </span>
                  )}
                </div>
                <span 
                  className="text-lg font-bold text-neon-cyan"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  +{(stats.pointsEarned * indoorMultiplier).toFixed(1)}
                </span>
              </div>
              
              {/* Points breakdown */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-mono text-foreground">+{(stats.timePoints * indoorMultiplier).toFixed(1)}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-white/5">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-mono text-foreground">+{(stats.distancePoints * indoorMultiplier).toFixed(1)}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <span className="text-neon-cyan/80">Speed Tests</span>
                  <span className="font-mono text-neon-cyan">+{(stats.speedTestPoints * indoorMultiplier).toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Speed Test Card - Real functionality */}
          <button
            onClick={handleSpeedTest}
            disabled={!isActive || !isCellular || isRunningSpeedTest}
            className={cn(
              'w-full relative rounded-2xl p-4 backdrop-blur-xl border transition-all active:scale-[0.98]',
              isActive && isCellular && !isRunningSpeedTest
                ? 'bg-gradient-to-r from-neon-cyan/10 to-primary/10 border-neon-cyan/30 hover:border-neon-cyan/50'
                : 'bg-white/3 border-white/5 opacity-50 cursor-not-allowed'
            )}
          >
            {/* Progress animation when testing */}
            {isRunningSpeedTest && (
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div 
                  className="h-full bg-neon-cyan/20"
                  style={{ animation: 'fill-progress 5s linear forwards' }}
                />
              </div>
            )}
            
            <div className="relative flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                isRunningSpeedTest ? 'bg-neon-cyan/20' : 'bg-neon-cyan/10'
              )}>
                {isRunningSpeedTest ? (
                  <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
                ) : (
                  <Gauge className="w-6 h-6 text-neon-cyan" />
                )}
              </div>
              
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-foreground">
                  {isRunningSpeedTest ? 'Testing...' : 'Run Speed Test'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isRunningSpeedTest 
                    ? 'Measuring network performance' 
                    : `+2-3.5 pts • ${stats.speedTestCount} tests this session`}
                </div>
              </div>
              
              {/* Last speed test results */}
              {stats.lastSpeedTest && !isRunningSpeedTest && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowDown className="w-3 h-3 text-neon-cyan" />
                    <span className="font-mono">{stats.lastSpeedTest.down}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUp className="w-3 h-3 text-primary" />
                    <span className="font-mono">{stats.lastSpeedTest.up}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Auto speed test info */}
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Auto runs every 10 min</span>
              {stats.lastSpeedTest && (
                <span className="text-muted-foreground font-mono">{stats.lastSpeedTest.latency}ms ping</span>
              )}
            </div>
          </button>

          {/* Speed Test Diagnostic - Shows provider, success rate, errors */}
          {isActive && <SpeedTestDiagnostic />}

          {/* Telco Data Collection Card - C3 Premium Data UI */}
          {isActive && (
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-black/40 to-neon-cyan/5 backdrop-blur-xl border border-primary/20 p-3 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Signal className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">Telco-Grade Data</span>
                <div className="ml-auto flex items-center gap-1">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    stats.signalLogsCount > 0 ? 'bg-neon-cyan animate-pulse' : 'bg-muted-foreground'
                  )} />
                  <span className="text-xs font-mono text-neon-cyan">{stats.signalLogsCount}</span>
                  <span className="text-xs text-muted-foreground">logs</span>
                </div>
              </div>
              
              {/* Metrics being collected */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5">
                  <span className="text-[10px] text-muted-foreground">Network</span>
                  <span className="text-[10px] font-mono text-foreground">{getConnectionLabel()}</span>
                </div>
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5">
                  <span className="text-[10px] text-muted-foreground">Signal</span>
                  <span className="text-[10px] font-mono text-foreground">{signalStrength}%</span>
                </div>
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5">
                  <span className="text-[10px] text-muted-foreground">GPS</span>
                  <span className="text-[10px] font-mono text-foreground">{lastPosition ? '✓' : '—'}</span>
                </div>
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-white/5">
                  <span className="text-[10px] text-muted-foreground">Speed</span>
                  <span className="text-[10px] font-mono text-foreground">{stats.lastSpeedTest ? '✓' : '—'}</span>
                </div>
              </div>
              
              <div className="mt-2 text-[10px] text-muted-foreground text-center">
                Logs every 100m or 5min • Carrier, RSRP, Cell ID tracked
              </div>
            </div>
          )}

          {/* Data points synced indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            <Activity className={cn(
              'w-3.5 h-3.5',
              isOnline ? 'text-neon-cyan' : 'text-amber-500'
            )} />
            <span className="text-xs text-muted-foreground">
              {stats.dataPointsCount} data points • {stats.signalLogsCount} telco logs • {isOnline ? 'Synced' : `${offlineQueueCount} pending`}
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
