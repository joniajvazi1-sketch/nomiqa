interface AnimatedHeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const AnimatedHeroImage = ({ src, alt, className }: AnimatedHeroImageProps) => {
  return (
    <div className={`relative ${className}`}>
      <img 
        src={src} 
        alt={alt}
        className="w-full h-full object-cover rounded-3xl shadow-xl"
      />
      
      {/* Floating emoji decorations */}
      <div className="absolute -top-4 -right-4 text-4xl animate-bounce-slow">
        🎉
      </div>
      <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce-slow" style={{ animationDelay: "0.5s" }}>
        ✨
      </div>
      <div className="absolute top-1/2 -left-8 text-3xl animate-pulse">
        🌍
      </div>
      <div className="absolute top-1/4 -right-8 text-3xl animate-pulse" style={{ animationDelay: "0.8s" }}>
        📱
      </div>
    </div>
  );
};
