import React from 'react';
import { cn } from '@/lib/utils';

interface SignalQualityDialProps {
  signalStrength: number; // 0-100
  downloadSpeed?: number; // Mbps
  uploadSpeed?: number; // Mbps
  latency?: number; // ms
  isActive: boolean;
  className?: string;
}

/**
 * Premium signal quality dial with animated metrics
 * Center piece of the scanning screen
 */
export const SignalQualityDial: React.FC<SignalQualityDialProps> = ({
  signalStrength,
  downloadSpeed = 0,
  uploadSpeed = 0,
  latency = 0,
  isActive,
  className
}) => {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (signalStrength / 100) * circumference;

  // Determine quality color based on signal strength
  const getQualityColor = () => {
    if (signalStrength >= 80) return 'hsl(var(--neon-cyan))';
    if (signalStrength >= 60) return 'hsl(142 76% 46%)'; // green
    if (signalStrength >= 40) return 'hsl(48 96% 53%)'; // yellow
    return 'hsl(0 84% 60%)'; // red
  };

  const qualityColor = getQualityColor();
  const qualityLabel = signalStrength >= 80 ? 'Excellent' : signalStrength >= 60 ? 'Good' : signalStrength >= 40 ? 'Fair' : 'Poor';

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Outer glow ring when active */}
      {isActive && (
        <div 
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${qualityColor} 0%, transparent 70%)`,
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      )}

      {/* Main dial SVG */}
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={qualityColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isActive ? strokeDashoffset : circumference}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: isActive ? `drop-shadow(0 0 8px ${qualityColor})` : 'none'
          }}
        />

        {/* Tick marks */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const innerRadius = radius - strokeWidth - 8;
          const outerRadius = radius - strokeWidth - 4;
          const x1 = size / 2 + innerRadius * Math.cos(angle);
          const y1 = size / 2 + innerRadius * Math.sin(angle);
          const x2 = size / 2 + outerRadius * Math.cos(angle);
          const y2 = size / 2 + outerRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              opacity={0.3}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isActive ? (
          <>
            {/* Signal percentage */}
            <div 
              className="text-4xl font-bold text-foreground mb-1"
              style={{ 
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                color: qualityColor
              }}
            >
              {signalStrength}%
            </div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
              {qualityLabel}
            </div>
            
            {/* Metrics row */}
            <div className="flex items-center gap-4 text-center">
              <div>
                <div 
                  className="text-sm font-bold text-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {downloadSpeed.toFixed(0)}
                </div>
                <div className="text-[10px] text-muted-foreground">↓ Mbps</div>
              </div>
              <div className="w-px h-6 bg-border/50" />
              <div>
                <div 
                  className="text-sm font-bold text-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {uploadSpeed.toFixed(0)}
                </div>
                <div className="text-[10px] text-muted-foreground">↑ Mbps</div>
              </div>
              <div className="w-px h-6 bg-border/50" />
              <div>
                <div 
                  className="text-sm font-bold text-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {latency.toFixed(0)}
                </div>
                <div className="text-[10px] text-muted-foreground">ms</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-muted-foreground text-sm mb-1">Tap to scan</div>
            <div className="text-muted-foreground/60 text-xs">Signal quality</div>
          </div>
        )}
      </div>
    </div>
  );
};
