import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Premium skeleton loading state for AppWallet screen
 * Matches the balance card, quick actions, and transaction list layout
 */
export const WalletScreenSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between animate-fade-in">
          <div className="space-y-1">
            <Skeleton className="h-7 w-24 bg-white/[0.08]" />
            <Skeleton className="h-4 w-36 bg-white/[0.05]" />
          </div>
          <Skeleton className="w-11 h-11 rounded-full bg-white/[0.05]" />
        </header>

        {/* Balance Card Skeleton */}
        <div 
          className="relative rounded-[28px] overflow-hidden animate-fade-in"
          style={{ animationDelay: '50ms' }}
        >
          {/* Animated gradient border */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-neon-cyan/30 to-primary/30 rounded-[29px] opacity-50" />
          
          <div className="relative bg-background/95 backdrop-blur-xl m-[1px] rounded-[27px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-neon-cyan/5" />
            
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite'
              }}
            />
            
            <div className="relative p-6">
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-2xl bg-primary/20" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24 bg-white/[0.08]" />
                    <Skeleton className="h-3 w-12 bg-white/[0.05]" />
                  </div>
                </div>
                <Skeleton className="w-5 h-5 rounded bg-white/[0.05]" />
              </div>
              
              {/* Balance display */}
              <Skeleton className="h-12 w-40 mb-2 bg-white/[0.08]" />
              
              {/* USD estimate */}
              <Skeleton className="h-4 w-28 bg-white/[0.05]" />
            </div>
          </div>
        </div>

        {/* Streak Bonus Skeleton */}
        <div 
          className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl bg-orange-500/20" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24 bg-white/[0.08]" />
              <Skeleton className="h-3 w-40 bg-white/[0.05]" />
            </div>
            <Skeleton className="w-12 h-6 rounded-lg bg-orange-500/20" />
          </div>
        </div>

        {/* Quick Actions */}
        <div 
          className="grid grid-cols-4 gap-3 animate-fade-in"
          style={{ animationDelay: '150ms' }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
            >
              <Skeleton className="w-11 h-11 rounded-xl bg-white/[0.08]" />
              <Skeleton className="h-3 w-10 bg-white/[0.05]" />
            </div>
          ))}
        </div>

        {/* Transaction Filters */}
        <div 
          className="flex gap-2 animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton 
              key={i} 
              className={`h-8 rounded-full ${i === 0 ? 'w-14 bg-primary/20' : 'w-16 bg-white/[0.05]'}`} 
            />
          ))}
        </div>

        {/* Transaction List */}
        <div 
          className="space-y-3 animate-fade-in"
          style={{ animationDelay: '250ms' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-4 h-4 rounded bg-primary/20" />
            <Skeleton className="h-4 w-24 bg-white/[0.08]" />
          </div>
          
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <Skeleton className="w-10 h-10 rounded-xl bg-white/[0.08]" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32 bg-white/[0.08]" />
                <Skeleton className="h-3 w-20 bg-white/[0.05]" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16 ml-auto bg-white/[0.08]" />
                <Skeleton className="h-3 w-12 ml-auto bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
