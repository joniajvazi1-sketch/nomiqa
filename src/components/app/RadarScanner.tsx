import React from 'react';
import { cn } from '@/lib/utils';

interface RadarScannerProps {
  isActive: boolean;
  isPaused?: boolean;
  signalStrength?: number; // 0-100
  className?: string;
}

export const RadarScanner: React.FC<RadarScannerProps> = ({
  isActive,
  isPaused = false,
  signalStrength = 75,
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {/* Base radar circle */}
      <div className="relative w-full h-full rounded-full overflow-hidden">
        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[80%] h-[80%] rounded-full border border-neon-cyan/20" />
          <div className="absolute w-[60%] h-[60%] rounded-full border border-neon-cyan/30" />
          <div className="absolute w-[40%] h-[40%] rounded-full border border-neon-cyan/40" />
          <div className="absolute w-[20%] h-[20%] rounded-full border border-neon-cyan/50" />
        </div>

        {/* Radar sweep beam - Enhanced with trailing glow */}
        {isActive && !isPaused && (
          <>
            {/* Primary sweep */}
            <div 
              className="absolute inset-0 origin-center"
              style={{
                animation: 'radar-sweep 2s linear infinite'
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--neon-cyan) / 0.5) 20deg, hsl(var(--neon-cyan) / 0.3) 40deg, transparent 60deg)'
                }}
              />
            </div>
            {/* Secondary sweep trail */}
            <div 
              className="absolute inset-0 origin-center"
              style={{
                animation: 'radar-sweep 2s linear infinite',
                animationDelay: '-0.3s'
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left opacity-40"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--neon-cyan) / 0.3) 15deg, transparent 30deg)'
                }}
              />
            </div>
          </>
        )}

        {/* Signal dots - animated when active */}
        {isActive && !isPaused && (
          <>
            <div 
              className="absolute w-2 h-2 rounded-full bg-neon-cyan shadow-glow-sm"
              style={{ 
                top: '25%', 
                left: '60%',
                animation: 'radar-blip 2s ease-out infinite',
                animationDelay: '0.3s'
              }} 
            />
            <div 
              className="absolute w-1.5 h-1.5 rounded-full bg-neon-cyan/80 shadow-glow-sm"
              style={{ 
                top: '45%', 
                left: '75%',
                animation: 'radar-blip 2s ease-out infinite',
                animationDelay: '0.8s'
              }} 
            />
            <div 
              className="absolute w-2.5 h-2.5 rounded-full bg-neon-cyan shadow-glow-sm"
              style={{ 
                top: '65%', 
                left: '35%',
                animation: 'radar-blip 2s ease-out infinite',
                animationDelay: '1.2s'
              }} 
            />
          </>
        )}

        {/* Paused state - Enhanced pulsing WiFi indicator */}
        {isPaused && (
          <>
            <div 
              className="absolute inset-4 rounded-full border-4 border-dashed border-amber-400/50"
              style={{ animation: 'spin 8s linear infinite' }}
            />
            {/* Pulsing WiFi waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[1, 2, 3].map((ring) => (
                <div
                  key={ring}
                  className="absolute rounded-full border-2 border-amber-400/30"
                  style={{
                    width: `${30 + ring * 15}%`,
                    height: `${30 + ring * 15}%`,
                    animation: `wifi-pulse 2s ease-in-out infinite`,
                    animationDelay: `${ring * 0.2}s`
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Center glow */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          isActive && !isPaused && 'animate-pulse'
        )}>
          <div className={cn(
            'w-4 h-4 rounded-full',
            isActive && !isPaused 
              ? 'bg-neon-cyan shadow-glow' 
              : isPaused 
                ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-primary/50'
          )} />
        </div>
      </div>

      {/* Signal strength arc */}
      {isActive && !isPaused && (
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="hsl(var(--neon-cyan) / 0.2)"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="hsl(var(--neon-cyan))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${signalStrength * 3.01} 301`}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 4px hsl(var(--neon-cyan)))'
            }}
          />
        </svg>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes wifi-pulse {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.6;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};
