import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LeaderboardSection } from '@/components/app/LeaderboardSection';
import { useHaptics } from '@/hooks/useHaptics';

export const AppLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap } = useHaptics();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { lightTap(); navigate(-1); }}
            className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Leaderboard</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        <LeaderboardSection compact={false} />
      </div>
    </div>
  );
};
