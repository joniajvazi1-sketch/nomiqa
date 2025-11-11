import MiniGlobe from './MiniGlobe';
import globeSunsetBg from '@/assets/globe-sunset-background.png';
import { useIsMobile } from '@/hooks/use-mobile';

export const CoverageSection = () => {
  const isMobile = useIsMobile();
  
  return (
    <section id="coverage" className="py-12 md:py-20 relative overflow-hidden">
      {/* Background image with much lighter overlay */}
      <div className="absolute inset-0">
        <img 
          src={globeSunsetBg} 
          alt="Global network coverage" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/10 via-midnight-blue/10 to-deep-space/10"></div>
      </div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-neon bg-clip-text text-transparent">
            Global Coverage
          </h2>
          <p className="text-base md:text-xl text-white/95 max-w-2xl mx-auto px-4">
            Stay connected in over 190+ countries and territories worldwide.
          </p>
        </div>
        
        {/* Mini globes positioned over the phones in the background */}
        <div className="relative h-[300px] md:h-[400px] max-w-6xl mx-auto">
          {isMobile ? (
            // Single small globe for mobile - positioned over phone
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32">
              <MiniGlobe />
            </div>
          ) : (
            // Three small globes for desktop - positioned over phones
            <>
              <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-40 h-40">
                <MiniGlobe />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40">
                <MiniGlobe />
              </div>
              <div className="absolute right-[15%] top-1/2 -translate-y-1/2 w-40 h-40">
                <MiniGlobe />
              </div>
            </>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto mt-8 md:mt-12 text-center">
          <div>
            <div className="text-2xl md:text-4xl font-bold text-neon-cyan mb-1 md:mb-2">190+</div>
            <div className="text-foreground/80 text-xs md:text-base">Countries Covered</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-bold text-neon-violet mb-1 md:mb-2">99.9%</div>
            <div className="text-foreground/80 text-xs md:text-base">Network Uptime</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-bold text-neon-pink mb-1 md:mb-2">5G</div>
            <div className="text-foreground/80 text-xs md:text-base">Speed Available</div>
          </div>
        </div>
      </div>
    </section>
  );
};