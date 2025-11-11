import InteractiveGlobe from './InteractiveGlobe';
import coverageSunsetBg from '@/assets/coverage-sunset-bg.png';

export const CoverageSection = () => {
  return (
    <section id="coverage" className="py-12 md:py-20 relative overflow-hidden">
      {/* Background image with much lighter overlay */}
      <div className="absolute inset-0">
        <img 
          src={coverageSunsetBg} 
          alt="Global network coverage" 
          className="w-full h-full md:object-cover object-cover object-center scale-[1.8] md:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/5 via-midnight-blue/5 to-deep-space/5"></div>
      </div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-6 md:mb-8 mt-12 md:mt-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-neon bg-clip-text text-transparent">
            Global Coverage
          </h2>
          <p className="text-base md:text-xl text-white/95 max-w-2xl mx-auto px-4">
            Stay connected in over 190+ countries and territories worldwide.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto mb-8 md:mb-12">
          <InteractiveGlobe />
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