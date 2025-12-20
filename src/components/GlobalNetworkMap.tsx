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
    { x: 25, y: 35, size: 'lg', pulse: true }, // North America
    { x: 28, y: 45, size: 'md', pulse: false },
    { x: 22, y: 55, size: 'sm', pulse: true },
    { x: 35, y: 70, size: 'md', pulse: false }, // South America
    { x: 38, y: 80, size: 'sm', pulse: true },
    { x: 48, y: 30, size: 'lg', pulse: true }, // Europe
    { x: 50, y: 35, size: 'md', pulse: false },
    { x: 52, y: 38, size: 'sm', pulse: true },
    { x: 45, y: 42, size: 'md', pulse: false },
    { x: 55, y: 50, size: 'lg', pulse: true }, // Africa
    { x: 58, y: 60, size: 'sm', pulse: false },
    { x: 65, y: 35, size: 'lg', pulse: true }, // Asia
    { x: 70, y: 40, size: 'md', pulse: false },
    { x: 75, y: 45, size: 'lg', pulse: true },
    { x: 80, y: 35, size: 'md', pulse: true }, // East Asia
    { x: 82, y: 42, size: 'sm', pulse: false },
    { x: 85, y: 70, size: 'md', pulse: true }, // Oceania
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
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 via-background to-background" />
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-neon-cyan/10 text-neon-cyan text-sm font-medium mb-4 border border-neon-cyan/20">
            Global Coverage
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Building Coverage Together
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of pioneers already expanding the network. Every node strengthens our global mesh.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex justify-center gap-8 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20">
            <Users className="w-5 h-5 text-neon-cyan" />
            <span className="text-foreground font-semibold">{nodeCount.toLocaleString()}</span>
            <span className="text-muted-foreground">nodes active</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-nomiqa-teal/10 border border-nomiqa-teal/20">
            <MapPin className="w-5 h-5 text-nomiqa-teal" />
            <span className="text-foreground font-semibold">47</span>
            <span className="text-muted-foreground">countries</span>
          </div>
        </div>

        {/* World map container */}
        <div className="relative max-w-5xl mx-auto aspect-[2/1] rounded-2xl overflow-hidden border border-border/50 bg-card/30 backdrop-blur-sm">
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,200,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          {/* Simplified world map outline */}
          <svg 
            viewBox="0 0 100 50" 
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Continents as simplified paths */}
            <g className="fill-muted/20 stroke-muted/30" strokeWidth="0.2">
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
                  rounded-full bg-neon-cyan shadow-lg shadow-neon-cyan/50
                  ${node.size === 'lg' ? 'w-3 h-3' : node.size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5'}
                  ${node.pulse ? 'animate-pulse' : ''}
                `}
              >
                {node.pulse && (
                  <div className="absolute inset-0 rounded-full bg-neon-cyan animate-ping opacity-40" />
                )}
              </div>
              {/* Glow effect */}
              {node.size === 'lg' && (
                <div className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-neon-cyan/20 rounded-full blur-md" 
                  style={{ left: '50%', top: '50%' }}
                />
              )}
            </div>
          ))}

          {/* Connection lines between nearby nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
                    stroke="rgba(0,255,200,0.15)"
                    strokeWidth="0.5"
                  />
                );
              }
              return null;
            })}
          </svg>

          {/* Radial gradient overlay for depth */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-background/80 pointer-events-none" />
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button 
            onClick={scrollToRegistration}
            size="lg"
            className="bg-gradient-to-r from-neon-cyan to-nomiqa-teal hover:from-neon-cyan/90 hover:to-nomiqa-teal/90 text-background font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-neon-cyan/20 transition-all duration-300 hover:shadow-neon-cyan/40 hover:-translate-y-0.5"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Add Your City to the Network
          </Button>
          <p className="text-muted-foreground text-sm mt-4">
            Be among the first in your area. Early supporters get bonus rewards.
          </p>
        </div>
      </div>
    </section>
  );
};
