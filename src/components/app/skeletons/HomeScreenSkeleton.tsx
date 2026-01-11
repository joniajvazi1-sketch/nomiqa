import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Clean skeleton loading state for AppHome screen
 * Minimal animations to prevent glitchy feel on slow devices
 */
export const HomeScreenSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="px-4 py-4 pb-24 space-y-3">
        {/* Header skeleton */}
        <header className="flex items-center justify-between">
          <Skeleton className="h-7 w-28 rounded-full" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </header>

        {/* Hero Card Skeleton */}
        <div className="rounded-2xl border border-white/[0.08] p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Skeleton className="w-3.5 h-3.5 rounded" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-10 w-28 mb-2" />
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="w-full h-11 rounded-xl" />
        </div>

        {/* Two Mini Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div 
              key={i}
              className="rounded-xl border border-white/[0.08] p-3"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Skeleton className="w-6 h-6 rounded-lg" />
                <Skeleton className="h-2.5 w-12" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>

        {/* Map preview skeleton */}
        <div className="rounded-xl border border-white/[0.08] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="w-full h-20 rounded-xl" />
        </div>

        {/* Challenges skeleton */}
        <div className="rounded-xl border border-white/[0.08] p-3">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>

        {/* Leaderboard skeleton */}
        <div className="rounded-xl border border-white/[0.08] p-3">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="flex-1 h-3" />
                <Skeleton className="w-10 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
