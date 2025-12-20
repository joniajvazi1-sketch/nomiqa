import { useState, useEffect } from "react";
import { MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GlobalNetworkMap = () => {
  const [nodeCount, setNodeCount] = useState(1247);
  
  // Simulate growing network
  useEffect(() => {
    const interval = setInterval(() => {
      setNodeCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sample node positions for the map
  const nodes = [
    { x: 25, y: 35, size: 'lg', pulse: true },
    { x: 28, y: 45, size: 'md', pulse: false },
    { x: 22, y: 55, size: 'sm', pulse: true },
    { x: 35, y: 70, size: 'md', pulse: false },
    { x: 38, y: 80, size: 'sm', pulse: true },
    { x: 48, y: 30, size: 'lg', pulse: true },
    { x: 50, y: 35, size: 'md', pulse: false },
    { x: 52, y: 38, size: 'sm', pulse: true },
    { x: 45, y: 42, size: 'md', pulse: false },
    { x: 55, y: 50, size: 'lg', pulse: true },
    { x: 58, y: 60, size: 'sm', pulse: false },
    { x: 65, y: 35, size: 'lg', pulse: true },
    { x: 70, y: 40, size: 'md', pulse: false },
    { x: 75, y: 45, size: 'lg', pulse: true },
    { x: 80, y: 35, size: 'md', pulse: true },
    { x: 82, y: 42, size: 'sm', pulse: false },
    { x: 85, y: 70, size: 'md', pulse: true },
    { x: 88, y: 75, size: 'sm', pulse: false },
  ];

  const scrollToRegistration = () => {
    const heroSection = document.querySelector('#hero-registration');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,200,0.05),transparent_60%)]" />
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-14 animate-fade-in">
          <span className="inline-block px-5 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl text-neon-cyan text-sm font-medium mb-6 border border-white/10 shadow-lg shadow-neon-cyan/5">
            Global Coverage
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light font-display mb-6">
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-semibold">
              Building Coverage Together
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Join thousands of pioneers already expanding the network. Every node strengthens our global mesh.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex justify-center gap-6 mb-14 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-xl bg-white/[0.03] border border-white/10 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-neon-cyan/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-neon-cyan" />
            </div>
            <span className="text-foreground font-semibold text-lg">{nodeCount.toLocaleString()}</span>
            <span className="text-muted-foreground font-light">nodes active</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-xl bg-white/[0.03] border border-white/10 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-nomiqa-teal/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-nomiqa-teal" />
            </div>
            <span className="text-foreground font-semibold text-lg">47</span>
            <span className="text-muted-foreground font-light">countries</span>
          </div>
        </div>

        {/* World map container */}
        <div className="relative max-w-5xl mx-auto aspect-[2/1] rounded-3xl overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/10 shadow-2xl shadow-black/20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Inner glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,200,0.03),transparent_70%)]" />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,200,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,200,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          {/* Simplified world map outline */}
          <svg 
            viewBox="0 0 100 50" 
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Continents as simplified paths */}
            <g className="fill-white/5 stroke-white/10" strokeWidth="0.15">
              {/* North America */}
              <path d="M15,15 Q20,12 28,14 L30,20 Q32,25 28,30 L25,35 Q22,38 20,35 L18,30 Q15,25 15,20 Z" />
              {/* South America */}
              <path d="M28,40 Q32,38 35,42 L38,50 Q40,58 38,65 L35,70 Q32,72 30,68 L28,60 Q26,50 28,40 Z" />
              {/* Europe */}
              <path d="M45,18 Q50,15 55,18 L58,22 Q60,26 55,30 L50,32 Q45,30 44,25 Z" />
              {/* Africa */}
              <path d="M48,35 Q55,32 58,38 L60,50 Q58,60 55,65 L50,62 Q46,55 48,45 Z" />
              {/* Asia */}
              <path d="M60,15 Q70,12 82,15 L85,25 Q88,35 82,42 L75,45 Q68,42 65,35 L62,25 Q60,20 60,15 Z" />
              {/* Oceania */}
              <path d="M80,55 Q85,52 90,55 L92,62 Q90,68 85,70 L80,65 Q78,60 80,55 Z" />
            </g>
          </svg>

          {/* Glowing nodes */}
          {nodes.map((node, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div 
                className={`
                  rounded-full bg-gradient-to-br from-neon-cyan to-nomiqa-teal shadow-lg
                  ${node.size === 'lg' ? 'w-3 h-3 shadow-neon-cyan/50' : node.size === 'md' ? 'w-2 h-2 shadow-neon-cyan/40' : 'w-1.5 h-1.5 shadow-neon-cyan/30'}
                  ${node.pulse ? 'animate-pulse' : ''}
                `}
              >
                {node.pulse && node.size === 'lg' && (
                  <div className="absolute inset-0 rounded-full bg-neon-cyan animate-ping opacity-30" />
                )}
              </div>
              {/* Glow effect for large nodes */}
              {node.size === 'lg' && (
                <div className="absolute inset-0 w-10 h-10 -translate-x-1/2 -translate-y-1/2 bg-neon-cyan/10 rounded-full blur-lg" 
                  style={{ left: '50%', top: '50%' }}
                />
              )}
            </div>
          ))}

          {/* Connection lines between nearby nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,255,200,0.2)" />
                <stop offset="50%" stopColor="rgba(0,255,200,0.1)" />
                <stop offset="100%" stopColor="rgba(0,255,200,0.2)" />
              </linearGradient>
            </defs>
            {nodes.slice(0, -1).map((node, i) => {
              const nextNode = nodes[i + 1];
              if (Math.abs(node.x - nextNode.x) < 15 && Math.abs(node.y - nextNode.y) < 20) {
                return (
                  <line
                    key={i}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${nextNode.x}%`}
                    y2={`${nextNode.y}%`}
                    stroke="url(#connectionGradient)"
                    strokeWidth="0.5"
                  />
                );
              }
              return null;
            })}
          </svg>

          {/* Edge vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30 pointer-events-none" />
        </div>

        {/* CTA */}
        <div className="text-center mt-14 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button 
            onClick={scrollToRegistration}
            size="lg"
            className="h-auto py-4 px-10 text-lg font-light bg-gradient-to-r from-neon-cyan to-nomiqa-teal hover:from-neon-cyan/90 hover:to-nomiqa-teal/90 text-background rounded-2xl shadow-xl shadow-neon-cyan/20 transition-all duration-300 hover:shadow-neon-cyan/40 hover:-translate-y-0.5 border border-white/20"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Add Your City to the Network
          </Button>
          <p className="text-muted-foreground text-sm mt-5 font-light">
            Be among the first in your area. <span className="text-neon-cyan">Early supporters get bonus rewards.</span>
          </p>
        </div>
      </div>
    </section>
  );
};
