import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Download, Upload, Clock, Award, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { runSpeedTest, SpeedTestResult } from '@/utils/speedTestProviders';
import { supabase } from '@/integrations/supabase/client';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from 'sonner';

const DAILY_TEST_LIMIT = 3;
const POINTS_PER_TEST = 5;

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
  const { success: triggerSuccess, mediumTap } = useHaptics();

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
    if (!userId) return;

    try {
      // Save speed test result
      const { error: insertError } = await supabase
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
        });

      if (insertError) {
        console.error('[SpeedTest] Failed to save result:', insertError);
        return;
      }

      // Award bonus points only if under daily limit
      if (dailyTestCount < DAILY_TEST_LIMIT && (testResult.down !== null || testResult.latency !== null)) {
        const { data: existingPoints, error: fetchError } = await supabase
          .from('user_points')
          .select('total_points, pending_points')
          .eq('user_id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[SpeedTest] Failed to fetch points:', fetchError);
        } else {
          const currentPoints = existingPoints?.total_points || 0;
          const pendingPoints = existingPoints?.pending_points || 0;

          const { error: upsertError } = await supabase
            .from('user_points')
            .upsert({
              user_id: userId,
              total_points: currentPoints + POINTS_PER_TEST,
              pending_points: pendingPoints,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

          if (!upsertError) {
            triggerSuccess();
            onPointsEarned?.(POINTS_PER_TEST);
            toast.success(`+${POINTS_PER_TEST} points earned!`, {
              description: 'Thanks for testing network speed'
            });
          }
        }
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
            {Math.min(dailyTestCount, DAILY_TEST_LIMIT)}/{DAILY_TEST_LIMIT} rewarded today
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
                    +{POINTS_PER_TEST} pts earned
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
                        ? <>Test your network speed and earn <span className="text-primary font-semibold">{POINTS_PER_TEST} points</span></>
                        : 'Test your network speed (no reward available)'
                      }
                    </p>
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={runTest}
                    disabled={isRunning}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Start Speed Test
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-background/20 text-xs font-medium">
                      {Math.min(dailyTestCount, DAILY_TEST_LIMIT)}/{DAILY_TEST_LIMIT}
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
