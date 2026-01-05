import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProductCardProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loading cards for the shop page
 * Matches the exact layout of real product cards
 */
export const SkeletonProductCard: React.FC<SkeletonProductCardProps> = ({
  count = 6,
  className
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'relative rounded-2xl overflow-hidden',
            className
          )}
          style={{
            animation: `skeleton-fade 0.4s ease-out ${index * 60}ms backwards`
          }}
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl" />
          
          {/* Content */}
          <div className="relative p-3 border border-white/[0.08] rounded-2xl">
            {/* Flag skeleton */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.08] skeleton-shimmer" />
            </div>
            
            {/* Country name skeleton */}
            <div className="h-4 bg-white/[0.08] rounded-lg mx-auto mb-2 w-3/4 skeleton-shimmer" />
            
            {/* Data & Validity skeleton */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-3 w-12 bg-white/[0.05] rounded skeleton-shimmer" />
              <div className="w-1 h-1 rounded-full bg-white/[0.1]" />
              <div className="h-3 w-8 bg-white/[0.05] rounded skeleton-shimmer" />
            </div>
            
            {/* Price & Button skeleton */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-6 w-16 bg-white/[0.08] rounded-lg skeleton-shimmer" />
              <div className="w-9 h-9 rounded-xl bg-white/[0.08] skeleton-shimmer" />
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes skeleton-fade {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
        }
        
        .skeleton-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.08) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer-move 1.5s ease-in-out infinite;
        }
        
        @keyframes skeleton-shimmer-move {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
};
