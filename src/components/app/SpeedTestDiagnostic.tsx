import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, Clock, Download, Upload, Activity } from 'lucide-react';
import { runSpeedTest, SpeedTestResult, SPEED_TEST_PROVIDERS } from '@/utils/speedTestProviders';
import { cn } from '@/lib/utils';

interface DiagnosticResult {
  timestamp: Date;
  result: SpeedTestResult;
}

export const SpeedTestDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<DiagnosticResult[]>([]);
  const [currentResult, setCurrentResult] = useState<SpeedTestResult | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const result = await runSpeedTest();
      setCurrentResult(result);
      setHistory(prev => [{ timestamp: new Date(), result }, ...prev].slice(0, 10));
    } finally {
      setIsRunning(false);
    }
  };

  const successRate = history.length > 0 
    ? Math.round((history.filter(h => h.result.latency !== null).length / history.length) * 100)
    : 0;

  const downloadSuccessRate = history.length > 0
    ? Math.round((history.filter(h => h.result.down !== null).length / history.length) * 100)
    : 0;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Speed Test Diagnostic
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={runDiagnostic}
            disabled={isRunning}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRunning && "animate-spin")} />
            {isRunning ? 'Testing...' : 'Run Test'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Info */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Active Providers</p>
          <div className="flex flex-wrap gap-2">
            {SPEED_TEST_PROVIDERS.map((provider, idx) => (
              <Badge 
                key={provider.provider} 
                variant={idx === 0 ? "default" : "secondary"}
                className="text-xs"
              >
                {idx === 0 ? '✓ Primary: ' : 'Fallback: '}{provider.provider}
              </Badge>
            ))}
          </div>
        </div>

        {/* Success Rates */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Latency Success</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                successRate >= 80 ? "text-green-500" : successRate >= 50 ? "text-yellow-500" : "text-red-500"
              )}>
                {successRate}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Download Success</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                downloadSuccessRate >= 80 ? "text-green-500" : downloadSuccessRate >= 50 ? "text-yellow-500" : "text-red-500"
              )}>
                {downloadSuccessRate}%
              </p>
            </div>
          </div>
        )}

        {/* Current Result */}
        {currentResult && (
          <div className="p-3 rounded-lg border border-border space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Latest Result</p>
              <Badge variant="outline" className="text-xs">
                {currentResult.provider}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">Latency</span>
                </div>
                <p className="text-sm font-semibold">
                  {currentResult.latency !== null ? `${currentResult.latency}ms` : '—'}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Download className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">Down</span>
                </div>
                <p className="text-sm font-semibold">
                  {currentResult.down !== null ? `${currentResult.down.toFixed(1)} Mbps` : '—'}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Upload className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">Up</span>
                </div>
                <p className="text-sm font-semibold">
                  {currentResult.up !== null ? `${currentResult.up.toFixed(1)} Mbps` : '—'}
                </p>
              </div>
            </div>

            {/* Errors */}
            {(currentResult.latencyError || currentResult.downloadError || currentResult.uploadError) && (
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Errors Encountered
                </p>
                {currentResult.latencyError && (
                  <p className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                    <span className="font-medium">Latency:</span> {currentResult.latencyError}
                  </p>
                )}
                {currentResult.downloadError && (
                  <p className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                    <span className="font-medium">Download:</span> {currentResult.downloadError}
                  </p>
                )}
                {currentResult.uploadError && (
                  <p className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                    <span className="font-medium">Upload:</span> {currentResult.uploadError}
                  </p>
                )}
              </div>
            )}

            {/* All Success */}
            {!currentResult.latencyError && !currentResult.downloadError && currentResult.latency !== null && (
              <div className="flex items-center gap-2 text-green-500 text-xs pt-2 border-t border-border/50">
                <CheckCircle className="h-4 w-4" />
                All tests completed successfully
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recent Tests ({history.length})</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {history.slice(1).map((h, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">
                    {h.timestamp.toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {h.result.provider}
                    </Badge>
                    {h.result.latency !== null ? (
                      <span className="text-green-500 flex items-center gap-0.5">
                        <Wifi className="h-3 w-3" />
                        {h.result.latency}ms
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-0.5">
                        <WifiOff className="h-3 w-3" />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && !currentResult && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Run a test to see diagnostic results
          </p>
        )}
      </CardContent>
    </Card>
  );
};
