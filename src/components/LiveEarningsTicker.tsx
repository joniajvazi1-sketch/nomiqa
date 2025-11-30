import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp } from 'lucide-react';

interface Conversion {
  id: string;
  commission_amount_usd: number;
  converted_at: string;
  commission_level: number;
}

export const LiveEarningsTicker = () => {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch recent conversions (public data, anonymized)
    const fetchRecentConversions = async () => {
      try {
        const { data, error } = await supabase
          .from('affiliate_referrals')
          .select('id, commission_amount_usd, converted_at, commission_level')
          .eq('status', 'converted')
          .not('commission_amount_usd', 'is', null)
          .order('converted_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching conversions:', error);
          return;
        }

        if (data) {
          setConversions(data);
        }
      } catch (error) {
        console.error('Error in fetchRecentConversions:', error);
      }
    };

    fetchRecentConversions();

    // Subscribe to real-time updates for new conversions
    const channel = supabase
      .channel('conversions-ticker')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'affiliate_referrals',
          filter: 'status=eq.converted'
        },
        (payload) => {
          console.log('New conversion detected:', payload);
          const newConversion = payload.new as Conversion;
          
          if (newConversion.commission_amount_usd) {
            setConversions(prev => [newConversion, ...prev].slice(0, 20));
            
            // Flash effect when new conversion arrives
            setIsAnimating(false);
            setTimeout(() => setIsAnimating(true), 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'affiliate_referrals',
          filter: 'status=eq.converted'
        },
        (payload) => {
          console.log('Conversion updated:', payload);
          const updatedConversion = payload.new as Conversion;
          
          if (updatedConversion.commission_amount_usd) {
            setConversions(prev => {
              const exists = prev.some(c => c.id === updatedConversion.id);
              if (!exists) {
                return [updatedConversion, ...prev].slice(0, 20);
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 1:
        return { text: 'Direct', color: 'text-neon-cyan' };
      case 2:
        return { text: 'Tier 2', color: 'text-neon-violet' };
      case 3:
        return { text: 'Tier 3', color: 'text-neon-coral' };
      default:
        return { text: 'Level ' + level, color: 'text-white' };
    }
  };

  if (conversions.length === 0) {
    return null;
  }

  // Duplicate conversions for seamless loop
  const displayConversions = [...conversions, ...conversions];

  return (
    <div className="w-full bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border-y border-white/10 py-4 overflow-hidden relative">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none"></div>

      <div className="relative flex items-center gap-4 mb-2 px-4">
        <div className="flex items-center gap-2 text-neon-cyan">
          <TrendingUp className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-semibold uppercase tracking-wider">Live Earnings</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-neon-cyan/50 via-transparent to-transparent"></div>
      </div>

      <div 
        ref={tickerRef}
        className={`flex gap-8 ${isAnimating ? 'animate-scroll' : ''}`}
        style={{
          animationDuration: `${displayConversions.length * 3}s`
        }}
      >
        {displayConversions.map((conversion, index) => {
          const levelBadge = getLevelBadge(conversion.commission_level);
          
          return (
            <div
              key={`${conversion.id}-${index}`}
              className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-sm whitespace-nowrap shrink-0 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-neon-cyan" />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">
                  New conversion
                </span>
                <span className={`text-sm font-semibold ${levelBadge.color}`}>
                  {levelBadge.text}
                </span>
              </div>

              <div className="h-4 w-px bg-white/20"></div>

              <span className="text-lg font-bold bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
                ${conversion.commission_amount_usd.toFixed(2)}
              </span>

              <span className="text-xs text-white/40">
                {getTimeAgo(conversion.converted_at)}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
