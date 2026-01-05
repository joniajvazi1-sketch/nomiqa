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

        {/* Radar sweep beam - Enhanced with multiple sweeps and trailing glow */}
        {isActive && !isPaused && (
          <>
            {/* Primary sweep with enhanced glow trail */}
            <div 
              className="absolute inset-0 origin-center"
              style={{
                animation: 'radar-sweep 2s linear infinite'
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--neon-cyan) / 0.7) 10deg, hsl(var(--neon-cyan) / 0.5) 25deg, hsl(var(--neon-cyan) / 0.3) 45deg, hsl(var(--neon-cyan) / 0.1) 65deg, transparent 80deg)',
                  filter: 'blur(1px)'
                }}
              />
            </div>
            {/* Secondary sweep - offset for depth */}
            <div 
              className="absolute inset-0 origin-center"
              style={{
                animation: 'radar-sweep 2s linear infinite',
                animationDelay: '-0.2s'
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left opacity-50"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--neon-cyan) / 0.4) 15deg, hsl(var(--neon-cyan) / 0.2) 35deg, transparent 50deg)'
                }}
              />
            </div>
            {/* Tertiary sweep - faint trailing glow */}
            <div 
              className="absolute inset-0 origin-center"
              style={{
                animation: 'radar-sweep 2s linear infinite',
                animationDelay: '-0.5s'
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left opacity-25"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--neon-cyan) / 0.3) 10deg, transparent 25deg)'
                }}
              />
            </div>
            {/* Sweep leading edge glow line */}
            <div 
              className="absolute inset-0 origin-center"
              style={{
                animation: 'radar-sweep 2s linear infinite'
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-1/2 h-0.5 origin-left"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--neon-cyan)) 0%, transparent 100%)',
                  boxShadow: '0 0 8px hsl(var(--neon-cyan)), 0 0 16px hsl(var(--neon-cyan) / 0.5)'
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

        {/* Paused state - Enhanced pulsing WiFi indicator with connecting dots */}
        {isPaused && (
          <>
            {/* Rotating dashed border */}
            <div 
              className="absolute inset-4 rounded-full border-4 border-dashed border-amber-400/50"
              style={{ animation: 'spin 8s linear infinite' }}
            />
            {/* Pulsing WiFi waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[1, 2, 3].map((ring) => (
                <div
                  key={ring}
                  className="absolute rounded-full border-2 border-amber-400/40"
                  style={{
                    width: `${25 + ring * 18}%`,
                    height: `${25 + ring * 18}%`,
                    animation: `wifi-pulse 1.8s ease-in-out infinite`,
                    animationDelay: `${ring * 0.15}s`
                  }}
                />
              ))}
            </div>
            {/* Connecting dots animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((dot) => (
                  <div
                    key={dot}
                    className="w-2 h-2 rounded-full bg-amber-400"
                    style={{
                      animation: 'connecting-dots 1.4s ease-in-out infinite',
                      animationDelay: `${dot * 0.2}s`
                    }}
                  />
                ))}
              </div>
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
            opacity: 0.2;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        @keyframes connecting-dots {
          0%, 80%, 100% { 
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};
