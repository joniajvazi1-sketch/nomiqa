import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Premium skeleton loading state for AppProfile screen
 * Matches the user info, stats, tabs, and content layout
 */
export const ProfileScreenSkeleton: React.FC = () => {
  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* User Hero Card Skeleton */}
      <div 
        className="relative rounded-[24px] overflow-hidden animate-fade-in"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-neon-cyan/5" />
        <div className="absolute inset-0 backdrop-blur-xl" />
        
        {/* Shimmer overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s ease-in-out infinite'
          }}
        />
        
        <div className="relative p-5 border border-white/[0.08] rounded-[24px]">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <Skeleton className="w-20 h-20 rounded-2xl bg-primary/20" />
            
            <div className="flex-1 space-y-2 pt-1">
              {/* Username */}
              <Skeleton className="h-6 w-32 bg-white/[0.08]" />
              {/* Email */}
              <Skeleton className="h-4 w-40 bg-white/[0.05]" />
              {/* Tier badge */}
              <Skeleton className="h-6 w-20 rounded-full bg-primary/20" />
            </div>
            
            {/* Logout button */}
            <Skeleton className="w-10 h-10 rounded-full bg-white/[0.05]" />
          </div>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="bg-white/[0.03] rounded-xl p-3 text-center"
              >
                <Skeleton className="h-6 w-16 mx-auto mb-1 bg-white/[0.08]" />
                <Skeleton className="h-3 w-12 mx-auto bg-white/[0.05]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Chart Skeleton */}
      <div 
        className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 animate-fade-in"
        style={{ animationDelay: '50ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24 bg-white/[0.08]" />
          <Skeleton className="h-4 w-16 bg-white/[0.05]" />
        </div>
        <Skeleton className="w-full h-[120px] rounded-xl bg-white/[0.05]" />
      </div>

      {/* Tabs Skeleton */}
      <div 
        className="animate-fade-in"
        style={{ animationDelay: '100ms' }}
      >
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton 
              key={i} 
              className={`flex-1 h-9 rounded-lg ${i === 0 ? 'bg-white/[0.1]' : 'bg-transparent'}`} 
            />
          ))}
        </div>
        
        {/* Tab content skeleton */}
        <div className="space-y-4">
          {/* Profile fields */}
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-4"
            >
              <Skeleton className="h-4 w-20 mb-2 bg-white/[0.05]" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40 bg-white/[0.08]" />
                <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate Section Skeleton */}
      <div 
        className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 animate-fade-in"
        style={{ animationDelay: '150ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg bg-primary/20" />
            <Skeleton className="h-4 w-28 bg-white/[0.08]" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-white/[0.05]" />
        </div>
        
        {/* Share link */}
        <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl p-3">
          <Skeleton className="flex-1 h-5 bg-white/[0.08]" />
          <Skeleton className="w-10 h-10 rounded-lg bg-white/[0.05]" />
          <Skeleton className="w-10 h-10 rounded-lg bg-white/[0.05]" />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-6 w-12 mx-auto mb-1 bg-white/[0.08]" />
              <Skeleton className="h-3 w-16 mx-auto bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
