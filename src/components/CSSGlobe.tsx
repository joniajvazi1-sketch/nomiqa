import React from 'react';

const CSSGlobe: React.FC = () => {
  return (
    <div className="relative w-full h-[200px] md:h-[280px] lg:h-[320px] flex items-center justify-center">
      {/* Globe container */}
      <div className="relative w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px]">
        {/* Outer glow */}
        <div className="absolute inset-[-20px] bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" />
        
        {/* Globe sphere */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-neon-cyan/30 overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.1) 50%, rgba(0, 0, 0, 0.3))',
            boxShadow: 'inset -20px -20px 40px rgba(0,0,0,0.3), inset 10px 10px 30px rgba(6, 182, 212, 0.2), 0 0 60px rgba(6, 182, 212, 0.3)'
          }}
        >
          {/* Rotating grid lines */}
          <div 
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '30s' }}
          >
            {/* Latitude lines */}
            {[20, 40, 60, 80].map((lat) => (
              <div
                key={`lat-${lat}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neon-cyan/20"
                style={{
                  width: `${100 - lat * 0.5}%`,
                  height: `${100 - lat * 0.5}%`,
                }}
              />
            ))}
            
            {/* Longitude lines */}
            {[0, 30, 60, 90, 120, 150].map((lon) => (
              <div
                key={`lon-${lon}`}
                className="absolute left-1/2 top-0 w-px h-full bg-gradient-to-b from-transparent via-neon-cyan/20 to-transparent origin-bottom"
                style={{ transform: `translateX(-50%) rotateZ(${lon}deg)` }}
              />
            ))}
          </div>
          
          {/* Connection dots */}
          <div 
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '25s', animationDirection: 'reverse' }}
          >
            {[
              { top: '20%', left: '30%' },
              { top: '35%', left: '70%' },
              { top: '60%', left: '25%' },
              { top: '55%', left: '65%' },
              { top: '75%', left: '45%' },
              { top: '40%', left: '45%' },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 md:w-2.5 md:h-2.5 bg-neon-cyan rounded-full animate-pulse"
                style={{
                  top: pos.top,
                  left: pos.left,
                  animationDelay: `${i * 0.3}s`,
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.4)'
                }}
              />
            ))}
          </div>
          
          {/* Connection lines (SVG arcs) */}
          <svg 
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: '25s', animationDirection: 'reverse' }}
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
                <stop offset="50%" stopColor="rgba(232, 121, 249, 0.6)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.4)" />
              </linearGradient>
            </defs>
            <path
              d="M 30 20 Q 50 5 70 35"
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth="0.5"
              className="animate-pulse"
            />
            <path
              d="M 25 60 Q 45 40 65 55"
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth="0.5"
              className="animate-pulse"
              style={{ animationDelay: '0.5s' }}
            />
            <path
              d="M 70 35 Q 55 50 45 75"
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth="0.5"
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </svg>
        </div>
        
        {/* Atmosphere ring */}
        <div 
          className="absolute inset-[-4px] rounded-full border border-neon-cyan/10"
          style={{
            background: 'radial-gradient(circle, transparent 60%, rgba(6, 182, 212, 0.05) 100%)'
          }}
        />
      </div>
      
      {/* Subtle overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10" />
    </div>
  );
};

export default CSSGlobe;
