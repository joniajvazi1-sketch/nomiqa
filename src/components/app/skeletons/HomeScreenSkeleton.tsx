import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Premium skeleton loading state for AppHome screen
 * Matches the exact layout with shimmer effects
 */
export const HomeScreenSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
            filter: 'blur(100px)'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-5">
        {/* Header skeleton */}
        <header className="flex items-center justify-between animate-fade-in">
          {/* Status Pill */}
          <Skeleton className="h-8 w-32 rounded-full bg-white/[0.05]" />
          
          {/* Icon buttons */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full bg-white/[0.05]" />
            <Skeleton className="w-10 h-10 rounded-full bg-white/[0.05]" />
            <Skeleton className="w-10 h-10 rounded-full bg-white/[0.05]" />
          </div>
        </header>

        {/* Hero Card Skeleton */}
        <div 
          className="relative rounded-[24px] overflow-hidden animate-fade-in"
          style={{ animationDelay: '50ms' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-primary/5 to-transparent" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          {/* Shimmer overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s ease-in-out infinite'
            }}
          />
          
          <div className="relative p-6 border border-neon-cyan/10 rounded-[24px]">
            {/* Label */}
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="w-4 h-4 rounded bg-neon-cyan/20" />
              <Skeleton className="h-4 w-28 bg-white/[0.05]" />
            </div>
            
            {/* Big number */}
            <Skeleton className="h-14 w-36 mb-2 bg-white/[0.08]" />

            {/* Sublines */}
            <div className="flex items-center flex-wrap gap-3 mb-5">
              <Skeleton className="h-7 w-20 rounded-full bg-white/[0.05]" />
              <Skeleton className="h-7 w-24 rounded-full bg-white/[0.05]" />
              <Skeleton className="h-7 w-28 rounded-full bg-white/[0.05]" />
            </div>

            {/* CTA Button */}
            <Skeleton className="w-full h-14 rounded-2xl bg-gradient-to-r from-neon-cyan/20 to-sky-400/20" />
          </div>
        </div>

        {/* Two Mini Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div 
              key={i}
              className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 animate-fade-in"
              style={{ animationDelay: `${100 + i * 50}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-8 h-8 rounded-xl bg-white/[0.08]" />
                <Skeleton className="h-3 w-16 bg-white/[0.05]" />
              </div>
              <Skeleton className="h-6 w-20 mb-1 bg-white/[0.08]" />
              <Skeleton className="h-3 w-24 bg-white/[0.05]" />
            </div>
          ))}
        </div>

        {/* Map preview skeleton */}
        <div 
          className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl bg-white/[0.08]" />
              <Skeleton className="h-4 w-32 bg-white/[0.05]" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full bg-white/[0.05]" />
          </div>
          <Skeleton className="w-full h-[160px] rounded-xl bg-white/[0.05]" />
        </div>

        {/* Challenges skeleton */}
        <div 
          className="space-y-3 animate-fade-in"
          style={{ animationDelay: '250ms' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded bg-primary/20" />
              <Skeleton className="h-4 w-24 bg-white/[0.05]" />
            </div>
            <Skeleton className="h-4 w-12 bg-white/[0.05]" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <Skeleton 
                key={i} 
                className="flex-shrink-0 w-[200px] h-[100px] rounded-xl bg-white/[0.03]"
              />
            ))}
          </div>
        </div>

        {/* Leaderboard skeleton */}
        <div 
          className="space-y-3 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded bg-amber-400/20" />
              <Skeleton className="h-4 w-20 bg-white/[0.05]" />
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded bg-white/[0.08]" />
                <Skeleton className="w-8 h-8 rounded-full bg-white/[0.08]" />
                <Skeleton className="flex-1 h-4 bg-white/[0.05]" />
                <Skeleton className="w-12 h-4 bg-white/[0.08]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
