import coverageImage from "@/assets/global-coverage.jpg";

export const CoverageSection = () => {
  return (
    <section id="coverage" className="py-20 bg-gradient-hero">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">Global Coverage</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Stay connected in over 200 countries and territories worldwide.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src={coverageImage} 
              alt="Global eSIM Coverage Map" 
              className="w-full h-auto"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12 text-center">
          <div>
            <div className="text-4xl font-bold text-accent mb-2">200+</div>
            <div className="text-white/80">Countries Covered</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">99.9%</div>
            <div className="text-white/80">Network Uptime</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">5G</div>
            <div className="text-white/80">Speed Available</div>
          </div>
        </div>
      </div>
    </section>
  );
};