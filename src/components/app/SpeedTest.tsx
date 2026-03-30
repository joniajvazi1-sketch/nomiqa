import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Download, Upload, Clock, Award, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { runSpeedTest, SpeedTestResult } from '@/utils/speedTestProviders';
import { supabase } from '@/integrations/supabase/client';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from 'sonner';
import { getAppVersion } from '@/lib/sentry';
import { meetsMinVersion } from '@/utils/versionCompare';

const DAILY_TEST_LIMIT = 3;
const POINTS_CELLULAR = 25;
const POINTS_WIFI = 10;

interface SpeedTestProps {
  onPointsEarned?: (points: number) => void;
  latitude?: number;
  longitude?: number;
  networkType?: string;
  carrier?: string;
}

export function SpeedTest({ 
  onPointsEarned, 
  latitude, 
  longitude, 
  networkType,
  carrier 
}: SpeedTestProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [dailyTestCount, setDailyTestCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'latency' | 'download' | 'upload' | 'complete'>('idle');
  const [versionOk, setVersionOk] = useState(true);
  const { success: triggerSuccess, mediumTap } = useHaptics();

  // Check min app version for points eligibility
  useEffect(() => {
    supabase.from('app_remote_config').select('config_value').eq('config_key', 'min_app_version').eq('is_sensitive', false).maybeSingle().then(({ data }) => {
      if (data?.config_value) {
        const minVer = typeof data.config_value === 'string' ? data.config_value : String(data.config_value);
        setVersionOk(meetsMinVersion(getAppVersion(), minVer));
      }
    });
  }, []);

  // Fetch user and daily test count
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Get daily test count
        const { data, error } = await supabase.rpc('get_user_daily_speed_tests', {
          p_user_id: user.id
        });
        
        if (!error && data !== null) {
          setDailyTestCount(data);
        }
      }
    };
    
    fetchUserData();
  }, []);

  const rewardedTestsRemaining = Math.max(0, DAILY_TEST_LIMIT - dailyTestCount);
  const canEarnPoints = rewardedTestsRemaining > 0;

  const saveResult = useCallback(async (testResult: SpeedTestResult) => {
    if (!userId) {
      console.warn('[SpeedTest] Cannot save: user not authenticated');
      toast.error('Please sign in to save results', {
        description: 'Your test ran but results were not saved.'
      });
      return;
    }

    try {
      // Save speed test result with .select() for explicit error reporting
      const { data: insertData, error: insertError } = await supabase
        .from('speed_test_results')
        .insert({
          user_id: userId,
          download_mbps: testResult.down,
          upload_mbps: testResult.up,
          latency_ms: testResult.latency,
          latitude,
          longitude,
          network_type: networkType,
          carrier,
          provider: testResult.provider,
          error: testResult.downloadError || testResult.uploadError || testResult.latencyError
        })
        .select();

      if (insertError) {
        console.error('[SpeedTest] Failed to save result:', insertError.message, insertError.details, insertError.hint);
        toast.error('Failed to save speed test', {
          description: insertError.message || 'Please try again'
        });
        return;
      }
      
      console.log('[SpeedTest] Result saved successfully:', insertData?.length, 'rows');
      
      // Dispatch event so SpeedTestHistory can refresh
      window.dispatchEvent(new CustomEvent('speed-test-saved'));

      // Award bonus points only if under daily limit — use server-side cap enforcement
      // Cellular tests earn 25 pts (2.5x) to incentivize real-world network data
      const isCellularTest = networkType && !['wifi', 'unknown', 'none'].includes(networkType.toLowerCase());
      const pointsForTest = isCellularTest ? POINTS_CELLULAR : POINTS_WIFI;
      
      if (versionOk && dailyTestCount < DAILY_TEST_LIMIT && (testResult.down !== null || testResult.latency !== null)) {
        // Use add_referral_points to bypass daily/monthly mining caps
        // Speed test rewards should always be granted (only lifetime cap enforced)
        const { data: pointsResult, error: rpcError } = await supabase.rpc('add_referral_points', {
          p_user_id: userId,
          p_points: pointsForTest,
          p_source: 'speed_test',
          p_app_version: getAppVersion(),
        } as any);

        if (rpcError) {
          console.error('[SpeedTest] Failed to award points via RPC:', rpcError);
        } else {
          const result = pointsResult as Record<string, unknown>;
          const actualPointsAdded = (result.points_added as number) || 0;
          const reason = result.reason as string | undefined;

          if (actualPointsAdded > 0) {
            triggerSuccess();
            onPointsEarned?.(actualPointsAdded);
            toast.success(`+${actualPointsAdded} points earned!`, {
              description: 'Thanks for testing network speed'
            });
          } else if (reason === 'daily_cap_reached') {
            toast.info('Daily earning limit reached', {
              description: 'Your speed test was saved but no points added today'
            });
          }
        }
      } else if (!versionOk) {
        toast.info('Update required to earn points', {
          description: 'Your speed test was saved. Please update the app.'
        });
      }

      // Update daily count
      setDailyTestCount(prev => prev + 1);
    } catch (err) {
      console.error('[SpeedTest] Error saving result:', err);
    }
  }, [userId, latitude, longitude, networkType, carrier, onPointsEarned, triggerSuccess]);

  const runTest = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResult(null);
    mediumTap();

    try {
      // Simulate phases for visual feedback
      setPhase('latency');
      await new Promise(r => setTimeout(r, 500));
      
      setPhase('download');
      await new Promise(r => setTimeout(r, 500));
      
      setPhase('upload');
      
      // Run actual speed test
      const testResult = await runSpeedTest(true, networkType);
      
      setPhase('complete');
      setResult(testResult);
      
      // Save to database and award points
      await saveResult(testResult);
      
      triggerSuccess();
    } catch (err) {
      console.error('[SpeedTest] Test failed:', err);
      setPhase('idle');
      toast.error('Speed test failed', {
        description: 'Please try again'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const resetTest = () => {
    setResult(null);
    setPhase('idle');
  };

  // Get the combined error message if any
  const getErrorMessage = (res: SpeedTestResult): string | null => {
    return res.downloadError || res.uploadError || res.latencyError || null;
  };

  return (
    <Card className="card-premium overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Speed Test
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {Math.min(dailyTestCount, DAILY_TEST_LIMIT)}/{DAILY_TEST_LIMIT} rewarded • {networkType && !['wifi', 'unknown', 'none'].includes(networkType.toLowerCase()) ? '📶 25' : '📡 10'} pts
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Test Results */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  icon={<Clock className="h-4 w-4" />}
                  label="Latency"
                  value={result.latency ? `${result.latency}` : '--'}
                  unit="ms"
                  color="text-blue-400"
                />
                <MetricCard
                  icon={<Download className="h-4 w-4" />}
                  label="Download"
                  value={result.down ? result.down.toFixed(1) : '--'}
                  unit="Mbps"
                  color="text-emerald-400"
                />
                <MetricCard
                  icon={<Upload className="h-4 w-4" />}
                  label="Upload"
                  value={result.up ? result.up.toFixed(1) : '--'}
                  unit="Mbps"
                  color="text-purple-400"
                />
              </div>

              {/* Provider & Points */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  via {result.provider}
                </span>
                {canEarnPoints ? (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Award className="h-4 w-4" />
                    +{networkType && !['wifi', 'unknown', 'none'].includes(networkType.toLowerCase()) ? POINTS_CELLULAR : POINTS_WIFI} pts earned
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    No reward (daily limit reached)
                  </span>
                )}
              </div>

              {/* Error message if any */}
              {getErrorMessage(result) && (
                <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 rounded-lg p-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{getErrorMessage(result)}</span>
                </div>
              )}

              {/* Run Again Button */}
              <Button
                onClick={resetTest}
                variant="outline"
                className="w-full"
              >
                {canEarnPoints ? 'Test Again' : 'Test Again (No Reward)'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Running Animation */}
              {isRunning ? (
                <div className="py-8 space-y-4">
                  <div className="flex justify-center">
                    <motion.div
                      className="relative"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Wifi className="h-16 w-16 text-primary" />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                  
                  {/* Phase Indicator */}
                  <div className="flex justify-center gap-4 text-sm">
                    <PhaseIndicator 
                      label="Latency" 
                      isActive={phase === 'latency'} 
                      isComplete={['download', 'upload', 'complete'].includes(phase)}
                    />
                    <PhaseIndicator 
                      label="Download" 
                      isActive={phase === 'download'} 
                      isComplete={['upload', 'complete'].includes(phase)}
                    />
                    <PhaseIndicator 
                      label="Upload" 
                      isActive={phase === 'upload'} 
                      isComplete={phase === 'complete'}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Start Test UI */}
                  <div className="py-6 text-center">
                    <motion.div
                      className="inline-flex p-4 rounded-full bg-primary/10 mb-4"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Wifi className="h-12 w-12 text-primary" />
                    </motion.div>
                    <p className="text-muted-foreground text-sm">
                      {canEarnPoints 
                        ? <>Test your network speed and earn <span className="text-primary font-semibold">{networkType && !['wifi', 'unknown', 'none'].includes(networkType.toLowerCase()) ? `${POINTS_CELLULAR} points (cellular bonus!)` : `${POINTS_WIFI} points (${POINTS_CELLULAR} on cellular!)`}</span></>
                        : 'Test your network speed (no reward available)'
                      }
                    </p>
                  </div>

                  {/* Start Button */}
                   <Button
                    onClick={runTest}
                    disabled={isRunning}
                    className="w-full bg-primary hover:bg-primary/90 flex-col h-auto py-3"
                    size="lg"
                  >
                    <span className="flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Start Speed Test
                    </span>
                    <span className="text-[11px] font-medium opacity-80 mt-0.5">
                      {Math.min(dailyTestCount, DAILY_TEST_LIMIT)}/{DAILY_TEST_LIMIT} rewarded tests used today
                    </span>
                  </Button>

                  {!canEarnPoints && (
                    <p className="text-center text-xs text-muted-foreground">
                      Daily reward limit reached. Tests still contribute network data!
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  unit, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  unit: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card/50 rounded-xl p-3 text-center border border-border"
    >
      <div className={`flex justify-center mb-1 ${color}`}>
        {icon}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-bold text-lg">{value}</div>
      <div className="text-xs text-muted-foreground">{unit}</div>
    </motion.div>
  );
}

function PhaseIndicator({ 
  label, 
  isActive, 
  isComplete 
}: { 
  label: string; 
  isActive: boolean; 
  isComplete: boolean;
}) {
  return (
    <div className={`flex items-center gap-1 ${isActive ? 'text-primary' : isComplete ? 'text-emerald-400' : 'text-muted-foreground'}`}>
      {isComplete ? (
        <CheckCircle className="h-4 w-4" />
      ) : isActive ? (
        <motion.div
          className="h-2 w-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      ) : (
        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
      )}
      <span className="text-xs">{label}</span>
    </div>
  );
}

export default SpeedTest;
