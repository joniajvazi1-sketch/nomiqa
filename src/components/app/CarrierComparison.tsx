import React, { useState, useEffect } from 'react';
import { Signal, Wifi, Users, TrendingUp, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CarrierStats {
  carrier_name: string;
  avg_signal: number;
  data_points: number;
  network_breakdown: Record<string, number>;
  coverage_score: number;
  best_network_type: string;
}

interface CarrierComparisonProps {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export const CarrierComparison: React.FC<CarrierComparisonProps> = ({
  latitude,
  longitude,
  radiusKm = 10
}) => {
  const [carriers, setCarriers] = useState<CarrierStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { selectionTap } = useEnhancedHaptics();

  useEffect(() => {
    fetchCarrierData();
  }, [latitude, longitude]);

  const fetchCarrierData = async () => {
    try {
      setLoading(true);
      
      // Build query - if location provided, filter by approximate area
      let query = supabase
        .from('signal_logs')
        .select('carrier_name, rsrp, network_type')
        .not('carrier_name', 'is', null)
        .not('rsrp', 'is', null);

      // If we have location, filter to nearby area (rough bounding box)
      if (latitude && longitude) {
        const latDelta = radiusKm / 111; // ~111km per degree latitude
        const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
        
        query = query
          .gte('latitude', latitude - latDelta)
          .lte('latitude', latitude + latDelta)
          .gte('longitude', longitude - lonDelta)
          .lte('longitude', longitude + lonDelta);
      }

      // Get recent data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await query
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .limit(1000);

      if (error) throw error;

      // Aggregate by carrier
      const carrierMap = new Map<string, {
        signals: number[];
        networkTypes: Record<string, number>;
      }>();

      data?.forEach((log) => {
        const carrier = log.carrier_name?.trim() || 'Unknown';
        if (carrier === 'Unknown' || carrier.length < 2) return;

        if (!carrierMap.has(carrier)) {
          carrierMap.set(carrier, { signals: [], networkTypes: {} });
        }

        const carrierData = carrierMap.get(carrier)!;
        if (log.rsrp) carrierData.signals.push(log.rsrp);
        
        const networkType = log.network_type || 'Unknown';
        carrierData.networkTypes[networkType] = (carrierData.networkTypes[networkType] || 0) + 1;
      });

      // Convert to stats array
      const stats: CarrierStats[] = [];
      
      carrierMap.forEach((data, carrier) => {
        if (data.signals.length < 3) return; // Minimum data threshold
        
        const avgSignal = data.signals.reduce((a, b) => a + b, 0) / data.signals.length;
        
        // Find best network type
        let bestNetwork = 'Unknown';
        let maxCount = 0;
        Object.entries(data.networkTypes).forEach(([type, count]) => {
          if (count > maxCount) {
            maxCount = count;
            bestNetwork = type;
          }
        });

        // Calculate coverage score (0-100)
        // Based on signal strength and network type quality
        const signalScore = Math.max(0, Math.min(100, ((avgSignal + 140) / 80) * 100));
        const networkBonus = bestNetwork.includes('5G') ? 15 : 
                            bestNetwork.includes('LTE') || bestNetwork.includes('4G') ? 10 : 0;
        const coverageScore = Math.min(100, signalScore + networkBonus);

        stats.push({
          carrier_name: carrier,
          avg_signal: Math.round(avgSignal),
          data_points: data.signals.length,
          network_breakdown: data.networkTypes,
          coverage_score: Math.round(coverageScore),
          best_network_type: bestNetwork
        });
      });

      // Sort by coverage score
      stats.sort((a, b) => b.coverage_score - a.coverage_score);
      
      setCarriers(stats.slice(0, 6)); // Top 6 carriers
    } catch (error) {
      console.error('Error fetching carrier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSignalQuality = (rsrp: number): { label: string; color: string } => {
    if (rsrp >= -80) return { label: 'Excellent', color: 'text-green-500' };
    if (rsrp >= -90) return { label: 'Good', color: 'text-emerald-500' };
    if (rsrp >= -100) return { label: 'Fair', color: 'text-amber-500' };
    if (rsrp >= -110) return { label: 'Weak', color: 'text-orange-500' };
    return { label: 'Poor', color: 'text-red-500' };
  };

  const getNetworkBadgeColor = (networkType: string): string => {
    if (networkType.includes('5G')) return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    if (networkType.includes('LTE') || networkType.includes('4G')) return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    if (networkType.includes('3G')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-2 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (carriers.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Signal className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Carrier Comparison</h3>
          </div>
          <div className="text-center py-6">
            <Signal className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Not enough data in this area yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Contribute to help build coverage insights!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedCarriers = expanded ? carriers : carriers.slice(0, 3);
  const topCarrier = carriers[0];

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Signal className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Carrier Comparison</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                <p className="text-xs">
                  Based on {carriers.reduce((sum, c) => sum + c.data_points, 0).toLocaleString()} community data points from the last 30 days
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Top Carrier Highlight */}
        {topCarrier && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{topCarrier.carrier_name}</p>
                  <p className="text-xs text-muted-foreground">Best coverage in your area</p>
                </div>
              </div>
              <Badge className={cn('text-xs', getNetworkBadgeColor(topCarrier.best_network_type))}>
                {topCarrier.best_network_type}
              </Badge>
            </div>
          </div>
        )}

        {/* Carrier List */}
        <div className="space-y-3">
          {displayedCarriers.map((carrier, index) => {
            const quality = getSignalQuality(carrier.avg_signal);
            
            return (
              <div 
                key={carrier.carrier_name}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  index === 0 && "bg-muted/30"
                )}
              >
                {/* Rank */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>

                {/* Carrier Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {carrier.carrier_name}
                    </p>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getNetworkBadgeColor(carrier.best_network_type))}>
                      {carrier.best_network_type.replace('NR', '5G')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-xs font-medium', quality.color)}>
                      {quality.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {carrier.avg_signal} dBm
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      • {carrier.data_points.toLocaleString()} pts
                    </span>
                  </div>
                </div>

                {/* Coverage Score Bar */}
                <div className="w-16">
                  <Progress 
                    value={carrier.coverage_score} 
                    className="h-2"
                  />
                  <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                    {carrier.coverage_score}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand/Collapse */}
        {carriers.length > 3 && (
          <button
            onClick={() => {
              selectionTap();
              setExpanded(!expanded);
            }}
            className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Show {carriers.length - 3} more <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}

        {/* Data Source Note */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>Powered by community contributions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarrierComparison;
